"use client";

import { useState } from "react";
import { ArticleThemeToggle } from "./ArticleThemeToggle";
import { ArticleThemeDark } from "./ArticleThemeDark";
import { ArticleThemeLight } from "./ArticleThemeLight";

/**
 * ============================================================================
 * COMPOSANT CONTENEUR ARTICLE - Sélection du thème
 * ============================================================================
 *
 * Ce composant gère la sélection entre les deux thèmes d'affichage:
 * - Mode NUIT (dark): Fond clair, texte foncé
 * - Mode JOUR (light): Fond très foncé, texte clair
 *
 * Les configurations de couleur pour chaque thème sont stockées dans:
 * app/blog/_constants/themeConstants.ts
 *
 * Chaque thème est implémenté dans son propre composant:
 * - ArticleThemeDark.tsx (MODE NUIT)
 * - ArticleThemeLight.tsx (MODE JOUR)
 *
 * POUR MODIFIER LES COULEURS:
 * ===========================
 * 1. Ouvrir: app/blog/_constants/themeConstants.ts
 * 2. Chercher: THEME_DARK ou THEME_LIGHT
 * 3. Modifier les couleurs dans les sections: typography, components, spacing
 * 4. Les changements s'appliqueront automatiquement aux deux thèmes
 */

interface ArticleContentBoxProps {
  content: string;
}

export function ArticleContentBox({ content }: ArticleContentBoxProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  return (
    <div className="relative">
      {/* Bouton de basculement thème */}
      <div className="absolute -top-12 right-0 z-10">
        <ArticleThemeToggle onThemeChange={setTheme} />
      </div>

      {/* Rendu du thème sélectionné */}
      {theme === "dark" ? (
        <ArticleThemeDark content={content} />
      ) : (
        <ArticleThemeLight content={content} />
      )}
    </div>
  );
}
