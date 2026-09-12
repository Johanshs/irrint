import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Pool } from 'pg';
import { systemStateSchema, type SystemState } from '../shared/contracts.ts';

export interface StateStore {
  load(fallback: SystemState): Promise<{ state: SystemState; recoveredFromBackup: boolean }>;
  save(state: SystemState): Promise<void>;
  close?(): Promise<void>;
}

function validStoredState(raw: unknown) {
  const candidate = structuredClone(raw);
  if (candidate && typeof candidate === 'object' && Array.isArray((candidate as { zones?: unknown }).zones)) {
    (candidate as { zones: unknown[] }).zones = (candidate as { zones: unknown[] }).zones.map(
      (zone: unknown) => {
        if (!zone || typeof zone !== 'object') return zone;
        const id = 'id' in zone && typeof zone.id === 'string' ? zone.id : 'unbound';
        return {
          ...zone,
          ownerId: 'ownerId' in zone ? zone.ownerId : 'demo-producer',
          sensorId: 'sensorId' in zone ? zone.sensorId : `soil-${id}`,
          valveId: 'valveId' in zone ? zone.valveId : `valve-${id}`,
        };
      },
    );
  }
  return systemStateSchema.parse(candidate);
}

export class JsonFileStateStore implements StateStore {
  private readonly backupPath: string;
  private readonly temporaryPath: string;

  constructor(private readonly path: string) {
    this.backupPath = `${path}.bak`;
    this.temporaryPath = `${path}.tmp`;
  }

  private async read(path: string): Promise<SystemState> {
    return validStoredState(JSON.parse(await readFile(path, 'utf8')));
  }

  async load(fallback: SystemState) {
    await mkdir(dirname(this.path), { recursive: true });
    try {
      return { state: await this.read(this.path), recoveredFromBackup: false };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { state: systemStateSchema.parse(fallback), recoveredFromBackup: false };
      }
      try {
        const backup = await this.read(this.backupPath);
        const corruptPath = `${this.path}.corrupt-${Date.now()}`;
        await rename(this.path, corruptPath);
        await copyFile(this.backupPath, this.path);
        return { state: backup, recoveredFromBackup: true };
      } catch (backupError) {
        throw new Error('Estado local inválido e sem cópia de segurança utilizável.', {
          cause: { primary: error, backup: backupError },
        });
      }
    }
  }

  async save(state: SystemState) {
    const valid = systemStateSchema.parse(state);
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.temporaryPath, JSON.stringify(valid), 'utf8');
    try {
      await copyFile(this.path, this.backupPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    for (let attempt = 0; ; attempt++) {
      try {
        await rename(this.temporaryPath, this.path);
        return;
      } catch (error) {
        if (
          attempt >= 4 ||
          !['EPERM', 'EBUSY', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')
        )
          throw error;
        await delay(25 * 2 ** attempt);
      }
    }
  }
}

/** Persists the validated demonstration state in the PostgreSQL service supplied by the host. */
export class PostgresStateStore implements StateStore {
  private initialization: Promise<void> | null = null;
  private readonly pool: Pool;

  constructor(databaseUrl: string, pool?: Pool) {
    const hostname = new URL(databaseUrl).hostname;
    const local = hostname === 'localhost' || hostname === '127.0.0.1';
    this.pool =
      pool ??
      new Pool({
        connectionString: databaseUrl,
        max: 2,
        ssl: local ? undefined : { rejectUnauthorized: false },
      });
  }

  private async initialize() {
    this.initialization ??= this.pool
      .query(
        `
        CREATE TABLE IF NOT EXISTS irrint_state (
          id SMALLINT PRIMARY KEY CHECK (id = 1),
          state JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `,
      )
      .then(() => undefined);
    await this.initialization;
  }

  async load(fallback: SystemState) {
    await this.initialize();
    const validFallback = validStoredState(fallback);
    await this.pool.query(
      'INSERT INTO irrint_state (id, state) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING',
      [JSON.stringify(validFallback)],
    );
    const result = await this.pool.query<{ state: unknown }>('SELECT state FROM irrint_state WHERE id = 1');
    if (!result.rows[0]) throw new Error('O PostgreSQL não retornou o estado persistido do Irrint.');
    return { state: validStoredState(result.rows[0].state), recoveredFromBackup: false };
  }

  async save(state: SystemState) {
    await this.initialize();
    const valid = validStoredState(state);
    await this.pool.query(
      `INSERT INTO irrint_state (id, state, updated_at)
       VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()`,
      [JSON.stringify(valid)],
    );
  }

  async close() {
    await this.pool.end();
  }
}
