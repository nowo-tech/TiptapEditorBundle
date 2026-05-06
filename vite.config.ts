import { defineConfig } from 'vite';

/**
 * Vite IIFE build for the Tiptap form widget. Output: `src/Resources/public/tiptap-editor.js` for `assets:install`.
 */
export default defineConfig({
  define: {
    __TIPTAP_EDITOR_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
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
