import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { ZodError } from 'zod';
import { IrrigationControl, ControlError } from '../shared/control.ts';
import { runExperiment } from '../experiments/run.ts';

interface Options {
  deviceToken: string;
  persist: () => Promise<void>;
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

function send(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}

/** Loopback-only development adapter. It is deliberately not a production authentication server. */
export function createApi(control: IrrigationControl, options: Options) {
  // Serialize reads and writes, including persistence, so concurrent commands cannot interleave.
  let queue = Promise.resolve();
  let lease: { holder: string; expiresAt: number } | null = null;
  return createServer((request, response) => {
    const operation = async () => {
      const before = control.exportState();
      try {
        const origin = request.headers.origin;
        if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):(5173|4173)$/.test(origin)) {
          throw new ControlError(403, 'Origem não autorizada para a demonstração local.');
        }
        const host = request.headers.host ?? '';
        if (!/^(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(host))
          throw new ControlError(403, 'Servidor disponível somente em loopback.');
        const path = new URL(request.url ?? '/', 'http://localhost').pathname;
        if (path.startsWith('/device/')) {
          const supplied = Buffer.from((request.headers.authorization ?? '').replace(/^Bearer /, ''));
          const expected = Buffer.from(options.deviceToken);
          if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
            throw new ControlError(401, 'Dispositivo não autenticado.');
          const holder = request.headers['x-runner-id'];
          if (typeof holder !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(holder))
            throw new ControlError(401, 'Identifique o processo do simulador.');
          if (lease && lease.holder !== holder && lease.expiresAt > Date.now())
            throw new ControlError(423, 'Outro simulador controla esta sessão.');
          lease = { holder, expiresAt: Date.now() + 6000 };
        }
        let result: unknown;
        let status = 200;
        if (request.method === 'GET' && path === '/api/v1/state') result = control.snapshot();
        else if (request.method === 'GET' && path === '/api/v1/report')
          result = {
            ...control.snapshot(),
            exportedAt: Date.now(),
            reportVersion: '1.0',
            limitation:
              'Dados simulados. Esta execução não comprova desempenho de hardware ou economia de água.',
          };
        else if (request.method === 'POST' && path === '/api/v1/experiments')
          result = runExperiment(await jsonBody(request));
        else if (request.method === 'GET' && path.startsWith('/device/v1/commands/'))
          result = control.pending(decodeURIComponent(path.split('/').at(-1)!));
        else if (request.method === 'POST' && path === '/device/v1/telemetry')
          result = control.telemetry(await jsonBody(request));
        else if (request.method === 'POST' && path === '/device/v1/ack')
          result = control.acknowledge(await jsonBody(request));
        else {
          const match = path.match(/^\/api\/v1\/zones\/([^/]+)\/(commands|rule)$/);
          if (match && request.method === 'POST' && match[2] === 'commands') {
            result = control.command(decodeURIComponent(match[1]), await jsonBody(request));
            status = 202;
          } else if (match && request.method === 'PUT' && match[2] === 'rule')
            result = control.configure(decodeURIComponent(match[1]), await jsonBody(request));
          else throw new ControlError(404, 'Operação não encontrada.');
        }
        if (JSON.stringify(before) !== JSON.stringify(control.exportState())) await options.persist();
        send(response, status, result);
      } catch (error) {
        control.restore(before);
        if (error instanceof ZodError)
          send(response, 422, { error: error.issues.map((issue) => issue.message).join(' ') });
        else if (error instanceof ControlError) send(response, error.status, { error: error.message });
        else {
          console.error('Falha na API local:', error instanceof Error ? error.message : 'erro interno');
          send(response, 500, { error: 'Não foi possível persistir a operação. Verifique o serviço local.' });
        }
      }
    };
    queue = queue.then(operation, operation);
  });
}
