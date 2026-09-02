/* Groundhog Arena 2070 — service worker
   Offline-first app shell so the yard loads with no signal (subway, backyard, 2070 dead zones).
   Bump VERSION whenever a cached file changes; the page shows an "update ready" toast and
   asks us to SKIP_WAITING, then reloads on controllerchange. */
'use strict';
const VERSION = 'ga2070-v1';
const SHELL = [
  './',
  './index.html',
  './arena.html',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Add files one by one so a single missing asset never blocks installation.
    await Promise.all(SHELL.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (e) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/* Strategy: same-origin GET → stale-while-revalidate.
   Serve from cache instantly (fast launch from the Home Screen), refresh the cache in the
   background, and fall back to arena.html for navigations when offline. */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cacheKey = req.mode === 'navigate' ? new Request(url.pathname, { cache: 'default' }) : req;
    const cached = await cache.match(cacheKey, { ignoreSearch: true });
    const network = (async () => {
      try {
        const preload = event.preloadResponse ? await event.preloadResponse : null;
        const res = preload || await fetch(req);
        if (res && res.ok && (res.type === 'basic' || res.type === 'default')) {
          cache.put(cacheKey, res.clone()).catch(() => {});
        }
        return res;
      } catch (e) {
        return null;
      }
    })();
    if (cached) {
      event.waitUntil(network);
      return cached;
    }
    const fresh = await network;
    if (fresh) return fresh;
    if (req.mode === 'navigate') {
      const fallback = await cache.match('./arena.html') || await cache.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline — the yard is unreachable right now.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  })());
});
