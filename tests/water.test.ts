import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SimulatedDevice } from '../simulator/device';
import type { Command } from '../shared/contracts';
import { litersForSeconds, perPlantMilliliters, plantsPerZone } from '../shared/water';
import { runExperiment } from '../experiments/run';

function command(action: 'open' | 'close', now: number): Command {
  return {
    id: randomUUID(),
    zoneId: 'north',
    deviceId: 'sim-north',
    action,
    durationSeconds: action === 'open' ? 12 : undefined,
    idempotencyKey: randomUUID(),
    origin: 'manual',
    status: 'pending',
    requestedAt: now,
    expiresAt: now + 8000,
    appliedAt: null,
  };
}
describe('Volume nominal independente da renderização', () => {
  it('integra apenas o trecho aberto, inclusive fechamento entre dois passos', () => {
    const device = new SimulatedDevice('sim-north', 30, 1);
    device.step(1, 1000);
    device.apply(command('open', 1250), 1250);
    device.step(1, 2000);
    device.apply(command('close', 2350), 2350);
    expect(device.step(1, 3000).water).toEqual({ totalLiters: 0.011, flowLitersPerHour: 0 });
    expect(device.step(1, 4000).water).toEqual(device.water);
  });
  it('corta no prazo máximo mesmo em um passo que atravessa o fechamento', () => {
    const device = new SimulatedDevice('sim-north', 30, 1);
    const open = command('open', 1000);
    device.apply(open, 1000);
    device.step(5, 6000);
    device.apply(open, 7000);
    device.step(5, 11000);
    expect(device.step(5, 16000)).toMatchObject({
      valve: 'closed',
      water: { totalLiters: litersForSeconds(12), flowLitersPerHour: 0 },
    });
  });
  it('preserva volume ao reiniciar e não contabiliza o período parado', () => {
    const device = new SimulatedDevice('sim-north', 30, 1);
    device.apply(command('open', 1000), 1000);
    const reading = device.step(1, 2000);
    const restarted = new SimulatedDevice('sim-north', reading.moisture, 1, reading.sequence, reading.water);
    expect(restarted.step(1, 100000).water).toEqual({
      totalLiters: litersForSeconds(1),
      flowLitersPerHour: 0,
    });
  });
  it.each(['automatic', 'connection-loss', 'duplicate'] as const)(
    '%s: conserva volume, isola áreas e distingue telemetria do estado interno',
    (scenario) => {
      const report = runExperiment({ scenario, seed: 2026 });
      expect(report.metrics.totalLiters).toBeCloseTo(litersForSeconds(report.metrics.openSeconds), 6);
      expect((perPlantMilliliters(report.metrics.totalLiters) * plantsPerZone) / 1000).toBeCloseTo(
        report.metrics.totalLiters,
        8,
      );
      for (const [index, frame] of report.frames.entries()) {
        expect(frame.deviceWater.south).toEqual({ totalLiters: 0, flowLitersPerHour: 0 });
        if (index)
          expect(frame.deviceWater.north.totalLiters).toBeGreaterThanOrEqual(
            report.frames[index - 1].deviceWater.north.totalLiters,
          );
      }
      if (scenario === 'connection-loss') {
        const frame = report.frames[19];
        expect(frame.deviceWater.north.totalLiters).toBeGreaterThan(
          frame.zones[0].latest!.water!.totalLiters,
        );
        expect(frame.deviceWater.north.flowLitersPerHour).toBe(0);
        expect(report.frames[29].zones[0].latest!.water).toEqual(frame.deviceWater.north);
      }
    },
  );
  it('não duplica volume ao observar o mesmo instante ou usar passos diferentes', () => {
    const a = new SimulatedDevice('sim-north', 30, 1),
      b = new SimulatedDevice('sim-north', 30, 1);
    a.apply(command('open', 1000), 1000);
    b.apply(command('open', 1000), 1000);
    for (let now = 2000; now <= 6000; now += 1000) {
      a.step(1, now);
      a.step(1, now);
    }
    b.step(5, 6000);
    expect(a.water).toEqual(b.water);
  });
});
