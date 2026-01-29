import { z } from 'zod';

// ============================================================================
// SCHÉMAS DE PERSONNALISATION DU SITE
// ============================================================================

/**
 * Validation d'une couleur hexadécimale
 */
const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
  message: 'La couleur doit être au format hexadécimal (#RRGGBB)',
});

/**
 * Palette de couleurs complète avec variantes
 */
export const colorPaletteSchema = z.object({
  primary: hexColorSchema.describe('Couleur principale de la marque'),
  primaryLight: hexColorSchema.optional().describe('Variante claire de la couleur principale'),
  primaryDark: hexColorSchema.optional().describe('Variante sombre de la couleur principale'),
  secondary: hexColorSchema.describe('Couleur secondaire'),
  secondaryLight: hexColorSchema.optional(),
  secondaryDark: hexColorSchema.optional(),
  accent: hexColorSchema.describe('Couleur d\'accentuation'),
  accentLight: hexColorSchema.optional(),
  accentDark: hexColorSchema.optional(),
  background: hexColorSchema.default('#FFFFFF').describe('Couleur de fond principale'),
  backgroundAlt: hexColorSchema.optional().describe('Couleur de fond alternative'),
  foreground: hexColorSchema.default('#1A1A1A').describe('Couleur du texte principal'),
  foregroundMuted: hexColorSchema.optional().describe('Couleur du texte secondaire'),
  border: hexColorSchema.optional().describe('Couleur des bordures'),
  success: hexColorSchema.default('#22C55E').describe('Couleur de succès'),
  warning: hexColorSchema.default('#F59E0B').describe('Couleur d\'avertissement'),
  error: hexColorSchema.default('#EF4444').describe('Couleur d\'erreur'),
  info: hexColorSchema.default('#3B82F6').describe('Couleur d\'information'),
});

/**
 * Configuration typographique
 */
export const typographySchema = z.object({
  fontDisplay: z.string().default('Playfair Display').describe('Police pour les titres'),
  fontBody: z.string().default('Inter').describe('Police pour le corps de texte'),
  fontMono: z.string().default('JetBrains Mono').describe('Police monospace'),
  baseFontSize: z.number().min(12).max(20).default(16).describe('Taille de base en pixels'),
  lineHeight: z.number().min(1).max(2).default(1.6).describe('Hauteur de ligne'),
  headingLineHeight: z.number().min(1).max(1.5).default(1.2).describe('Hauteur de ligne des titres'),
  letterSpacing: z.enum(['tight', 'normal', 'wide']).default('normal').describe('Espacement des lettres'),
  headingWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).default('bold').describe('Graisse des titres'),
});

/**
 * Paramètres de mise en page
 */
export const layoutSchema = z.object({
  borderRadius: z.enum(['none', 'small', 'medium', 'large', 'full']).default('medium').describe('Rayon des bordures'),
  spacing: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable').describe('Espacement général'),
  maxContentWidth: z.number().min(800).max(1600).default(1280).describe('Largeur max du contenu en pixels'),
  headerStyle: z.enum(['transparent', 'solid', 'gradient']).default('solid').describe('Style de l\'en-tête'),
  headerPosition: z.enum(['fixed', 'sticky', 'static']).default('sticky').describe('Position de l\'en-tête'),
  footerStyle: z.enum(['minimal', 'standard', 'extended']).default('standard').describe('Style du pied de page'),
});

/**
 * Effets visuels et animations
 */
export const effectsSchema = z.object({
  enableAnimations: z.boolean().default(true).describe('Activer les animations'),
  animationSpeed: z.enum(['slow', 'normal', 'fast']).default('normal').describe('Vitesse des animations'),
  enableShadows: z.boolean().default(true).describe('Activer les ombres'),
  shadowIntensity: z.enum(['subtle', 'medium', 'strong']).default('medium').describe('Intensité des ombres'),
  enableGradients: z.boolean().default(true).describe('Activer les dégradés'),
  enableBlur: z.boolean().default(true).describe('Activer les effets de flou'),
  enableParallax: z.boolean().default(false).describe('Activer le parallax'),
});

/**
 * Mode sombre
 */
export const darkModeSchema = z.object({
  enabled: z.boolean().default(true).describe('Activer le mode sombre'),
  default: z.enum(['light', 'dark', 'system']).default('system').describe('Mode par défaut'),
  colors: colorPaletteSchema.partial().optional().describe('Surcharges de couleurs pour le mode sombre'),
});

/**
 * Préréglages de thèmes
 */
