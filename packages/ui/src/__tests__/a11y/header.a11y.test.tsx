/**
 * Accessibility tests for Header component
 *
 * Tests WCAG 2.1 AA compliance for site navigation
 */

import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { axe } from 'vitest-axe';

import { Header } from '../../components/header';

afterEach(cleanup);

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ArrowLeft: (props: Record<string, unknown>) => (
    <span data-testid="arrow-left" {...props}>
      ←
    </span>
  ),
}));

describe('Header - Accessibility', () => {
  const defaultProps = {
    siteName: 'Test Site',
    tagline: 'Test Tagline',
    subtitle: 'Test Subtitle',
    primaryCta: { label: 'Contact', href: '/contact' },
    secondaryCta: { label: 'About', href: '/about' },
  };

  it('should have no accessibility violations in home context', async () => {
    const { container } = render(<Header {...defaultProps} context="home" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in blog-list context', async () => {
    const { container } = render(<Header {...defaultProps} context="blog-list" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in appointment context', async () => {
    const { container } = render(<Header {...defaultProps} context="appointment" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have banner role on header element', () => {
    const { getByRole } = render(<Header {...defaultProps} />);
    const banner = getByRole('banner');
    expect(banner).toBeTruthy();
  });

  it('should have navigation landmark with accessible name', () => {
    const { getByRole } = render(<Header {...defaultProps} />);
    const nav = getByRole('navigation', { name: /navigation principale/i });
    expect(nav).toBeTruthy();
  });

  it('should have navigation landmark with id for skip link target', () => {
    const { container } = render(<Header {...defaultProps} />);
    const nav = container.querySelector('#main-navigation');
    expect(nav).toBeTruthy();
  });

  it('should have accessible link to home with aria-label', () => {
    const { getAllByRole } = render(<Header {...defaultProps} />);
    const homeLinks = getAllByRole('link').filter(link =>
      link.getAttribute('aria-label')?.includes('accueil')
    );
    expect(homeLinks.length).toBeGreaterThan(0);
  });

  it('should include skip links component', () => {
    const { container } = render(<Header {...defaultProps} />);
    const skipLinks = container.querySelectorAll('.skip-link');
    expect(skipLinks.length).toBeGreaterThan(0);
  });

  it('should have decorative icons marked with aria-hidden', () => {
    const { container } = render(
      <Header {...defaultProps} context="blog-article" showBackButton />
    );
    const arrowIcons = container.querySelectorAll('[aria-hidden="true"]');
    expect(arrowIcons.length).toBeGreaterThan(0);
  });
});
