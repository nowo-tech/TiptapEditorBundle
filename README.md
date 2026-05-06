# Tiptap Editor Bundle

[![CI](https://github.com/nowo-tech/TiptapEditorBundle/actions/workflows/ci.yml/badge.svg)](https://github.com/nowo-tech/TiptapEditorBundle/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?logo=php)](https://php.net) [![Symfony](https://img.shields.io/badge/Symfony-6.4%20%7C%207%20%7C%208-000000?logo=symfony)](https://symfony.com)

**Symfony form type** for rich text using [**Tiptap**](https://tiptap.dev/) (ProseMirror). Stores HTML in the underlying textarea — comparable to embedding **CKEditor-style** WYSIWYG fields. Assets are built with **Vite** (IIFE bundle in `Resources/public/`).

## Features

- `TiptapEditorType` extending `TextareaType` — value is HTML string.
- Optional formatting toolbar (bold, italic, bullet/ordered lists, undo/redo).
- Twig themes aligned with common Symfony layouts (Bootstrap 3–5, Foundation, Tailwind 2, table layout).
- `nowo_tiptap_editor_asset_path()` Twig helper for `assets:install` paths (`bundles/nowotiptapeditor/`).
- **pnpm + Vite** frontend; **Vitest** coverage on shared logger utilities.
- **Dockerfile + Makefile** workflow matching other Nowo bundles.
- **Demos**: Symfony 7 & 8 under `demo/` (FrankenPHP).

## Quick start

```bash
composer require nowo-tech/tiptap-editor-bundle:^1.0
php bin/console assets:install public
```

In Twig layout:

```twig
<script src="{{ asset(nowo_tiptap_editor_asset_path('tiptap-editor.js')) }}"></script>
```

```php
use Nowo\TiptapEditorBundle\Form\TiptapEditorType;

$builder->add('article', TiptapEditorType::class, ['label' => 'Article']);
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Composer, bundle registration, assets |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | YAML profiles, variants, form options |
| [docs/USAGE.md](docs/USAGE.md) | Forms, Twig script tag, `example` recipes |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Release history |
| [docs/UPGRADE.md](docs/UPGRADE.md) | Version upgrades |
| [docs/RELEASE.md](docs/RELEASE.md) | Maintainer: tags & GitHub Releases |

## Development

Requirements: Docker (recommended), or PHP 8.2+ with Composer + pnpm locally.

```bash
make up           # composer + pnpm install in container
make assets       # vite build → src/Resources/public/tiptap-editor.js
make test         # PHPUnit
make test-ts      # Vitest + coverage (logger)
make qa           # cs-check + phpunit
```

Demos:

```bash
make -C demo up-symfony8
# http://localhost:8011
```

## Tests and coverage

- PHP: PHPUnit (`composer test`, `composer test-coverage`) targeting **100%** lines on bundle PHP.
- TS: Vitest with threshold on `logger.ts` (bundle pattern).

## License

MIT — see [LICENSE](LICENSE).
