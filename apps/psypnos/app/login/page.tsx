"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";

import { useToast } from "@/lib/toast-context";
import { GlobalHeader } from "../../components/GlobalHeader";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Get the redirect URL from query params, default to /admin/seminars
  const nextUrl = searchParams?.get("next") || "/admin/seminars";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include"
    });

    if (response.ok) {
      addToast({
        title: "Connexion réussie",
        description: "Bienvenue dans l'espace administrateur",
        variant: "success"
      });
      // Force a full page navigation to ensure the cookie is properly sent
      // router.push() can use client-side cache which may not see the new cookie
      window.location.href = nextUrl;
    } else {
      const payload = await response.json().catch(() => ({}));
      addToast({
        title: "Connexion refusée",
        description: payload.error ?? "Vérifiez vos identifiants",
        variant: "error"
      });
    }

    setLoading(false);
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setForgotLoading(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      const payload = await response.json().catch(() => ({}));
      addToast({
        title: "Réinitialisation envoyée",
        description:
          payload.temporaryPassword
            ? `Mot de passe temporaire : ${payload.temporaryPassword}`
            : payload.message ?? "Un email a été envoyé si le compte existe.",
        variant: "success"
      });
      if (payload.temporaryPassword) {
        setShowForgotPassword(false);
        setPassword(payload.temporaryPassword);
      }
    } else {
      const payload = await response.json().catch(() => ({}));
      addToast({
        title: "Réinitialisation impossible",
        description: payload.error ?? "Une erreur est survenue",
        variant: "error"
      });
    }

    setForgotLoading(false);
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-night/40 bg-night/80 p-8 shadow-aurora">
      <h1 className="text-2xl font-semibold">Espace administrateur</h1>
      <p className="mt-2 text-sm text-ivory/70">
        Connectez-vous avec vos identifiants personnels pour accéder à l'interface d'administration.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            placeholder="vous@psypnos.fr"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-night transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setShowForgotPassword((prev) => !prev)}
        className="mt-4 text-sm text-gold transition hover:text-gold/80"
      >
        {showForgotPassword ? "← Retour à la connexion" : "Mot de passe oublié ?"}
      </button>
      {showForgotPassword ? (
        <form className="mt-4 space-y-4" onSubmit={handleForgotPassword}>
          <p className="text-sm text-ivory/70">
            Entrez votre adresse email pour générer un mot de passe temporaire.
          </p>
          <button
            type="submit"
            disabled={forgotLoading || email.length === 0}
            className="w-full rounded-md border border-gold/60 px-4 py-2 text-sm font-semibold text-gold transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {forgotLoading ? "Réinitialisation..." : "Envoyer un mot de passe temporaire"}
          </button>
        </form>
      ) : null}
      <Link
        href="/"
        className="mt-6 inline-flex w-full justify-center text-sm text-gold transition hover:text-gold/80"
      >
        ← Retour au site
      </Link>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-night/40 bg-night/80 p-8 shadow-aurora animate-pulse">
      <div className="h-8 bg-night/40 rounded w-3/4 mb-4" />
      <div className="h-4 bg-night/40 rounded w-full mb-6" />
      <div className="space-y-4">
        <div className="h-10 bg-night/40 rounded" />
        <div className="h-10 bg-night/40 rounded" />
        <div className="h-10 bg-gold/20 rounded" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <GlobalHeader context="login" />
      <div className="flex min-h-screen flex-col items-center justify-center bg-night text-ivory">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </>
  );
}
