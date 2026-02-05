/* eslint-disable no-undef, no-console, @typescript-eslint/no-unused-vars */
/**
 * Psypnos Service Worker - PWA Avancée
 *
 * Fonctionnalités:
 * - Cache des pages critiques (home, services, contact)
 * - Offline fallback amélioré avec page dédiée
 * - Background sync pour formulaires
 * - Push notifications
 * - Stratégies de cache optimisées
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `psypnos-${CACHE_VERSION}`;
const STATIC_CACHE = `psypnos-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `psypnos-dynamic-${CACHE_VERSION}`;

// Pages critiques à pré-cacher
const CRITICAL_PAGES = ['/', '/services', '/contact', '/qui-suis-je', '/blog', '/seminaires'];

// Assets statiques essentiels
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/offline.html',
];

// Configuration des stratégies de cache par type de ressource
const CACHE_STRATEGIES = {
  // Pages HTML - Network first, cache fallback
  pages: {
    strategy: 'network-first',
    cacheName: CACHE_NAME,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    networkTimeout: 3000,
  },
  // Assets statiques - Cache first
  static: {
    strategy: 'cache-first',
    cacheName: STATIC_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
  },
  // API - Network only avec queue offline
  api: {
    strategy: 'network-only',
    cacheName: null,
  },
  // Images - Cache first avec fallback
  images: {
    strategy: 'cache-first',
    cacheName: DYNAMIC_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  },
};

// File d'attente pour background sync
const SYNC_QUEUE_KEY = 'psypnos_sync_queue';

/**
 * Installation du Service Worker
 */
self.addEventListener('install', event => {
  console.log('[SW] Installation en cours...');

  event.waitUntil(
    Promise.all([
      // Cache des assets statiques
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Mise en cache des assets statiques');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pré-cache des pages critiques
      caches.open(CACHE_NAME).then(async cache => {
        console.log('[SW] Pré-cache des pages critiques');
        for (const page of CRITICAL_PAGES) {
          try {
            const response = await fetch(page);
            if (response.ok) {
              await cache.put(page, response);
            }
          } catch (error) {
            console.warn(`[SW] Impossible de pré-cacher ${page}:`, error);
          }
        }
      }),
    ]).then(() => {
      console.log('[SW] Installation terminée');
      // Activer immédiatement le nouveau SW
      return self.skipWaiting();
    })
  );
});

/**
 * Activation du Service Worker
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activation en cours...');

  event.waitUntil(
    // Nettoyer les anciens caches
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return (
                cacheName.startsWith('psypnos-') &&
                cacheName !== CACHE_NAME &&
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE
              );
            })
            .map(cacheName => {
              console.log('[SW] Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation terminée');
        // Prendre le contrôle immédiatement
        return self.clients.claim();
      })
  );
});

/**
 * Interception des requêtes
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP(S)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Ignorer les requêtes vers des domaines externes (sauf CDN)
  if (url.origin !== self.location.origin) {
    // Autoriser uniquement certains domaines externes
    const allowedOrigins = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];
    if (!allowedOrigins.some(origin => url.hostname.includes(origin))) {
      return;
    }
  }

  // Déterminer la stratégie selon le type de ressource
  const strategy = getStrategy(request, url);

  event.respondWith(handleRequest(request, strategy));
});

/**
 * Détermine la stratégie de cache à utiliser
 */
function getStrategy(request, url) {
  // API requests - Network only
  if (url.pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.api;
  }

  // Assets statiques
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    return CACHE_STRATEGIES.static;
  }

  // Images
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/)) {
    return CACHE_STRATEGIES.images;
  }

  // Pages HTML
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    return CACHE_STRATEGIES.pages;
  }

  // Par défaut: network-first
  return CACHE_STRATEGIES.pages;
}

/**
 * Gère la requête selon la stratégie
 */
async function handleRequest(request, strategy) {
  switch (strategy.strategy) {
    case 'cache-first':
      return cacheFirst(request, strategy);
    case 'network-first':
      return networkFirst(request, strategy);
    case 'network-only':
      return networkOnly(request);
    default:
      return fetch(request);
  }
}

/**
 * Stratégie Cache First
 */
async function cacheFirst(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Vérifier l'âge du cache
    const dateHeader = cachedResponse.headers.get('date');
    if (dateHeader) {
      const cacheDate = new Date(dateHeader).getTime();
      const now = Date.now();
      if (now - cacheDate > strategy.maxAge) {
        // Cache expiré, fetch en arrière-plan
        fetchAndCache(request, strategy.cacheName);
      }
    }
    return cachedResponse;
  }

  // Pas en cache, fetch et mettre en cache
  return fetchAndCache(request, strategy.cacheName);
}

/**
 * Stratégie Network First
 */
