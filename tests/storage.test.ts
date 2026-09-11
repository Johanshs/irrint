import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { initialState } from '../shared/control.ts';
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
});
