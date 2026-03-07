/**
 * ContactSection Component Tests
 *
 * Tests for the reusable ContactSection component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ContactSection } from '../contact-section';

describe('ContactSection', () => {
  it('renders with default title', () => {
    render(<ContactSection contactForm={<form data-testid="form" />} />);
    expect(screen.getByText('Contactez-nous')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(
      <ContactSection
        title={{
          eyebrow: 'Contact',
          title: 'Écrivez-nous',
          description: 'Réponse sous 24h.',
        }}
        contactForm={<form />}
      />
    );
    expect(screen.getByText('Écrivez-nous')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Réponse sous 24h.')).toBeInTheDocument();
  });

  it('renders the contact form', () => {
    render(<ContactSection contactForm={<form data-testid="my-form" />} />);
    expect(screen.getByTestId('my-form')).toBeInTheDocument();
  });

  it('renders social links when provided', () => {
    render(
      <ContactSection
        contactForm={<form />}
        socialLinks={<div data-testid="social-links">Social</div>}
      />
    );
    expect(screen.getByTestId('social-links')).toBeInTheDocument();
  });

  it('does not render social links section when not provided', () => {
    const { container } = render(<ContactSection contactForm={<form />} />);
    expect(container.querySelector('[data-testid="social-links"]')).toBeNull();
  });

  it('renders custom social links label', () => {
    render(
      <ContactSection
        contactForm={<form />}
        socialLinks={<div>Links</div>}
        socialLinksLabel="Retrouvez-nous"
      />
    );
    expect(screen.getByText('Retrouvez-nous')).toBeInTheDocument();
  });

  it('sets tracking attributes', () => {
    const { container } = render(<ContactSection contactForm={<form />} trackingName="Contact" />);
    const section = container.querySelector('[data-track-section="contact"]');
    expect(section).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ContactSection contactForm={<form />} className="custom-class" />
    );
    expect(container.querySelector('section')).toHaveClass('custom-class');
  });
});
