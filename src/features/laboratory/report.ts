import type { Snapshot } from '../../../shared/contracts';
import { scenarios, type ExperimentReport } from '../../../shared/experiments';
import { perPlantMilliliters } from '../../../shared/water';

export function replaySnapshot(report: ExperimentReport, index: number): Snapshot {
  const frame = report.frames[index];
  return {
    schemaVersion: '1.0',
    environment: 'local-simulation',
    offlineAfterMs: 10000,
    createdAt: report.frames[0].at,
    serverTime: frame.at,
    zones: frame.zones,
    commands: frame.commands,
    readings: report.readings.filter((reading) => reading.receivedAt <= frame.at),
    events: report.events.filter((event) => event.at <= frame.at),
  };
}

/** Both systems are exported; received values are never replaced by simulator observations. */
export function experimentCsv(report: ExperimentReport) {
  const rows = [
    'report_id,model,scenario,seed,target_zone,second,zone,received_moisture_percent,reading_age_ms,received_valve,command_status,device_moisture_percent,device_valve_open,communication,device_total_liters,device_flow_liters_per_hour,estimated_ml_per_plant,received_total_liters',
  ];
  for (const frame of report.frames)
    for (const zone of frame.zones)
      rows.push(
        [
          report.id,
          report.model,
          report.input.scenario,
          report.input.seed,
          report.input.zoneId,
          frame.second,
          zone.id,
          zone.latest?.moisture ?? '',
          zone.latest ? frame.at - zone.latest.receivedAt : '',
          zone.latest?.valve ?? '',
          frame.commands.find((command) => command.id === zone.activeCommandId)?.status ?? '',
          frame.deviceMoisture[zone.id],
          Number(frame.deviceOpen[zone.id]),
          Number(zone.id !== report.input.zoneId || frame.communication),
          frame.deviceWater[zone.id].totalLiters,
          frame.deviceWater[zone.id].flowLitersPerHour,
          perPlantMilliliters(frame.deviceWater[zone.id].totalLiters),
          zone.latest?.water?.totalLiters ?? '',
        ].join(','),
      );
  return rows.join('\r\n');
}

/** A standalone, printable handout; no remote resources or runtime dependencies. */
export function experimentHandout(report: ExperimentReport) {
  const escape = (value: unknown) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char]!,
    );
  const scenario = scenarios.find((item) => item.id === report.input.scenario)!;
  const zone = report.frames[0].zones.find((item) => item.id === report.input.zoneId)!;
  const checks = report.checks
    .map(
      (check) =>
        '<tr><td>' +
        escape(check.name) +
        '</td><td>' +
        (check.passed ? 'Atendido' : 'Falhou') +
        '</td><td>' +
        escape(check.evidence) +
        '</td></tr>',
    )
    .join('');
  const moments = report.moments
    .map(
      (moment) =>
        '<tr><td>' +
        moment.second +
        ' s</td><td>' +
        escape(moment.source) +
        '</td><td><b>' +
        escape(moment.title) +
        '</b><br>' +
        escape(moment.description) +
        '</td></tr>',
    )
    .join('');
  return (
    '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Irrint — relatório de ensaio</title><style>body{font:16px/1.55 system-ui;max-width:960px;margin:40px auto;padding:0 22px;color:#173d30}h1{font-size:30px}h2{margin-top:32px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #cbd7cf;padding:9px;text-align:left}small{overflow-wrap:anywhere}.note{padding:16px;background:#edf4ef}@media print{body{margin:0;max-width:none}tr{break-inside:avoid}h2{break-after:avoid}}</style>' +
    '<h1>Laboratório de irrigação</h1><p class="note">Ensaio simulado de software. Não é medição de hardware, economia de água ou produtividade agrícola.</p>' +
    '<h2>' +
    escape(scenario.name) +
    ' · ' +
    escape(zone.name) +
    '</h2><p>' +
    escape(scenario.description) +
    '</p><p><b>Esperado:</b> ' +
    escape(scenario.expected) +
    '</p><p>Seed: ' +
    report.input.seed +
    ' · Duração: ' +
    report.durationSeconds +
    ' s · Passo: ' +
    report.stepSeconds +
    ' s · Modelo: ' +
    escape(report.model) +
    '</p><small>Execução: ' +
    escape(report.id) +
    ' · Gerada em ' +
    escape(new Date(report.createdAt).toISOString()) +
    '</small>' +
    '<h2>Resultado completo dos 90 s</h2><p>' +
    report.metrics.openSeconds +
    ' s de válvula aberta · ' +
    report.metrics.totalLiters.toFixed(3) +
    ' L nominais · ' +
    perPlantMilliliters(report.metrics.totalLiters).toFixed(1) +
    ' mL por planta · ' +
    report.metrics.confirmedCommands +
    '/' +
    report.metrics.totalCommands +
    ' comandos confirmados.</p>' +
    '<p>18 plantas e 18 gotejadores de 2 L/h no sistema selecionado. Volume acumulado no dispositivo, repartido uniformemente; não mede absorção da planta.</p>' +
    '<table><thead><tr><th>Critério</th><th>Resultado</th><th>Evidência</th></tr></thead><tbody>' +
    checks +
    '</tbody></table><h2>Sequência do ensaio</h2><p>controller = API; device = estado interno do simulador; test = intervenção do ensaio.</p>' +
    '<table><thead><tr><th>Tempo</th><th>Origem</th><th>Acontecimento</th></tr></thead><tbody>' +
    moments +
    '</tbody></table><h2>Limites da evidência</h2><ul>' +
    report.limitations.map((line) => '<li>' + escape(line) + '</li>').join('') +
    '</ul><p>Use Imprimir no navegador para salvar em PDF. CSV e JSON da mesma execução permitem conferir as séries e os identificadores.</p></html>'
  );
}
