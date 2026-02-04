/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * ============================================================================
 * CONFIGURATION CENTRALISÉE DES THÈMES ET COULEURS
 * ============================================================================
 *
 * Ce fichier consolide tous les paramètres de couleur et de thème du projet.
 * Il fusionne:
 * - app/blog/_constants/themeConstants.ts (COLOR_PALETTE, THEME_DARK, THEME_LIGHT)
 * - lib/categoryColors.ts (CATEGORY_COLORS)
 * - tailwind.config.ts (base colors)
 *
 * Utilisation:
 * - import { BRAND_COLORS, THEME_DARK, CATEGORY_COLORS, getCategoryColors } from '@/lib/config/theme'
 *
 * @module lib/config/theme
 * @version 1.0.0
 * @date 2025-12-08
 */

/**
 * COULEURS DE MARQUE PRINCIPALES
 * Couleurs fondamentales utilisées dans tout le projet
 */
export const BRAND_COLORS = {
  // Couleurs primaires de marque
  gold: '#c7a962',      // Or standard Psypnos
  goldLight: '#f0d9a3', // Or clair
  goldDark: '#8b7a3f',  // Or foncé
  ivory: '#f5f1e6',     // Blanc cassé/ivoire
  night: '#0e1f2f',     // Bleu marine foncé (night)

  // Couleurs de texte
  textDark: '#0a0a0b',     // Texte très foncé
  textLight: '#e8e8e8',    // Texte clair/gris clair
  textMuted: '#b0b0b0',    // Texte gris moyen
  textGold: '#c7a962',     // Texte doré

  // Couleurs de feedback
  success: '#10b981',      // Vert
  warning: '#f97316',      // Orange
  error: '#ef4444',        // Rouge
  info: '#3b82f6',         // Bleu
} as const;

/**
 * PALETTE DE COULEURS COMPLÈTE
 * Inclut les transparences et variations pour utilisation avancée
 */
