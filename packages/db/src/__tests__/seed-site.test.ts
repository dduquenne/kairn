/**
 * Seed Site Tests
 *
 * Tests for the configurable site seeding functionality including:
 * - SeedSiteConfig validation
 * - seedSite function behavior with mocked Prisma
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => {
  const fn = vi.fn;
  const mockSite = { id: 'site-001', slug: 'test-site', name: 'Test Site' };
  const mockUser = { id: 'user-001', email: 'admin@test.fr' };
  const mockTag = { id: 'tag-001', slug: 'bien-etre' };
  const mockKey = { kid: 'key-test-site-v1' };
  const mockPost = { id: 'post-001', slug: 'bienvenue' };

  return {
    mockPrisma: {
      site: { upsert: fn().mockResolvedValue(mockSite) },
      user: { upsert: fn().mockResolvedValue(mockUser) },
      tag: { upsert: fn().mockResolvedValue(mockTag) },
      secretKey: { upsert: fn().mockResolvedValue(mockKey) },
      blogPost: { upsert: fn().mockResolvedValue(mockPost) },
      blogPostTag: { createMany: fn().mockResolvedValue({ count: 1 }) },
      testimonial: { createMany: fn().mockResolvedValue({ count: 2 }) },
      $disconnect: fn(),
    },
  };
});

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
  UserRole: { ADMIN: 'ADMIN', PRACTITIONER: 'PRACTITIONER' },
}));

import { seedSite, type SeedSiteConfig } from '../seed-site';

describe('SeedSiteConfig', () => {
  it('should define the correct interface', () => {
    const config: SeedSiteConfig = {
      slug: 'my-site',
      name: 'My Site',
      domain: 'my-site.fr',
    };

    expect(config.slug).toBe('my-site');
    expect(config.name).toBe('My Site');
    expect(config.domain).toBe('my-site.fr');
  });

  it('should accept optional fields', () => {
    const config: SeedSiteConfig = {
      slug: 'my-site',
      name: 'My Site',
      domain: 'my-site.fr',
      adminEmail: 'admin@custom.fr',
      adminPassword: 'secure123',
      features: { blog: true, analytics: true },
      includeDemoData: true,
    };

    expect(config.adminEmail).toBe('admin@custom.fr');
    expect(config.includeDemoData).toBe(true);
  });

  it('should default features to common values', () => {
    const config: SeedSiteConfig = {
      slug: 'my-site',
      name: 'My Site',
      domain: 'my-site.fr',
    };

    // Features are optional — default is handled by seedSite function
    expect(config.features).toBeUndefined();
  });
});

describe('seedSite', () => {
  beforeEach(() => {
    // Suppress console.log during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // Re-apply mock return values (cleared by previous tests)
    mockPrisma.site.upsert.mockResolvedValue({
      id: 'site-001',
      slug: 'test-site',
      name: 'Test Site',
    });
    mockPrisma.user.upsert.mockResolvedValue({ id: 'user-001', email: 'admin@test.fr' });
    mockPrisma.tag.upsert.mockResolvedValue({ id: 'tag-001', slug: 'bien-etre' });
    mockPrisma.secretKey.upsert.mockResolvedValue({ kid: 'key-test-site-v1' });
    mockPrisma.blogPost.upsert.mockResolvedValue({ id: 'post-001', slug: 'bienvenue' });
    mockPrisma.blogPostTag.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.testimonial.createMany.mockResolvedValue({ count: 2 });
  });

  it('should seed a site and return result', async () => {
    const result = await seedSite({
      slug: 'test-site',
      name: 'Test Site',
      domain: 'test.fr',
    });

    expect(result.slug).toBe('test-site');
    expect(result.adminEmail).toBe('admin@test.fr');
    expect(result.secretKeyKid).toBe('key-test-site-v1');
    expect(result.tagsCreated).toBe(4);
    expect(result.demoDataCreated).toBe(false);
  });

  it('should create demo data when includeDemoData is true', async () => {
    const result = await seedSite({
      slug: 'test-site',
      name: 'Test Site',
      domain: 'test.fr',
      includeDemoData: true,
    });

    expect(result.demoDataCreated).toBe(true);
  });

  it('should use custom admin email', async () => {
    const result = await seedSite({
      slug: 'test-site',
      name: 'Test Site',
      domain: 'test.fr',
      adminEmail: 'custom@test.fr',
    });

    expect(result.adminEmail).toBe('custom@test.fr');
  });
});
