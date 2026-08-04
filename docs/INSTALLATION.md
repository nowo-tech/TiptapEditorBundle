# Installation

## Table of contents

- [Install](#install)
- [Assets](#assets)

## Install

```bash
composer require nowo-tech/tiptap-editor-bundle:^1.0
```

Symfony Flex usually registers the bundle. If not:

```php
// config/bundles.php
return [
    // ...
    Nowo\TiptapEditorBundle\NowoTiptapEditorBundle::class => ['all' => true],
];
```

Create configuration (recommended — named profiles):

```yaml
# config/packages/nowo_tiptap_editor.yaml
nowo_tiptap_editor:
    default_profile: default
    profiles:
        default:
            variant: simple
            toolbar: true
            min_height: '240px'
            form_theme: form_div_layout.html.twig
            debug: false
            theme: light
```

You may still use **legacy flat** keys at the root (without `profiles`): they are normalized into `profiles.default`. Prefer explicit `profiles` for multiple profiles. Legacy YAML keys `default_config` / `configs` are still accepted and mapped to `default_profile` / `profiles`.

See [CONFIGURATION.md](CONFIGURATION.md) for the full reference.

## Assets

```bash
php bin/console assets:install public
```

In your base layout, load the bundle script **once** per page via the named package `nowo_tiptap_editor` (see [USAGE.md](USAGE.md)):

```twig
<script src="{{ asset(nowo_tiptap_editor_asset_path('tiptap-editor.js'), nowo_tiptap_editor_asset_package()) }}"></script>
```

When developing the bundle from a git clone, rebuild the JS with `pnpm run build` in the bundle root, then re-run `assets:install` in the app.

Persisted HTML may require sanitization in your app — see [SECURITY.md](SECURITY.md). To override Twig themes or translations, see [CONFIGURATION.md](CONFIGURATION.md#overriding-bundle-twig-templates).

## Twig Extra Bundle (REQ-TWIG-004)

This package ships Twig templates. Host applications **must** install and enable Twig Extra:

```bash
composer require twig/extra-bundle twig/string-extra
```

Register `Twig\Extra\TwigExtraBundle\TwigExtraBundle` in `config/bundles.php` (Flex usually does this). Demos already include the same stack. The package `release-check` runs `make check-twig-extra` to guard this contract.
