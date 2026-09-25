# FrankenPHP worker mode audit (kernel not reset between requests)

| Field | Value |
|-------|-------|
| Package | `nowo-tech/tiptap-editor-bundle` (`symfony-bundle`) |
| Audited revision | `v1.3.8` (release of this document) |
| Audit date | 2026-09-25 |
| Method | Manual review of every file under `src/` (form type, data transformer, sanitizer, Twig extension, enums, DI extension, compiler pass, `Resources/config/services.yaml`) plus PHPUnit `FrankenPhpWorkerSafetyTest` |
| **Verdict** | ✅ **Compatible (100%)** — safe under FrankenPHP worker mode **with or without** kernel reset; shared services only hold compiled / readonly configuration |

## Execution model assumed

FrankenPHP worker mode boots the Symfony kernel once per worker and serves many requests with the same container. This audit assumes the **strict** variant: the kernel is **not** rebooted between requests, so every shared service, static property and PHP global survives from one request to the next. Two scenarios are evaluated:

- **A — kernel not rebooted, `services_resetter` still runs:** services tagged `kernel.reset` (or implementing `ResetInterface`) are reset between requests.
- **B — no reset at all:** nothing is reset; any per-request state kept in a service leaks into the next request.

A bundle that is safe under **B** is safe under **A** and under classic mode / PHP-FPM.

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Mutable state in shared services | ✅ | `TiptapEditorType` has only `readonly` config; sanitizer and Twig extension have no instance properties |
| Static properties / `static` locals | ✅ | None on shared services; only class constants, enum helpers and static closures |
| `ResetInterface` / `kernel.reset` coverage | ✅ N/A | Nothing to reset |
| Request / user / locale captured in services | ✅ | None; form options and view vars are computed per form build |
| Superglobals, `$_ENV`, `putenv`, `ini_set`, `setlocale`, timezone | ✅ | None used; config is compiled into container parameters |
| Doctrine / EntityManager | ✅ N/A | No persistence |
| Output, headers, `exit`, shutdown functions | ✅ | None |
| Resources (files, sockets, cURL) held open | ✅ | None |
| Memory growth across requests | ✅ | No caches or accumulating arrays |
| Blocking I/O and timeouts | ✅ N/A | No I/O at runtime (only regex / `strip_tags` in the sanitizer) |
| Third-party static state | ✅ | Only Symfony Form / Twig / DI; no third-party HTML library |
| PHPStan FrankenPHP rulesets | ✅ | `ruleset-classic.neon` + `ruleset-worker.neon` included in `phpstan.neon.dist` |
| Automated guard | ✅ | `tests/Unit/FrankenPhpWorkerSafetyTest.php` asserts shared service classes have no static / non-readonly properties |

## Services reviewed

| Service | Shared | Mutable state | Scenario A | Scenario B |
|---------|--------|---------------|------------|------------|
| `Nowo\TiptapEditorBundle\Form\TiptapEditorType` | yes (`form.type`) | none (`readonly` profiles, default profile name, optional sanitizer) | ✅ | ✅ |
| `Nowo\TiptapEditorBundle\Security\AllowlistTiptapHtmlSanitizer` | yes (when `html_sanitizer: allowlist`) | none (class constants only) | ✅ | ✅ |
| `Nowo\TiptapEditorBundle\Twig\NowoTiptapEditorTwigExtension` | yes (`twig.extension`) | none; `assetPath()` is a pure function | ✅ | ✅ |

`TiptapHtmlSanitizeTransformer` is created with `new` per form build (`TiptapEditorType::buildForm`) and only holds the sanitizer. `EditorVariant` and `TiptapExample` are backed enums. `NowoTiptapEditorExtension` and `TwigPathsPass` run only at container compile time.

Frontend (`tiptap-editor.js`) runs in the browser; `WeakMap` editor mounts are per page load and are out of scope for PHP worker kernel lifetime.

## Findings

No findings. Nothing in the bundle keeps PHP state between requests:

- `TiptapEditorType::buildView()` writes only into the current `FormView`.
- Option closures in `configureOptions()` read the immutable `$profiles` array; they do not store resolved options on the type.
- `AllowlistTiptapHtmlSanitizer::sanitize()` works only on its argument.

## Usage recommendations in worker mode

- No special configuration or reset hook is needed for this bundle.
- A custom sanitizer set through `nowo_tiptap_editor.html_sanitizer: <service id>` is shared by every request in the worker. It must stay **stateless**, or implement `ResetInterface` if it keeps per-request data. If it wraps a library with its own cache (for example HTMLPurifier’s definition cache), use a file or shared cache, not an in-memory cache that grows per request.
- The demo (`demo/symfony8`) defaults to worker mode (`FRANKENPHP_MODE=worker`, `docker/frankenphp/Caddyfile` has a `worker` block). Use `FRANKENPHP_MODE=classic` for per-request PHP when iterating on Twig/PHP without restarting workers.

## Re-audit triggers

Re-run this audit when a change adds: properties to `TiptapEditorType`, the sanitizer or the Twig extension, a sanitizer based on a third-party library with static configuration, server-side image upload or embed handling, event subscribers, or any use of `$_SERVER` / `$_ENV` at runtime.
