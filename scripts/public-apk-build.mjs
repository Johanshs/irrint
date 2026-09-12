import { access, copyFile, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const packageMetadata = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
const productionEnvironment = await readFile(resolve('.env.production'), 'utf8');
const configuredApi = productionEnvironment
  .split(/\r?\n/)
  .find((line) => line.startsWith('VITE_API_BASE_URL='))
  ?.slice('VITE_API_BASE_URL='.length)
  .trim();
const endpoint = process.env.IRRINT_PUBLIC_API_URL ?? configuredApi;
if (!endpoint || new URL(endpoint).protocol !== 'https:') {
  throw new Error('O APK público exige VITE_API_BASE_URL com HTTPS em .env.production.');
}

async function firstAccessible(candidates) {
  for (const candidate of candidates.filter(Boolean)) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      /* Try the next candidate. */
    }
  }
  return undefined;
}

async function androidSdk() {
  const sdk = await firstAccessible([
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.platform === 'win32' ? resolve(homedir(), 'AppData', 'Local', 'Android', 'Sdk') : undefined,
  ]);
  if (!sdk) throw new Error('Android SDK não encontrado. Instale-o ou configure ANDROID_HOME.');
  return sdk;
}

async function keytoolExecutable() {
  const candidates = [
    process.env.JAVA_HOME ? resolve(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool') : undefined,
    process.platform === 'win32' ? 'C:\\Program Files\\Java\\jdk-21\\bin\\keytool.exe' : undefined,
  ];
  const known = await firstAccessible(candidates);
  if (known) return known;
  if (process.platform === 'win32') {
    const javaRoot = 'C:\\Program Files\\Java';
    try {
      for (const directory of await readdir(javaRoot)) {
        const candidate = join(javaRoot, directory, 'bin', 'keytool.exe');
        if (await firstAccessible([candidate])) return candidate;
      }
    } catch {
      /* Fall through to the PATH lookup. */
    }
  }
  return 'keytool';
}

function run(command, args, env = process.env, cwd) {
  return new Promise((resolvePromise, reject) => {
    const needsWindowsShell = process.platform === 'win32' && /\.(?:cmd|bat)$/i.test(command);
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: needsWindowsShell, env });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolvePromise() : reject(new Error(`${command} terminou com código ${code}.`)),
    );
  });
}

async function syncAndroidAssets(environment) {
  try {
    await run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['cap', 'sync', 'android'], environment);
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

async function ensureSigningIdentity() {
  const keystore = resolve('android', 'irrint-release.jks');
  const properties = resolve('android', 'keystore.properties');
  const existingKeystore = await firstAccessible([keystore]);
  const existingProperties = await firstAccessible([properties]);
  if (existingKeystore && existingProperties) return;
  if (existingKeystore || existingProperties) {
    throw new Error('A identidade Android está incompleta. Restaure juntos irrint-release.jks e keystore.properties.');
  }

  const password = randomBytes(24).toString('base64url');
  await run(await keytoolExecutable(), [
    '-genkeypair',
    '-v',
    '-keystore',
    keystore,
    '-storetype',
    'PKCS12',
    '-storepass',
    password,
    '-keypass',
    password,
    '-alias',
    'irrint',
    '-keyalg',
    'RSA',
    '-keysize',
    '4096',
    '-validity',
    '10000',
    '-dname',
    'CN=Irriga Inteligente, OU=TCC, O=Irrint, L=Boa Vista, ST=Roraima, C=BR',
  ]);
  await writeFile(
    properties,
    `storeFile=irrint-release.jks\nstorePassword=${password}\nkeyAlias=irrint\nkeyPassword=${password}\n`,
    { encoding: 'utf8', mode: 0o600 },
  );
}

const sdk = await androidSdk();
await ensureSigningIdentity();
const buildEnvironment = {
  ...process.env,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
  GRADLE_USER_HOME:
    process.env.GRADLE_USER_HOME ?? resolve(process.env.USERPROFILE ?? homedir(), '.gradle'),
  VITE_ALLOW_API_OVERRIDE: 'false',
  VITE_API_BASE_URL: endpoint.replace(/\/$/, ''),
};
await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], buildEnvironment);
await syncAndroidAssets(buildEnvironment);
await run(
  process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
  [':app:assembleRelease'],
  buildEnvironment,
  resolve('android'),
);

const outputDirectory = resolve('distribution');
await mkdir(outputDirectory, { recursive: true });
const filename = `Irrint-${packageMetadata.version}-publico.apk`;
const source = resolve('android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const destination = resolve(outputDirectory, filename);
await copyFile(source, destination);
const digest = createHash('sha256').update(await readFile(destination)).digest('hex');
await writeFile(resolve(outputDirectory, `${filename}.sha256`), `${digest}  ${filename}\n`, 'utf8');
console.log(`APK público criado em ${destination}`);
console.log(`API fixa: ${endpoint.replace(/\/$/, '')}`);
console.log(`SHA-256: ${digest}`);
