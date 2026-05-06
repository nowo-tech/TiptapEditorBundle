# Configuration reference

Root key: `nowo_tiptap_editor`.

| Option       | Type    | Default                         | Description |
|-------------|---------|----------------------------------|-------------|
| `toolbar`   | bool    | `true`                           | Default toolbar visibility for fields that do not override `toolbar`. |
| `min_height`| string  | `240px`                          | Default CSS min-height for the editor surface. |
| `form_theme`| string  | `form_div_layout.html.twig`      | Must match your app `twig.form_themes` entry so block overrides align (Bootstrap, Foundation, etc.). |
| `debug`     | bool    | `false`                          | Enables verbose browser console logs from the bundle script. |

Per-field options (`TiptapEditorType`): `toolbar`, `min_height`, `placeholder` (translation key or `false`), plus standard Symfony form options (`required`, `label`, `translation_domain`, …).
