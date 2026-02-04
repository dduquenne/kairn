/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";

import { getCookieDomain } from "@/lib/cookies";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("psypnos_admin_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
    domain: getCookieDomain(),
  });

  return response;
}
