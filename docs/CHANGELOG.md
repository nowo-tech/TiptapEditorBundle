# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Table of contents

- [Unreleased](#unreleased)
- [1.3.4](#134---2026-08-19)
- [1.3.3](#133---2026-08-19)
- [1.3.2](#132---2026-08-19)
- [1.3.1](#131---2026-08-18)
- [1.2.3](#123---2026-08-03)
- [1.2.2](#122---2026-07-30)
- [1.2.1](#121---2026-07-29)
- [1.2.0](#120---2026-07-18)
- [1.1.2](#112---2026-07-16)

## [Unreleased]

## [1.3.4] - 2026-08-19

### Security

- **Flex recipe:** ship prod `html_sanitizer: allowlist` defaults and manifest (REQ-SEC-004). Prefer **`^1.3.4`** over `v1.3.3`.

## [1.3.3] - 2026-08-19

### Documentation

- Sync `CHANGELOG.md` and `UPGRADING.md` for v1.3.2 release notes.

[1.3.3]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.3.3

## [1.3.2] - 2026-08-19

### Security

- **Demo prod config:** enable `html_sanitizer: allowlist` in shipped `config/packages/prod/nowo_tiptap_editor.yaml`.
- **CI:** run `composer audit --locked` after dependency install (REQ-SEC / P3).

[1.3.2]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.3.2

## [1.3.1] - 2026-08-18

### Changed

- **Demos:** pin `nowo-tech/hot-reload-bundle` to `^1.4` with FrankenPHP Mercure/`hot_reload` (`dev`/`test` only).
- **Demos:** Symfony 8 only; Symfony 6/7 demo apps removed.

[1.3.1]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.3.1

## [1.3.0] - 2026-08-04

### Added
- **REQ-TWIG-004:** require `twig/extra-bundle` + `twig/string-extra`; `make check-twig-extra` in `release-check`; demos register `TwigExtraBundle`.
- **Twig-CS-Fixer:** `vincentlanglet/twig-cs-fixer`, `.twig-cs-fixer.php`, `composer twig:lint` / `twig:fix`.

[1.3.0]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.3.0

## [1.2.3] - 2026-08-03

### Fixed

- **Demo / FrankenPHP** — entrypoint waits for `vendor/autoload_runtime.php` before starting worker mode so `make demo-smoke` / `make up` work on a clean CI checkout (workers no longer exit before Composer).
- Demo Makefiles: wait until the `php` service accepts `exec` (up to 30s) instead of a fixed `sleep 5`.

### Added

- GitHub hygiene: Dependabot, stale issues/PRs (`actions/stale` v11), semantic PR title lint, Copilot instructions.

## [1.2.2] - 2026-07-30

### Documentation

- USAGE: **Overriding templates (REQ-TWIG-001)** — freeze rule, prefer profile `form_theme`, full form-theme `<subpath>` table, `<nowo-tiptap-editor>` / `data-tiptap-*` contract notes.
- CONFIGURATION: Twig overrides section points to USAGE (single source of truth).

## [1.2.1] - 2026-07-29

### Added

- Symfony asset package **`nowo_tiptap_editor`** (`framework.assets.packages`, base path `/bundles/nowotiptapeditor`) and Twig helper **`nowo_tiptap_editor_asset_package()`** (REQ-ASSETS-004).
- Root **`make demo-smoke`** + `.github/workflows/demo-smoke.yml` (REQ-TEST-011).
- `.scripts/check-open-prs.sh` wired into `release-check` (REQ-REL-003 tooling).
- FrankenPHP friendly banner image under `docs/images/` (REQ-DOCS-017 / DEMO-008).
- Composer keywords `php`, `frankenphp` (REQ-PKG-004).
- Require **`symfony/asset`** for the named package at kernel boot.
- **REQ-CS-005:** `nowo-tech/phpstan-frankenphp` in `require-dev` with classic + worker rulesets.

### Changed

- **`nowo_tiptap_editor_asset_path()`** returns a relative filename (e.g. `tiptap-editor.js`) for use with `asset(..., nowo_tiptap_editor_asset_package())` instead of a hard-coded `bundles/nowotiptapeditor/...` path.
- Demo Symfony 8 Dockerfile base image: `dunglas/frankenphp:1-php8.5-alpine` (REQ-DEMO-010).
- Demo Makefiles: absolute `DOCKER_BIN` so local `docker/` dirs do not shadow the CLI (REQ-MAKE-010).
- PHPUnit / CI: `SYMFONY_DEPRECATIONS_HELPER=max[direct]=0` (REQ-SF-005).
- PHPStan: explicit `ignoreErrors: []` (REQ-CS-006 soft).
- README Documentation order: Installation first; `GITHUB_CI` under Additional (REQ-DOCS-002).

## [1.2.0] - 2026-07-18

Minor release: YAML configuration keys renamed to AuditKit-style **`default_profile`** / **`profiles`**; legacy keys remain supported. **No published JS changes.** Form option `config` unchanged.

### Changed

- Configuration: renamed YAML keys **`default_config`** / **`configs`** to **`default_profile`** / **`profiles`** (AuditKit-style). Legacy keys still accepted via normalization; container parameters keep legacy aliases. Form option `config` unchanged. See [`UPGRADING.md`](UPGRADING.md) and [`CONFIGURATION.md`](CONFIGURATION.md).
- Docs (`CONFIGURATION`, `INSTALLATION`, `USAGE`, `UPGRADING`) and Spec Kit baseline (`FR-CFG-*`) aligned with the new keys.

### Demos (`demo/symfony7`, `demo/symfony8`)

- `config/packages/nowo_tiptap_editor.yaml` and Flex `config/reference.php` stubs use **`default_profile`** / **`profiles`**.
- Composer scripts: add **`test-coverage`** (aliases smoke **`test`**) so `make release-check` demo targets resolve.
- `demo/Makefile` healthchecks use `curl -L` so locale redirects (`/` → `/en/`) count as healthy.

## [1.1.2] - 2026-07-16

Maintenance release: git hygiene (**REQ-GIT-001**), Code of Conduct, and dependency refresh; **no PHP form type, YAML schema, or published JS changes**.

### Added

- **REQ-GIT-001**: CI job `git-hygiene`, `.scripts/check-no-cursor-coauthor.sh`, `.scripts/strip-cursor-coauthor-from-history.sh`, `.githooks/commit-msg`, Cursor rule `01-git-commits.mdc`, and Makefile targets `setup-hooks`, `check-no-cursor-coauthor`, `strip-cursor-coauthor-from-history`.
- [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) (Contributor Covenant) and [`docs/GITHUB_CI.md`](GITHUB_CI.md).

### Changed

- [`CONTRIBUTING.md`](CONTRIBUTING.md), [`RELEASE.md`](RELEASE.md), README: document CoC, hooks, and CI git-hygiene checks.
- `make release-check` runs `check-no-cursor-coauthor` first.
- Dev **`composer.lock`**: PHP-CS-Fixer **3.95.15**, Rector **2.5.7**.

### Demos (`demo/symfony7`, `demo/symfony8`)

- **`composer.lock`**: path-repo reference refreshed; **`nowo-tech/twig-inspector-bundle`** **1.0.36**.

## [1.1.1] - 2026-07-13

Maintenance release; **no PHP form type, YAML schema, or published JS changes**.

### Changed

- Cursor rules (`.cursor/rules/`): refined PHP/Symfony, tests, docs/release guidance; new Twig/public-assets rule (**REQ-IDE-005**).
- **`.gitignore`**: ignore local `.cursor/sandbox.json`.
- Dev **`composer.lock`**: PHP-CS-Fixer **3.95.13**, Rector **2.5.6**.

### Demos (`demo/symfony7`, `demo/symfony8`)

- **`composer.lock`**: path-repo reference aligned with bundle **1.1.0**; **`nowo-tech/twig-inspector-bundle`** **1.0.35**.

## [1.1.0] - 2026-07-08

Minor release: **notion** UX, embed iframes, translation locales, and maintainer Spec Kit baseline; **no PHP form type or YAML schema changes**.

### Added

- Tiptap **`embedIframe`** extension ([`embed-iframe.ts`](../src/Resources/assets/src/embed-iframe.ts)): preserves `<iframe>` nodes (YouTube, Vimeo, etc.) when loading and saving HTML.
- **`notion`** variant: bubble menu (bold, italic, underline, strike, code, link) and floating **Insert** menu (link, image, embed, bullet list); **Ctrl/Cmd+K** opens the link prompt.
- Double-click **image** or **iframe** in the editor to edit its URL.
- Bundle translations for **`tiptap_placeholder`**: **de**, **fr**, **it**, **nl**, **pt** (in addition to **en** / **es**).
- GitHub **Spec Kit** baseline: [`specs/001-baseline/`](../specs/001-baseline/), [`.specify/`](../.specify/), Cursor skills (`.cursor/skills/speckit-*`), and [`SPEC-KIT.md`](SPEC-KIT.md).

### Changed

- **`notion`** profile toolbar: adds link and image actions alongside heading presets.
- Twig form theme: styles for notion bubble/floating menus and embedded iframes.
- [`SPEC-DRIVEN-DEVELOPMENT.md`](SPEC-DRIVEN-DEVELOPMENT.md): documents Spec Kit layer and updated user stories.
- README: link to [`SPEC-KIT.md`](SPEC-KIT.md).
- Dev **`composer.lock`** and demo **`composer.lock`**: refreshed tooling and path-repo references.

### Demos (`demo/symfony7`, `demo/symfony8`)

- Docker images: install PHP **`intl`** extension (with `zip`).

## [1.0.7] - 2026-07-08

Patch release: stable CI **`cs-check`** for Flex-generated demo stubs; **no PHP form type, YAML schema, or published JS changes**.

### Fixed

- CI **`cs-check`**: exclude Flex auto-generated **`demo/symfony*/config/reference.php`** from PHP-CS-Fixer (Symfony regenerates them without `declare(strict_types=1)`).

### Demos (`demo/symfony7`, `demo/symfony8`)

- **`composer.lock`**: path-repo reference aligned with bundle **1.0.6**.
- **`config/reference.php`**: kept as Flex-generated stubs (no manual `declare(strict_types=1);`).

## [1.0.6] - 2026-06-30

Patch release: demo Symfony alignment and CI **`cs-check`** fix; **no PHP form type, YAML schema, or published JS changes**.

### Fixed

- Demo Symfony 7 and 8 **`config/reference.php`**: `declare(strict_types=1);` for PHP-CS-Fixer (CI `cs-check`).

### Demos (`demo/symfony7`, `demo/symfony8`)

- **`composer.lock`** refreshed for Symfony **7.4** and **8.1**.
- Symfony 7: Flex-generated **`config/reference.php`**; recipes for **form** (stateless CSRF in `config/packages/csrf.yaml`) and **property-info** (`config/packages/property_info.yaml`).
- Symfony 8: **`config/reference.php`** regenerated for Symfony 8.1 configuration shapes.

## [1.0.5] - 2026-06-30

Maintenance release: CI matrix, Makefile `update-deps`, demo Symfony versions, and documentation; **no PHP form type, YAML schema, or published JS changes**.

### Added

- Makefile targets **`update-deps`** (root bundle) and **`update-deps`** / **`update-deps-all`** (demos) via shared Nowo scripts (**REQ-MAKE-008**); demo Makefiles define `COMPOSE` and `SERVICE_PHP` so `docker-compose run` works correctly.
- [`SPEC-DRIVEN-DEVELOPMENT.md`](SPEC-DRIVEN-DEVELOPMENT.md): product spec, user stories, and `REQ-*` traceability guide.
- GitHub workflow **CodeRabbit** (`.github/workflows/coderabbit.yml`) and `.coderabbit.yaml`.

### Changed

- CI PHPUnit matrix: Symfony **7.4** and **8.1** in addition to 7.0 and 8.0 (PHP 8.2–8.5).
- README: Symfony badge **6.4 | 7.4+ | 8.0 | 8.1+**; link to spec-driven development doc.
- [`ENGRAM.md`](ENGRAM.md): cross-link to spec-driven development.
- Dev **`composer.lock`**: refreshed Symfony and tooling patch versions.

### Fixed

- Demo Symfony 8 **`config/reference.php`**: `declare(strict_types=1);` restored for PHP-CS-Fixer alignment (CHANGELOG 1.0.4 incorrectly documented its removal).

### Demos (`demo/symfony7`, `demo/symfony8`)

- Symfony Flex **`extra.symfony.require`**: **7.4.\*** (was 7.0.\*) and **8.1.\*** (was 8.0.\*); Symfony 8 demo pins **`symfony/translation`** to **8.1.\***.
- Demo controller Twig context key alignment (PHP-CS-Fixer).

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

[Unreleased]: https://github.com/nowo-tech/TiptapEditorBundle/compare/v1.3.1...HEAD
[1.2.3]: https://github.com/nowo-tech/TiptapEditorBundle/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/nowo-tech/TiptapEditorBundle/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/nowo-tech/TiptapEditorBundle/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.2.0
[1.1.2]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.1.2
[1.1.1]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.1.1
[1.1.0]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.1.0
[1.0.7]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.7
[1.0.6]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.6
[1.0.5]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.5
[1.0.4]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.4
[1.0.3]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.3
[1.0.2]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.2
[1.0.1]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.1
[1.0.0]: https://github.com/nowo-tech/TiptapEditorBundle/releases/tag/v1.0.0
