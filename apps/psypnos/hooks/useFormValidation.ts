/**
 * Re-export useFormValidation depuis @kairn/ui
 *
 * Note: @kairn/ui fournit une version plus complète avec handleChange, handleBlur, etc.
 * L'ancienne API (validateForm, validateField, markFieldTouched) est remplacée par
 * la nouvelle (validate, handleChange, handleBlur, setValue, etc.)
 *
 * @deprecated Import directement depuis '@kairn/ui'
 */
export { useFormValidation, type UseFormValidationReturn } from '@kairn/ui';
export type { FormFieldConfig as FormErrors } from '@kairn/ui';
