/**
 * @kairn/ui Hooks
 *
 * Hooks React réutilisables pour les composants UI.
 */

export { useDebounce, useDebouncedCallback, useDebouncedState } from './useDebounce';
export {
  useFormSubmission,
  type FormSubmissionError,
  type FormSubmissionOptions,
  type UseFormSubmissionReturn,
} from './useFormSubmission';
export { useFormSessionStorage } from './useFormSessionStorage';
export { useHydrationSafeAnimation, useHasMounted } from './useHydrationSafeAnimation';
