/**
 * Hook pour le feedback haptique sur mobile.
 *
 * Utilise l'API Vibration du navigateur pour fournir un retour tactile
 * avec différents styles (light, medium, heavy, success, error, etc.).
 *
 * @module hooks/useHapticFeedback
 */

/** Styles de feedback haptique disponibles */
export type HapticStyle =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

/** Patterns de vibration pour chaque style */
const HAPTIC_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  selection: [5, 10, 5],
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [50, 100, 50, 100, 50],
};

/**
 * Hook de feedback haptique.
 *
 * Fournit des fonctions pour déclencher des vibrations selon le contexte.
 * Dégradation gracieuse sur les appareils ne supportant pas l'API Vibration.
 *
 * @example
 * ```tsx
 * const { tapFeedback, successFeedback } = useHapticFeedback();
 * <button onClick={() => { tapFeedback(); doAction(); }}>
 * ```
 */
export function useHapticFeedback() {
  /** Déclenche un feedback haptique du style demandé */
  const triggerHaptic = (style: HapticStyle = 'light'): void => {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
      return;
    }

    const pattern = HAPTIC_PATTERNS[style];

    try {
      navigator.vibrate(pattern);
    } catch {
      // Dégradation silencieuse
    }
  };

  /** Feedback pour un tap/click */
  const tapFeedback = (): void => triggerHaptic('light');

  /** Feedback pour une sélection */
  const selectionFeedback = (): void => triggerHaptic('selection');

  /** Feedback pour un succès */
  const successFeedback = (): void => triggerHaptic('success');

  /** Feedback pour un avertissement */
  const warningFeedback = (): void => triggerHaptic('warning');

  /** Feedback pour une erreur */
  const errorFeedback = (): void => triggerHaptic('error');

  /** Feedback pour un swipe */
  const swipeFeedback = (): void => triggerHaptic('medium');

  /** Feedback pour un long press */
  const longPressFeedback = (): void => triggerHaptic('heavy');

  return {
    triggerHaptic,
    tapFeedback,
    selectionFeedback,
    successFeedback,
    warningFeedback,
    errorFeedback,
    swipeFeedback,
    longPressFeedback,
  };
}
