import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IonButton } from '@ionic/react';
import { Activity, ArrowDown, ArrowUp, Droplets, Settings2, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useSession, zoneStatus } from './session';
import { Page } from './Page';

export function Overview() {
  const session = useSession();
  const [duration, setDuration] = useState('60');
  const { state, selectedId, select, connected, busy, command } = session;
  const zone = state?.zones.find((item) => item.id === selectedId);
  const status = zone && state ? zoneStatus(zone, state, connected) : null;
  const moisture = zone?.latest?.moisture;
  const label =
    moisture === undefined
      ? 'Aguardando leitura'
      : moisture < zone!.rule.startBelow
        ? 'Abaixo do limite configurado'
        : moisture >= zone!.rule.stopAt
          ? 'Limite de parada atingido'
          : 'Dentro da faixa configurada';
  const readings = state?.readings.filter((reading) => reading.zoneId === selectedId).slice(-60) ?? [];
  const latestEvent = state?.events.filter((event) => event.zoneId === selectedId).at(-1);
  const validDuration =
    Number.isInteger(Number(duration)) && Number(duration) >= 5 && Number(duration) <= 600;
  const act = (action: 'open' | 'close') => {
    if (!zone) return;
    void command(
      zone.id,
      action === 'open'
        ? { action, durationSeconds: Number(duration), idempotencyKey: crypto.randomUUID() }
        : { action, idempotencyKey: crypto.randomUUID() },
    ).catch(() => {});
  };
  return (
    <Page title="Início">
      {zone && status && state && (
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">ACOMPANHAMENTO</p>
              <h1>Como está sua área?</h1>
            </div>
            <label className="area-picker">
              <span className="sr-only">Área selecionada</span>
              <select value={selectedId} onChange={(event) => select(event.target.value)}>
                {state.zones.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="overview-grid">
            <section className="moisture-card" aria-label="Umidade da área">
              <div className="card-top">
                <span>
                  <Droplets size={19} aria-hidden="true" /> Umidade do solo
                </span>
                <span className={`connection ${status.online ? '' : 'is-offline'}`}>
                  {status.online ? (
                    <Wifi size={16} aria-hidden="true" />
                  ) : (
                    <WifiOff size={16} aria-hidden="true" />
                  )}
                  {status.online ? 'Conectado' : 'Sem contato'}
                </span>
              </div>
              <div className="moisture-value">
                {moisture === undefined
                  ? '—'
                  : moisture.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                <span>%</span>
              </div>
              <p className="moisture-description">{status.online ? label : 'Último valor conhecido'}</p>
              <div className="moisture-track" aria-hidden="true">
                <span style={{ width: `${moisture ?? 0}%` }} />
              </div>
              <div className="thresholds">
                <span>
                  <ArrowDown size={15} aria-hidden="true" /> Inicia abaixo de {zone.rule.startBelow}%
                </span>
                <span>
                  <ArrowUp size={15} aria-hidden="true" /> Para em {zone.rule.stopAt}%
                </span>
              </div>
              <p className="last-reading">
                {zone.latest
                  ? `Leitura recebida às ${new Date(zone.latest.receivedAt).toLocaleTimeString('pt-BR')}`
                  : 'Aguardando o dispositivo simulado'}
              </p>
            </section>
            <section className="control-card" aria-label="Controle de irrigação">
              <div className="card-top">
                <h2>Controle da área</h2>
                <span className="mode-tag">{zone.rule.mode === 'automatic' ? 'Automático' : 'Manual'}</span>
              </div>
              <div className={`valve-state ${status.irrigating ? 'is-running' : ''}`}>
                <span className="valve-icon">
                  <Droplets size={28} aria-hidden="true" />
                </span>
                <div>
                  <strong aria-live="polite">{status.label}</strong>
                  <p>
                    {zone.automaticPaused
                      ? 'Automático suspenso após a parada'
                      : zone.rule.mode === 'automatic'
                        ? 'A irrigação segue os limites da área'
                        : 'Você decide quando irrigar'}
                  </p>
                </div>
              </div>
              <label className="field">
                <span>Duração da irrigação</span>
                <select value={duration} onChange={(event) => setDuration(event.target.value)}>
                  <option value="15">15 segundos</option>
                  <option value="30">30 segundos</option>
                  <option value="60">1 minuto</option>
                  <option value="120">2 minutos</option>
                </select>
              </label>
              <IonButton
                expand="block"
                disabled={
                  busy ||
                  !connected ||
                  !status.online ||
                  status.pending ||
                  status.uncertain ||
                  status.irrigating ||
                  !validDuration
                }
                onClick={() => act('open')}
              >
                Iniciar irrigação
              </IonButton>
              <IonButton
                expand="block"
                fill="outline"
                color="danger"
                disabled={busy || !connected}
                onClick={() => act('close')}
              >
                Parar irrigação
              </IonButton>
              <Link className="settings-link" to="/app/settings">
                <Settings2 size={16} aria-hidden="true" /> Ajustar irrigação automática
              </Link>
            </section>
          </div>
          <section className="chart-section" aria-label="Histórico recente de umidade">
            <div className="section-heading">
              <div>
                <p className="eyebrow">ÚLTIMAS LEITURAS</p>
                <h2>A umidade ao longo do tempo</h2>
              </div>
              <span className="chart-unit">Umidade (%)</span>
            </div>
            {readings.length > 1 ? (
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={readings} margin={{ top: 12, right: 16, bottom: 10, left: -20 }}>
                    <XAxis
                      dataKey="receivedAt"
                      tickFormatter={(time) =>
                        new Date(time).toLocaleTimeString('pt-BR', { minute: '2-digit', second: '2-digit' })
                      }
                      minTickGap={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(time) => new Date(Number(time)).toLocaleTimeString('pt-BR')}
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Umidade simulada']}
                    />
                    <ReferenceLine y={zone.rule.startBelow} stroke="#b56c18" strokeDasharray="4 4" />
                    <ReferenceLine y={zone.rule.stopAt} stroke="#477868" strokeDasharray="4 4" />
                    <Line
                      dataKey="moisture"
                      stroke="#15765b"
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="muted">O gráfico aparecerá depois das primeiras leituras.</p>
            )}
          </section>
          {latestEvent && (
            <div className="recent-event">
              <Activity size={20} aria-hidden="true" />
              <div>
                <span>Último evento · {new Date(latestEvent.at).toLocaleTimeString('pt-BR')}</span>
                <p>{latestEvent.message}</p>
              </div>
            </div>
          )}
        </>
      )}
    </Page>
  );
}
