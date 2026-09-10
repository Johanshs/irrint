import { useEffect, useState } from 'react';
import { IonButton } from '@ionic/react';
import { Page } from './Page';
import { useSession } from './session';
import { ruleSchema } from '../../../shared/contracts';

export function Settings() {
  const { state, selectedId, select, configure, busy, connected } = useSession();
  const zone = state?.zones.find((item) => item.id === selectedId);
  const [mode, setMode] = useState<'manual' | 'automatic'>('manual');
  const [start, setStart] = useState('35');
  const [stop, setStop] = useState('45');
  const [duration, setDuration] = useState('60');
  const [message, setMessage] = useState('');
  const ruleKey = zone ? JSON.stringify([zone.id, zone.rule]) : '';
  useEffect(() => {
    if (zone) {
      setMode(zone.rule.mode);
      setStart(String(zone.rule.startBelow));
      setStop(String(zone.rule.stopAt));
      setDuration(String(zone.rule.maxDurationSeconds));
    }
  }, [ruleKey]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    if (!zone) return;
    if (![start, stop, duration].every((value) => value.trim())) {
      setMessage('Preencha os três valores.');
      return;
    }
    const result = ruleSchema.safeParse({
      mode,
      startBelow: Number(start),
      stopAt: Number(stop),
      maxDurationSeconds: Number(duration),
    });
    if (!result.success) {
      setMessage(result.error.issues.map((issue) => issue.message).join(' '));
      return;
    }
    try {
      await configure(zone.id, result.data);
      setMessage('Configuração salva.');
    } catch {
      /* The shared alert explains the failure. */
    }
  }
  return (
    <Page title="Ajustes">
      <p className="eyebrow">IRRIGAÇÃO DO SEU JEITO</p>
      <h1>Ajustes da área</h1>
      <label className="field">
        <span>Área para configurar</span>
        <select value={selectedId} onChange={(event) => select(event.target.value)}>
          {state?.zones.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <form className="settings-form" onSubmit={(event) => void save(event)}>
        <fieldset>
          <legend>Modo de irrigação</legend>
          <label className={`mode-choice ${mode === 'manual' ? 'selected' : ''}`}>
            <input type="radio" name="mode" checked={mode === 'manual'} onChange={() => setMode('manual')} />
            <span>
              <strong>Manual</strong>
              <span>Você inicia e interrompe a irrigação.</span>
            </span>
          </label>
          <label className={`mode-choice ${mode === 'automatic' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="mode"
              checked={mode === 'automatic'}
              onChange={() => setMode('automatic')}
            />
            <span>
              <strong>Automático</strong>
              <span>O sistema segue os limites abaixo.</span>
            </span>
          </label>
        </fieldset>
        <div className="input-pair">
          <label className="field">
            <span>Iniciar abaixo de (%)</span>
            <input
              type="number"
              min="0"
              max="99"
              step="1"
              required
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Parar ao atingir (%)</span>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              required
              value={stop}
              onChange={(event) => setStop(event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>Tempo máximo ligado (segundos)</span>
          <input
            type="number"
            min="5"
            max="600"
            step="1"
            required
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </label>
        <p className="small-note">
          Valores demonstrativos. O índice de umidade não é uma medida calibrada para recomendar manejo
          agrícola.
        </p>
        {zone?.automaticPaused && (
          <p className="pause-note">
            A parada suspendeu o automático. Salve novamente no modo automático para retomá-lo.
          </p>
        )}
        <IonButton type="submit" expand="block" disabled={busy || !connected}>
          {busy ? 'Salvando…' : 'Salvar configuração'}
        </IonButton>
        {message && (
          <p role="status" className="form-message">
            {message}
          </p>
        )}
      </form>
    </Page>
  );
}
