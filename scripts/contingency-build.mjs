import { access, copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

const argument = process.argv.find((value) => value.startsWith('--api='))?.slice('--api='.length);
const endpoint = argument ?? process.env.IRRINT_API_URL ?? 'http://192.168.137.1:8787';
const parsed = new URL(endpoint);
if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('O endpoint precisa usar HTTP ou HTTPS.');

async function androidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.platform === 'win32' ? resolve(homedir(), 'AppData', 'Local', 'Android', 'Sdk') : undefined,
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      /* Try the next known SDK location. */
    }
  }
  throw new Error('Android SDK não encontrado. Instale-o ou configure ANDROID_HOME.');
}

function run(command, args, env = process.env, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env,
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolvePromise() : reject(new Error(`${command} terminou com código ${code}.`)),
    );
  });
}

async function syncAndroidAssets(environment) {
  try {
    await run('npx', ['cap', 'sync', 'android'], environment);
  } catch (error) {
    console.warn(`Capacitor CLI indisponível (${error.message}). Aplicando sincronização local do bundle.`);
    const assetsDirectory = resolve('android', 'app', 'src', 'main', 'assets');
    const publicDirectory = resolve(assetsDirectory, 'public');
    await rm(publicDirectory, { recursive: true, force: true });
    await cp(resolve('dist'), publicDirectory, { recursive: true });
    await writeFile(
      resolve(assetsDirectory, 'capacitor.config.json'),
      `${JSON.stringify(JSON.parse(await readFile(resolve('capacitor.config.json'), 'utf8')), null, '\t')}\n`,
      'utf8',
    );
    await writeFile(resolve(assetsDirectory, 'capacitor.plugins.json'), '{}\n', 'utf8');
  }
}

const sdk = await androidSdk();
const buildEnvironment = {
  ...process.env,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
  GRADLE_USER_HOME:
    process.env.GRADLE_USER_HOME ?? resolve(process.env.USERPROFILE ?? homedir(), '.gradle'),
  VITE_ALLOW_API_OVERRIDE: 'true',
  VITE_API_BASE_URL: endpoint.replace(/\/$/, ''),
};
await run('npm', ['run', 'build'], buildEnvironment);
await syncAndroidAssets(buildEnvironment);
await run(
  process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
  [':app:assembleDebug', '-PirrintContingency=true'],
  buildEnvironment,
  resolve('android'),
);

const outputDirectory = resolve('contingency');
await mkdir(outputDirectory, { recursive: true });
const source = resolve('android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const destination = resolve(outputDirectory, 'Irrint-contingencia-debug.apk');
await copyFile(source, destination);
const digest = createHash('sha256')
  .update(await readFile(destination))
  .digest('hex');
await writeFile(
  resolve(outputDirectory, 'Irrint-contingencia-debug.apk.sha256'),
  `${digest}  Irrint-contingencia-debug.apk\n`,
  'utf8',
);
await writeFile(
  resolve(outputDirectory, 'endpoint-padrao.txt'),
  `${endpoint.replace(/\/$/, '')}\nO endereço pode ser alterado no login do APK de contingência.\n`,
  'utf8',
);
console.log(`APK de contingência criado em ${destination}`);
console.log(`SHA-256: ${digest}`);
