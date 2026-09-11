import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { initialState, IrrigationControl } from '../shared/control.ts';
import { createApi } from './api.ts';
import { JsonFileStateStore } from './storage.ts';

const directory = resolve('.local');
await mkdir(directory, { recursive: true });
const path = resolve(directory, 'state.json');
const store = new JsonFileStateStore(path);
const loaded = await store.load(initialState(Date.now()));
const state = loaded.state;
if (loaded.recoveredFromBackup)
  console.warn('Estado principal inválido. A sessão foi recuperada da cópia de segurança.');
const token = randomBytes(32).toString('hex');
const control = new IrrigationControl(state);
const api = createApi(control, {
  deviceToken: token,
  persist: () => store.save(control.exportState()),
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
