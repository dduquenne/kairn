/**
 * BlogSection Component Tests
 *
 * Tests for the reusable BlogSection component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import type { BlogSectionPost } from '../blog-section';
import { BlogSection } from '../blog-section';

/** Create mock blog posts */
function createMockPosts(count = 3): BlogSectionPost[] {
  return Array.from({ length: count }, (_, i) => ({
    slug: `article-${i + 1}`,
    title: `Article ${i + 1}`,
    description: `Description de l'article ${i + 1}`,
    category: 'Tech',
    date: '2025-01-15T10:00:00Z',
    image: `/images/blog/article-${i + 1}.webp`,
  }));
}

describe('BlogSection', () => {
  it('renders posts with default title', () => {
    render(<BlogSection posts={createMockPosts()} />);
    expect(screen.getByText('Nos derniers articles')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(
      <BlogSection
        posts={createMockPosts()}
        title={{ eyebrow: 'Blog', title: 'Articles récents', description: 'Nos articles.' }}
      />
    );
    expect(screen.getByText('Articles récents')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
  });

  it('renders nothing when posts array is empty', () => {
    const { container } = render(<BlogSection posts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(<BlogSection posts={[]} isLoading />);
    const pulsingElements = container.querySelectorAll('.animate-pulse');
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it('renders post titles and descriptions', () => {
    render(<BlogSection posts={createMockPosts(2)} />);
    expect(screen.getByText('Article 1')).toBeInTheDocument();
    expect(screen.getByText('Article 2')).toBeInTheDocument();
    expect(screen.getByText("Description de l'article 1")).toBeInTheDocument();
  });

  it('renders category badges', () => {
    render(<BlogSection posts={createMockPosts(1)} />);
    expect(screen.getByText('Tech')).toBeInTheDocument();
  });

  it('applies category colors', () => {
    const posts = createMockPosts(1);
    posts[0].category = 'Design';
    render(
      <BlogSection
        posts={posts}
        categoryColors={{
          Design: {
            bg: 'bg-pink-500/20',
            text: 'text-pink-300',
            gradient: 'from-pink-500 to-pink-600',
          },
        }}
      />
    );
    expect(screen.getByText('Design')).toBeInTheDocument();
  });

  it('renders default CTA link', () => {
    render(<BlogSection posts={createMockPosts()} ctaLabel="Voir tout" ctaHref="/blog" />);
    const ctaLink = screen.getByText('Voir tout');
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink.closest('a')).toHaveAttribute('href', '/blog');
  });

  it('renders custom CTA component', () => {
    render(
      <BlogSection
        posts={createMockPosts()}
        ctaComponent={<button data-testid="custom-cta">Custom CTA</button>}
      />
    );
    expect(screen.getByTestId('custom-cta')).toBeInTheDocument();
  });

  it('formats dates with the specified locale', () => {
    const posts = [{ ...createMockPosts(1)[0], date: '2025-03-15T10:00:00Z' }];
    render(<BlogSection posts={posts} locale="fr-FR" />);
    expect(screen.getByText('15 mars 2025')).toBeInTheDocument();
  });

  it('sets tracking attributes', () => {
    const { container } = render(<BlogSection posts={createMockPosts()} trackingName="Blog" />);
    const section = container.querySelector('[data-track-section="blog"]');
    expect(section).toBeInTheDocument();
  });
});
