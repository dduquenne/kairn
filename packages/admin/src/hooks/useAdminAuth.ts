"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface UseAdminAuthOptions {
  /** API endpoint to verify admin token */
  verifyEndpoint?: string;
  /** Path to redirect to if not authenticated */
  loginPath?: string;
  /** Required role for access */
  requiredRole?: string;
  /** Whether to auto-redirect on auth failure */
  autoRedirect?: boolean;
  /** Callback on auth success */
  onAuthSuccess?: (user: AdminUser) => void;
  /** Callback on auth failure */
  onAuthFailure?: () => void;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export interface UseAdminAuthResult {
  /** Whether authentication is being verified */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current admin user */
  user: AdminUser | null;
  /** Any error that occurred during auth check */
  error: Error | null;
  /** Function to manually re-check authentication */
  checkAuth: () => Promise<void>;
  /** Function to logout */
  logout: () => Promise<void>;
}

/**
 * useAdminAuth - Hook for verifying admin authentication
 *
 * @example
 * ```tsx
 * function AdminPage() {
 *   const { isLoading, isAuthenticated, user } = useAdminAuth({
 *     requiredRole: "admin",
 *     loginPath: "/login",
 *   });
 *
 *   if (isLoading) return <Loading />;
 *   if (!isAuthenticated) return null;
 *
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * ```
 */
export function useAdminAuth({
  verifyEndpoint = "/api/auth/verify",
  loginPath = "/login",
  requiredRole = "admin",
  autoRedirect = true,
  onAuthSuccess,
  onAuthFailure,
}: UseAdminAuthOptions = {}): UseAdminAuthResult {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(verifyEndpoint, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = (await response.json()) as { user?: AdminUser };
      const authUser = data.user;

      if (authUser && authUser.role === requiredRole) {
        setUser(authUser);
        setIsAuthenticated(true);
        onAuthSuccess?.(authUser);
      } else {
        throw new Error("Insufficient permissions");
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      setIsAuthenticated(false);
      setUser(null);
      onAuthFailure?.();

      if (autoRedirect) {
        const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
        router.push(`${loginPath}?next=${encodeURIComponent(currentPath)}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [verifyEndpoint, requiredRole, loginPath, autoRedirect, router, onAuthSuccess, onAuthFailure]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      router.push(loginPath);
      router.refresh();
    }
  }, [router, loginPath]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return {
    isLoading,
    isAuthenticated,
    user,
    error,
    checkAuth,
    logout,
  };
}
