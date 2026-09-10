import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { initialState, IrrigationControl } from '../shared/control.ts';
import type { SystemState } from '../shared/contracts.ts';
import { createApi } from './api.ts';
import { setTimeout as delay } from 'node:timers/promises';

const directory = resolve('.local');
await mkdir(directory, { recursive: true });
const path = resolve(directory, 'state.json');
let state = initialState(Date.now());
try {
  const saved = JSON.parse(await readFile(path, 'utf8')) as SystemState;
  if (saved.schemaVersion !== '1.0' || !Array.isArray(saved.zones) || !Array.isArray(saved.commands))
    throw new Error('Estado local incompatível; preserve o arquivo para análise.');
  state = saved;
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
const token = randomBytes(32).toString('hex');
const control = new IrrigationControl(state);
const api = createApi(control, {
  deviceToken: token,
  persist: async () => {
    await writeFile(`${path}.tmp`, JSON.stringify(control.exportState()), 'utf8');
    // OneDrive/antivirus can briefly hold the destination on Windows. Keep the old file intact.
    for (let attempt = 0; ; attempt++) {
      try {
        await rename(`${path}.tmp`, path);
        break;
      } catch (error) {
        if (
          attempt >= 4 ||
          !['EPERM', 'EBUSY', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')
        )
          throw error;
        await delay(25 * 2 ** attempt);
      }
    }
  },
});
api.listen(8787, '127.0.0.1', async () => {
  await writeFile(resolve(directory, 'device-token'), token, { mode: 0o600 });
  console.log('API demonstrativa local: http://127.0.0.1:8787 — dados em .local/state.json');
});
api.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => api.close(() => process.exit()));
