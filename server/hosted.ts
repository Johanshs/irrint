import { resolve } from 'node:path';
import { createApi } from './api.ts';
import { demoOwnerExpiresAt, SignedDemoSessionAuth } from './auth.ts';
import { JsonFileStateStore, PostgresStateStore, type StateStore } from './storage.ts';
import { ControlError, emptyState, IrrigationControl } from '../shared/control.ts';

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Configure ${name} no ambiente hospedado.`);
  return value;
}

function port() {
  const value = Number(process.env.PORT ?? 8787);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) throw new Error('PORT inválida.');
  return value;
}

function maximumSessions() {
  const value = Number(process.env.IRRINT_MAX_ACTIVE_SESSIONS ?? 12);
  if (!Number.isInteger(value) || value < 1 || value > 100)
    throw new Error('IRRINT_MAX_ACTIVE_SESSIONS precisa estar entre 1 e 100.');
  return value;
}

const databaseUrl = process.env.DATABASE_URL?.trim();
const dataDirectory = resolve(process.env.IRRINT_DATA_DIR?.trim() || '.hosted');
const store: StateStore = databaseUrl
  ? new PostgresStateStore(databaseUrl)
  : new JsonFileStateStore(resolve(dataDirectory, 'state.json'));
const loaded = await store.load(emptyState(Date.now()));
if (loaded.recoveredFromBackup)
  console.warn('Estado hospedado principal inválido; recuperação concluída pela cópia de segurança.');

const control = new IrrigationControl(loaded.state, Date.now, 'hosted-demo');
const auth = new SignedDemoSessionAuth({
  email: process.env.DEMO_USER_EMAIL?.trim() || 'produtor@demo.local',
  password: process.env.DEMO_USER_PASSWORD || 'irrigacao',
  secret: required('IRRINT_SESSION_SECRET'),
});
const allowedOrigins = required('IRRINT_ALLOWED_ORIGINS')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const persist = () => store.save(control.exportState());

function pruneExpiredOwners() {
  let changed = false;
  const now = Date.now();
  for (const ownerId of new Set(control.exportState().zones.map((zone) => zone.ownerId))) {
    const expiresAt = demoOwnerExpiresAt(ownerId);
    if (expiresAt !== null && expiresAt <= now) changed = control.removeOwner(ownerId) || changed;
  }
  return changed;
}

if (pruneExpiredOwners()) await persist();
const api = createApi(control, {
  allowedOrigins,
  deviceToken: required('IRRINT_DEVICE_TOKEN'),
  networkAccess: 'public',
  persist,
  sessionAuth: auth,
  onSessionCreated: (session) => {
    pruneExpiredOwners();
    const activeOwners = new Set(control.exportState().zones.map((zone) => zone.ownerId));
    if (activeOwners.size >= maximumSessions())
      throw new ControlError(503, 'Demonstração ocupada. Aguarde uma sessão expirar e tente novamente.');
    control.seedDemoOwner(session.user.id);
  },
});

api.listen(port(), '0.0.0.0', () => {
  console.log(
    `API demonstrativa hospedada na porta ${port()}; persistência em ${databaseUrl ? 'PostgreSQL' : dataDirectory}.`,
  );
});
api.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    api.close(async () => {
      await store.close?.();
      process.exit();
    });
  });