export const COLOR_PALETTE = {
  // Couleurs texte principales
  TEXT_IVORY: '#f5f1e6',
  TEXT_NIGHT: '#0a0a0b',
  TEXT_LIGHT_GRAY: '#e8e8e8',
  TEXT_MUTED_GRAY: '#b0b0b0',
  TEXT_GOLD_STANDARD: '#c7a962ff',
  TEXT_GOLD_LIGHT: '#f0d9a3ff',
  TEXT_GOLD_DARK: '#8b7a3fff',

  // Couleurs d'accent
  ACCENT_GOLD_STANDARD: '#c7a962ff',
  ACCENT_GOLD_LIGHT: '#f0d9a3ff',
  ACCENT_GOLD_DARK: '#8b7a3fff',

  // Couleurs de base
  BG_NIGHT_DARK: 'rgba(14, 31, 47, 1)',
  BG_IVORY_LIGHT: '#f5f1e6',

  // Transparences Night
  NIGHT_95: 'rgba(14, 31, 47, 0.95)',
  NIGHT_90: 'rgba(14, 31, 47, 0.9)',
  NIGHT_85: 'rgba(14, 31, 47, 0.85)',
  NIGHT_80: 'rgba(14, 31, 47, 0.8)',
  NIGHT_70: 'rgba(14, 31, 47, 0.7)',
  NIGHT_60: 'rgba(14, 31, 47, 0.6)',
  NIGHT_50: 'rgba(14, 31, 47, 0.5)',
  NIGHT_30: 'rgba(14, 31, 47, 0.3)',
  NIGHT_20: 'rgba(14, 31, 47, 0.2)',
  NIGHT_10: 'rgba(14, 31, 47, 0.1)',

  // Transparences Ivory
  IVORY_95: 'rgba(245, 241, 230, 0.95)',
  IVORY_90: 'rgba(245, 241, 230, 0.90)',
  IVORY_85: 'rgba(245, 241, 230, 0.85)',
  IVORY_80: 'rgba(245, 241, 230, 0.80)',
  IVORY_70: 'rgba(245, 241, 230, 0.70)',
  IVORY_50: 'rgba(245, 241, 230, 0.50)',
  IVORY_30: 'rgba(245, 241, 230, 0.3)',
  IVORY_20: 'rgba(245, 241, 230, 0.2)',
  IVORY_10: 'rgba(245, 241, 230, 0.1)',
  IVORY_08: 'rgba(245, 241, 230, 0.08)',
  IVORY_05: 'rgba(245, 241, 230, 0.05)',

  // Transparences Gold Standard
  GOLD_STANDARD_70: 'rgba(199, 169, 98, 0.70)',
  GOLD_STANDARD_50: 'rgba(199, 169, 98, 0.50)',
  GOLD_STANDARD_30: 'rgba(199, 169, 98, 0.30)',
  GOLD_STANDARD_20: 'rgba(199, 169, 98, 0.20)',
  GOLD_STANDARD_10: 'rgba(199, 169, 98, 0.10)',
  GOLD_STANDARD_08: 'rgba(199, 169, 98, 0.08)',
  GOLD_STANDARD_05: 'rgba(199, 169, 98, 0.05)',

  // Transparences Gold Light
  GOLD_LIGHT_70: 'rgba(240, 217, 163, 0.70)',
  GOLD_LIGHT_50: 'rgba(240, 217, 163, 0.50)',
  GOLD_LIGHT_30: 'rgba(240, 217, 163, 0.30)',
  GOLD_LIGHT_20: 'rgba(240, 217, 163, 0.20)',
  GOLD_LIGHT_10: 'rgba(240, 217, 163, 0.10)',
  GOLD_LIGHT_08: 'rgba(240, 217, 163, 0.08)',
  GOLD_LIGHT_05: 'rgba(240, 217, 163, 0.05)',

  // Transparences Gold Dark
  GOLD_DARK_70: 'rgba(139, 122, 63, 0.70)',
  GOLD_DARK_50: 'rgba(139, 122, 63, 0.50)',
  GOLD_DARK_30: 'rgba(139, 122, 63, 0.30)',
  GOLD_DARK_20: 'rgba(139, 122, 63, 0.20)',
  GOLD_DARK_10: 'rgba(139, 122, 63, 0.10)',
  GOLD_DARK_08: 'rgba(139, 122, 63, 0.08)',
  GOLD_DARK_05: 'rgba(139, 122, 63, 0.05)',
} as const;

/**
 * CONFIGURATION DU THÈME SOMBRE (Mode nuit - défaut)
 * Utilisé dans le blog et la plupart des pages
 */
