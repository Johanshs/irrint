import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { ControlError, initialState, IrrigationControl } from '../shared/control.ts';
import { experimentSchema } from '../shared/experiments.ts';
import type { ExperimentInput, ExperimentReport, ExperimentMoment } from '../shared/experiments.ts';
import type { Command, Telemetry } from '../shared/contracts.ts';
import { SimulatedDevice } from '../simulator/device.ts';
import { evaluateExperiment } from './checks.ts';

/** Runs the real controller against an isolated device model, with a virtual clock. */
export function runExperiment(input: ExperimentInput): ExperimentReport {
  const parameters = experimentSchema.parse(input);
  const { scenario, zoneId, seed } = parameters;
  const start = Date.UTC(2026, 8, 9, 12);
  let now = start;
  const control = new IrrigationControl(initialState(now), () => now);
  const devices = {
    north: new SimulatedDevice(
      'sim-north',
      zoneId === 'north' ? 30 : 55,
      zoneId === 'north' ? seed : seed + 1,
    ),
    south: new SimulatedDevice(
      'sim-south',
      zoneId === 'south' ? 30 : 55,
      zoneId === 'south' ? seed : seed + 1,
    ),
  };
  const isLoss = scenario === 'connection-loss';
  const isUnconfirmed = scenario === 'unconfirmed';
  const isDuplicate = scenario === 'duplicate';
  const isInvalid = scenario === 'invalid-reading';
  control.configure(zoneId, {
    mode: isDuplicate || isInvalid ? 'manual' : 'automatic',
    startBelow: 35,
    stopAt: isLoss || isUnconfirmed ? 80 : 45,
    maxDurationSeconds: isLoss || isUnconfirmed ? 12 : 60,
  });
  const frames: ExperimentReport['frames'] = [];
  const moments: ExperimentMoment[] = [];
  const rejectedReadings: number[] = [];
  let repeatedCommand: Command | null = null;
  let heldCommand: Command | null = null;
  let lateDeliveryAccepted: boolean | null = null;
  let lastValid: Telemetry | null = null;
  const key = randomUUID();
  const durationSeconds = 90;
  function moment(
    second: number,
    kind: ExperimentMoment['kind'],
    title: string,
    description: string,
    source: ExperimentMoment['source'] = 'test',
  ) {
    moments.push({ second, kind, title, description, source });
  }
  for (let second = 1; second <= durationSeconds; second++) {
    now = start + second * 1000;
    const communication = !(((isLoss && second >= 5) || (isUnconfirmed && second >= 1)) && second < 30);
    if ((isLoss && second === 5) || (isUnconfirmed && second === 1))
      moment(
        second,
        'fault',
        isUnconfirmed ? 'Confirmação descartada' : 'Contato interrompido',
        isUnconfirmed
          ? 'O ensaio deixa a abertura chegar, mas descarta o ACK e as próximas leituras.'
          : 'Leituras e comandos deixam de circular. O relógio do dispositivo continua.',
      );
    if ((isLoss || isUnconfirmed) && second === 30)
      moment(
        second,
        'recovery',
        'Contato restabelecido',
        'A API volta a receber o estado e o volume acumulado do dispositivo.',
      );
    const deviceMoisture: Record<string, number> = {};
    for (const id of ['north', 'south'] as const) {
      const device = devices[id];
      const wasOpen = device.valveState === 'open';
      const reading = device.step(1, now);
      deviceMoisture[id] = reading.moisture;
      const target = id === zoneId;
      const deliverReading = !target || communication || (isUnconfirmed && second === 1);
      if (deliverReading) {
        if (target && isInvalid && second >= 5 && second <= 9) {
          const samples: Record<number, unknown> = {
            5: { ...reading, moisture: 130 },
            6: { ...reading, moisture: -10 },
            7: { ...reading, unit: 'celsius' },
            8: { ...reading, moisture: undefined },
            9: lastValid,
          };
          try {
            control.telemetry(samples[second] as Telemetry);
            moment(
              second,
              'fault',
              'Amostra indevida aceita',
              'O controlador aceitou uma amostra injetada inválida; a verificação deve falhar.',
              'controller',
            );
          } catch (error) {
            if (!(error instanceof ZodError) && !(error instanceof ControlError)) throw error;
            rejectedReadings.push(second);
            const reason =
              error instanceof ZodError
                ? 'Amostra rejeitada pelo contrato: ' +
                  (
                    {
                      5: 'umidade de 130%, acima de 100%.',
                      6: 'umidade negativa (-10%).',
                      7: 'unidade incorreta para a umidade do solo.',
                      8: 'valor de umidade ausente.',
                    } as Record<number, string>
                  )[second]
                : error.message;
            moment(second, 'fault', 'Leitura rejeitada', reason, 'controller');
          }
        } else {
          control.telemetry(reading);
          if (target) {
            lastValid = reading;
            if (second === 1)
              moment(
                second,
                'reading',
                'Primeira leitura recebida',
                reading.moisture.toFixed(1) +
                  '% de umidade normalizada; limites de ' +
                  35 +
                  '% e ' +
                  (isLoss || isUnconfirmed ? 80 : 45) +
                  '%.',
                'controller',
              );
            if (isInvalid && second === 10)
              moment(
                second,
                'recovery',
                'Leitura válida recebida',
                'A sequência avança e a API volta a atualizar a medição.',
                'controller',
              );
          }
        }
        if (target && isDuplicate && second <= 4) {
          repeatedCommand = control.command(zoneId, {
            action: 'open',
            durationSeconds: 12,
            idempotencyKey: key,
          });
          moment(
            second,
            'command',
            second === 1 ? 'Início manual solicitado' : 'Mesmo início reenviado',
            'Solicitação ' +
              second +
              '/4 com a mesma chave; comando retornado: ' +
              repeatedCommand.id.slice(0, 8) +
              '.',
          );
        }
        if (target && scenario === 'manual-stop' && second === 4) {
          control.command(zoneId, { action: 'close', idempotencyKey: randomUUID() });
          moment(
            second,
            'decision',
            'Parada manual solicitada',
            'A parada tem prioridade sobre a regra automática, mesmo com solo ainda abaixo de 35%.',
          );
        }
        for (const command of control.pending(device.deviceId)) {
          if (target && scenario === 'command-timeout') {
            heldCommand ??= command;
            if (second === 1)
              moment(
                second,
                'fault',
                'Entrega retida',
                'A solicitação está na API, mas ainda não foi recebida pelo dispositivo.',
              );
            continue;
          }
          if (device.apply(command, now) && !(target && isUnconfirmed && second < 30))
            control.acknowledge({
              deviceId: device.deviceId,
              commandId: command.id,
              status: 'applied',
              valve: command.action === 'open' ? 'open' : 'closed',
            });
        }
        if (target && isDuplicate && repeatedCommand) device.apply(repeatedCommand, now);
      }
      if (target && scenario === 'command-timeout' && second === 12 && heldCommand) {
        lateDeliveryAccepted = device.apply(heldCommand, now);
        moment(
          second,
          'fault',
          'Entrega tardia ' + (lateDeliveryAccepted ? 'aceita' : 'recusada'),
          'O dispositivo verificou a validade do comando aos 12 s; sua expiração ocorreu aos 9 s.',
          'device',
        );
      }
      if (target && wasOpen !== (device.valveState === 'open'))
        moment(
          second,
          'water',
          device.valveState === 'open' ? 'Água liberada no modelo' : 'Fluxo interrompido no modelo',
          device.valveState === 'open'
            ? '18 gotejadores compartilham a vazão nominal de 36 L/h.'
            : device.water.totalLiters.toFixed(3) +
                ' L acumulados. Este é o estado interno, que só chega ao operador por comunicação.',
          'device',
        );
    }
    const snapshot = control.snapshot();
    frames.push({
      second,
      at: now,
      zones: snapshot.zones,
      commands: snapshot.commands,
      deviceOpen: { north: devices.north.valveState === 'open', south: devices.south.valveState === 'open' },
      deviceWater: { north: devices.north.water, south: devices.south.water },
      deviceMoisture,
      communication,
    });
  }
  const final = control.snapshot();
  for (const event of final.events) {
    if (event.zoneId !== zoneId) continue;
    const second = Math.max(1, Math.round((event.at - start) / 1000));
    const command = final.commands.find((item) => item.id === event.commandId);
    const reading = final.readings.find((item) => item.zoneId === zoneId && item.receivedAt === event.at);
    moments.push({
      second,
      source: 'controller',
      kind:
        event.type === 'rule' || event.type === 'safety'
          ? 'decision'
          : event.type === 'applied'
            ? 'confirmation'
            : event.type === 'command'
              ? 'command'
              : 'fault',
      title: event.message,
      description: command
        ? 'Origem: ' +
          (command.origin === 'automatic' ? 'regra automática' : 'solicitação manual') +
          (reading ? ' · leitura: ' + reading.moisture.toFixed(1) + '%.' : '.')
        : 'Regra e estado registrados pelo controlador.',
      ...(event.commandId ? { commandId: event.commandId } : {}),
    });
  }
  // Stable tie order: reading, decision, request, ACK, physical effect; injected faults retain their timestamps.
  const order = { reading: 0, decision: 1, command: 2, confirmation: 3, water: 4, fault: 5, recovery: 6 };
  moments.sort((a, b) => a.second - b.second || order[a.kind] - order[b.kind]);
  return {
    version: '1.1',
    model: 'linear-educational-v3',
    id: randomUUID(),
    createdAt: Date.now(),
    input: parameters,
    durationSeconds,
    stepSeconds: 1,
    frames,
    readings: final.readings,
    events: final.events,
    moments,
    checks: evaluateExperiment(parameters, frames, final, { rejectedReadings, lateDeliveryAccepted }),
    metrics: {
      confirmedCommands: final.commands.filter((command) => command.status === 'applied').length,
      totalCommands: final.commands.length,
      openSeconds: frames.slice(0, -1).filter((frame) => frame.deviceOpen[zoneId]).length,
      totalLiters: devices[zoneId].water.totalLiters,
      inRangePercent:
        Math.round(
          (frames.filter((frame) => {
            const zone = frame.zones.find((item) => item.id === zoneId)!;
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
      'Modelo didático: 18 gotejadores de 2 L/h por canteiro. Volume = vazão nominal × tempo aberto; distribuição uniforme, sem perdas, pressão ou absorção calculadas.',
      'Umidade é um índice normalizado, não uma medição volumétrica calibrada. Taxas arbitrárias: +0,85 ponto/s irrigando, -0,15 parado e ruído de até 0,02 ponto por passo.',
      'Relógio virtual de 1 s e ACK imediato quando entregue. Ensaios não medem latência de rede, segurança física, economia de água ou desempenho agronômico.',
      'A maquete representa o que o operador consegue confirmar. O painel de observação distingue explicitamente o estado interno do simulador, inclusive durante falhas.',
      'Tempo aberto soma intervalos entre amostras; o último instante não adiciona tempo futuro. Volume é integrado pelo relógio do dispositivo, nunca pelo desenho ou pela velocidade de reprodução.',
      'Leituras recentes na faixa divididas pelos 90 passos; dados indisponíveis contam fora da faixa. Não é indicador de produtividade.',
      'Seed e versão reproduzem séries e métricas. IDs e data de exportação são únicos. Cada ensaio é isolado da sessão ao vivo.',
    ],
  };
}
