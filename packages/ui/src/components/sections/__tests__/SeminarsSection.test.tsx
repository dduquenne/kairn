/**
 * SeminarsSection Component Tests
 *
 * Tests for the reusable SeminarsSection component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import type { SeminarSectionItem } from '../seminars-section';
import { SeminarsSection } from '../seminars-section';

/** Create mock seminars */
function createMockSeminars(count = 3): SeminarSectionItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s-${i + 1}`,
    title: `Séminaire ${i + 1}`,
    description: `Description du séminaire ${i + 1}`,
    startAt: '2025-06-15T09:00:00Z',
    endAt: '2025-06-16T17:00:00Z',
    seminarType: 'Présentiel',
    capacity: 12,
    thumbnail: null,
  }));
}

describe('SeminarsSection', () => {
  it('renders seminars with default title', () => {
    render(<SeminarsSection seminars={createMockSeminars()} />);
    expect(screen.getByText('Nos prochains événements')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(
      <SeminarsSection
        seminars={createMockSeminars()}
        title={{ eyebrow: 'Événements', title: 'Prochains séminaires' }}
      />
    );
    expect(screen.getByText('Prochains séminaires')).toBeInTheDocument();
    expect(screen.getByText('Événements')).toBeInTheDocument();
  });

  it('renders empty state when no seminars', () => {
    render(<SeminarsSection seminars={[]} emptyMessage="Aucun événement." />);
    expect(screen.getByText('Aucun événement.')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(<SeminarsSection seminars={[]} isLoading />);
    const pulsingElements = container.querySelectorAll('.animate-pulse');
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it('renders seminar titles and descriptions', () => {
    render(<SeminarsSection seminars={createMockSeminars(2)} />);
    expect(screen.getByText('Séminaire 1')).toBeInTheDocument();
    expect(screen.getByText('Séminaire 2')).toBeInTheDocument();
    expect(screen.getByText('Description du séminaire 1')).toBeInTheDocument();
  });

  it('renders capacity with places label', () => {
    render(<SeminarsSection seminars={createMockSeminars(1)} placesLabel="places" />);
    expect(screen.getByText('12 places')).toBeInTheDocument();
  });

  it('renders seminar type badge', () => {
    render(<SeminarsSection seminars={createMockSeminars(1)} />);
    expect(screen.getByText('Présentiel')).toBeInTheDocument();
  });

  it('formats date range correctly for multi-day seminars', () => {
    const seminars = [
      {
        ...createMockSeminars(1)[0],
        startAt: '2025-06-15T09:00:00Z',
        endAt: '2025-06-17T17:00:00Z',
      },
    ];
    render(<SeminarsSection seminars={seminars} locale="fr-FR" />);
    expect(screen.getByText(/15 juin - 17 juin 2025/)).toBeInTheDocument();
  });

  it('formats single-day seminar date', () => {
    const seminars = [
      {
        ...createMockSeminars(1)[0],
        startAt: '2025-06-15T09:00:00Z',
        endAt: '2025-06-15T17:00:00Z',
      },
    ];
    render(<SeminarsSection seminars={seminars} locale="fr-FR" />);
    expect(screen.getByText('15 juin 2025')).toBeInTheDocument();
  });

  it('renders default CTA', () => {
    render(
      <SeminarsSection
        seminars={createMockSeminars(1)}
        ctaLabel="Réserver"
        ctaHref="/inscription"
      />
    );
    const cta = screen.getByText('Réserver');
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/inscription');
  });

  it('renders custom CTA component', () => {
    render(
      <SeminarsSection
        seminars={createMockSeminars(1)}
        ctaComponent={s => <button data-testid="custom-cta">{s.title}</button>}
      />
    );
    expect(screen.getByTestId('custom-cta')).toHaveTextContent('Séminaire 1');
  });

  it('sets tracking attributes', () => {
    const { container } = render(
      <SeminarsSection seminars={createMockSeminars()} trackingName="Séminaires" />
    );
    const section = container.querySelector('[data-track-section="séminaires"]');
    expect(section).toBeInTheDocument();
  });

  it('renders fallback image when no thumbnail', () => {
    const { container } = render(<SeminarsSection seminars={createMockSeminars(1)} />);
    const svgPlaceholder = container.querySelector('svg');
    expect(svgPlaceholder).toBeInTheDocument();
  });
});
