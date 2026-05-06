# Demo applications with FrankenPHP (development and production)

This document describes how the **Tiptap Editor Bundle** demos run under **FrankenPHP** in Docker: development (no worker, changes on refresh) vs production-style (worker). Reuse the same pattern in other Symfony bundles with FrankenPHP demos.

## Contents

- [Overview](#overview)
- [What each demo includes](#what-each-demo-includes)
- [Development](#development)
- [Production / worker mode](#production--worker-mode)
- [Ports and URLs](#ports-and-urls)
- [Troubleshooting](#troubleshooting)

## Overview

The **`demo/` folder is not shipped** when you install the bundle via Composer (`archive.exclude` includes `/demo`). Demos exist only in the Git repository for development and QA.

Each demo uses:

- **FrankenPHP** (Caddy + PHP) in one container.
- **Docker Compose** mounting the demo app and the parent bundle at **`/var/tiptap-editor-bundle`** for the Composer **path** repository.
- **`Caddyfile`** (production-oriented, worker) and **`Caddyfile.dev`** (development, classic `php_server`).
- An **entrypoint** that, when running in dev, activates `Caddyfile.dev` so Twig and bundle changes are visible without restarting workers.

There are two demos: **`demo/symfony7`** (default HTTP port **8010**) and **`demo/symfony8`** (default **8011**). From the bundle root:

```bash
make -C demo up-symfony8
# http://localhost:8011 (see demo README / PORT in .env)
```

## What each demo includes

In **`APP_ENV=dev`** (default for the demos):

- **Symfony Web Profiler** and **Debug** bundles (`require-dev`) for toolbar and profiling.
- **`nowo-tech/twig-inspector-bundle`** (optional dev UX) where listed in the demo `composer.json`.

The bundle under test is **`nowo-tech/tiptap-editor-bundle`**, installed from the path repo **`/var/tiptap-editor-bundle`**.

### FrankenPHP worker mode (compatibility)

**FrankenPHP worker mode:** Supported for production-style runs (worker-enabled Caddyfile). The **bundle itself** is a form widget + static JS; it does not require workers. Development demos intentionally **disable** worker mode so PHP/Twig changes apply on refresh—see each demo’s `docker/frankenphp/` files.

## Development

Goal: edit PHP, Twig, YAML, or bundle sources and see changes after a browser refresh.

- Use **`Caddyfile.dev`**: classic **`php_server`** without **`worker`** inside `php_server`.
- **`docker/php-dev.ini`**: short OPcache revalidation interval for dev.
- **`APP_ENV=dev`**, **`APP_DEBUG=1`** in Compose (see each demo’s `docker-compose.yml`).
- **DNS**: Compose sets **`dns: 8.8.8.8` / `8.8.4.4`** so Composer can resolve Packagist inside Docker/WSL.

Start from **`demo/symfony7`** or **`demo/symfony8`** with `make up` (see **`demo/README.md`**).

## Production / worker mode

For production-like behavior:

- Use **`APP_ENV=prod`**, **`APP_DEBUG=0`**, and the **`Caddyfile`** that enables FrankenPHP workers (see comments in the demo Docker/Caddy files).
- Warm Symfony cache and avoid writable `var/` in real deployments as appropriate.

Exact worker directives depend on the demo image and FrankenPHP version; compare **`Caddyfile`** vs **`Caddyfile.dev`** in `demo/symfony*/docker/frankenphp/`.

## Ports and URLs

| Demo       | Default `PORT` | URL                    |
| ---------- | ---------------- | ---------------------- |
| symfony7   | 8010             | http://localhost:8010 |
| symfony8   | 8011             | http://localhost:8011 |

Override `PORT` in the demo `.env` (from `.env.example`) if ports clash.

## Troubleshooting

- **Composer cannot resolve `repo.packagist.org`**: Ensure Docker DNS is set (this repo’s compose files include public DNS). On corporate networks you may need internal DNS forwarders.
- **Changes not visible**: Confirm you are in **dev** with **`Caddyfile.dev`** (no worker). Restart the container after switching Caddyfiles.
- **Bundle not updating**: Run **`make update-bundle`** in the demo or `composer update nowo-tech/tiptap-editor-bundle` inside the container after editing the path-mounted bundle.
