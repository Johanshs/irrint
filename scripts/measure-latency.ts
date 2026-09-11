import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';

interface SessionInfo {
  token: string;
}

interface Command {
  id: string;
  action: 'open' | 'close';
  status: 'pending' | 'applied' | 'rejected' | 'expired' | 'superseded';
}

interface Snapshot {
  commands: Command[];
  zones: Array<{ id: string; latest: null | { valve: 'open' | 'closed' } }>;
}

const baseUrl = (process.env.IRRINT_API_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '');
const email = process.env.IRRINT_OPERATOR_EMAIL ?? 'produtor@demo.local';
const password = process.env.IRRINT_OPERATOR_PASSWORD ?? 'irrigacao';
const zoneId = process.env.IRRINT_ZONE_ID ?? 'north';
const samples = 30;

async function request<T>(path: string, method = 'GET', body?: unknown, token?: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(6000),
  });
  const value = await response.json().catch(() => ({ error: 'Resposta sem JSON.' }));
  if (!response.ok)
    throw new Error(`${method} ${path} retornou ${response.status}: ${(value as { error?: string }).error}`);
  return value as T;
}

function percentile(values: number[], percentileValue: number) {
  const ordered = values.slice().sort((a, b) => a - b);
  return ordered[Math.max(0, Math.ceil(ordered.length * percentileValue) - 1)];
}

const session = await request<SessionInfo>('/api/v1/session', 'POST', { email, password });
async function waitForCommand(command: Command, token: string, timeoutMs = 6000) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    const state = await request<Snapshot>('/api/v1/state', 'GET', undefined, token);
    const current = state.commands.find((candidate) => candidate.id === command.id);
    const reportedValve = state.zones.find((zone) => zone.id === zoneId)?.latest?.valve;
    const expectedValve = command.action === 'open' ? 'open' : 'closed';
    if (current?.status === 'applied' && reportedValve === expectedValve) return current.status;
    if (current && current.status !== 'pending' && current.status !== 'applied') return current.status;
    await delay(50);
  }
  return 'timeout' as const;
}

const preparation = await request<Command>(
  `/api/v1/zones/${encodeURIComponent(zoneId)}/commands`,
  'POST',
  { action: 'close', idempotencyKey: randomUUID() },
  session.token,
);
const preparationStatus = await waitForCommand(preparation, session.token);
if (preparationStatus !== 'applied')
  throw new Error(`A parada de preparação terminou como ${preparationStatus}; ensaio cancelado.`);
const results: Array<{
  sample: number;
  action: 'open' | 'close';
  commandId: string;
  status: Command['status'] | 'timeout';
  confirmationMs: number | null;
}> = [];

for (let index = 0; index < samples; index++) {
  const action = index % 2 === 0 ? 'open' : 'close';
  const started = performance.now();
  const command = await request<Command>(
    `/api/v1/zones/${encodeURIComponent(zoneId)}/commands`,
    'POST',
    {
      action,
      idempotencyKey: randomUUID(),
      ...(action === 'open' ? { durationSeconds: 60 } : {}),
    },
    session.token,
  );
  let finalStatus: Command['status'] | 'timeout' = 'timeout';
  let confirmationMs: number | null = null;
  finalStatus = await waitForCommand(command, session.token);
  if (finalStatus !== 'timeout') confirmationMs = Math.round((performance.now() - started) * 100) / 100;
  results.push({ sample: index + 1, action, commandId: command.id, status: finalStatus, confirmationMs });
}

const confirmed = results.filter(
  (result): result is typeof result & { confirmationMs: number } =>
    result.status === 'applied' && result.confirmationMs !== null,
);
const latencies = confirmed.map((result) => result.confirmationMs);
const report = {
  version: '1.0',
  measuredAt: new Date().toISOString(),
  environment: {
    api: baseUrl,
    zoneId,
    client: `Node ${process.version} ${process.platform}/${process.arch}`,
    devicePollingIntervalMs: 1000,
    mode: 'processos locais aquecidos; sem dispositivo físico',
  },
  samples,
  applied: confirmed.length,
  timeouts: results.filter((result) => result.status === 'timeout').length,
  errors: results.filter((result) => !['applied', 'timeout'].includes(result.status)).length,
  milliseconds: {
    min: latencies.length ? Math.min(...latencies) : null,
    median: latencies.length ? percentile(latencies, 0.5) : null,
    p95: latencies.length ? percentile(latencies, 0.95) : null,
    max: latencies.length ? Math.max(...latencies) : null,
  },
  results,
  limitation:
    'Mede API e cliente OpenAPI em processos locais na mesma máquina. Não representa latência de ESP32, Internet ou campo.',
};
const directory = resolve('.local', 'latency', report.measuredAt.replaceAll(':', '-'));
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, 'latency.json'), JSON.stringify(report, null, 2), 'utf8');
await writeFile(
  resolve(directory, 'RESUMO.md'),
  `# Latência de confirmação HTTP\n\n- Amostras: ${samples}\n- Aplicadas: ${report.applied}\n- Timeouts: ${report.timeouts}\n- Erros: ${report.errors}\n- Mediana: ${report.milliseconds.median ?? '—'} ms\n- p95: ${report.milliseconds.p95 ?? '—'} ms\n- Máxima: ${report.milliseconds.max ?? '—'} ms\n- Polling do dispositivo: 1000 ms\n\n${report.limitation}\n`,
  'utf8',
);
console.log(`Latência: ${directory}`);
console.log(
  `${report.applied}/${samples} aplicados; mediana ${report.milliseconds.median ?? '—'} ms; p95 ${report.milliseconds.p95 ?? '—'} ms; ${report.timeouts} timeout(s).`,
);
if (report.applied !== samples) process.exitCode = 1;
