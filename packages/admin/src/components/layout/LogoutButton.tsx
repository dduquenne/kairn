"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@kairn/ui";

export interface LogoutButtonProps {
  /** API endpoint for logout */
  logoutEndpoint?: string;
  /** Redirect path after logout */
  redirectPath?: string;
  /** Button text when idle */
  label?: string;
  /** Button text when logging out */
  loadingLabel?: string;
  /** Custom class names */
  className?: string;
  /** Callback after successful logout */
  onLogoutSuccess?: () => void;
}

/**
 * LogoutButton - Generic logout button for admin dashboard
 *
 * @example
 * ```tsx
 * <LogoutButton
 *   logoutEndpoint="/api/auth/logout"
 *   redirectPath="/login"
 * />
 * ```
 */
export function LogoutButton({
  logoutEndpoint = "/api/auth/logout",
  redirectPath = "/login",
  label = "Déconnexion",
  loadingLabel = "Déconnexion...",
  className,
  onLogoutSuccess,
}: LogoutButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await fetch(logoutEndpoint, {
          method: "POST",
          credentials: "include"
        });

        onLogoutSuccess?.();
        router.push(redirectPath);
        router.refresh();
      } catch (error) {
        console.error("Logout error:", error);
        // Still redirect on error
        router.push(redirectPath);
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "rounded-md border border-night/40 px-3 py-1 text-xs font-medium text-ivory/70 transition",
        "hover:border-night/60 hover:text-ivory",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {pending ? loadingLabel : label}
    </button>
  );
}
