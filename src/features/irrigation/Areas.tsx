import { ArrowUpRight, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Page } from './Page';
import { useSession, zoneStatus } from './session';

export function Areas() {
  const { state, connected, select } = useSession();
  return (
    <Page title="Áreas">
      <p className="eyebrow">SEU CULTIVO</p>
      <h1>Áreas de irrigação</h1>
      <p className="intro-text">Cada área tem seu próprio sensor, válvula e configuração.</p>
      <div className="area-grid">
        {state?.zones.map((zone) => {
          const status = zoneStatus(zone, state, connected);
          return (
            <Link className="area-card" key={zone.id} to="/app/home" onClick={() => select(zone.id)}>
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
          );
        })}
      </div>
      <p className="small-note">
        Nesta primeira demonstração, os dois dispositivos já estão vinculados às suas áreas. Leituras e
        acionamentos são independentes.
      </p>
    </Page>
  );
}
