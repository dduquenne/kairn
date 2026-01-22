// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";
import { withAdminAuth } from "../auth/middleware";
import { loadUsers } from "./store";

export const dynamic = 'force-dynamic';

type PublicUser = {
  id: string;
  email: string;
  role: "admin" | "speaker" | "attendee";
};

export async function GET(request: Request) {
  // SÉCURITÉ : Protéger l'accès aux données utilisateurs
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const roleFilter = searchParams.get("role");

  const users = await loadUsers();

  let filtered = users;
  if (roleFilter) {
    filtered = users.filter((user) => user.role === roleFilter);
  }

  const payload: PublicUser[] = filtered.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
  }));

  return NextResponse.json(payload);
}
