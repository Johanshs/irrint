import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { ZodError } from 'zod';
import { IrrigationControl, ControlError } from '../shared/control.ts';
import { runExperiment } from '../experiments/run.ts';
import { openApiDocument } from './openapi.ts';
import type { SessionAuth } from './auth.ts';
import { isAllowedOrigin, isAllowedRequestHost, type NetworkAccess } from './network.ts';

interface Options {
  deviceToken: string;
  persist: () => Promise<void>;
  sessionAuth: SessionAuth;
  networkAccess?: NetworkAccess;
  now?: () => number;
}

async function jsonBody(request: IncomingMessage) {
  if (!request.headers['content-type']?.startsWith('application/json'))
    throw new ControlError(415, 'Envie application/json.');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 65_536) throw new ControlError(413, 'Solicitação muito grande.');
    chunks.push(Buffer.from(chunk));
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ControlError(400, 'JSON inválido.');
  }
}

function send(
  response: ServerResponse,
  status: number,
  value: unknown,
  headers: Record<string, string> = {},
) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(JSON.stringify(value));
}

/** Local development adapter with explicit LAN opt-in. It is not a production authentication server. */
export function createApi(control: IrrigationControl, options: Options) {
  // Serialize reads and writes, including persistence, so concurrent commands cannot interleave.
  let queue = Promise.resolve();
  let lease: { holder: string; expiresAt: number } | null = null;
  const now = options.now ?? Date.now;
  return createServer((request, response) => {
    const operation = async () => {
      const before = control.exportState();
      const access = options.networkAccess ?? 'loopback';
      let responseHeaders: Record<string, string> = {};
      try {
        const origin = request.headers.origin;
        if (origin && !isAllowedOrigin(origin, access)) {
          throw new ControlError(403, 'Origem não autorizada para a demonstração local.');
        }
        if (origin) responseHeaders = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
        const host = request.headers.host ?? '';
        if (!isAllowedRequestHost(host, access))
          throw new ControlError(
            403,
            access === 'lan'
              ? 'Host fora da rede local autorizada.'
              : 'Servidor disponível somente em loopback.',
          );
        const path = new URL(request.url ?? '/', 'http://localhost').pathname;
        if (request.method === 'OPTIONS') {
          response.writeHead(204, {
            ...responseHeaders,
            'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Runner-Id',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Max-Age': '600',
          });
          response.end();
          return;
        }
        if (path.startsWith('/device/')) {
          const supplied = Buffer.from((request.headers.authorization ?? '').replace(/^Bearer /, ''));
          const expected = Buffer.from(options.deviceToken);
          if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
            throw new ControlError(401, 'Dispositivo não autenticado.');
          const holder = request.headers['x-runner-id'];
          if (typeof holder !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(holder))
            throw new ControlError(401, 'Identifique o processo do simulador.');
          if (lease && lease.holder !== holder && lease.expiresAt > now())
            throw new ControlError(423, 'Outro simulador controla esta sessão.');
          lease = { holder, expiresAt: now() + 6000 };
        }
        const publicOperatorPath = path === '/api/v1/session' || path === '/api/v1/openapi.json';
        const sessionToken = (request.headers.authorization ?? '').replace(/^Bearer /, '');
        const user =
          path.startsWith('/api/') && !publicOperatorPath ? options.sessionAuth.resolve(sessionToken) : null;
        if (path.startsWith('/api/') && !publicOperatorPath && !user)
          throw new ControlError(401, 'Sessão ausente ou expirada. Entre novamente.');
        let result: unknown;
        let status = 200;
        if (request.method === 'POST' && path === '/api/v1/session') {
          result = options.sessionAuth.login(await jsonBody(request));
          if (!result) throw new ControlError(401, 'E-mail ou senha inválidos.');
        } else if (request.method === 'GET' && path === '/api/v1/openapi.json') result = openApiDocument;
        else if (request.method === 'GET' && path === '/api/v1/state')
          result = control.snapshotForOwner(user!.id);
        else if (request.method === 'GET' && path === '/api/v1/report') {
          const snapshot = control.snapshotForOwner(user!.id);
          result = {
            ...snapshot,
            exportedAt: now(),
            reportVersion: '1.1',
            measurements: snapshot.zones.map((zone) => ({
              zoneId: zone.id,
              measurementStatus: zone.latest ? 'measured' : 'not-measured',
              moisturePercent: zone.latest?.moisture ?? null,
              totalLiters: zone.latest?.water?.totalLiters ?? null,
              measuredAt: zone.latest?.receivedAt ?? null,
            })),
            limitation:
              'Dados simulados. Esta execução não comprova desempenho de hardware ou economia de água.',
          };
        } else if (request.method === 'POST' && path === '/api/v1/experiments')
          result = runExperiment(await jsonBody(request));
        else if (request.method === 'POST' && path === '/api/v1/zones') {
          result = control.createZone(user!.id, await jsonBody(request));
          status = 201;
        } else if (request.method === 'GET' && path === '/device/v1/config')
          result = control.snapshot().zones.map(({ id, deviceId, latest }) => ({ id, deviceId, latest }));
        else if (request.method === 'GET' && path.startsWith('/device/v1/commands/'))
          result = control.pending(decodeURIComponent(path.split('/').at(-1)!));
        else if (request.method === 'POST' && path === '/device/v1/telemetry')
          result = control.telemetry(await jsonBody(request));
        else if (request.method === 'POST' && path === '/device/v1/ack')
          result = control.acknowledge(await jsonBody(request));
        else {
          const zonePath = path.match(/^\/api\/v1\/zones\/([^/]+)$/);
          const match = path.match(/^\/api\/v1\/zones\/([^/]+)\/(commands|rule)$/);
          if (zonePath && request.method === 'PUT')
            result = control.updateZone(decodeURIComponent(zonePath[1]), user!.id, await jsonBody(request));
          else if (match && request.method === 'POST' && match[2] === 'commands') {
            control.assertOwner(decodeURIComponent(match[1]), user!.id);
            result = control.command(decodeURIComponent(match[1]), await jsonBody(request));
            status = 202;
          } else if (match && request.method === 'PUT' && match[2] === 'rule') {
            control.assertOwner(decodeURIComponent(match[1]), user!.id);
            result = control.configure(decodeURIComponent(match[1]), await jsonBody(request));
          } else throw new ControlError(404, 'Operação não encontrada.');
        }
        if (JSON.stringify(before) !== JSON.stringify(control.exportState())) await options.persist();
        send(response, status, result, responseHeaders);
      } catch (error) {
        control.restore(before);
        if (error instanceof ZodError)
          send(
            response,
            422,
            { error: error.issues.map((issue) => issue.message).join(' ') },
            responseHeaders,
          );
        else if (error instanceof ControlError)
          send(response, error.status, { error: error.message }, responseHeaders);
        else {
          console.error('Falha na API local:', error instanceof Error ? error.message : 'erro interno');
          send(
            response,
            500,
            { error: 'Não foi possível persistir a operação. Verifique o serviço local.' },
            responseHeaders,
          );
        }
      }
    };
    queue = queue.then(operation, operation);
  });
}
