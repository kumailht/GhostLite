import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

function normalizePermissions(directory: string): void {
  chmodSync(directory, 0o755);
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      normalizePermissions(path);
    } else if (entry.isFile()) {
      chmodSync(path, 0o644);
    }
  }
}

/** Copy the Admin build and Koenig's isolated embed renderer into Ghost core. */
export function assembleAdminAssets(root: string): void {
  const reactDist = join(root, 'apps/admin/dist');
  const renderer = join(root, 'koenig/koenig-lexical/dist/embed-renderer');
  const built = join(root, 'ghost/core/core/built');

  for (const path of [join(reactDist, 'index.html'), renderer]) {
    if (!existsSync(path)) {
      throw new Error(`Admin asset input is missing: ${path}. Run the Admin build first.`);
    }
  }

  mkdirSync(built, { recursive: true });

  const adminDestination = join(built, 'admin');
  rmSync(adminDestination, { recursive: true, force: true });
  cpSync(reactDist, adminDestination, { recursive: true, dereference: true });
  normalizePermissions(adminDestination);

  const rendererDestination = join(built, 'embed-renderer');
  rmSync(rendererDestination, { recursive: true, force: true });
  cpSync(renderer, rendererDestination, { recursive: true });
}
