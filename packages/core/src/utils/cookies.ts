/**
 * Cookie Utilities
 *
 * Provides utilities for cookie management including
 * domain extraction and secure cookie options.
 */

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

/**
 * Extract the root domain from a URL for cookie domain setting.
 *
 * In production, returns the domain with a leading dot (e.g., ".example.com")
 * so cookies are accessible on all subdomains (www.example.com and example.com).
 *
 * In development, returns undefined to use the default behavior.
 */
export function getCookieDomain(siteUrl?: string): string | undefined {
  if (process.env.NODE_ENV !== 'production') {
    return undefined;
  }

  const url = siteUrl || process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    // Extract root domain (remove www. if present)
    const rootDomain = hostname.replace(/^www\./, '');

    // Return with leading dot to include all subdomains
    return `.${rootDomain}`;
  } catch {
    return undefined;
  }
}

/**
 * Get default cookie options for authentication
 *
 * Note: sameSite: 'lax' is required for OAuth flows.
 * With 'strict', cookies are not sent during redirects
 * from external sites (like Facebook, LinkedIn, etc.)
 */
export function getAuthCookieOptions(maxAge: number, siteUrl?: string): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
    domain: getCookieDomain(siteUrl),
  };
}

/**
 * Get cookie options for OAuth state cookies
 */
export function getOAuthStateCookieOptions(maxAgeSeconds: number, siteUrl?: string): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeSeconds,
    path: '/',
    domain: getCookieDomain(siteUrl),
  };
}

/**
 * Get cookie options for CSRF tokens
 */
export function getCSRFCookieOptions(
  maxAgeSeconds: number = 3600,
  siteUrl?: string
): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeSeconds,
    path: '/',
    domain: getCookieDomain(siteUrl),
  };
}

/**
 * Get cookie options for session cookies (no maxAge = session cookie)
 */
export function getSessionCookieOptions(siteUrl?: string): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: getCookieDomain(siteUrl),
  };
}

/**
 * Parse cookie string into object
 */
export function parseCookies(cookieString?: string): Record<string, string> {
  if (!cookieString) return {};

  return cookieString.split(';').reduce(
    (cookies, cookie) => {
      const [name, ...rest] = cookie.split('=');
      const trimmedName = name?.trim();
      if (trimmedName) {
        cookies[trimmedName] = decodeURIComponent(rest.join('=').trim());
      }
      return cookies;
    },
    {} as Record<string, string>
  );
}

/**
 * Serialize cookie for Set-Cookie header
 */
export function serializeCookie(name: string, value: string, options?: CookieOptions): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options?.maxAge !== undefined) {
    cookie += `; Max-Age=${options.maxAge}`;
  }
  if (options?.domain) {
    cookie += `; Domain=${options.domain}`;
  }
  if (options?.path) {
    cookie += `; Path=${options.path}`;
  }
  if (options?.httpOnly) {
    cookie += '; HttpOnly';
  }
  if (options?.secure) {
    cookie += '; Secure';
  }
  if (options?.sameSite) {
    cookie += `; SameSite=${options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)}`;
  }

  return cookie;
}
