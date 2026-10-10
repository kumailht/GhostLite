// Global pnpm hooks for the Ghost monorepo.
//
// `beforePacking` runs during `pnpm pack` / `pnpm publish` and mutates the
// package.json written *into the tarball* — the on-disk manifest is never
// touched. `readPackage` runs during resolution, so it *does* feed the shared
// lockfile.
//
// Applied to every packed/published package:
//   - drop `nx`            — Nx target config, meaningless to consumers
//   - drop `devDependencies` — never installed from a dependency tarball; inert
//     in a published manifest and only adds noise + phantom workspace refs
//
// Applied to the `ghost` package only (the Ghost-CLI release archive built by
// ghost/core/scripts/pack.mjs):
//   - rewrite its workspace deps to the bundled `file:components/*.tgz`
//     tarballs shipped in the archive (name→filename map via GHOST_COMPONENTS)
//   - strip `scripts` to the runtime set — Ghost-CLI starts Ghost with `node`,
//     not pnpm scripts, and the dev/build/test/lint scripts reference stripped
//     devDependencies
//
// (`packageManager` is carried over separately, post-pack, by pack.js.)

// Scripts retained in the packaged `ghost` manifest. Empty today: Ghost has no
// runtime pnpm scripts. Add names here if that changes.
const GHOST_RUNTIME_SCRIPTS = new Set([]);

function beforePacking(pkg) {
  delete pkg.nx;
  delete pkg.devDependencies;

  if (pkg.exports) {
    // remove any source condition exports, since the packages don't ship
    // the source files
    for (const key of Object.keys(pkg.exports)) {
      if (typeof pkg.exports[key] === 'object' && pkg.exports[key].source) {
        delete pkg.exports[key].source;
      }
    }
  }

  if (pkg.name !== 'ghost') {
    return pkg;
  }

  const components = JSON.parse(process.env.GHOST_COMPONENTS || '{}');
  for (const section of ['dependencies', 'optionalDependencies']) {
    if (!pkg[section]) {
      continue;
    }
    for (const name of Object.keys(pkg[section])) {
      if (components[name]) {
        pkg[section][name] = `file:components/${components[name]}`;
      }
    }
  }

  if (pkg.scripts) {
    pkg.scripts = Object.fromEntries(
      Object.entries(pkg.scripts).filter(([name]) => GHOST_RUNTIME_SCRIPTS.has(name)),
    );
  }

  return pkg;
}

function readPackage(pkg) {
  // consolidate declares 48 template engines as optional peers. pnpm links any
  // that another workspace package happens to satisfy, so react, react-dom and
  // @babel/core rode into ghost's production deploy closure via
  // nodemailer-mailgun-transport — the only thing that pulls consolidate in, and
  // it never renders through it. packageExtensions can only add, so dropping the
  // peers outright needs this hook.
  if (pkg.name === 'consolidate') {
    delete pkg.peerDependencies;
    delete pkg.peerDependenciesMeta;
  }

  // The 8.x Elasticsearch client hard-depends on apache-arrow for two ES|QL
  // helpers nothing in Ghost calls - @tryghost/logging and @tryghost/metrics only
  // index documents. Worth 15 packages / ~15MB installed, and 145 modules /
  // ~3.3MB RSS per process using the log transport. The matching patch defers the
  // require, 9.x-style. Delete rather than re-declare as an optional peer:
  // autoInstallPeers installs those anyway, and it peer-forks @tryghost/logging
  // and everything above it. Drop both when the client reaches 9.x.
  if (pkg.name === '@elastic/elasticsearch') {
    delete pkg.dependencies?.['apache-arrow'];
  }

  return pkg;
}

export const hooks = { beforePacking, readPackage };
