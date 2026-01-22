// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
'use client';

import { useEffect } from 'react';

export function useBlogAnalytics(slug: string) {
  useEffect(() => {
    // Tracker la visite de l'article
    const trackView = async () => {
      try {
        await fetch('/api/blog/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        });
      } catch (error) {
        console.error('Error tracking blog view:', error);
      }
    };

    // Tracker après un court délai pour s'assurer que la page est bien chargée
    const timer = setTimeout(() => {
      trackView();
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);
}
