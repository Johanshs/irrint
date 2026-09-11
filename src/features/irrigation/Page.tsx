import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { Droplets, FlaskConical, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSession } from './session';

export function Page({ title, children }: { title: string; children: ReactNode }) {
  const { state, error, connected, refresh, user, logout } = useSession();
  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>
            <span className="brand">
              <Droplets size={24} aria-hidden="true" /> irrint<span className="brand-caption">{title}</span>
            </span>
          </IonTitle>
          <button
            slot="end"
            className="account-button"
            onClick={logout}
            aria-label={`Sair da conta de ${user?.name}`}
          >
            <span>{user?.name}</span>
            <LogOut size={18} aria-hidden="true" />
          </button>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <main className="app-content">
          <div className="demo-label">
            <FlaskConical size={15} aria-hidden="true" /> Ambiente de demonstração · dados simulados
          </div>
          {!connected && (
            <div className="service-message" role="status">
              <strong>Serviço local indisponível</strong>
              <p>
                {state
                  ? 'Exibindo a última leitura recebida. Os comandos estão indisponíveis.'
                  : 'Inicie a demonstração no computador para conectar as áreas simuladas.'}
              </p>
              <button className="text-button" onClick={() => void refresh()}>
                Tentar conectar
              </button>
            </div>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {state ? (
            children
          ) : connected ? (
            <p role="status">Carregando áreas…</p>
          ) : (
            <div className="empty-view">
              <Droplets size={48} aria-hidden="true" />
              <h1>O campo, na sua mão.</h1>
              <p>Acompanhe a umidade e controle cada área quando a demonstração estiver conectada.</p>
            </div>
          )}
          <footer className="page-footer">Protótipo acadêmico · controle e monitoramento de irrigação</footer>
        </main>
      </IonContent>
    </IonPage>
  );
}
