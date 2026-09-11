import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { IrrigationControl, initialState } from '../shared/control.ts';
import { JsonFileStateStore } from '../server/storage.ts';

const directories: string[] = [];
afterEach(async () => {
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true });
});

describe('Armazenamento local validado', () => {
  it('atribui a conta demonstrativa ao carregar um estado local anterior', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'irrint-storage-'));
    directories.push(directory);
    const path = join(directory, 'state.json');
    const legacy = structuredClone(initialState(1_800_000_000_000));
    for (const zone of legacy.zones) {
      delete (zone as Partial<typeof zone>).ownerId;
      delete (zone as Partial<typeof zone>).sensorId;
      delete (zone as Partial<typeof zone>).valveId;
    }
    await writeFile(path, JSON.stringify(legacy), 'utf8');

    const loaded = await new JsonFileStateStore(path).load(initialState(0));
    expect(
      loaded.state.zones.map(({ id, ownerId, sensorId, valveId }) => ({ id, ownerId, sensorId, valveId })),
    ).toEqual([
      { id: 'north', ownerId: 'demo-producer', sensorId: 'soil-north', valveId: 'valve-north' },
      { id: 'south', ownerId: 'demo-producer', sensorId: 'soil-south', valveId: 'valve-south' },
    ]);
  });

  it('preserva o estado válido, rejeita vínculos inválidos e recupera a cópia de segurança', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'irrint-storage-'));
    directories.push(directory);
    const path = join(directory, 'state.json');
    const store = new JsonFileStateStore(path);
    const original = initialState(1_800_000_000_000);

    await store.save(original);
    const invalid = structuredClone(original);
    invalid.zones[1].deviceId = invalid.zones[0].deviceId;
    await expect(store.save(invalid)).rejects.toThrow('Dispositivo vinculado a mais de uma área.');
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(original);

    const updated = structuredClone(original);
    updated.zones[0].crop = 'Alface';
    await store.save(updated);
    await writeFile(path, '{estado incompleto', 'utf8');

    const recovered = await store.load(initialState(0));
    expect(recovered).toEqual({ state: original, recoveredFromBackup: true });
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(original);
    expect((await readdir(directory)).some((name) => name.startsWith('state.json.corrupt-'))).toBe(true);
  });

  it('CT14: retoma histórico e vínculos sem reaplicar comando vencido após reinício', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'irrint-restart-'));
    directories.push(directory);
    const store = new JsonFileStateStore(join(directory, 'state.json'));
    let now = 1_800_000_000_000;
    const control = new IrrigationControl(initialState(now), () => now);
    control.telemetry({
      schemaVersion: '1.0',
      deviceId: 'sim-north',
      sequence: 1,
      moisture: 32,
      unit: 'normalizedPercent',
      valve: 'closed',
      lastCommandId: null,
      source: 'simulated',
    });
    const applied = control.command('north', {
      action: 'open',
      durationSeconds: 30,
      idempotencyKey: '7f154c54-d9b9-4b8b-8464-f81432efc32a',
    });
    control.acknowledge({
      deviceId: 'sim-north',
      commandId: applied.id,
      status: 'applied',
      valve: 'open',
    });
    const pending = control.command('north', {
      action: 'close',
      idempotencyKey: 'b6d013b4-6c07-4cda-8d69-f88ac46c44a8',
    });
    await store.save(control.exportState());

    now += 9000;
    const loaded = await store.load(initialState(0));
    const restored = new IrrigationControl(loaded.state, () => now);
    const snapshot = restored.snapshot();
    await store.save(restored.exportState());
    const reloaded = await store.load(initialState(0));

    expect({
      links: snapshot.zones.map(({ id, deviceId, sensorId, valveId }) => ({
        id,
        deviceId,
        sensorId,
        valveId,
      })),
      readings: snapshot.readings.map(({ deviceId, sequence, moisture }) => ({
        deviceId,
        sequence,
        moisture,
      })),
      commands: snapshot.commands.map(({ id, action, status }) => ({ id, action, status })),
      expirationPersisted: reloaded.state.commands.find((command) => command.id === pending.id)?.status,
      appliedEvents: snapshot.events.filter((event) => event.type === 'applied').length,
      expiredEvents: snapshot.events.filter((event) => event.type === 'expired').length,
    }).toEqual({
      links: [
        { id: 'north', deviceId: 'sim-north', sensorId: 'soil-north', valveId: 'valve-north' },
        { id: 'south', deviceId: 'sim-south', sensorId: 'soil-south', valveId: 'valve-south' },
      ],
      readings: [{ deviceId: 'sim-north', sequence: 1, moisture: 32 }],
      commands: [
        { id: applied.id, action: 'open', status: 'applied' },
        { id: pending.id, action: 'close', status: 'expired' },
      ],
      expirationPersisted: 'expired',
      appliedEvents: 1,
      expiredEvents: 1,
    });
  });
});