export const themePresetSchema = z.enum([
  'minimal',      // Épuré, beaucoup de blanc
  'elegant',      // Sophistiqué, touches de couleur
  'bold',         // Couleurs vives, contrastes forts
  'nature',       // Tons naturels, verts, terreux
  'ocean',        // Bleus, teintes marines
  'sunset',       // Oranges, roses, violets
  'monochrome',   // Nuances de gris
  'custom',       // Configuration personnalisée
]);

/**
 * Configuration complète de personnalisation
 */
export const customizationConfigSchema = z.object({
  // Métadonnées
  id: z.string().uuid().optional().describe('Identifiant unique de la configuration'),
  name: z.string().min(1).max(100).optional().describe('Nom de la configuration'),
  version: z.number().default(1).describe('Version de la configuration'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),

  // Préréglage ou personnalisé
  preset: themePresetSchema.default('custom'),

  // Couleurs
  colors: colorPaletteSchema,

  // Typographie
  typography: typographySchema,

  // Mise en page
  layout: layoutSchema,

  // Effets
  effects: effectsSchema,

  // Mode sombre
  darkMode: darkModeSchema,

  // CSS personnalisé (avancé)
  customCSS: z.string().max(10000).optional().describe('CSS personnalisé additionnel'),
});

// ============================================================================
// TYPES EXPORTÉS
// ============================================================================

export type HexColor = z.infer<typeof hexColorSchema>;
export type ColorPalette = z.infer<typeof colorPaletteSchema>;
export type Typography = z.infer<typeof typographySchema>;
export type Layout = z.infer<typeof layoutSchema>;
export type Effects = z.infer<typeof effectsSchema>;
export type DarkMode = z.infer<typeof darkModeSchema>;
export type ThemePreset = z.infer<typeof themePresetSchema>;
export type CustomizationConfig = z.infer<typeof customizationConfigSchema>;

// ============================================================================
// PRÉRÉGLAGES PAR DÉFAUT
// ============================================================================

