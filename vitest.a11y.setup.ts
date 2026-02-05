/**
 * Vitest setup file for accessibility (a11y) tests
 *
 * Configures jsdom environment and vitest-axe matchers
 */

import { beforeAll, afterAll, afterEach, expect, vi } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

// Extend vitest matchers with axe accessibility matchers
expect.extend(matchers);

// Mock window.matchMedia for responsive components
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock scrollTo for components that use scroll behavior
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
  });

  // Mock IntersectionObserver for lazy loading components
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver for responsive components
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global cleanup
afterAll(() => {
  vi.restoreAllMocks();
});

// Declare types for vitest-axe matchers
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
