// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface BackToPreviousButtonProps {
  className?: string;
  children?: ReactNode;
  fallbackHref?: string;
}

export function BackToPreviousButton({
  className,
  children = "Revenir à la page précédente",
  fallbackHref = "/",
}: BackToPreviousButtonProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }, [fallbackHref, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  );
}
