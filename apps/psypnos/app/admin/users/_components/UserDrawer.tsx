import { FormEvent, useEffect, useState } from "react";

import type { AdminUserFormValues, AdminUserUpdateValues } from "../types";

type UserDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues: AdminUserFormValues;
  onClose: () => void;
  onSubmit: (values: AdminUserFormValues | AdminUserUpdateValues) => void;
  submitting: boolean;
};

export function UserDrawer({ open, mode, initialValues, onClose, onSubmit, submitting }: UserDrawerProps) {
  const [email, setEmail] = useState(initialValues.email);
  const [password, setPassword] = useState(initialValues.password);

  useEffect(() => {
    setEmail(initialValues.email);
    setPassword(initialValues.password);
  }, [initialValues]);

  if (!open) {
    return null;
  }

  const isCreate = mode === "create";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCreate) {
      onSubmit({ email, password });
    } else {
      onSubmit({ email });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60">
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-night/50 bg-night/95 p-6 shadow-aurora">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-ivory">
              {isCreate ? "Nouvel utilisateur" : "Modifier l'utilisateur"}
            </h3>
            <p className="text-sm text-ivory/70">
              {isCreate
                ? "Créer un accès administrateur en définissant un mot de passe temporaire."
                : "Mettre à jour les informations de connexion."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-night/40 px-3 py-1 text-sm text-ivory/70 transition hover:border-night/60 hover:text-ivory"
          >
            Fermer
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="user-email" className="text-sm font-medium text-ivory">
              Adresse email
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
              placeholder="admin@psypnos.fr"
            />
          </div>
          {isCreate ? (
            <div className="space-y-2">
              <label htmlFor="user-password" className="text-sm font-medium text-ivory">
                Mot de passe temporaire
              </label>
              <input
                id="user-password"
                type="text"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                placeholder="Au moins 8 caractères"
              />
              <p className="text-xs text-ivory/60">
                Partagez ce mot de passe avec l'utilisateur. Il pourra le modifier après connexion.
              </p>
            </div>
          ) : null}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-night/40 px-4 py-2 text-sm text-ivory/70 transition hover:border-night/60 hover:text-ivory"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || (isCreate && password.length < 8)}
              className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-night transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Enregistrement..." : isCreate ? "Créer" : "Mettre à jour"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
