import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for UI component tests
 *
 * Uses jsdom environment for testing React components
 *
 * Run with: pnpm test:ui
 */
export default defineConfig({
  test: {
    globals: true,

    // Use jsdom environment for React component testing
    environment: 'jsdom',

    // Include UI test files
    include: [
      'packages/ui/src/**/*.test.{ts,tsx}',
      'packages/ui/src/**/*.spec.{ts,tsx}',
      '!packages/ui/src/**/*.a11y.test.{ts,tsx}',
    ],

    // Exclude patterns
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],

    // Coverage for UI tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/ui',
      include: ['packages/ui/src/**/*.tsx'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.{ts,tsx}', '**/__tests__/**'],
    },

    // Setup files for UI tests
    setupFiles: ['./vitest.ui.setup.ts'],

    // Timeouts
    testTimeout: 15000,
    hookTimeout: 15000,

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
