# GhostLite

A blogging-only fork of [Ghost](https://github.com/TryGhost/Ghost): posts, media
uploads, a single admin author, RSS, and themes. SQLite is the default database;
MySQL still works if you configure it.

## Requirements

- Node `22.23.3` (see `.nvmrc`)
- pnpm 12

## Getting started

```sh
pnpm bootstrap   # install dependencies and the default themes
pnpm dev         # build the admin, then run Ghost at http://localhost:2368
```

Open http://localhost:2368/ghost/ to create the admin account. Data lives in
`ghost/core/content/data/ghost-dev.db`; delete it to start over.

## Scripts

| Command            | What it does                                     |
| ------------------ | ------------------------------------------------ |
| `pnpm dev`         | Build the admin and run Ghost with auto-restart  |
| `pnpm build`       | Compile Ghost core and build the admin           |
| `pnpm build:admin` | Build only the admin assets                      |
| `pnpm lint`        | Lint every workspace package                     |
| `pnpm test`        | Run every workspace package's tests              |
| `pnpm format`      | Format the codebase                              |
| `pnpm check`       | Format check, lint, and test                     |
| `pnpm clean`       | Delete `node_modules`, build output and Nx cache |

## License

MIT. Based on Ghost, copyright Ghost Foundation.
