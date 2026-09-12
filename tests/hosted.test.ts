import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createApi } from '../server/api.ts';
import { SignedDemoSessionAuth } from '../server/auth.ts';
import { emptyState, IrrigationControl } from '../shared/control.ts';
import type { SessionInfo, Snapshot, SystemState } from '../shared/contracts.ts';

const servers: ReturnType<typeof createApi>[] = [];
afterEach(async () => {
  await Promise.all(
    servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
  );
});

function auth(clock: () => number) {
  return new SignedDemoSessionAuth({
    clock,
    durationMs: 30 * 60 * 1000,
    email: 'produtor@demo.local',
    password: 'irrigacao',
    secret: 'segredo-de-teste-com-mais-de-trinta-e-dois-bytes',
  });
}

describe('Demonstração pública isolada', () => {
  it('mantém um token assinado após reinício e rejeita adulteração ou expiração', () => {
    let now = 1_800_000_000_000;
    const first = auth(() => now);
    const session = first.login({ email: 'produtor@demo.local', password: 'irrigacao' })!;
    const restarted = auth(() => now);

    expect(restarted.resolve(session.token)).toEqual(session.user);
    expect(restarted.resolve(`${session.token}x`)).toBeNull();
    now = session.expiresAt;
    expect(restarted.resolve(session.token)).toBeNull();
  });

  it('cria duas áreas exclusivas por acesso e mantém comandos entre visitantes separados', async () => {
    let state: SystemState = emptyState(Date.now());
    const control = new IrrigationControl(state, Date.now, 'hosted-demo');
    const server = createApi(control, {
      allowedOrigins: ['https://irrigacao-int.vercel.app', 'https://localhost'],
      deviceToken: 'device-secret',
      networkAccess: 'public',
      persist: async () => {
        state = control.exportState();
      },
      sessionAuth: auth(Date.now),
      onSessionCreated: (session) => control.seedDemoOwner(session.user.id),
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const login = async () => {
      const response = await fetch(`${url}/api/v1/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://irrigacao-int.vercel.app' },
        body: JSON.stringify({ email: 'produtor@demo.local', password: 'irrigacao' }),
      });
      expect(response.status).toBe(200);
      return response.json() as Promise<SessionInfo>;
    };
    const read = async (token: string) => {
      const response = await fetch(`${url}/api/v1/state`, {
        headers: { Authorization: `Bearer ${token}`, Origin: 'https://irrigacao-int.vercel.app' },
      });
      expect(response.status).toBe(200);
      return response.json() as Promise<Snapshot>;
    };

    const first = await login();
    const second = await login();
    const firstState = await read(first.token);
    const secondState = await read(second.token);

    expect(first.user.id).not.toBe(second.user.id);
    expect(firstState).toMatchObject({ environment: 'hosted-demo' });
    expect(firstState.zones.map(({ name, crop }) => ({ name, crop }))).toEqual([
      { name: 'Horta norte', crop: 'Hortaliças' },
      { name: 'Canteiro sul', crop: 'Mudas' },
    ]);
    expect(secondState.zones).toHaveLength(2);
    expect(new Set([...firstState.zones, ...secondState.zones].map((zone) => zone.id)).size).toBe(4);

    const update = await fetch(`${url}/api/v1/zones/${firstState.zones[0].id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${first.token}`,
        'Content-Type': 'application/json',
        Origin: 'https://irrigacao-int.vercel.app',
      },
      body: JSON.stringify({ name: 'Área da primeira visita', crop: 'Alface' }),
    });
    expect(update.status).toBe(200);
    expect((await read(first.token)).zones[0].name).toBe('Área da primeira visita');
    expect((await read(second.token)).zones[0].name).toBe('Horta norte');
    expect(state.zones).toHaveLength(4);

    const deviceConfiguration = await fetch(`${url}/device/v1/config`, {
      headers: { Authorization: 'Bearer device-secret', 'X-Runner-Id': 'hosted-test-runner' },
    });
    expect(deviceConfiguration.status).toBe(200);
    expect(await deviceConfiguration.json()).toHaveLength(4);
  });

  it('expõe saúde sem sessão e limita as origens do navegador', async () => {
    const control = new IrrigationControl(emptyState(Date.now()), Date.now, 'hosted-demo');
    const server = createApi(control, {
      allowedOrigins: ['https://irrigacao-int.vercel.app', 'https://localhost'],
      deviceToken: 'device-secret',
      networkAccess: 'public',
      persist: async () => {},
      sessionAuth: auth(Date.now),
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    const health = await fetch(`${url}/healthz`);
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ status: 'ok' });
    const androidPreflight = await fetch(`${url}/api/v1/session`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://localhost',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    expect({
      status: androidPreflight.status,
      origin: androidPreflight.headers.get('access-control-allow-origin'),
    }).toEqual({ status: 204, origin: 'https://localhost' });
    expect(
      (
        await fetch(`${url}/api/v1/session`, {
          method: 'OPTIONS',
          headers: { Origin: 'https://site-nao-autorizado.example' },
        })
      ).status,
    ).toBe(403);
  });
});
