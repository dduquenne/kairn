/**
 * ============================================================================
 * CONSTANTES DE THÈME CENTRALISÉES POUR LE BLOG
 * ============================================================================
 *
 * Ce fichier centralise toutes les constantes de couleur et de style
 * pour les deux thèmes (jour et nuit) du blog.
 *
 * Utilisation:
 * - Dans les composants React: import { THEME_COLORS, THEME_DARK, THEME_LIGHT } from '@/app/blog/_constants/themeConstants'
 * - Dans les fichiers CSS: utiliser les variables CSS générées (--color-*, --bg-*, etc.)
 */

/**
 * ============================================================================
 * PALETTE DE COULEURS GLOBALE
 * ============================================================================
 * Couleurs réutilisables dans les deux thèmes
 */
export const COLOR_PALETTE = {
  // Couleurs texte principales
  TEXT_IVORY: "#f5f1e6", // Texte clair
  TEXT_NIGHT: "#0a0a0b", // Texte très foncé
  TEXT_LIGHT_GRAY: "#e8e8e8", // Gris clair
  TEXT_MUTED_GRAY: "#b0b0b0", // Gris moyen
  TEXT_GOLD_STANDARD: "#c7a962ff", // Gold standard
  TEXT_GOLD_LIGHT: "#f0d9a3ff", // Gold clair
  TEXT_GOLD_DARK: "#8b7a3fff", // Gold foncé

  // Couleurs d'accent - Doré Psypnos
  ACCENT_GOLD_STANDARD: "#c7a962ff", // Gold standard
  ACCENT_GOLD_LIGHT: "#f0d9a3ff", // Gold clair
  ACCENT_GOLD_DARK: "#8b7a3fff", // Gold foncé

  // Couleurs de base
  BG_NIGHT_DARK: "rgba(14, 31, 47, 1)", // Night très foncé
  BG_IVORY_LIGHT: "#f5f1e6", // Ivory très clair

  // Transparences Night
  NIGHT_95: "rgba(14, 31, 47, 0.95)",
  NIGHT_90: "rgba(14, 31, 47, 0.9)",
  NIGHT_85: "rgba(14, 31, 47, 0.85)",
  NIGHT_80: "rgba(14, 31, 47, 0.8)",
  NIGHT_70: "rgba(14, 31, 47, 0.7)",
  NIGHT_60: "rgba(14, 31, 47, 0.6)",
  NIGHT_50: "rgba(14, 31, 47, 0.5)",
  NIGHT_30: "rgba(14, 31, 47, 0.3)",
  NIGHT_20: "rgba(14, 31, 47, 0.2)",
  NIGHT_10: "rgba(14, 31, 47, 0.1)",

  // Transparences Ivory
  IVORY_95: "rgba(245, 241, 230, 0.95)",
  IVORY_90: "rgba(245, 241, 230, 0.90)",
  IVORY_85: "rgba(245, 241, 230, 0.85)",
  IVORY_80: "rgba(245, 241, 230, 0.80)",
  IVORY_70: "rgba(245, 241, 230, 0.70)",
  IVORY_50: "rgba(245, 241, 230, 0.50)",
  IVORY_30: "rgba(245, 241, 230, 0.3)",
  IVORY_20: "rgba(245, 241, 230, 0.2)",
  IVORY_10: "rgba(245, 241, 230, 0.1)",
  IVORY_08: "rgba(245, 241, 230, 0.08)",
  IVORY_05: "rgba(245, 241, 230, 0.05)",

  // Transparences Gold Standard
  GOLD_STANDARD_70: "rgba(199, 169, 98, 0.70)",
  GOLD_STANDARD_50: "rgba(199, 169, 98, 0.50)",
  GOLD_STANDARD_30: "rgba(199, 169, 98, 0.30)",
  GOLD_STANDARD_20: "rgba(199, 169, 98, 0.20)",
  GOLD_STANDARD_10: "rgba(199, 169, 98, 0.10)",
  GOLD_STANDARD_08: "rgba(199, 169, 98, 0.08)",
  GOLD_STANDARD_05: "rgba(199, 169, 98, 0.05)",

  // Transparences Gold Light
  GOLD_LIGHT_70: "rgba(240, 217, 163, 0.70)",
  GOLD_LIGHT_50: "rgba(240, 217, 163, 0.50)",
  GOLD_LIGHT_30: "rgba(240, 217, 163, 0.30)",
  GOLD_LIGHT_20: "rgba(240, 217, 163, 0.20)",
  GOLD_LIGHT_10: "rgba(240, 217, 163, 0.10)",
  GOLD_LIGHT_08: "rgba(240, 217, 163, 0.08)",
  GOLD_LIGHT_05: "rgba(240, 217, 163, 0.05)",

  // Transparences Gold Dark
  GOLD_DARK_70: "rgba(139, 122, 63, 0.70)",
  GOLD_DARK_50: "rgba(139, 122, 63, 0.50)",
  GOLD_DARK_30: "rgba(139, 122, 63, 0.30)",
  GOLD_DARK_20: "rgba(139, 122, 63, 0.20)",
  GOLD_DARK_10: "rgba(139, 122, 63, 0.10)",
  GOLD_DARK_08: "rgba(139, 122, 63, 0.08)",
  GOLD_DARK_05: "rgba(139, 122, 63, 0.05)",
};

