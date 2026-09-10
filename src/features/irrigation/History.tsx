import { IonButton } from '@ionic/react';
import { CheckCircle2, Clock3, Download, TriangleAlert } from 'lucide-react';
import { Page } from './Page';
import { useSession } from './session';
import { Link } from 'react-router-dom';

export function History() {
  const { state, selectedId, select, exportReport, connected } = useSession();
  const events =
    state?.events
      .filter((event) => event.zoneId === selectedId)
      .slice()
      .reverse() ?? [];
  const commands = state?.commands.filter((command) => command.zoneId === selectedId) ?? [];
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
              <time>{new Date(event.at).toLocaleTimeString('pt-BR')}</time>
              <p>{event.message}</p>
            </div>
          </li>
        ))}
      </ol>
      {!events.length && (
        <p className="empty-history">
          Ainda não há eventos nesta área. Os comandos e mudanças de configuração aparecerão aqui.
        </p>
      )}
      <p className="small-note">
        O arquivo inclui leituras, comandos e eventos desta demonstração. As contagens representam operações
        do software, não resultados de hardware físico.
      </p>
    </Page>
  );
}
