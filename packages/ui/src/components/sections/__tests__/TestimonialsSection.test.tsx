/**
 * TestimonialsSection Component Tests
 *
 * Tests for the reusable TestimonialsSection component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { TestimonialSectionItem } from '../testimonials-section';
import { TestimonialsSection } from '../testimonials-section';

/** Mock matchMedia for reduced motion support */
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

/** Create mock testimonials */
function createMockTestimonials(count = 5): TestimonialSectionItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `t-${i + 1}`,
    quote: `Témoignage numéro ${i + 1}`,
    author: `Auteur ${i + 1}`,
  }));
}

describe('TestimonialsSection', () => {
  it('renders testimonials with default title', () => {
    render(<TestimonialsSection testimonials={createMockTestimonials()} />);
    expect(screen.getByText('Ce que disent nos clients')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(
      <TestimonialsSection
        testimonials={createMockTestimonials()}
        title={{ eyebrow: 'Avis', title: 'Titre personnalisé' }}
      />
    );
    expect(screen.getByText('Titre personnalisé')).toBeInTheDocument();
    expect(screen.getByText('Avis')).toBeInTheDocument();
  });

  it('renders empty state when no testimonials', () => {
    render(<TestimonialsSection testimonials={[]} emptyMessage="Pas de témoignages." />);
    expect(screen.getByText('Pas de témoignages.')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(<TestimonialsSection testimonials={[]} isLoading />);
    const pulsingElements = container.querySelectorAll('.animate-pulse');
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it('renders testimonial quotes and authors', () => {
    const testimonials = createMockTestimonials(2);
    render(<TestimonialsSection testimonials={testimonials} />);
    // Quotes are rendered in marquee (duplicated), so check at least one instance
    expect(screen.getAllByText(/Témoignage numéro 1/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Auteur 1/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders hover hint text', () => {
    render(
      <TestimonialsSection testimonials={createMockTestimonials()} hoverHint="Pause au survol" />
    );
    expect(screen.getByText('Pause au survol')).toBeInTheDocument();
  });

  it('sets tracking attributes', () => {
    const { container } = render(
      <TestimonialsSection testimonials={createMockTestimonials()} trackingName="Temoignages" />
    );
    const section = container.querySelector('[data-track-section="temoignages"]');
    expect(section).toBeInTheDocument();
  });

  it('uses custom renderCard when provided', () => {
    render(
      <TestimonialsSection
        testimonials={createMockTestimonials(1)}
        renderCard={t => (
          <div data-testid="custom-card" key={t.id}>
            {t.quote}
          </div>
        )}
      />
    );
    expect(screen.getAllByTestId('custom-card').length).toBeGreaterThanOrEqual(1);
  });
});