/**
 * ============================================================================
 * CONFIGURATION DU THÈME SOMBRE (MODE NUIT - DÉFAUT)
 * ============================================================================
 * Fond clair, texte foncé, accent gold standard
 */
export const THEME_DARK = {
  // Configuration du conteneur principal
  box: {
    backgroundColor: COLOR_PALETTE.IVORY_90,
    borderColor: COLOR_PALETTE.BG_NIGHT_DARK,
    textColor: COLOR_PALETTE.TEXT_NIGHT,
  },

  // Typographie
  typography: {
    headingColor: COLOR_PALETTE.TEXT_NIGHT, // h1, h2, h4-h6
    headingH3Color: COLOR_PALETTE.ACCENT_GOLD_DARK, // h3 spécifique
    bodyTextColor: COLOR_PALETTE.TEXT_NIGHT,
    mutedTextColor: COLOR_PALETTE.TEXT_MUTED_GRAY,
    linkColor: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    linkHoverColor: COLOR_PALETTE.ACCENT_GOLD_LIGHT,
  },

  // Composants
  components: {
    // Code
    codeInlineBg: COLOR_PALETTE.NIGHT_80,
    codeInlineText: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    codeBlockBg: COLOR_PALETTE.NIGHT_90,
    codeBlockText: COLOR_PALETTE.TEXT_IVORY,

    // Blockquotes
    blockquoteBorder: COLOR_PALETTE.ACCENT_GOLD_DARK,
    blockquoteText: COLOR_PALETTE.TEXT_GOLD_DARK,
    blockquoteBg: COLOR_PALETTE.GOLD_DARK_20,

    // Callouts - NOTE (Bleu)
    calloutNoteBorder: "#3b82f6",
    calloutNoteBg: "rgba(59, 130, 246, 0.05)",
    calloutNoteText: "#1e3a8a",
    calloutNoteIcon: "#3b82f6",

    // Callouts - TIP (Vert)
    calloutTipBorder: "#10b981",
    calloutTipBg: "rgba(16, 185, 129, 0.05)",
    calloutTipText: "#065f46",
    calloutTipIcon: "#10b981",

    // Callouts - WARNING (Orange)
    calloutWarningBorder: "#f97316",
    calloutWarningBg: "rgba(249, 115, 22, 0.05)",
    calloutWarningText: "#7c2d12",
    calloutWarningIcon: "#f97316",

    // Callouts - QUOTE (Violet)
    calloutQuoteBorder: "#a855f7",
    calloutQuoteBg: "rgba(168, 85, 247, 0.05)",
    calloutQuoteText: "#581c87",
    calloutQuoteIcon: "#a855f7",

    // Tables
    tableBorder: COLOR_PALETTE.NIGHT_30,
    tableHeaderBg: COLOR_PALETTE.NIGHT_10,
    tableHeaderText: COLOR_PALETTE.TEXT_NIGHT,
    tableBodyText: COLOR_PALETTE.TEXT_NIGHT,

    // Listes
    listItemText: COLOR_PALETTE.TEXT_NIGHT,
    listMarkerColor: COLOR_PALETTE.NIGHT_60,
    listMarkerBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    listUnorderedMarker: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    listOrderedMarkerText: COLOR_PALETTE.TEXT_NIGHT,
    listOrderedMarkerBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,

    // Séparateurs
    hrColor: COLOR_PALETTE.NIGHT_20,

    // Highlights/Marks
    markBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    markText: COLOR_PALETTE.TEXT_NIGHT,
  },

  // Espacements et sizing
  spacing: {
    paragraphMarginBottom: "1.5rem",
    headingMarginTop: "2rem",
    headingMarginBottom: "1rem",
    codeInlinePadding: "0.25rem 0.5rem",
    codeBlockPadding: "1.5rem",
  },

  // Responsive et autres
  other: {
    lineHeight: "1.75",
    letterSpacing: "0.01em",
  },
};

