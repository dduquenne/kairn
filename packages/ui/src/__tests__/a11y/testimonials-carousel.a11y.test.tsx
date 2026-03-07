/**
 * Accessibility tests for TestimonialsCarousel component
 *
 * Tests WCAG 2.1 AA compliance for testimonials carousel pattern
 */

import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { axe } from 'vitest-axe';

import { TestimonialsCarousel } from '../../components/testimonials/TestimonialsCarousel';

afterEach(cleanup);

const mockTestimonials = [
  {
    id: '1',
    quote: 'Excellent praticien, je recommande vivement.',
    author: 'Marie D.',
    role: 'Patiente',
    rating: 5,
  },
  {
    id: '2',
    quote: 'Une expérience transformatrice.',
    author: 'Pierre L.',
    role: 'Patient',
    rating: 4,
  },
  {
    id: '3',
    quote: "Très professionnel et à l'écoute.",
    author: 'Sophie M.',
    role: 'Patiente',
    rating: 5,
  },
];

describe('TestimonialsCarousel - Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <TestimonialsCarousel
        testimonials={mockTestimonials}
        title="Témoignages"
        showDots
        autoplayInterval={0}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have region role with aria-roledescription carousel', () => {
    const { container } = render(
      <TestimonialsCarousel testimonials={mockTestimonials} title="Avis clients" />
    );
    const carousel = container.querySelector('[aria-roledescription="carousel"]');
    expect(carousel).toBeTruthy();
    expect(carousel?.getAttribute('role')).toBe('region');
    expect(carousel?.getAttribute('aria-label')).toBe('Avis clients');
  });

  it('should use default aria-label when no title provided', () => {
    const { container } = render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    const carousel = container.querySelector('[aria-roledescription="carousel"]');
    expect(carousel?.getAttribute('aria-label')).toBe('Témoignages');
  });

  it('should have accessible navigation arrows with French labels', () => {
    const { container } = render(
      <TestimonialsCarousel testimonials={mockTestimonials} showArrows autoplayInterval={0} />
    );
    const prevButton = container.querySelector('[aria-label="Témoignage précédent"]');
    const nextButton = container.querySelector('[aria-label="Témoignage suivant"]');
    expect(prevButton).toBeTruthy();
    expect(nextButton).toBeTruthy();
  });

  it('should have accessible dot navigation', () => {
    const { container } = render(
      <TestimonialsCarousel testimonials={mockTestimonials} showDots autoplayInterval={0} />
    );
    const dotButtons = container.querySelectorAll('button[aria-label^="Aller au témoignage"]');
    expect(dotButtons).toHaveLength(3);
  });

  it('should have aria-current on active dot', () => {
    const { container } = render(
      <TestimonialsCarousel testimonials={mockTestimonials} showDots autoplayInterval={0} />
    );
    const activeDot = container.querySelector(
      'button[aria-label^="Aller au témoignage"][aria-current="true"]'
    );
    expect(activeDot).toBeTruthy();
  });

  it('should update aria-current when navigating', () => {
    const { container } = render(
      <TestimonialsCarousel testimonials={mockTestimonials} showDots autoplayInterval={0} />
    );
    const dotButtons = container.querySelectorAll('button[aria-label^="Aller au témoignage"]');

    // Click second dot
    fireEvent.click(dotButtons[1]);

    // Check updated aria-current
    const updatedDots = container.querySelectorAll('button[aria-label^="Aller au témoignage"]');
    expect(updatedDots[0].hasAttribute('aria-current')).toBe(false);
    expect(updatedDots[1].getAttribute('aria-current')).toBe('true');
  });

  it('should have aria-live on slides container', () => {
    const { container } = render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeTruthy();
    expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
  });

  it('should have decorative arrow SVGs with aria-hidden', () => {
    const { container } = render(
      <TestimonialsCarousel testimonials={mockTestimonials} showArrows autoplayInterval={0} />
    );
    const arrowSvgs = container.querySelectorAll('button svg[aria-hidden="true"]');
    expect(arrowSvgs.length).toBe(2);
  });

  it('should return null for empty testimonials', () => {
    const { container } = render(<TestimonialsCarousel testimonials={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
