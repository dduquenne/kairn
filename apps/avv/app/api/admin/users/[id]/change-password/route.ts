import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import { withAdminAuth } from '../../../../auth/middleware';
import { pool } from '../../../../users/pg-store';

export const dynamic = 'force-dynamic';

const PASSWORD_SALT_ROUNDS = 12;

// Validation UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

interface ChangePasswordRequest {
  newPassword: string;
  currentPassword?: string;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Verify authentication
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  // Await params (Next.js 16+ async params)
  const { id } = await params;

  // Validate UUID
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
  }

  try {
    const body = (await request.json()) as ChangePasswordRequest;
    const { newPassword, currentPassword } = body;

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Get the current user
    const userResult = await pool.query(
      `SELECT id, email, "passwordHash" FROM "User" WHERE id = $1`,
      [id]
    );

    const user = userResult.rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // If currentPassword is provided, verify it
    if (currentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Le mot de passe actuel est incorrect' },
          { status: 400 }
        );
      }
    }

    // Hash and update the new password
    const newPasswordHash = await hashPassword(newPassword);
    await pool.query(`UPDATE "User" SET "passwordHash" = $1, "updatedAt" = $2 WHERE id = $3`, [
      newPasswordHash,
      new Date(),
      id,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Le mot de passe a été modifié avec succès',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Impossible de modifier le mot de passe';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
