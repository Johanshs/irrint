import { randomUUID } from 'node:crypto';
import { ackSchema, commandSchema, ruleSchema, telemetrySchema } from './contracts.ts';
import type {
  Ack,
  Command,
  CommandInput,
  IrrigationEvent,
  Rule,
  Snapshot,
  SystemState,
  Telemetry,
  Zone,
} from './contracts.ts';

export const OFFLINE_AFTER_MS = 10_000;
export const COMMAND_TTL_MS = 8_000;

export class ControlError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function initialState(now: number): SystemState {
  return {
    schemaVersion: '1.0',
    createdAt: now,
    commands: [],
    readings: [],
    events: [],
    zones: [
      { id: 'north', name: 'Horta norte', crop: 'Hortaliças', deviceId: 'sim-north' },
      { id: 'south', name: 'Canteiro sul', crop: 'Mudas', deviceId: 'sim-south' },
    ].map((zone) => ({
      ...zone,
      automaticPaused: false,
      latest: null,
      activeCommandId: null,
      rule: { mode: 'manual', startBelow: 35, stopAt: 45, maxDurationSeconds: 60 },
    })),
  };
}

/** Owns control decisions. The clock and storage are supplied by the host, never by the UI. */
export class IrrigationControl {
  constructor(
    private state: SystemState,
    private clock: () => number = Date.now,
  ) {}

  private zone(id: string): Zone {
    const zone = this.state.zones.find((item) => item.id === id);
    if (!zone) throw new ControlError(404, 'Área não encontrada.');
    return zone;
  }

  private event(zone: Zone, type: IrrigationEvent['type'], message: string, commandId: string | null = null) {
    this.state.events.push({ id: randomUUID(), zoneId: zone.id, type, message, commandId, at: this.clock() });
    this.state.events = this.state.events.slice(-1000);
  }

  private expire() {
    for (const command of this.state.commands) {
      if (command.status === 'pending' && this.clock() >= command.expiresAt) {
        command.status = 'expired';
        this.event(
          this.zone(command.zoneId),
          'expired',
          'Comando sem confirmação. Verifique o dispositivo.',
          command.id,
        );
      }
    }
  }

  snapshot(): Snapshot {
    this.expire();
    return {
      ...structuredClone(this.state),
      serverTime: this.clock(),
      environment: 'local-simulation',
      offlineAfterMs: OFFLINE_AFTER_MS,
    };
  }

  exportState(): SystemState {
    return structuredClone(this.state);
  }

  restore(state: SystemState) {
    this.state = structuredClone(state);
  }

  configure(zoneId: string, input: Rule): Zone {
    const rule = ruleSchema.parse(input);
    const zone = this.zone(zoneId);
    zone.rule = rule;
    zone.automaticPaused = false;
    this.event(
      zone,
      'rule',
      rule.mode === 'automatic'
        ? 'Automático habilitado com os limites configurados.'
        : 'Modo manual habilitado.',
    );
    this.evaluate(zone);
    return structuredClone(zone);
  }

  command(zoneId: string, input: CommandInput, origin: Command['origin'] = 'manual'): Command {
    const value = commandSchema.parse(input);
    this.expire();
    const zone = this.zone(zoneId);
    const previous = this.state.commands.find((item) => item.idempotencyKey === value.idempotencyKey);
    if (previous) {
      if (
        previous.zoneId !== zoneId ||
        previous.action !== value.action ||
        previous.durationSeconds !== value.durationSeconds
      ) {
        throw new ControlError(409, 'Esta solicitação já foi usada com outro conteúdo.');
      }
      return structuredClone(previous);
    }
    if (this.state.commands.length >= 500 && value.action === 'open')
      throw new ControlError(
        429,
        'Limite da sessão atingido. Exporte os resultados e inicie outra sessão. A parada continua disponível.',
      );
    if (value.action === 'open') {
      if (!zone.latest || this.clock() - zone.latest.receivedAt >= OFFLINE_AFTER_MS) {
        throw new ControlError(409, 'Dispositivo sem leitura recente. Não foi possível iniciar.');
      }
      const active = this.state.commands.find((item) => item.id === zone.activeCommandId);
      if (zone.latest.valve === 'open' || active?.status === 'pending' || active?.status === 'expired') {
        throw new ControlError(409, 'Aguarde a confirmação ou solicite a parada antes de iniciar novamente.');
      }
    }
    if (value.action === 'close') {
      for (const pending of this.state.commands.filter(
        (item) => item.zoneId === zoneId && item.status === 'pending',
      ))
        pending.status = 'superseded';
      if (origin === 'manual') zone.automaticPaused = true;
    }
    const command: Command = {
      ...value,
      id: randomUUID(),
      zoneId,
      deviceId: zone.deviceId,
      origin,
      status: 'pending',
      requestedAt: this.clock(),
      expiresAt: this.clock() + COMMAND_TTL_MS,
      appliedAt: null,
    };
    zone.activeCommandId = command.id;
    this.state.commands.push(command);
    this.event(
      zone,
      'command',
      value.action === 'open'
        ? 'Início solicitado. Aguardando confirmação.'
        : 'Parada solicitada. Aguardando confirmação.',
      command.id,
    );
    return structuredClone(command);
  }

