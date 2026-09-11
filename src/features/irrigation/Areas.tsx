import { useState, type FormEvent } from 'react';
import { IonButton } from '@ionic/react';
import { ArrowUpRight, Pencil, Plus, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Page } from './Page';
import { useSession, zoneStatus } from './session';

export function Areas() {
  const { state, connected, select, createZone, updateZone, busy } = useSession();
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [name, setName] = useState('');
  const [crop, setCrop] = useState('');

  function edit(id: string) {
    const zone = state?.zones.find((item) => item.id === id);
    if (!zone) return;
    setEditingId(id);
    setName(zone.name);
    setCrop(zone.crop);
  }

  function create() {
    setEditingId('new');
    setName('');
    setCrop('');
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      if (editingId === 'new') await createZone({ name, crop });
      else if (editingId) await updateZone(editingId, { name, crop });
      setEditingId(null);
    } catch {
      // The shared page displays the API validation message.
    }
  }

  return (
    <Page title="Áreas">
      <div className="section-heading">
        <div>
          <p className="eyebrow">SEU CULTIVO</p>
          <h1>Áreas de irrigação</h1>
        </div>
        <IonButton fill="outline" disabled={!connected || busy} onClick={create}>
          <Plus size={18} aria-hidden="true" />
          &nbsp; Nova área
        </IonButton>
      </div>
      <p className="intro-text">Cada área tem seu próprio sensor, válvula e configuração.</p>

      {editingId && (
        <form className="area-form" onSubmit={(event) => void save(event)}>
          <div>
            <p className="eyebrow">{editingId === 'new' ? 'CADASTRAR ÁREA' : 'EDITAR ÁREA'}</p>
            <h2>{editingId === 'new' ? 'Identifique o novo cultivo' : 'Atualize a identificação'}</h2>
          </div>
          <div className="input-pair">
            <label className="field">
              <span>Nome da área</span>
              <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
            </label>
            <label className="field">
              <span>Cultivo</span>
              <input value={crop} onChange={(event) => setCrop(event.target.value)} minLength={2} required />
            </label>
          </div>
          <p className="small-note">
            O kit demonstrativo vincula automaticamente um dispositivo, um sensor de umidade e uma válvula.
          </p>
          <div className="form-actions">
            <IonButton type="submit" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar área'}
            </IonButton>
            <IonButton type="button" fill="clear" color="medium" onClick={() => setEditingId(null)}>
              Cancelar
            </IonButton>
          </div>
        </form>
      )}

      <div className="area-grid">
        {state?.zones.map((zone) => {
          const status = zoneStatus(zone, state, connected);
          return (
            <article className="area-card" key={zone.id}>
              <Link className="area-card-link" to="/app/home" onClick={() => select(zone.id)}>
                <div className={`field-art field-art-${zone.id}`} aria-hidden="true">
                  {Array.from({ length: 12 }, (_, i) => (
                    <Sprout key={i} size={28} />
                  ))}
                </div>
                <div className="area-body">
                  <div className="card-top">
                    <h2>{zone.name}</h2>
                    <ArrowUpRight size={22} aria-hidden="true" />
                  </div>
                  <p>{zone.crop}</p>
                  <div className="area-facts">
                    <strong>
                      {zone.latest
                        ? `${zone.latest.moisture.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
                        : '—'}
                    </strong>
                    <span>{status.label}</span>
                  </div>
                </div>
              </Link>
              <div className="area-card-footer">
                <span>
                  Sensor {zone.sensorId} · Válvula {zone.valveId}
                </span>
                <button onClick={() => edit(zone.id)}>
                  <Pencil size={16} aria-hidden="true" /> Editar
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!state?.zones.length && (
        <div className="empty-view">
          <Sprout size={48} aria-hidden="true" />
          <h2>Cadastre sua primeira área</h2>
          <p>O ambiente criará os vínculos demonstrativos necessários para iniciar as leituras.</p>
        </div>
      )}
      <p className="small-note">
        Os dispositivos simulados detectam novas áreas durante a execução. Leituras e acionamentos permanecem
        independentes.
      </p>
    </Page>
  );
}
