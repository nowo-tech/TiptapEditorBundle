# Upgrade guide

## General

- Follow [`CHANGELOG.md`](CHANGELOG.md) for each release.
- Pin versions in `composer.json` (e.g. `^1.0`) instead of relying only on `dev-main` for production apps.
- After upgrading, run `php bin/console cache:clear` and `php bin/console assets:install public` so Twig and published bundle assets stay in sync.

## To 1.0.0

This is the **first tagged stable release**. There is no prior semver migration path within this repository.

- **Composer**: `composer require nowo-tech/tiptap-editor-bundle:^1.0`
- **Configuration**: prefer explicit **`configs`** + **`default_config`** (see [`CONFIGURATION.md`](CONFIGURATION.md)). Legacy **flat** YAML under `nowo_tiptap_editor` is still accepted and normalized into a single default profile.
- **Bootstrap**: ensure your layout loads the bundle script once per page:

  ```twig
  <script src="{{ asset(nowo_tiptap_editor_asset_path('tiptap-editor.js')) }}"></script>
  ```

## To 1.0.1

No YAML, PHP API, or asset filename changes versus **1.0.0**. Bump with:

```bash
composer update nowo-tech/tiptap-editor-bundle
```

Re-run `php bin/console assets:install public` if you publish bundle assets into `public/` (optional if nothing else changed).

## Future major versions (placeholder)

When `2.0.0` exists, this section will document breaking changes (constructor/DI, YAML keys, removed options, asset filenames).
