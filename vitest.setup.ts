/**
 * Vitest Global Setup
 *
 * This file runs before all tests and sets up the test environment.
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';

// Default test environment variables
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-here';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-here';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Global hooks
beforeAll(() => {
  // Setup that runs once before all tests
});

afterAll(() => {
  // Cleanup that runs once after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

// Extend expect with custom matchers if needed
// expect.extend({
//   toBeValidEmail(received: string) {
//     const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
//     return {
//       pass,
//       message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
//     };
//   },
// });
