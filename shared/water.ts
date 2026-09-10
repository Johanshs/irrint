/** Nominal demonstration parameters, not a calibrated hydraulic or agronomic model. */
export const irrigationLayout = { rows: 3, columns: 6, emitterLitersPerHour: 2 } as const;
export const plantsPerZone = irrigationLayout.rows * irrigationLayout.columns;
export const zoneFlowLitersPerHour = plantsPerZone * irrigationLayout.emitterLitersPerHour;
export interface WaterState {
  totalLiters: number;
  flowLitersPerHour: number;
}
export const litersForSeconds = (seconds: number) => (zoneFlowLitersPerHour * seconds) / 3600;
export const perPlantMilliliters = (liters: number) => (liters * 1000) / plantsPerZone;
