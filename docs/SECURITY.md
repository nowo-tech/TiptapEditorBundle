# Security Policy

## Table of contents

- [Security considerations for integrators](#security-considerations-for-integrators)
- [Bundle responsibility](#bundle-responsibility)
- [Supported versions](#supported-versions)
- [Reporting a vulnerability](#reporting-a-vulnerability)
- [Release security checklist (12.4.1)](#release-security-checklist-1241)

## Security considerations for integrators

- **HTML and XSS**: This bundle stores **HTML** produced by the Tiptap editor in a form field. By default the bundle does **not** sanitize HTML (BC). For user-generated content you should enable the optional server-side sanitizer (or sanitize in your app before persist/render).
- **Optional HTML sanitizer (opt-in)**: Set `nowo_tiptap_editor.html_sanitizer` to `allowlist` to use the built-in allowlist sanitizer (`AllowlistTiptapHtmlSanitizer`), or to a service id implementing `TiptapHtmlSanitizerInterface`. When configured, `TiptapEditorType` applies a model transformer that sanitizes on submit (`reverseTransform`). Example:

  ```yaml
  # config/packages/nowo_tiptap_editor.yaml
  nowo_tiptap_editor:
      html_sanitizer: allowlist
      # or: html_sanitizer: App\Security\MyHtmlSanitizer
  ```

  Leaving `html_sanitizer` unset/`null` keeps previous behaviour (no server-side sanitization). Client-side filtering alone is not sufficient for UGC.
- **Script tags**: The widget injects a single script (`tiptap-editor.js`) from your published assets. Load it only from trusted sources and use standard Symfony `assets:install` / AssetMapper hygiene.
- **Admin-only fields**: If only trusted staff edit rich text, document that policy and still validate output in line with your threat model.

## Bundle responsibility

The bundle provides a Symfony form type, Twig themes, and a static JS bundle. It does not execute persisted HTML on the server beyond normal form handling.

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do not** open a public GitHub issue for security-sensitive bugs.
2. Send details to **[hectorfranco@nowo.tech](mailto:hectorfranco@nowo.tech)** (or the maintainers listed in [`composer.json`](../composer.json)).
3. Include a clear description, steps to reproduce, and impact if possible.
4. We will acknowledge receipt and work on a fix. We may ask for more information.
5. After a fix is released, we can coordinate on disclosure (e.g. a security advisory).

We appreciate responsible disclosure so users can update before details are public.

## Release security checklist (12.4.1)

Before tagging a release, confirm:

| Item | Notes |
|------|--------|
| **SECURITY.md** | This document is current and linked from the README where applicable. |
| **`.gitignore` and `.env`** | `.env` and local env files are ignored; no committed secrets. |
| **No secrets in repo** | No API keys, passwords, or tokens in tracked files. |
| **HTML / XSS** | Opt-in `html_sanitizer` documented; default remains off (BC); integrators must enable for UGC. |
| **Input / output** | Form options validated; user HTML is not executed server-side by the bundle. |
| **Dependencies** | `composer audit` run; issues triaged. |
| **Logging** | Logs do not print secrets or session identifiers unnecessarily. |
| **Assets** | Built `tiptap-editor.js` is reproducible from source (`pnpm run build`); no minified-only mystery blobs without source. |

Record confirmation in the release PR or tag notes.
