'use client';

/**
 * Hook pour le geste pull-to-refresh sur mobile.
 *
 * Détecte le geste de tirer vers le bas depuis le haut de la page
 * et déclenche une action de rafraîchissement.
 *
 * @module hooks/usePullToRefresh
 */

import { useState, useRef, useCallback, useEffect } from 'react';

/** Résultat du hook usePullToRefresh */
export interface UsePullToRefreshReturn {
  /** Indique si l'utilisateur tire suffisamment pour déclencher un refresh */
  isPulling: boolean;
  /** Distance de traction en pixels */
  pullDistance: number;
  /** Indique si le refresh est en cours */
  isRefreshing: boolean;
}

/** Options de configuration du pull-to-refresh */
export interface PullToRefreshOptions {
  /** Seuil de déclenchement en pixels (défaut: 80) */
  threshold?: number;
  /** Distance maximale de traction en pixels (défaut: 120) */
  maxDistance?: number;
  /** ID de l'élément conteneur (défaut: 'pull-to-refresh-container') */
  containerId?: string;
}

/**
 * Hook de pull-to-refresh.
 *
 * Écoute les événements tactiles sur un conteneur et gère le geste
 * de traction vers le bas pour déclencher un rafraîchissement.
 *
 * @param onRefresh - Fonction async appelée lors du refresh
 * @param options - Options de configuration
 *
 * @example
 * ```tsx
 * const { isPulling, pullDistance, isRefreshing } = usePullToRefresh(
 *   () => fetchData(),
 *   { threshold: 80 }
 * );
 * ```
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: PullToRefreshOptions = {}
): UsePullToRefreshReturn {
  const { threshold = 80, maxDistance = 120, containerId = 'pull-to-refresh-container' } = options;

  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (typeof window === 'undefined') return;
    const touch = e.touches[0];
    if (window.scrollY === 0 && touch) {
      startY.current = touch.clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (typeof window === 'undefined') return;
      if (startY.current === null || window.scrollY > 0) return;

      const touch = e.touches[0];
      if (!touch) return;
      const currentY = touch.clientY;
      const distance = Math.max(0, currentY - startY.current);

      if (distance > 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, maxDistance));
        setIsPulling(distance > threshold);
      }
    },
    [maxDistance, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (isPulling && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setIsPulling(false);
    startY.current = null;
  }, [isPulling, isRefreshing, onRefresh]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const element = document.getElementById(containerId);
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, containerId]);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
  };
}
