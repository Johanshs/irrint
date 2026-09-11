import { z } from 'zod';
import type { Command, IrrigationEvent, Reading, Zone } from './contracts';
import type { WaterState } from './water';

export const scenarios = [
  {
    id: 'automatic',
    name: 'Solo seco e recuperação',
    description: 'O sistema escolhido começa seco, abre abaixo de 35% e fecha ao atingir 45%.',
    expected: 'Irrigar até o limite superior, mantendo o outro canteiro fechado.',
  },
  {
    id: 'manual-stop',
    name: 'Parada manual prioritária',
    description:
      'O automático inicia. Aos 4 s, uma parada manual interrompe a irrigação ainda com solo seco.',
    expected: 'Fechar e suspender o automático, sem reabrir sozinho.',
  },
  {
    id: 'connection-loss',
    name: 'Perda de comunicação',
    description:
      'O contato cai aos 5 s e volta aos 30 s. O dispositivo tem um limite local de 12 s irrigando.',
    expected: 'Parar no dispositivo mesmo sem rede e reconciliar o estado ao reconectar.',
  },
  {
    id: 'unconfirmed',
    name: 'Confirmação perdida',
    description:
      'A abertura chega ao dispositivo, mas a confirmação e as leituras seguintes se perdem até os 30 s.',
    expected: 'Mostrar incerteza ao operador, sem inventar uma confirmação de abertura ou fechamento.',
  },
  {
    id: 'command-timeout',
    name: 'Comando não entregue',
    description:
      'As leituras chegam, mas a entrega do comando fica retida até os 12 s, depois de sua validade de 8 s.',
    expected: 'Expirar a solicitação e recusar a entrega tardia, sem liberar água.',
  },
  {
    id: 'duplicate',
    name: 'Comando repetido',
    description: 'O mesmo início de 12 s é reenviado quatro vezes; o dispositivo também recebe a repetição.',
    expected: 'Executar uma única abertura, sem reiniciar a duração nem duplicar o volume.',
  },
  {
    id: 'invalid-reading',
    name: 'Leituras inválidas e antigas',
    description:
      'Entre 5 e 9 s, chegam valor fora da faixa, unidade incorreta, campo ausente e sequência repetida.',
    expected:
      'Rejeitar as cinco amostras, preservar a última leitura válida e recuperar a recepção aos 10 s.',
  },
  {
    id: 'stuck-valve',
    name: 'Válvula travada aberta',
    description:
      'A irrigação inicia normalmente, mas a válvula rejeita o fechamento e continua liberando água.',
    expected:
      'Manter um alerta sem declarar parada, mostrar o fluxo interno e registrar o consumo crescente.',
  },
] as const;
export const experimentSchema = z
  .object({
    scenario: z.enum([
      'automatic',
      'manual-stop',
      'connection-loss',
      'unconfirmed',
      'command-timeout',
      'duplicate',
      'invalid-reading',
      'stuck-valve',
    ]),
    seed: z.number().int().min(1).max(2147483646),
    zoneId: z.enum(['north', 'south']).default('north'),
  })
  .strict();
export type ExperimentInput = z.input<typeof experimentSchema>;
export type ExperimentParameters = z.output<typeof experimentSchema>;
export interface ExperimentFrame {
  second: number;
  at: number;
  zones: Zone[];
  commands: Command[];
  deviceOpen: Record<string, boolean>;
  deviceWater: Record<string, WaterState>;
  deviceMoisture: Record<string, number>;
  communication: boolean;
}
export interface ExperimentMoment {
  second: number;
  source: 'test' | 'controller' | 'device';
  kind: 'reading' | 'decision' | 'command' | 'confirmation' | 'water' | 'fault' | 'recovery';
  title: string;
  description: string;
  commandId?: string;
}
export interface ExperimentReport {
  version: '1.1';
  model: 'linear-educational-v3';
  id: string;
  createdAt: number;
  input: ExperimentParameters;
  durationSeconds: number;
  stepSeconds: number;
  frames: ExperimentFrame[];
  readings: Reading[];
  events: IrrigationEvent[];
  moments: ExperimentMoment[];
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
