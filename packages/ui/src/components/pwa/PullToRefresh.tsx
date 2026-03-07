'use client';

/**
 * PullToRefresh Component
 *
 * Composant wrapper pour le geste pull-to-refresh sur mobile.
 * Affiche un indicateur visuel pendant la traction et le rafraîchissement.
 *
 * @module components/pwa/PullToRefresh
 */

import type { ReactNode } from 'react';

import { usePullToRefresh, type PullToRefreshOptions } from '../../hooks/usePullToRefresh';

/**
 * Props du composant PullToRefresh
 */
export interface PullToRefreshProps extends PullToRefreshOptions {
  /** Fonction de rafraîchissement async */
  onRefresh: () => Promise<void>;
  /** Contenu enfant */
  children: ReactNode;
  /** Classe CSS pour le conteneur */
  className?: string;
  /** Classe CSS pour l'indicateur */
  indicatorClassName?: string;
  /** Classe CSS pour l'icône de rotation */
  iconClassName?: string;
  /** Rendu personnalisé de l'indicateur */
  renderIndicator?: (props: {
    isPulling: boolean;
    pullDistance: number;
    isRefreshing: boolean;
  }) => ReactNode;
}

/**
 * Composant PullToRefresh avec indicateur visuel intégré.
 *
 * @example
 * ```tsx
 * <PullToRefresh onRefresh={() => fetchData()}>
 *   <div>Content</div>
 * </PullToRefresh>
 * ```
 */
export function PullToRefresh({
  onRefresh,
  children,
  className = 'relative',
  indicatorClassName = 'flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30',
  iconClassName = 'h-5 w-5 text-blue-500',
  renderIndicator,
  ...options
}: PullToRefreshProps) {
  const containerId = options.containerId ?? 'pull-to-refresh-container';
  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh(onRefresh, {
    ...options,
    containerId,
  });

  return (
    <div id={containerId} className={className}>
      {renderIndicator
        ? renderIndicator({ isPulling, pullDistance, isRefreshing })
        : pullDistance > 0 && (
            <div
              className="pointer-events-none absolute left-1/2 top-0 z-10"
              style={{
                transform: `translateX(-50%) translateY(${Math.min(pullDistance - 50, 70)}px)`,
                opacity: pullDistance > 0 ? 1 : 0,
                transition: pullDistance === 0 ? 'all 0.3s ease' : 'none',
              }}
            >
              <div
                className={indicatorClassName}
                style={{
                  transform: `rotate(${isRefreshing ? 360 : isPulling ? 180 : 0}deg)`,
                  transition: isRefreshing ? 'transform 1s linear' : 'transform 0.3s ease-out',
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                }}
              >
                <svg
                  className={iconClassName}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>
          )}

      {children}
    </div>
  );
}
