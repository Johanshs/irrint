import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

type HttpMethod = 'get' | 'post' | 'put';

interface Operation {
  operationId?: string;
}

interface OpenApiDocument {
  openapi: string;
  info: { version: string };
  paths: Record<string, Partial<Record<HttpMethod, Operation>>>;
}

interface Route {
  method: HttpMethod;
  path: string;
}

interface DeviceConfig {
  id: string;
  deviceId: string;
  latest: null | {
    sequence: number;
    moisture: number;
    water?: { totalLiters: number; flowLitersPerHour: number };
  };
}

interface WireCommand {
  id: string;
  deviceId: string;
  action: 'open' | 'close';
  status: 'pending' | 'applied' | 'rejected' | 'expired' | 'superseded';
  durationSeconds?: number;
  expiresAt: number;
}

interface ClientOptions {
  baseUrl: string;
  token: string;
  runnerId: string;
  deviceId: string;
  initialMoisture?: number;
  flowLitersPerHour?: number;
}

interface ConnectionOptions {
  baseUrl: string;
  token: string;
  runnerId: string;
}

class OpenApiTransport {
  private readonly routes = new Map<string, Route>();

  private constructor(
    private readonly options: ConnectionOptions,
    public readonly contractVersion: string,
  ) {}

  static async connect(options: ConnectionOptions) {
    const response = await fetch(`${options.baseUrl}/api/v1/openapi.json`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error(`Não foi possível obter o contrato OpenAPI (${response.status}).`);
    const document = (await response.json()) as OpenApiDocument;
    if (document.openapi !== '3.1.0') throw new Error(`OpenAPI incompatível: ${document.openapi}.`);
    const transport = new OpenApiTransport(options, document.info.version);
    for (const [path, definition] of Object.entries(document.paths))
      for (const method of ['get', 'post', 'put'] as const) {
        const operationId = definition[method]?.operationId;
        if (operationId) transport.routes.set(operationId, { method, path });
      }
    for (const required of ['getDeviceConfiguration', 'pollCommands', 'sendTelemetry', 'acknowledgeCommand'])
      if (!transport.routes.has(required)) throw new Error(`Operação ausente no contrato: ${required}.`);
    return transport;
  }

  async request<T>(operationId: string, parameters: Record<string, string> = {}, body?: unknown) {
    const route = this.routes.get(operationId);
    if (!route) throw new Error(`Operação OpenAPI desconhecida: ${operationId}.`);
    const path = route.path.replace(/\{([^}]+)\}/g, (_, name: string) => {
      const value = parameters[name];
      if (!value) throw new Error(`Parâmetro ${name} ausente para ${operationId}.`);
      return encodeURIComponent(value);
    });
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      method: route.method.toUpperCase(),
      headers: {
        Authorization: `Bearer ${this.options.token}`,
        'Content-Type': 'application/json',
        'X-Runner-Id': this.options.runnerId,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    const value = await response.json().catch(() => ({ error: 'Resposta sem JSON.' }));
    if (!response.ok)
      throw new Error(
        `${operationId} retornou ${response.status}: ${(value as { error?: string }).error ?? 'erro remoto'}`,
      );
    return value as T;
  }
}

export async function discoverDevices(options: ConnectionOptions) {
  const transport = await OpenApiTransport.connect(options);
  return {
    contractVersion: transport.contractVersion,
    devices: await transport.request<DeviceConfig[]>('getDeviceConfiguration'),
  };
}

/**
 * Reference device written only against the published HTTP/OpenAPI surface.
 * It deliberately imports neither the domain controller nor the simulator.
 */
export class OpenApiDeviceClient {
  private transport: OpenApiTransport | null = null;
  private sequence = 0;
  private moisture: number;
  private valve: 'open' | 'closed' = 'closed';
  private lastCommandId: string | null = null;
  private closesAt: number | null = null;
  private accountedAt: number | null = null;
  private totalLiters = 0;
  private readonly applied = new Set<string>();
  private readonly flowLitersPerHour: number;

  constructor(private readonly options: ClientOptions) {
    this.moisture = options.initialMoisture ?? 34;
    this.flowLitersPerHour = options.flowLitersPerHour ?? 36;
  }

  async connect() {
    this.transport = await OpenApiTransport.connect(this.options);
    const configuration = await this.transport.request<DeviceConfig[]>('getDeviceConfiguration');
    const linked = configuration.find((candidate) => candidate.deviceId === this.options.deviceId);
    if (!linked) throw new Error(`Dispositivo ${this.options.deviceId} não está vinculado a uma área.`);
    if (linked.latest) {
      this.sequence = linked.latest.sequence;
      this.moisture = linked.latest.moisture;
      this.totalLiters = linked.latest.water?.totalLiters ?? 0;
    }
    return { contractVersion: this.transport.contractVersion, zoneId: linked.id };
  }

