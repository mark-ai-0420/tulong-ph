const SHELL_CACHE = 'tulongph-offline-shell-v1';
const STATIC_CACHE = 'tulongph-offline-static-v1';
const APP_CACHE_PREFIX = 'tulongph-offline-';
const SHELL_ROUTES = ['/', '/edukasyon', '/manggagawa', '/privacy'];
const STATIC_PREFIX = '/_next/static/';
const HASHED_ASSET = /(?:^|[-_.])[0-9a-z_-]{6,}(?:[._/-]|$)/i;
let clearRequestedDuringInstall = false;

function isPublicHtmlResponse(response, requestedUrl) {
  if (!response.ok || response.type !== 'basic') return false;
  if (!/^text\/html(?:;|$)/i.test(response.headers.get('content-type') ?? '')) return false;
  const finalUrl = response.url ? new URL(response.url) : requestedUrl;
  if (finalUrl.origin !== self.location.origin) return false;
  const cacheControl = response.headers.get('cache-control') ?? '';
  return !/(?:^|,)\s*(?:private|no-store)(?:\s|,|$)/i.test(cacheControl);
}

function isHashedStaticAsset(url) {
  return url.origin === self.location.origin
    && url.pathname.startsWith(STATIC_PREFIX)
    && url.search === ''
    && HASHED_ASSET.test(url.pathname);
}

function staticAssetsFromHtml(html) {
  const assets = new Set();
  const attributes = /(?:src|href)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attributes)) {
    try {
      const url = new URL(match[1], self.location.origin);
      if (isHashedStaticAsset(url)) assets.add(url.href);
    } catch {
      // Ignore malformed or non-URL attributes.
    }
  }
  return [...assets];
}

async function fetchPublicShell(url) {
  return fetch(url.href, {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store',
    headers: { accept: 'text/html' },
  });
}

async function precacheStaticAsset(assetUrl, cache) {
  if (clearRequestedDuringInstall) return;
  const url = new URL(assetUrl);
  const response = await fetch(url.href, { method: 'GET', credentials: 'omit', cache: 'no-store' });
  if (!response.ok || response.type !== 'basic' || new URL(response.url || url.href).origin !== self.location.origin) {
    throw new Error('Unable to precache a static app asset.');
  }
  if (!clearRequestedDuringInstall) await cache.put(url.href, response);
}

self.addEventListener('install', event => {
  clearRequestedDuringInstall = false;
  event.waitUntil((async () => {
    const shellCache = await caches.open(SHELL_CACHE);
    const staticCache = await caches.open(STATIC_CACHE);
    const pages = await Promise.all(SHELL_ROUTES.map(async route => {
      const url = new URL(route, self.location.origin);
      const response = await fetchPublicShell(url);
      if (!isPublicHtmlResponse(response, url)) throw new Error('Unable to precache a public app route.');
      if (!clearRequestedDuringInstall) await shellCache.put(url.href, response.clone());
      return response.text();
    }));
    const assets = new Set(pages.flatMap(staticAssetsFromHtml));
    await Promise.all([...assets].map(assetUrl => precacheStaticAsset(assetUrl, staticCache)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const oldCaches = (await caches.keys()).filter(name => name.startsWith(APP_CACHE_PREFIX) && name !== SHELL_CACHE && name !== STATIC_CACHE);
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data !== 'CLEAR_CACHE') return;
  if (self.registration.installing?.scriptURL === self.location.href) clearRequestedDuringInstall = true;
  const reply = event.ports[0];
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
    reply?.postMessage('CACHE_CLEARED');
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' && url.search === '' && SHELL_ROUTES.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        const response = await fetchPublicShell(url);
        if (isPublicHtmlResponse(response, url)) await cache.put(url.href, response.clone());
        return response;
      } catch {
        return await cache.match(url.href) ?? Response.error();
      }
    })());
    return;
  }

  if (isHashedStaticAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(url.href);
      if (cached) return cached;
      const response = await fetch(url.href, { method: 'GET', credentials: 'omit', cache: 'no-store' });
      if (response.ok && response.type === 'basic') await cache.put(url.href, response.clone());
      return response;
    })());
  }
});
