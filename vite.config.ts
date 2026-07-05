/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'History Heroes — Memory Match',
        short_name: 'History Heroes',
        description: 'An educational memory match game where kids unlock historical heroes.',
        theme_color: '#4c1d95',
        background_color: '#4c1d95',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // bundled Hebrew TTS model + any future local models
            urlPattern: /\/models\//,
            handler: 'CacheFirst',
            options: { cacheName: 'tts-models', expiration: { maxEntries: 20 } },
          },
          {
            // Kokoro English TTS model downloaded from the HF hub on first use
            urlPattern: /^https:\/\/(huggingface\.co|cdn-lfs.*\.(hf|huggingface)\.co)\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'tts-models-remote', expiration: { maxEntries: 30 } },
          },
        ],
      },
    }),
  ],
  // onnxruntime-web (used by the on-device TTS) ships workers/wasm that break
  // under Vite's dep pre-bundling — load these packages as-is instead
  optimizeDeps: {
    exclude: ['kokoro-js', '@huggingface/transformers', 'onnxruntime-web'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    css: false,
  },
});