  pending(deviceId: string): Command[] {
    this.expire();
    if (!this.state.zones.some((zone) => zone.deviceId === deviceId))
      throw new ControlError(404, 'Dispositivo não encontrado.');
    return structuredClone(
      this.state.commands.filter((item) => item.deviceId === deviceId && item.status === 'pending'),
    );
  }

  acknowledge(input: Ack) {
    const ack = ackSchema.parse(input);
    this.expire();
    const command = this.state.commands.find(
      (item) => item.id === ack.commandId && item.deviceId === ack.deviceId,
    );
    if (!command) throw new ControlError(404, 'Comando não encontrado para este dispositivo.');
    if (command.status !== 'pending') return structuredClone(command);
    const zone = this.zone(command.zoneId);
    if (zone.activeCommandId !== command.id)
      throw new ControlError(409, 'Comando superado por uma solicitação mais recente.');
    if (ack.status === 'applied' && ack.valve !== (command.action === 'open' ? 'open' : 'closed')) {
      throw new ControlError(422, 'Confirmação incompatível com o estado solicitado.');
    }
    command.status = ack.status;
    command.appliedAt = ack.status === 'applied' ? this.clock() : null;
    this.event(
      zone,
      ack.status,
      ack.status === 'rejected'
        ? 'O dispositivo rejeitou o comando.'
        : command.action === 'open'
          ? 'Irrigação confirmada pelo dispositivo.'
          : 'Parada confirmada pelo dispositivo.',
      command.id,
    );
    // Acknowledgments do not fabricate sensor readings or refresh their age.
    return structuredClone(command);
  }

  telemetry(input: Telemetry) {
    const value = telemetrySchema.parse(input);
    this.expire();
    const zone = this.state.zones.find((item) => item.deviceId === value.deviceId);
    if (!zone) throw new ControlError(404, 'Dispositivo não vinculado a uma área.');
    if (zone.latest && value.sequence <= zone.latest.sequence)
      throw new ControlError(409, 'Leitura antiga ou repetida.');
    const reading = { ...value, zoneId: zone.id, receivedAt: this.clock() };
    zone.latest = reading;
    this.state.readings.push(reading);
    this.state.readings = this.state.readings.slice(-2000);
    const active = this.state.commands.find((item) => item.id === zone.activeCommandId);
    if (
      active?.status === 'pending' &&
      value.lastCommandId === active.id &&
      value.valve === (active.action === 'open' ? 'open' : 'closed')
    ) {
      this.acknowledge({
        deviceId: value.deviceId,
        commandId: active.id,
        status: 'applied',
        valve: value.valve,
      });
    }
    if (active?.action === 'open' && active.status === 'applied' && value.valve === 'closed') {
      zone.automaticPaused = true;
      zone.activeCommandId = null;
      this.event(
        zone,
        'safety',
        'Dispositivo encerrou a irrigação. Automático suspenso até revisão.',
        active.id,
      );
    }
    this.evaluate(zone);
    return structuredClone(reading);
  }

  private evaluate(zone: Zone) {
    if (
      zone.rule.mode !== 'automatic' ||
      zone.automaticPaused ||
      !zone.latest ||
      this.clock() - zone.latest.receivedAt >= OFFLINE_AFTER_MS
    )
      return;
    const active = this.state.commands.find((item) => item.id === zone.activeCommandId);
    if (active && ['pending', 'expired', 'rejected'].includes(active.status)) return;
    if (zone.latest.valve === 'closed' && zone.latest.moisture < zone.rule.startBelow) {
      this.command(
        zone.id,
        { action: 'open', durationSeconds: zone.rule.maxDurationSeconds, idempotencyKey: randomUUID() },
        'automatic',
      );
    } else if (zone.latest.valve === 'open' && zone.latest.moisture >= zone.rule.stopAt) {
      this.command(zone.id, { action: 'close', idempotencyKey: randomUUID() }, 'automatic');
    }
  }
}
