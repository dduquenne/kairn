// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-md border border-night/40 px-3 py-1 text-xs font-medium text-ivory/70 transition hover:border-night/60 hover:text-ivory disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Déconnexion..." : "Déconnexion"}
    </button>
  );
}
