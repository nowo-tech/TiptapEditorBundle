# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.4] - 2026-05-12

Form submit sync for correct POST bodies; demo pages show saved HTML after a valid submit. **No PHP form type or YAML schema changes.**

### Added

- **`syncTiptapTextareasIn(container)`** on `window.NowoTiptapEditor`: copies each mounted editor’s HTML into its Symfony `<textarea>` under `container`.
- **Capture-phase `submit` listener** on `document`: for the submitting `<form>`, runs the sync above so the request body matches the latest ProseMirror document (in addition to existing `onUpdate` sync).
- Vitest coverage: **`syncTiptapTextareasIn`** on a container with no widget roots (no-op).

### Changed

- README: demo screenshot of **Editor variants** (`docs/images/demo-editor-variants.png`).
- [`USAGE.md`](USAGE.md): documents automatic submit sync and the new global helper.

### Demos (`demo/symfony7`, `demo/symfony8`)

- After a **valid** form submit, pages show an HTML preview (`<pre>`) from the posted data (configs, showcase, simple demo, examples show); **`examples_show`** passes `saved_value` from the controller like the main demo route.
- Simple demo: preview is shown when the form is submitted and valid (including empty body), not only when the saved value is non-empty.

## [1.0.3] - 2026-05-12

Widget lifecycle and demo startup messaging; **no PHP API or YAML changes**. If your CSS targeted the old host element (`div.tiptap-editor-widget`), see [`UPGRADING.md`](UPGRADING.md).

### Added

- Autonomous custom element **`<nowo-tiptap-editor>`** for the form widget: `connectedCallback` mounts Tiptap when the node is attached; `disconnectedCallback` destroys the editor.
- **`destroyTiptapRoot`** on `window.NowoTiptapEditor` (and internal teardown via the custom element).
- Vitest **`tiptap-editor.lifecycle.test.ts`** (custom element registration + safe `destroyTiptapRoot` on uninitialized roots).

### Changed

- Form themes: outer host is `<nowo-tiptap-editor class="tiptap-editor-widget …">` instead of `<div>` (same classes and `data-*` attributes; textarea remains in the light DOM for unchanged form submission).
- Demo **`make up`** (Symfony 7/8): aligned with **REQ-DEMO-005** — `docker-compose up -d`, `sleep 5`, `composer install` via `exec`, cache/assets steps, then `PORT` from `.env` / `.env.example` with `tr -d '\r'` and final line `Demo started at: http://localhost:<PORT>`.
- Root `demo/Makefile`: `verify-*` and `release-verify` resolve `PORT` from `.env.example` when missing in `.env`.

## [1.0.2] - 2026-05-08

Maintenance release (CI and demo config style only); **no breaking changes** relative to 1.0.1.

### Fixed

- CI: Vitest job — `pnpm/action-setup@v4` no longer sets `version` when `package.json` already pins `packageManager`, avoiding the multiple-version / `ERR_PNPM_BAD_PM_VERSION` failure.
- PHP-CS-Fixer: demo Symfony 7 `config/bundles.php` and Symfony 8 `config/reference.php` updated for project rules (`declare(strict_types=1)` and operator alignment).

## [1.0.1] - 2026-05-07

Maintenance and documentation release; **no breaking changes** relative to 1.0.0.

### Added

- `scripts/verify-clover-100.php`: runs after PHPUnit+Clover and **fails** `composer test-coverage` if bundle PHP (`src/`) is not at **100%** statement coverage.
- GitHub issue templates (bug, feature, support), pull request template, `CODEOWNERS`, and `.github/SECURITY.md`.

### Fixed

- PHPUnit DI tests: pass **at least one** merged config chunk (`[[]]`) to `Processor` / extension `load()`, not `[]`, matching Symfony Kernel behaviour (fixes empty `configs` validation errors).
- Demo Symfony 8: **examples** routes load `tiptap-editor.js` on live recipe pages; example index cards use **`position-relative`** for Bootstrap `stretched-link`.
- Demo Symfony 7: `composer.lock` aligned with the path dependency `nowo-tech/tiptap-editor-bundle`.

### Changed

- PHPUnit: **100%** line coverage on `src/`; expanded unit tests (`EditorVariant`, `TiptapExample`, configuration validation, `TiptapEditorType` options and edge cases).
- `TiptapEditorType`: normalizers simplified (`theme` typed `string`; redundant invalid-type guards removed where Symfony already enforces `allowedTypes`).
- Documentation: `CONTRIBUTING.md`, `SECURITY.md`, `ENGRAM.md`, `DEMO-FRANKENPHP.md`, **`UPGRADING.md`** (this guide lives next to `CHANGELOG.md` under `docs/`); README badges and doc index; Twig/translation notes in `CONFIGURATION.md` where relevant.
- CI: PHP-CS-Fixer dry-run workflow; coverage job runs **`composer test-coverage`** (includes Clover verification).
- Automation: `.github/workflows/release.yml`, `sync-releases.yml`; Cursor rules under `.cursor/rules` and `.cursorignore`.

## [1.0.0] - 2026-05-06

First stable release published on GitHub.

### Added

- `TiptapEditorType` Symfony form type storing **HTML** in the underlying `TextareaType`.
- YAML configuration under `nowo_tiptap_editor`: **named profiles** (`configs`), optional **`default_config`**, plus **legacy flat keys** (normalized into `configs.default`).
- Per-profile options: `toolbar`, `min_height`, `form_theme`, `debug`, **`variant`** (`default`, `simple`, `notion`, `agent`, `headless`), **`theme`** (`light`, `dark`, `auto`).
- Form options: `config` (profile name), `example` ([`TiptapExample`](../src/TiptapExample.php) recipes: tables, tasks, syntax highlighting, etc.), `toolbar`, `min_height`, `placeholder`, `theme`.
- Twig form themes aligned with common Symfony layouts (Bootstrap 3–5, Foundation, Tailwind 2, table layout).
- Automatic prepending of bundle form themes via `PrependExtensionInterface` when Twig is configured.
- Twig function `nowo_tiptap_editor_asset_path()` for published assets after `assets:install`.
- Frontend: Vite-built IIFE bundle (`Resources/public/tiptap-editor.js`), Stimulus-style widget mounting, optional toolbar and extension recipes.
- Development workflow: Docker, Makefile, PHPUnit, PHPStan, PHP-CS-Fixer, Vitest on shared TS utilities.
- Demos: Symfony 7 and 8 sample apps under `demo/` (FrankenPHP).

[Unreleased]: https://github.com/nowo-tech/TiptapEditorBundle/compare/v1.0.4...HEAD
[1.0.4]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.4
[1.0.3]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.3
[1.0.2]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.2
[1.0.1]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.1
[1.0.0]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.0
