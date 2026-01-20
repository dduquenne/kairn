import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Global test configuration
    globals: true,

    // Test environment
    environment: 'node',

    // Include patterns
    include: ['packages/**/*.test.ts', 'packages/**/*.spec.ts'],

    // Exclude patterns
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['packages/*/src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts', // Usually just re-exports
        '**/__tests__/**',
      ],
      // Coverage thresholds
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },

    // Setup files
    setupFiles: ['./vitest.setup.ts'],

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter
    reporters: ['verbose'],

    // Watch mode exclude
    watchExclude: ['**/node_modules/**', '**/dist/**'],

    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
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
