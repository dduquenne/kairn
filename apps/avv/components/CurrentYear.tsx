"use client";

/**
 * Composant CurrentYear - Affiche l'année en cours de manière sécurisée
 *
 * Ce composant résout définitivement les erreurs d'hydratation liées à
 * l'utilisation de new Date().getFullYear() dans le rendu.
 *
 * La propriété suppressHydrationWarning indique à React d'ignorer les
 * différences de contenu entre le serveur et le client pour ce span,
 * ce qui est le comportement attendu pour une valeur qui peut différer
 * (par exemple, si le serveur est dans un fuseau horaire différent ou
 * si le rendu se fait autour de minuit le 31 décembre).
 */
export function CurrentYear() {
  return (
    <span suppressHydrationWarning>
      {new Date().getFullYear()}
    </span>
  );
}
