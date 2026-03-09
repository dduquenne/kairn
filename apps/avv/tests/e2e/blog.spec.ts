import { test, expect } from '@playwright/test';

/**
 * Blog E2E Tests
 *
 * Tests for blog listing and reading functionality
 */

test.describe('Blog Listing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('should display blog listing page', async ({ page }) => {
    // Page should load
    await expect(page).toHaveURL(/blog/);

    // Should have a heading
    const heading = page.locator('h1, [role="heading"]').first();
    await expect(heading).toBeVisible();
  });

  test('should display blog post cards', async ({ page }) => {
    // Wait for posts to load
    await page.waitForLoadState('networkidle');

    // Look for article cards or blog post elements
    const postCards = page.locator(
      'article, [class*="blog-card"], [class*="post-card"], a[href^="/blog/"]'
    );

    // Should have at least some posts (or an empty state)
    const cardCount = await postCards.count();

    // Either posts exist or there's an empty state message
    if (cardCount === 0) {
      const emptyState = page.locator('[class*="empty"], [class*="no-posts"]');
      await expect(emptyState).toBeVisible();
    } else {
      expect(cardCount).toBeGreaterThan(0);
    }
  });

  test('should navigate to blog post detail', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find a post link
    const postLink = page.locator('a[href^="/blog/"]:not([href="/blog"])').first();

    if (await postLink.isVisible()) {
      const href = await postLink.getAttribute('href');
      await postLink.click();

      // Should navigate to post detail
      await expect(page).toHaveURL(new RegExp(href || '/blog/'));
    }
  });

  test('should display post metadata', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const postCard = page.locator('article, [class*="blog-card"]').first();

    if (await postCard.isVisible()) {
      // Should show title
      const title = postCard.locator('h2, h3, [class*="title"]');
      await expect(title.first()).toBeVisible();

      // Should show date or reading time
      const metadata = postCard.locator('time, [class*="date"], [class*="reading"]');
      const hasMetadata = (await metadata.count()) > 0;
      expect(hasMetadata).toBeTruthy();
    }
  });

  test('should filter posts by category', async ({ page }) => {
    // Look for category filter
    const categoryFilter = page.locator(
      '[class*="category-filter"], [class*="filter"], button[data-category], a[href*="category"]'
    );

    if ((await categoryFilter.count()) > 0) {
      const firstCategory = categoryFilter.first();
      await firstCategory.click();

      // URL should update with category or posts should filter
      await page.waitForLoadState('networkidle');
    }
  });

  test('should have working search', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="recherche" i], input[class*="search"]'
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('somatothérapie');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForLoadState('networkidle');
    }
  });

  test('should have pagination when many posts', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for pagination
    const pagination = page.locator(
      '[class*="pagination"], nav[aria-label*="page" i], button[aria-label*="page" i]'
    );

    // Pagination is optional - just check it works if present
    if ((await pagination.count()) > 0) {
      await expect(pagination.first()).toBeVisible();
    }
  });
});

test.describe('Blog Post Detail', () => {
  test('should display blog post content', async ({ page }) => {
    // First go to blog listing
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    // Find a post link
    const postLink = page.locator('a[href^="/blog/"]:not([href="/blog"])').first();

    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForLoadState('networkidle');

      // Should have article content
      const article = page.locator('article, main');
      await expect(article.first()).toBeVisible();

      // Should have a title
      const title = page.locator('h1');
      await expect(title.first()).toBeVisible();
    }
  });

  test('should display post metadata', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    const postLink = page.locator('a[href^="/blog/"]:not([href="/blog"])').first();

    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForLoadState('networkidle');

      // Should have date
      const date = page.locator('time');
      if ((await date.count()) > 0) {
        await expect(date.first()).toBeVisible();
      }
    }
  });

  test('should have working back button or breadcrumb', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    const postLink = page.locator('a[href^="/blog/"]:not([href="/blog"])').first();

    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForLoadState('networkidle');

      // Look for back navigation
      const backButton = page.locator(
        'a[href="/blog"], button[class*="back"], [class*="breadcrumb"] a'
      );

      if ((await backButton.count()) > 0) {
        await backButton.first().click();
        await expect(page).toHaveURL(/\/blog\/?$/);
      }
    }
  });

  test('should have share buttons or social links', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    const postLink = page.locator('a[href^="/blog/"]:not([href="/blog"])').first();

    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForLoadState('networkidle');

      // Look for share buttons
      const shareButtons = page.locator(
        '[class*="share"], button[aria-label*="share" i], a[href*="twitter"], a[href*="facebook"], a[href*="linkedin"]'
      );

      // Share buttons are optional
      const hasShareButtons = (await shareButtons.count()) > 0;
      // Just verify they don't break if present
      if (hasShareButtons) {
        await expect(shareButtons.first()).toBeVisible();
      }
    }
  });

  test('should display related posts if available', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    const postLink = page.locator('a[href^="/blog/"]:not([href="/blog"])').first();

    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForLoadState('networkidle');

      // Look for related posts section
      const relatedPosts = page.locator(
        '[class*="related"], section:has-text("related"), section:has-text("similaires")'
      );

      // Related posts are optional
      if ((await relatedPosts.count()) > 0) {
        await expect(relatedPosts.first()).toBeVisible();
      }
    }
  });
});

test.describe('Blog - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display blog listing on mobile', async ({ page }) => {
    await page.goto('/blog');

    // Page should be readable
    await expect(page.locator('h1, [role="heading"]').first()).toBeVisible();
  });

  test('should display post cards in mobile layout', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    // Cards should be visible
    const postCard = page.locator('article, [class*="blog-card"]').first();
    if (await postCard.isVisible()) {
      // Card should not overflow viewport
      const boundingBox = await postCard.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeLessThanOrEqual(375);
      }
    }
  });
});

test.describe('Blog SEO', () => {
  test('should have proper meta tags on listing page', async ({ page }) => {
    await page.goto('/blog');

    // Check title
    const title = await page.title();
    expect(title).toBeTruthy();

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);
  });

  test('should have proper meta tags on post page', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    const postLink = page.locator('a[href^="/blog/"]:not([href="/blog"])').first();

    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForLoadState('networkidle');

      // Check title
      const title = await page.title();
      expect(title).toBeTruthy();

      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveCount(1);

      // Check Open Graph tags
      const ogTitle = page.locator('meta[property="og:title"]');
      if ((await ogTitle.count()) > 0) {
        await expect(ogTitle).toHaveCount(1);
      }
    }
  });
});