export const DEFAULT_PRESETS: Record<ThemePreset, Partial<CustomizationConfig>> = {
  minimal: {
    preset: 'minimal',
    colors: {
      primary: '#1A1A1A',
      secondary: '#6B7280',
      accent: '#3B82F6',
      background: '#FFFFFF',
      foreground: '#1A1A1A',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    typography: {
      fontDisplay: 'Inter',
      fontBody: 'Inter',
      fontMono: 'JetBrains Mono',
      baseFontSize: 16,
      lineHeight: 1.6,
      headingLineHeight: 1.2,
      letterSpacing: 'normal',
      headingWeight: 'semibold',
    },
    effects: {
      enableAnimations: true,
      animationSpeed: 'fast',
      enableShadows: false,
      shadowIntensity: 'subtle',
      enableGradients: false,
      enableBlur: false,
      enableParallax: false,
    },
  },
  elegant: {
    preset: 'elegant',
    colors: {
      primary: '#C7A962',
      secondary: '#0E1F2F',
      accent: '#E5C78E',
      background: '#0E1F2F',
      foreground: '#F5F1E6',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    typography: {
      fontDisplay: 'Playfair Display',
      fontBody: 'Inter',
      fontMono: 'JetBrains Mono',
      baseFontSize: 16,
      lineHeight: 1.7,
      headingLineHeight: 1.2,
      letterSpacing: 'wide',
      headingWeight: 'bold',
    },
    effects: {
      enableAnimations: true,
      animationSpeed: 'normal',
      enableShadows: true,
      shadowIntensity: 'medium',
      enableGradients: true,
      enableBlur: true,
      enableParallax: false,
    },
  },
  bold: {
    preset: 'bold',
    colors: {
      primary: '#7C3AED',
      secondary: '#EC4899',
      accent: '#F59E0B',
      background: '#FAFAFA',
      foreground: '#18181B',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    typography: {
      fontDisplay: 'Poppins',
      fontBody: 'Inter',
      fontMono: 'Fira Code',
      baseFontSize: 16,
      lineHeight: 1.6,
      headingLineHeight: 1.1,
      letterSpacing: 'tight',
      headingWeight: 'bold',
    },
    effects: {
      enableAnimations: true,
      animationSpeed: 'fast',
      enableShadows: true,
      shadowIntensity: 'strong',
      enableGradients: true,
      enableBlur: true,
      enableParallax: true,
    },
  },
  nature: {
    preset: 'nature',
    colors: {
      primary: '#059669',
      secondary: '#78716C',
      accent: '#D97706',
      background: '#FEFCE8',
      foreground: '#1C1917',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#0891B2',
    },
    typography: {
      fontDisplay: 'Merriweather',
      fontBody: 'Source Sans Pro',
      fontMono: 'JetBrains Mono',
      baseFontSize: 16,
      lineHeight: 1.7,
      headingLineHeight: 1.3,
      letterSpacing: 'normal',
      headingWeight: 'bold',
    },
    effects: {
      enableAnimations: true,
      animationSpeed: 'slow',
      enableShadows: true,
      shadowIntensity: 'subtle',
      enableGradients: true,
      enableBlur: false,
      enableParallax: true,
    },
  },
  ocean: {
    preset: 'ocean',
    colors: {
      primary: '#0284C7',
      secondary: '#0E7490',
      accent: '#06B6D4',
      background: '#F0F9FF',
      foreground: '#0C4A6E',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    typography: {
      fontDisplay: 'Lora',
      fontBody: 'Open Sans',
      fontMono: 'JetBrains Mono',
      baseFontSize: 16,
      lineHeight: 1.6,
      headingLineHeight: 1.2,
      letterSpacing: 'normal',
      headingWeight: 'semibold',
    },
    effects: {
      enableAnimations: true,
      animationSpeed: 'normal',
      enableShadows: true,
      shadowIntensity: 'medium',
      enableGradients: true,
      enableBlur: true,
      enableParallax: false,
    },
  },
  sunset: {
    preset: 'sunset',
    colors: {
      primary: '#EA580C',
      secondary: '#DB2777',
      accent: '#FBBF24',
      background: '#FFFBEB',
      foreground: '#1E1B4B',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#8B5CF6',
    },
    typography: {
      fontDisplay: 'Quicksand',
      fontBody: 'Nunito',
      fontMono: 'Fira Code',
      baseFontSize: 16,
      lineHeight: 1.6,
      headingLineHeight: 1.2,
      letterSpacing: 'normal',
      headingWeight: 'bold',
    },
    effects: {
      enableAnimations: true,
      animationSpeed: 'normal',
      enableShadows: true,
      shadowIntensity: 'medium',
      enableGradients: true,
      enableBlur: true,
      enableParallax: false,
    },
  },
  monochrome: {
    preset: 'monochrome',
    colors: {
      primary: '#404040',
      secondary: '#737373',
      accent: '#171717',
      background: '#FAFAFA',
      foreground: '#171717',
      success: '#404040',
      warning: '#525252',
      error: '#262626',
      info: '#525252',
    },
    typography: {
      fontDisplay: 'IBM Plex Sans',
      fontBody: 'IBM Plex Sans',
      fontMono: 'IBM Plex Mono',
      baseFontSize: 16,
      lineHeight: 1.6,
      headingLineHeight: 1.2,
      letterSpacing: 'normal',
      headingWeight: 'medium',
    },
    effects: {
      enableAnimations: true,
      animationSpeed: 'fast',
      enableShadows: true,
      shadowIntensity: 'subtle',
      enableGradients: false,
      enableBlur: false,
      enableParallax: false,
    },
  },
  custom: {
    preset: 'custom',
    colors: {
      primary: '#C7A962',
      secondary: '#0E1F2F',
      accent: '#E5C78E',
      background: '#FFFFFF',
      foreground: '#1A1A1A',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    typography: {
      fontDisplay: 'Playfair Display',
      fontBody: 'Inter',
      fontMono: 'JetBrains Mono',
      baseFontSize: 16,
      lineHeight: 1.6,
      headingLineHeight: 1.2,
      letterSpacing: 'normal',
      headingWeight: 'bold',
    },
    effects: {
      enableAnimations: true,
      animationSpeed: 'normal',
      enableShadows: true,
      shadowIntensity: 'medium',
      enableGradients: true,
      enableBlur: true,
      enableParallax: false,
    },
  },
};

// ============================================================================
// POLICES DISPONIBLES (Google Fonts)
// ============================================================================

export const AVAILABLE_FONTS = {
  display: [
    { name: 'Playfair Display', category: 'serif', style: 'elegant' },
    { name: 'Merriweather', category: 'serif', style: 'classique' },
    { name: 'Lora', category: 'serif', style: 'literaire' },
    { name: 'Poppins', category: 'sans-serif', style: 'moderne' },
    { name: 'Montserrat', category: 'sans-serif', style: 'geometrique' },
    { name: 'Quicksand', category: 'sans-serif', style: 'arrondi' },
    { name: 'Raleway', category: 'sans-serif', style: 'elegant' },
    { name: 'Oswald', category: 'sans-serif', style: 'bold' },
    { name: 'IBM Plex Sans', category: 'sans-serif', style: 'professionnel' },
    { name: 'Inter', category: 'sans-serif', style: 'moderne' },
  ],
  body: [
    { name: 'Inter', category: 'sans-serif', style: 'moderne' },
    { name: 'Open Sans', category: 'sans-serif', style: 'lisible' },
    { name: 'Roboto', category: 'sans-serif', style: 'neutre' },
    { name: 'Source Sans Pro', category: 'sans-serif', style: 'classique' },
    { name: 'Nunito', category: 'sans-serif', style: 'arrondi' },
    { name: 'Lato', category: 'sans-serif', style: 'humaniste' },
    { name: 'IBM Plex Sans', category: 'sans-serif', style: 'professionnel' },
    { name: 'Work Sans', category: 'sans-serif', style: 'moderne' },
  ],
  mono: [
    { name: 'JetBrains Mono', category: 'monospace', style: 'moderne' },
    { name: 'Fira Code', category: 'monospace', style: 'ligatures' },
    { name: 'IBM Plex Mono', category: 'monospace', style: 'professionnel' },
    { name: 'Source Code Pro', category: 'monospace', style: 'classique' },
  ],
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Valide et retourne une configuration de personnalisation
 */
export function defineCustomizationConfig(config: CustomizationConfig): CustomizationConfig {
  return customizationConfigSchema.parse(config);
}

/**
 * Fusionne un préréglage avec des surcharges personnalisées
 */
export function mergePresetWithOverrides(
  preset: ThemePreset,
  overrides: Partial<CustomizationConfig> = {}
): CustomizationConfig {
  const basePreset = DEFAULT_PRESETS[preset];
  const merged = {
    ...basePreset,
    ...overrides,
    colors: { ...basePreset.colors, ...overrides.colors },
    typography: { ...basePreset.typography, ...overrides.typography },
    layout: { ...basePreset.layout, ...overrides.layout },
    effects: { ...basePreset.effects, ...overrides.effects },
    darkMode: { ...basePreset.darkMode, ...overrides.darkMode },
  };
  return customizationConfigSchema.parse(merged);
}

/**
 * Génère les variables CSS à partir d'une configuration
 */
export function generateCSSVariables(config: CustomizationConfig): string {
  const { colors, typography, layout, effects } = config;

  const borderRadiusMap = {
    none: '0',
    small: '0.25rem',
    medium: '0.5rem',
    large: '1rem',
    full: '9999px',
  };

  const spacingMap = {
    compact: '0.75',
    comfortable: '1',
    spacious: '1.25',
  };

  const animationSpeedMap = {
    slow: '400ms',
    normal: '200ms',
    fast: '100ms',
  };

  return `
:root {
  /* Couleurs principales */
  --color-primary: ${colors.primary};
  --color-primary-light: ${colors.primaryLight || adjustColor(colors.primary, 20)};
  --color-primary-dark: ${colors.primaryDark || adjustColor(colors.primary, -20)};
  --color-secondary: ${colors.secondary};
  --color-secondary-light: ${colors.secondaryLight || adjustColor(colors.secondary, 20)};
  --color-secondary-dark: ${colors.secondaryDark || adjustColor(colors.secondary, -20)};
  --color-accent: ${colors.accent};
  --color-accent-light: ${colors.accentLight || adjustColor(colors.accent, 20)};
  --color-accent-dark: ${colors.accentDark || adjustColor(colors.accent, -20)};

  /* Couleurs de fond et texte */
  --color-background: ${colors.background};
  --color-background-alt: ${colors.backgroundAlt || adjustColor(colors.background, -5)};
  --color-foreground: ${colors.foreground};
  --color-foreground-muted: ${colors.foregroundMuted || adjustColor(colors.foreground, 40)};
  --color-border: ${colors.border || adjustColor(colors.foreground, 80)};

  /* Couleurs de feedback */
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-error: ${colors.error};
  --color-info: ${colors.info};

  /* Typographie */
  --font-display: '${typography.fontDisplay}', serif;
  --font-body: '${typography.fontBody}', sans-serif;
  --font-mono: '${typography.fontMono}', monospace;
  --font-size-base: ${typography.baseFontSize}px;
  --line-height: ${typography.lineHeight};
  --line-height-heading: ${typography.headingLineHeight};

  /* Layout */
  --border-radius: ${borderRadiusMap[layout.borderRadius]};
  --spacing-multiplier: ${spacingMap[layout.spacing]};
  --max-content-width: ${layout.maxContentWidth}px;

  /* Effets */
  --animation-duration: ${animationSpeedMap[effects.animationSpeed]};
  --shadow-opacity: ${effects.enableShadows ? (effects.shadowIntensity === 'subtle' ? '0.05' : effects.shadowIntensity === 'medium' ? '0.1' : '0.2') : '0'};
}
`.trim();
}

/**
 * Ajuste une couleur hex (éclaircit ou assombrit)
 */
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(2.55 * percent)));
  return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}
