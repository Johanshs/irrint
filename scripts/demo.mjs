import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';

const children = [];
const lan = process.argv.includes('--lan');
const referenceDevice = process.argv.includes('--reference-device');
let stopping = false;
function start(script, args = [], env = process.env) {
  const child = spawn(process.execPath, [resolve(script), ...args], {
    stdio: 'inherit',
    windowsHide: true,
    env,
  });
  children.push(child);
  child.on('exit', (code) => {
    if (!stopping) stop(code ?? 1);
  });
  return child;
}
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
try {
  try {
    await fetch('http://127.0.0.1:8787/api/v1/state', { signal: AbortSignal.timeout(300) });
    throw new Error('Já existe um serviço na porta 8787. Encerre a outra demonstração antes de iniciar.');
  } catch (error) {
    if (error.message.startsWith('Já existe')) throw error;
  }
  start('node_modules/tsx/dist/cli.mjs', ['server/local.ts'], {
    ...process.env,
    IRRINT_DEMO_NETWORK: lan ? 'lan' : 'loopback',
  });
  let ready = false;
  for (let attempt = 0; attempt < 50 && !stopping; attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:8787/api/v1/openapi.json');
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* The API has not bound its port yet. */
    }
    await delay(200);
  }
  if (!ready || stopping) throw new Error('API local não ficou pronta.');
  start('node_modules/tsx/dist/cli.mjs', [
    referenceDevice ? 'clients/openapi-device.ts' : 'simulator/run.ts',
  ]);
  start('node_modules/vite/bin/vite.js', [
    '--host',
    lan ? '0.0.0.0' : '127.0.0.1',
    '--port',
    '5173',
    '--strictPort',
  ]);
} catch (error) {
  console.error(error.message);
  stop(1);
}
