# Upgrade guide

## General

- Follow [`CHANGELOG.md`](CHANGELOG.md) for each release.
- Pin versions in `composer.json` (e.g. `^1.0`) instead of relying only on `dev-main` for production apps.
- After upgrading, run `php bin/console cache:clear` and `php bin/console assets:install public` so Twig and published bundle assets stay in sync.

## To 1.0.4

No YAML or PHP form API changes versus **1.0.3**. Bump and refresh published JS:

```bash
composer update nowo-tech/tiptap-editor-bundle
php bin/console assets:install public
```

**JavaScript:** the bundle registers a **capture-phase** `submit` listener on `document` that syncs every Tiptap widget inside the submitting form. If you maintain a custom build or fork of `tiptap-editor.js`, port the same behaviour or call `window.NowoTiptapEditor.syncTiptapTextareasIn(formElement)` before serializing the form. Integrations that already called `sync` manually should not break; duplicate writes set the same HTML.

**Demos only:** Symfony 7/8 sample apps gained post-submit HTML previews; no impact on the Composer package archive (see `composer.json` `archive.exclude`).

## To 1.0.3

No YAML or PHP API changes versus **1.0.2**. Rebuild or reinstall published assets if you ship the bundle JS from `vendor/`:

```bash
composer update nowo-tech/tiptap-editor-bundle
php bin/console assets:install public
```

**Markup / CSS:** the widget host is `<nowo-tiptap-editor class="tiptap-editor-widget …">` instead of `<div>`. Prefer `.tiptap-editor-widget` in selectors; if you used `div.tiptap-editor-widget`, use `nowo-tiptap-editor.tiptap-editor-widget` or drop the element qualifier.

**Demos (`demo/symfony7`, `demo/symfony8`):** `make up` follows the canonical startup messages and ends with `Demo started at: http://localhost:<PORT>` (see [`CHANGELOG.md`](CHANGELOG.md) for 1.0.3).

## To 1.0.2

No YAML, PHP API, or asset filename changes versus **1.0.1**. Bump with:

```bash
composer update nowo-tech/tiptap-editor-bundle
```

No upgrade steps beyond routine dependency update.

## To 1.0.1

No YAML, PHP API, or asset filename changes versus **1.0.0**. Bump with:

```bash
composer update nowo-tech/tiptap-editor-bundle
```

Re-run `php bin/console assets:install public` if you publish bundle assets into `public/` (optional if nothing else changed).

## To 1.0.0

This is the **first tagged stable release**. There is no prior semver migration path within this repository.

- **Composer**: `composer require nowo-tech/tiptap-editor-bundle:^1.0`
- **Configuration**: prefer explicit **`configs`** + **`default_config`** (see [`CONFIGURATION.md`](CONFIGURATION.md)). Legacy **flat** YAML under `nowo_tiptap_editor` is still accepted and normalized into a single default profile.
- **Bootstrap**: ensure your layout loads the bundle script once per page:

  ```twig
  <script src="{{ asset(nowo_tiptap_editor_asset_path('tiptap-editor.js')) }}"></script>
  ```

## Future major versions (placeholder)

When `2.0.0` exists, this section will document breaking changes (constructor/DI, YAML keys, removed options, asset filenames).
