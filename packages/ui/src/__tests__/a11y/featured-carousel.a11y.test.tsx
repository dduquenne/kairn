/**
 * Accessibility tests for FeaturedCarousel component
 *
 * Tests WCAG 2.1 AA compliance for carousel pattern
 */

import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { axe } from 'vitest-axe';

import { FeaturedCarousel } from '../../components/blog/FeaturedCarousel';

// Mock fetch for image checks
global.fetch = vi.fn().mockResolvedValue({ ok: false });

afterEach(cleanup);

const mockPosts = [
  {
    slug: 'post-1',
    title: 'Premier article',
    excerpt: 'Description du premier article',
    category: 'Hypnose',
    date: '2024-01-01',
    readingTime: '5 min',
    tags: ['tag1'],
    imageUrl: null,
  },
  {
    slug: 'post-2',
    title: 'Deuxième article',
    excerpt: 'Description du deuxième article',
    category: 'Sophrologie',
    date: '2024-01-02',
    readingTime: '3 min',
    tags: ['tag2'],
    imageUrl: null,
  },
  {
    slug: 'post-3',
    title: 'Troisième article',
    excerpt: 'Description du troisième article',
    category: 'Bien-être',
    date: '2024-01-03',
    readingTime: '7 min',
    tags: [],
    imageUrl: null,
  },
  {
    slug: 'post-4',
    title: 'Quatrième article',
    excerpt: 'Description du quatrième article',
    category: 'Hypnose',
    date: '2024-01-04',
    readingTime: '4 min',
    tags: ['tag4'],
    imageUrl: null,
  },
];

describe('FeaturedCarousel - Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<FeaturedCarousel posts={mockPosts} title="Articles à la une" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have region role with aria-roledescription carousel', () => {
    const { container } = render(<FeaturedCarousel posts={mockPosts} title="Articles à la une" />);
    const carousel = container.querySelector('[aria-roledescription="carousel"]');
    expect(carousel).toBeTruthy();
    expect(carousel?.getAttribute('role')).toBe('region');
    expect(carousel?.getAttribute('aria-label')).toBe('Articles à la une');
  });

  it('should have accessible navigation buttons in French', () => {
    const { container } = render(<FeaturedCarousel posts={mockPosts} title="Articles à la une" />);
    const prevButton = container.querySelector('[aria-label="Page précédente"]');
    const nextButton = container.querySelector('[aria-label="Page suivante"]');
    expect(prevButton).toBeTruthy();
    expect(nextButton).toBeTruthy();
  });

  it('should have accessible page indicators', () => {
    const { container } = render(
      <FeaturedCarousel posts={mockPosts} itemsPerPage={2} title="Articles" />
    );
    const pageButtons = container.querySelectorAll('button[aria-label^="Aller à la page"]');
    expect(pageButtons.length).toBeGreaterThan(0);
  });

  it('should have aria-current on active page indicator', () => {
    const { container } = render(
      <FeaturedCarousel posts={mockPosts} itemsPerPage={2} title="Articles" />
    );
    const activeButton = container.querySelector(
      'button[aria-label^="Aller à la page"][aria-current="true"]'
    );
    expect(activeButton).toBeTruthy();
  });

  it('should have aria-live on content area', () => {
    const { container } = render(<FeaturedCarousel posts={mockPosts} title="Articles" />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeTruthy();
  });

  it('should have decorative SVGs with aria-hidden', () => {
    const { container } = render(<FeaturedCarousel posts={mockPosts} title="Articles" />);
    const arrowSvgs = container.querySelectorAll('button svg[aria-hidden="true"]');
    expect(arrowSvgs.length).toBeGreaterThan(0);
  });

  it('should return null for empty posts array', () => {
    const { container } = render(<FeaturedCarousel posts={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
