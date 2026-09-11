import { useState, type FormEvent } from 'react';
import { IonButton, IonContent, IonPage } from '@ionic/react';
import { Droplets, FlaskConical } from 'lucide-react';
import { useSession } from './session';

export function Login() {
  const { login, busy, error } = useSession();
  const [email, setEmail] = useState('produtor@demo.local');
  const [password, setPassword] = useState('irrigacao');

  async function submit(event: FormEvent) {
    event.preventDefault();
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
              Conta local sintética. Ela não acessa usuários nem dados da versão legacy.
            </p>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}
