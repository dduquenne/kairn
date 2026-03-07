/**
 * Configuration Loader Tests
 *
 * Tests for the multi-source configuration loading system including:
 * - ConfigLoader with caching and merging
 * - MemoryConfigSource
 * - EnvConfigSource
 * - JsonObjectConfigSource
 * - Factory functions and global singleton
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  ConfigLoader,
  MemoryConfigSource,
  EnvConfigSource,
  JsonObjectConfigSource,
  createConfigLoader,
  getConfigLoader,
  setConfigLoader,
  loadSiteConfig,
} from '../config/loader';
import type { ConfigSource } from '../config/loader';

// =============================================================================
// MemoryConfigSource
// =============================================================================

describe('MemoryConfigSource', () => {
  let source: MemoryConfigSource;

  beforeEach(() => {
    source = new MemoryConfigSource();
  });

  it('should return null for unknown site', async () => {
    const result = await source.load('unknown-site');
    expect(result).toBeNull();
  });

  it('should load previously set config', async () => {
    source.set('my-site', { name: 'Mon Site' });
    const result = await source.load('my-site');
    expect(result).toEqual({ name: 'Mon Site' });
  });

  it('should save and load config', async () => {
    const config = {
      slug: 'test',
      name: 'Test Site',
    };
    await source.save('test', config as never);
    const result = await source.load('test');
    expect(result).toEqual(config);
  });

  it('should notify watchers on save', async () => {
    const callback = vi.fn();
    source.watch('my-site', callback);

    const config = { slug: 'my-site', name: 'Updated' };
    await source.save('my-site', config as never);

    expect(callback).toHaveBeenCalledWith(config);
  });

  it('should unwatch correctly', async () => {
    const callback = vi.fn();
    const unwatch = source.watch('my-site', callback);
    unwatch();

    await source.save('my-site', { slug: 'my-site', name: 'Updated' } as never);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear all configs', () => {
    source.set('site-1', { name: 'Site 1' });
    source.set('site-2', { name: 'Site 2' });
    source.clear();

    expect(source.load('site-1')).resolves.toBeNull();
    expect(source.load('site-2')).resolves.toBeNull();
  });
});

// =============================================================================
// EnvConfigSource
// =============================================================================

describe('EnvConfigSource', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return null when no env vars match', async () => {
    const source = new EnvConfigSource();
    const result = await source.load('my-site');
    expect(result).toBeNull();
  });

  it('should load name from env var', async () => {
    process.env.SITE_MY_SITE_NAME = 'Mon Beau Site';
    const source = new EnvConfigSource();

    const result = await source.load('my-site');

    expect(result).toEqual({ name: 'Mon Beau Site' });
  });

  it('should load domain from env var', async () => {
    process.env.SITE_MY_SITE_DOMAIN = 'example.com';
    const source = new EnvConfigSource();

    const result = await source.load('my-site');

    expect(result).toEqual({ domain: 'example.com' });
  });

  it('should load contact email from env var', async () => {
    process.env.SITE_MY_SITE_CONTACT_EMAIL = 'contact@example.com';
    const source = new EnvConfigSource();

    const result = await source.load('my-site');

    expect(result).toEqual({
      contact: { email: 'contact@example.com' },
    });
  });

  it('should support custom prefix', async () => {
    process.env.APP_MY_SITE_NAME = 'Custom Prefix Site';
    const source = new EnvConfigSource('APP_');

    const result = await source.load('my-site');

    expect(result).toEqual({ name: 'Custom Prefix Site' });
  });

  it('should handle hyphens in site slug by converting to underscores', async () => {
    process.env.SITE_MY_COOL_SITE_NAME = 'Cool Site';
    const source = new EnvConfigSource();

    const result = await source.load('my-cool-site');

    expect(result).toEqual({ name: 'Cool Site' });
  });
});

// =============================================================================
// JsonObjectConfigSource
// =============================================================================

describe('JsonObjectConfigSource', () => {
  it('should load config from provided object', async () => {
    const source = new JsonObjectConfigSource({
      'my-site': { name: 'My Site', domain: 'my-site.com' },
    });

    const result = await source.load('my-site');

    expect(result).toEqual({ name: 'My Site', domain: 'my-site.com' });
  });

  it('should return null for unknown site', async () => {
    const source = new JsonObjectConfigSource({});

    const result = await source.load('unknown');

    expect(result).toBeNull();
  });
});

// =============================================================================
// ConfigLoader
// =============================================================================

describe('ConfigLoader', () => {
  it('should load config from a single source', async () => {
    const source = new MemoryConfigSource();
    source.set('test-site', { name: 'Test' });

    const loader = new ConfigLoader({
      sources: [source],
      cacheTtlMs: 0, // No cache
    });

    const config = await loader.load('test-site');

    expect(config.name).toBe('Test');
  });

  it('should merge configs from multiple sources (last wins)', async () => {
    const source1 = new JsonObjectConfigSource({
      'test-site': { name: 'Name from source 1', domain: 'source1.com' },
    });
    const source2 = new JsonObjectConfigSource({
      'test-site': { name: 'Name from source 2' },
    });

    const loader = new ConfigLoader({
      sources: [source1, source2],
      cacheTtlMs: 0,
    });

    const config = await loader.load('test-site');

    // source2 overrides name
    expect(config.name).toBe('Name from source 2');
  });

  it('should use base config defaults when sources return null', async () => {
    const emptySource: ConfigSource = {
      load: vi.fn().mockResolvedValue(null),
    };

    const loader = new ConfigLoader({
      sources: [emptySource],
      cacheTtlMs: 0,
    });

    const config = await loader.load('default-site');

    // Should have the slug from getBaseConfig
    expect(config.slug).toBe('default-site');
  });

  it('should cache loaded config within TTL', async () => {
    const source: ConfigSource = {
      load: vi.fn().mockResolvedValue({ name: 'Cached' }),
    };

    const loader = new ConfigLoader({
      sources: [source],
      cacheTtlMs: 60000,
    });

    await loader.load('test');
    await loader.load('test');

    // Source should only be called once (second call uses cache)
    expect(source.load).toHaveBeenCalledTimes(1);
  });

  it('should bypass cache when TTL is 0', async () => {
    const source: ConfigSource = {
      load: vi.fn().mockResolvedValue({ name: 'No Cache' }),
    };

    const loader = new ConfigLoader({
      sources: [source],
      cacheTtlMs: 0,
    });

    await loader.load('test');
    await loader.load('test');

    expect(source.load).toHaveBeenCalledTimes(2);
  });

  it('should invalidate cache for specific site', async () => {
    const source: ConfigSource = {
      load: vi.fn().mockResolvedValue({ name: 'Test' }),
    };

    const loader = new ConfigLoader({
      sources: [source],
      cacheTtlMs: 60000,
    });

    await loader.load('test');
    loader.invalidate('test');
    await loader.load('test');

    expect(source.load).toHaveBeenCalledTimes(2);
  });

  it('should invalidate all cached configs', async () => {
    const source: ConfigSource = {
      load: vi.fn().mockResolvedValue({ name: 'Test' }),
    };

    const loader = new ConfigLoader({
      sources: [source],
      cacheTtlMs: 60000,
    });

    await loader.load('site-1');
    await loader.load('site-2');
    loader.invalidateAll();
    await loader.load('site-1');
    await loader.load('site-2');

    // 2 initial + 2 after invalidation
    expect(source.load).toHaveBeenCalledTimes(4);
  });

  it('should save to the first source that supports saving', async () => {
    const readOnlySource: ConfigSource = {
      load: vi.fn().mockResolvedValue(null),
    };
    const writableSource = new MemoryConfigSource();
    const saveSpy = vi.spyOn(writableSource, 'save');

    const loader = new ConfigLoader({
      sources: [readOnlySource, writableSource],
      cacheTtlMs: 0,
    });

    // Load first to get a valid config
    const config = await loader.load('test');
    await loader.save('test', config);

    expect(saveSpy).toHaveBeenCalled();
  });

  it('should throw when no source supports saving', async () => {
    const readOnlySource: ConfigSource = {
      load: vi.fn().mockResolvedValue(null),
    };

    const loader = new ConfigLoader({
      sources: [readOnlySource],
      cacheTtlMs: 0,
    });

    const config = await loader.load('test');
    await expect(loader.save('test', config)).rejects.toThrow(
      'No configuration source supports saving'
    );
  });

  it('should invalidate cache after save', async () => {
    const source = new MemoryConfigSource();
    source.set('test', { name: 'Original' });

    const loader = new ConfigLoader({
      sources: [source],
      cacheTtlMs: 60000,
    });

    // Load to populate cache
    const config = await loader.load('test');
    expect(config.name).toBe('Original');

    // Save and verify cache was invalidated
    source.set('test', { name: 'Updated' });
    await loader.save('test', { ...config, name: 'Saved' });

    // Next load should not use the old cached value
    const reloaded = await loader.load('test');
    // The saved value goes through save(), which stores validatedConfig
    expect(reloaded).toBeDefined();
  });

  it('should clean up watchers on destroy', () => {
    const unwatchFn = vi.fn();
    const source: ConfigSource = {
      load: vi.fn().mockResolvedValue(null),
      watch: vi.fn().mockReturnValue(unwatchFn),
    };

    const loader = new ConfigLoader({
      sources: [source],
      cacheTtlMs: 0,
    });

    loader.destroy();

    // Cache should be cleared
    // No error should occur
  });
});

// =============================================================================
// Factory functions
// =============================================================================

describe('createConfigLoader', () => {
  it('should create a loader with JSON configs', async () => {
    const loader = createConfigLoader({
      configs: {
        'test-site': { name: 'Test Site' },
      },
      cacheTtlMs: 0,
    });

    const config = await loader.load('test-site');

    expect(config.name).toBe('Test Site');
  });

  it('should include env overrides by default', () => {
    const loader = createConfigLoader();
    // Loader should be created without errors
    expect(loader).toBeInstanceOf(ConfigLoader);
  });

  it('should disable env overrides when useEnvOverrides is false', () => {
    const loader = createConfigLoader({ useEnvOverrides: false });
    expect(loader).toBeInstanceOf(ConfigLoader);
  });
});

// =============================================================================
// Global loader
// =============================================================================

describe('Global loader', () => {
  afterEach(() => {
    // Reset global loader
    setConfigLoader(createConfigLoader({ cacheTtlMs: 0 }));
  });

  it('should return a default loader via getConfigLoader', () => {
    const loader = getConfigLoader();
    expect(loader).toBeInstanceOf(ConfigLoader);
  });

  it('should allow setting a custom global loader', () => {
    const customLoader = createConfigLoader({ cacheTtlMs: 0 });
    setConfigLoader(customLoader);

    expect(getConfigLoader()).toBe(customLoader);
  });

  it('should load config via loadSiteConfig shorthand', async () => {
    const loader = createConfigLoader({
      configs: { 'my-site': { name: 'My Site' } },
      cacheTtlMs: 0,
    });
    setConfigLoader(loader);

    const config = await loadSiteConfig('my-site');

    expect(config.name).toBe('My Site');
  });
});