async function networkFirst(request, strategy) {
  const cache = await caches.open(strategy.cacheName);

  try {
    // Timeout pour le réseau
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), strategy.networkTimeout);
    });

    const response = await Promise.race([networkPromise, timeoutPromise]);

    if (response.ok) {
      // Mettre en cache la réponse
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network first fallback pour:', request.url);

    // Fallback sur le cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Si c'est une navigation, retourner la page offline
    if (request.mode === 'navigate') {
      return getOfflinePage();
    }

    throw error;
  }
}

/**
 * Stratégie Network Only
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Pour les requêtes API POST, mettre en queue pour sync
    if (request.method === 'POST') {
      await queueForSync(request);
      return new Response(
        JSON.stringify({
          queued: true,
          message: 'Votre demande sera envoyée dès que vous serez connecté.',
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    throw error;
  }
}

/**
 * Fetch et mise en cache
 */
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

/**
 * Retourne la page offline
 */
async function getOfflinePage() {
  const cache = await caches.open(STATIC_CACHE);
  const offlineResponse = await cache.match('/offline.html');

  if (offlineResponse) {
    return offlineResponse;
  }

  // Fallback basique si la page offline n'est pas en cache
  return new Response(
    `<!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hors ligne - Psypnos</title>
      <style>
        body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #1a1a2e; color: #fff; }
        .container { text-align: center; padding: 2rem; }
        h1 { color: #c7a962; margin-bottom: 1rem; }
        p { opacity: 0.8; }
        button { background: #c7a962; color: #1a1a2e; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Vous êtes hors ligne</h1>
        <p>Vérifiez votre connexion internet et réessayez.</p>
        <button onclick="location.reload()">Réessayer</button>
      </div>
    </body>
    </html>`,
    {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

/**
 * Met une requête en file d'attente pour synchronisation
 */
async function queueForSync(request) {
  const clonedRequest = request.clone();
  const body = await clonedRequest.text();

  const queueItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
    retries: 0,
  };

  // Stocker dans IndexedDB via les clients
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({
      type: 'QUEUE_SYNC',
      payload: queueItem,
    });
  }

  // Enregistrer le sync si disponible
  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register('psypnos-sync');
      console.log('[SW] Background sync enregistré');
    } catch (error) {
      console.warn('[SW] Background sync non supporté:', error);
    }
  }
}

/**
 * Événement Background Sync
 */
self.addEventListener('sync', event => {
  console.log('[SW] Background sync déclenché:', event.tag);

  if (event.tag === 'psypnos-sync') {
    event.waitUntil(processQueue());
  }
});

/**
 * Traite la file d'attente de synchronisation
 */
async function processQueue() {
  // Demander aux clients de traiter leur queue
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: 'PROCESS_SYNC_QUEUE' });
  }
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

/**
 * Réception d'une notification push
 */
self.addEventListener('push', event => {
  console.log('[SW] Push notification reçue');

  let data = {
    title: 'Psypnos',
    body: 'Nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/favicon.svg',
    url: '/',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' },
    ],
    tag: data.tag || 'psypnos-notification',
    renotify: data.renotify || false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

/**
 * Clic sur une notification
 */
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification cliquée:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Chercher une fenêtre existante
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Ouvrir une nouvelle fenêtre
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

/**
 * Fermeture d'une notification
 */
self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification fermée');

  // Analytics de la notification fermée
  const clients = self.clients.matchAll();
  clients.then(clientList => {
    for (const client of clientList) {
      client.postMessage({
        type: 'NOTIFICATION_CLOSED',
        payload: {
          tag: event.notification.tag,
          timestamp: Date.now(),
        },
      });
    }
  });
});

// ============================================================================
// MESSAGES
// ============================================================================

/**
 * Communication avec les clients
 */
self.addEventListener('message', event => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      console.log('[SW] Skip waiting demandé');
      self.skipWaiting();
      break;

    case 'NEW_VERSION_AVAILABLE':
      console.log('[SW] Nouvelle version disponible');
      // Informer tous les clients
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'UPDATE_AVAILABLE' });
        });
      });
      break;

    case 'CACHE_URLS':
      if (payload?.urls) {
        caches.open(CACHE_NAME).then(cache => {
          cache.addAll(payload.urls);
        });
      }
      break;

    case 'CLEAR_CACHE':
      caches
        .keys()
        .then(cacheNames => {
          return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        })
        .then(() => {
          event.source?.postMessage({ type: 'CACHE_CLEARED' });
        });
      break;

    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.source?.postMessage({ type: 'CACHE_STATUS', payload: status });
      });
      break;

    default:
      console.log('[SW] Message non géré:', type);
  }
});

/**
 * Obtient le statut du cache
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = {
      count: keys.length,
      urls: keys.map(req => req.url),
    };
  }

  return status;
}

console.log('[SW] Service Worker chargé - Version:', CACHE_VERSION);
