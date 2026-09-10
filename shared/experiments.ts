import { z } from 'zod';
import type { Command, IrrigationEvent, Reading, Zone } from './contracts';
import type { WaterState } from './water';

export const scenarios = [
  {
    id: 'automatic',
    name: 'Solo seco e recuperação',
    description:
      'A área norte inicia abaixo de 35%, irriga e para em 45%. A área sul permanece independente.',
  },
  {
    id: 'connection-loss',
    name: 'Perda de comunicação',
    description: 'O contato cai entre 5 e 30 s. O dispositivo deve parar sozinho após 12 s de irrigação.',
  },
  {
    id: 'duplicate',
    name: 'Comando repetido',
    description:
      'O mesmo início é reenviado. A repetição deve preservar uma única operação e o prazo de parada.',
  },
] as const;
export const experimentSchema = z
  .object({
    scenario: z.enum(['automatic', 'connection-loss', 'duplicate']),
    seed: z.number().int().min(1).max(2147483646),
  })
  .strict();
export type ExperimentInput = z.infer<typeof experimentSchema>;
export interface ExperimentFrame {
  second: number;
  at: number;
  zones: Zone[];
  commands: Command[];
  deviceOpen: Record<string, boolean>;
  deviceWater: Record<string, WaterState>;
  communication: boolean;
}
export interface ExperimentReport {
  version: '1.0';
  model: 'linear-educational-v2';
  id: string;
  createdAt: number;
  input: ExperimentInput;
  durationSeconds: number;
  stepSeconds: number;
  frames: ExperimentFrame[];
  readings: Reading[];
  events: IrrigationEvent[];
  checks: { name: string; passed: boolean; evidence: string }[];
  metrics: {
    confirmedCommands: number;
    totalCommands: number;
    openSeconds: number;
    inRangePercent: number;
    totalLiters: number;
  };
  limitations: string[];
}
