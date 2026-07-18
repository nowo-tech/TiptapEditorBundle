# Installation

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

Install static assets into your `public/` tree:

```bash
php bin/console assets:install public
```

In your base layout, load the bundle script **once** per page (see [USAGE.md](USAGE.md)):

```twig
<script src="{{ asset(nowo_tiptap_editor_asset_path('tiptap-editor.js')) }}"></script>
```

When developing the bundle from a git clone, rebuild the JS with `pnpm run build` in the bundle root, then re-run `assets:install` in the app.

Persisted HTML may require sanitization in your app — see [SECURITY.md](SECURITY.md). To override Twig themes or translations, see [CONFIGURATION.md](CONFIGURATION.md#overriding-bundle-twig-templates).
