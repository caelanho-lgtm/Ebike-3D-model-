import { defineConfig } from 'vite';

// Build a single self-contained IIFE bundle that any website can <script>-embed.
export default defineConfig({
  build: {
    target: 'es2018',
    lib: {
      entry: 'src/index.ts',
      name: 'FitWerxWidget',
      formats: ['iife'],
      fileName: () => 'fitwerx-widget.js',
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
  server: { port: 5174, proxy: { '/v1': 'http://localhost:4000' } },
});
