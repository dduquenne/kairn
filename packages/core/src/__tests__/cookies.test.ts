import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getCookieDomain,
  getAuthCookieOptions,
  getOAuthStateCookieOptions,
  getCSRFCookieOptions,
  getSessionCookieOptions,
  parseCookies,
  serializeCookie,
} from '../utils/cookies';

describe('Cookie Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getCookieDomain', () => {
    it('should return undefined in development', () => {
      process.env.NODE_ENV = 'development';

      expect(getCookieDomain('https://example.com')).toBeUndefined();
    });

    it('should extract root domain in production', () => {
      process.env.NODE_ENV = 'production';

      expect(getCookieDomain('https://example.com')).toBe('.example.com');
      expect(getCookieDomain('https://www.example.com')).toBe('.example.com');
      expect(getCookieDomain('https://app.example.com')).toBe('.app.example.com');
    });

    it('should use NEXT_PUBLIC_SITE_URL as fallback', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_SITE_URL = 'https://mysite.com';

      expect(getCookieDomain()).toBe('.mysite.com');
    });

    it('should return undefined for invalid URL', () => {
      process.env.NODE_ENV = 'production';

      expect(getCookieDomain('not-a-url')).toBeUndefined();
    });

    it('should return undefined when no URL provided', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_SITE_URL;

      expect(getCookieDomain()).toBeUndefined();
    });
  });

  describe('getAuthCookieOptions', () => {
    it('should return secure options in production', () => {
      process.env.NODE_ENV = 'production';

      const options = getAuthCookieOptions(3600, 'https://example.com');

      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
      expect(options.sameSite).toBe('lax');
      expect(options.maxAge).toBe(3600);
      expect(options.path).toBe('/');
      expect(options.domain).toBe('.example.com');
    });

    it('should return non-secure options in development', () => {
      process.env.NODE_ENV = 'development';

      const options = getAuthCookieOptions(3600);

      expect(options.secure).toBe(false);
      expect(options.domain).toBeUndefined();
    });
  });

  describe('getOAuthStateCookieOptions', () => {
    it('should use lax sameSite for OAuth', () => {
      process.env.NODE_ENV = 'production';

      const options = getOAuthStateCookieOptions(600);

      expect(options.sameSite).toBe('lax');
      expect(options.httpOnly).toBe(true);
      expect(options.maxAge).toBe(600);
    });
  });

  describe('getCSRFCookieOptions', () => {
    it('should use strict sameSite for CSRF', () => {
      process.env.NODE_ENV = 'production';

      const options = getCSRFCookieOptions();

      expect(options.sameSite).toBe('strict');
      expect(options.httpOnly).toBe(true);
      expect(options.maxAge).toBe(3600);
    });

    it('should accept custom maxAge', () => {
      const options = getCSRFCookieOptions(7200);

      expect(options.maxAge).toBe(7200);
    });
  });

  describe('getSessionCookieOptions', () => {
    it('should not include maxAge for session cookies', () => {
      const options = getSessionCookieOptions();

      expect(options.maxAge).toBeUndefined();
      expect(options.httpOnly).toBe(true);
    });
  });

  describe('parseCookies', () => {
    it('should parse cookie string', () => {
      const cookies = parseCookies('name=value; other=test');

      expect(cookies).toEqual({
        name: 'value',
        other: 'test',
      });
    });

    it('should handle URL encoded values', () => {
      const cookies = parseCookies('name=hello%20world');

      expect(cookies.name).toBe('hello world');
    });

    it('should handle values with equals signs', () => {
      const cookies = parseCookies('token=abc=def=ghi');

      expect(cookies.token).toBe('abc=def=ghi');
    });

    it('should return empty object for undefined', () => {
      expect(parseCookies(undefined)).toEqual({});
      expect(parseCookies('')).toEqual({});
    });

    it('should trim whitespace', () => {
      const cookies = parseCookies('  name  =  value  ;  other  =  test  ');

      expect(cookies).toEqual({
        name: 'value',
        other: 'test',
      });
    });

    it('should handle single cookie', () => {
      const cookies = parseCookies('single=value');

      expect(cookies).toEqual({ single: 'value' });
    });
  });

  describe('serializeCookie', () => {
    it('should serialize basic cookie', () => {
      const cookie = serializeCookie('name', 'value');

      expect(cookie).toBe('name=value');
    });

    it('should encode special characters', () => {
      const cookie = serializeCookie('name', 'hello world');

      expect(cookie).toBe('name=hello%20world');
    });

    it('should include maxAge', () => {
      const cookie = serializeCookie('name', 'value', { maxAge: 3600 });

      expect(cookie).toContain('Max-Age=3600');
    });

    it('should include domain', () => {
      const cookie = serializeCookie('name', 'value', { domain: '.example.com' });

      expect(cookie).toContain('Domain=.example.com');
    });

    it('should include path', () => {
      const cookie = serializeCookie('name', 'value', { path: '/api' });

      expect(cookie).toContain('Path=/api');
    });

    it('should include HttpOnly flag', () => {
      const cookie = serializeCookie('name', 'value', { httpOnly: true });

      expect(cookie).toContain('HttpOnly');
    });

    it('should include Secure flag', () => {
      const cookie = serializeCookie('name', 'value', { secure: true });

      expect(cookie).toContain('Secure');
    });

    it('should include SameSite with proper casing', () => {
      expect(serializeCookie('n', 'v', { sameSite: 'strict' })).toContain('SameSite=Strict');
      expect(serializeCookie('n', 'v', { sameSite: 'lax' })).toContain('SameSite=Lax');
      expect(serializeCookie('n', 'v', { sameSite: 'none' })).toContain('SameSite=None');
    });

    it('should serialize full cookie with all options', () => {
      const cookie = serializeCookie('session', 'abc123', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 86400,
        path: '/',
        domain: '.example.com',
      });

      expect(cookie).toContain('session=abc123');
      expect(cookie).toContain('Max-Age=86400');
      expect(cookie).toContain('Domain=.example.com');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Strict');
    });
  });
});
