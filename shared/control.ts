import { randomUUID } from 'node:crypto';
import {
  ackSchema,
  commandSchema,
  ruleSchema,
  telemetrySchema,
  zoneCreateSchema,
  zoneUpdateSchema,
} from './contracts.ts';
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
  ZoneCreate,
  ZoneUpdate,
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
      {
        id: 'north',
        ownerId: 'demo-producer',
        name: 'Horta norte',
        crop: 'Hortaliças',
        deviceId: 'sim-north',
        sensorId: 'soil-north',
        valveId: 'valve-north',
      },
      {
        id: 'south',
        ownerId: 'demo-producer',
        name: 'Canteiro sul',
        crop: 'Mudas',
        deviceId: 'sim-south',
        sensorId: 'soil-south',
        valveId: 'valve-south',
      },
    ].map((zone) => ({
      ...zone,
      automaticPaused: false,
      latest: null,
      activeCommandId: null,
      rule: { mode: 'manual', startBelow: 35, stopAt: 45, maxDurationSeconds: 60 },
    })),
  };
}

export function emptyState(now: number): SystemState {
  return {
    schemaVersion: '1.0',
    createdAt: now,
    commands: [],
    readings: [],
    events: [],
    zones: [],
  };
}

/** Owns control decisions. The clock and storage are supplied by the host, never by the UI. */
export class IrrigationControl {
  constructor(
    private state: SystemState,
    private clock: () => number = Date.now,
    private readonly environment: Snapshot['environment'] = 'local-simulation',
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
      environment: this.environment,
      offlineAfterMs: OFFLINE_AFTER_MS,
    };
  }

  snapshotForOwner(ownerId: string): Snapshot {
    const snapshot = this.snapshot();
    const zoneIds = new Set(snapshot.zones.filter((zone) => zone.ownerId === ownerId).map((zone) => zone.id));
    return {
      ...snapshot,
      zones: snapshot.zones.filter((zone) => zoneIds.has(zone.id)),
      commands: snapshot.commands.filter((command) => zoneIds.has(command.zoneId)),
      readings: snapshot.readings.filter((reading) => zoneIds.has(reading.zoneId)),
      events: snapshot.events.filter((event) => zoneIds.has(event.zoneId)),
    };
  }

  assertOwner(zoneId: string, ownerId: string) {
    if (this.zone(zoneId).ownerId !== ownerId)
      throw new ControlError(403, 'Esta área pertence a outra conta.');
  }

  seedDemoOwner(ownerId: string) {
    if (this.state.zones.some((zone) => zone.ownerId === ownerId)) return;
    for (const zone of [
      { key: 'north', name: 'Horta norte', crop: 'Hortaliças' },
      { key: 'south', name: 'Canteiro sul', crop: 'Mudas' },
    ]) {
      const stem = `${ownerId}-${zone.key}`;
      this.createZone(ownerId, {
        id: stem,
        name: zone.name,
        crop: zone.crop,
        deviceId: `sim-${stem}`,
        sensorId: `soil-${stem}`,
        valveId: `valve-${stem}`,
      });
    }
  }

  removeOwner(ownerId: string) {
    const zoneIds = new Set(
      this.state.zones.filter((zone) => zone.ownerId === ownerId).map((zone) => zone.id),
    );
    if (zoneIds.size === 0) return false;
    this.state.zones = this.state.zones.filter((zone) => !zoneIds.has(zone.id));
    this.state.commands = this.state.commands.filter((command) => !zoneIds.has(command.zoneId));
    this.state.readings = this.state.readings.filter((reading) => !zoneIds.has(reading.zoneId));
    this.state.events = this.state.events.filter((event) => !zoneIds.has(event.zoneId));
    return true;
  }

  createZone(ownerId: string, input: ZoneCreate): Zone {
    const value = zoneCreateSchema.parse(input);
    if (this.state.zones.filter((zone) => zone.ownerId === ownerId).length >= 12)
      throw new ControlError(409, 'Limite de 12 áreas por conta atingido.');
    const stem = value.id ?? this.availableZoneId(value.name);
    const identifiers = {
      id: stem,
      deviceId: value.deviceId ?? `sim-${stem}`,
      sensorId: value.sensorId ?? `soil-${stem}`,
      valveId: value.valveId ?? `valve-${stem}`,
    };
    this.assertAvailableIdentifiers(identifiers);
    const zone: Zone = {
      ...identifiers,
      ownerId,
      name: value.name,
      crop: value.crop,
      automaticPaused: false,
      latest: null,
      activeCommandId: null,
      rule: { mode: 'manual', startBelow: 35, stopAt: 45, maxDurationSeconds: 60 },
    };
    this.state.zones.push(zone);
    this.event(zone, 'topology', 'Área cadastrada com sensor e válvula vinculados.');
    return structuredClone(zone);
  }

  updateZone(zoneId: string, ownerId: string, input: ZoneUpdate): Zone {
    const value = zoneUpdateSchema.parse(input);
    this.assertOwner(zoneId, ownerId);
    const zone = this.zone(zoneId);
    zone.name = value.name;
    zone.crop = value.crop;
    this.event(zone, 'topology', 'Identificação da área atualizada.');
    return structuredClone(zone);
  }

  private availableZoneId(name: string) {
    const base =
      name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'area';
    let candidate = base;
    for (let suffix = 2; this.state.zones.some((zone) => zone.id === candidate); suffix++)
      candidate = `${base}-${suffix}`;
    return candidate;
  }

  private assertAvailableIdentifiers(identifiers: Pick<Zone, 'id' | 'deviceId' | 'sensorId' | 'valveId'>) {
    if (this.state.zones.some((zone) => zone.id === identifiers.id))
      throw new ControlError(409, 'Já existe uma área com este identificador.');
    if (this.state.zones.some((zone) => zone.deviceId === identifiers.deviceId))
      throw new ControlError(409, 'Este dispositivo já está vinculado.');
    if (this.state.zones.some((zone) => zone.sensorId === identifiers.sensorId))
      throw new ControlError(409, 'Este sensor já está vinculado.');
    if (this.state.zones.some((zone) => zone.valveId === identifiers.valveId))
      throw new ControlError(409, 'Esta válvula já está vinculada.');
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
    const ownerZoneIds = new Set(
      this.state.zones.filter((item) => item.ownerId === zone.ownerId).map((item) => item.id),
    );
    const ownerCommandCount = this.state.commands.filter((item) => ownerZoneIds.has(item.zoneId)).length;
    if (ownerCommandCount >= 500 && value.action === 'open')
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
