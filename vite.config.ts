import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' rather than 'autoUpdate': swapping the app out from under
      // someone mid-scroll is worse than showing them a reload button.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Kayv Go - travel, food and campsites',
        short_name: 'Kayv Go',
        description:
          'Travel stories, restaurant reviews and campsite finds from the road.',
        theme_color: '#059669',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/index.html',
        // Never serve a cached shell for the auth callback.
        navigateFallbackDenylist: [/^\/auth\//],
        runtimeCaching: [
          {
            // Post photos are immutable once uploaded (each gets a fresh uuid),
            // so cache-first is safe and makes revisits instant.
            urlPattern: /\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kayv-post-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Feed reads: fresh when online, last-known when not.
            // Auth endpoints (/auth/v1/*) are deliberately absent - tokens must
            // never be served from a cache.
            urlPattern: /\/rest\/v1\/posts.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'kayv-posts',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
