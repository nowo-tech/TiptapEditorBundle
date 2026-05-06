# Usage

## Form type

```php
use Nowo\TiptapEditorBundle\Form\TiptapEditorType;

$builder->add('body', TiptapEditorType::class, [
    'label' => 'Content',
    'toolbar' => true,
    'min_height' => '320px',
    'placeholder' => 'tiptap_placeholder', // translation key in NowoTiptapEditorBundle
]);
```

Submitted data is **HTML** (string), suitable for persistence in a text/`LONGTEXT` column.

## Frontend script

Include the compiled widget after your layout loads (once per page):

```twig
<script src="{{ asset(nowo_tiptap_editor_asset_path('tiptap-editor.js')) }}"></script>
```

The script watches the DOM and initializes every `[data-tiptap-root="1"]` widget (including fragments injected later).

### Optional global API

`window.NowoTiptapEditor` exposes `initTiptapRoot`, `runInit`, and `runInitAndObserve` for custom integrations (similar UX to other Nowo bundles).

## Toolbar

When `toolbar` is `true`, a compact bar is rendered (bold, italic, lists, undo/redo). Set `toolbar` to `false` for a bare editing surface.
