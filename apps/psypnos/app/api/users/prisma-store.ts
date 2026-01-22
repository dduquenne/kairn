// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: "admin" | "speaker" | "attendee";
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Type local pour les utilisateurs Prisma (évite les problèmes de génération Prisma)
 */
interface PrismaUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

type AdminUserRole = Extract<UserRecord["role"], "admin">;

type CreateAdminUserPayload = {
  email: string;
  password: string;
  role?: AdminUserRole;
};

type UpdateAdminUserPayload = {
  email?: string;
  role?: AdminUserRole;
  password?: string;
};

type ResetPasswordResult = {
  user: SanitizedUser;
  temporaryPassword: string;
};

export type SanitizedUser = {
  id: string;
  email: string;
  role: "admin" | "speaker" | "attendee";
  createdAt: string;
  updatedAt: string;
};

const PASSWORD_SALT_ROUNDS = 12;

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) return undefined;

  return {
    ...user,
    role: user.role as UserRecord["role"],
  };
}

export function sanitizeUser(user: UserRecord): SanitizedUser {
  const { passwordHash, ...rest } = user;
  return {
    id: rest.id,
    email: rest.email,
    role: rest.role,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
  };
}

export async function listAdminUsers(): Promise<SanitizedUser[]> {
  const users = await prisma.user.findMany({
    where: { role: "admin" },
  });

  return users.map((user: PrismaUserRecord) =>
    sanitizeUser({
      ...user,
      role: user.role as UserRecord["role"],
    }),
  );
}

export async function createAdminUser(payload: CreateAdminUserPayload): Promise<SanitizedUser> {
  const email = payload.email.toLowerCase();

  // Vérifier si l'utilisateur existe déjà
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("Un utilisateur avec cet email existe déjà");
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      passwordHash,
      role: payload.role ?? "admin",
    },
  });

  return sanitizeUser({
    ...user,
    role: user.role as UserRecord["role"],
  });
}

export async function updateAdminUser(
  id: string,
  payload: UpdateAdminUserPayload,
): Promise<SanitizedUser> {
  const nextEmail = payload.email?.toLowerCase();

  // Si l'email est modifié, vérifier qu'il n'existe pas déjà
  if (nextEmail) {
    const existing = await prisma.user.findFirst({
      where: {
        AND: [{ email: nextEmail }, { NOT: { id } }],
      },
    });

    if (existing) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }
  }

  const updateData: {
    email?: string;
    role?: string;
    passwordHash?: string;
  } = {};

  if (nextEmail) updateData.email = nextEmail;
  if (payload.role) updateData.role = payload.role;
  if (payload.password) updateData.passwordHash = await hashPassword(payload.password);

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return sanitizeUser({
    ...updated,
    role: updated.role as UserRecord["role"],
  });
}

export async function deleteAdminUser(id: string): Promise<void> {
  await prisma.user.delete({
    where: { id },
  });
}

export async function resetAdminPasswordById(id: string): Promise<ResetPasswordResult> {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const updated = await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  return {
    user: sanitizeUser({
      ...updated,
      role: updated.role as UserRecord["role"],
    }),
    temporaryPassword,
  };
}

export async function resetAdminPasswordByEmail(email: string): Promise<ResetPasswordResult | null> {
  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      role: "admin",
    },
  });

  if (!user) {
    return null;
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return {
    user: sanitizeUser({
      ...updated,
      role: updated.role as UserRecord["role"],
    }),
    temporaryPassword,
  };
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

function generateTemporaryPassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  return Array.from({ length }, (_, index) => alphabet[bytes[index] % alphabet.length]).join("");
}
