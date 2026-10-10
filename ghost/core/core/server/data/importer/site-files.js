const fs = require('fs-extra');
const path = require('path');

// The bundled themes ship with Ghost and can't be overwritten from a zip
const BUNDLED_THEMES = ['casper', 'source'];

/**
 * Restores the site files a GhostLite export carries next to its content:
 * themes (`themes/*.zip`), `routes.yaml` and `redirects.yaml`. Each one is
 * applied on its own, so a file that fails is reported and the rest still
 * restore. Files absent from the import are left untouched on the site.
 */
class SiteFileRestorer {
  /**
   * @param {object} deps themeService, routeSettings, customRedirects, parseYaml and
   * models, read only when a restore runs so they can be required lazily
   */
  constructor(deps) {
    this.deps = deps;
  }

  /**
   * @param {string} directory the extracted import zip
   * @param {string|null} activeTheme the theme the exported site used
   * @returns {Promise<{restored: string[], problems: {message: string, help: string}[]}>}
   */
  async restore(directory, activeTheme) {
    const restored = [];
    const problems = [];
    const attempt = async (label, fn) => {
      try {
        if (await fn()) {
          restored.push(label);
        }
      } catch (err) {
        problems.push({ message: `${label} could not be restored: ${err.message}`, help: 'Site files' });
      }
    };

    const baseDir = await this.#findBaseDir(directory);

    const themesDir = path.join(baseDir, 'themes');
    const themeZips = (await fs.pathExists(themesDir))
      ? (await fs.readdir(themesDir)).filter((name) => name.endsWith('.zip'))
      : [];

    for (const zipName of themeZips) {
      const themeName = zipName.replace(/\.zip$/, '');
      if (BUNDLED_THEMES.includes(themeName)) {
        continue;
      }
      await attempt(`Theme "${themeName}"`, async () => {
        await this.deps.themeService.api.setFromZip({ name: zipName, path: path.join(themesDir, zipName) });
        return true;
      });
    }

    if (activeTheme) {
      await attempt(`Active theme "${activeTheme}"`, async () => {
        await this.deps.themeService.api.activate(activeTheme);
        await this.deps.models.Settings.edit([{ key: 'active_theme', value: activeTheme }], {
          context: { internal: true },
        });
        return true;
      });
    }

    const routesFile = path.join(baseDir, 'routes.yaml');
    if (await fs.pathExists(routesFile)) {
      await attempt('Routes (routes.yaml)', async () => {
        await this.deps.routeSettings.api.upload(await fs.readFile(routesFile, 'utf8'));
        return true;
      });
    }

    const redirectsFile = path.join(baseDir, 'redirects.yaml');
    if (await fs.pathExists(redirectsFile)) {
      await attempt('Redirects (redirects.yaml)', async () => {
        const redirects = this.deps.parseYaml(await fs.readFile(redirectsFile, 'utf8'));
        await this.deps.customRedirects.api.replace(redirects);
        return true;
      });
    }

    return { restored, problems };
  }

  /** An export unzipped into a single folder keeps its files one level down. */
  async #findBaseDir(directory) {
    const entries = await fs.readdir(directory);
    const hasSiteFiles = entries.some((name) => ['themes', 'routes.yaml', 'redirects.yaml'].includes(name));
    if (!hasSiteFiles && entries.length === 1) {
      const only = path.join(directory, entries[0]);
      if ((await fs.stat(only)).isDirectory()) {
        return only;
      }
    }
    return directory;
  }
}

module.exports = SiteFileRestorer;
