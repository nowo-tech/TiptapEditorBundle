# Configuration reference

## Table of contents

- [Top-level](#top-level)
- [Per profile](#per-profile-profilesname)
- [Legacy keys and flat YAML](#legacy-keys-and-flat-yaml)
- [Form type options](#form-type-tiptapeditortype-options)
- [Overriding bundle Twig templates](#overriding-bundle-twig-templates)
- [Translation overrides](#translation-overrides)
- [Parameters](#parameters-exposed-to-the-container)

Root key: `nowo_tiptap_editor`

## Top-level

| Option            | Type   | Default   | Description |
|-------------------|--------|-----------|-------------|
| `default_profile` | string | `default` | Profile name used when a form field omits the `config` option. **Must** exist as a key under `profiles`. |
| `profiles`        | map    | —         | Named profiles. At least one profile is required (or use [legacy flat](#legacy-keys-and-flat-yaml) input, which creates `profiles.default`). |

## Per profile (`profiles.<name>`)

| Option        | Type   | Default                    | Description |
|---------------|--------|----------------------------|-------------|
| `toolbar`     | bool   | `true`                     | Show the compact formatting toolbar in the browser widget. |
| `min_height`  | string | `240px`                    | CSS min-height of the editor surface. |
| `form_theme`  | string | `form_div_layout.html.twig` | Base Symfony form theme; must match an entry in your app’s `twig.form_themes` so the bundle’s overrides apply. |
| `debug`       | bool   | `false`                    | Verbose `console` logging from the bundle JavaScript. |
| `variant`     | string | `default`                  | UX preset: `default`, `simple`, `notion`, `agent`, `headless` (see `Nowo\TiptapEditorBundle\EditorVariant`). |
| `theme`       | string | `light`                    | Chrome palette: `light`, `dark`, or `auto` (follows `prefers-color-scheme`). |

## Legacy keys and flat YAML

- **Renamed keys:** `default_config` / `configs` were renamed to `default_profile` / `profiles`. Legacy keys are still accepted via normalization (mapped when the new keys are absent).
- **Flat layout:** If the root has no `profiles` (nor legacy `configs`) key, the extension treats these keys (when present) as a single profile and maps them to `profiles` under the name given by `default_profile` (default `default`):

- `toolbar`, `min_height`, `form_theme`, `debug`, `variant`, `theme`

## Form type `TiptapEditorType` options

| Option          | Type | Description |
|-----------------|------|-------------|
| `config`        | `string\|null` | Profile name under `nowo_tiptap_editor.profiles`. `null`/empty uses `default_profile`. (Form option key remains `config` for BC.) |
| `example`       | `string\|TiptapExample\|null` | Optional extension recipe (tables, tasks, syntax highlighting, …). See `Nowo\TiptapEditorBundle\TiptapExample`. |
| `toolbar`       | bool | Overrides the profile default for this field. |
| `min_height`    | string | Overrides the profile default for this field. |
| `theme`         | string | Field-level palette (`light` / `dark` / `auto`), normalized like YAML `theme`. |
| `placeholder`   | `string\|bool\|null` | Translation key in the bundle domain (or `false` to disable). |

Standard Symfony options (`label`, `required`, `translation_domain`, `attr`, …) work as usual.

## Overriding bundle Twig templates

**REQ-TWIG-001.** Namespace: **`NowoTiptapEditorBundle`**. Full procedure, freeze rule, overridable `<subpath>` table, and widget contract notes: [USAGE.md — Overriding templates](USAGE.md#overriding-templates-req-twig-001).

## Translation overrides

Translations use the domain **`NowoTiptapEditorBundle`** (files under `src/Resources/translations/`). Bundled locales for **`tiptap_placeholder`**: **de**, **en**, **es**, **fr**, **it**, **nl**, **pt**. To override strings from your app, add YAML/XLF files in **`translations/`** with the same domain name, for example `translations/NowoTiptapEditorBundle.en.yaml`. Symfony merges app translations over bundle defaults.

## Parameters exposed to the container

The DI extension sets `nowo_tiptap_editor.default_profile` and `nowo_tiptap_editor.profiles`, plus legacy aliases `nowo_tiptap_editor.default_config` / `nowo_tiptap_editor.configs` (same values), and backward-compatible scalars mirroring the **default** profile. Prefer injecting configuration via your own services if you need values in PHP; forms resolve profiles through `TiptapEditorType` wiring.
