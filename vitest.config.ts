import { defineConfig } from 'vitest/config';

/**
 * Vitest: happy-dom, coverage over every shipped TS module (REQ-TEST-003).
 *
 * - `logger.ts`, `embed-iframe.ts`, `upload.ts`, `suggestion.ts`, `toolbar-icons.ts`: 100% gate.
 * - `tiptap-editor.ts` (widget bootstrap): per-file gate at its measured floor. The only uncovered lines are
 *   defensive `default:` arms of exhaustive switches (variant / example / static menu actions) and the build-time
 *   constant fallback; see README "Tests and coverage".
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    // Editors render <iframe> embeds: never load remote pages from tests.
    environmentOptions: { happyDOM: { settings: { disableIframePageLoading: true, handleDisabledFileLoadingAsSuccess: true } } },
    globals: true,
    include: ['src/Resources/assets/**/*.test.ts'],
    server: {
      deps: {
        // tippy.js ships CJS as `main`; inline the menu extensions so their default import resolves like in the Vite build.
        inline: [/@tiptap\/extension-(bubble|floating)-menu/, /tippy\.js/],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      reportsDirectory: './coverage-ts',
      include: ['src/Resources/assets/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/node_modules/**'],
      thresholds: {
        // Global gate over all modules (REQ-TEST-003 asks >= 90% lines; the bundle keeps the measured floor).
        lines: 99,
        functions: 100,
        branches: 97,
        statements: 99,
        'src/Resources/assets/src/{logger,embed-iframe,upload,suggestion,toolbar-icons}.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'src/Resources/assets/src/tiptap-editor.ts': {
          lines: 98,
          functions: 100,
          branches: 96,
          statements: 98,
        },
      },
    },
  },
});
