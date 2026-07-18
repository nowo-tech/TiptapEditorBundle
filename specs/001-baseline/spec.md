# Feature Specification: TiptapEditorBundle baseline (100% code coverage)

**Feature Branch**: `001-baseline`  
**Created**: 2026-07-07  
**Status**: Active  
**Input**: Backfill GitHub Spec Kit baseline documenting 100% of production code in `src/`.

**Related docs**: [`docs/SPEC-DRIVEN-DEVELOPMENT.md`](../../docs/SPEC-DRIVEN-DEVELOPMENT.md), [`docs/CONFIGURATION.md`](../../docs/CONFIGURATION.md), [`docs/USAGE.md`](../../docs/USAGE.md)  
**Code inventory (traceability)**: [`code-inventory.md`](code-inventory.md)

---

## User Scenarios & Testing

### User Story 1 — Rich text form field (Priority: P1)

As a form author, I use `TiptapEditorType` so users edit HTML with a Tiptap toolbar while Symfony stores HTML in a textarea-compatible value.

**Independent Test**: Add field to form, type formatted text, submit — normalized HTML persisted; empty content becomes `''`.

**Acceptance Scenarios**:

1. **Given** default profile, **When** field renders, **Then** Twig theme outputs textarea + `data-controller="nowo-tiptap-editor"` with profile options serialized.
2. **Given** `config` option references a named profile, **When** field builds, **Then** toolbar, min-height, variant, and theme come from `nowo_tiptap_editor.profiles.{name}`.

---

### User Story 2 — Named editor profiles (Priority: P1)

As an integrator, I define multiple YAML profiles (`default`, `simple`, `notion`, etc.) with different toolbars and UX variants.

**Acceptance Scenarios**:

1. **Given** legacy flat config keys at root, **When** extension normalizes, **Then** values migrate into `profiles.default` with `default_profile=default`.
2. **Given** `default_profile` references missing profile, **When** container compiles, **Then** configuration validation fails with explicit error.

---

### User Story 3 — Embed and Twig helpers (Priority: P2)

As a template author, I render read-only HTML or iframe embeds via Twig functions without a form field.

**Acceptance Scenarios**:

1. **Given** `nowo_tiptap_render(html)`, **When** called in Twig, **Then** sanitized/display HTML emitted per extension rules.
2. **Given** embed mode, **When** `embed-iframe.ts` loads, **Then** isolated iframe hosts read-only Tiptap content.

---

### Edge Cases

- Headless variant: minimal chrome, contenteditable surface only.
- `debug=true` profile: verbose browser console via `logger.ts`.
- Missing JS assets: field degrades to plain textarea value.
- Multiple editors on one page: each instance scoped by field id.

---

## Requirements

### Bundle & DI

- **FR-BUNDLE-001**: `NowoTiptapEditorBundle` MUST register `TwigPathsPass` and alias `nowo_tiptap_editor`.
- **FR-DI-001**: `services.yaml` MUST wire `TiptapEditorType`, Twig extension, and profile parameters.
- **FR-CFG-001**: `Configuration` MUST define `default_profile` and `profiles` map with per-profile `toolbar`, `min_height`, `form_theme`, `debug`, `variant`, `theme`; MUST normalize legacy flat config into `profiles.default`; MUST accept legacy YAML keys `default_config` / `configs` via normalization.
- **FR-CFG-002**: Extension MUST validate `default_profile` exists in `profiles` and expose profiles to form type.
- **FR-TWIG-001**: `TwigPathsPass` MUST register `Resources/views` under `NowoTiptapEditorBundle`.

### Form & variants

- **FR-FORM-001**: `TiptapEditorType` MUST accept `config` option (profile name), merge profile defaults with field overrides, and expose view vars for JS initialization.
- **FR-VARIANT-001**: `EditorVariant` enum MUST list supported UX presets (`default`, `simple`, `notion`, `agent`, `headless`) validated in configuration.

### Twig extension

- **FR-TWIG-EXT-001**: `NowoTiptapEditorTwigExtension` MUST expose documented functions/filters for rendering Tiptap HTML and example snippets.

### Form themes

- **FR-THEME-001**: Base `tiptap_editor_theme.html.twig` MUST render editor widget blocks.
- **FR-THEME-002**: Framework variants (Bootstrap 3–5, Foundation 5/6, table, Tailwind 2, horizontal layouts) MUST adapt widget markup to each layout.

### Frontend

- **FR-UI-001**: `tiptap-editor.ts` MUST mount Tiptap on `[data-controller~="nowo-tiptap-editor"]`, honor profile JSON (toolbar, variant, theme, min_height), sync HTML to underlying textarea, and destroy on disconnect.
- **FR-UI-002**: `embed-iframe.ts` MUST initialize read-only embed surfaces in iframes when requested by markup.
- **FR-UI-003**: `logger.ts` MUST provide namespaced logging with test hooks.

### Supporting types & legacy

- **FR-EXAMPLE-001**: `TiptapExample` MUST supply static sample HTML/JSON for docs and Twig demos (not runtime-critical).
- **FR-LEGACY-001**: `Resources/public/tiptap-editor.js` MUST remain the installable built artifact for non-Vite consumers.
- **FR-I18N-001**: Translation catalogs (`de`, `en`, `es`, `fr`, `it`, `nl`, `pt`) MUST cover bundle UI strings.
- **FR-BUILD-001**: Vite MUST emit `tiptap-editor.js` from `Resources/assets/src/` before Packagist releases when sources change.

---

## Success Criteria

- **SC-001**: 31/31 production files mapped in [`code-inventory.md`](code-inventory.md) (`*.test.ts` excluded).
- **SC-002**: Profile keys in docs match `Configuration.php`.
- **SC-003**: `composer qa` and Vitest pass.
- **SC-004**: Demo forms persist HTML round-trip for each documented variant.

---

## Explicit non-goals

- Server-side HTML sanitization policy (host app responsibility unless documented elsewhere).
- Collaborative/real-time editing.
- File upload/image storage backend.

---

## Validation

| Check | Command |
| --- | --- |
| Full QA | `composer qa` |
| TS tests | `pnpm test` |
| Inventory | `find src -type f ! -name '*.test.ts' \| wc -l` |
