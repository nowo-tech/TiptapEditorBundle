# Demo applications with FrankenPHP (development and production)

This document describes how the **Tiptap Editor Bundle** demo runs under **FrankenPHP** in Docker: **worker** (default) vs **classic** (`FRANKENPHP_MODE=classic`). Reuse the same pattern in other Symfony bundles with FrankenPHP demos.

## Contents

- [Overview](#overview)
- [What the demo includes](#what-the-demo-includes)
- [Worker mode and bundle compatibility](#worker-mode-and-bundle-compatibility)
- [Development](#development)
- [Production / worker mode](#production--worker-mode)
- [Ports and URLs](#ports-and-urls)
- [Switching classic vs worker (`FRANKENPHP_MODE`)](#switching-classic-vs-worker-frankenphp_mode)
- [Troubleshooting](#troubleshooting)

## Overview

The **`demo/` folder is not shipped** when you install the bundle via Composer (`archive.exclude` includes `/demo`). Demos exist only in the Git repository for development and QA.

The demo uses:

- **FrankenPHP** (Caddy + PHP) in one container.
- **Docker Compose** mounting the demo app and the parent bundle at **`/var/tiptap-editor-bundle`** for the Composer **path** repository.
- **`Caddyfile`** (worker-enabled) and **`Caddyfile.dev`** (classic `php_server`, hot-reload friendly).
- An **entrypoint** that selects the Caddyfile from **`FRANKENPHP_MODE`**.

There is one demo: **`demo/symfony8`** (default HTTP port **8011**). From the bundle root:

```bash
make -C demo up-symfony8
# http://localhost:8011 (see demo README / PORT in .env)
```

## What the demo includes

In **`APP_ENV=dev`** (default for the demo):

- **Symfony Web Profiler** and **Debug** bundles (`require-dev`) for toolbar and profiling.
- **Nowo Twig Inspector** (`nowo-tech/twig-inspector-bundle`) and **Nowo Hot Reload** (`nowo-tech/hot-reload-bundle`) — required together on FrankenPHP demos (dev/test only; Caddyfile Mercure + `hot_reload`, plus `worker { watch }` in worker mode). Do not enable Hot Reload in production.

The bundle under test is **`nowo-tech/tiptap-editor-bundle`**, installed from the path repo **`/var/tiptap-editor-bundle`**.

## Worker mode and bundle compatibility

The PHP bundle is **100% compatible** with FrankenPHP worker mode when the kernel is **not** reset between requests (strict scenario B). Shared services only hold readonly / compile-time configuration; see [`FRANKENPHP-WORKER-AUDIT.md`](FRANKENPHP-WORKER-AUDIT.md).

Client-side Tiptap (`tiptap-editor.js`) runs in the browser and is independent of PHP worker lifetime.

## Development

Goal: edit PHP, Twig, YAML, or bundle sources and see changes after a browser refresh **without** relying on a long-lived worker process.

- Set **`FRANKENPHP_MODE=classic`** so the entrypoint uses **`Caddyfile.dev`**: classic **`php_server`** without a persistent **`worker`** block.
- Or keep **`FRANKENPHP_MODE=worker`** (default) and rely on `worker { watch }` plus Hot Reload when iterating; restart the container if PHP DI / compiled container changes are not picked up.
- **`docker/php-dev.ini`**: short OPcache revalidation interval for dev.
- **`APP_ENV=dev`**, **`APP_DEBUG=1`** in Compose (see `demo/symfony8/docker-compose.yml`).
- **DNS**: Compose sets **`dns: 8.8.8.8` / `8.8.4.4`** so Composer can resolve Packagist inside Docker/WSL.

Start from **`demo/symfony8`** with `make up` (see **`demo/README.md`**).

## Production / worker mode

For production-like behavior:

- Use **`APP_ENV=prod`**, **`APP_DEBUG=0`**, and the **`Caddyfile`** that enables FrankenPHP workers.
- Warm Symfony cache and avoid writable `var/` in real deployments as appropriate.

Exact worker directives depend on the demo image and FrankenPHP version; compare **`Caddyfile`** vs **`Caddyfile.dev`** in `demo/symfony8/docker/frankenphp/`.

## Ports and URLs

| Demo     | Default `PORT` | URL                   |
| -------- | -------------- | --------------------- |
| symfony8 | 8011           | http://localhost:8011 |

Override `PORT` in the demo `.env` (from `.env.example`) if ports clash.

## Switching classic vs worker (`FRANKENPHP_MODE`)

Demos select the FrankenPHP runtime via **`FRANKENPHP_MODE`** in `.env` / `.env.example` (not a Dockerfile `ENV`):

| Value | Behaviour |
| --- | --- |
| **`worker`** (default) | Keep the worker Caddyfile (`php_server { worker ... }`) |
| **`classic`** | Entrypoint copies `Caddyfile.dev` (plain `php_server`, hot-reload friendly) |

Compose passes `FRANKENPHP_MODE=${FRANKENPHP_MODE:-worker}` into the PHP service. After changing `.env`, run `docker compose up -d` (or `make up`) so the container is **recreated** — a plain `restart` does not reload env. No image rebuild is required.

## Troubleshooting

- **Composer cannot resolve `repo.packagist.org`**: Ensure Docker DNS is set (this repo’s compose files include public DNS). On corporate networks you may need internal DNS forwarders.
- **Changes not visible**: Switch to **`FRANKENPHP_MODE=classic`** (or restart the worker after DI/config changes). Recreate the container after changing `.env`.
- **Bundle not updating**: Run **`make update-bundle`** in the demo or `composer update nowo-tech/tiptap-editor-bundle` inside the container after editing the path-mounted bundle.
