# Installation

```bash
composer require nowo-tech/tiptap-editor-bundle
```

Register the bundle if Flex does not do it automatically:

```php
// config/bundles.php
return [
    // ...
    Nowo\TiptapEditorBundle\NowoTiptapEditorBundle::class => ['all' => true],
];
```

Publish configuration (optional):

```yaml
# config/packages/nowo_tiptap_editor.yaml
nowo_tiptap_editor:
    toolbar: true
    min_height: '240px'
    form_theme: 'form_div_layout.html.twig'
    debug: false
```

Install frontend assets once:

```bash
php bin/console assets:install public
```

Rebuild bundle JS when developing from source (`pnpm run build` in the bundle clone).
