# Code inventory — 100% traceability

**Baseline spec**: [`spec.md`](spec.md)  
**Package**: `nowo-tech/tiptap-editor-bundle`  
**Last audited**: 2026-07-07

Production scope excludes Vitest sources (`*.test.ts`).

## PHP classes (`src/**/*.php`)

| Source file | Spec section | Requirement IDs |
| --- | --- | --- |
| `NowoTiptapEditorBundle.php` | Bundle entry | FR-BUNDLE-001 |
| `DependencyInjection/Configuration.php` | Config tree | FR-CFG-001 |
| `DependencyInjection/NowoTiptapEditorExtension.php` | DI extension | FR-CFG-002 |
| `DependencyInjection/Compiler/TwigPathsPass.php` | Twig namespace | FR-TWIG-001 |
| `EditorVariant.php` | UX presets enum | FR-VARIANT-001 |
| `Form/TiptapEditorType.php` | Rich text form type | FR-FORM-001 |
| `TiptapExample.php` | Doc/demo samples | FR-EXAMPLE-001 |
| `Twig/NowoTiptapEditorTwigExtension.php` | Twig helpers | FR-TWIG-EXT-001 |

## TypeScript production (`src/Resources/assets/src/`)

| Source file | Spec section | Requirement IDs |
| --- | --- | --- |
| `tiptap-editor.ts` | Editor widget | FR-UI-001 |
| `embed-iframe.ts` | Read-only embed | FR-UI-002 |
| `logger.ts` | Debug logging | FR-UI-003 |

## Legacy JavaScript (`src/Resources/public/`)

| Source file | Spec section | Requirement IDs |
| --- | --- | --- |
| `tiptap-editor.js` | Built IIFE bundle | FR-LEGACY-001, FR-BUILD-001 |

## Symfony config

| Source file | Spec section | Requirement IDs |
| --- | --- | --- |
| `Resources/config/services.yaml` | Service wiring | FR-DI-001 |

## Twig form themes

| Source file | Spec section | Requirement IDs |
| --- | --- | --- |
| `Resources/views/Form/tiptap_editor_theme.html.twig` | Base theme | FR-THEME-001 |
| `Resources/views/Form/tiptap_editor_theme_bootstrap3.html.twig` | Bootstrap 3 | FR-THEME-002 |
| `Resources/views/Form/tiptap_editor_theme_bootstrap3_horizontal.html.twig` | Bootstrap 3 horizontal | FR-THEME-002 |
| `Resources/views/Form/tiptap_editor_theme_bootstrap4.html.twig` | Bootstrap 4 | FR-THEME-002 |
| `Resources/views/Form/tiptap_editor_theme_bootstrap4_horizontal.html.twig` | Bootstrap 4 horizontal | FR-THEME-002 |
| `Resources/views/Form/tiptap_editor_theme_bootstrap5.html.twig` | Bootstrap 5 | FR-THEME-002 |
| `Resources/views/Form/tiptap_editor_theme_bootstrap5_horizontal.html.twig` | Bootstrap 5 horizontal | FR-THEME-002 |
| `Resources/views/Form/tiptap_editor_theme_foundation5.html.twig` | Foundation 5 | FR-THEME-002 |
| `Resources/views/Form/tiptap_editor_theme_foundation6.html.twig` | Foundation 6 | FR-THEME-002 |
| `Resources/views/Form/tiptap_editor_theme_table.html.twig` | Table layout | FR-THEME-002 |
| `Resources/views/Form/tiptap_editor_theme_tailwind2.html.twig` | Tailwind 2 | FR-THEME-002 |

## Translations

| Source file | Spec section | Requirement IDs |
| --- | --- | --- |
| `Resources/translations/NowoTiptapEditorBundle.de.yaml` | German | FR-I18N-001 |
| `Resources/translations/NowoTiptapEditorBundle.en.yaml` | English | FR-I18N-001 |
| `Resources/translations/NowoTiptapEditorBundle.es.yaml` | Spanish | FR-I18N-001 |
| `Resources/translations/NowoTiptapEditorBundle.fr.yaml` | French | FR-I18N-001 |
| `Resources/translations/NowoTiptapEditorBundle.it.yaml` | Italian | FR-I18N-001 |
| `Resources/translations/NowoTiptapEditorBundle.nl.yaml` | Dutch | FR-I18N-001 |
| `Resources/translations/NowoTiptapEditorBundle.pt.yaml` | Portuguese | FR-I18N-001 |

## Coverage summary

| Category | Files | Mapped |
| --- | ---: | ---: |
| PHP classes | 8 | 8 |
| TS production | 3 | 3 |
| Legacy JS | 1 | 1 |
| YAML config | 1 | 1 |
| Twig themes | 11 | 11 |
| Translations | 7 | 7 |
| **Total production sources** | **31** | **31** |

Excluded: `logger.test.ts`, `tiptap-editor.lifecycle.test.ts`.
