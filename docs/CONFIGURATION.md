# Configuration reference

Root key: `nowo_tiptap_editor`

## Top-level

| Option            | Type   | Default   | Description |
|-------------------|--------|-----------|-------------|
| `default_config`  | string | `default` | Profile name used when a form field omits the `config` option. **Must** exist as a key under `configs`. |
| `configs`         | map    | —         | Named profiles. At least one profile is required (or use [legacy flat](#legacy-flat-yaml) input, which creates `configs.default`). |

## Per profile (`configs.<name>`)

| Option        | Type   | Default                    | Description |
|---------------|--------|----------------------------|-------------|
| `toolbar`     | bool   | `true`                     | Show the compact formatting toolbar in the browser widget. |
| `min_height`  | string | `240px`                    | CSS min-height of the editor surface. |
| `form_theme`  | string | `form_div_layout.html.twig` | Base Symfony form theme; must match an entry in your app’s `twig.form_themes` so the bundle’s overrides apply. |
| `debug`       | bool   | `false`                    | Verbose `console` logging from the bundle JavaScript. |
| `variant`     | string | `default`                  | UX preset: `default`, `simple`, `notion`, `agent`, `headless` (see `Nowo\TiptapEditorBundle\EditorVariant`). |
| `theme`       | string | `light`                    | Chrome palette: `light`, `dark`, or `auto` (follows `prefers-color-scheme`). |

## Legacy flat YAML

If the root has no `configs` key, the extension treats these keys (when present) as a single profile and maps them to `configs` under the name given by `default_config` (default `default`):

- `toolbar`, `min_height`, `form_theme`, `debug`, `variant`, `theme`

## Form type `TiptapEditorType` options

| Option          | Type | Description |
|-----------------|------|-------------|
| `config`        | `string\|null` | Profile name under `nowo_tiptap_editor.configs`. `null`/empty uses `default_config`. |
| `example`       | `string\|TiptapExample\|null` | Optional extension recipe (tables, tasks, syntax highlighting, …). See `Nowo\TiptapEditorBundle\TiptapExample`. |
| `toolbar`       | bool | Overrides the profile default for this field. |
| `min_height`    | string | Overrides the profile default for this field. |
| `theme`         | string | Field-level palette (`light` / `dark` / `auto`), normalized like YAML `theme`. |
| `placeholder`   | `string\|bool\|null` | Translation key in the bundle domain (or `false` to disable). |

Standard Symfony options (`label`, `required`, `translation_domain`, `attr`, …) work as usual.

## Overriding bundle Twig templates

Templates use the **`@NowoTiptapEditorBundle`** namespace (e.g. `@NowoTiptapEditorBundle/Form/tiptap_editor_theme.html.twig`). To override one in your application, copy the file to:

```text
templates/bundles/NowoTiptapEditorBundle/Form/<same-file-name>.html.twig
```

Use the **logical bundle name** `NowoTiptapEditorBundle` (matches the bundle class without the `Bundle` suffix pattern Symfony expects for overrides). Clear cache after changes: `php bin/console cache:clear`.

Shipped form themes wrap the widget in a **`<nowo-tiptap-editor>`** custom element (light DOM: the `<textarea>` stays a normal form control). Overrides should keep the `data-tiptap-*` contract expected by `tiptap-editor.js` unless you replace the mounting script.

See also Symfony’s [How to Override Templates](https://symfony.com/doc/current/bundles/override.html).

## Translation overrides

Translations use the domain **`NowoTiptapEditorBundle`** (files under `src/Resources/translations/`). Bundled locales for **`tiptap_placeholder`**: **de**, **en**, **es**, **fr**, **it**, **nl**, **pt**. To override strings from your app, add YAML/XLF files in **`translations/`** with the same domain name, for example `translations/NowoTiptapEditorBundle.en.yaml`. Symfony merges app translations over bundle defaults.

## Parameters exposed to the container

The DI extension sets parameters (including backward-compatible scalars mirroring the **default** profile). Prefer injecting configuration via your own services if you need values in PHP; forms resolve profiles through `TiptapEditorType` wiring.
