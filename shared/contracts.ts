import { z } from 'zod';

export const ruleSchema = z
  .object({
    mode: z.enum(['manual', 'automatic']),
    startBelow: z.number().finite().min(0).max(99),
    stopAt: z.number().finite().min(1).max(100),
    maxDurationSeconds: z.number().int().min(5).max(600),
  })
  .strict()
  .refine((value) => value.startBelow < value.stopAt, {
    message: 'O limite de parada precisa ser maior que o de início.',
  });

export const commandSchema = z
  .object({
    action: z.enum(['open', 'close']),
    durationSeconds: z.number().int().min(5).max(600).optional(),
    idempotencyKey: z.string().uuid(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.action === 'open' && value.durationSeconds === undefined) {
      context.addIssue({ code: 'custom', message: 'Informe a duração da irrigação.' });
    }
    if (value.action === 'close' && value.durationSeconds !== undefined) {
      context.addIssue({ code: 'custom', message: 'Fechamento não recebe duração.' });
    }
  });

export const telemetrySchema = z
  .object({
    schemaVersion: z.literal('1.0'),
    deviceId: z.string().min(1).max(80),
    sequence: z.number().int().nonnegative(),
    moisture: z.number().finite().min(0).max(100),
    unit: z.literal('normalizedPercent'),
    valve: z.enum(['open', 'closed']),
    lastCommandId: z.string().uuid().nullable(),
    source: z.enum(['simulated', 'device']),
    water: z
      .object({
        totalLiters: z.number().finite().nonnegative(),
        flowLitersPerHour: z.number().finite().nonnegative(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const ackSchema = z
  .object({
    deviceId: z.string().min(1).max(80),
    commandId: z.string().uuid(),
    status: z.enum(['applied', 'rejected']),
    valve: z.enum(['open', 'closed']),
  })
  .strict();

export type Rule = z.infer<typeof ruleSchema>;
export type CommandInput = z.infer<typeof commandSchema>;
export type Telemetry = z.infer<typeof telemetrySchema>;
export type Ack = z.infer<typeof ackSchema>;
export type CommandStatus = 'pending' | 'applied' | 'rejected' | 'expired' | 'superseded';
export type ValveState = 'open' | 'closed';

export interface Command {
  id: string;
  zoneId: string;
  deviceId: string;
  action: 'open' | 'close';
  durationSeconds?: number;
  idempotencyKey: string;
  origin: 'manual' | 'automatic';
  status: CommandStatus;
  requestedAt: number;
  expiresAt: number;
  appliedAt: number | null;
}

export interface Reading extends Telemetry {
  zoneId: string;
  receivedAt: number;
}

export interface Zone {
  id: string;
  ownerId: string;
  name: string;
  crop: string;
  deviceId: string;
  sensorId: string;
  valveId: string;
  rule: Rule;
  automaticPaused: boolean;
  latest: Reading | null;
  activeCommandId: string | null;
}

export interface IrrigationEvent {
  id: string;
  zoneId: string;
  at: number;
  type: 'command' | 'applied' | 'rejected' | 'expired' | 'rule' | 'safety' | 'topology';
  message: string;
  commandId: string | null;
}

export interface SystemState {
  schemaVersion: '1.0';
  createdAt: number;
  zones: Zone[];
  commands: Command[];
  readings: Reading[];
  events: IrrigationEvent[];
}

export interface Snapshot extends SystemState {
  serverTime: number;
  environment: 'local-simulation';
  offlineAfterMs: number;
}

const persistedCommandSchema: z.ZodType<Command> = z
  .object({
    id: z.string().uuid(),
    zoneId: z.string().min(1).max(80),
    deviceId: z.string().min(1).max(80),
    action: z.enum(['open', 'close']),
    durationSeconds: z.number().int().min(5).max(600).optional(),
    idempotencyKey: z.string().uuid(),
    origin: z.enum(['manual', 'automatic']),
    status: z.enum(['pending', 'applied', 'rejected', 'expired', 'superseded']),
    requestedAt: z.number().int().nonnegative(),
    expiresAt: z.number().int().nonnegative(),
    appliedAt: z.number().int().nonnegative().nullable(),
  })
  .strict();

const readingSchema: z.ZodType<Reading> = telemetrySchema
  .extend({ zoneId: z.string().min(1).max(80), receivedAt: z.number().int().nonnegative() })
  .strict();

const zoneSchema: z.ZodType<Zone> = z
  .object({
    id: z.string().min(1).max(80),
    ownerId: z.string().min(1).max(80),
    name: z.string().trim().min(1).max(80),
    crop: z.string().trim().min(1).max(80),
    deviceId: z.string().min(1).max(80),
    sensorId: z.string().min(1).max(80),
    valveId: z.string().min(1).max(80),
    rule: ruleSchema,
    automaticPaused: z.boolean(),
    latest: readingSchema.nullable(),
    activeCommandId: z.string().uuid().nullable(),
  })
  .strict();

const optionalIdentifier = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(80)
  .optional();
export const zoneCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    crop: z.string().trim().min(2).max(80),
    id: optionalIdentifier,
    deviceId: optionalIdentifier,
    sensorId: optionalIdentifier,
    valveId: optionalIdentifier,
  })
  .strict();
export const zoneUpdateSchema = z
  .object({ name: z.string().trim().min(2).max(80), crop: z.string().trim().min(2).max(80) })
  .strict();
export type ZoneCreate = z.infer<typeof zoneCreateSchema>;
export type ZoneUpdate = z.infer<typeof zoneUpdateSchema>;

const irrigationEventSchema: z.ZodType<IrrigationEvent> = z
  .object({
    id: z.string().uuid(),
    zoneId: z.string().min(1).max(80),
    at: z.number().int().nonnegative(),
    type: z.enum(['command', 'applied', 'rejected', 'expired', 'rule', 'safety', 'topology']),
    message: z.string().min(1).max(500),
    commandId: z.string().uuid().nullable(),
  })
  .strict();

/** Validates the complete durable state before it is accepted or written by an adapter. */
export const systemStateSchema: z.ZodType<SystemState> = z
  .object({
    schemaVersion: z.literal('1.0'),
    createdAt: z.number().int().nonnegative(),
    zones: z.array(zoneSchema).min(1),
    commands: z.array(persistedCommandSchema),
    readings: z.array(readingSchema).max(2000),
    events: z.array(irrigationEventSchema).max(1000),
  })
  .strict()
  .superRefine((state, context) => {
    const zoneIds = new Set<string>();
    const deviceIds = new Set<string>();
    const sensorIds = new Set<string>();
    const valveIds = new Set<string>();
    for (const [index, zone] of state.zones.entries()) {
      if (zoneIds.has(zone.id))
        context.addIssue({ code: 'custom', path: ['zones', index, 'id'], message: 'Área duplicada.' });
      if (deviceIds.has(zone.deviceId))
        context.addIssue({
          code: 'custom',
          path: ['zones', index, 'deviceId'],
          message: 'Dispositivo vinculado a mais de uma área.',
        });
      zoneIds.add(zone.id);
      deviceIds.add(zone.deviceId);
      if (sensorIds.has(zone.sensorId) || valveIds.has(zone.valveId))
        context.addIssue({
          code: 'custom',
          path: ['zones', index],
          message: 'Sensor ou válvula vinculados a mais de uma área.',
        });
      sensorIds.add(zone.sensorId);
      valveIds.add(zone.valveId);
      if (zone.latest && (zone.latest.zoneId !== zone.id || zone.latest.deviceId !== zone.deviceId))
        context.addIssue({
          code: 'custom',
          path: ['zones', index, 'latest'],
          message: 'Última leitura não pertence à área e ao dispositivo vinculados.',
        });
    }
    for (const [index, command] of state.commands.entries()) {
      const zone = state.zones.find((item) => item.id === command.zoneId);
      if (!zone || zone.deviceId !== command.deviceId)
        context.addIssue({
          code: 'custom',
          path: ['commands', index],
          message: 'Comando sem vínculo válido entre área e dispositivo.',
        });
    }
    for (const [index, reading] of state.readings.entries()) {
      const zone = state.zones.find((item) => item.id === reading.zoneId);
      if (!zone || zone.deviceId !== reading.deviceId)
        context.addIssue({
          code: 'custom',
          path: ['readings', index],
          message: 'Leitura sem vínculo válido entre área e dispositivo.',
        });
    }
    for (const [index, event] of state.events.entries()) {
      if (!zoneIds.has(event.zoneId))
        context.addIssue({ code: 'custom', path: ['events', index], message: 'Evento sem área válida.' });
    }
  });

export const sessionLoginSchema = z
  .object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) })
  .strict();

export type SessionLogin = z.infer<typeof sessionLoginSchema>;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface SessionInfo {
  token: string;
  expiresAt: number;
  user: SessionUser;
}
