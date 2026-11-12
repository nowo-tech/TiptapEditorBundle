# FrankenPHP worker mode audit (kernel not reset between requests)

| Field | Value |
|-------|-------|
| Package | `nowo-tech/tiptap-editor-bundle` (`symfony-bundle`) |
| Audited revision | `v1.7.0` (kept-alive test and rule-7 note added 2026-11-12; earlier manual review kept below) |
| Audit date | 2026-11-12 (first audit 2026-09) |
| Method | Manual review of every file under `src/` (form type, data transformer, sanitizer, Twig extension, enums, DI extension, compiler pass, `Resources/config/services.yaml`) plus PHPUnit `FrankenPhpWorkerSafetyTest` |
| **Verdict** | ✅ **Compatible (100%)** — safe under FrankenPHP worker mode **with or without** kernel reset; shared services only hold compiled / readonly configuration |

## Table of contents

- [Execution model assumed](#execution-model-assumed)
- [Summary](#summary)
- [Services reviewed](#services-reviewed)
- [Findings](#findings)
- [Kept-alive test (REQ-RUNTIME-002)](#kept-alive-test-req-runtime-002)
- [Usage recommendations in worker mode](#usage-recommendations-in-worker-mode)
- [Re-audit triggers](#re-audit-triggers)

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

## Kept-alive test (REQ-RUNTIME-002)

Test: `Nowo\TiptapEditorBundle\Tests\Integration\Worker\WorkerKeptAliveKernelTest` (`tests/Integration/Worker/WorkerKeptAliveKernelTest.php`). It uses one booted production-like kernel (`WorkerKeptAliveKernel`, debug off: with debug on Symfony itself retains about 25 KB per rendered form, also for core fields, a development-only cost with a host route that builds, submits and renders a form with the Tiptap field), driven through `http_kernel` `handle()` + `terminate()` for two users that each have their own locale, upload URL and CSRF token option, and body (a host-like `trans` filter stands in for the translator, because the dev lock has no `symfony/translation`). `services_resetter` / `kernel.reset` is **never** called. It runs 1,200 iterations alternating the two inputs, asserts every response carries its own upload URL, upload token, translated labels and body (nothing of the other user appears, the translated label never changes for a given locale), and that memory growth after a 100-iteration warm-up stays below 4 MiB.

| Service | State kept between requests | Reset mechanism |
|---------|-----------------------------|-----------------|
| `Form\TiptapEditorType` | none (`readonly` profiles and flags; upload hooks are per-field options) | none needed |
| `Security\AllowlistTiptapHtmlSanitizer` | none | none needed |
| `Twig\NowoTiptapEditorTwigExtension` | none | none needed |

Result: no request data is carried between requests, so the bundle is **safe with kernel reset false**.

Rule 7: the bundle never clears or resets the host's default EntityManager (it uses no persistence).

## Usage recommendations in worker mode

- No special configuration or reset hook is needed for this bundle.
- A custom sanitizer set through `nowo_tiptap_editor.html_sanitizer: <service id>` is shared by every request in the worker. It must stay **stateless**, or implement `ResetInterface` if it keeps per-request data. If it wraps a library with its own cache (for example HTMLPurifier’s definition cache), use a file or shared cache, not an in-memory cache that grows per request.
- The demo (`demo/symfony8`) defaults to worker mode (`FRANKENPHP_MODE=worker`, `docker/frankenphp/Caddyfile` has a `worker` block). Use `FRANKENPHP_MODE=classic` for per-request PHP when iterating on Twig/PHP without restarting workers.

## Re-audit triggers

Re-run this audit when a change adds: properties to `TiptapEditorType`, the sanitizer or the Twig extension, a sanitizer based on a third-party library with static configuration, server-side image upload or embed handling, event subscribers, or any use of `$_SERVER` / `$_ENV` at runtime.
