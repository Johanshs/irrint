import { beforeEach, describe, expect, it, vi } from 'vitest';

const plugins = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  share: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: plugins.isNativePlatform },
}));
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: { writeFile: plugins.writeFile },
}));
vi.mock('@capacitor/share', () => ({ Share: { share: plugins.share } }));

import { exportFile } from '../src/lib/export-file';

describe('exportação de arquivos', () => {
  beforeEach(() => {
    plugins.isNativePlatform.mockReturnValue(true);
    plugins.writeFile.mockResolvedValue({ uri: 'file:///cache/exports/resultado.json' });
    plugins.share.mockResolvedValue({});
  });

  it('grava em cache e entrega o arquivo ao compartilhamento nativo', async () => {
    await exportFile({
      name: 'resultado:teste.json',
      content: '{"status":"ok"}',
      type: 'application/json',
      title: 'Resultado Irrint',
    });

    expect(plugins.writeFile).toHaveBeenCalledWith({
      path: 'exports/resultado-teste.json',
      data: '{"status":"ok"}',
      directory: 'CACHE',
      encoding: 'utf8',
      recursive: true,
    });
    expect(plugins.share).toHaveBeenCalledWith({
      title: 'Resultado Irrint',
      files: ['file:///cache/exports/resultado.json'],
      dialogTitle: 'Salvar ou compartilhar arquivo',
    });
  });
});
