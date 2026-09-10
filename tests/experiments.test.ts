import { describe, expect, it } from 'vitest';
import { runExperiment } from '../experiments/run.ts';
import { scenarios } from '../shared/experiments.ts';

describe('Experimentos que alimentam a visualização', () => {
  it.each(scenarios)('$name: calcula verificações a partir da execução', ({ id }) => {
    const report = runExperiment({ scenario: id, seed: 2026 });
    expect(report.checks.map((check) => ({ name: check.name, passed: check.passed }))).toEqual(
      report.checks.map((check) => ({ name: check.name, passed: true })),
    );
    expect(report.frames).toHaveLength(90);
    expect(report.metrics.confirmedCommands).toBeGreaterThan(0);
  });
  it('reproduz séries e métricas com a mesma seed e distingue a verdade local do estado remoto', () => {
    const first = runExperiment({ scenario: 'connection-loss', seed: 2026 });
    const second = runExperiment({ scenario: 'connection-loss', seed: 2026 });
    expect(first.metrics).toEqual(second.metrics);
    expect(
      first.readings.map(({ moisture, receivedAt, valve }) => ({ moisture, receivedAt, valve })),
    ).toEqual(second.readings.map(({ moisture, receivedAt, valve }) => ({ moisture, receivedAt, valve })));
    expect(first.frames[19]).toMatchObject({
      communication: false,
      deviceOpen: { north: false },
      zones: [
        expect.objectContaining({ latest: expect.objectContaining({ valve: 'open' }) }),
        expect.anything(),
      ],
    });
  });
});