export const THEME_DARK = {
  box: {
    backgroundColor: COLOR_PALETTE.IVORY_90,
    borderColor: COLOR_PALETTE.BG_NIGHT_DARK,
    textColor: COLOR_PALETTE.TEXT_NIGHT,
  },
  typography: {
    headingColor: COLOR_PALETTE.TEXT_NIGHT,
    headingH3Color: COLOR_PALETTE.ACCENT_GOLD_DARK,
    bodyTextColor: COLOR_PALETTE.TEXT_NIGHT,
    mutedTextColor: COLOR_PALETTE.TEXT_MUTED_GRAY,
    linkColor: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    linkHoverColor: COLOR_PALETTE.ACCENT_GOLD_LIGHT,
  },
  components: {
    codeInlineBg: COLOR_PALETTE.NIGHT_80,
    codeInlineText: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    codeBlockBg: COLOR_PALETTE.NIGHT_90,
    codeBlockText: COLOR_PALETTE.TEXT_IVORY,
    blockquoteBorder: COLOR_PALETTE.ACCENT_GOLD_DARK,
    blockquoteText: COLOR_PALETTE.TEXT_GOLD_DARK,
    blockquoteBg: COLOR_PALETTE.GOLD_DARK_20,
    calloutNoteBorder: '#3b82f6',
    calloutNoteBg: 'rgba(59, 130, 246, 0.05)',
    calloutNoteText: '#1e3a8a',
    calloutNoteIcon: '#3b82f6',
    calloutTipBorder: '#10b981',
    calloutTipBg: 'rgba(16, 185, 129, 0.05)',
    calloutTipText: '#065f46',
    calloutTipIcon: '#10b981',
    calloutWarningBorder: '#f97316',
    calloutWarningBg: 'rgba(249, 115, 22, 0.05)',
    calloutWarningText: '#7c2d12',
    calloutWarningIcon: '#f97316',
    calloutQuoteBorder: '#a855f7',
    calloutQuoteBg: 'rgba(168, 85, 247, 0.05)',
    calloutQuoteText: '#581c87',
    calloutQuoteIcon: '#a855f7',
    tableBorder: COLOR_PALETTE.NIGHT_30,
    tableHeaderBg: COLOR_PALETTE.NIGHT_10,
    tableHeaderText: COLOR_PALETTE.TEXT_NIGHT,
    tableBodyText: COLOR_PALETTE.TEXT_NIGHT,
    listItemText: COLOR_PALETTE.TEXT_NIGHT,
    listMarkerColor: COLOR_PALETTE.NIGHT_60,
    listMarkerBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    listUnorderedMarker: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    listOrderedMarkerText: COLOR_PALETTE.TEXT_NIGHT,
    listOrderedMarkerBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    hrColor: COLOR_PALETTE.NIGHT_20,
    markBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    markText: COLOR_PALETTE.TEXT_NIGHT,
  },
  spacing: {
    paragraphMarginBottom: '1.5rem',
    headingMarginTop: '2rem',
    headingMarginBottom: '1rem',
    codeInlinePadding: '0.25rem 0.5rem',
    codeBlockPadding: '1.5rem',
  },
  other: {
    lineHeight: '1.75',
    letterSpacing: '0.01em',
  },
} as const;

/**
 * CONFIGURATION DU THÈME CLAIR (Mode jour)
 * Variante inversée du thème sombre
 */
export const THEME_LIGHT = {
  box: {
    backgroundColor: COLOR_PALETTE.IVORY_05,
    borderColor: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    textColor: COLOR_PALETTE.TEXT_IVORY,
  },
  typography: {
    headingColor: COLOR_PALETTE.TEXT_IVORY,
    headingH3Color: COLOR_PALETTE.ACCENT_GOLD_DARK,
    bodyTextColor: COLOR_PALETTE.TEXT_IVORY,
    mutedTextColor: COLOR_PALETTE.TEXT_LIGHT_GRAY,
    linkColor: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    linkHoverColor: COLOR_PALETTE.ACCENT_GOLD_LIGHT,
  },
  components: {
    codeInlineBg: COLOR_PALETTE.IVORY_10,
    codeInlineText: COLOR_PALETTE.ACCENT_GOLD_DARK,
    codeBlockBg: COLOR_PALETTE.IVORY_08,
    codeBlockText: COLOR_PALETTE.TEXT_IVORY,
    blockquoteBorder: COLOR_PALETTE.ACCENT_GOLD_DARK,
    blockquoteText: COLOR_PALETTE.TEXT_GOLD_DARK,
    blockquoteBg: COLOR_PALETTE.GOLD_LIGHT_20,
    calloutNoteBorder: '#3b82f6',
    calloutNoteBg: 'rgba(59, 130, 246, 0.08)',
    calloutNoteText: '#0c4a6e',
    calloutNoteIcon: '#3b82f6',
    calloutTipBorder: '#10b981',
    calloutTipBg: 'rgba(16, 185, 129, 0.08)',
    calloutTipText: '#065f46',
    calloutTipIcon: '#10b981',
    calloutWarningBorder: '#f97316',
    calloutWarningBg: 'rgba(249, 115, 22, 0.08)',
    calloutWarningText: '#92400e',
    calloutWarningIcon: '#f97316',
    calloutQuoteBorder: '#a855f7',
    calloutQuoteBg: 'rgba(168, 85, 247, 0.08)',
    calloutQuoteText: '#6b21a8',
    calloutQuoteIcon: '#a855f7',
    tableBorder: COLOR_PALETTE.IVORY_10,
    tableHeaderBg: COLOR_PALETTE.IVORY_05,
    tableHeaderText: COLOR_PALETTE.TEXT_IVORY,
    tableBodyText: COLOR_PALETTE.TEXT_IVORY,
    listItemText: COLOR_PALETTE.TEXT_IVORY,
    listMarkerColor: COLOR_PALETTE.IVORY_30,
    listMarkerBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    listUnorderedMarker: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    listOrderedMarkerText: COLOR_PALETTE.TEXT_IVORY,
    listOrderedMarkerBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    hrColor: COLOR_PALETTE.IVORY_10,
    markBg: COLOR_PALETTE.ACCENT_GOLD_STANDARD,
    markText: COLOR_PALETTE.TEXT_NIGHT,
  },
  spacing: {
    paragraphMarginBottom: '1.5rem',
    headingMarginTop: '2rem',
    headingMarginBottom: '1rem',
    codeInlinePadding: '0.25rem 0.5rem',
    codeBlockPadding: '1.5rem',
  },
  other: {
    lineHeight: '1.75',
    letterSpacing: '0.01em',
  },
} as const;

