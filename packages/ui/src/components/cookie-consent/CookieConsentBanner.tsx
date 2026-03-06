'use client';

import { useState, useEffect } from 'react';

import { cn } from '../../utils/cn';

import type { ConsentLevel, CookieConsentBannerProps } from './types';

const DEFAULT_LABELS = {
  description:
    'Ce site utilise des cookies pour mesurer l\u2019audience et am\u00e9liorer votre exp\u00e9rience. Vous pouvez choisir le niveau de suivi que vous acceptez.',
  privacyPolicyText: 'Politique de confidentialit\u00e9',
  essentialOnly: 'Essentiel uniquement',
  acceptAnalytics: 'Accepter les statistiques',
  acceptAll: 'Tout accepter',
};

/**
 * GDPR-compliant cookie consent banner.
 *
 * Displays only when no consent has been given yet.
 * Offers three levels: essential, analytics, marketing (all).
 * Fully configurable via props for colors, labels, and callbacks.
 */
export function CookieConsentBanner({
  privacyPolicyUrl = '/politique-de-confidentialite',
  colors = {},
  labels: userLabels = {},
  onConsent,
  getConsentLevel: getConsent,
  setConsentLevel: setConsent,
  className,
}: CookieConsentBannerProps) {
  const [visible, setVisible] = useState(false);
  const labels = { ...DEFAULT_LABELS, ...userLabels };

  useEffect(() => {
    const level = getConsent();
    if (!level) {
      setVisible(true);
    }
  }, [getConsent]);

  /**
   * Handle user consent choice
   */
  const handleConsent = (level: ConsentLevel) => {
    setConsent(level);
    setVisible(false);
    onConsent?.(level);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies et du suivi"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[9999] border-t px-4 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:px-6',
        colors.background || 'bg-white',
        colors.border || 'border-gray-200',
        className
      )}
    >
      <div className="mx-auto max-w-4xl">
        <p className={cn('mb-3 text-sm leading-relaxed', colors.text || 'text-gray-700')}>
          {labels.description}{' '}
          <a
            href={privacyPolicyUrl}
            className={cn(
              'underline transition-colors',
              colors.link || 'text-blue-600',
              colors.linkHover || 'hover:text-blue-500'
            )}
          >
            {labels.privacyPolicyText}
          </a>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleConsent('essential')}
            className={cn(
              'rounded-lg border bg-transparent px-4 py-2 text-sm transition-colors',
              colors.secondaryButton || 'border-gray-300',
              colors.secondaryButtonText || 'text-gray-700',
              'hover:bg-gray-100'
            )}
          >
            {labels.essentialOnly}
          </button>
          <button
            onClick={() => handleConsent('analytics')}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
              colors.primaryButtonBorder || 'border-blue-600',
              colors.primaryButton || 'bg-blue-600',
              colors.primaryButtonText || 'text-white',
              'hover:opacity-90'
            )}
          >
            {labels.acceptAnalytics}
          </button>
          <button
            onClick={() => handleConsent('marketing')}
            className={cn(
              'rounded-lg border bg-transparent px-4 py-2 text-sm transition-colors',
              colors.secondaryButton || 'border-gray-300',
              colors.secondaryButtonText || 'text-gray-700',
              'hover:bg-gray-100'
            )}
          >
            {labels.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
