import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, leafOutline, timeOutline, optionsOutline } from 'ionicons/icons';
import { Navigate, Route } from 'react-router-dom';
import { SessionProvider } from '../features/irrigation/session';
import { Overview } from '../features/irrigation/Overview';
import { Areas } from '../features/irrigation/Areas';
import { History } from '../features/irrigation/History';
import { Settings } from '../features/irrigation/Settings';
import { Laboratory } from '../features/laboratory/Laboratory';
import { Login } from '../features/irrigation/Login';
import { useSession } from '../features/irrigation/session';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '../styles/app.css';

setupIonicReact({ mode: 'md' });

function AuthenticatedApp() {
  const { user } = useSession();
  if (!user) return <Login />;
  return (
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route path="/app/home" element={<Overview />} />
          <Route path="/app/areas" element={<Areas />} />
          <Route path="/app/history" element={<History />} />
          <Route path="/app/history/laboratory" element={<Laboratory />} />
          <Route path="/app/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/app/home" replace />} />
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/app/home">
            <IonIcon icon={homeOutline} />
            <IonLabel>Início</IonLabel>
          </IonTabButton>
          <IonTabButton tab="areas" href="/app/areas">
            <IonIcon icon={leafOutline} />
            <IonLabel>Áreas</IonLabel>
          </IonTabButton>
          <IonTabButton tab="history" href="/app/history">
            <IonIcon icon={timeOutline} />
            <IonLabel>Histórico</IonLabel>
          </IonTabButton>
          <IonTabButton tab="settings" href="/app/settings">
            <IonIcon icon={optionsOutline} />
            <IonLabel>Ajustes</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  );
}

export default function App() {
  return (
    <IonApp>
      <SessionProvider>
        <AuthenticatedApp />
      </SessionProvider>
    </IonApp>
  );
}
