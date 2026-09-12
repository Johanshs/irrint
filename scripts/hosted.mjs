import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const children = [];
const port = process.env.PORT ?? '8787';
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
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());

try {
  if (!process.env.IRRINT_DEVICE_TOKEN) throw new Error('Configure IRRINT_DEVICE_TOKEN.');
  start('node_modules/tsx/dist/cli.mjs', ['server/hosted.ts']);
  let ready = false;
  for (let attempt = 0; attempt < 100 && !stopping; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* The hosted API has not bound its port yet. */
    }
    await delay(200);
  }
  if (!ready || stopping) throw new Error('API hospedada não ficou pronta.');
  start('node_modules/tsx/dist/cli.mjs', ['clients/openapi-device.ts'], {
    ...process.env,
    IRRINT_API_URL: `http://127.0.0.1:${port}`,
    IRRINT_RUNNER_ID: process.env.IRRINT_RUNNER_ID ?? 'hosted-openapi-runner',
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha ao iniciar o serviço hospedado.');
  stop(1);
}