  async cycle(now = Date.now(), seconds = 1) {
    if (!this.transport) throw new Error('Conecte o cliente antes de iniciar o ciclo.');
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 5) throw new Error('Passo inválido.');
    this.accountWater(now);
    if (this.closesAt !== null && now >= this.closesAt) {
      this.valve = 'closed';
      this.closesAt = null;
    }
    this.moisture = Math.max(
      0,
      Math.min(100, this.moisture + (this.valve === 'open' ? 0.8 : -0.1) * seconds),
    );
    this.sequence += 1;
    await this.transport.request(
      'sendTelemetry',
      {},
      {
        schemaVersion: '1.0',
        deviceId: this.options.deviceId,
        sequence: this.sequence,
        moisture: Math.round(this.moisture * 100) / 100,
        unit: 'normalizedPercent',
        valve: this.valve,
        lastCommandId: this.lastCommandId,
        source: 'device',
        water: {
          totalLiters: Math.round(this.totalLiters * 1_000_000) / 1_000_000,
          flowLitersPerHour: this.valve === 'open' ? this.flowLitersPerHour : 0,
        },
      },
    );
    const commands = await this.transport.request<WireCommand[]>('pollCommands', {
      deviceId: this.options.deviceId,
    });
    for (const command of commands) await this.apply(command, now);
    return {
      sequence: this.sequence,
      moisture: Math.round(this.moisture * 100) / 100,
      valve: this.valve,
      totalLiters: Math.round(this.totalLiters * 1_000_000) / 1_000_000,
      commands: commands.length,
    };
  }

  private async apply(command: WireCommand, now: number) {
    if (!this.transport || command.deviceId !== this.options.deviceId || command.status !== 'pending') return;
    if (now >= command.expiresAt)
      return this.transport.request(
        'acknowledgeCommand',
        {},
        {
          deviceId: this.options.deviceId,
          commandId: command.id,
          status: 'rejected',
          valve: this.valve,
        },
      );
    if (!this.applied.has(command.id)) {
      this.accountWater(now);
      this.applied.add(command.id);
      this.lastCommandId = command.id;
      this.valve = command.action === 'open' ? 'open' : 'closed';
      this.closesAt = command.action === 'open' ? now + (command.durationSeconds ?? 5) * 1000 : null;
    }
    await this.transport.request(
      'acknowledgeCommand',
      {},
      {
        deviceId: this.options.deviceId,
        commandId: command.id,
        status: 'applied',
        valve: this.valve,
      },
    );
  }

  private accountWater(now: number) {
    if (this.accountedAt === null) {
      this.accountedAt = now;
      return;
    }
    const until = this.closesAt === null ? now : Math.min(now, this.closesAt);
    if (this.valve === 'open' && until > this.accountedAt)
      this.totalLiters += ((until - this.accountedAt) / 3_600_000) * this.flowLitersPerHour;
    this.accountedAt = Math.max(this.accountedAt, now);
  }
}

async function run() {
  const baseUrl = process.env.IRRINT_API_URL ?? 'http://127.0.0.1:8787';
  const token = (
    process.env.IRRINT_DEVICE_TOKEN ?? (await readFile(resolve('.local/device-token'), 'utf8'))
  ).trim();
  const runnerId = process.env.IRRINT_RUNNER_ID ?? `openapi-${randomUUID()}`;
  const connection = { baseUrl, token, runnerId };
  const clients = new Map<string, OpenApiDeviceClient>();
  const sync = async () => {
    const discovery = await discoverDevices(connection);
    const configured = new Set(discovery.devices.map((device) => device.deviceId));
    for (const deviceId of clients.keys()) {
      if (!configured.has(deviceId)) clients.delete(deviceId);
    }
    for (const config of discovery.devices) {
      if (clients.has(config.deviceId)) continue;
      const client = new OpenApiDeviceClient({
        ...connection,
        deviceId: config.deviceId,
        initialMoisture:
          config.latest?.moisture ?? (config.id === 'north' || config.id.endsWith('-north') ? 34 : 52),
      });
      await client.connect();
      clients.set(config.deviceId, client);
      console.log(`Cliente OpenAPI ${config.deviceId} conectado ao contrato ${discovery.contractVersion}.`);
    }
  };
  await sync();
  const active = new Set<string>();
  const timer = setInterval(() => {
    for (const [deviceId, client] of clients) {
      if (active.has(deviceId)) continue;
      active.add(deviceId);
      void client
        .cycle()
        .catch((error) => console.error(error instanceof Error ? error.message : 'Falha no cliente OpenAPI.'))
        .finally(() => active.delete(deviceId));
    }
  }, 1000);
  const configurationTimer = setInterval(() => {
    void sync().catch((error) =>
      console.error(error instanceof Error ? error.message : 'Falha ao atualizar vínculos OpenAPI.'),
    );
  }, 5000);
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.on(signal, () => {
      clearInterval(timer);
      clearInterval(configurationTimer);
    });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Falha ao iniciar o cliente OpenAPI.');
    process.exitCode = 1;
  });
