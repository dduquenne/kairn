/**
 * Accessibility tests for SkipLinks component
 *
 * Tests WCAG 2.1 AA compliance for skip link navigation
 */

import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { axe } from 'vitest-axe';

import { SkipLinks } from '../../components/skip-links';

afterEach(cleanup);

describe('SkipLinks - Accessibility', () => {
  it('should have no accessibility violations with default links', async () => {
    const { container } = render(<SkipLinks />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with custom links', async () => {
    const customLinks = [
      { targetId: 'main-content', label: 'Skip to main content' },
      { targetId: 'search', label: 'Skip to search' },
      { targetId: 'footer', label: 'Skip to footer' },
    ];

    const { container } = render(<SkipLinks links={customLinks} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render navigation landmark with accessible name', () => {
    const { container } = render(<SkipLinks />);
    const nav = container.querySelector('[role="navigation"]');
    expect(nav).not.toBeNull();
    expect(nav?.getAttribute('aria-label')).toBeTruthy();
  });

  it('should render skip links as anchor elements', () => {
    const { container } = render(<SkipLinks />);
    const links = container.querySelectorAll('.skip-link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should have valid href attributes pointing to page sections', () => {
    const { container } = render(<SkipLinks />);
    const links = container.querySelectorAll('.skip-link');

    links.forEach(link => {
      const href = link.getAttribute('href');
      expect(href).toMatch(/^#[a-zA-Z]/);
    });
  });

  it('should have descriptive link text', () => {
    const { container } = render(<SkipLinks />);
    const links = container.querySelectorAll('.skip-link');

    links.forEach(link => {
      const text = link.textContent?.trim();
      expect(text).toBeTruthy();
      expect(text?.length).toBeGreaterThan(0);
    });
  });
});
