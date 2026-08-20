# Security Policy

## Table of contents

- [Security considerations for integrators](#security-considerations-for-integrators)
- [Bundle responsibility](#bundle-responsibility)
- [Supported versions](#supported-versions)
- [Reporting a vulnerability](#reporting-a-vulnerability)
- [Release security checklist (12.4.1)](#release-security-checklist-1241)

## Security considerations for integrators

- **HTML and XSS**: This bundle stores **HTML** produced by the Tiptap editor in a form field. The DI default leaves `html_sanitizer` unset (BC for trusted-editor apps). **Flex recipe `when@prod`** enables `html_sanitizer: allowlist` so production installs sanitize on submit by default.
- **HTML sanitizer**: Set `nowo_tiptap_editor.html_sanitizer` to `allowlist` (`AllowlistTiptapHtmlSanitizer`) or a service id implementing `TiptapHtmlSanitizerInterface`. When configured, `TiptapEditorType` applies a model transformer that sanitizes on submit (`reverseTransform`). Example:

  ```yaml
  # Flex recipe / config/packages/prod (also shipped as when@prod)
  when@prod:
      nowo_tiptap_editor:
          html_sanitizer: allowlist
  ```

  Leaving `html_sanitizer` unset/`null` (typical in `dev`/`test`) keeps previous behaviour. Do **not** disable the prod recipe allowlist for untrusted editors. The built-in allowlist keeps common block/inline tags (`p`, headings `h1`–`h6`, lists, tables, `figure`/`figcaption`, `sub`/`sup`/`mark`, YouTube/Vimeo `iframe`) and strips scripts, event handlers, and unknown tags. Client-side filtering alone is not sufficient for UGC.
- **Script tags**: The widget injects a single script (`tiptap-editor.js`) from your published assets. Load it only from trusted sources and use standard Symfony `assets:install` / AssetMapper hygiene.
- **Admin-only fields**: If only trusted staff edit rich text, you may keep sanitizer off in non-prod; still validate output for your threat model.
- **AI security audit (REQ-SEC-004)**: **Pass (good)** — overall **Low** (re-audit **2026-08-20**). Residual: host must keep Flex `when@prod` allowlist (or equivalent) when rendering UGC; upload/file endpoints remain app-owned.

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
| **HTML / XSS** | Flex `when@prod` sets `html_sanitizer: allowlist`; DI default remains null for BC in non-prod. |
| **Input / output** | Form options validated; user HTML is not executed server-side by the bundle. |
| **Dependencies** | `composer audit` run; issues triaged. |
| **Logging** | Logs do not print secrets or session identifiers unnecessarily. |
| **Assets** | Built `tiptap-editor.js` is reproducible from source (`pnpm run build`); no minified-only mystery blobs without source. |

Record confirmation in the release PR or tag notes.
