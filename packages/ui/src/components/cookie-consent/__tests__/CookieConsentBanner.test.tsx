/**
 * CookieConsentBanner Component Tests
 *
 * Tests for the shared cookie consent banner including:
 * - Visibility based on existing consent
 * - Consent level selection
 * - Callback invocation
 * - Custom labels and colors
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CookieConsentBanner, type CookieConsentBannerProps } from '../index';

/**
 * Render CookieConsentBanner with default props
 */
function renderBanner(props: Partial<CookieConsentBannerProps> = {}) {
  const defaultProps: CookieConsentBannerProps = {
    getConsentLevel: vi.fn().mockReturnValue(null),
    setConsentLevel: vi.fn(),
    ...props,
  };

  return { ...render(<CookieConsentBanner {...defaultProps} />), props: defaultProps };
}

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when no consent has been given', () => {
    renderBanner();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/cookies/i)).toBeInTheDocument();
  });

  it('should not render when consent already exists', () => {
    renderBanner({
      getConsentLevel: vi.fn().mockReturnValue('analytics'),
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call setConsentLevel with "essential" when clicking essential button', () => {
    const setConsentLevel = vi.fn();
    renderBanner({ setConsentLevel });

    fireEvent.click(screen.getByText('Essentiel uniquement'));

    expect(setConsentLevel).toHaveBeenCalledWith('essential');
  });

  it('should call setConsentLevel with "analytics" when clicking analytics button', () => {
    const setConsentLevel = vi.fn();
    renderBanner({ setConsentLevel });

    fireEvent.click(screen.getByText('Accepter les statistiques'));

    expect(setConsentLevel).toHaveBeenCalledWith('analytics');
  });

  it('should call setConsentLevel with "marketing" when clicking accept all button', () => {
    const setConsentLevel = vi.fn();
    renderBanner({ setConsentLevel });

    fireEvent.click(screen.getByText('Tout accepter'));

    expect(setConsentLevel).toHaveBeenCalledWith('marketing');
  });

  it('should call onConsent callback when consent is given', () => {
    const onConsent = vi.fn();
    renderBanner({ onConsent });

    fireEvent.click(screen.getByText('Accepter les statistiques'));

    expect(onConsent).toHaveBeenCalledWith('analytics');
  });

  it('should hide the banner after consent is given', async () => {
    renderBanner();

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Essentiel uniquement'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render custom labels', () => {
    renderBanner({
      labels: {
        description: 'Custom description text',
        essentialOnly: 'Essential',
        acceptAnalytics: 'Stats',
        acceptAll: 'All',
      },
    });

    expect(screen.getByText(/Custom description text/)).toBeInTheDocument();
    expect(screen.getByText('Essential')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('should render privacy policy link with custom URL', () => {
    renderBanner({ privacyPolicyUrl: '/custom-privacy' });

    const link = screen.getByText('Politique de confidentialité');
    expect(link).toHaveAttribute('href', '/custom-privacy');
  });

  it('should have accessible dialog role and label', () => {
    renderBanner();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Gestion des cookies et du suivi');
  });
});
