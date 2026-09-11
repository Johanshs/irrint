import { IonButton } from '@ionic/react';
import { CheckCircle2, Clock3, Download, TriangleAlert } from 'lucide-react';
import { Page } from './Page';
import { useSession } from './session';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const periods = {
  all: { label: 'Toda a sessão', milliseconds: null },
  hour: { label: 'Última hora', milliseconds: 60 * 60 * 1000 },
  day: { label: 'Últimas 24 horas', milliseconds: 24 * 60 * 60 * 1000 },
  week: { label: 'Últimos 7 dias', milliseconds: 7 * 24 * 60 * 60 * 1000 },
} as const;

export function History() {
  const { state, selectedId, select, exportReport, connected } = useSession();
  const [period, setPeriod] = useState<keyof typeof periods>('all');
  const duration = periods[period].milliseconds;
  const cutoff = state && duration !== null ? state.serverTime - duration : Number.NEGATIVE_INFINITY;
  const events =
    state?.events
      .filter((event) => event.zoneId === selectedId && event.at >= cutoff)
      .slice()
      .reverse() ?? [];
  const commands =
    state?.commands.filter((command) => command.zoneId === selectedId && command.requestedAt >= cutoff) ?? [];
  const applied = commands.filter((command) => command.status === 'applied');
  const expired = commands.filter((command) => command.status === 'expired');
  return (
    <Page title="Histórico">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ACOMPANHE O QUE ACONTECEU</p>
          <h1>Histórico da área</h1>
        </div>
        <IonButton fill="outline" disabled={!connected} onClick={() => void exportReport()}>
          <Download size={18} aria-hidden="true" />
          &nbsp; Exportar JSON
        </IonButton>
      </div>
      <Link className="laboratory-link" to="/app/history/laboratory">
        <strong>Abrir laboratório 3D →</strong>
        <span>Execute cenários, acompanhe o replay e exporte resultados.</span>
      </Link>
      <label className="field">
        <span>Área do histórico</span>
        <select value={selectedId} onChange={(event) => select(event.target.value)}>
          {state?.zones.map((zone) => (
            <option value={zone.id} key={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Período</span>
        <select value={period} onChange={(event) => setPeriod(event.target.value as keyof typeof periods)}>
          {Object.entries(periods).map(([id, option]) => (
            <option value={id} key={id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="metrics">
        <div>
          <span>Comandos solicitados</span>
          <strong>{commands.length}</strong>
        </div>
        <div>
          <span>Confirmados</span>
          <strong>{applied.length}</strong>
        </div>
        <div>
          <span>Sem confirmação no prazo</span>
          <strong>{expired.length}</strong>
        </div>
      </div>
      <ol className="event-list">
        {events.map((event) => (
          <li key={event.id}>
            <span className={`event-marker event-${event.type}`}>
              {event.type === 'applied' ? (
                <CheckCircle2 size={20} aria-hidden="true" />
              ) : event.type === 'expired' || event.type === 'rejected' ? (
                <TriangleAlert size={20} aria-hidden="true" />
              ) : (
                <Clock3 size={20} aria-hidden="true" />
              )}
            </span>
            <div>
              <time>{new Date(event.at).toLocaleString('pt-BR')}</time>
              <p>{event.message}</p>
            </div>
          </li>
        ))}
      </ol>
      {!events.length && <p className="empty-history">Não há eventos desta área no período selecionado.</p>}
      <p className="small-note">
        O arquivo inclui leituras, comandos e eventos desta demonstração. As contagens representam operações
        do software, não resultados de hardware físico.
      </p>
    </Page>
  );
}
