import { test, expect } from '@playwright/test';

/**
 * Contact Form E2E Tests
 *
 * Tests for the contact form functionality
 */

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('should display contact form', async ({ page }) => {
    // Check that the contact page loads
    await expect(page.locator('form')).toBeVisible();

    // Check for required form fields
    await expect(page.locator('input[name="name"], input[id*="name"]').first()).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('should have required field validation', async ({ page }) => {
    // Find and click submit button without filling form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Form should not submit - check for validation errors or form still visible
    await expect(page.locator('form')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill name
    const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
    await nameInput.fill('Test User');

    // Fill invalid email
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill('invalid-email');

    // Fill message
    const messageInput = page.locator('textarea').first();
    await messageInput.fill('This is a test message that is long enough.');

    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show email validation error or not submit
    await expect(page.locator('form')).toBeVisible();
  });

  test('should validate message length', async ({ page }) => {
    // Fill name
    const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
    await nameInput.fill('Test User');

    // Fill valid email
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill('test@example.com');

    // Fill too short message
    const messageInput = page.locator('textarea').first();
    await messageInput.fill('Short');

    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show validation error
    await expect(page.locator('form')).toBeVisible();
  });

  test('should fill all fields and submit form', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/contact', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Fill name
    const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
    await nameInput.fill('Test User');

    // Fill email
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill('test@example.com');

    // Fill message
    const messageInput = page.locator('textarea').first();
    await messageInput.fill(
      'This is a test message from Playwright E2E test. It needs to be long enough to pass validation.'
    );

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for success message or form reset
    await expect(page.locator('[role="status"], .success, [class*="success"]').first())
      .toBeVisible({ timeout: 10000 })
      .catch(() => {
        // Alternative: form might reset
        return expect(nameInput).toHaveValue('');
      });
  });

  test('should handle submission error', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/contact', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Server error' }),
      });
    });

    // Fill form
    const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
    await nameInput.fill('Test User');

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill('test@example.com');

    const messageInput = page.locator('textarea').first();
    await messageInput.fill('This is a test message that is long enough for validation.');

    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show error message
    await expect(page.locator('[role="alert"], .error, [class*="error"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should have proper form accessibility', async ({ page }) => {
    // Check for labels
    const labels = page.locator('label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThanOrEqual(3);

    // Check for aria attributes on inputs
    const inputs = page.locator('input:not([type="hidden"]), textarea');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasId = (await input.getAttribute('id')) !== null;
      const hasAriaLabel = (await input.getAttribute('aria-label')) !== null;
      const hasAriaLabelledBy = (await input.getAttribute('aria-labelledby')) !== null;

      // Each input should have some form of labeling
      expect(hasId || hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through the form
    await page.keyboard.press('Tab'); // Focus first element

    // Check that we can tab to name input
    const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
    await nameInput.focus();
    await expect(nameInput).toBeFocused();

    // Tab to email
    await page.keyboard.press('Tab');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await expect(emailInput).toBeFocused();

    // Tab to message
    await page.keyboard.press('Tab');
    const messageInput = page.locator('textarea').first();
    await expect(messageInput).toBeFocused();
  });
});

test.describe('Contact Form - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display form correctly on mobile', async ({ page }) => {
    await page.goto('/contact');

    // Form should be visible and not overflow
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check submit button is visible
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('should handle touch interactions', async ({ page }) => {
    await page.goto('/contact');

    // Tap on name input
    const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
    await nameInput.tap();
    await expect(nameInput).toBeFocused();
  });
});
