import type { Snapshot } from '../shared/contracts';
import type { ExperimentFrame, ExperimentParameters, ExperimentReport } from '../shared/experiments';

/** Criteria inspect the recorded behavior, rather than treating an injected fault as a passing test. */
export function evaluateExperiment(
  input: ExperimentParameters,
  frames: ExperimentFrame[],
  final: Snapshot,
  evidence: { rejectedReadings: number[]; lateDeliveryAccepted: boolean | null },
): ExperimentReport['checks'] {
  const { zoneId, scenario } = input;
  const otherId = zoneId === 'north' ? 'south' : 'north';
  const commands = final.commands;
  const zoneAt = (frame: ExperimentFrame) => frame.zones.find((zone) => zone.id === zoneId)!;
  const target = final.zones.find((zone) => zone.id === zoneId)!;
  const openFrames = frames.filter((frame) => frame.deviceOpen[zoneId]);
  const checks: ExperimentReport['checks'] = [
    {
      name: 'Isolamento entre sistemas',
      passed:
        frames.every((frame) => !frame.deviceOpen[otherId] && frame.deviceWater[otherId].totalLiters === 0) &&
        commands.every((command) => command.zoneId === zoneId),
      evidence:
        commands.filter((command) => command.zoneId === otherId).length +
        ' comandos e ' +
        frames.at(-1)!.deviceWater[otherId].totalLiters +
        ' L no outro canteiro.',
    },
  ];
  if (scenario === 'automatic') {
    const opens = commands.filter((command) => command.action === 'open');
    const closes = commands.filter((command) => command.action === 'close');
    checks.push(
      {
        name: 'Início abaixo de 35%',
        passed:
          opens.length > 0 &&
          opens.every((command) =>
            final.readings.some(
              (reading) =>
                reading.zoneId === zoneId &&
                reading.receivedAt === command.requestedAt &&
                reading.moisture < 35,
            ),
          ),
        evidence: opens.length + ' início(s) comparados com as leituras que os originaram.',
      },
      {
        name: 'Parada confirmada a partir de 45%',
        passed:
          closes.length > 0 &&
          closes.every(
            (command) =>
              command.status === 'applied' &&
              final.readings.some(
                (reading) =>
                  reading.zoneId === zoneId &&
                  reading.receivedAt === command.requestedAt &&
                  reading.moisture >= 45,
              ),
          ),
        evidence: closes.length + ' parada(s) com leitura de origem e confirmação verificadas.',
      },
    );
  } else if (scenario === 'manual-stop') {
    checks.push(
      {
        name: 'Parada manual aplicada com solo ainda seco',
        passed:
          commands.length === 2 &&
          commands[1].action === 'close' &&
          commands[1].origin === 'manual' &&
          commands[1].status === 'applied' &&
          zoneAt(frames[3]).latest!.moisture < 35 &&
          !frames[3].deviceOpen[zoneId],
        evidence: openFrames.length + ' s irrigando; parada registrada aos 4 s.',
      },
      {
        name: 'Automático suspenso sem nova abertura',
        passed:
          target.automaticPaused &&
          frames.slice(3).every((frame) => !frame.deviceOpen[zoneId]) &&
          commands.filter((command) => command.action === 'open').length === 1,
        evidence:
          'Automático ' +
          (target.automaticPaused ? 'suspenso' : 'ativo') +
          '; ' +
          commands.length +
          ' comandos no total.',
      },
    );
  } else if (scenario === 'command-timeout') {
    checks.push(
      {
        name: 'Solicitação expira sem confirmação',
        passed:
          commands.length === 1 &&
          commands[0].status === 'expired' &&
          commands[0].appliedAt === null &&
          frames[8].commands[0]?.status === 'expired',
        evidence:
          commands.filter((command) => command.status === 'expired').length + ' comando expirado, sem ACK.',
      },
      {
        name: 'Entrega vencida não abre nem consome água',
        passed:
          evidence.lateDeliveryAccepted === false &&
          openFrames.length === 0 &&
          frames.at(-1)!.deviceWater[zoneId].totalLiters === 0,
        evidence:
          'Entrega tardia ' +
          (evidence.lateDeliveryAccepted === false ? 'recusada' : 'não recusada') +
          '; ' +
          openFrames.length +
          ' s irrigando.',
      },
    );
  } else if (scenario === 'invalid-reading') {
    checks.push(
      {
        name: 'Cinco amostras inválidas ou antigas rejeitadas',
        passed:
          evidence.rejectedReadings.length === 5 &&
          frames
            .slice(4, 9)
            .every((frame) => zoneAt(frame).latest?.sequence === zoneAt(frames[3]).latest?.sequence) &&
          commands.length === 0,
        evidence: evidence.rejectedReadings.length + ' rejeições; ' + commands.length + ' comandos criados.',
      },
      {
        name: 'Recepção válida recuperada',
        passed:
          zoneAt(frames[9]).latest!.sequence === 10 &&
          zoneAt(frames[9]).latest!.receivedAt === frames[9].at &&
          final.readings.every(
            (reading) =>
              reading.moisture >= 0 && reading.moisture <= 100 && reading.unit === 'normalizedPercent',
          ),
        evidence: 'Sequência recebida aos 10 s: ' + zoneAt(frames[9]).latest?.sequence + '.',
      },
    );
  } else if (scenario === 'stuck-valve') {
    const close = commands.find((command) => command.action === 'close');
    const closeIndex = frames.findIndex((frame) => frame.at === close?.requestedAt);
    checks.push(
      {
        name: 'Fechamento rejeitado mantém estado incerto',
        passed:
          close?.status === 'rejected' &&
          close.appliedAt === null &&
          target.activeCommandId === close.id &&
          target.latest?.valve === 'open',
        evidence:
          'Fechamento ' +
          (close?.status ?? 'ausente') +
          '; última válvula reportada ' +
          (target.latest?.valve ?? 'sem leitura') +
          '.',
      },
      {
        name: 'Fluxo e consumo continuam após a falha',
        passed:
          closeIndex >= 0 &&
          frames.slice(closeIndex).every((frame) => frame.deviceOpen[zoneId]) &&
          frames.at(-1)!.deviceWater[zoneId].totalLiters > frames[closeIndex].deviceWater[zoneId].totalLiters,
        evidence:
          openFrames.length +
          ' quadros com fluxo; volume final ' +
          frames.at(-1)!.deviceWater[zoneId].totalLiters.toFixed(3) +
          ' L.',
      },
    );
  } else {
    checks.push({
      name: 'Dispositivo respeita o prazo local de 12 s',
      passed: openFrames.length === 12 && frames.slice(12).every((frame) => !frame.deviceOpen[zoneId]),
      evidence:
        openFrames.length +
        ' s irrigando; volume final ' +
        frames.at(-1)!.deviceWater[zoneId].totalLiters.toFixed(3) +
        ' L.',
    });
    if (scenario === 'duplicate')
      checks.push({
        name: 'Repetições preservam uma única aplicação',
        passed:
          commands.length === 1 &&
          commands[0].status === 'applied' &&
          final.events.filter((event) => event.type === 'applied').length === 1,
        evidence:
          '4 solicitações; ' +
          commands.length +
          ' comando e ' +
          final.events.filter((event) => event.type === 'applied').length +
          ' confirmação.',
      });
    else if (scenario === 'unconfirmed')
      checks.push({
        name: 'Sem confirmação inventada durante a perda',
        passed:
          commands.length === 1 &&
          commands[0].status === 'expired' &&
          final.events.every((event) => event.type !== 'applied') &&
          frames[4].deviceOpen[zoneId] &&
          zoneAt(frames[4]).latest?.valve === 'closed' &&
          zoneAt(frames[29]).latest?.water?.totalLiters === frames[29].deviceWater[zoneId].totalLiters,
        evidence:
          'Abertura interna sem ACK; comando ' + commands[0]?.status + '. Volume reconciliado aos 30 s.',
      });
    else
      checks.push({
        name: 'Estado desconhecido e reconciliação segura',
        passed:
          target.automaticPaused &&
          commands.length === 1 &&
          frames[19].at - zoneAt(frames[19]).latest!.receivedAt >= 10000 &&
          zoneAt(frames[19]).latest?.valve === 'open' &&
          !frames[19].deviceOpen[zoneId] &&
          zoneAt(frames[29]).latest?.water?.totalLiters === frames[29].deviceWater[zoneId].totalLiters,
        evidence:
          'Último estado recebido difere do interno na falha; automático ' +
          (target.automaticPaused ? 'suspenso' : 'ativo') +
          ' após reconexão.',
      });
  }
  return checks;
}
