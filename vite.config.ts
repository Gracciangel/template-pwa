import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages sirve el sitio en /template-pwa/. Netlify lo sirve en la raíz
// (PUBLIC_BASE="/" en netlify.toml). En desarrollo servimos en la raíz para
// poder abrir http://localhost:5173/ sin la subruta.
export default defineConfig(({ command, isPreview }) => {
  const esDev = command === 'serve' && !isPreview
  const base = process.env.PUBLIC_BASE ?? (esDev ? '/' : '/template-pwa/')

  return {
    base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'fonts/*.ttf', 'img/icon.png'],
      manifest: {
        name: 'Tiempo de Gracia',
        short_name: 'TDG',
        description: 'Tiempo de Gracia — comunidad, eventos, música y Biblia.',
        lang: 'es',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        categories: ['lifestyle', 'education'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,ttf}'],
        importScripts: ['push-handlers.js'],
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
    {
      // GitHub Pages no reescribe rutas SPA: copiamos index.html a 404.html
      // para que un reload en /groups (etc.) siga cargando la app.
      name: 'github-pages-404',
      closeBundle() {
        const index = resolve('dist/index.html')
        if (existsSync(index)) copyFileSync(index, resolve('dist/404.html'))
      },
    },
    ],
  }
})