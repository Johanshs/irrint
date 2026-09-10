import type { Command, Telemetry, ValveState } from '../shared/contracts.ts';
import { litersForSeconds, zoneFlowLitersPerHour, type WaterState } from '../shared/water.ts';

/** A deterministic device model; its watchdog lives here, independently of the application. */
export class SimulatedDevice {
  private randomState: number;
  private sequence: number;
  private valve: ValveState = 'closed';
  private closesAt: number | null = null;
  private lastCommandId: string | null = null;
  private applied = new Set<string>();
  private accountedAt: number | null = null;
  private totalLiters: number;

  constructor(
    readonly deviceId: string,
    private moisture: number,
    seed: number,
    sequence = 0,
    water?: WaterState,
  ) {
    this.randomState = seed >>> 0;
    this.sequence = sequence;
    this.totalLiters = water?.totalLiters ?? 0;
  }

  get valveState(): ValveState {
    return this.valve;
  }

  get water(): WaterState {
    return {
      totalLiters: Math.round(this.totalLiters * 1e6) / 1e6,
      flowLitersPerHour: this.valve === 'open' ? zoneFlowLitersPerHour : 0,
    };
  }

  private accountWater(now: number) {
    if (this.valve === 'open' && this.accountedAt !== null && this.closesAt !== null) {
      const until = Math.min(now, this.closesAt);
      this.totalLiters += litersForSeconds(Math.max(0, until - this.accountedAt) / 1000);
    }
    this.accountedAt = Math.max(this.accountedAt ?? now, now);
  }

  apply(command: Command, now: number) {
    if (command.deviceId !== this.deviceId || command.status !== 'pending' || now >= command.expiresAt)
      return false;
    if (this.applied.has(command.id)) return true;
    this.accountWater(now);
    this.applied.add(command.id);
    this.lastCommandId = command.id;
    this.valve = command.action === 'open' ? 'open' : 'closed';
    this.closesAt = command.action === 'open' ? now + (command.durationSeconds ?? 5) * 1000 : null;
    return true;
  }

  step(seconds: number, now: number): Telemetry {
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 5) throw new Error('Passo inválido.');
    this.accountWater(now);
    if (this.closesAt !== null && now >= this.closesAt) {
      this.valve = 'closed';
      this.closesAt = null;
    }
    this.randomState = (1664525 * this.randomState + 1013904223) >>> 0;
    const noise = (this.randomState / 4294967296 - 0.5) * 0.04;
    const rate = this.valve === 'open' ? 0.85 : -0.15;
    this.moisture = Math.max(0, Math.min(100, this.moisture + rate * seconds + noise));
    this.sequence++;
    return {
      schemaVersion: '1.0',
      deviceId: this.deviceId,
      sequence: this.sequence,
      moisture: Math.round(this.moisture * 100) / 100,
      unit: 'normalizedPercent',
      valve: this.valve,
      lastCommandId: this.lastCommandId,
      source: 'simulated',
      water: this.water,
    };
  }
}
