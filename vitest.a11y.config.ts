import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for accessibility (a11y) tests
 *
 * Uses jsdom environment for testing React components with axe-core
 *
 * Run with: pnpm test:a11y
 */
export default defineConfig({
  test: {
    globals: true,

    // Use jsdom environment for React component testing
    environment: 'jsdom',

    // Include only a11y test files
    include: ['**/*.a11y.test.{ts,tsx}', '**/__tests__/a11y/**/*.test.{ts,tsx}'],

    // Exclude patterns
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],

    // Coverage for a11y tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/a11y',
      include: ['packages/ui/src/**/*.tsx'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.{ts,tsx}', '**/__tests__/**'],
    },

    // Setup files for a11y tests
    setupFiles: ['./vitest.a11y.setup.ts'],

    // Longer timeouts for a11y tests (axe-core can be slow)
    testTimeout: 30000,
    hookTimeout: 30000,

    // Reporter
    reporters: ['verbose'],

    // Sequential execution for component tests
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },

  resolve: {
    alias: {
      '@kairn/core': path.resolve(__dirname, 'packages/core/src'),
      '@kairn/config': path.resolve(__dirname, 'packages/config/src'),
      '@kairn/ui': path.resolve(__dirname, 'packages/ui/src'),
    },
  },
});
