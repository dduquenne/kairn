/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";

import { resetAdminPasswordByEmail } from "../../users/pg-store";

export async function POST(request: Request) {
  const { email } = await request
    .json()
    .catch(() => ({ email: "" }));

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const result = await resetAdminPasswordByEmail(email);

  if (!result) {
    // User not found - return generic message for security
    return NextResponse.json({
      success: true,
      message: "Si un compte existe pour cet email, un mot de passe temporaire a été généré.",
    });
  }

  // SÉCURITÉ : Ne jamais retourner le mot de passe temporaire dans la réponse
  // Il devrait être envoyé par email uniquement
  return NextResponse.json({
    success: true,
    message: "Un mot de passe temporaire a été généré et devrait être envoyé à l'utilisateur par email.",
  });
}
