# AGENTS.md

GhostLite is a blogging-only fork of Ghost. See [README.md](README.md) for setup.

- Always use `pnpm`, never npm or Yarn. External dependency versions belong in
  the catalogs in `pnpm-workspace.yaml`; workspace dependencies use
  `workspace:` versions.
- `pnpm dev` runs Ghost locally on SQLite; there is no Docker setup.
- `pnpm start` runs Ghost in production mode, also on SQLite by default.
- There are no tests or linters. To type-check, run `pnpm exec tsc --noEmit` in
  `ghost/core` and `pnpm exec tsc -b` in `apps/admin`.
- When committing, load and follow `.agents/skills/commit/SKILL.md`.
- Repository skills live under `.agents/skills/`, each with a matching
  `.claude/skills/<name>` symlink to `../../.agents/skills/<name>`.
- Boot owns service initialization in Ghost core; do not initialize on the
  first request.
