import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Generates PWA raster icons from favicon.svg at build time using sharp.
 * Outputs to public/icons/ so they are served by the dev server and copied
 * into dist/ by Vite's static asset pipeline.
 */
function generatePwaIcons(): Plugin {
  return {
    name: 'generate-pwa-icons',
    async buildStart() {
      try {
        const { default: sharp } = await import('sharp') as { default: typeof import('sharp') }
        const svgPath = resolve(__dirname, 'public/favicon.svg')
        const iconsDir = resolve(__dirname, 'public/icons')
        if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true })
        const svg = readFileSync(svgPath)
        await Promise.all([
          sharp(svg).resize(192, 192).png().toFile(resolve(iconsDir, 'icon-192.png')),
          sharp(svg).resize(512, 512).png().toFile(resolve(iconsDir, 'icon-512.png')),
        ])
        console.info('[pwa-icons] Generated icon-192.png and icon-512.png')
      } catch (err) {
        console.warn('[pwa-icons] Icon generation skipped:', (err as Error).message)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    generatePwaIcons(),
    VitePWA({
      registerType: 'autoUpdate',
      // Inject the SW registration script automatically — no manual import needed
      injectRegister: 'auto',
      // We manage our own manifest.json in public/ — plugin handles SW only
      manifest: false,
      workbox: {
        // Precache all JS, CSS, HTML, fonts, images, and the manifest
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        // Exclude source maps from the SW cache (they are large, devs only)
        globIgnores: ['**/*.map'],
        runtimeCaching: [
          // Cache the self-hosted Geist font with a long TTL (1 year)
          {
            urlPattern: /\/fonts\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'heiyo-fonts',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
