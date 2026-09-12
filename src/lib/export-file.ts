import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface ExportFileOptions {
  name: string;
  content: string;
  type: string;
  title: string;
}

function safeName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '-');
}

export async function exportFile({ name, content, type, title }: ExportFileOptions) {
  const fileName = safeName(name);
  if (Capacitor.isNativePlatform()) {
    const file = await Filesystem.writeFile({
      path: `exports/${fileName}`,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    await Share.share({
      title,
      files: [file.uri],
      dialogTitle: 'Salvar ou compartilhar arquivo',
    });
    return;
  }

  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
