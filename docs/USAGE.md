# Usage

## Table of contents

- [Form type](#form-type)
- [Frontend script](#frontend-script)
- [Toolbar and variants](#toolbar-and-variants)
- [Examples hub parity](#examples-hub-parity)
- [Overriding templates (REQ-TWIG-001)](#overriding-templates-req-twig-001)

## Form type

```php
use Nowo\TiptapEditorBundle\Form\TiptapEditorType;
use Nowo\TiptapEditorBundle\TiptapExample;

$builder->add('body', TiptapEditorType::class, [
    'label' => 'Content',
    // Optional: pick a YAML profile from nowo_tiptap_editor.profiles
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
<script src="{{ asset(nowo_tiptap_editor_asset_path('tiptap-editor.js'), nowo_tiptap_editor_asset_package()) }}"></script>
```

The script finds `[data-tiptap-root="1"]` and `<nowo-tiptap-editor>` nodes (including fragments attached later) and mounts Tiptap. The form field remains a real `<textarea>` in the light DOM so Symfony receives HTML on submit as before.

On each **`submit`** (capture phase), the bundle syncs **every** mounted editor under the submitting `<form>` into its hidden textarea so the POST body reflects the latest document (in addition to syncing on editor `update`). If you build forms without a native submit event, call `window.NowoTiptapEditor.syncTiptapTextareasIn(formElement)` before reading or sending field values.

The `<nowo-tiptap-editor>` host uses the **custom elements** lifecycle (`connectedCallback` / `disconnectedCallback`) so the editor boots when the node is inserted into the document (e.g. Turbo, modals, or content prefetched in a background panel) and is destroyed when the host is removed.

### Optional global API

`window.NowoTiptapEditor` exposes helpers such as `initTiptapRoot`, `destroyTiptapRoot`, **`syncTiptapTextareasIn`**, `runInit`, and `runInitAndObserve` for custom integrations.

## Toolbar and variants

When the resolved `toolbar` option is `true`, the bundle renders a compact bar (bold, italic, lists, undo/redo, etc.). The **`variant`** from the active YAML profile controls layout/CSS presets (`simple`, `notion`, `agent`, `headless`, …).

**`notion` variant:** bubble menu on text selection (formatting + link) and a floating **Insert** menu on empty paragraphs (link, image, embed iframe, bullet list). **Ctrl/Cmd+K** opens the link prompt. Double-click an **image** or **iframe** to edit its URL. Embed iframes in saved HTML are preserved when the document is loaded back into the editor.

## Examples hub parity

Optional `example` values mirror categories from the [Tiptap examples docs](https://tiptap.dev/docs/examples) (open-source extensions bundled in this package’s build). Not every upstream demo has a 1:1 equivalent in PHP — see bundle demos under `demo/` for live routes.

## Overriding templates (REQ-TWIG-001)

The bundle registers the Twig namespace **`@NowoTiptapEditorBundle/`**. Application files under **`templates/bundles/NowoTiptapEditorBundle/`** **always win** over the copies inside the package (`TwigPathsPass` adds the bundle views path after application paths so your copies are tried first).

**Freeze rule:** a full-file override hides vendor updates for that `<subpath>` until you delete or manually merge it. Prefer selecting the matching form theme via **`nowo_tiptap_editor` profile `form_theme`** (see [CONFIGURATION.md](CONFIGURATION.md#top-level)) and only override the one theme file you customise.

**Procedure**

1. Identify the `<subpath>` from the table below (path relative to `src/Resources/views/`).
2. Create in your application: `templates/bundles/NowoTiptapEditorBundle/<subpath>` (same relative path and filename).
3. Clear the cache in dev if needed: `php bin/console cache:clear`.

Example — override the default form theme:

```text
templates/bundles/NowoTiptapEditorBundle/Form/tiptap_editor_theme.html.twig
```

Logical names look like `@NowoTiptapEditorBundle/Form/tiptap_editor_theme.html.twig`.

Shipped form themes wrap the widget in a **`<nowo-tiptap-editor>`** custom element (light DOM: the `<textarea>` stays a normal form control). Overrides should keep the `data-tiptap-*` contract expected by `tiptap-editor.js` unless you replace the mounting script.

**Overridable templates**

| Subpath | Purpose |
| --- | --- |
| `Form/tiptap_editor_theme.html.twig` | Default form theme (`form_div_layout`) |
| `Form/tiptap_editor_theme_table.html.twig` | Table form layout |
| `Form/tiptap_editor_theme_bootstrap3.html.twig` | Bootstrap 3 |
| `Form/tiptap_editor_theme_bootstrap3_horizontal.html.twig` | Bootstrap 3 horizontal |
| `Form/tiptap_editor_theme_bootstrap4.html.twig` | Bootstrap 4 |
| `Form/tiptap_editor_theme_bootstrap4_horizontal.html.twig` | Bootstrap 4 horizontal |
| `Form/tiptap_editor_theme_bootstrap5.html.twig` | Bootstrap 5 |
| `Form/tiptap_editor_theme_bootstrap5_horizontal.html.twig` | Bootstrap 5 horizontal |
| `Form/tiptap_editor_theme_foundation5.html.twig` | Foundation 5 |
| `Form/tiptap_editor_theme_foundation6.html.twig` | Foundation 6 |
| `Form/tiptap_editor_theme_tailwind2.html.twig` | Tailwind 2 |

Pick the row that matches the profile `form_theme` (or your app `twig.form_themes`). See also Symfony’s [How to Override Templates](https://symfony.com/doc/current/bundles/override.html).
