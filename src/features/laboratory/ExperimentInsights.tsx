import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ExperimentReport } from '../../../shared/experiments';
import { zoneStatus } from '../irrigation/session';
import { replaySnapshot } from './report';

export function ExperimentInsights({
  report,
  index,
  onSeek,
}: {
  report: ExperimentReport;
  index: number;
  onSeek: (index: number) => void;
}) {
  const frame = report.frames[index],
    id = report.input.zoneId;
  const zone = frame.zones.find((item) => item.id === id)!;
  const state = replaySnapshot(report, index);
  const status = zoneStatus(zone, state, true);
  const age = zone.latest ? (frame.at - zone.latest.receivedAt) / 1000 : null;
  const data = report.frames.map((item) => {
    const received = item.zones.find((candidate) => candidate.id === id)!.latest;
    const fresh = received && item.at - received.receivedAt < 10000;
    return {
      second: item.second,
      moisture: item.deviceMoisture[id],
      receivedMoisture: fresh ? received.moisture : null,
      water: item.deviceWater[id].totalLiters,
      receivedWater: fresh ? received.water?.totalLiters : null,
    };
  });
  const active = report.moments.filter((moment) => moment.second <= frame.second).at(-1);
  return (
    <div className="experiment-insights">
      <div className="observer-pair">
        <section>
          <span className="eyebrow">O QUE O APLICATIVO SABE</span>
          <h3>{status.label}</h3>
          <p>
            Última leitura: <b>{zone.latest?.moisture.toFixed(1) ?? '—'}%</b> · recebida há {age ?? '—'} s.
          </p>
          <p>
            Volume recebido: <b>{zone.latest?.water?.totalLiters.toFixed(3) ?? '—'} L</b>.
          </p>
          <p>
            {status.uncertain
              ? 'A maquete não confirma fluxo. O último valor continua identificado como informação anterior.'
              : status.pending
                ? 'A solicitação ainda aguarda confirmação; enviar não significa aplicar.'
                : 'A maquete usa este estado confirmado, com a idade da leitura preservada.'}
          </p>
        </section>
        <section>
          <span className="eyebrow">OBSERVAÇÃO INTERNA DO SIMULADOR</span>
          <h3>Válvula {frame.deviceOpen[id] ? 'aberta' : 'fechada'}</h3>
          <p>
            Solo no modelo: <b>{frame.deviceMoisture[id].toFixed(1)}%</b> · fluxo:{' '}
            <b>{frame.deviceWater[id].flowLitersPerHour} L/h</b>.
          </p>
          <p>
            Volume acumulado: <b>{frame.deviceWater[id].totalLiters.toFixed(3)} L</b>.
          </p>
          <p>
            {frame.communication
              ? 'Canal de comunicação disponível no ensaio.'
              : 'Comunicação interrompida no ensaio. Estes dados internos ainda não chegaram ao aplicativo.'}
          </p>
        </section>
      </div>
      <section className="signal-chart" aria-label="Gráfico de umidade do solo">
        <h3>Solo: leitura recebida e evolução interna</h3>
        <p>
          Índice normalizado (%). Verde: interno · azul tracejado: recebido. Lacunas indicam leitura
          desatualizada.
        </p>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={data} margin={{ top: 12, right: 14, left: -18, bottom: 0 }}>
            <XAxis dataKey="second" unit=" s" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
            <Tooltip labelFormatter={(value) => value + ' s'} />
            <ReferenceLine y={zone.rule.startBelow} stroke="#97a58a" strokeDasharray="3 4" />
            <ReferenceLine y={zone.rule.stopAt} stroke="#97a58a" strokeDasharray="3 4" />
            <ReferenceLine x={frame.second} stroke="#704ba0" />
            <Line
              name="Solo interno (%)"
              dataKey="moisture"
              stroke="#20734f"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              name="Leitura recebida (%)"
              dataKey="receivedMoisture"
              stroke="#187da2"
              strokeDasharray="5 4"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>
      <section className="signal-chart" aria-label="Gráfico de volume de água">
        <h3>Água: consumo nominal acumulado</h3>
        <p>
          Litros. Verde: dispositivo · azul tracejado: recebido. As séries completas mostram os 90 s; a linha
          vertical acompanha a reprodução.
        </p>
        <ResponsiveContainer width="100%" height={215}>
          <LineChart data={data} margin={{ top: 12, right: 14, left: -10, bottom: 0 }}>
            <XAxis dataKey="second" unit=" s" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 'auto']} width={65} tick={{ fontSize: 11 }} />
            <Tooltip labelFormatter={(value) => value + ' s'} />
            <ReferenceLine x={frame.second} stroke="#704ba0" />
            <Line
              name="Volume interno (L)"
              dataKey="water"
              stroke="#20734f"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              name="Volume recebido (L)"
              dataKey="receivedWater"
              stroke="#187da2"
              strokeDasharray="5 4"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>
      <section className="event-story">
        <h3>O que aconteceu, passo a passo</h3>
        <p>Toque em um acontecimento para pausar naquele instante. A lista inclui o ensaio completo.</p>
        <ol>
          {report.moments.map((moment, momentIndex) => (
            <li key={momentIndex}>
              <button
                className={moment === active ? 'current' : ''}
                aria-current={moment === active ? 'step' : undefined}
                onClick={() => onSeek(Math.max(0, moment.second - 1))}
              >
                <time>{moment.second} s</time>
                <span>
                  <small>
                    {moment.source === 'controller'
                      ? 'API'
                      : moment.source === 'device'
                        ? 'Dispositivo simulado'
                        : 'Intervenção do teste'}
                  </small>
                  <b>{moment.title}</b>
                  <span>{moment.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
