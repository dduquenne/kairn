'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { useToast } from '@/lib/toast-context';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Get the redirect URL from query params, default to /admin/seminars
  const nextUrl = searchParams?.get('next') || '/admin/seminars';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (response.ok) {
      addToast({
        title: 'Connexion réussie',
        description: "Bienvenue dans l'espace administrateur",
        variant: 'success',
      });
      // Force a full page navigation to ensure the cookie is properly sent
      // router.push() can use client-side cache which may not see the new cookie
      window.location.href = nextUrl;
    } else {
      const payload = await response.json().catch(() => ({}));
      addToast({
        title: 'Connexion refusée',
        description: payload.error ?? 'Vérifiez vos identifiants',
        variant: 'error',
      });
    }

    setLoading(false);
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setForgotLoading(true);

    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const payload = await response.json().catch(() => ({}));
      addToast({
        title: 'Réinitialisation envoyée',
        description: payload.temporaryPassword
          ? `Mot de passe temporaire : ${payload.temporaryPassword}`
          : (payload.message ?? 'Un email a été envoyé si le compte existe.'),
        variant: 'success',
      });
      if (payload.temporaryPassword) {
        setShowForgotPassword(false);
        setPassword(payload.temporaryPassword);
      }
    } else {
      const payload = await response.json().catch(() => ({}));
      addToast({
        title: 'Réinitialisation impossible',
        description: payload.error ?? 'Une erreur est survenue',
        variant: 'error',
      });
    }

    setForgotLoading(false);
  }

  return (
    <div className="border-night/40 bg-night/80 shadow-aurora w-full max-w-md rounded-2xl border p-8">
      <h1 className="text-2xl font-semibold">Espace administrateur</h1>
      <p className="text-ivory/70 mt-2 text-sm">
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
            onChange={event => setEmail(event.target.value)}
            className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
            placeholder="vous@appreciezvotrevie.fr"
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
            onChange={event => setPassword(event.target.value)}
            className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-gold text-night hover:bg-gold/90 w-full rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setShowForgotPassword(prev => !prev)}
        className="text-gold hover:text-gold/80 mt-4 text-sm transition"
      >
        {showForgotPassword ? '← Retour à la connexion' : 'Mot de passe oublié ?'}
      </button>
      {showForgotPassword ? (
        <form className="mt-4 space-y-4" onSubmit={handleForgotPassword}>
          <p className="text-ivory/70 text-sm">
            Entrez votre adresse email pour générer un mot de passe temporaire.
          </p>
          <button
            type="submit"
            disabled={forgotLoading || email.length === 0}
            className="border-gold/60 text-gold hover:border-gold w-full rounded-md border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {forgotLoading ? 'Réinitialisation...' : 'Envoyer un mot de passe temporaire'}
          </button>
        </form>
      ) : null}
      <Link
        href="/"
        className="text-gold hover:text-gold/80 mt-6 inline-flex w-full justify-center text-sm transition"
      >
        ← Retour au site
      </Link>
    </div>
  );
}

export function LoginFormFallback() {
  return (
    <div className="border-night/40 bg-night/80 shadow-aurora w-full max-w-md animate-pulse rounded-2xl border p-8">
      <div className="bg-night/40 mb-4 h-8 w-3/4 rounded" />
      <div className="bg-night/40 mb-6 h-4 w-full rounded" />
      <div className="space-y-4">
        <div className="bg-night/40 h-10 rounded" />
        <div className="bg-night/40 h-10 rounded" />
        <div className="bg-gold/20 h-10 rounded" />
      </div>
    </div>
  );
}
