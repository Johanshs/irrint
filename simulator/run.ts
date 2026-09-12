import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { SimulatedDevice } from './device.ts';
import type { Command, Reading } from '../shared/contracts.ts';

const api = 'http://127.0.0.1:8787';
const token = (await readFile(resolve('.local/device-token'), 'utf8')).trim();
const runnerId = randomUUID();
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${api}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Runner-Id': runnerId,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(2000),
  });
  if (!response.ok) throw new Error(`API retornou ${response.status} em ${path}`);
  return response.json() as Promise<T>;
}
interface DeviceConfig {
  id: string;
  deviceId: string;
  latest: Reading | null;
}
const devices = new Map<string, SimulatedDevice>();
async function syncConfiguration() {
  const configuration = await request<DeviceConfig[]>('/device/v1/config');
  const configured = new Set(configuration.map((zone) => zone.deviceId));
  for (const deviceId of devices.keys()) {
    if (!configured.has(deviceId)) devices.delete(deviceId);
  }
  for (const zone of configuration) {
    if (devices.has(zone.deviceId)) continue;
    devices.set(
      zone.deviceId,
      new SimulatedDevice(
        zone.deviceId,
        zone.latest?.moisture ?? (zone.id === 'north' || zone.id.endsWith('-north') ? 38 : 55),
        zone.id === 'north' || zone.id.endsWith('-north') ? 2026 : 2027,
        zone.latest?.sequence ?? 0,
        zone.latest?.water,
      ),
    );
    console.log(`Dispositivo simulado vinculado: ${zone.deviceId}.`);
  }
}
await syncConfiguration();
console.log('Runner iniciado; passo de 1 segundo e descoberta de novas áreas a cada 5 segundos.');
const sending = new Set<string>();
const tick = () => {
  for (const device of devices.values()) {
    // This fixed timer advances the watchdog even while a network request is waiting.
    const reading = device.step(1, Date.now());
    if (sending.has(device.deviceId)) continue;
    sending.add(device.deviceId);
    void (async () => {
      try {
        await request('/device/v1/telemetry', reading);
        const commands = await request<Command[]>(`/device/v1/commands/${device.deviceId}`);
        for (const command of commands) {
          if (device.apply(command, Date.now()))
            await request('/device/v1/ack', {
              deviceId: device.deviceId,
              commandId: command.id,
              status: 'applied',
              valve: command.action === 'open' ? 'open' : 'closed',
            });
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : 'Falha de comunicação.');
      } finally {
        sending.delete(device.deviceId);
      }
    })();
  }
};
const timer = setInterval(tick, 1000);
const configurationTimer = setInterval(() => {
  void syncConfiguration().catch((error) =>
    console.error(error instanceof Error ? error.message : 'Falha ao atualizar vínculos.'),
  );
}, 5000);
tick();
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    clearInterval(timer);
    clearInterval(configurationTimer);
  });
