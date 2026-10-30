# Security Policy

## Table of contents

- [Scope](#scope)
- [Attack surface](#attack-surface)
- [Threat model and mitigations](#threat-model-and-mitigations)
- [Secrets and cryptography](#secrets-and-cryptography)
- [Logging](#logging)
- [Permissions and exposure](#permissions-and-exposure)
- [Dependencies and updates](#dependencies-and-updates)
- [Security considerations for integrators](#security-considerations-for-integrators)
- [Bundle responsibility](#bundle-responsibility)
- [Supported versions](#supported-versions)
- [Reporting a vulnerability](#reporting-a-vulnerability)
- [Release security checklist (12.4.1)](#release-security-checklist-1241)

## Scope

**Covered:** the `TiptapEditorType` form field (Symfony `TextareaType` child), its Twig form themes, the optional
server-side HTML sanitizer (`html_sanitizer`: `AllowlistTiptapHtmlSanitizer` or a host service) and the browser bundle
`tiptap-editor.js` (editor, toolbar / menus, embed prompt, 1.6 upload and suggestion hooks).

**Not covered (host-owned):** controllers and routes (the bundle ships none), the upload and suggestion endpoints, the
storage and rendering of the saved HTML (Twig `|raw`, e-mails, exports), form CSRF protection, authentication and
authorization, Content-Security-Policy headers.

## Attack surface

| Input | Source | Where it is handled |
| ----- | ------ | ------------------- |
| Submitted field value (HTML string) | Any user who can submit the host form | `TiptapHtmlSanitizeTransformer::reverseTransform()` (when `html_sanitizer` is set), then the host |
| Initial field value (stored HTML) | Host database | Parsed by Tiptap/ProseMirror into its schema in the browser; unknown nodes/attributes are dropped |
| Field options (`config`, `toolbar`, `variant`, `theme`, `placeholder`, `upload_url`, `upload_csrf_token`, `suggestions`, …) | Host code | `OptionsResolver` types / allowed values; rendered as escaped `data-*` attributes by the form theme |
| Bundle configuration (`nowo_tiptap_editor.*`) | Host config | Typed config tree; unknown `default_profile` fails at compile time |
| Toolbar prompts (link, image, embed URL) | Editing user | `window.prompt`; embed URLs pass `safeEmbedSrc()` (https only, no credentials, optional host allow-list) |
| Dropped / pasted files (1.6 upload hook) | Editing user | `POST upload_url` (multipart `file`, `X-CSRF-Token` header, `credentials: same-origin`); response JSON `{url, name, image}` |
| Suggestion queries (1.6 suggestion hook) | Editing user | `GET <url>?q=<query>` (`encodeURIComponent`, `credentials: same-origin`); candidates rendered with `textContent`, tokens inserted as plain text |

The bundle exposes **no HTTP endpoint, console command, message handler or outgoing server-side request**.

## Threat model and mitigations

| Threat | Risk | Mitigation in the bundle | Host responsibility |
| ------ | ---- | ------------------------ | ------------------- |
| **Stored XSS** through the HTML field (`<script>`, `on*` handlers, `javascript:` URLs, `srcdoc`, CSS) | High for UGC | `html_sanitizer: allowlist` (Flex recipe `when@prod`) uses `symfony/html-sanitizer`: per-element attribute allow-list, http/https/mailto links, http/https images, `style` only as `text-align`, scripts and unknown elements removed | Keep the sanitizer on wherever untrusted users edit; render saved HTML only after sanitizing; add a CSP |
| **Malicious iframe embeds** (phishing, clickjacking, credential URLs) | Medium | Client `safeEmbedSrc()` and server `EmbedIframeSrcAttributeSanitizer`: `https` only, no user/password, host allow-list (YouTube, youtube-nocookie, Vimeo by default); iframes without a valid `src` are removed | Narrow the host list when needed |
| **DOM XSS in the widget** | Low | No `eval`; `innerHTML` is only assigned static markup; embeds are inserted as editor nodes, never as HTML strings; suggestion labels / hints and upload messages use `textContent` | — |
| **CSRF** on form submit / upload | Medium | Upload requests send the host-provided `upload_csrf_token` as `X-CSRF-Token` and only same-origin credentials | Keep Symfony form CSRF on; validate the upload token and authorize the upload in the endpoint |
| **Malicious upload answers** (`url` / `name`) | Medium | Inserted through the editor API (image `src` / link `href` / text), then re-sanitized on save when the sanitizer is on | Return URLs the endpoint built itself and a sanitized name; validate MIME type and size server-side |
| **Data disclosure via suggestions** | Medium | Queries are URL-encoded and sent same-origin only | Return only candidates the current user may see |
| **SSRF / injection / deserialization / path traversal** | n/a | The bundle performs no server-side requests, no shell, no `unserialize`, no file-system access from user input | — |
| **Denial of service** (very large HTML) | Low | Sanitizer runs once per submit | Enforce request size / field length limits |

## Secrets and cryptography

The bundle uses no cryptography and stores no secrets. The upload CSRF token is generated by the host
(`CsrfTokenManagerInterface`) and only rendered in the field's `data-*` attributes; never hard-code it. Tests and
fixtures use obvious placeholders only.

## Logging

The PHP side does not log. The browser bundle logs to the console only when the profile option `debug: true` is set
(script-loaded banner, warnings such as a rejected embed URL); it never logs field contents, upload tokens or responses.
Keep `debug` off in production.

## Permissions and exposure

Nothing is exposed by the bundle itself: no routes, no controllers, no public services beyond the form type and the
sanitizer. Who can edit a field is decided by the host form / controller; who can upload or query suggestions is
decided by the host endpoints configured in `upload_url` / `suggestions`.

## Dependencies and updates

- PHP: runtime dependencies are Symfony components (`form`, `framework-bundle`, `html-sanitizer`, `twig-bundle`, …) and `twig/extra-bundle`.
  `composer audit` runs before every release (see the checklist below); Dependabot (`composer`, `github-actions`)
  proposes weekly updates, and security advisories are released as patch versions.
- JavaScript: Tiptap and its extensions are bundled into `tiptap-editor.js` from `pnpm-lock.yaml` (the only lockfile).
  Run `pnpm audit` when updating, rebuild the asset (`make assets`) and ship it in the same release.
- Report vulnerabilities privately (see below); fixes are published with a GitHub security advisory.

## Security considerations for integrators

- **HTML and XSS**: This bundle stores **HTML** produced by the Tiptap editor in a form field. The DI default leaves `html_sanitizer` unset (BC for trusted-editor apps). **Flex recipe `when@prod`** enables `html_sanitizer: allowlist` so production installs sanitize on submit by default.
- **HTML sanitizer**: Set `nowo_tiptap_editor.html_sanitizer` to `allowlist` (`AllowlistTiptapHtmlSanitizer`) or a service id implementing `TiptapHtmlSanitizerInterface`. When configured, `TiptapEditorType` applies a model transformer that sanitizes on submit (`reverseTransform`). Example:

  ```yaml
  # Flex recipe / config/packages/prod (also shipped as when@prod)
  when@prod:
      nowo_tiptap_editor:
          html_sanitizer: allowlist
  ```

  Leaving `html_sanitizer` unset/`null` (typical in `dev`/`test`) keeps previous behaviour. Do **not** disable the prod recipe allowlist for untrusted editors. The built-in allowlist (built on `symfony/html-sanitizer`, DOM-based) keeps common block/inline tags (`p`, headings `h1`–`h6`, lists, tables, `figure`/`figcaption`, `sub`/`sup`/`mark`, `iframe`) with a per-element attribute allowlist: event handlers (`on*`), `srcdoc` and any other unlisted attribute are removed, `style` is kept only as a plain `text-align: left|center|right|justify`, link URLs must be http/https/mailto (or relative), image URLs http/https (or relative), and iframes are kept only with an `https` `src` on the embed host allowlist (default `AllowlistTiptapHtmlSanitizer::DEFAULT_EMBED_HOSTS`: YouTube, youtube-nocookie, Vimeo; pass a custom list to the constructor and register it as your `html_sanitizer` service id to change it). Scripts and unknown elements are removed. Client-side filtering alone is not sufficient for UGC.
- **Editor embeds**: the embed iframe node accepts only absolute `https:` URLs without credentials (on parse, render and in the URL prompt) and inserts nodes through the editor API, never by concatenating HTML.
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
