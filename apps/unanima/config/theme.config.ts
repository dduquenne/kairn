/**
 * Configuration du thème UNANIMA
 *
 * Définit les couleurs, typographies et styles spécifiques au site UNANIMA.
 * Ces valeurs sont utilisées pour générer les CSS variables et la config Tailwind.
 */

/**
 * Couleurs de marque UNANIMA
 */
export const brandColors = {
  // Couleurs primaires - Indigo
  indigo: {
    DEFAULT: '#6366f1',
    light: '#a5b4fc',
    dark: '#4338ca',
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  slate: {
    DEFAULT: '#1e293b',
    light: '#334155',
    dark: '#0f172a',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  cream: {
    DEFAULT: '#f8fafc',
    light: '#ffffff',
    dark: '#f1f5f9',
    50: '#ffffff',
    100: '#f8fafc',
    200: '#f1f5f9',
    300: '#e2e8f0',
    400: '#cbd5e1',
    500: '#94a3b8',
    600: '#64748b',
    700: '#475569',
    800: '#334155',
    900: '#1e293b',
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
  'Découvrir': {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600',
    border: 'border-indigo-500/70',
    hover: 'hover:border-indigo-500/90',
    gradient: 'from-indigo-500/20 to-indigo-500/5',
    hex: '#6366f1',
  },
  'Comprendre': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/70',
    hover: 'hover:border-blue-500/90',
    gradient: 'from-blue-500/20 to-blue-500/5',
    hex: '#3b82f6',
  },
  'Pratiquer': {
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    border: 'border-green-500/70',
    hover: 'hover:border-green-500/90',
    gradient: 'from-green-500/20 to-green-500/5',
    hex: '#22c55e',
  },
  'Évoluer': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    border: 'border-purple-500/70',
    hover: 'hover:border-purple-500/90',
    gradient: 'from-purple-500/20 to-purple-500/5',
    hex: '#a855f7',
  },
} as const;

export type BlogCategory = keyof typeof categoryColors;

/**
 * Récupère les couleurs pour une catégorie de blog
 */
export function getCategoryColors(category: string) {
  return categoryColors[category as BlogCategory] || categoryColors['Découvrir'];
}

/**
 * Génère les CSS variables pour le thème UNANIMA
 */
export function generateCSSVariables(): string {
  return `
    /* Couleurs primaires */
    --color-primary: ${brandColors.indigo.DEFAULT};
    --color-primary-50: ${brandColors.indigo[50]};
    --color-primary-100: ${brandColors.indigo[100]};
    --color-primary-200: ${brandColors.indigo[200]};
    --color-primary-300: ${brandColors.indigo[300]};
    --color-primary-400: ${brandColors.indigo[400]};
    --color-primary-500: ${brandColors.indigo[500]};
    --color-primary-600: ${brandColors.indigo[600]};
    --color-primary-700: ${brandColors.indigo[700]};
    --color-primary-800: ${brandColors.indigo[800]};
    --color-primary-900: ${brandColors.indigo[900]};

    /* Couleurs secondaires */
    --color-secondary: ${brandColors.slate.DEFAULT};
    --color-secondary-50: ${brandColors.slate[50]};
    --color-secondary-100: ${brandColors.slate[100]};
    --color-secondary-500: ${brandColors.slate[500]};
    --color-secondary-700: ${brandColors.slate[700]};
    --color-secondary-900: ${brandColors.slate[900]};

    /* Couleurs de base */
    --color-background: ${brandColors.cream.DEFAULT};
    --color-foreground: ${brandColors.slate.DEFAULT};
    --color-muted: #94a3b8;
    --color-muted-foreground: #64748b;
    --color-accent: ${brandColors.indigo.light};

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
 * Configuration Tailwind extend pour UNANIMA
 */
export const tailwindExtend = {
  colors: {
    indigo: brandColors.indigo,
    slate: brandColors.slate,
    cream: brandColors.cream,
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