/**
 * COULEURS PAR CATÉGORIE DE BLOG
 * Utilisées pour différencier visuellement les catégories d'articles
 */
export const CATEGORY_COLORS = {
  'Comprendre': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/70',
    hover: 'hover:border-blue-500/90',
    gradient: 'from-blue-500/20 to-blue-500/5',
  },
  'Traverser': {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/70',
    hover: 'hover:border-green-500/90',
    gradient: 'from-green-500/20 to-green-500/5',
  },
  'Découvrir': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/70',
    hover: 'hover:border-purple-500/90',
    gradient: 'from-purple-500/20 to-purple-500/5',
  },
  'Cheminer': {
    bg: 'bg-gold/10',
    text: 'text-gold',
    border: 'border-gold/70',
    hover: 'hover:border-gold/90',
    gradient: 'from-gold/20 to-gold/5',
  },
} as const;

export type BlogCategory = keyof typeof CATEGORY_COLORS;

/**
 * Récupère les couleurs Tailwind pour une catégorie de blog
 * @param category - Catégorie d'article
 * @returns Objet avec classes Tailwind (bg, text, border, hover, gradient)
 * @example
 * const colors = getCategoryColors('Comprendre');
 * // { bg: 'bg-blue-500/10', text: 'text-blue-400', ... }
 */
export function getCategoryColors(category: string) {
  return CATEGORY_COLORS[category as BlogCategory] || CATEGORY_COLORS['Cheminer'];
}

/**
 * Retourne la configuration complète du thème
 * @param theme - 'dark' ou 'light'
 * @returns Configuration du thème demandé
 */
export function getThemeConfig(theme: 'dark' | 'light') {
  return theme === 'dark' ? THEME_DARK : THEME_LIGHT;
}

/**
 * Retourne une couleur spécifique basée sur le thème
 * @param theme - 'dark' ou 'light'
 * @param category - Catégorie de couleur (ex: 'components', 'typography')
 * @param property - Propriété de couleur (ex: 'codeInlineBg')
 * @returns Valeur hexadécimale ou rgba de la couleur
 */
export function getThemeColor(
  theme: 'dark' | 'light',
  category: keyof typeof THEME_DARK,
  property: string
): string {
  const config = getThemeConfig(theme);
  const categoryConfig = config[category as keyof typeof config] as any;
  return categoryConfig?.[property] || '';
}

/**
 * Génère les variables CSS pour un thème
 * Utile pour les fichiers CSS et stylesheets dynamiques
 * @param theme - 'dark' ou 'light'
 * @returns String contenant les déclarations CSS des variables
 */
export function generateCSSVariables(theme: 'dark' | 'light'): string {
  const config = getThemeConfig(theme);
  const css = `
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
