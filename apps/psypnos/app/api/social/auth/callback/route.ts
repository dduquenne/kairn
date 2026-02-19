/**
 * Route de callback OAuth
 *
 * GET /api/social/auth/callback
 *
 * Gère le retour de toutes les plateformes OAuth (Facebook, LinkedIn, Instagram, Threads).
 * Valide le state token, échange le code contre un access token, et crée/met à jour
 * le compte social dans la base de données.
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { verifyAdminToken } from '@/app/api/auth/middleware';
import { facebook, linkedin, instagram, threads, twitter } from '@/lib/social/oauth';
import {
  createSocialAccount,
  getSocialAccountByPlatformId,
  updateSocialAccount,
} from '@/lib/social/store';
import type { SocialPlatform, CreateSocialAccountInput } from '@/lib/social/types';

interface StateData {
  token: string;
  platform?: 'facebook' | 'linkedin' | 'instagram' | 'threads' | 'twitter';
  codeVerifier?: string; // Pour PKCE (Twitter)
  expires: number;
  userId: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // URL de redirection après le callback
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const successRedirect = `${baseUrl}/admin/social/accounts?success=true`;
  const errorRedirect = (msg: string) =>
    `${baseUrl}/admin/social/accounts?error=${encodeURIComponent(msg)}`;

  // DEBUG: Log de démarrage
  console.log('[OAuth Callback] ========== DÉBUT CALLBACK ==========');
  console.log('[OAuth Callback] URL:', request.nextUrl.toString());
  console.log('[OAuth Callback] code:', code ? `${code.substring(0, 20)}...` : 'null');
  console.log('[OAuth Callback] state:', state ? `${state.substring(0, 20)}...` : 'null');
  console.log('[OAuth Callback] error:', error);

  try {
    // Vérifier si l'utilisateur a annulé ou s'il y a une erreur
    if (error) {
      console.warn('[OAuth Callback] Erreur reçue:', error, errorDescription);
      return NextResponse.redirect(errorRedirect(errorDescription || error));
    }

    // Vérifier les paramètres requis
    if (!code || !state) {
      console.error(
        '[OAuth Callback] ÉCHEC: Paramètres manquants - code:',
        !!code,
        'state:',
        !!state
      );
      return NextResponse.redirect(errorRedirect('Paramètres manquants'));
    }

    // Récupérer et valider le state token
    const cookieStore = await cookies();
    const stateCookie = cookieStore.get('social_oauth_state');
    const adminCookie = cookieStore.get('psypnos_admin_token');

    // DEBUG: Log des cookies disponibles
    console.log('[OAuth Callback] Cookies trouvés:');
    console.log('[OAuth Callback]   - social_oauth_state:', stateCookie ? 'présent' : 'ABSENT');
    console.log('[OAuth Callback]   - psypnos_admin_token:', adminCookie ? 'présent' : 'ABSENT');

    if (!stateCookie?.value) {
      console.error('[OAuth Callback] ÉCHEC: Cookie social_oauth_state absent ou vide');
      return NextResponse.redirect(errorRedirect('Session expirée'));
    }

    let stateData: StateData;
    try {
      stateData = JSON.parse(stateCookie.value);
      console.log('[OAuth Callback] State data parsé:', {
        token: stateData.token ? `${stateData.token.substring(0, 20)}...` : 'null',
        platform: stateData.platform,
        expires: new Date(stateData.expires).toISOString(),
        userId: stateData.userId,
      });
    } catch (parseError) {
      console.error('[OAuth Callback] ÉCHEC: Impossible de parser le state cookie:', parseError);
      return NextResponse.redirect(errorRedirect('Session invalide'));
    }

    // Valider le state token
    if (stateData.token !== state) {
      console.error('[OAuth Callback] ÉCHEC: State token mismatch');
      console.error('[OAuth Callback]   - Cookie state:', stateData.token?.substring(0, 20));
      console.error('[OAuth Callback]   - URL state:', state?.substring(0, 20));
      return NextResponse.redirect(errorRedirect('Token de sécurité invalide'));
    }

    // Vérifier l'expiration
    if (Date.now() > stateData.expires) {
      console.error('[OAuth Callback] ÉCHEC: Session expirée');
      console.error('[OAuth Callback]   - Expiration:', new Date(stateData.expires).toISOString());
      console.error('[OAuth Callback]   - Maintenant:', new Date().toISOString());
      return NextResponse.redirect(errorRedirect('Session expirée'));
    }

    console.log('[OAuth Callback] ✓ State validé avec succès');

    // Supprimer le cookie de state
    cookieStore.delete('social_oauth_state');

    // Vérifier l'authentification admin
    console.log("[OAuth Callback] Vérification de l'authentification admin...");
    const payload = await verifyAdminToken();
    console.log(
      '[OAuth Callback] Payload admin:',
      payload ? { sub: payload.sub, role: payload.role } : 'null'
    );

    if (!payload || payload.role !== 'admin') {
      console.error('[OAuth Callback] ÉCHEC: Non authentifié ou pas admin');
      console.error('[OAuth Callback]   - payload:', payload);
      return NextResponse.redirect(errorRedirect('Non authentifié'));
    }

    console.log('[OAuth Callback] ✓ Admin authentifié:', payload.sub);

    // Déterminer la plateforme (par défaut Facebook si non spécifié)
    const platform = stateData.platform || 'facebook';
    console.log('[OAuth Callback] Plateforme:', platform);

    // Construire l'URI de redirection (même que celui utilisé pour initier)
    const redirectUri = `${baseUrl}/api/social/auth/callback`;
    console.log('[OAuth Callback] Redirect URI:', redirectUri);

    // Traiter selon la plateforme
    let accountInput: CreateSocialAccountInput;

    console.log('[OAuth Callback] Échange du code contre un token...');
    if (platform === 'linkedin') {
      accountInput = await handleLinkedInCallback(code, redirectUri);
    } else if (platform === 'threads') {
      accountInput = await handleThreadsCallback(code, redirectUri);
    } else if (platform === 'twitter') {
      // Twitter utilise OAuth 2.0 avec PKCE
      if (!stateData.codeVerifier) {
        throw new Error('Code verifier manquant pour Twitter PKCE');
      }
      accountInput = await handleTwitterCallback(code, redirectUri, stateData.codeVerifier);
    } else {
      // Facebook et Instagram utilisent le même flow Facebook
      accountInput = await handleFacebookCallback(code, redirectUri, platform);
    }
    console.log('[OAuth Callback] ✓ Token obtenu pour:', accountInput.accountName);

    // Vérifier si le compte existe déjà
    console.log('[OAuth Callback] Recherche du compte existant...');
    const existingAccount = await getSocialAccountByPlatformId(
      accountInput.platform,
      accountInput.accountId
    );
    console.log('[OAuth Callback] Compte existant:', existingAccount ? existingAccount.id : 'non');

    if (existingAccount) {
      // Mettre à jour le compte existant
      console.log('[OAuth Callback] Mise à jour du compte existant...');
      await updateSocialAccount(existingAccount.id, {
        accountName: accountInput.accountName,
        accessToken: accountInput.accessToken,
        refreshToken: accountInput.refreshToken,
        tokenExpiry: accountInput.tokenExpiry,
        scope: accountInput.scope,
        metadata: accountInput.metadata,
        isActive: true,
      });
      console.log(`[OAuth Callback] ✓ Compte ${platform} mis à jour: ${accountInput.accountName}`);
    } else {
      // Créer un nouveau compte
      console.log("[OAuth Callback] Création d'un nouveau compte...");
      await createSocialAccount(accountInput);
      console.log(
        `[OAuth Callback] ✓ Nouveau compte ${platform} créé: ${accountInput.accountName}`
      );
    }

    // Rediriger vers la page de gestion avec succès
    const finalRedirect = `${successRedirect}&platform=${platform}&account=${encodeURIComponent(accountInput.accountName)}`;
    console.log('[OAuth Callback] ========== SUCCÈS ==========');
    console.log('[OAuth Callback] Redirection vers:', finalRedirect);
    return NextResponse.redirect(finalRedirect);
  } catch (error) {
    console.error('[OAuth Callback] ========== ERREUR ==========');
    console.error('[OAuth Callback] Erreur:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[OAuth Callback] Message:', message);
    return NextResponse.redirect(errorRedirect(message));
  }
}

/**
 * Traite le callback Facebook/Instagram
 */
