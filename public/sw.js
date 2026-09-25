// Minimal, conservative service worker.
// Intentionally does NOT cache API/Supabase responses or auth pages —
// this is a private company app, so stale cached data is a real risk.
// It only makes the app shell load instantly and gives a friendly
// offline fallback instead of a browser error page.

const CACHE_NAME = 'satoh-chikusan-shell-v1'
const SHELL_ASSETS = ['/manifest.json', '/offline.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // Never intercept API/auth calls — always go to the network so
  // permissions and session state are never served stale.
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    )
    return
  }
})
