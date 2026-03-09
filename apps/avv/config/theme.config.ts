/**
 * Configuration du thème Appréciez Votre Vie (AVV)
 *
 * Définit les couleurs, typographies et styles spécifiques au site AVV.
 * Ces valeurs sont utilisées pour générer les CSS variables et la config Tailwind.
 *
 * Palette inspirée du logo : arbre humain en dégradé violet/mauve/rosé.
 *
 * WCAG AA Compliance:
 * - Texte normal (< 18px): ratio minimum 4.5:1
 * - Texte large (≥ 18px ou 14px bold): ratio minimum 3:1
 * - Éléments UI: ratio minimum 3:1
 */

/**
 * Couleurs accessibles WCAG AA
 * Ratios de contraste calculés sur fond deep-purple (#1C1526)
 */
export const accessibleColors = {
  // Mauve éclairci pour texte sur fond sombre - Ratio ~8.5:1 sur deep-purple
  mauveText: '#C9B5D0',
  // Mauve standard pour accents décoratifs - Ratio ~5.5:1 sur deep-purple
  mauveAccent: '#8B7093',
  // Mauve très clair pour hover - Ratio ~10:1 sur deep-purple
  mauveHover: '#DFD0E5',
  // Blanc pour texte principal - Ratio ~15:1 sur deep-purple
  white: '#FFFFFF',
  // Lavande pour texte secondaire - Ratio ~12:1 sur deep-purple
  lavanderText: '#F5F0F5',
  // Lavande atténuée mais accessible - Ratio ~8:1 sur deep-purple
  lavanderMuted: '#C4B8C8',
} as const;

/**
 * Couleurs de marque AVV
 */
export const brandColors = {
  // Couleurs primaires avec variantes accessibles
  mauve: {
    DEFAULT: '#8B7093',
    light: '#C4A6B0',
    dark: '#5C4A66',
    // Variantes accessibles WCAG AA
    accessible: '#C9B5D0', // Ratio ~8.5:1 sur deep-purple - pour texte
    hover: '#DFD0E5', // Ratio ~10:1 sur deep-purple - pour hover
    50: '#FAF7FB',
    100: '#F0E8F3',
    200: '#E0D0E6',
    300: '#C9B5D0',
    400: '#A88FB5',
    500: '#8B7093',
    600: '#73597B',
    700: '#5C4A66',
    800: '#463850',
    900: '#31273A',
  },
  'deep-purple': {
    DEFAULT: '#1C1526',
    light: '#2A2038',
    dark: '#110D18',
    50: '#EAE8EC',
    100: '#C9C4CE',
    200: '#A69DAE',
    300: '#83778E',
    400: '#60546E',
    500: '#42374F',
    600: '#2A2038',
    700: '#1C1526',
    800: '#110D18',
    900: '#08060C',
  },
  lavender: {
    DEFAULT: '#F5F0F5',
    light: '#FDFCFD',
    dark: '#E8E0E8',
    // Variante accessible WCAG AA
    accessible: '#C4B8C8', // Ratio ~8:1 sur deep-purple
    50: '#FDFCFD',
    100: '#FAF7FA',
    200: '#F5F0F5',
    300: '#E8E0E8',
    400: '#D4C8D4',
    500: '#C0B0C0',
    600: '#A898A8',
    700: '#8A7A8A',
    800: '#6C5D6C',
    900: '#4E404E',
  },
} as const;

/**
 * Thème mode sombre (défaut)
 */
export const darkTheme = {
  background: brandColors['deep-purple'].DEFAULT,
  foreground: brandColors.lavender.DEFAULT,
  primary: accessibleColors.mauveText,
  primaryAccent: accessibleColors.mauveAccent,
  primaryHover: accessibleColors.mauveHover,
  muted: accessibleColors.lavanderMuted,
  mutedForeground: '#888888',
} as const;

/**
 * Thème mode clair
 */
export const lightTheme = {
  background: '#FFFFFF',
  foreground: brandColors['deep-purple'].DEFAULT,
  primary: brandColors.mauve[700], // Ratio ~7:1 sur blanc
  primaryAccent: brandColors.mauve[600], // Ratio ~5:1 sur blanc
  primaryHover: brandColors.mauve[800], // Ratio ~9:1 sur blanc
  muted: brandColors['deep-purple'][300],
  mutedForeground: brandColors['deep-purple'][400],
} as const;

/**
 * Couleurs sémantiques
 */
export const semanticColors = {
  success: {
    DEFAULT: '#10b981',
    light: '#d1fae5',
    dark: '#065f46',
  },
  warning: {
    DEFAULT: '#f97316',
    light: '#ffedd5',
    dark: '#9a3412',
  },
  error: {
    DEFAULT: '#ef4444',
    light: '#fee2e2',
    dark: '#991b1b',
  },
  info: {
    DEFAULT: '#3b82f6',
    light: '#dbeafe',
    dark: '#1e40af',
  },
} as const;

/**
 * Configuration typographique
 */
export const typography = {
  fonts: {
    display: ['Cormorant Garamond', 'serif'],
    body: ['Inter', 'sans-serif'],
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  lineHeights: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

/**
 * Couleurs par catégorie de blog
 */
export const categoryColors = {
  Comprendre: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/70',
    hover: 'hover:border-blue-500/90',
    gradient: 'from-blue-500/20 to-blue-500/5',
    hex: '#3b82f6',
  },
  Traverser: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/70',
    hover: 'hover:border-green-500/90',
    gradient: 'from-green-500/20 to-green-500/5',
    hex: '#22c55e',
  },
  Découvrir: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/70',
    hover: 'hover:border-purple-500/90',
    gradient: 'from-purple-500/20 to-purple-500/5',
    hex: '#a855f7',
  },
  Cheminer: {
    bg: 'bg-mauve/10',
    text: 'text-mauve',
    border: 'border-mauve/70',
    hover: 'hover:border-mauve/90',
    gradient: 'from-mauve/20 to-mauve/5',
    hex: '#8B7093',
  },
} as const;

