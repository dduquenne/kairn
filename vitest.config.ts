import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Global test configuration
    globals: true,

    // Test environment
    environment: 'node',

    // Include patterns
    include: [
      'packages/**/*.test.ts',
      'packages/**/*.spec.ts',
      'apps/**/__tests__/**/*.test.ts',
      'apps/**/__tests__/**/*.spec.ts',
    ],

    // Exclude patterns
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Focus on core packages that should have unit tests
      include: ['packages/core/src/**/*.ts', 'packages/api/src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts', // Usually just re-exports
        '**/__tests__/**',
        '**/types.ts', // Type-only files
        // Exclude files that are better tested through integration/e2e
        'packages/*/src/scheduler/**', // QStash scheduler - external service
        'packages/*/src/db/**', // DB client - integration test
        // API handlers better tested through E2E
        'packages/api/src/handlers/analytics/**', // Analytics requires real events
        'packages/api/src/handlers/auth/forgot-password.ts', // Email-dependent
        'packages/api/src/handlers/auth/logout.ts', // Simple cookie clearing
        'packages/api/src/handlers/auth/refresh.ts', // Token refresh - integration test
        'packages/api/src/handlers/blog/tags.ts', // Simple CRUD
        // Middleware better tested through integration
        'packages/api/src/middleware/with-admin.ts', // Requires auth context
        'packages/api/src/middleware/with-auth.ts', // Requires auth context
        'packages/api/src/middleware/with-csrf.ts', // Requires request context
        'packages/api/src/middleware/with-rate-limit.ts', // Already tested in core
        // Utils better tested through integration
        'packages/api/src/utils/filters.ts', // Filtering logic - integration
        'packages/api/src/utils/pagination.ts', // Pagination logic - integration
      ],
      // Coverage thresholds for core packages
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
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
