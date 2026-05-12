# Tiptap Editor Bundle — demos

Two Symfony apps (7.x and 8.x) served with **FrankenPHP**. Each mounts this repository at `/var/tiptap-editor-bundle` so Composer can install `nowo-tech/tiptap-editor-bundle` from the path repository.

## Ports

| Demo    | Default URL            |
|---------|------------------------|
| Symfony 7 | http://localhost:8010 |
| Symfony 8 | http://localhost:8011 |

Override with `PORT` in each demo’s `.env`.

## Commands (from `demo/`)

```bash
make help
make up-symfony8    # or up-symfony7
make verify-symfony8
make down-symfony8
```

Inside `demo/symfony8` or `demo/symfony7`:

```bash
make up          # up -d → wait → composer install → cache/assets → "Demo started at: …"
make install
make update-bundle
```

After changing the bundle PHP/Twig, run `make update-bundle` in the demo or `composer update nowo-tech/tiptap-editor-bundle` in the container.

## Assets

The demo loads `tiptap-editor.js` via `assets:install` from the bundle’s `Resources/public`. Re-run after rebuilding frontend assets in the bundle root (`pnpm run build`).