export type BlogCategory = keyof typeof categoryColors;

/**
 * Récupère les couleurs pour une catégorie de blog
 */
export function getCategoryColors(category: string) {
  return categoryColors[category as BlogCategory] || categoryColors['Cheminer'];
}

/**
 * Génère les CSS variables pour le thème AVV
 * Inclut les couleurs accessibles WCAG AA
 */
export function generateCSSVariables(): string {
  return `
    /* Couleurs primaires */
    --color-primary: ${brandColors.mauve.DEFAULT};
    --color-primary-accessible: ${accessibleColors.mauveText};
    --color-primary-hover: ${accessibleColors.mauveHover};
    --color-primary-50: ${brandColors.mauve[50]};
    --color-primary-100: ${brandColors.mauve[100]};
    --color-primary-200: ${brandColors.mauve[200]};
    --color-primary-300: ${brandColors.mauve[300]};
    --color-primary-400: ${brandColors.mauve[400]};
    --color-primary-500: ${brandColors.mauve[500]};
    --color-primary-600: ${brandColors.mauve[600]};
    --color-primary-700: ${brandColors.mauve[700]};
    --color-primary-800: ${brandColors.mauve[800]};
    --color-primary-900: ${brandColors.mauve[900]};

    /* Couleurs secondaires */
    --color-secondary: ${brandColors['deep-purple'].DEFAULT};
    --color-secondary-50: ${brandColors['deep-purple'][50]};
    --color-secondary-100: ${brandColors['deep-purple'][100]};
    --color-secondary-500: ${brandColors['deep-purple'][500]};
    --color-secondary-700: ${brandColors['deep-purple'][700]};
    --color-secondary-900: ${brandColors['deep-purple'][900]};

    /* Couleurs de base - Mode sombre (défaut) */
    --color-background: ${darkTheme.background};
    --color-foreground: ${darkTheme.foreground};
    --color-muted: ${darkTheme.muted};
    --color-muted-foreground: ${darkTheme.mutedForeground};
    --color-accent: ${brandColors.mauve.light};

    /* Couleurs accessibles WCAG AA */
    --color-mauve-text: ${accessibleColors.mauveText};
    --color-mauve-accent: ${accessibleColors.mauveAccent};
    --color-mauve-hover: ${accessibleColors.mauveHover};
    --color-lavender-text: ${accessibleColors.lavanderText};
    --color-lavender-muted: ${accessibleColors.lavanderMuted};

    /* Couleurs sémantiques */
    --color-success: ${semanticColors.success.DEFAULT};
    --color-success-light: ${semanticColors.success.light};
    --color-warning: ${semanticColors.warning.DEFAULT};
    --color-warning-light: ${semanticColors.warning.light};
    --color-error: ${semanticColors.error.DEFAULT};
    --color-error-light: ${semanticColors.error.light};
    --color-info: ${semanticColors.info.DEFAULT};
    --color-info-light: ${semanticColors.info.light};

    /* Typographie */
    --font-display: 'Cormorant Garamond', serif;
    --font-body: 'Inter', sans-serif;
  `;
}

/**
 * Génère les CSS variables pour le mode clair
 */
export function generateLightThemeVariables(): string {
  return `
    --color-background: ${lightTheme.background};
    --color-foreground: ${lightTheme.foreground};
    --color-primary: ${lightTheme.primary};
    --color-primary-accessible: ${lightTheme.primary};
    --color-primary-hover: ${lightTheme.primaryHover};
    --color-muted: ${lightTheme.muted};
    --color-muted-foreground: ${lightTheme.mutedForeground};
    --color-mauve-text: ${lightTheme.primary};
    --color-mauve-accent: ${lightTheme.primaryAccent};
    --color-mauve-hover: ${lightTheme.primaryHover};
    --color-lavender-text: ${lightTheme.foreground};
    --color-lavender-muted: ${lightTheme.muted};
  `;
}

/**
 * Configuration Tailwind extend pour AVV
 */
export const tailwindExtend = {
  colors: {
    mauve: {
      ...brandColors.mauve,
      accessible: brandColors.mauve.accessible,
      hover: brandColors.mauve.hover,
    },
    'deep-purple': brandColors['deep-purple'],
    lavender: {
      ...brandColors.lavender,
      accessible: brandColors.lavender.accessible,
    },
    // Couleurs accessibles directement utilisables
    'mauve-text': accessibleColors.mauveText,
    'mauve-accent': accessibleColors.mauveAccent,
    'mauve-hover': accessibleColors.mauveHover,
    'lavender-text': accessibleColors.lavanderText,
    'lavender-muted': accessibleColors.lavanderMuted,
  },
  fontFamily: {
    display: [...typography.fonts.display],
    body: [...typography.fonts.body],
  },
};

export default {
  accessibleColors,
  brandColors,
  semanticColors,
  typography,
  categoryColors,
  darkTheme,
  lightTheme,
  getCategoryColors,
  generateCSSVariables,
  generateLightThemeVariables,
  tailwindExtend,
};
