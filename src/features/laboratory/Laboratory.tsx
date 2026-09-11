import { lazy, Suspense, useEffect, useState } from 'react';
import { IonButton } from '@ionic/react';
import { Link } from 'react-router-dom';
import { CheckCircle2, TriangleAlert, FlaskConical, Play, Pause } from 'lucide-react';
import { Page } from '../irrigation/Page';
import { request, zoneStatus } from '../irrigation/session';
import { scenarios } from '../../../shared/experiments';
import type { ExperimentInput, ExperimentReport } from '../../../shared/experiments';
import type { Snapshot } from '../../../shared/contracts';
import { perPlantMilliliters } from '../../../shared/water';
import { ExperimentInsights } from './ExperimentInsights';
import { experimentCsv, experimentHandout, replaySnapshot } from './report';
import './laboratory.css';
import './experiment.css';

const FieldScene = lazy(() => import('./FieldScene'));
const systems = [
  { id: 'north', name: 'Horta norte (N)' },
  { id: 'south', name: 'Canteiro sul (S)' },
] as const;
const preview: Snapshot = {
  schemaVersion: '1.0',
  environment: 'local-simulation',
  offlineAfterMs: 10000,
  createdAt: 0,
  serverTime: 0,
  commands: [],
  readings: [],
  events: [],
  zones: systems.map((system) => ({
    ...system,
    ownerId: 'demo-producer',
    crop: 'Demonstração',
    deviceId: 'sim-' + system.id,
    sensorId: 'soil-' + system.id,
    valveId: 'valve-' + system.id,
    automaticPaused: false,
    latest: null,
    activeCommandId: null,
    rule: { mode: 'manual', startBelow: 35, stopAt: 45, maxDurationSeconds: 60 },
  })),
};
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Laboratory() {
  const [zoneId, setZoneId] = useState<'north' | 'south'>('north');
  const [scenario, setScenario] = useState<ExperimentInput['scenario']>('automatic');
  const [seed, setSeed] = useState('2026');
  const [report, setReport] = useState<ExperimentReport | null>(null);
  const [history, setHistory] = useState<ExperimentReport[]>([]);
  const [view, setView] = useState<'scene' | 'explain' | 'results'>('scene');
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('1');
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
  function prepare() {
    setReport(null);
    setPlaying(false);
    setFrameIndex(0);
    setView('scene');
    setError('');
  }
  function seek(index: number) {
    setFrameIndex(index);
    setPlaying(false);
  }
  async function run(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setRunning(true);
    setPlaying(false);
    try {
      const result = await request<ExperimentReport>('/api/v1/experiments', 'POST', {
        scenario,
        zoneId,
        seed: Number(seed),
      });
      setReport(result);
      setHistory((items) => [result, ...items].slice(0, scenarios.length));
      setFrameIndex(0);
      setView('scene');
      setPlaying(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível executar.');
    } finally {
      setRunning(false);
    }
  }
  const frame = report?.frames[frameIndex];
  const state = report ? replaySnapshot(report, frameIndex) : preview;
  const selected = state.zones.find((zone) => zone.id === zoneId)!;
  const status = zoneStatus(selected, state, true);
  const selectedScenario = scenarios.find((item) => item.id === scenario)!;
  const latestMoment = report?.moments.filter((moment) => moment.second <= (frame?.second ?? 0)).at(-1);
  const receivedWater = selected.latest?.water?.totalLiters;
  const stuckFaultActive =
    report?.input.scenario === 'stuck-valve' &&
    frame?.commands.some((command) => command.action === 'close' && command.status === 'rejected');
  const prefix = report
    ? 'irrint-' + report.input.scenario + '-' + report.input.zoneId + '-' + report.id
    : '';
  return (
    <Page title="Laboratório">
      <div className="section-heading lab-heading">
        <div>
          <h1>Laboratório 3D</h1>
        </div>
        <Link className="settings-link" to="/app/history">
          Histórico
        </Link>
      </div>
      <p className="intro-text lab-intro">Escolha o sistema e veja como ele responde ao teste.</p>
      <form className="lab-test-form" onSubmit={(event) => void run(event)}>
        <fieldset disabled={running}>
          <legend className="sr-only">Preparar teste</legend>
          <label className="field">
            <span>Sistema</span>
            <select
              value={zoneId}
              onChange={(event) => {
                prepare();
                setZoneId(event.target.value as 'north' | 'south');
              }}
            >
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Teste</span>
            <select
              value={scenario}
              onChange={(event) => {
                prepare();
                setScenario(event.target.value as ExperimentInput['scenario']);
              }}
            >
              {scenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <IonButton type="submit" disabled={running}>
            <FlaskConical size={18} aria-hidden="true" />
            &nbsp;{running ? 'Executando…' : 'Executar teste'}
          </IonButton>
        </fieldset>
        <p className="test-description">{selectedScenario.description}</p>
        <details className="test-parameters">
          <summary>Resultado esperado e parâmetros</summary>
          <p>
            <b>Esperado:</b> {selectedScenario.expected}
          </p>
          <label className="field">
            <span>Seed para repetir o ensaio</span>
            <input
              type="number"
              required
              min="1"
              max="2147483646"
              step="1"
              value={seed}
              disabled={running}
              onChange={(event) => {
                prepare();
                setSeed(event.target.value);
              }}
            />
          </label>
          <p>
            90 segundos simulados · passo de 1 s · 18 plantas por sistema · vazão nominal de 36 L/h. Cada
            teste começa do zero e mantém a sessão ao vivo separada.
          </p>
        </details>
      </form>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      <div className="lab-view-switch" role="group" aria-label="Modo de visualização">
        {(
          [
            { id: 'scene', label: 'Maquete 3D' },
            { id: 'explain', label: 'Entender o teste' },
            { id: 'results', label: 'Resultados' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            aria-pressed={view === item.id}
            disabled={!report && item.id !== 'scene'}
            onClick={() => {
              setView(item.id);
              if (item.id === 'results') setPlaying(false);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {view === 'scene' && (
        <section className="lab-current" aria-label="Instante da reprodução">
          <div className="lab-current-heading">
            <strong>{selected.name}</strong>
            <span>{report ? status.label : 'Maquete pronta · teste ainda não executado'}</span>
          </div>
          {report && (
            <dl className="lab-readings">
              <div>
                <dt>Solo · última leitura</dt>
                <dd>
                  {selected.latest?.moisture.toFixed(1) ?? '—'}
                  <small>%</small>
                </dd>
              </div>
              <div>
                <dt>Água recebida pela API</dt>
                <dd>
                  {receivedWater?.toFixed(3) ?? '—'}
                  <small>L</small>
                </dd>
              </div>
              <div>
                <dt>Estimativa por planta</dt>
                <dd>
                  {receivedWater === undefined ? '—' : perPlantMilliliters(receivedWater).toFixed(1)}
                  <small>mL</small>
                </dd>
              </div>
            </dl>
          )}
          {report && (
            <p className="reading-age">
              Leitura recebida há{' '}
              {selected.latest ? (state.serverTime - selected.latest.receivedAt) / 1000 : '—'} s.
              {status.uncertain
                ? ' Estado atual sem confirmação; consulte a observação interna em “Entender o teste”.'
                : ' Distribuição nominal uniforme, sem cálculo de absorção.'}
            </p>
          )}
          {stuckFaultActive && (
            <p className="error-banner" role="status">
              Neste ensaio, o gotejamento representa o fluxo interno que permaneceu ativo após a rejeição do
              fechamento. A API mantém o estado como incerto.
            </p>
          )}
        </section>
      )}
      {view === 'scene' && (
        <Suspense fallback={<div className="scene-fallback">Carregando maquete…</div>}>
          <FieldScene
            state={state}
            connected={!!report}
            selectedId={zoneId}
            replay={{ second: frame?.second ?? 0, playing, speed: Number(speed) }}
            physicalFlow={stuckFaultActive ? frame?.deviceOpen : undefined}
            onInspect={() => setPlaying(false)}
          />
        </Suspense>
      )}
      {report && view !== 'results' && (
        <div className="replay-controls">
          <button
            aria-label={
              playing
                ? 'Pausar reprodução'
                : frameIndex === report.frames.length - 1
                  ? 'Rever reprodução'
                  : 'Continuar reprodução'
            }
            onClick={() => {
              if (frameIndex === report.frames.length - 1) setFrameIndex(0);
              setPlaying(!playing);
            }}
          >
            {playing ? <Pause size={19} /> : <Play size={19} />}
          </button>
          <label>
            <span>
              Instante · {frame!.second} / {report.durationSeconds} s
            </span>
            <input
              aria-label="Instante da reprodução"
              type="range"
              min="0"
              max={report.frames.length - 1}
              value={frameIndex}
              onChange={(event) => seek(Number(event.target.value))}
            />
          </label>
          <label className="speed-picker">
            <span className="sr-only">Velocidade</span>
            <select aria-label="Velocidade" value={speed} onChange={(event) => setSpeed(event.target.value)}>
              <option value="1">1×</option>
              <option value="5">5×</option>
              <option value="10">10×</option>
            </select>
          </label>
        </div>
      )}
      {report && view === 'scene' && (
        <div className="lab-event-now">
          <span>
            {frameIndex === report.frames.length - 1 ? 'REPRODUÇÃO CONCLUÍDA' : 'ACONTECIMENTO MAIS RECENTE'}{' '}
            · {latestMoment?.second} s
          </span>
          <strong>{latestMoment?.title}</strong>
          <p>{latestMoment?.description}</p>
        </div>
      )}
      {report && view === 'explain' && (
        <ExperimentInsights report={report} index={frameIndex} onSeek={seek} />
      )}
      {report && view === 'results' && (
        <section className="lab-results">
          <h2>Resultado completo · {report.durationSeconds} s</h2>
          <p>
            {selectedScenario.name} · {selected.name} · seed {report.input.seed}.{' '}
            {report.checks.filter((check) => check.passed).length}/{report.checks.length} critérios atendidos.
          </p>
          <dl className="lab-readings result-readings">
            <div>
              <dt>Tempo irrigando</dt>
              <dd>
                {report.metrics.openSeconds}
                <small>s</small>
              </dd>
            </div>
            <div>
              <dt>Consumo nominal</dt>
              <dd>
                {report.metrics.totalLiters.toFixed(3)}
                <small>L</small>
              </dd>
            </div>
            <div>
              <dt>Por planta</dt>
              <dd>
                {perPlantMilliliters(report.metrics.totalLiters).toFixed(1)}
                <small>mL</small>
              </dd>
            </div>
            <div>
              <dt>Comandos confirmados</dt>
              <dd>
                {report.metrics.confirmedCommands}
                <small>/{report.metrics.totalCommands}</small>
              </dd>
            </div>
          </dl>
          <p className="small-note">
            Métricas do estado interno do dispositivo durante todo o ensaio. Zero água ou zero confirmações
            pode ser o resultado esperado em um teste de falha.
          </p>
          <ul className="check-list">
            {report.checks.map((check) => (
              <li key={check.name}>
                {check.passed ? (
                  <CheckCircle2 aria-label="Atendido" size={22} />
                ) : (
                  <TriangleAlert aria-label="Falhou" size={22} />
                )}
                <div>
                  <strong>{check.name}</strong>
                  <p>{check.evidence}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="lab-exports">
            <button
              onClick={() => download(prefix + '.html', experimentHandout(report), 'text/html;charset=utf-8')}
            >
              Relatório para impressão
            </button>
            <button
              onClick={() => download(prefix + '.csv', experimentCsv(report), 'text/csv;charset=utf-8')}
            >
              Dados CSV
            </button>
            <button
              onClick={() => download(prefix + '.json', JSON.stringify(report, null, 2), 'application/json')}
            >
              Execução JSON
            </button>
          </div>
          <details className="lab-comparison">
            <summary>
              Comparar últimos testes desta visita ({history.length}/{scenarios.length})
            </summary>
            <p>
              Mesmas condições iniciais por execução. Salve os relatórios antes de sair: esta lista fica
              apenas nesta visita.
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Sistema / teste</th>
                    <th>Seed</th>
                    <th>Tempo</th>
                    <th>Litros</th>
                    <th>Critérios</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.input.zoneId === 'north' ? 'N' : 'S'} ·{' '}
                        {scenarios.find((s) => s.id === item.input.scenario)?.name}
                      </td>
                      <td>{item.input.seed}</td>
                      <td>{item.metrics.openSeconds} s</td>
                      <td>{item.metrics.totalLiters.toFixed(3)}</td>
                      <td>
                        {item.checks.filter((check) => check.passed).length}/{item.checks.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details className="model-details">
            <summary>Modelo, parâmetros e limites da evidência</summary>
            <p>
              Versão {report.version} · {report.model} · execução {report.id}
            </p>
            <ul>
              {report.limitations.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </details>
        </section>
      )}
      <p className="lab-scope">
        Demonstração de software: sensor → regra → comando → confirmação → irrigação. Os componentes 3D são
        exemplos de integração; o volume e o solo são modelos didáticos.
      </p>
    </Page>
  );
}
