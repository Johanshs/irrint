import { afterEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApi } from '../server/api.ts';
import { LocalSessionAuth } from '../server/auth.ts';
import { IrrigationControl, initialState } from '../shared/control.ts';
import { OpenApiDeviceClient } from '../clients/openapi-device.ts';

const servers: Server[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('cliente de referência derivado do OpenAPI', () => {
  it('CT20: controla um ciclo completo sem reutilizar o simulador ou o domínio no cliente', async () => {
    let now = 1_800_000_000_000;
    const control = new IrrigationControl(initialState(now), () => now);
    control.configure('north', {
      mode: 'automatic',
      startBelow: 35,
      stopAt: 45,
      maxDurationSeconds: 60,
    });
    const server = createApi(control, {
      deviceToken: 'contract-token',
      sessionAuth: new LocalSessionAuth([]),
      persist: async () => undefined,
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const client = new OpenApiDeviceClient({
      baseUrl,
      token: 'contract-token',
      runnerId: 'independent-client',
      deviceId: 'sim-north',
      initialMoisture: 34,
    });

    await expect(client.connect()).resolves.toEqual({ contractVersion: '1.0.0', zoneId: 'north' });
    for (let cycle = 0; cycle < 20; cycle++) {
      await client.cycle(now);
      now += 1000;
    }

    const snapshot = control.snapshot();
    expect(snapshot.commands.map(({ action, status }) => ({ action, status }))).toEqual([
      { action: 'open', status: 'applied' },
      { action: 'close', status: 'applied' },
    ]);
    expect(snapshot.readings.every((reading) => reading.source === 'device')).toBe(true);
    expect(snapshot.zones[0].latest).toMatchObject({
      deviceId: 'sim-north',
      sequence: 20,
      valve: 'closed',
      source: 'device',
    });
    expect(snapshot.zones[0].latest?.water?.totalLiters).toBeGreaterThan(0);
    expect(snapshot.zones[1].latest).toBeNull();
  });
});
