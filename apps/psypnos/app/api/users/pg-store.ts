/**
 * PostgreSQL-based user store (alternative to Prisma when binaries can't be downloaded)
 */
import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { Pool, QueryResult, QueryResultRow } from "pg";

// Lazy-load the database connection pool to ensure env vars are loaded
let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    // Default to localhost if DATABASE_URL is not set
    const connectionString = process.env.DATABASE_URL || "postgresql://kairn:kairn123@localhost:5432/kairn_db";
    _pool = new Pool({ connectionString });
  }
  return _pool;
}

// Wrapper for pool queries
const pool = {
  query: async <T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>> => {
    return getPool().query<T>(text, values);
  }
};

// Site slug for psypnos
const SITE_SLUG = "psypnos";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: "admin" | "speaker" | "attendee";
  createdAt: Date;
  updatedAt: Date;
};

export type SanitizedUser = {
  id: string;
  email: string;
  role: "admin" | "speaker" | "attendee";
  createdAt: string;
  updatedAt: string;
};

type CreateAdminUserPayload = {
  email: string;
  password: string;
};

type UpdateAdminUserPayload = {
  email?: string;
  password?: string;
};

type ResetPasswordResult = {
  user: SanitizedUser;
  temporaryPassword: string;
};

const PASSWORD_SALT_ROUNDS = 12;

/**
 * Map database role (ADMIN, EDITOR, etc.) to API role (admin, speaker, attendee)
 */
function mapDatabaseRole(dbRole: string): "admin" | "speaker" | "attendee" {
  const roleMap: Record<string, "admin" | "speaker" | "attendee"> = {
    ADMIN: "admin",
    EDITOR: "admin",
    PRACTITIONER: "admin",
    USER: "attendee",
  };
  return roleMap[dbRole] || "attendee";
}

/**
 * Get the psypnos site ID
 */
async function getSiteId(): Promise<string> {
  const result = await pool.query(
    'SELECT id FROM "Site" WHERE slug = $1',
    [SITE_SLUG]
  );
  if (result.rows.length === 0) {
    throw new Error(`Site '${SITE_SLUG}' not found`);
  }
  const row = result.rows[0];
  if (!row) {
    throw new Error(`Site '${SITE_SLUG}' not found`);
  }
  return row.id;
}

export function sanitizeUser(user: UserRecord): SanitizedUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const siteId = await getSiteId();

  const result = await pool.query(
    'SELECT id, email, "passwordHash", role, "createdAt", "updatedAt" FROM "User" WHERE email = $1 AND "siteId" = $2',
    [email.toLowerCase(), siteId]
  );

  if (result.rows.length === 0) return undefined;

  const row = result.rows[0];
  if (!row) return undefined;

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash || "",
    role: mapDatabaseRole(row.role),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export async function listAdminUsers(): Promise<SanitizedUser[]> {
  const siteId = await getSiteId();

  const result = await pool.query(
    'SELECT id, email, role, "createdAt", "updatedAt" FROM "User" WHERE "siteId" = $1 AND role IN ($2, $3, $4)',
    [siteId, "ADMIN", "EDITOR", "PRACTITIONER"]
  );

  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: mapDatabaseRole(row.role),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  }));
}

export async function createAdminUser(payload: CreateAdminUserPayload): Promise<SanitizedUser> {
  const email = payload.email.toLowerCase();
  const siteId = await getSiteId();

  // Check if user already exists
  const existing = await pool.query(
    'SELECT id FROM "User" WHERE email = $1 AND "siteId" = $2',
    [email, siteId]
  );

  if (existing.rows.length > 0) {
    throw new Error("Un utilisateur avec cet email existe déjà");
  }

  const passwordHash = await hashPassword(payload.password);
  const id = randomUUID();
  const now = new Date();

  await pool.query(
    `INSERT INTO "User" (id, email, "passwordHash", role, "isActive", "emailVerified", "siteId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, email, passwordHash, "ADMIN", true, now, siteId, now, now]
  );

  return {
    id,
    email,
    role: "admin",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function updateAdminUser(
  id: string,
  payload: UpdateAdminUserPayload
): Promise<SanitizedUser> {
  const siteId = await getSiteId();
  const nextEmail = payload.email?.toLowerCase();

  // Check if email is taken
  if (nextEmail) {
    const existing = await pool.query(
      'SELECT id FROM "User" WHERE email = $1 AND "siteId" = $2 AND id != $3',
      [nextEmail, siteId, id]
    );

    if (existing.rows.length > 0) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (nextEmail) {
    updates.push(`email = $${paramIndex++}`);
    values.push(nextEmail);
  }

  if (payload.password) {
    updates.push(`"passwordHash" = $${paramIndex++}`);
    values.push(await hashPassword(payload.password));
  }

  updates.push(`"updatedAt" = $${paramIndex++}`);
  values.push(new Date());

  values.push(id);

  const result = await pool.query(
    `UPDATE "User" SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id, email, role, "createdAt", "updatedAt"`,
    values
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error(`User with id '${id}' not found`);
  }
  return {
    id: row.id,
    email: row.email,
    role: mapDatabaseRole(row.role),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export async function deleteAdminUser(id: string): Promise<void> {
  await pool.query('DELETE FROM "User" WHERE id = $1', [id]);
}

export async function resetAdminPasswordById(id: string): Promise<ResetPasswordResult> {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const result = await pool.query(
    `UPDATE "User" SET "passwordHash" = $1, "updatedAt" = $2 WHERE id = $3 RETURNING id, email, role, "createdAt", "updatedAt"`,
    [passwordHash, new Date(), id]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error(`User with id '${id}' not found`);
  }
  return {
    user: {
      id: row.id,
      email: row.email,
      role: mapDatabaseRole(row.role),
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    },
    temporaryPassword,
  };
}

export async function resetAdminPasswordByEmail(email: string): Promise<ResetPasswordResult | null> {
  const siteId = await getSiteId();

  const userResult = await pool.query(
    'SELECT id FROM "User" WHERE email = $1 AND "siteId" = $2 AND role IN ($3, $4, $5)',
    [email.toLowerCase(), siteId, "ADMIN", "EDITOR", "PRACTITIONER"]
  );

  if (userResult.rows.length === 0) {
    return null;
  }

  const user = userResult.rows[0];
  if (!user) {
    return null;
  }

  return resetAdminPasswordById(user.id);
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

function generateTemporaryPassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  return Array.from({ length }, (_, index) => {
    const byte = bytes[index];
    return byte !== undefined ? alphabet[byte % alphabet.length] : alphabet[0];
  }).join("");
}
