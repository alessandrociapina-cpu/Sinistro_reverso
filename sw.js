const CACHE_NAME = 'sabesp-orcamento-v2'; // Versão 2 força a limpeza do erro antigo
const urlsToCache = [
  './',
  './index.html',
  './servicos.js',
  './materiais.js',
  './logosabesp.png',
  './manifest.json'
];

// Instala o Service Worker e pula a espera
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Limpa o lixo (cache antigo) que estava quebrando o seu app
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Rede Primeiro (Para preços e itens estarem sempre atualizados)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch(() => {
      // Se der erro de rede (offline), usa o que tem em cache
      return caches.match(event.request);
    })
  );
});
