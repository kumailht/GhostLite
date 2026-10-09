/* eslint-env node */
import pkg from './package.json';
import { publicAppViteConfig } from '@internal/cfg-vite-public-app';

export default publicAppViteConfig({
  packageRoot: import.meta.dirname,
  packageName: pkg.name,
  entry: 'src/index.tsx',
  framework: 'preact',
  svgr: false,
  // UMD would register as an anonymous AMD module (and never run) on pages with RequireJS
  libFormat: 'iife',
  libName: 'GhostSodoSearch',
  sourcemap: false,
  cssCodeSplit: false,
  overrides: {
    resolve: {
      alias: [
        // Ships Document/Encoder/Charset without the worker and persistence code
        {
          find: /^flexsearch$/,
          replacement: `${import.meta.dirname}/node_modules/flexsearch/dist/flexsearch.compact.module.min.js`,
        },
      ],
    },
    build: {
      rollupOptions: {
        output: {
          // Theme templates reference umd/main.css by name (see
          // ghost/core defaults.json → sodoSearch.styles), so the
          // CSS sibling emitted by Vite must keep that filename.
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'main.css';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
    },
  },
});
