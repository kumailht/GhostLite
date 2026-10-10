# GhostLite

A small, self-hosted blog built on [Ghost](https://github.com/TryGhost/Ghost),
with everything except the blog removed.

**What you get:** the Ghost editor, posts and pages, image and media uploads,
tags, scheduling, RSS, Ghost themes, a single admin login, and import/export of
your content.

**What's gone:** members, subscriptions, payments, newsletters, comments,
analytics, integrations, and webhooks. There is no Docker setup and no outside
service to run. GhostLite stores everything in one SQLite file next to your
uploads.

## Requirements

- Node `22.23.3` (see `.nvmrc`)
- pnpm 12
- git (the default themes are git submodules)

## Try it locally

```sh
pnpm bootstrap   # install dependencies and the default themes
pnpm dev         # run Ghost at http://localhost:2368 with auto-restart
```

Open http://localhost:2368/ghost/ and create your admin account. The first
account set up is the owner.

The development database is `ghost/core/content/data/ghost-dev.db`. Delete it
and restart to start over.

## Run your blog

On your server:

```sh
git clone https://github.com/kumailht/GhostLite.git
cd GhostLite
pnpm bootstrap
```

Create `ghost/core/config.production.json` with your blog's address:

```json
{
  "url": "https://blog.example.com"
}
```

Then start it:

```sh
pnpm start
```

`pnpm start` builds the admin and runs Ghost in production mode. The database
is created the first time it starts, and it's updated automatically when you
upgrade.

Ghost listens on `127.0.0.1:2368`. Put a web server in front of it to handle
HTTPS. With [Caddy](https://caddyserver.com/), that's one line:

```
blog.example.com {
    reverse_proxy 127.0.0.1:2368
}
```

To keep Ghost running after you log out and across reboots, run `pnpm start`
under systemd, pm2, or any other process manager.

### Upgrading

```sh
git pull
pnpm bootstrap
pnpm start
```

## Where your blog lives

Everything is under `ghost/core/content/`:

| Folder      | Contents                                        |
| ----------- | ----------------------------------------------- |
| `data/`     | The database, `ghost.db`                        |
| `images/`   | Uploaded images                                 |
| `media/`    | Uploaded video and audio                        |
| `files/`    | Other uploaded files                            |
| `themes/`   | Installed themes                                |
| `settings/` | `routes.yaml` and other site settings files     |
| `logs/`     | Log files                                       |

### Backups

Copy the whole `content/` folder. For a consistent copy of the database while
Ghost is running, use SQLite's backup command instead of copying the file:

```sh
sqlite3 ghost/core/content/data/ghost.db ".backup ghost-backup.db"
```

You can also export the whole site from **Settings → Migration tools** in the
admin: one zip with your posts, pages, uploads, settings, themes, routes and
redirects (password hashes and the private-site access code are left out).
Importing that zip on another GhostLite site restores all of it. The same screen
imports exports from a full Ghost site too; GhostLite brings in the posts and
skips anything it doesn't support.

When an import finishes, a notice with the result appears at the top of the
admin. A site with many uploads makes a large zip: if Ghost runs behind nginx,
raise `client_max_body_size` so the import upload isn't rejected.

## Themes

GhostLite ships with Ghost's Casper and Source themes. Change or upload themes
under **Settings → Design & branding** in the admin. Most Ghost themes work.
Theme features for members, subscriptions, or comments won't appear.

## Email

GhostLite only sends email for staff password resets and staff invites. To turn
it on, add SMTP settings to `ghost/core/config.production.json` (or to
`config.local.json` when developing):

```json
{
  "mail": {
    "from": "blog@example.com",
    "transport": "SMTP",
    "options": {
      "host": "smtp.example.com",
      "port": 587,
      "auth": { "user": "USERNAME", "pass": "PASSWORD" }
    }
  }
}
```

Without SMTP everything else works, but "Forgot password" can't send a reset
link. In development, a mail catcher such as [Mailpit](https://mailpit.axllent.org/)
on port 1025 works with the default config.

## Using MySQL instead

SQLite is the default and suits a personal blog. To use MySQL 8, add a database
block to `ghost/core/config.production.json`:

```json
{
  "database": {
    "client": "mysql2",
    "connection": {
      "host": "127.0.0.1",
      "user": "ghost",
      "password": "PASSWORD",
      "database": "ghostlite"
    }
  }
}
```

Create the empty database first. Ghost creates the tables on first start.

## Commands

| Command            | What it does                                     |
| ------------------ | ------------------------------------------------ |
| `pnpm bootstrap`   | Install dependencies and the default themes      |
| `pnpm dev`         | Build the admin and run Ghost with auto-restart  |
| `pnpm start`       | Build the admin and run Ghost in production mode |
| `pnpm build`       | Compile Ghost core and build the admin           |
| `pnpm build:admin` | Build only the admin                             |
| `pnpm clean`       | Delete `node_modules`, build output and Nx cache |

## License

MIT. Based on Ghost, copyright Ghost Foundation.
