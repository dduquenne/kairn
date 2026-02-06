/**
 * BlogCard Component Tests
 *
 * Tests for the BlogCard component including:
 * - Rendering with various props
 * - Image handling
 * - Click interactions
 * - Accessibility
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { BlogCard, type BlogCardProps } from '../BlogCard';
import type { BlogPostSummary } from '../types';

/**
 * Create a mock blog post
 */
function createMockPost(overrides: Partial<BlogPostSummary> = {}): BlogPostSummary {
  return {
    id: 'post-123',
    slug: 'test-post',
    title: 'Test Blog Post Title',
    excerpt: 'This is a test excerpt for the blog post.',
    date: '2024-01-15T10:00:00Z',
    category: 'Hypnose',
    tags: ['wellness', 'therapy', 'mindfulness'],
    readingTime: '5 min read',
    ...overrides,
  };
}

/**
 * Render BlogCard with default props
 */
function renderBlogCard(props: Partial<BlogCardProps> = {}) {
  const defaultProps: BlogCardProps = {
    post: createMockPost(),
    ...props,
  };

  return render(<BlogCard {...defaultProps} />);
}

describe('BlogCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch for image checking
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false, // Default: image doesn't exist
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render post title', () => {
      renderBlogCard();

      expect(screen.getByRole('heading', { name: /test blog post title/i })).toBeInTheDocument();
    });

    it('should render post excerpt', () => {
      renderBlogCard();

      expect(screen.getByText(/this is a test excerpt/i)).toBeInTheDocument();
    });

    it('should render post category', () => {
      const post = createMockPost({ category: 'Psychothérapie' });
      renderBlogCard({ post });

      expect(screen.getByText('Psychothérapie')).toBeInTheDocument();
    });

    it('should render formatted date', () => {
      const post = createMockPost({ date: '2024-01-15T10:00:00Z' });
      renderBlogCard({ post, dateLocale: 'fr-FR' });

      // The date should be formatted in French
      expect(screen.getByText(/15 janvier 2024/i)).toBeInTheDocument();
    });

    it('should render reading time', () => {
      const post = createMockPost({ readingTime: '8 min read' });
      renderBlogCard({ post });

      expect(screen.getByText('8 min read')).toBeInTheDocument();
    });

    it('should render up to 3 tags', () => {
      const post = createMockPost({
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      });
      renderBlogCard({ post });

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.queryByText('tag4')).not.toBeInTheDocument();
    });

    it('should show remaining tags count when more than 3', () => {
      const post = createMockPost({
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      });
      renderBlogCard({ post });

      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should not show tags section when no tags', () => {
      const post = createMockPost({ tags: [] });
      renderBlogCard({ post });

      // No tag elements should be rendered
      expect(screen.queryByText(/tag/i)).not.toBeInTheDocument();
    });

    it('should render as article element', () => {
      renderBlogCard();

      // Either article or the wrapper component renders
      const container = screen
        .getByRole('heading', { name: /test blog post title/i })
        .closest('article');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should link to correct blog post URL', () => {
      const post = createMockPost({ slug: 'my-test-post' });
      renderBlogCard({ post, blogBaseUrl: '/blog' });

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/blog/my-test-post');
    });

    it('should use custom blog base URL', () => {
      const post = createMockPost({ slug: 'my-post' });
      renderBlogCard({ post, blogBaseUrl: '/articles' });

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/articles/my-post');
    });

    it('should use custom link component', () => {
      const CustomLink = vi.fn(({ href, children, className }) => (
        <a href={href} className={className} data-testid="custom-link">
          {children}
        </a>
      ));

      renderBlogCard({ linkComponent: CustomLink });

      expect(screen.getByTestId('custom-link')).toBeInTheDocument();
      expect(CustomLink).toHaveBeenCalled();
    });
  });

  describe('Images', () => {
    it('should check if image exists on mount', async () => {
      const post = createMockPost({ slug: 'my-post' });
      renderBlogCard({ post, imageBaseUrl: '/images/blog' });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/images/blog/my-post.webp', { method: 'HEAD' });
      });
    });

    it('should use imageUrl from post if provided', async () => {
      const post = createMockPost({ imageUrl: '/custom/image.jpg' });
      renderBlogCard({ post });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/custom/image.jpg', { method: 'HEAD' });
      });
    });

    it('should use custom resolveImageUrl function', async () => {
      const resolveImageUrl = vi.fn().mockReturnValue('/resolved/image.png');
      const post = createMockPost();
      renderBlogCard({ post, resolveImageUrl });

      expect(resolveImageUrl).toHaveBeenCalledWith(post);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/resolved/image.png', { method: 'HEAD' });
      });
    });

    it('should render image when it exists and imageComponent provided', async () => {
      // Mock image exists
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const ImageComp = ({ src, alt }: { src: string; alt: string }) => (
        <img src={src} alt={alt} data-testid="custom-image" />
      );

      renderBlogCard({ imageComponent: ImageComp });

      await waitFor(() => {
        expect(screen.getByTestId('custom-image')).toBeInTheDocument();
      });
    });

    it('should not render image when it does not exist', async () => {
      // Mock image doesn't exist
      global.fetch = vi.fn().mockResolvedValue({ ok: false });

      const ImageComp = ({ src, alt }: { src: string; alt: string }) => (
        <img src={src} alt={alt} data-testid="custom-image" />
      );

      renderBlogCard({ imageComponent: ImageComp });

      await waitFor(() => {
        expect(screen.queryByTestId('custom-image')).not.toBeInTheDocument();
      });
    });

    it('should handle image fetch errors gracefully', async () => {
      // Mock fetch error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      renderBlogCard();

      // Component should render without crashing
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /test blog post title/i })).toBeInTheDocument();
      });
    });
  });

  describe('Category Colors', () => {
    it('should use getCategoryColors function', () => {
      const getCategoryColors = vi.fn().mockReturnValue({
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        hover: 'hover:border-blue-400',
        gradient: 'from-blue-500 to-blue-300',
      });

      const post = createMockPost({ category: 'Tech' });
      renderBlogCard({ post, getCategoryColors });

      expect(getCategoryColors).toHaveBeenCalledWith('Tech');
    });

    it('should use default colors when getCategoryColors not provided', () => {
      renderBlogCard();

      // Should render without errors using default gold colors
      expect(screen.getByRole('heading', { name: /test blog post title/i })).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should apply animation wrapper when motionComponent provided', () => {
      const Motion = ({
        children,
        ...props
      }: {
        children: React.ReactNode;
        className?: string;
      }) => (
        <div data-testid="motion-wrapper" {...props}>
          {children}
        </div>
      );

      renderBlogCard({ motionComponent: Motion, animate: true });

      expect(screen.getByTestId('motion-wrapper')).toBeInTheDocument();
    });

    it('should not apply animation props when animate is false', () => {
      const Motion = vi.fn(({ children }) => <div>{children}</div>);

      renderBlogCard({ motionComponent: Motion, animate: false });

      expect(Motion).toHaveBeenCalledWith(
        expect.not.objectContaining({
          initial: expect.anything(),
          animate: expect.anything(),
        }),
        expect.anything()
      );
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = renderBlogCard({ className: 'custom-card-class' });

      const article = container.querySelector('.custom-card-class');
      expect(article).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderBlogCard();

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('should have link with accessible name', () => {
      renderBlogCard();

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should render time element with datetime attribute', () => {
      const post = createMockPost({ date: '2024-01-15T10:00:00Z' });
      renderBlogCard({ post });

      const timeElement = screen.getByText(/janvier/i).closest('time');
      expect(timeElement).toHaveAttribute('datetime', '2024-01-15T10:00:00Z');
    });
  });
});
