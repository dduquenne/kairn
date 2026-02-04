/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Stratégie de prefetching pour améliorer les performances
 */

interface PrefetchOptions {
  priority?: 'high' | 'low' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/**
 * Prefetch une URL pour améliorer le temps de chargement
 */
export function prefetchUrl(url: string, options: PrefetchOptions = {}) {
  if (typeof window === 'undefined') return;

  // Vérifier si le prefetch est déjà en cours
  const existing = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;

  if (options.priority) {
    link.setAttribute('fetchpriority', options.priority);
  }

  if (options.crossOrigin) {
    link.crossOrigin = options.crossOrigin;
  }

  document.head.appendChild(link);
}

/**
 * Preload une ressource critique
 */
export function preloadResource(url: string, as: 'script' | 'style' | 'font' | 'image') {
  if (typeof window === 'undefined') return;

  const existing = document.querySelector(`link[rel="preload"][href="${url}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;

  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Prefetch les données d'analytics de manière intelligente
 */
export function prefetchAnalyticsData(timeRange: string = '7d') {
  const endpoints = [
    `/api/analytics/summary?range=${timeRange}`,
    `/api/analytics/blog/stats?range=${timeRange}`,
    `/api/analytics/alerts`
  ];

  endpoints.forEach(endpoint => prefetchUrl(endpoint));
}

/**
 * Prefetch au survol (hover)
 */
export function setupHoverPrefetch() {
  if (typeof window === 'undefined') return;

  // Prefetch au survol des liens de navigation
  const navLinks = document.querySelectorAll('a[data-prefetch]');

  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const href = link.getAttribute('href');
      if (href) {
        prefetchUrl(href);
      }
    }, { once: true });
  });
}

/**
 * Prefetch basé sur le viewport (visible)
 */
export function setupViewportPrefetch() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement;
        const href = target.getAttribute('data-prefetch-url');
        if (href) {
          prefetchUrl(href);
          observer.unobserve(target);
        }
      }
    });
  }, {
    rootMargin: '50px' // Prefetch 50px avant que l'élément soit visible
  });

  const elements = document.querySelectorAll('[data-prefetch-url]');
  elements.forEach(el => observer.observe(el));

  return observer;
}

/**
 * Prefetch intelligent basé sur la connexion réseau
 */
export function smartPrefetch(urls: string[]) {
  if (typeof window === 'undefined') return;

  // @ts-ignore - NetworkInformation API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  // Ne pas prefetch si connexion lente ou mode économie de données
  if (connection) {
    if (connection.saveData || connection.effectiveType === '2g') {
      console.log('Prefetch désactivé (connexion lente ou économie de données)');
      return;
    }
  }

  // Prefetch uniquement si le navigateur est idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      urls.forEach(url => prefetchUrl(url, { priority: 'low' }));
    });
  } else {
    // Fallback pour les navigateurs sans requestIdleCallback
    setTimeout(() => {
      urls.forEach(url => prefetchUrl(url, { priority: 'low' }));
    }, 1000);
  }
}
