/**
 * Configuration du thème PSYPNOS
 *
 * Définit les couleurs, typographies et styles spécifiques au site PSYPNOS.
 * Ces valeurs sont utilisées pour générer les CSS variables et la config Tailwind.
 */

/**
 * Couleurs de marque PSYPNOS
 */
export const brandColors = {
  // Couleurs primaires
  gold: {
    DEFAULT: '#c7a962',
    light: '#f0d9a3',
    dark: '#8b7a3f',
    50: '#fdfbf5',
    100: '#f9f3e6',
    200: '#f0e0c4',
    300: '#e6cc9e',
    400: '#d4b57a',
    500: '#c7a962',
    600: '#b08f4a',
    700: '#8b7a3f',
    800: '#6b5e32',
    900: '#4d4324',
  },
  night: {
    DEFAULT: '#0e1f2f',
    light: '#1a3347',
    dark: '#091520',
    50: '#e6eaed',
    100: '#c2ccd4',
    200: '#9aabb8',
    300: '#728a9c',
    400: '#4a6980',
    500: '#2d4a5f',
    600: '#1a3347',
    700: '#0e1f2f',
    800: '#091520',
    900: '#050b10',
  },
  ivory: {
    DEFAULT: '#f5f1e6',
    light: '#fdfcf9',
    dark: '#e8e1d0',
    50: '#fdfcf9',
    100: '#f9f6f0',
    200: '#f5f1e6',
    300: '#e8e1d0',
    400: '#d4c9b0',
    500: '#c0b090',
    600: '#a89870',
    700: '#8a7a50',
    800: '#6c5d3c',
    900: '#4e4028',
  },
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
    display: ['Playfair Display', 'serif'],
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
  'Comprendre': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/70',
    hover: 'hover:border-blue-500/90',
    gradient: 'from-blue-500/20 to-blue-500/5',
    hex: '#3b82f6',
  },
  'Traverser': {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/70',
    hover: 'hover:border-green-500/90',
    gradient: 'from-green-500/20 to-green-500/5',
    hex: '#22c55e',
  },
  'Découvrir': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/70',
    hover: 'hover:border-purple-500/90',
    gradient: 'from-purple-500/20 to-purple-500/5',
    hex: '#a855f7',
  },
  'Cheminer': {
    bg: 'bg-gold/10',
    text: 'text-gold',
    border: 'border-gold/70',
    hover: 'hover:border-gold/90',
    gradient: 'from-gold/20 to-gold/5',
    hex: '#c7a962',
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
 * Génère les CSS variables pour le thème PSYPNOS
 */
export function generateCSSVariables(): string {
  return `
    /* Couleurs primaires */
    --color-primary: ${brandColors.gold.DEFAULT};
    --color-primary-50: ${brandColors.gold[50]};
    --color-primary-100: ${brandColors.gold[100]};
    --color-primary-200: ${brandColors.gold[200]};
    --color-primary-300: ${brandColors.gold[300]};
    --color-primary-400: ${brandColors.gold[400]};
    --color-primary-500: ${brandColors.gold[500]};
    --color-primary-600: ${brandColors.gold[600]};
    --color-primary-700: ${brandColors.gold[700]};
    --color-primary-800: ${brandColors.gold[800]};
    --color-primary-900: ${brandColors.gold[900]};

    /* Couleurs secondaires */
    --color-secondary: ${brandColors.night.DEFAULT};
    --color-secondary-50: ${brandColors.night[50]};
    --color-secondary-100: ${brandColors.night[100]};
    --color-secondary-500: ${brandColors.night[500]};
    --color-secondary-700: ${brandColors.night[700]};
    --color-secondary-900: ${brandColors.night[900]};

    /* Couleurs de base */
    --color-background: ${brandColors.night.DEFAULT};
    --color-foreground: ${brandColors.ivory.DEFAULT};
    --color-muted: #b0b0b0;
    --color-muted-foreground: #888888;
    --color-accent: ${brandColors.gold.light};

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
    --font-display: 'Playfair Display', serif;
    --font-body: 'Inter', sans-serif;
  `;
}

/**
 * Configuration Tailwind extend pour PSYPNOS
 */
export const tailwindExtend = {
  colors: {
    gold: brandColors.gold,
    night: brandColors.night,
    ivory: brandColors.ivory,
  },
  fontFamily: {
    display: typography.fonts.display,
    body: typography.fonts.body,
  },
};

export default {
  brandColors,
  semanticColors,
  typography,
  categoryColors,
  getCategoryColors,
  generateCSSVariables,
  tailwindExtend,
};
