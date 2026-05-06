# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/nowo-tech/TiptapEditorBundle/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.0
