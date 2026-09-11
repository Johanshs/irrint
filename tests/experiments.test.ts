import { describe, expect, it } from 'vitest';
import { runExperiment } from '../experiments/run.ts';
import { scenarios } from '../shared/experiments.ts';
import { experimentCsv, replaySnapshot } from '../src/features/laboratory/report';
import { zoneStatus } from '../src/features/irrigation/session';

const cases = scenarios.flatMap((scenario) =>
  (['north', 'south'] as const).map((zoneId) => ({ scenario: scenario.id, zoneId })),
);
describe('Laboratório: dois sistemas e oito ensaios', () => {
  it.each(cases)('$scenario em $zoneId: comportamento e evidências do ensaio', (input) => {
    const report = runExperiment({ ...input, seed: 2026 });
    expect(report.checks.map((check) => ({ name: check.name, passed: check.passed }))).toEqual(
      report.checks.map((check) => ({ name: check.name, passed: true })),
    );
    const expected = {
      automatic: { openSeconds: 21, totalLiters: 0.21, confirmedCommands: 3, totalCommands: 3 },
      'manual-stop': { openSeconds: 3, totalLiters: 0.03, confirmedCommands: 2, totalCommands: 2 },
      'connection-loss': { openSeconds: 12, totalLiters: 0.12, confirmedCommands: 1, totalCommands: 1 },
      unconfirmed: { openSeconds: 12, totalLiters: 0.12, confirmedCommands: 0, totalCommands: 1 },
      'command-timeout': { openSeconds: 0, totalLiters: 0, confirmedCommands: 0, totalCommands: 1 },
      duplicate: { openSeconds: 12, totalLiters: 0.12, confirmedCommands: 1, totalCommands: 1 },
      'invalid-reading': { openSeconds: 0, totalLiters: 0, confirmedCommands: 0, totalCommands: 0 },
      'stuck-valve': { openSeconds: 89, totalLiters: 0.89, confirmedCommands: 1, totalCommands: 2 },
    }[input.scenario];
    expect(report.metrics).toMatchObject(expected);
    expect(report.frames).toHaveLength(90);
    const other = input.zoneId === 'north' ? 'south' : 'north';
    expect(report.frames.map((frame) => frame.deviceWater[other])).toEqual(
      Array.from({ length: 90 }, () => ({ totalLiters: 0, flowLitersPerHour: 0 })),
    );
    expect(report.moments.every((moment) => moment.second >= 1 && moment.second <= 90)).toBe(true);
  });
  it.each(scenarios)('$name: mesma seed reproduz séries em qualquer sistema', ({ id }) => {
    const north = runExperiment({ scenario: id, seed: 2026 });
    const repeat = runExperiment({ scenario: id, seed: 2026 });
    const south = runExperiment({ scenario: id, seed: 2026, zoneId: 'south' });
    const canonical = (report: typeof north) =>
      report.frames.map((frame) => ({
        second: frame.second,
        moisture: frame.deviceMoisture[report.input.zoneId],
        water: frame.deviceWater[report.input.zoneId],
        open: frame.deviceOpen[report.input.zoneId],
        communication: frame.communication,
        commands: frame.commands.map((command) => ({ action: command.action, status: command.status })),
      }));
    expect(canonical(north)).toEqual(canonical(repeat));
    expect(canonical(north)).toEqual(canonical(south));
    expect(north.metrics).toEqual(south.metrics);
  });
  it('confirmação perdida: o operador nunca recebe uma abertura inventada', () => {
    const report = runExperiment({ scenario: 'unconfirmed', seed: 2026, zoneId: 'south' });
    for (const index of [0, 4, 8, 19]) {
      const snapshot = replaySnapshot(report, index);
      const zone = snapshot.zones[1];
      expect(zoneStatus(zone, snapshot, true).irrigating).toBe(false);
      expect(zone.latest?.valve).toBe('closed');
    }
    expect(report.frames[4].deviceOpen.south).toBe(true);
    expect(report.frames[19].deviceWater.south.totalLiters).toBe(0.12);
    expect(report.frames[29].zones[1].latest?.water?.totalLiters).toBe(0.12);
  });
  it('CSV distingue a falha no sul do norte conectado e preserva valores recebidos', () => {
    const report = runExperiment({ scenario: 'connection-loss', seed: 2026, zoneId: 'south' });
    const [header, ...lines] = experimentCsv(report).split('\r\n');
    const rows = lines.map((line) =>
      Object.fromEntries(line.split(',').map((value, i) => [header.split(',')[i], value])),
    );
    expect(rows).toHaveLength(180);
    expect(rows.find((row) => row.second === '20' && row.zone === 'south')).toMatchObject({
      target_zone: 'south',
      communication: '0',
      device_valve_open: '0',
      received_valve: 'open',
      device_total_liters: '0.12',
      received_total_liters: '0.03',
      reading_age_ms: '16000',
    });
    expect(rows.find((row) => row.second === '20' && row.zone === 'north')).toMatchObject({
      communication: '1',
      device_valve_open: '0',
      device_total_liters: '0',
    });
    const snapshot = replaySnapshot(report, 19);
    expect(snapshot.readings.every((reading) => reading.receivedAt <= snapshot.serverTime)).toBe(true);
    expect(snapshot.events.every((event) => event.at <= snapshot.serverTime)).toBe(true);
  });
});
