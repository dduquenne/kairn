'use client';

import { useState, useEffect } from 'react';

import { getConsentLevel, setConsentLevel, type ConsentLevel } from './consent';

export interface ConsentBannerProps {
  /** Site name displayed in the banner */
  siteName?: string;
  /** URL to privacy policy page */
  privacyPolicyUrl?: string;
  /** Callback when consent is given or updated */
  onConsentChange?: (level: ConsentLevel) => void;
}

/**
 * GDPR-compliant consent banner for analytics tracking.
 *
 * Renders only if no consent has been given yet.
 * Offers three levels: essential, analytics, marketing (all).
 */
export function ConsentBanner({
  siteName = 'Ce site',
  privacyPolicyUrl = '/politique-de-confidentialite',
  onConsentChange,
}: ConsentBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no consent has been given
    const level = getConsentLevel();
    if (!level) {
      setVisible(true);
    }
  }, []);

  const handleConsent = (level: ConsentLevel) => {
    setConsentLevel(level);
    setVisible(false);
    onConsentChange?.(level);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies et du suivi"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '1rem 1.5rem',
      }}
    >
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem', lineHeight: '1.5', color: '#374151' }}>
          {siteName} utilise des cookies et technologies similaires pour mesurer
          l&apos;audience et améliorer votre expérience. Vous pouvez choisir le
          niveau de suivi que vous acceptez.{' '}
          <a
            href={privacyPolicyUrl}
            style={{ color: '#2563eb', textDecoration: 'underline' }}
          >
            Politique de confidentialité
          </a>
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleConsent('essential')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            Essentiel uniquement
          </button>
          <button
            onClick={() => handleConsent('analytics')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              border: '1px solid #2563eb',
              borderRadius: '0.375rem',
              backgroundColor: '#2563eb',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Accepter les statistiques
          </button>
          <button
            onClick={() => handleConsent('marketing')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
