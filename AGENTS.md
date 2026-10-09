# AGENTS.md

GhostLite is a blogging-only fork of Ghost. See [README.md](README.md) for setup.

- Always use `pnpm`, never npm or Yarn. External dependency versions belong in
  the catalogs in `pnpm-workspace.yaml`; workspace dependencies use
  `workspace:` versions.
- `pnpm dev` runs Ghost locally on SQLite; there is no Docker setup.
- `pnpm check` is the full validation command.
- When committing, load and follow `.agents/skills/commit/SKILL.md`.
- Repository skills live under `.agents/skills/`, each with a matching
  `.claude/skills/<name>` symlink to `../../.agents/skills/<name>`.
- Boot owns service initialization in Ghost core; do not initialize on the
  first request.
