import fs from 'node:fs';
import path from 'node:path';

const FOLDERS = ['data', 'images', 'media', 'files', 'settings', 'logs', 'public', 'themes'];
const BUNDLED_THEMES = ['casper', 'source'];

interface ContentConfig {
  get(key: string): string;
}

/**
 * Sets up the content folder before anything writes to it. A content folder
 * outside the app (such as a volume on a hosting platform) starts empty, so
 * this creates its subfolders and copies in the bundled themes. Those themes
 * ship with the app and are replaced on every boot, so app updates reach them.
 */
export function prepareContentFolders(config: ContentConfig): void {
  const contentPath = path.resolve(config.get('paths:contentPath'));

  for (const folder of FOLDERS) {
    fs.mkdirSync(path.join(contentPath, folder), { recursive: true });
  }

  const appContentPath = path.resolve(config.get('paths:appRoot'), 'content');
  if (contentPath === appContentPath) {
    return;
  }

  for (const theme of BUNDLED_THEMES) {
    const source = path.join(appContentPath, 'themes', theme);
    if (!fs.existsSync(path.join(source, 'package.json'))) {
      continue;
    }
    const target = path.join(contentPath, 'themes', theme);
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(source, target, { recursive: true });
  }
}
