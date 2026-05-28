import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/* When deployed to https://<user>.github.io/countdown/, set base accordingly.
   For local dev (`npm run dev`) and root-domain deploys, base stays "/". */

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const BASE = env.VITE_BASE ?? '/'

  return {
    base: BASE,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'CountDown',
          short_name: 'CountDown',
          description: 'Editorial countdown for the deadlines you don\'t want to miss.',
          theme_color: '#FAFAFA',
          background_color: '#FAFAFA',
          display: 'standalone',
          start_url: BASE,
          scope: BASE,
          icons: [
            { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: BASE + 'index.html',
          navigateFallbackDenylist: [/^\/api/],
        },
        devOptions: { enabled: false },
      }),
    ],
    server: { port: 5173, host: true },
  }
})


