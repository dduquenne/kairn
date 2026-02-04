/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";

import { withAdminAuth } from "../../../../auth/middleware";
import { resetAdminPasswordById } from "../../../../users/pg-store";

export const dynamic = 'force-dynamic';

// Validation UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // Vérifier l'authentification
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  // Valider l'UUID
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: "ID utilisateur invalide" }, { status: 400 });
  }

  try {
    const result = await resetAdminPasswordById(params.id);

    // Return the temporary password so admin can share it securely
    return NextResponse.json({
      success: true,
      user: result.user,
      temporaryPassword: result.temporaryPassword,
      message: "Un mot de passe temporaire a été généré",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de réinitialiser le mot de passe";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