async function handleFacebookCallback(
  code: string,
  redirectUri: string,
  targetPlatform: 'facebook' | 'instagram'
): Promise<CreateSocialAccountInput> {
  // Échanger le code contre un token court terme
  const { accessToken: shortToken } = await facebook.exchangeCodeForToken(code, redirectUri);

  // Échanger contre un token long terme (60 jours)
  const { accessToken: longToken, expiresIn } =
    await facebook.exchangeForLongLivedToken(shortToken);

  // Récupérer les pages Facebook
  const pages = await facebook.getFacebookPages(longToken);

  if (pages.length === 0) {
    throw new Error("Aucune page Facebook trouvée. Vous devez être administrateur d'une page.");
  }

  // Pour Instagram, on cherche une page avec un compte Instagram lié
  if (targetPlatform === 'instagram') {
    const pageWithInstagram = pages.find(p => p.instagramAccount);

    if (!pageWithInstagram || !pageWithInstagram.instagramAccount) {
      throw new Error(
        'Aucun compte Instagram Business trouvé. ' +
          'Votre compte Instagram doit être de type Business/Creator et lié à une Page Facebook.'
      );
    }

    // Récupérer les détails du compte Instagram
    const igAccount = await facebook.getInstagramAccount(
      pageWithInstagram.pageAccessToken,
      pageWithInstagram.instagramAccount.id
    );

    return {
      platform: 'INSTAGRAM' as SocialPlatform,
      accountId: igAccount.id,
      accountName: `@${igAccount.username}`,
      accessToken: pageWithInstagram.pageAccessToken, // On utilise le Page Access Token
      tokenExpiry: null, // Les Page Access Tokens n'expirent pas
      scope: facebook.FACEBOOK_SCOPES,
      metadata: {
        igUserId: igAccount.id,
        igUsername: igAccount.username,
        linkedFacebookPageId: pageWithInstagram.pageId,
        pageName: pageWithInstagram.pageName,
        avatarUrl: igAccount.profile_picture_url,
      },
    };
  }

  // Pour Facebook, on prend la première page
  const page = pages[0];

  if (!page) {
    throw new Error('Aucune page Facebook trouvée.');
  }

  return {
    platform: 'FACEBOOK' as SocialPlatform,
    accountId: page.pageId,
    accountName: page.pageName,
    accessToken: page.pageAccessToken, // On utilise le Page Access Token
    tokenExpiry: null, // Les Page Access Tokens n'expirent pas
    scope: facebook.FACEBOOK_SCOPES,
    metadata: {
      pageId: page.pageId,
      pageName: page.pageName,
    },
  };
}

