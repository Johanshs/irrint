import { useState, type FormEvent } from 'react';
import { IonButton, IonContent, IonPage } from '@ionic/react';
import { Droplets, FlaskConical } from 'lucide-react';
import { configurableApi, configureApiBaseUrl, currentApiBaseUrl, useSession } from './session';

export function Login() {
  const { login, busy, error } = useSession();
  const [email, setEmail] = useState('produtor@demo.local');
  const [password, setPassword] = useState('irrigacao');
  const [apiUrl, setApiUrl] = useState(currentApiBaseUrl);
  const [configurationError, setConfigurationError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (configurableApi()) {
      try {
        configureApiBaseUrl(apiUrl);
        setConfigurationError('');
      } catch (error) {
        setConfigurationError(
          error instanceof Error ? error.message : 'Informe o endereço completo da API local.',
        );
        return;
      }
    }
    try {
      await login(email, password);
    } catch {
      // The provider exposes a readable message in the form.
    }
  }

  return (
    <IonPage>
      <IonContent>
        <main className="login-page">
          <section className="login-card" aria-labelledby="login-title">
            <div className="login-brand">
              <Droplets size={34} aria-hidden="true" />
              <span>irrint</span>
            </div>
            <p className="eyebrow">
              <FlaskConical size={14} aria-hidden="true" /> ACESSO DEMONSTRATIVO
            </p>
            <h1 id="login-title">Irrigação na palma da mão</h1>
            <p className="intro-text">
              Entre para acompanhar e controlar somente as áreas vinculadas à sua sessão.
            </p>
            <form onSubmit={(event) => void submit(event)}>
              <label className="field">
                <span>E-mail</span>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              {configurableApi() && (
                <details className="connection-settings">
                  <summary>Conexão local de contingência</summary>
                  <label className="field">
                    <span>Endereço da API no notebook</span>
                    <input
                      type="url"
                      inputMode="url"
                      value={apiUrl}
                      onChange={(event) => setApiUrl(event.target.value)}
                      placeholder="http://192.168.137.1:8787"
                      required
                    />
                  </label>
                  <p className="small-note">Use o endereço exibido pelo inicializador no notebook.</p>
                </details>
              )}
              {configurationError && (
                <p className="error-message" role="alert">
                  {configurationError}
                </p>
              )}
              <label className="field">
                <span>Senha</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
              <IonButton type="submit" expand="block" disabled={busy}>
                {busy ? 'Entrando…' : 'Entrar na demonstração'}
              </IonButton>
            </form>
            <p className="small-note">
              Cada acesso demonstrativo é temporário e não consulta usuários nem dados da versão legacy.
            </p>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}
