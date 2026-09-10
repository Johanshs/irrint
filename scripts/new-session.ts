import { mkdir, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { initialState } from '../shared/control.ts';

try {
  await fetch('http://127.0.0.1:8787/api/v1/state', { signal: AbortSignal.timeout(1000) });
  console.error('Encerre a demonstração com Ctrl+C antes de iniciar uma nova sessão.');
  process.exit(1);
} catch {
  /* No local API is running. */
}
const directory = resolve('.local');
const archive = resolve(directory, 'archive');
await mkdir(archive, { recursive: true });
const backup = resolve(archive, `state-${new Date().toISOString().replaceAll(':', '-')}.json`);
try {
  await rename(resolve(directory, 'state.json'), backup);
  console.log(`Sessão anterior preservada: ${backup}`);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
await writeFile(resolve(directory, 'state.json'), JSON.stringify(initialState(Date.now())));
console.log('Nova sessão preparada. Execute npm run demo:start.');
