import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { systemStateSchema, type SystemState } from '../shared/contracts.ts';

export interface StateStore {
  load(fallback: SystemState): Promise<{ state: SystemState; recoveredFromBackup: boolean }>;
  save(state: SystemState): Promise<void>;
}

export class JsonFileStateStore implements StateStore {
  private readonly backupPath: string;
  private readonly temporaryPath: string;

  constructor(private readonly path: string) {
    this.backupPath = `${path}.bak`;
    this.temporaryPath = `${path}.tmp`;
  }

  private async read(path: string): Promise<SystemState> {
    return systemStateSchema.parse(JSON.parse(await readFile(path, 'utf8')));
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
