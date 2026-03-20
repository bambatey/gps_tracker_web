// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  nitro: {
    prerender: {
      crawlLinks: false
    }
  },
  vite: {
    optimizeDeps: {
      include: [
        'leaflet',
        'axios',
        '@vue/devtools-core',
        '@vue/devtools-kit'
      ]
    }
  }
})