/**
 * ============================================================================
 * CONFIGURATION DU THÈME CLAIR (MODE JOUR - INVERSÉ)
 * ============================================================================
 * Fond très foncé, texte clair, accent gold adapté
 */
export const THEME_LIGHT = {
  // Configuration du conteneur principal
  box: {
    backgroundColor: COLOR_PALETTE.IVORY_05,
    borderColor: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    textColor: COLOR_PALETTE.TEXT_IVORY,
  },

  // Typographie
  typography: {
    headingColor: COLOR_PALETTE.TEXT_IVORY, // h1, h2, h4-h6
    headingH3Color: COLOR_PALETTE.ACCENT_GOLD_DARK, // h3 spécifique
    bodyTextColor: COLOR_PALETTE.TEXT_IVORY,
    mutedTextColor: COLOR_PALETTE.TEXT_LIGHT_GRAY,
    linkColor: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    linkHoverColor: COLOR_PALETTE.ACCENT_GOLD_LIGHT,
  },

  // Composants
  components: {
    // Code
    codeInlineBg: COLOR_PALETTE.IVORY_10,
    codeInlineText: COLOR_PALETTE.ACCENT_GOLD_DARK,
    codeBlockBg: COLOR_PALETTE.IVORY_08,
    codeBlockText: COLOR_PALETTE.TEXT_IVORY,

    // Blockquotes
    blockquoteBorder: COLOR_PALETTE.ACCENT_GOLD_DARK,
    blockquoteText: COLOR_PALETTE.TEXT_GOLD_DARK,
    blockquoteBg: COLOR_PALETTE.GOLD_LIGHT_20,

    // Callouts - NOTE (Bleu)
    calloutNoteBorder: "#3b82f6",
    calloutNoteBg: "rgba(59, 130, 246, 0.08)",
    calloutNoteText: "#0c4a6e",
    calloutNoteIcon: "#3b82f6",

    // Callouts - TIP (Vert)
    calloutTipBorder: "#10b981",
    calloutTipBg: "rgba(16, 185, 129, 0.08)",
    calloutTipText: "#065f46",
    calloutTipIcon: "#10b981",

    // Callouts - WARNING (Orange)
    calloutWarningBorder: "#f97316",
    calloutWarningBg: "rgba(249, 115, 22, 0.08)",
    calloutWarningText: "#92400e",
    calloutWarningIcon: "#f97316",

    // Callouts - QUOTE (Violet)
    calloutQuoteBorder: "#a855f7",
    calloutQuoteBg: "rgba(168, 85, 247, 0.08)",
    calloutQuoteText: "#6b21a8",
    calloutQuoteIcon: "#a855f7",

    // Tables
    tableBorder: COLOR_PALETTE.IVORY_10,
    tableHeaderBg: COLOR_PALETTE.IVORY_05,
    tableHeaderText: COLOR_PALETTE.TEXT_IVORY,
    tableBodyText: COLOR_PALETTE.TEXT_IVORY,

    // Listes
    listItemText: COLOR_PALETTE.TEXT_IVORY,
    listMarkerColor: COLOR_PALETTE.IVORY_30,
    listMarkerBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    listUnorderedMarker: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    listOrderedMarkerText: COLOR_PALETTE.TEXT_IVORY,
    listOrderedMarkerBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,

    // Séparateurs
    hrColor: COLOR_PALETTE.IVORY_10,

    // Highlights/Marks
    markBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    markText: COLOR_PALETTE.TEXT_NIGHT,
  },

  // Espacements et sizing
  spacing: {
    paragraphMarginBottom: "1.5rem",
    headingMarginTop: "2rem",
    headingMarginBottom: "1rem",
    codeInlinePadding: "0.25rem 0.5rem",
    codeBlockPadding: "1.5rem",
  },

  // Responsive et autres
  other: {
    lineHeight: "1.75",
    letterSpacing: "0.01em",
  },
};