/**
 * Traite le callback LinkedIn
 */
async function handleLinkedInCallback(
  code: string,
  redirectUri: string
): Promise<CreateSocialAccountInput> {
  // Échanger le code contre un token
  const tokenData = await linkedin.exchangeCodeForToken(code, redirectUri);

  // Récupérer les informations du profil
  const accountInfo = await linkedin.getLinkedInAccountInfo(tokenData.accessToken);

  return {
    platform: 'LINKEDIN' as SocialPlatform,
    accountId: accountInfo.personId,
    accountName: accountInfo.fullName,
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    tokenExpiry: linkedin.calculateTokenExpiry(tokenData.expiresIn || 3600),
    scope: Array.isArray(tokenData.scope) ? tokenData.scope : tokenData.scope?.split(' ') || [],
    metadata: {
      personId: accountInfo.personId,
      profileUrl: `https://www.linkedin.com/in/${accountInfo.personId}`,
      avatarUrl: accountInfo.profilePictureUrl,
    },
  };
}

/**
 * Traite le callback Threads
 */
async function handleThreadsCallback(
  code: string,
  redirectUri: string
): Promise<CreateSocialAccountInput> {
  // Échanger le code contre un token court terme
  const { accessToken: shortToken } = await threads.exchangeCodeForToken(code, redirectUri);

  // Échanger contre un token long terme (60 jours)
  const { accessToken: longToken, expiresIn } = await threads.exchangeForLongLivedToken(shortToken);

  // Récupérer les informations du profil Threads
  const user = await threads.getThreadsUser(longToken);

  return {
    platform: 'THREADS' as SocialPlatform,
    accountId: user.id,
    accountName: `@${user.username}`,
    accessToken: longToken,
    tokenExpiry: threads.calculateTokenExpiry(expiresIn || 5184000),
    scope: threads.THREADS_SCOPES,
    metadata: {
      threadsUserId: user.id,
      threadsUsername: user.username,
      avatarUrl: user.threads_profile_picture_url,
    },
  };
}

/**
 * Traite le callback Twitter/X
 */
async function handleTwitterCallback(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<CreateSocialAccountInput> {
  // Échanger le code contre un token (avec PKCE)
  const tokenData = await twitter.exchangeCodeForToken(code, redirectUri, codeVerifier);

  // Récupérer les informations du profil Twitter
  const user = await twitter.getTwitterUser(tokenData.accessToken);

  return {
    platform: 'TWITTER' as SocialPlatform,
    accountId: user.id,
    accountName: `@${user.username}`,
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    tokenExpiry: twitter.calculateTokenExpiry(tokenData.expiresIn || 7200),
    scope: Array.isArray(tokenData.scope) ? tokenData.scope : tokenData.scope?.split(' ') || [],
    metadata: {
      profileUrl: `https://twitter.com/${user.username}`,
      avatarUrl: user.profile_image_url,
    },
  };
}
