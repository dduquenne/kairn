// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { findUserByEmail } from "../../users/pg-store";
import { createToken } from "../jwt";
import { loginSchema } from "../schemas";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "../rate-limiter";
import { ErrorCode, ErrorMessages, createApiError } from "../../common/error-codes";
import { getAdminCookieOptions } from "@/lib/cookies";

export async function POST(request: Request) {
  try {
    // Parse and validate input
    const body = await request.json().catch(() => ({}));
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      const error = createApiError(ErrorCode.INVALID_INPUT, {
        details: parseResult.error.flatten(),
      });
      return NextResponse.json(error, { status: error.statusCode });
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase();

    // Check rate limiting
    if (isRateLimited(normalizedEmail)) {
      const error = createApiError(ErrorCode.TOO_MANY_REQUESTS);
      return NextResponse.json(error, { status: error.statusCode });
    }

    // Find user
    const user = await findUserByEmail(normalizedEmail);

    if (!user || user.role !== "admin") {
      recordFailedAttempt(normalizedEmail);
      const error = createApiError(ErrorCode.INVALID_CREDENTIALS);
      return NextResponse.json(error, { status: error.statusCode });
    }

    // Verify password
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      recordFailedAttempt(normalizedEmail);
      const error = createApiError(ErrorCode.INVALID_CREDENTIALS);
      return NextResponse.json(error, { status: error.statusCode });
    }

    // Clear rate limiting for this user
    clearAttempts(normalizedEmail);

    // Generate JWT token
    const token = await createToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Set secure cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    // SECURITY: Use "strict" for admin authentication cookies
    // This provides better CSRF protection at the cost of requiring re-login
    // when following links to admin from external sites (emails, bookmarks with full URL)
    const maxAge = process.env.NODE_ENV === "production" ? 60 * 60 * 24 : 60 * 60 * 24 * 7; // 24h en prod, 7 jours en dev
    response.cookies.set("psypnos_admin_token", token, getAdminCookieOptions(maxAge));

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const apiError = createApiError(ErrorCode.INTERNAL_ERROR);
    return NextResponse.json(apiError, { status: apiError.statusCode });
  }
}
