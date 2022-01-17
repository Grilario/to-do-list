self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('app')
    .then((cache) => {
      return cache.addAll([
        '/',
        '/style.css',
        '/main.js',
      ])
    })
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith( 
    caches.open('app')
      .then(cache => cache.match(e.request, {ignoreSearch: true}))
      .then(response => {
        if(!navigator.onLine && response) {
          return response
        }
        return fetch(e.request).catch(() => response)
      })
      )
})
