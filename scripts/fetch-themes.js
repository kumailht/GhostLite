// Downloads the bundled themes when their git submodules weren't checked out,
// as on hosts that deploy from a plain copy of the repo (Railway, for example).
// NOTE: no NPM dependencies, it runs before the theme folders exist
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const THEMES = { casper: 'TryGhost/Casper', source: 'TryGhost/Source' };
const themesDir = path.resolve(import.meta.dirname, '../ghost/core/content/themes');

for (const [name, repo] of Object.entries(THEMES)) {
  const dir = path.join(themesDir, name);
  if (existsSync(path.join(dir, 'package.json'))) {
    continue;
  }

  console.log(`Downloading the ${name} theme from ${repo}...`);
  const response = await fetch(`https://codeload.github.com/${repo}/tar.gz/refs/heads/main`);
  if (!response.ok) {
    throw new Error(`Could not download ${repo}: ${response.status} ${response.statusText}`);
  }

  mkdirSync(dir, { recursive: true });
  execFileSync('tar', ['-xz', '--strip-components=1', '-C', dir], {
    input: Buffer.from(await response.arrayBuffer()),
  });
}
