import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/patrimoine-phones/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      devOptions: {
        enabled: true,
      },
      manifest: {
        id: '/patrimoine-phones/',
        name: 'Patrimoine Phones',
        short_name: 'Patrimoine',
        description:
          "Suivi du patrimoine, des bénéfices et du stock pour une activité de revente et réparation de téléphones.",
        lang: 'fr',
        start_url: '/patrimoine-phones/',
        scope: '/patrimoine-phones/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
