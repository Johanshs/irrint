import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { isIP } from 'node:net';

function isPrivateIpv4(hostname) {
  if (isIP(hostname) !== 4) return false;
  const [first, second] = hostname.split('.').map(Number);
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 127 && second >= 0)
  );
}

function apiUrl() {
  const argument = process.argv.find((value) => value.startsWith('--api='))?.slice('--api='.length);
  const value = argument ?? process.env.IRRINT_API_URL;
  if (!value)
    throw new Error('Informe IRRINT_API_URL. Exemplo: $env:IRRINT_API_URL="http://192.168.1.20:8787"');
  const parsed = new URL(value);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
    throw new Error('IRRINT_API_URL precisa usar http ou https.');
  if (parsed.protocol === 'http:' && parsed.hostname !== 'localhost' && !isPrivateIpv4(parsed.hostname))
    throw new Error('HTTP de depuração só é aceito para localhost ou IPv4 de rede privada.');
  return value.replace(/\/$/, '');
}

function execute(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', windowsHide: true, ...options });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} terminou com código ${code ?? 'desconhecido'}.`));
    });
  });
}

try {
  const endpoint = apiUrl();
  const npmCli =
    process.env.npm_execpath ?? resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  console.log(`Compilando o cliente Android para ${endpoint}.`);
  await execute(process.execPath, [npmCli, 'run', 'build'], {
    env: { ...process.env, VITE_API_BASE_URL: endpoint },
  });
  await execute(process.execPath, [npmCli, 'run', 'android:sync']);
  const detectedSdk = process.env.LOCALAPPDATA ? resolve(process.env.LOCALAPPDATA, 'Android/Sdk') : undefined;
  const androidHome = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? detectedSdk;
  if (!androidHome || !existsSync(androidHome))
    throw new Error('SDK Android não encontrado. Configure ANDROID_HOME antes de gerar o APK.');
  await execute(
    process.platform === 'win32' ? 'java.exe' : 'java',
    [
      '-classpath',
      resolve('android/gradle/wrapper/gradle-wrapper.jar'),
      'org.gradle.wrapper.GradleWrapperMain',
      'assembleDebug',
      '-Pandroid.overridePathCheck=true',
    ],
    {
      cwd: resolve('android'),
      env: { ...process.env, ANDROID_HOME: androidHome, ANDROID_SDK_ROOT: androidHome },
    },
  );
  console.log('APK criado em android/app/build/outputs/apk/debug/app-debug.apk');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha ao preparar o APK de rede local.');
  process.exitCode = 1;
}
