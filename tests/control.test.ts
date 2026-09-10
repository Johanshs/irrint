import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { initialState, IrrigationControl, COMMAND_TTL_MS, OFFLINE_AFTER_MS } from '../shared/control.ts';
import { SimulatedDevice } from '../simulator/device.ts';
import type { CommandInput, Telemetry } from '../shared/contracts.ts';

function fixture() {
  let now = 1_800_000_000_000;
  let sequence = 0;
  const control = new IrrigationControl(initialState(now), () => now);
  const reading = (moisture: number, extra: Partial<Telemetry> = {}) =>
    control.telemetry({
      schemaVersion: '1.0',
      deviceId: 'sim-north',
      sequence: ++sequence,
      moisture,
      unit: 'normalizedPercent',
      valve: 'closed',
      lastCommandId: null,
      source: 'simulated',
      ...extra,
    });
  return {
    control,
    reading,
    time: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}
const open = (): CommandInput => ({ action: 'open', durationSeconds: 60, idempotencyKey: randomUUID() });
const rule = { mode: 'automatic' as const, startBelow: 35, stopAt: 45, maxDurationSeconds: 60 };

describe('Contrato e controle de irrigação', () => {
  it('uma leitura nova de válvula fechada após reinício supera a confirmação antiga de abertura', () => {
    const { control, reading, advance } = fixture();
    control.configure('north', rule);
    reading(30);
    const command = control.pending('sim-north')[0];
    control.acknowledge({ deviceId: 'sim-north', commandId: command.id, status: 'applied', valve: 'open' });
    advance(1000);
    reading(30, { valve: 'closed', lastCommandId: null });
    expect(control.snapshot().zones[0]).toMatchObject({
      automaticPaused: true,
      activeCommandId: null,
      latest: { valve: 'closed' },
    });
    expect(control.snapshot().commands).toHaveLength(1);
    expect(control.snapshot().events.at(-1)).toMatchObject({ type: 'safety', commandId: command.id });
  });
  it('mantém a parada disponível depois do limite de comandos da sessão', () => {
    const { control, reading } = fixture();
    reading(30);
    for (let index = 0; index < 500; index++)
      control.command('north', { action: 'close', idempotencyKey: randomUUID() });
    expect(() => control.command('north', open())).toThrow('Limite da sessão');
    expect(control.command('north', { action: 'close', idempotencyKey: randomUUID() })).toMatchObject({
      action: 'close',
      status: 'pending',
    });
  });
  it('CT02: aplica histerese, confirma e encerra no limite superior', () => {
    const { control, reading } = fixture();
    control.configure('north', rule);
    reading(35);
    expect(control.snapshot().commands).toEqual([]);
    reading(34);
    const start = control.pending('sim-north')[0];
    expect(start).toMatchObject({ action: 'open', status: 'pending', origin: 'automatic' });
    reading(40, { valve: 'open', lastCommandId: start.id });
    expect(control.snapshot().commands).toEqual([
      { ...start, status: 'applied', appliedAt: start.requestedAt },
    ]);
    reading(45, { valve: 'open', lastCommandId: start.id });
    const stop = control.pending('sim-north')[0];
    expect(stop.action).toBe('close');
    reading(45, { valve: 'closed', lastCommandId: stop.id });
    expect(control.snapshot().commands.map((command) => [command.action, command.status])).toEqual([
      ['open', 'applied'],
      ['close', 'applied'],
    ]);
  });

  it('CT03: oscilações no limite inferior não duplicam a abertura', () => {
    const { control, reading } = fixture();
    control.configure('north', rule);
    for (const value of [34.9, 35.1, 34.8]) reading(value);
    expect(control.snapshot().commands).toHaveLength(1);
  });

  it('CT04: parada manual suspende o automático até retomada explícita', () => {
    const { control, reading } = fixture();
    control.configure('north', rule);
    reading(34);
    const start = control.pending('sim-north')[0];
    reading(34, { valve: 'open', lastCommandId: start.id });
    const stop = control.command('north', { action: 'close', idempotencyKey: randomUUID() });
    reading(32, { valve: 'closed', lastCommandId: stop.id });
    reading(31, { valve: 'closed', lastCommandId: stop.id });
    expect(control.snapshot().commands).toHaveLength(2);
    expect(control.snapshot().zones[0].automaticPaused).toBe(true);
    control.configure('north', rule);
    expect(control.pending('sim-north').map((command) => command.action)).toEqual(['open']);
  });

  it('CT06: leitura antiga bloqueia novas aberturas', () => {
    const { control, reading, advance } = fixture();
    reading(34);
    advance(OFFLINE_AFTER_MS);
    expect(() => control.command('north', open())).toThrow('Dispositivo sem leitura recente');
    expect(control.snapshot().commands).toEqual([]);
  });

  it('CT07/CT09: comando vence sem confirmação e ACK atrasado não o aplica', () => {
    const { control, reading, advance } = fixture();
    reading(34);
    const command = control.command('north', open());
    advance(COMMAND_TTL_MS);
    expect(control.pending('sim-north')).toEqual([]);
    expect(
      control.acknowledge({ commandId: command.id, deviceId: 'sim-north', status: 'applied', valve: 'open' })
        .status,
    ).toBe('expired');
    expect(control.snapshot().zones[0].latest?.valve).toBe('closed');
  });

  it('CT08: rejeita valor inválido e sequência antiga sem alterar o estado', () => {
    const { control, reading } = fixture();
    reading(40);
    const before = control.exportState();
    expect(() => reading(101)).toThrow();
    expect(() => reading(20, { sequence: 0 })).toThrow('Leitura antiga');
    expect(control.exportState()).toEqual(before);
  });

  it('CT10: uma chave repetida retorna o mesmo comando e rejeita conteúdo diferente', () => {
    const { control, reading } = fixture();
    reading(40);
    const input = open();
    const first = control.command('north', input);
    expect(control.command('north', input)).toEqual(first);
    expect(() => control.command('north', { ...input, durationSeconds: 30 })).toThrow('outro conteúdo');
    expect(control.snapshot().commands).toEqual([first]);
  });

  it('CT11: uma área seca não aciona a outra', () => {
    const { control, reading } = fixture();
    control.configure('north', rule);
    control.configure('south', rule);
    reading(34);
    reading(55, { deviceId: 'sim-south' });
    expect(control.pending('sim-south')).toEqual([]);
    expect(control.snapshot().commands.map((command) => command.zoneId)).toEqual(['north']);
  });

  it('CT15: fechamento supera abertura pendente e confirmação anterior não muda o estado', () => {
    const { control, reading } = fixture();
    reading(40);
    const first = control.command('north', open());
    const stop = control.command('north', { action: 'close', idempotencyKey: randomUUID() });
    control.acknowledge({ deviceId: 'sim-north', commandId: first.id, valve: 'open', status: 'applied' });
    expect(control.snapshot().commands.map((command) => [command.id, command.status])).toEqual([
      [first.id, 'superseded'],
      [stop.id, 'pending'],
    ]);
  });

  it('não aceita confirmação de outro dispositivo ou de estado incompatível', () => {
    const { control, reading } = fixture();
    reading(40);
    const command = control.command('north', open());
    expect(() =>
      control.acknowledge({ deviceId: 'sim-south', commandId: command.id, valve: 'open', status: 'applied' }),
    ).toThrow();
    expect(() =>
      control.acknowledge({
        deviceId: 'sim-north',
        commandId: command.id,
        valve: 'closed',
        status: 'applied',
      }),
    ).toThrow('incompatível');
    expect(control.pending('sim-north')).toEqual([command]);
  });

  it('limites inválidos não substituem a configuração anterior', () => {
    const { control } = fixture();
    const before = control.exportState();
    expect(() => control.configure('north', { ...rule, startBelow: 50 })).toThrow();
    expect(control.exportState()).toEqual(before);
  });
});

describe('Dispositivo simulado', () => {
  it('CT05: o próprio dispositivo encerra a duração sem backend e não a renova ao repetir comando', () => {
    const { control, reading, time, advance } = fixture();
    reading(34);
    const device = new SimulatedDevice('sim-north', 34, 2026);
    const command = control.command('north', { ...open(), durationSeconds: 5 });
    expect(device.apply(command, time())).toBe(true);
    advance(4000);
    expect(device.apply(command, time())).toBe(true);
    expect(device.step(1, time()).valve).toBe('open');
    advance(1000);
    expect(device.step(1, time()).valve).toBe('closed');
  });

  it('CT09: dispositivo rejeita abertura vencida e comando de outra área', () => {
    const { control, reading, time, advance } = fixture();
    reading(34);
    const command = control.command('north', open());
    const device = new SimulatedDevice('sim-north', 34, 1);
    expect(device.apply({ ...command, deviceId: 'sim-south' }, time())).toBe(false);
    advance(COMMAND_TTL_MS);
    expect(device.apply(command, time())).toBe(false);
  });

  it('CT12: mesma seed e passos geram a mesma série; seed diferente altera a série', () => {
    const run = (seed: number) => {
      const device = new SimulatedDevice('sim-north', 40, seed);
      return Array.from({ length: 30 }, (_, index) => device.step(1, index * 1000));
    };
    expect(run(2026)).toEqual(run(2026));
    expect(run(2026)).not.toEqual(run(2027));
  });
});
