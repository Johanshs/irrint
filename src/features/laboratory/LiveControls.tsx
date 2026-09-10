import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { useSession, zoneStatus } from '../irrigation/session';

export function LiveControls({ replay, onReturnLive }: { replay: boolean; onReturnLive: () => void }) {
  const session = useSession();
  const [duration, setDuration] = useState('30');
  const zone = session.state?.zones.find((item) => item.id === session.selectedId);
  if (!zone || !session.state) return null;
  const status = zoneStatus(zone, session.state, session.connected);
  const act = (action: 'open' | 'close') => {
    if (replay) return;
    void session
      .command(
        zone.id,
        action === 'open'
          ? { action, durationSeconds: Number(duration), idempotencyKey: crypto.randomUUID() }
          : { action, idempotencyKey: crypto.randomUUID() },
      )
      .catch(() => {});
  };
  return (
    <section className="lab-live-controls" aria-label="Controle dos canteiros no laboratório">
      <label className="field">
        <span>Canteiro na maquete</span>
        <select value={session.selectedId} onChange={(event) => session.select(event.target.value)}>
          {session.state.zones.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id === 'north' ? 'N' : 'S'} · {item.name}
            </option>
          ))}
        </select>
      </label>
      {replay ? (
        <div className="lab-replay-notice">
          <p>
            Você está vendo um replay. Os três cenários acionam o canteiro N e mantêm S desligado para
            verificar a independência entre áreas.
          </p>
          <IonButton fill="outline" onClick={onReturnLive}>
            Controlar ao vivo
          </IonButton>
        </div>
      ) : (
        <>
          <label className="field">
            <span>Duração da irrigação</span>
            <select value={duration} onChange={(event) => setDuration(event.target.value)}>
              <option value="15">15 segundos</option>
              <option value="30">30 segundos</option>
              <option value="60">1 minuto</option>
            </select>
          </label>
          <div className="lab-live-actions">
            <IonButton
              disabled={
                session.busy ||
                !session.connected ||
                !status.online ||
                status.pending ||
                status.uncertain ||
                status.irrigating
              }
              onClick={() => act('open')}
            >
              Irrigar {zone.name}
            </IonButton>
            <IonButton
              fill="outline"
              color="danger"
              disabled={session.busy || !session.connected}
              onClick={() => act('close')}
            >
              Parar {zone.name}
            </IonButton>
          </div>
          <p className="small-note">
            {status.label} ·{' '}
            {zone.rule.mode === 'automatic'
              ? zone.automaticPaused
                ? 'Automático suspenso'
                : 'Regra automática ativa'
              : 'Controle manual'}
            . Os botões comandam somente a área selecionada. Para ver as gotas em movimento, ative{' '}
            <strong>Animar água</strong> na maquete.
          </p>
        </>
      )}
    </section>
  );
}
