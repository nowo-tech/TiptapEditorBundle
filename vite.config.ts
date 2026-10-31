import { createHash } from 'node:crypto';
import { copyFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { defineConfig } from 'vite';

/**
 * Deterministic build id: a hash of the TypeScript/CSS sources and pnpm-lock.yaml. It only changes when the code or
 * the dependencies change, so rebuilding unchanged sources (e.g. in `make release-check`) leaves the committed bundle
 * byte-identical (the former wall-clock stamp rewrote it on every build).
 */
function sourceBuildId(dir: string): string {
  const root = new URL(`${dir}/`, import.meta.url);
  const hash = createHash('sha256');
  const files = (readdirSync(root, { recursive: true }) as string[])
    .filter((file) => !file.includes('.test.') && statSync(new URL(file, root)).isFile())
    .sort();
  for (const file of files) {
    hash.update(file).update(readFileSync(new URL(file, root)));
  }
  hash.update(readFileSync(new URL('pnpm-lock.yaml', import.meta.url)));

  return hash.digest('hex').slice(0, 12);
}

/**
 * Vite IIFE build for the Tiptap form widget. Output: `src/Resources/public/tiptap-editor.js` for `assets:install`, and
 * (1.7) the widget stylesheet `src/Resources/assets/src/tiptap-editor.css` copied as is to
 * `src/Resources/public/tiptap-editor.css` (linked by the form theme; not bundled into the script).
 */
export default defineConfig({
  plugins: [
    {
      name: 'nowo-tiptap-editor-stylesheet',
      closeBundle(): void {
        copyFileSync(
          new URL('src/Resources/assets/src/tiptap-editor.css', import.meta.url),
          new URL('src/Resources/public/tiptap-editor.css', import.meta.url),
        );
      },
    },
  ],
  define: {
    __TIPTAP_EDITOR_BUILD_TIME__: JSON.stringify(sourceBuildId('src/Resources/assets/src')),
  },
  build: {
    outDir: 'src/Resources/public',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/Resources/assets/src/tiptap-editor.ts',
      output: {
        format: 'iife',
        entryFileNames: 'tiptap-editor.js',
        assetFileNames: 'tiptap-editor.[ext]',
      },
    },
    minify: true,
    sourcemap: false,
  },
});
