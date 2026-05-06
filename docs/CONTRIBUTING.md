# Contributing Guide

Thank you for contributing to **Tiptap Editor Bundle**.

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

## Code style

- PHP: PSR-12 via PHP-CS-Fixer (`composer cs-check` / `composer cs-fix`).
- PHPDoc and comments in **English**.
- TypeScript: matches existing strict settings; JSDoc in English for public helpers.

## Questions

Use [GitHub Discussions](https://github.com/nowo-tech/TiptapEditorBundle/discussions) or open a support issue from the issue templates.
