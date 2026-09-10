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
    source: z.literal('simulated'),
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
  name: string;
  crop: string;
  deviceId: string;
  rule: Rule;
  automaticPaused: boolean;
  latest: Reading | null;
  activeCommandId: string | null;
}

export interface IrrigationEvent {
  id: string;
  zoneId: string;
  at: number;
  type: 'command' | 'applied' | 'rejected' | 'expired' | 'rule' | 'safety';
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
