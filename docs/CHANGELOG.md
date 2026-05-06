# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/nowo-tech/TiptapEditorBundle/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.1
[1.0.0]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.0