/**
 * ============================================================================
 * UTILITAIRES DE THÈME
 * ============================================================================
 */

/**
 * Retourne la configuration complète du thème
 */
export function getThemeConfig(theme: "dark" | "light") {
  return theme === "dark" ? THEME_DARK : THEME_LIGHT;
}

/**
 * Retourne une couleur basée sur le thème
 */
export function getThemeColor(
  theme: "dark" | "light",
  category: keyof typeof THEME_DARK,
  property: string
): string {
  const config = getThemeConfig(theme);
  const categoryConfig = config[category as keyof typeof config] as any;
  return categoryConfig?.[property] || "";
}

/**
 * Génère les variables CSS pour un thème
 * Utilisé pour les fichiers CSS
 */
export function generateCSSVariables(theme: "dark" | "light"): string {
  const config = getThemeConfig(theme);
  let css = "";

  // Variables de couleurs
  css += `
  --theme-box-bg: ${config.box.backgroundColor};
  --theme-box-border: ${config.box.borderColor};
  --theme-box-text: ${config.box.textColor};

  --theme-heading: ${config.typography.headingColor};
  --theme-heading-h3: ${config.typography.headingH3Color};
  --theme-body-text: ${config.typography.bodyTextColor};
  --theme-muted-text: ${config.typography.mutedTextColor};
  --theme-link: ${config.typography.linkColor};
  --theme-link-hover: ${config.typography.linkHoverColor};

  --theme-code-inline-bg: ${config.components.codeInlineBg};
  --theme-code-inline-text: ${config.components.codeInlineText};
  --theme-code-block-bg: ${config.components.codeBlockBg};
  --theme-code-block-text: ${config.components.codeBlockText};

  --theme-blockquote-border: ${config.components.blockquoteBorder};
  --theme-blockquote-text: ${config.components.blockquoteText};
  --theme-blockquote-bg: ${config.components.blockquoteBg};

  --theme-callout-note-border: ${config.components.calloutNoteBorder};
  --theme-callout-note-bg: ${config.components.calloutNoteBg};
  --theme-callout-note-text: ${config.components.calloutNoteText};
  --theme-callout-note-icon: ${config.components.calloutNoteIcon};

  --theme-callout-tip-border: ${config.components.calloutTipBorder};
  --theme-callout-tip-bg: ${config.components.calloutTipBg};
  --theme-callout-tip-text: ${config.components.calloutTipText};
  --theme-callout-tip-icon: ${config.components.calloutTipIcon};

  --theme-callout-warning-border: ${config.components.calloutWarningBorder};
  --theme-callout-warning-bg: ${config.components.calloutWarningBg};
  --theme-callout-warning-text: ${config.components.calloutWarningText};
  --theme-callout-warning-icon: ${config.components.calloutWarningIcon};

  --theme-callout-quote-border: ${config.components.calloutQuoteBorder};
  --theme-callout-quote-bg: ${config.components.calloutQuoteBg};
  --theme-callout-quote-text: ${config.components.calloutQuoteText};
  --theme-callout-quote-icon: ${config.components.calloutQuoteIcon};

  --theme-table-border: ${config.components.tableBorder};
  --theme-table-header-bg: ${config.components.tableHeaderBg};
  --theme-table-header-text: ${config.components.tableHeaderText};
  --theme-table-body-text: ${config.components.tableBodyText};

  --theme-list-text: ${config.components.listItemText};
  --theme-list-marker: ${config.components.listMarkerColor};
  --theme-list-marker-bg: ${config.components.listMarkerBg};
  --theme-list-unordered-marker: ${config.components.listUnorderedMarker};
  --theme-list-ordered-marker-text: ${config.components.listOrderedMarkerText};
  --theme-list-ordered-marker-bg: ${config.components.listOrderedMarkerBg};

  --theme-hr: ${config.components.hrColor};

  --theme-mark-bg: ${config.components.markBg};
  --theme-mark-text: ${config.components.markText};
  `;

  return css;
}
