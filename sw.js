/* Кэшируется только публичная оболочка; личные данные и модели сюда не попадают. */
const CACHE_PREFIX = 'multitool-pwa-';
const VERSION = '20261107-5';
const SHELL_CACHE = CACHE_PREFIX + 'shell-v5';
const ASSET_CACHE = CACHE_PREFIX + 'assets-v5';
const OFFLINE_PAGE = '/pwa/offline.html';
const REQUIRED = ['/', OFFLINE_PAGE, '/pwa/offline.css', '/pwa/pwa.css', '/pwa/register.js', '/pwa/manifest.webmanifest', '/pwa/avatar-180.png', '/pwa/avatar-192.png', '/pwa/avatar-512.png', '/pwa/avatar-maskable-512.png', '/pwa/avatar.ico'];
const OPTIONAL = ['/pwa/brand.css','/nav-shell.css','/nav-groups.css','/navigation.js','/catalog-navigation.css','/text-ui.js','/text-ui.css','/image-tools.js','/image-tools.css','/calculation-tools.js','/calculation-tools.css','/pdf-ui.js','/pdf-ui.css','/news-editor.js','/rss-ui.js','/rss-ui.css','/games-ui.js','/games-ui.css','/maps_ui.js','/maps_ui.css','/subcategory-theme.css','/phosphor-icons.css','/compact-forms.css','/tool-layout.js','/tool-layout.css','/assets/pdf/pdf-lib.min.js','/assets/pdf/jszip.min.js','/host-convert.js'];
// Версионированные CSS и JS доступны также при автономном запуске PWA.
const versions = {'/navigation.js':'20261108-3','/nav-groups.css':'20261108-1','/catalog-navigation.css':'20261108-2','/pwa/register.js':'20261108-3','/pwa/brand.css':'20261108-1'};
const versioned = path => /\.(?:css|js)$/.test(path) ? `${path}?v=${versions[path] || VERSION}` : path;
for (let i=0;i<REQUIRED.length;i++) REQUIRED[i]=versioned(REQUIRED[i]);
for (let i=0;i<OPTIONAL.length;i++) OPTIONAL[i]=versioned(OPTIONAL[i]);
const CORE = new Set([...REQUIRED, ...OPTIONAL].map(path => new URL(path, self.location.origin).pathname));
const MAX_ASSET_BYTES = 5 * 1024 * 1024;
const MAX_ASSET_ENTRIES = 180;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(REQUIRED);
    // Серверная PHP-версия и локальный сервер имеют немного разные файлы.
    await Promise.all(OPTIONAL.map(url => cache.add(url).catch(() => {})));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== ASSET_CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'MULTITOOL_ACTIVATE_UPDATE') self.skipWaiting();
});

function isPrivate(url) {
  return url.pathname === '/n' || url.pathname.startsWith('/n/') ||
    url.pathname === '/api' || url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/models/') || url.pathname.startsWith('/browsery/models/');
}

function isPublicPage(url) {
  return url.pathname === '/' || url.pathname === '/browsery' || url.pathname.startsWith('/browsery/');
}

function isPublicAsset(url) {
  if (CORE.has(url.pathname)) return true;
  return url.pathname.startsWith('/browsery/_next/static/') && /\.(?:js|css|woff2?|png|jpe?g|webp|svg)$/i.test(url.pathname);
}

async function storeAsset(cache, request, response) {
  const size = Number(response.headers.get('content-length'));
  if (!response.ok || !Number.isFinite(size) || size <= 0 || size > MAX_ASSET_BYTES) return;
  await cache.put(request, response.clone());
  const keys = await cache.keys();
  while (keys.length > MAX_ASSET_ENTRIES) await cache.delete(keys.shift());
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isPrivate(url)) return;

  if (request.mode === 'navigate') {
    if (!isPublicPage(url)) return;
    event.respondWith((async () => {
      try {
        const response = await fetch(request, url.search ? { cache: 'no-store' } : undefined);
        // Адреса с параметрами могут содержать идентификаторы заметок.
        if (response.ok && !url.search) {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        if (!url.search) {
          const cache = await caches.open(SHELL_CACHE);
          const cached = await cache.match(request);
          if (cached) return cached;
        }
        return (await caches.match(OFFLINE_PAGE)) || Response.error();
      }
    })());
    return;
  }

  if (!isPublicAsset(url)) return;
  if (url.search && (url.searchParams.size !== 1 || url.searchParams.get('v') !== (versions[url.pathname] || VERSION))) return;
  event.respondWith((async () => {
    const cache = await caches.open(ASSET_CACHE);
    const immutable = url.pathname.startsWith('/browsery/_next/static/');
    if (immutable) {
      const cached = await cache.match(request);
      if (cached) return cached;
    }
    try {
      const response = await fetch(request);
      event.waitUntil(storeAsset(cache, request, response).catch(() => {}));
      return response;
    } catch (_) {
      return (await cache.match(request)) || (await caches.match(request)) || Response.error();
    }
  })());
});
