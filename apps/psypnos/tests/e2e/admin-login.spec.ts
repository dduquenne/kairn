import { test, expect } from '@playwright/test';

/**
 * Admin Login E2E Tests
 *
 * Tests for admin authentication flow
 */

test.describe('Admin Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    // Page should load
    await expect(page).toHaveURL(/login/);

    // Should have login form
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('should have email and password fields', async ({ page }) => {
    // Email field
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Password field
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('should have submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('should show error for empty form submission', async ({ page }) => {
    // Click submit without filling form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show validation error or form should not submit
    await expect(page).toHaveURL(/login/);
  });

  test('should show error for invalid email format', async ({ page }) => {
    // Fill invalid email
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await emailInput.fill('invalid-email');

    // Fill password
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');

    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show error or stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Identifiants invalides' },
        }),
      });
    });

    // Fill email
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await emailInput.fill('admin@example.com');

    // Fill password
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('wrongpassword');

    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show error message
    await expect(page.locator('[role="alert"], .error, [class*="error"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should redirect to admin on successful login', async ({ page }) => {
    // Mock successful login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'user-123',
            email: 'admin@psypnos.fr',
            role: 'admin',
          },
        }),
        headers: {
          'Set-Cookie': 'psypnos_admin_token=mock-token; Path=/; HttpOnly',
        },
      });
    });

    // Fill email
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await emailInput.fill('admin@psypnos.fr');

    // Fill password
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('correctpassword');

    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should redirect to admin
    await expect(page).toHaveURL(/admin/, { timeout: 10000 });
  });

  test('should handle rate limiting', async ({ page }) => {
    // Mock rate limit response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Trop de tentatives. Veuillez réessayer plus tard.',
          },
        }),
      });
    });

    // Fill and submit form
    await page.locator('input[type="email"], input[name="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('password');
    await page.locator('button[type="submit"]').click();

    // Should show rate limit error
    await expect(page.locator('[role="alert"], .error, [class*="error"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should have proper form accessibility', async ({ page }) => {
    // Check for labels
    const emailLabel = page.locator('label[for*="email" i], label:has-text("email")');
    const passwordLabel = page.locator('label[for*="password" i], label:has-text("mot de passe")');

    // Should have labels
    const hasLabels = (await emailLabel.count()) > 0 || (await passwordLabel.count()) > 0;
    expect(hasLabels).toBeTruthy();

    // Check for autocomplete attributes
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const autocomplete = await emailInput.getAttribute('autocomplete');
    // Should have autocomplete for better UX
    expect(autocomplete).not.toBeNull();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab to email
    await page.keyboard.press('Tab');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeFocused();

    // Tab to password
    await page.keyboard.press('Tab');
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeFocused();

    // Tab to submit
    await page.keyboard.press('Tab');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeFocused();
  });

  test('should toggle password visibility if feature exists', async ({ page }) => {
    const toggleButton = page.locator(
      'button[aria-label*="password" i], button[class*="toggle"], button[class*="show"]'
    );

    if ((await toggleButton.count()) > 0) {
      const passwordInput = page.locator('input[type="password"]');

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle
      await toggleButton.click();

      // Password should be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});

test.describe('Admin Login - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display login form on mobile', async ({ page }) => {
    await page.goto('/login');

    // Form should be visible
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Submit button should be visible
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('should handle mobile keyboard', async ({ page }) => {
    await page.goto('/login');

    // Tap on email input
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await emailInput.tap();
    await expect(emailInput).toBeFocused();
  });
});

test.describe('Protected Admin Routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try to access admin directly
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login for specific admin pages', async ({ page }) => {
    // Try to access admin blog
    await page.goto('/admin/blog');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
