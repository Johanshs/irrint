import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApi } from '../server/api.ts';
import { IrrigationControl, initialState } from '../shared/control.ts';
import { SimulatedDevice } from '../simulator/device.ts';
import type { Command, Snapshot } from '../shared/contracts.ts';

const servers: Server[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function setup() {
  let now = 1_800_000_000_000;
  const control = new IrrigationControl(initialState(now), () => now);
  let persisted = control.exportState();
  const server = createApi(control, {
    deviceToken: 'test-device-token',
    persist: async () => {
      persisted = control.exportState();
    },
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const request = async (path: string, method = 'GET', body?: unknown, token = 'test-device-token') =>
    fetch(`${url}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Runner-Id': 'test-runner',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  return {
    request,
    url,
    control,
    persisted: () => persisted,
    advance: () => {
      now += 1000;
    },
    time: () => now,
  };
}

describe('API HTTP com cliente de dispositivo independente', () => {
  it('irriga e para o canteiro sul por HTTP sem acionar o norte', async () => {
    const { request, time, advance, persisted } = await setup();
    const north = new SimulatedDevice('sim-north', 42, 2026);
    const south = new SimulatedDevice('sim-south', 30, 2027);
    for (const device of [north, south])
      expect((await request('/device/v1/telemetry', 'POST', device.step(1, time()))).status).toBe(200);
    const initial = south.water;
    const applySouth = async (action: 'open' | 'close') => {
      const response = await request('/api/v1/zones/south/commands', 'POST', {
        action,
        idempotencyKey: randomUUID(),
        ...(action === 'open' ? { durationSeconds: 15 } : {}),
      });
      expect(response.status).toBe(202);
      const commands = (await (await request('/device/v1/commands/sim-south')).json()) as Command[];
      expect(commands).toHaveLength(1);
      expect(south.apply(commands[0], time())).toBe(true);
      expect(
        (
          await request('/device/v1/ack', 'POST', {
            deviceId: south.deviceId,
            commandId: commands[0].id,
            status: 'applied',
            valve: south.valveState,
          })
        ).status,
      ).toBe(200);
    };
    await applySouth('open');
    for (let tick = 0; tick < 3; tick++) {
      advance();
      for (const device of [north, south])
        expect((await request('/device/v1/telemetry', 'POST', device.step(1, time()))).status).toBe(200);
    }
    expect(south.water.totalLiters).toBeGreaterThan(initial.totalLiters);
    expect(south.water).toEqual({ totalLiters: 0.03, flowLitersPerHour: 36 });
    await applySouth('close');
    advance();
    await request('/device/v1/telemetry', 'POST', south.step(1, time()));
    const snapshot = (await (await request('/api/v1/state')).json()) as Snapshot;
    expect(snapshot.commands.map(({ zoneId, action, status }) => ({ zoneId, action, status }))).toEqual([
      { zoneId: 'south', action: 'open', status: 'applied' },
      { zoneId: 'south', action: 'close', status: 'applied' },
    ]);
    expect(
      snapshot.zones.map((zone) => ({ id: zone.id, valve: zone.latest?.valve, water: zone.latest?.water })),
    ).toEqual([
      { id: 'north', valve: 'closed', water: { totalLiters: 0, flowLitersPerHour: 0 } },
      { id: 'south', valve: 'closed', water: { totalLiters: 0.03, flowLitersPerHour: 0 } },
    ]);
    expect(persisted().zones).toEqual(snapshot.zones);
  });
  it.each(['north', 'south'])(
    '%s: executa e exporta um experimento isolado pela API, sem alterar as áreas ao vivo',
    async (zoneId) => {
      const { request, control } = await setup();
      const before = control.exportState();
      const response = await request('/api/v1/experiments', 'POST', {
        scenario: 'connection-loss',
        seed: 2026,
        zoneId,
      });
      expect(response.status).toBe(200);
      const report = await response.json();
      expect(report).toMatchObject({
        model: 'linear-educational-v3',
        input: { zoneId },
        metrics: { openSeconds: 12, totalCommands: 1 },
      });
      expect(report.checks.every((check: { passed: boolean }) => check.passed)).toBe(true);
      expect(control.exportState()).toEqual(before);
      expect((await request('/api/v1/experiments', 'POST', { scenario: 'unknown', seed: 2026 })).status).toBe(
        422,
      );
      expect(
        (
          await request('/api/v1/experiments', 'POST', {
            scenario: 'automatic',
            seed: 2026,
            zoneId: 'missing',
          })
        ).status,
      ).toBe(422);
    },
  );
  it('executa um ciclo automático completo por HTTP, persistindo leituras e confirmações', async () => {
    const { request, advance, time, persisted } = await setup();
    expect(
      (
        await request('/api/v1/zones/north/rule', 'PUT', {
          mode: 'automatic',
          startBelow: 35,
          stopAt: 45,
          maxDurationSeconds: 60,
        })
      ).status,
    ).toBe(200);
    const device = new SimulatedDevice('sim-north', 34, 2026);
    for (let tick = 0; tick < 22; tick++) {
      expect((await request('/device/v1/telemetry', 'POST', device.step(1, time()))).status).toBe(200);
      const commands = (await (await request('/device/v1/commands/sim-north')).json()) as Command[];
      for (const command of commands) {
        expect(device.apply(command, time())).toBe(true);
        expect(
          (
            await request('/device/v1/ack', 'POST', {
              deviceId: 'sim-north',
              commandId: command.id,
              status: 'applied',
              valve: command.action === 'open' ? 'open' : 'closed',
            })
          ).status,
        ).toBe(200);
      }
      advance();
    }
    const snapshot = (await (await request('/api/v1/state')).json()) as Snapshot;
    expect(snapshot.commands.map((command) => [command.action, command.status])).toEqual([
      ['open', 'applied'],
      ['close', 'applied'],
    ]);
    expect(snapshot.readings).toHaveLength(22);
    expect(persisted().commands).toEqual(snapshot.commands);
    expect(snapshot.zones[1].latest).toBeNull();
    expect(snapshot.zones[0].latest?.valve).toBe('closed');
  });

  it('rejeita dispositivo sem credencial e payload fora do contrato', async () => {
    const { request, control } = await setup();
    expect((await request('/device/v1/telemetry', 'POST', {}, 'wrong')).status).toBe(401);
    expect((await request('/device/v1/telemetry', 'POST', { moisture: 500 })).status).toBe(422);
    expect(control.snapshot().readings).toEqual([]);
  });

  it('serializa comandos concorrentes e respeita a mesma chave de idempotência', async () => {
    const { request } = await setup();
    const device = new SimulatedDevice('sim-north', 40, 1);
    await request('/device/v1/telemetry', 'POST', device.step(1, 0));
    const body = { action: 'open', durationSeconds: 60, idempotencyKey: randomUUID() };
    const responses = await Promise.all([
      request('/api/v1/zones/north/commands', 'POST', body),
      request('/api/v1/zones/north/commands', 'POST', body),
    ]);
    const results = await Promise.all(responses.map((response) => response.json()));
    expect(responses.map((response) => response.status)).toEqual([202, 202]);
    expect(results[0]).toEqual(results[1]);
  });

  it('bloqueia origem externa e corpo excessivo na API local', async () => {
    const { url } = await setup();
    expect(
      (await fetch(`${url}/api/v1/state`, { headers: { Origin: 'https://unrelated.example' } })).status,
    ).toBe(403);
    expect(
      (
        await fetch(`${url}/api/v1/zones/north/commands`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'x'.repeat(66000) }),
        })
      ).status,
    ).toBe(413);
  });

  it('CT16: dois processos não podem alimentar a mesma sessão ao mesmo tempo', async () => {
    const { request, url } = await setup();
    await request('/device/v1/commands/sim-north');
    const second = await fetch(`${url}/device/v1/commands/sim-north`, {
      headers: { Authorization: 'Bearer test-device-token', 'X-Runner-Id': 'second-runner' },
    });
    expect(second.status).toBe(423);
  });

  it('CT19: erro de persistência não mantém mutação apenas na memória', async () => {
    const control = new IrrigationControl(initialState(Date.now()));
    const before = control.exportState();
    const server = createApi(control, {
      deviceToken: 'unused',
      persist: async () => {
        throw new Error('simulated disk failure');
      },
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const response = await fetch(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/zones/north/rule`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'automatic', startBelow: 35, stopAt: 45, maxDurationSeconds: 60 }),
      },
    );
    expect(response.status).toBe(500);
    expect(control.exportState()).toEqual(before);
  });
});
