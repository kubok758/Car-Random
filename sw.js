// Изменили версию на v2, чтобы телефон обновил файлы
const CACHE_NAME = 'car-rando-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/mercedes.jpg',
  '/bmw.jpg',
  '/porsche.jpg'
];

// Установка (кэширование)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // Принудительно активировать новый воркер
});

// Активация и удаление старого кэша (v1)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Запрос файлов
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
