# Usage

## Form type

```php
use Nowo\TiptapEditorBundle\Form\TiptapEditorType;
use Nowo\TiptapEditorBundle\TiptapExample;

$builder->add('body', TiptapEditorType::class, [
    'label' => 'Content',
    // Optional: pick a YAML profile from nowo_tiptap_editor.configs
    'config' => 'simple',
    // Optional: load extra extensions (tables, tasks, code blocks, …)
    'example' => TiptapExample::Tables,
    // Optional overrides (defaults come from the profile)
    'toolbar' => true,
    'min_height' => '320px',
    'theme' => 'light',
    'placeholder' => 'tiptap_placeholder', // key in NowoTiptapEditorBundle translations
]);
```

Submitted data is an **HTML string** (store in `TEXT` / `LONGTEXT` / similar).

## Frontend script

Include the compiled widget **after** your layout loads (once per page):

```twig
<script src="{{ asset(nowo_tiptap_editor_asset_path('tiptap-editor.js')) }}"></script>
```

The script finds `[data-tiptap-root="1"]` nodes (including fragments loaded later) and mounts Tiptap.

### Optional global API

`window.NowoTiptapEditor` exposes helpers such as `initTiptapRoot`, `runInit`, and `runInitAndObserve` for custom integrations.

## Toolbar and variants

When the resolved `toolbar` option is `true`, the bundle renders a compact bar (bold, italic, lists, undo/redo, etc.). The **`variant`** from the active YAML profile controls layout/CSS presets (`simple`, `notion`, `agent`, `headless`, …).

## Examples hub parity

Optional `example` values mirror categories from the [Tiptap examples docs](https://tiptap.dev/docs/examples) (open-source extensions bundled in this package’s build). Not every upstream demo has a 1:1 equivalent in PHP — see bundle demos under `demo/` for live routes.
