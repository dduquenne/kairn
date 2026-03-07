'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Configuration des couleurs pour le fallback d'erreur
 */
export interface ErrorBoundaryColors {
  /** Classe CSS pour le fond principal */
  background?: string;
  /** Classe CSS pour le conteneur de la carte */
  card?: string;
  /** Classe CSS pour l'icône */
  iconContainer?: string;
  /** Classe CSS pour le titre */
  title?: string;
  /** Classe CSS pour le message */
  message?: string;
  /** Classe CSS pour le bouton de réessai */
  retryButton?: string;
  /** Classe CSS pour le bouton retour accueil */
  homeButton?: string;
  /** Classe CSS pour le bloc d'erreur dev */
  devErrorBlock?: string;
  /** Classe CSS pour le texte d'erreur dev */
  devErrorText?: string;
}

/**
 * Labels personnalisables pour l'ErrorBoundary
 */
export interface ErrorBoundaryLabels {
  /** Titre affiché lors d'une erreur */
  title?: string;
  /** Message d'explication */
  message?: string;
  /** Texte du bouton de réessai */
  retryButton?: string;
  /** Texte du bouton retour accueil */
  homeButton?: string;
}

/**
 * Callback de rapport d'erreur
 */
export type ErrorReportCallback = (
  error: Error,
  errorInfo: ErrorInfo,
  context?: Record<string, unknown>
) => void;

/**
 * Props du composant ErrorBoundary
 */
export interface ErrorBoundaryProps {
  /** Contenu enfant */
  children: ReactNode;
  /** Composant fallback personnalisé */
  fallback?: ReactNode;
  /** Fonction de rendu fallback avec accès à l'erreur et au reset */
  fallbackRender?: (props: { error: Error; resetErrorBoundary: () => void }) => ReactNode;
  /** Callback appelé lorsqu'une erreur est capturée */
  onError?: ErrorReportCallback;
  /** Callback appelé lors du reset */
  onReset?: () => void;
  /** Couleurs personnalisées pour le fallback par défaut */
  colors?: ErrorBoundaryColors;
  /** Labels personnalisés */
  labels?: ErrorBoundaryLabels;
  /** URL de la page d'accueil pour le lien retour */
  homeUrl?: string;
  /** Afficher les détails d'erreur en mode dev */
  showDevDetails?: boolean;
  /** Contexte additionnel envoyé au reporter */
  errorContext?: Record<string, unknown>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const DEFAULT_COLORS: Required<ErrorBoundaryColors> = {
  background: 'min-h-screen bg-gray-900 flex items-center justify-center p-6',
  card: 'max-w-md w-full bg-white/10 border border-white/20 rounded-xl p-6 text-center',
  iconContainer: 'bg-red-500/20 p-4 rounded-full',
  title: 'text-2xl font-bold text-white mb-2',
  message: 'text-white/70 mb-6',
  retryButton:
    'flex items-center justify-center gap-2 flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors',
  homeButton:
    'flex items-center justify-center gap-2 flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-colors',
  devErrorBlock: 'bg-black/40 rounded-lg p-4 mb-6 text-left',
  devErrorText: 'text-xs text-red-400 font-mono break-all',
};

const DEFAULT_LABELS: Required<ErrorBoundaryLabels> = {
  title: 'Une erreur est survenue',
  message: 'Nous sommes désolés, quelque chose s\u2019est mal passé. Veuillez réessayer.',
  retryButton: 'Réessayer',
  homeButton: "Retour à l'accueil",
};

/**
 * Composant ErrorBoundary centralisé et configurable.
 *
 * Capture les erreurs dans l'arbre React et affiche un fallback.
 * Supporte le reporting d'erreurs via callback, les couleurs et labels
 * personnalisables, et un mode développement avec détails d'erreur.
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, info) => logger.error('UI crash', error, { info })}
 *   labels={{ title: 'Oops!' }}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /** Dérive l'état d'erreur à partir de l'erreur capturée */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /** Capture l'erreur et appelle le callback onError */
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, errorContext } = this.props;

    if (onError) {
      onError(error, errorInfo, errorContext);
    } else {
      // Fallback : log console si aucun reporter configuré
      console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }
  }

  /** Réinitialise l'état d'erreur */
  handleReset = (): void => {
    const { onReset } = this.props;
    this.setState({ hasError: false, error: null });
    if (onReset) {
      onReset();
    }
  };

  override render(): ReactNode {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    // Priorité 1 : fallbackRender (fonction de rendu)
    if (this.props.fallbackRender) {
      return this.props.fallbackRender({
        error: this.state.error,
        resetErrorBoundary: this.handleReset,
      });
    }

    // Priorité 2 : fallback statique
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Priorité 3 : fallback par défaut configurable
    const colors = { ...DEFAULT_COLORS, ...this.props.colors };
    const labels = { ...DEFAULT_LABELS, ...this.props.labels };
    const showDevDetails = this.props.showDevDetails ?? process.env.NODE_ENV === 'development';
    const homeUrl = this.props.homeUrl ?? '/';

    return (
      <div className={colors.background}>
        <div className={colors.card}>
          <div className="mb-4 flex justify-center">
            <div className={colors.iconContainer}>
              <svg
                className="h-12 w-12 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>

          <h1 className={colors.title}>{labels.title}</h1>
          <p className={colors.message}>{labels.message}</p>

          {showDevDetails && this.state.error && (
            <div className={colors.devErrorBlock}>
              <p className={colors.devErrorText}>{this.state.error.message}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={this.handleReset} className={colors.retryButton}>
              {labels.retryButton}
            </button>
            <a href={homeUrl} className={colors.homeButton}>
              {labels.homeButton}
            </a>
          </div>
        </div>
      </div>
    );
  }
}
