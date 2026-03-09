/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withAdminAuth } from '../../../auth/middleware';
import { deleteAdminUser, updateAdminUser } from '../../../users/pg-store';

export const dynamic = 'force-dynamic';

const updatePayloadSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }).optional(),
});

// Validation UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Vérifier l'authentification
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  // Valider l'UUID
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = updatePayloadSchema.safeParse(payload);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? 'Validation error' }, { status: 400 });
  }

  try {
    const user = await updateAdminUser(id, parsed.data);
    return NextResponse.json(user);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de mettre à jour l'utilisateur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Vérifier l'authentification
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  // Valider l'UUID
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
  }

  try {
    await deleteAdminUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de supprimer l'utilisateur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
