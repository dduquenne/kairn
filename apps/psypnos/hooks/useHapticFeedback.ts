/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Hook pour le feedback haptique sur mobile
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export function useHapticFeedback() {
  /**
   * Déclenche un feedback haptique
   */
  const triggerHaptic = (style: HapticStyle = 'light') => {
    // Vérifier si le navigateur supporte les vibrations
    if (!('vibrate' in navigator)) {
      return;
    }

    // Patterns de vibration selon le style
    const patterns: Record<HapticStyle, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 40,
      selection: [5, 10, 5],
      success: [10, 50, 10],
      warning: [20, 100, 20],
      error: [50, 100, 50, 100, 50],
    };

    const pattern = patterns[style];

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Silently fail si vibration non supportée
      console.debug('Haptic feedback not supported:', error);
    }
  };

  /**
   * Feedback pour un tap/click
   */
  const tapFeedback = () => triggerHaptic('light');

  /**
   * Feedback pour une sélection
   */
  const selectionFeedback = () => triggerHaptic('selection');

  /**
   * Feedback pour un succès
   */
  const successFeedback = () => triggerHaptic('success');

  /**
   * Feedback pour un avertissement
   */
  const warningFeedback = () => triggerHaptic('warning');

  /**
   * Feedback pour une erreur
   */
  const errorFeedback = () => triggerHaptic('error');

  /**
   * Feedback pour un swipe
   */
  const swipeFeedback = () => triggerHaptic('medium');

  /**
   * Feedback pour un long press
   */
  const longPressFeedback = () => triggerHaptic('heavy');

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
