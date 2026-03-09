'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

/**
 * Type pour la configuration de personnalisation (défini localement pour éviter les problèmes d'import)
 */
interface CustomizationColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface CustomizationTypography {
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  baseFontSize: number;
  lineHeight: number;
  headingLineHeight: number;
  letterSpacing: string;
  headingWeight: string;
}

interface CustomizationLayout {
  borderRadius: string;
  spacing: string;
  maxContentWidth: number;
  headerStyle: string;
  headerPosition: string;
  footerStyle: string;
}

interface CustomizationEffects {
  enableAnimations: boolean;
  animationSpeed: string;
  enableShadows: boolean;
  shadowIntensity: string;
  enableGradients: boolean;
  enableBlur: boolean;
  enableParallax: boolean;
}

interface CustomizationDarkMode {
  enabled: boolean;
  default: string;
}

interface CustomizationConfig {
  preset: string;
  colors: CustomizationColors;
  typography: CustomizationTypography;
  layout: CustomizationLayout;
  effects: CustomizationEffects;
  darkMode: CustomizationDarkMode;
}

/**
 * Context pour la personnalisation du site
 */
interface CustomizationContextValue {
  /** Configuration de personnalisation actuelle */
  config: CustomizationConfig | null;
  /** Indique si la configuration est en cours de chargement */
  isLoading: boolean;
  /** Erreur éventuelle lors du chargement */
  error: string | null;
  /** Recharge la configuration */
  refresh: () => Promise<void>;
}

const CustomizationContext = createContext<CustomizationContextValue | undefined>(undefined);

/**
 * Génère l'URL Google Fonts pour les polices sélectionnées
 */
function generateGoogleFontsUrl(config: CustomizationConfig): string | null {
  const { typography } = config;
  const fonts: string[] = [];

  // Polices à charger avec leurs poids
  const fontWeights = '400;500;600;700';

  if (typography.fontDisplay) {
    fonts.push(`family=${encodeURIComponent(typography.fontDisplay)}:wght@${fontWeights}`);
  }
  if (typography.fontBody && typography.fontBody !== typography.fontDisplay) {
    fonts.push(`family=${encodeURIComponent(typography.fontBody)}:wght@${fontWeights}`);
  }
  if (
    typography.fontMono &&
    typography.fontMono !== typography.fontDisplay &&
    typography.fontMono !== typography.fontBody
  ) {
    fonts.push(`family=${encodeURIComponent(typography.fontMono)}:wght@${fontWeights}`);
  }

  if (fonts.length === 0) return null;

  return `https://fonts.googleapis.com/css2?${fonts.join('&')}&display=swap`;
}

/**
 * Injecte les polices Google Fonts dans le document
 */
function injectGoogleFonts(config: CustomizationConfig): void {
  const url = generateGoogleFontsUrl(config);
  if (!url) return;

  // Vérifie si le lien existe déjà
  const existingLink = document.querySelector('link[data-customization-fonts]');
  if (existingLink) {
    existingLink.setAttribute('href', url);
    return;
  }

  // Crée un nouveau lien
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.setAttribute('data-customization-fonts', 'true');
  document.head.appendChild(link);
}

/**
 * Applique les variables CSS de personnalisation au document
 */
function applyCustomizationCSS(config: CustomizationConfig): void {
  const { colors, typography, layout, effects } = config;

  const root = document.documentElement;

  // Couleurs principales
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-foreground', colors.foreground);

  // Couleurs de feedback
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-info', colors.info);

  // Mapping des couleurs pour le thème Appréciez Votre Vie existant
  // Ces variables sont utilisées par les composants existants
  root.style.setProperty('--color-gold', colors.primary);
  root.style.setProperty('--color-gold-text', colors.primary);
  root.style.setProperty('--color-gold-accent', colors.accent);
  root.style.setProperty('--color-gold-hover', colors.accent);
  root.style.setProperty('--color-night', colors.secondary);
  root.style.setProperty('--color-ivory', colors.foreground);
  root.style.setProperty('--color-ivory-text', colors.foreground);

  // Typographie
  root.style.setProperty('--font-display', `'${typography.fontDisplay}', serif`);
  root.style.setProperty('--font-body', `'${typography.fontBody}', sans-serif`);
  root.style.setProperty('--font-mono', `'${typography.fontMono}', monospace`);
  root.style.setProperty('--font-size-base', `${typography.baseFontSize}px`);
  root.style.setProperty('--line-height', String(typography.lineHeight));
  root.style.setProperty('--line-height-heading', String(typography.headingLineHeight));

  // Layout
  const borderRadiusMap: Record<string, string> = {
    none: '0',
    small: '0.25rem',
    medium: '0.5rem',
    large: '1rem',
    full: '9999px',
  };
  root.style.setProperty('--border-radius', borderRadiusMap[layout.borderRadius] || '0.5rem');
  root.style.setProperty('--max-content-width', `${layout.maxContentWidth}px`);

  // Effets
  const animationSpeedMap: Record<string, string> = {
    slow: '400ms',
    normal: '200ms',
    fast: '100ms',
  };
  root.style.setProperty(
    '--animation-duration',
    animationSpeedMap[effects.animationSpeed] || '200ms'
  );

  if (effects.enableShadows) {
    const shadowOpacityMap: Record<string, string> = {
      subtle: '0.05',
      medium: '0.1',
      strong: '0.2',
    };
    root.style.setProperty(
      '--shadow-opacity',
      shadowOpacityMap[effects.shadowIntensity] || '0.1'
    );
  } else {
    root.style.setProperty('--shadow-opacity', '0');
  }
}

/**
 * Provider pour la personnalisation du site
 * Charge la configuration depuis l'API et applique les styles
 */
export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CustomizationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/customization');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la configuration');
      }

      const data = await response.json();

      if (data.customization) {
        setConfig(data.customization);
        // Applique les styles
        applyCustomizationCSS(data.customization);
        // Charge les polices
        injectGoogleFonts(data.customization);
      }
    } catch (err) {
      console.error('Error loading customization:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const contextValue: CustomizationContextValue = {
    config,
    isLoading,
    error,
    refresh: fetchConfig,
  };

  return (
    <CustomizationContext.Provider value={contextValue}>
      {children}
    </CustomizationContext.Provider>
  );
}

/**
 * Hook pour accéder au contexte de personnalisation
 */
export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (context === undefined) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
}
