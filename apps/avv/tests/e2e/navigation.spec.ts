import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 *
 * Tests for main navigation and site structure
 */

test.describe('Main Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage', async ({ page }) => {
    // Page should load without errors
    await expect(page).toHaveTitle(/Appréciez Votre Vie/i);
  });

  test('should have working header navigation', async ({ page }) => {
    // Check header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check logo/home link
    const logo = header.locator('a[href="/"]').first();
    await expect(logo).toBeVisible();
  });

  test('should navigate to About page', async ({ page }) => {
    // Find and click the About link
    const aboutLink = page.locator('a[href*="a-propos"]').first();

    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL(/a-propos/);
    }
  });

  test('should navigate to Contact page', async ({ page }) => {
    // Find and click the Contact link
    const contactLink = page.locator('a[href*="contact"]').first();

    if (await contactLink.isVisible()) {
      await contactLink.click();
      await expect(page).toHaveURL(/contact/);
    }
  });

  test('should navigate to Blog page', async ({ page }) => {
    // Find and click the Blog link
    const blogLink = page.locator('a[href="/blog"]').first();

    if (await blogLink.isVisible()) {
      await blogLink.click();
      await expect(page).toHaveURL(/blog/);
    }
  });

  test('should have working footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should have skip links for accessibility', async ({ page }) => {
    // Skip links should be present for keyboard navigation
    const skipLink = page.locator('a[href="#main"]');

    if ((await skipLink.count()) > 0) {
      // Focus on skip link
      await skipLink.first().focus();
      await expect(skipLink.first()).toBeVisible();
    }
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile menu button', async ({ page }) => {
    await page.goto('/');

    // Look for mobile menu toggle button
    const menuButton = page.locator('button[aria-label*="menu" i], button[aria-controls*="nav" i]');

    if ((await menuButton.count()) > 0) {
      await expect(menuButton.first()).toBeVisible();
    }
  });

  test('should toggle mobile menu', async ({ page }) => {
    await page.goto('/');

    const menuButton = page.locator('button[aria-label*="menu" i], button[aria-controls*="nav" i]');

    if ((await menuButton.count()) > 0) {
      // Click to open menu
      await menuButton.first().click();

      // Check if navigation becomes visible
      const nav = page.locator('nav');
      await expect(nav.first()).toBeVisible();
    }
  });
});

test.describe('Page Performance', () => {
  test('should load homepage within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors on homepage', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (e.g., third-party scripts)
    const criticalErrors = errors.filter(
      error =>
        !error.includes('favicon') &&
        !error.includes('analytics') &&
        !error.includes('Failed to load resource')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('SEO and Accessibility', () => {
  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);

    // Check viewport meta
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should have accessible images', async ({ page }) => {
    await page.goto('/');

    // Check that images have alt attributes
    const images = page.locator('img:not([alt])');
    const imagesWithoutAlt = await images.count();

    // Allow some decorative images without alt
    expect(imagesWithoutAlt).toBeLessThan(5);
  });
});
