import type { Snapshot } from '../../../shared/contracts';
import { irrigationLayout, perPlantMilliliters, plantsPerZone } from '../../../shared/water';
import { zoneStatus } from '../irrigation/session';
const number = (value: number, digits = 2) =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
export function WaterPanel({
  state,
  connected,
  selectedId,
  replay,
}: {
  state: Snapshot;
  connected: boolean;
  selectedId: string;
  replay: boolean;
}) {
  const zone = state.zones.find((item) => item.id === selectedId);
  if (!zone) return null;
  const status = zoneStatus(zone, state, connected),
    water = zone.latest?.water;
  const totalKnown = state.zones.every((item) => item.latest?.water !== undefined);
  const total = state.zones.reduce((sum, item) => sum + (item.latest?.water?.totalLiters ?? 0), 0);
  const fresh = state.zones.every((item) => zoneStatus(item, state, connected).online);
  const flow =
    water && status.online && !status.pending && !status.uncertain
      ? status.irrigating
        ? plantsPerZone * irrigationLayout.emitterLitersPerHour
        : 0
      : null;
  return (
    <section className="water-panel" aria-label="Água e umidade da simulação">
      <div className="water-heading">
        <div>
          <span className="eyebrow">{replay ? 'NESTE INSTANTE DO REPLAY' : 'SESSÃO LOCAL · ACUMULADO'}</span>
          <h3>{zone.name}</h3>
        </div>
        <span className={`water-state ${status.irrigating ? 'flowing' : ''}`}>{status.label}</span>
      </div>
      <div className="water-metrics">
        <div>
          <span>Índice do solo</span>
          <strong>
            {zone.latest ? number(zone.latest.moisture, 1) : '—'}
            <small>%</small>
          </strong>
          <div
            className="moisture-bar"
            role="meter"
            aria-label="Índice de umidade do solo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={zone.latest?.moisture ?? 0}
          >
            <i style={{ width: `${zone.latest?.moisture ?? 0}%` }} />
          </div>
          <small>{status.online ? 'Leitura normalizada' : 'Última leitura conhecida'}</small>
        </div>
        <div>
          <span>Água por planta</span>
          <strong>
            {water ? number(perPlantMilliliters(water.totalLiters), 1) : '—'}
            <small>mL</small>
          </strong>
          <small>Aplicação média estimada</small>
        </div>
        <div>
          <span>Volume nesta área</span>
          <strong>
            {water ? number(water.totalLiters, 3) : '—'}
            <small>L</small>
          </strong>
          <small>{flow === null ? 'Vazão sem confirmação' : `${number(flow, 0)} L/h · vazão nominal`}</small>
        </div>
        <div>
          <span>Consumo das duas áreas</span>
          <strong>
            {totalKnown ? number(total, 3) : '—'}
            <small>L</small>
          </strong>
          <small>{fresh ? 'Soma dos volumes recebidos' : 'Últimos volumes conhecidos'}</small>
        </div>
      </div>
      <p className="water-assumption">
        {plantsPerZone} plantas e gotejadores por área · {irrigationLayout.emitterLitersPerHour} L/h por
        emissor. Volume = vazão × tempo aberto. Distribuição uniforme; absorção e perdas não calculadas.
        {!status.online ? ' Comunicação indisponível: os valores ficam na última telemetria recebida.' : ''}
      </p>
    </section>
  );
}
