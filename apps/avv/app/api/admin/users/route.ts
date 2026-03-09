/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";
import { z } from "zod";

import { withAdminAuth } from "../../auth/middleware";
import { createAdminUser, listAdminUsers } from "../../users/pg-store";

export const dynamic = 'force-dynamic';

const createPayloadSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" }),
});

export async function GET() {
  // Vérifier l'authentification
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const users = await listAdminUsers();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  // Vérifier l'authentification
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const payload = await request.json().catch(() => ({}));
  const parsed = createPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Validation error" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  try {
    const user = await createAdminUser({ email, password });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de créer l'utilisateur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
