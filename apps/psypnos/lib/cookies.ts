/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Utilitaires pour la gestion des cookies
 *
 * Gère notamment le domaine des cookies pour assurer la compatibilité
 * entre les variantes de domaine (www vs non-www).
 */

/**
 * Extrait le domaine racine depuis NEXT_PUBLIC_SITE_URL pour les cookies.
 *
 * En production, retourne le domaine avec un point préfixé (ex: ".psypnos.fr")
 * pour que les cookies soient accessibles sur toutes les variantes du domaine
 * (www.psypnos.fr et psypnos.fr).
 *
 * En développement, retourne undefined pour utiliser le comportement par défaut.
 */
export function getCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') {
    return undefined;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return undefined;
  }

  try {
    const url = new URL(siteUrl);
    const hostname = url.hostname;

    // Extraire le domaine racine (enlever www. si présent)
    const rootDomain = hostname.replace(/^www\./, '');

    // Retourner avec un point préfixé pour inclure tous les sous-domaines
    return `.${rootDomain}`;
  } catch {
    return undefined;
  }
}

/**
 * Options de cookie par défaut pour l'authentification admin
 *
 * Note: sameSite: 'lax' est nécessaire pour permettre les flux OAuth.
 * Avec 'strict', les cookies ne sont pas envoyés lors de redirections
 * depuis des sites externes (comme Facebook, LinkedIn, etc.)
 */
export function getAdminCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const, // 'lax' permet les redirections OAuth, 'strict' les bloque
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
    domain: getCookieDomain(),
  };
}

/**
 * Options de cookie par défaut pour OAuth state
 */
export function getOAuthStateCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: maxAgeSeconds,
    path: '/',
    domain: getCookieDomain(),
  };
}
