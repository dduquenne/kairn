// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import { JsonDatabase } from "../common/json-database";

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().toLowerCase(),
  passwordHash: z.string(),
  role: z.enum(["admin", "speaker", "attendee"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserRecord = z.infer<typeof userSchema>;

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

export type SanitizedUser = Omit<UserRecord, "passwordHash">;

const PASSWORD_SALT_ROUNDS = 12;

// Initialiser la base de données JSON
let db: JsonDatabase<UserRecord> | null = null;

function getDb(): JsonDatabase<UserRecord> {
  if (!db) {
    db = new JsonDatabase<UserRecord>("users", userSchema);
  }
  return db;
}

export async function loadUsers(): Promise<UserRecord[]> {
  return getDb().load();
}

export async function writeUsers(users: UserRecord[]): Promise<void> {
  await getDb().save(users);
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  return getDb().findOne((user) => user.email === email.toLowerCase());
}

export function sanitizeUser(user: UserRecord): SanitizedUser {
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function listAdminUsers(): Promise<SanitizedUser[]> {
  const users = await getDb().findAll((user) => user.role === "admin");
  return users.map(sanitizeUser);
}

export async function createAdminUser(payload: CreateAdminUserPayload): Promise<SanitizedUser> {
  const email = payload.email.toLowerCase();

  // Vérifier si l'utilisateur existe déjà
  const exists = await getDb().exists((user) => user.email === email);
  if (exists) {
    throw new Error("Un utilisateur avec cet email existe déjà");
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(payload.password);

  const user: UserRecord = {
    id: randomUUID(),
    email,
    passwordHash,
    role: payload.role ?? "admin",
    createdAt: now,
    updatedAt: now,
  };

  await getDb().add(user);
  return sanitizeUser(user);
}

export async function updateAdminUser(
  id: string,
  payload: UpdateAdminUserPayload,
): Promise<SanitizedUser> {
  const nextEmail = payload.email?.toLowerCase();

  // Si l'email est modifié, vérifier qu'il n'existe pas déjà
  if (nextEmail) {
    const existing = await getDb().findOne((user) => user.id !== id && user.email === nextEmail);
    if (existing) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }
  }

  const updates: Partial<UserRecord> = {
    ...(nextEmail && { email: nextEmail }),
    ...(payload.role && { role: payload.role }),
    ...(payload.password && { passwordHash: await hashPassword(payload.password) }),
    updatedAt: new Date().toISOString(),
  };

  const updated = await getDb().updateOne((user) => user.id === id, updates);

  if (!updated) {
    throw new Error("Utilisateur introuvable");
  }

  return sanitizeUser(updated);
}

export async function deleteAdminUser(id: string): Promise<void> {
  const deleted = await getDb().deleteOne((user) => user.id === id);

  if (!deleted) {
    throw new Error("Utilisateur introuvable");
  }
}

export async function resetAdminPasswordById(id: string): Promise<ResetPasswordResult> {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const updated = await getDb().updateOne(
    (user) => user.id === id,
    {
      passwordHash,
      updatedAt: new Date().toISOString(),
    },
  );

  if (!updated) {
    throw new Error("Utilisateur introuvable");
  }

  return {
    user: sanitizeUser(updated),
    temporaryPassword,
  };
}

export async function resetAdminPasswordByEmail(email: string): Promise<ResetPasswordResult | null> {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const updated = await getDb().updateOne(
    (user) => user.email === email.toLowerCase() && user.role === "admin",
    {
      passwordHash,
      updatedAt: new Date().toISOString(),
    },
  );

  if (!updated) {
    return null;
  }

  return {
    user: sanitizeUser(updated),
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
