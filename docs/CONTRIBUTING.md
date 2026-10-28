# Contributing Guide

## Table of contents

- [Code of Conduct](#code-of-conduct)
- [How to contribute](#how-to-contribute)
  - [Reporting bugs](#reporting-bugs)
  - [Suggesting enhancements](#suggesting-enhancements)
  - [Contributing code](#contributing-code)
- [Project layout](#project-layout)
- [End-to-end tests and screenshots (REQ-DEMO-013)](#end-to-end-tests-and-screenshots-req-demo-013)
- [Code style](#code-style)
- [Questions](#questions)
- [Git hooks (REQ-GIT-001)](#git-hooks-req-git-001)
- [Igor worker audit (REQ-CS-008)](#igor-worker-audit-req-cs-008)
- [Cursor Agent (REQ-IDE-006)](#cursor-agent-req-ide-006)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](../CODE_OF_CONDUCT.md). By participating, you are expected to uphold it. Please report unacceptable behavior to **hectorfranco@nowo.tech**.

## How to contribute

### Reporting bugs

1. Check [existing issues](https://github.com/nowo-tech/TiptapEditorBundle/issues).
2. Open a new issue with steps to reproduce, expected vs actual behavior, and versions (`composer info nowo-tech/tiptap-editor-bundle`, `php -v`, Symfony version).

### Suggesting enhancements

Open an issue describing the use case, expected behavior, and optional implementation ideas.

### Contributing code

1. Fork and clone the repository.
2. Install PHP dependencies: `composer install` (or use Docker: `make up`).
3. Build frontend assets when touching TS: `make assets` or `pnpm install && pnpm run build`.
4. Run quality checks: `make release-check` or at minimum `composer qa`, `composer phpstan`, `composer test`, and `pnpm run test:coverage` when TS changes.
5. Update [`docs/CHANGELOG.md`](CHANGELOG.md) under `[Unreleased]` for user-visible changes.
6. Open a pull request against `main` using [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md).

## Project layout

- `src/` — Bundle code (DI extension, form type, Twig extension, compiler passes).
- `src/Resources/` — Twig themes, translations, Vite sources, published `public/` JS.
- `tests/` — PHPUnit (`Unit`, `Integration`).
- `demo/` — Symfony 7 & 8 FrankenPHP demos (not shipped in the Composer package).

## End-to-end tests and screenshots (REQ-DEMO-013)

The Symfony 8 demo ships a Playwright suite in `demo/symfony8/e2e/` (official Playwright image, nothing to install on the host):

```bash
make -C demo/symfony8 test-e2e          # starts the demo if needed, runs the happy-path specs
make -C demo/symfony8 demo-screenshots  # recaptures docs/images/demo/*.webp (PNG → WebP via sharp)
```

Refresh the screenshots when the demo UI changes and commit only the `.webp` files.

## Code style

- PHP: PSR-12 via PHP-CS-Fixer (`composer cs-check` / `composer cs-fix`).
- PHPDoc and comments in **English**.
- TypeScript: matches existing strict settings; JSDoc in English for public helpers.

## Questions

Use [GitHub Discussions](https://github.com/nowo-tech/TiptapEditorBundle/discussions) or open a support issue from the issue templates.

## Git hooks (REQ-GIT-001)

Do **not** add `Co-authored-by: Cursor` or `cursoragent@cursor.com` trailers, nor `Co-Authored-By: Claude …` / `noreply@anthropic.com` ones, to commit messages.

```bash
make setup-hooks
make check-no-cursor-coauthor
```

`make setup-hooks` installs `.githooks/commit-msg` (or sets `core.hooksPath` to `.githooks`). Run it once per clone before your first commit.
If CI fails because trailers are already on the remote, see [GITHUB_CI.md](GITHUB_CI.md) (REQ-GIT-001) and run `make strip-cursor-coauthor-from-history` before `git push --force-with-lease`.

## Igor worker audit (REQ-CS-008)

Run `make igor` (or `composer igor`) before release. Igor audits package `src/` for FrankenPHP worker-state issues. It is require-dev only.

## Cursor Agent (REQ-IDE-006)

Contributors using Cursor Agent on this repository should:

1. **Submit with Ctrl+Enter** (macOS: **⌘+Enter**). **Enter** inserts a newline; **Ctrl+Enter** / **⌘+Enter** submits the prompt. UI: **Cursor Settings → Agents / Chat → Submit with Ctrl + Enter**.
2. **Queue follow-ups** while the agent is running. In user `settings.json` (not a repo file):

```json
{
  "cursor.composer.queueMessageDefaultBehavior": "queue"
}
```

Do **not** use `"steer"` as the org default: steer interrupts the running agent as soon as a follow-up is sent.
