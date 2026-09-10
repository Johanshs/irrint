import { randomUUID } from 'node:crypto';
import { initialState, IrrigationControl } from '../shared/control.ts';
import { experimentSchema } from '../shared/experiments.ts';
import type { ExperimentInput, ExperimentReport } from '../shared/experiments.ts';
import type { Command } from '../shared/contracts.ts';
import { SimulatedDevice } from '../simulator/device.ts';

/** Executes isolated, repeatable model experiments; never mutates the live demonstration. */
export function runExperiment(input: ExperimentInput): ExperimentReport {
  const parameters = experimentSchema.parse(input);
  const start = Date.UTC(2026, 8, 9, 12);
  let now = start;
  const control = new IrrigationControl(initialState(now), () => now);
  const north = new SimulatedDevice('sim-north', 30, parameters.seed);
  const south = new SimulatedDevice('sim-south', 55, parameters.seed + 1);
  const isLoss = parameters.scenario === 'connection-loss';
  const isDuplicate = parameters.scenario === 'duplicate';
  control.configure('north', {
    mode: isDuplicate ? 'manual' : 'automatic',
    startBelow: 35,
    stopAt: isLoss ? 80 : 45,
    maxDurationSeconds: isLoss ? 12 : 60,
  });
  const frames: ExperimentReport['frames'] = [];
  let duplicate: Command | null = null;
  const key = randomUUID();
  const durationSeconds = 90;
  for (let second = 1; second <= durationSeconds; second++) {
    now = start + second * 1000;
    const communication = !(isLoss && second >= 5 && second < 30);
    const groundTruth: Record<string, boolean> = {};
    for (const [zoneId, device] of [
      ['north', north],
      ['south', south],
    ] as const) {
      const reading = device.step(1, now);
      groundTruth[zoneId] = reading.valve === 'open';
      if (zoneId === 'north' && !communication) continue;
      control.telemetry(reading);
      if (isDuplicate && zoneId === 'north' && second <= 4) {
        const command = control.command('north', {
          action: 'open',
          durationSeconds: 12,
          idempotencyKey: key,
        });
        duplicate ??= command;
      }
      for (const command of control.pending(device.deviceId)) {
        if (device.apply(command, now))
          control.acknowledge({
            deviceId: device.deviceId,
            commandId: command.id,
            status: 'applied',
            valve: command.action === 'open' ? 'open' : 'closed',
          });
      }
      if (isDuplicate && zoneId === 'north' && duplicate) device.apply(duplicate, now);
      groundTruth[zoneId] = device.valveState === 'open';
    }
    const snapshot = control.snapshot();
    frames.push({
      second,
      at: now,
      zones: snapshot.zones,
      commands: snapshot.commands,
      deviceOpen: groundTruth,
      deviceWater: { north: north.water, south: south.water },
      communication,
    });
  }
  const final = control.snapshot();
  const commands = final.commands;
  const activeFrames = frames.filter((frame) => frame.deviceOpen.north);
  const northZone = final.zones.find((zone) => zone.id === 'north')!;
  const checks: ExperimentReport['checks'] = [
    {
      name: 'Isolamento entre áreas',
      passed:
        frames.every((frame) => !frame.deviceOpen.south) &&
        commands.every((command) => command.zoneId === 'north'),
      evidence: `${commands.filter((command) => command.zoneId === 'south').length} comandos enviados à área sul.`,
    },
  ];
  if (parameters.scenario === 'automatic') {
    const opens = commands.filter((command) => command.action === 'open');
    const closes = commands.filter((command) => command.action === 'close');
    checks.push({
      name: 'Início abaixo do limite',
      passed:
        opens.length > 0 &&
        opens.every((command) =>
          final.readings.some(
            (reading) =>
              reading.zoneId === 'north' &&
              reading.receivedAt === command.requestedAt &&
              reading.moisture < 35,
          ),
        ),
      evidence: `${opens.length} início(s); cada solicitação comparada com a leitura que a originou.`,
    });
    checks.push({
      name: 'Parada no limite superior',
      passed:
        closes.length > 0 &&
        closes.every(
          (command) =>
            command.status === 'applied' &&
            final.readings.some(
              (reading) =>
                reading.zoneId === 'north' &&
                reading.receivedAt === command.requestedAt &&
                reading.moisture >= 45,
            ),
        ),
      evidence: `${closes.length} parada(s); leitura de origem e confirmação verificadas.`,
    });
  } else {
    checks.push({
      name: 'Prazo máximo respeitado no dispositivo',
      passed:
        activeFrames.length > 0 &&
        activeFrames.length <= 12 &&
        frames.filter((frame) => frame.second >= 13).every((frame) => !frame.deviceOpen.north),
      evidence: `${activeFrames.length} passos de 1 s com válvula aberta; fechada desde o segundo 13.`,
    });
    if (isLoss)
      checks.push({
        name: 'Reconexão sem reinício automático',
        passed:
          northZone.automaticPaused &&
          commands.length === 1 &&
          frames.some(
            (frame) =>
              frame.second >= 15 &&
              frame.second < 30 &&
              frame.at - frame.zones[0].latest!.receivedAt >= 10000,
          ),
        evidence: `${commands.length} comando; automático ${northZone.automaticPaused ? 'suspenso' : 'ativo'} ao final; janela sem contato registrada.`,
      });
    else
      checks.push({
        name: 'Idempotência do início',
        passed: commands.length === 1 && commands[0].status === 'applied',
        evidence: `4 solicitações com a mesma chave produziram ${commands.length} comando(s).`,
      });
  }
  return {
    version: '1.0',
    model: 'linear-educational-v2',
    id: randomUUID(),
    createdAt: Date.now(),
    input: parameters,
    durationSeconds,
    stepSeconds: 1,
    frames,
    readings: final.readings,
    events: final.events,
    checks,
    metrics: {
      confirmedCommands: commands.filter((command) => command.status === 'applied').length,
      totalCommands: commands.length,
      // A state sampled at the final second has no following interval inside this experiment.
      openSeconds: frames.slice(0, -1).filter((frame) => frame.deviceOpen.north).length,
      totalLiters: north.water.totalLiters + south.water.totalLiters,
      inRangePercent:
        Math.round(
          (frames.filter((frame) => {
            const zone = frame.zones[0];
            return (
              zone.latest !== null &&
              frame.at - zone.latest.receivedAt < 10000 &&
              zone.latest.moisture >= zone.rule.startBelow &&
              zone.latest.moisture <= zone.rule.stopAt
            );
          }).length /
            frames.length) *
            1000,
        ) / 10,
    },
    limitations: [
      'Água estimada: 18 gotejadores de 2 L/h por área; volume = vazão nominal × tempo aberto. Distribuição uniforme por planta, sem perdas, pressão ou absorção radicular calculadas. O relógio do dispositivo, não a animação, integra o volume.',
      'Modelo didático: umidade é um índice normalizado, não uma medição volumétrica calibrada.',
      'Taxas: +0,85 ponto percentual/s irrigando e -0,15 parado; ruído uniforme de até 0,02 ponto por passo. Valores arbitrários para visualização.',
      'Relógio virtual de 1 s. Confirmações internas são imediatas; não medem latência de rede, desempenho de hardware ou economia de água.',
      'Tempo aberto soma os intervalos de 1 s entre amostras do estado interno do dispositivo. O último instante não acrescenta um intervalo futuro. Durante falhas, a interface do operador apresenta apenas o último estado conhecido.',
      'Faixa configurada usa leituras recentes divididas pelos 90 passos; dados indisponíveis contam fora da faixa. Não é indicador de produtividade agrícola.',
      'Resultados repetíveis na mesma versão e seed quanto a séries, decisões e métricas; identificadores e data de exportação são únicos.',
    ],
  };
}
