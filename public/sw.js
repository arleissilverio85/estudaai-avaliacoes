const CACHE_NAME = 'estudaai-cache-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
]

// Instalação do Service Worker e cache de assets iniciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Falha parcial ao pré-armazenar assets:', err)
      })
    })
  )
  self.skipWaiting()
})

// Ativação e limpeza de caches obsoletos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Estratégia de requisições:
// - Server Actions (POST), APIs e Auth sempre vão direto à rede
// - Static assets (CSS, JS, Fonts, Imagens) usam Stale-While-Revalidate
// - Páginas HTML usam Network-First com fallback para cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requisições não-GET (Server Actions, POST/PUT/DELETE) e requisições externas/Supabase
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return
  }

  // Assets estáticos do Next.js
  if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(png|svg|jpg|jpeg|webp|ico|woff2|css|js)$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request)
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone())
          }
          return networkResponse
        }).catch(() => cachedResponse)

        return cachedResponse || fetchPromise
      })
    )
    return
  }

  // Navegações e páginas HTML: Network First com fallback para cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME)
            cache.put(request, response.clone())
          }
          return response
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          const rootCached = await caches.match('/')
          return rootCached || new Response('Offline', { status: 503, statusText: 'Offline' })
        })
    )
  }
})
