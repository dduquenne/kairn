/**
 * Re-export useDebounce depuis @kairn/ui
 *
 * @deprecated Import directement depuis '@kairn/ui/hooks'
 */
export { useDebounce, useDebouncedCallback, useDebouncedState } from '@kairn/ui/hooks';
export default useDebounce;

// Re-export from package
import { useDebounce } from '@kairn/ui/hooks';
