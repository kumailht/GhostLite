// Ghost's entry point: `node index.js` (or `pnpm dev` / `pnpm start`) boots the server.

// Don't allow NODE_ENV to be null
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

require('./core/boot')();
