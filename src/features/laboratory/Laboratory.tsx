import { lazy, Suspense, useEffect, useState } from 'react';
import { IonButton } from '@ionic/react';
import { Link } from 'react-router-dom';
import { CheckCircle2, TriangleAlert, FlaskConical, Play, Pause, Download } from 'lucide-react';
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Page } from '../irrigation/Page';
import { request, useSession, zoneStatus } from '../irrigation/session';
import { scenarios } from '../../../shared/experiments';
import type { ExperimentInput, ExperimentReport } from '../../../shared/experiments';
import type { Snapshot } from '../../../shared/contracts';
import { perPlantMilliliters } from '../../../shared/water';
import { LiveControls } from './LiveControls';

const FieldScene = lazy(() => import('./FieldScene'));
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Laboratory() {
  const session = useSession();
  const [scenario, setScenario] = useState<ExperimentInput['scenario']>('automatic');
  const [seed, setSeed] = useState('2026');
  const [report, setReport] = useState<ExperimentReport | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('5');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!playing || !report) return;
    const timer = setInterval(
      () =>
        setFrameIndex((index) => {
          if (index >= report.frames.length - 1) {
            setPlaying(false);
            return index;
          }
          return index + 1;
        }),
      1000 / Number(speed),
    );
    return () => clearInterval(timer);
  }, [playing, report, speed]);
  async function run(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setRunning(true);
    setPlaying(false);
    try {
      const result = await request<ExperimentReport>('/api/v1/experiments', 'POST', {
        scenario,
        seed: Number(seed),
      });
      setReport(result);
      setFrameIndex(0);
      setPlaying(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível executar.');
    } finally {
      setRunning(false);
    }
  }
  const frame = report?.frames[frameIndex];
  const state: Snapshot | null =
    frame && report
      ? {
          schemaVersion: '1.0',
          createdAt: report.frames[0].at,
          serverTime: frame.at,
          environment: 'local-simulation',
          offlineAfterMs: 10000,
          zones: frame.zones,
          commands: frame.commands,
          readings: report.readings.filter((reading) => reading.receivedAt <= frame.at),
          events: report.events.filter((event) => event.at <= frame.at),
        }
      : session.state;
  const connected = report ? true : session.connected;
  const selected = state?.zones.find((zone) => zone.id === session.selectedId);
  const chart = report?.frames.map((item) => ({
    second: item.second,
    moisture: item.zones.find((zone) => zone.id === session.selectedId)?.latest?.moisture ?? null,
    deviceOpen: item.deviceOpen[session.selectedId] ? 100 : 0,
  }));
  function exportCsv() {
    if (!report) return;
    const rows = [
      'scenario,seed,second,zone,moisture_normalized_percent,reading_age_ms,device_valve_open,communication,device_total_liters,device_flow_liters_per_hour,estimated_ml_per_plant,received_total_liters',
    ];
    for (const item of report.frames)
      for (const zone of item.zones)
        rows.push(
          [
            report.input.scenario,
            report.input.seed,
            item.second,
            zone.id,
            zone.latest?.moisture ?? '',
            zone.latest ? item.at - zone.latest.receivedAt : '',
            Number(item.deviceOpen[zone.id]),
            Number(zone.id === 'south' || item.communication),
            item.deviceWater[zone.id].totalLiters,
            item.deviceWater[zone.id].flowLitersPerHour,
            perPlantMilliliters(item.deviceWater[zone.id].totalLiters),
            zone.latest?.water?.totalLiters ?? '',
          ].join(','),
        );
    download(`irrint-${report.input.scenario}-${report.id}.csv`, rows.join('\r\n'), 'text/csv;charset=utf-8');
  }
  return (
    <Page title="Laboratório">
      <div className="section-heading">
        <div>
          <p className="eyebrow">DA REGRA À DEMONSTRAÇÃO</p>
          <h1>Laboratório de irrigação</h1>
        </div>
        <Link className="settings-link" to="/app/history">
          Voltar ao histórico
        </Link>
      </div>
      <p className="intro-text">
        Veja como o sistema responde em três situações. Cada experimento começa com duas áreas novas e usa o
        mesmo controlador da demonstração ao vivo.
      </p>
      <form className="experiment-form" onSubmit={(event) => void run(event)}>
        <label className="field">
          <span>Cenário</span>
          <select
            value={scenario}
            onChange={(event) => setScenario(event.target.value as ExperimentInput['scenario'])}
          >
            {scenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field seed-field">
          <span>Seed da execução</span>
          <input
            required
            type="number"
            min="1"
            max="2147483646"
            step="1"
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
          />
        </label>
        <IonButton type="submit" disabled={running || !session.connected}>
          <FlaskConical size={18} aria-hidden="true" />
          &nbsp; {running ? 'Executando…' : 'Executar cenário'}
        </IonButton>
        <p>{scenarios.find((item) => item.id === scenario)?.description}</p>
      </form>
      {error && (
        <p className="pause-note" role="alert">
          {error}
        </p>
      )}
      <div className="lab-source">
        <strong>
          {report
            ? `REPLAY · ${scenarios.find((item) => item.id === report.input.scenario)?.name}`
            : 'AO VIVO · DISPOSITIVOS SIMULADOS'}
        </strong>
        {report && (
          <button
            onClick={() => {
              setPlaying(false);
              setReport(null);
            }}
          >
            Voltar ao vivo
          </button>
        )}
      </div>
      {state && (
        <LiveControls
          replay={!!report}
          onReturnLive={() => {
            setPlaying(false);
            setReport(null);
          }}
        />
      )}
      {state && (
        <Suspense fallback={<p className="scene-fallback">Carregando a maquete 3D…</p>}>
          <FieldScene
            state={state}
            connected={connected}
            selectedId={session.selectedId}
            onSelect={session.select}
            onInspect={() => setPlaying(false)}
            replay={frame ? { second: frame.second, playing, speed: Number(speed) } : undefined}
          />
        </Suspense>
      )}
      {report && (
        <div className="replay-controls">
          <button
            onClick={() => {
              if (frameIndex === report.frames.length - 1) setFrameIndex(0);
              setPlaying((value) => !value);
            }}
            aria-label={playing ? 'Pausar replay' : 'Reproduzir replay'}
          >
            {playing ? <Pause size={19} /> : <Play size={19} />}
          </button>
          <label>
            <span>
              Tempo simulado · {frame?.second} / {report.durationSeconds} s
            </span>
            <input
              type="range"
              aria-label="Tempo do replay"
              min="0"
              max={report.frames.length - 1}
              value={frameIndex}
              onChange={(event) => {
                setPlaying(false);
                setFrameIndex(Number(event.target.value));
              }}
            />
          </label>
          <label className="speed-picker">
            <span className="sr-only">Velocidade do replay</span>
            <select value={speed} onChange={(event) => setSpeed(event.target.value)}>
              <option value="1">1×</option>
              <option value="5">5×</option>
              <option value="10">10×</option>
            </select>
          </label>
        </div>
      )}
      <div className="lab-zones">
        {state?.zones.map((zone) => {
          const status = zoneStatus(zone, state, connected);
          return (
            <button
              key={zone.id}
              className={session.selectedId === zone.id ? 'selected' : ''}
              onClick={() => session.select(zone.id)}
            >
              <span>{zone.name}</span>
              <strong>
                {zone.latest?.moisture.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) ?? '—'}%
              </strong>
              <span>{status.label}</span>
              <small>{status.online ? 'Leitura recente' : 'Último estado conhecido'}</small>
            </button>
          );
        })}
      </div>
      <p className="small-note">
        Maquete esquemática, sem escala construtiva. A água animada depende da confirmação do dispositivo; em
        uma falha de comunicação, o estado fica incerto. O índice do solo muda conforme a última leitura.
      </p>
      {report && (
        <>
          <section className="lab-results" aria-label="Resultados do experimento">
            <div className="section-heading">
              <div>
                <p className="eyebrow">RESULTADO DA EXECUÇÃO COMPLETA</p>
                <h2>
                  {report.checks.filter((check) => check.passed).length} de {report.checks.length}{' '}
                  verificações atendidas
                </h2>
              </div>
              <div className="export-actions">
                <IonButton
                  fill="outline"
                  onClick={() =>
                    download(
                      `irrint-${report.input.scenario}-${report.id}.json`,
                      JSON.stringify(report, null, 2),
                      'application/json',
                    )
                  }
                >
                  <Download size={17} aria-hidden="true" />
                  &nbsp; JSON
                </IonButton>
                <IonButton fill="outline" onClick={exportCsv}>
                  CSV
                </IonButton>
              </div>
            </div>
            <div className="metrics">
              <div>
                <span>Comandos confirmados</span>
                <strong>
                  {report.metrics.confirmedCommands}/{report.metrics.totalCommands}
                </strong>
              </div>
              <div>
                <span>Válvula norte aberta</span>
                <strong>{report.metrics.openSeconds} s</strong>
              </div>
              <div>
                <span>Leitura norte na faixa</span>
                <strong>{report.metrics.inRangePercent}%</strong>
              </div>
              <div>
                <span>Volume total estimado</span>
                <strong>
                  {report.metrics.totalLiters.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} L
                </strong>
              </div>
            </div>
            <ul className="check-list">
              {report.checks.map((check) => (
                <li key={check.name}>
                  {check.passed ? (
                    <CheckCircle2 aria-label="Atendido" size={20} />
                  ) : (
                    <TriangleAlert aria-label="Falhou" size={20} />
                  )}
                  <div>
                    <strong>{check.name}</strong>
                    <p>{check.evidence}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="small-note">
              Estas verificações pertencem a este cenário. A suíte de testes do projeto tem cobertura e
              execução próprias. O volume final usa o estado interno dos dispositivos, inclusive durante perda
              de comunicação; os cartões da maquete mostram apenas a telemetria recebida até o instante
              selecionado.
            </p>
          </section>
          <section className="chart-section">
            <h2>{selected?.name} · execução completa</h2>
            <p className="small-note">
              Verde: última umidade recebida. Azul tracejado: válvula do dispositivo simulado (100 = aberta; 0
              = fechada), inclusive sem contato com a API.
            </p>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 15, right: 10, bottom: 5, left: -20 }}>
                  <XAxis dataKey="second" unit=" s" minTickGap={35} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <ReferenceLine x={frame?.second} stroke="#a55c21" />
                  <Line
                    dataKey="moisture"
                    name="Índice de umidade"
                    stroke="#197252"
                    dot={false}
                    isAnimationActive={false}
                    strokeWidth={2}
                  />
                  <Line
                    dataKey="deviceOpen"
                    name="Válvula simulada (0/100)"
                    stroke="#49a2b0"
                    strokeDasharray="4 4"
                    type="stepAfter"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <details className="model-details">
            <summary>Parâmetros, método e limites da simulação</summary>
            <p>
              Modelo {report.model} · seed {report.input.seed} · {report.durationSeconds} s · passo{' '}
              {report.stepSeconds} s. Execução {report.id}.
            </p>
            <ul>
              {report.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </Page>
  );
}
