// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * API REST pour un compte social spécifique
 *
 * GET /api/social/accounts/[id] - Détails d'un compte
 * PATCH /api/social/accounts/[id] - Mettre à jour un compte
 * DELETE /api/social/accounts/[id] - Supprimer un compte
 *
 * Protégé par authentification admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/auth/middleware';
import {
  getSocialAccountById,
  updateSocialAccount,
  deleteSocialAccount,
} from '@/lib/social/store';
import { validateAccountToken } from '@/lib/social/oauth/refresh';
import type { UpdateSocialAccountInput } from '@/lib/social/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/social/accounts/[id]
 *
 * Récupère les détails d'un compte social avec validation du token
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const account = await getSocialAccountById(id);

    if (!account) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 });
    }

    // Valider le token
    const tokenStatus = await validateAccountToken(id);

    return NextResponse.json({
      account,
      tokenStatus,
    });
  } catch (error) {
    console.error('[Social Account API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du compte' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/social/accounts/[id]
 *
 * Met à jour un compte social.
 * Champs modifiables: accountName, isActive, metadata
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier que le compte existe
    const existingAccount = await getSocialAccountById(id);
    if (!existingAccount) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 });
    }

    // Seuls certains champs peuvent être modifiés directement
    const allowedFields = ['accountName', 'isActive', 'metadata'];
    const updateData: Partial<UpdateSocialAccountInput> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucun champ valide à mettre à jour' },
        { status: 400 }
      );
    }

    const updatedAccount = await updateSocialAccount(id, updateData);

    return NextResponse.json({
      account: updatedAccount,
      message: 'Compte mis à jour avec succès',
    });
  } catch (error) {
    console.error('[Social Account API] Erreur PATCH:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du compte' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/accounts/[id]
 *
 * Supprime un compte social et tous ses posts associés
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;

    // Vérifier que le compte existe
    const existingAccount = await getSocialAccountById(id);
    if (!existingAccount) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 });
    }

    await deleteSocialAccount(id);

    return NextResponse.json({
      message: `Compte ${existingAccount.accountName} supprimé avec succès`,
    });
  } catch (error) {
    console.error('[Social Account API] Erreur DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte' },
      { status: 500 }
    );
  }
}
