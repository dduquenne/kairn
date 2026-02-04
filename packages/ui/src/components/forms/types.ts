/**
 * Types for the form system
 * @package @kairn/ui
 */

import type { ZodType, ZodTypeDef } from "zod";

/**
 * Form field configuration
 */
export interface FormFieldConfig {
  /** Field name (used as key in form values) */
  name: string;
  /** Label displayed above the field */
  label: string;
  /** Field type */
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox" | "password" | "number";
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Number of rows for textarea */
  rows?: number;
  /** Options for select fields */
  options?: Array<{ value: string; label: string }>;
  /** Help text displayed below the field */
  helpText?: string;
  /** Whether to hide the field visually (for honeypot) */
  hidden?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Form section configuration
 */
export interface FormSectionConfig {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Fields in this section */
  fields: FormFieldConfig[];
  /** Number of columns for the section (1 or 2) */
  columns?: 1 | 2;
  /** Custom class name */
  className?: string;
}

/**
 * Form submission status
 */
export type FormSubmissionStatus = "idle" | "pending" | "success" | "error";

/**
 * Form state
 */
export interface FormState<T extends Record<string, unknown>> {
  /** Current form values */
  values: T;
  /** Validation errors by field name */
  errors: Partial<Record<keyof T, string>>;
  /** Fields that have been touched */
  touched: Partial<Record<keyof T, boolean>>;
  /** Submission status */
  status: FormSubmissionStatus;
  /** General error message */
  generalError: string | null;
  /** Whether the form can be submitted */
  canSubmit: boolean;
}

/**
 * Form configuration
 */
export interface FormConfig<T extends Record<string, unknown>> {
  /** Initial form values */
  initialValues: T;
  /** Zod schema for validation */
  schema: ZodType<T, ZodTypeDef, unknown>;
  /** Form sections */
  sections: FormSectionConfig[];
  /** Submit button text */
  submitText?: string;
  /** Loading button text */
  loadingText?: string;
  /** Success message */
  successMessage?: string;
  /** Privacy policy URL */
  privacyPolicyUrl?: string;
  /** Privacy policy link text */
  privacyPolicyText?: string;
  /** API endpoint to submit to */
  apiEndpoint: string;
  /** Honeypot field name (for spam protection) */
  honeypotFieldName?: string;
  /** CSRF protection enabled */
  csrfEnabled?: boolean;
  /** Delay before allowing submission (in ms, for spam protection) */
  submissionDelay?: number;
  /** Storage key for persisting form data */
  storageKey?: string;
  /** Callback after successful submission */
  onSuccess?: (data: T) => void | Promise<void>;
  /** Callback after failed submission */
  onError?: (error: Error) => void;
  /** Custom class name for the form */
  className?: string;
}

/**
 * Form messages configuration
 */
export interface FormMessages {
  /** Loading message */
  loading?: string;
  /** Success message */
  success?: string;
  /** Generic error message */
  error?: string;
  /** CSRF error message */
  csrfError?: string;
  /** Rate limit message */
  rateLimitError?: string;
}

/**
 * Form colors configuration
 */
export interface FormColors {
  /** Primary color for buttons and accents */
  primary?: string;
  /** Background color */
  background?: string;
  /** Text color */
  text?: string;
  /** Muted text color */
  textMuted?: string;
  /** Border color */
  border?: string;
  /** Error color */
  error?: string;
  /** Success color */
  success?: string;
  /** Info color */
  info?: string;
}

/**
 * useFormValidation hook return type
 */
export interface UseFormValidationReturn<T extends Record<string, unknown>> {
  /** Current form values */
  values: T;
  /** Set a single field value */
  setValue: (field: keyof T, value: T[keyof T]) => void;
  /** Set multiple field values */
  setValues: (values: Partial<T>) => void;
  /** Reset form to initial values */
  reset: () => void;
  /** Validation errors */
  errors: Partial<Record<keyof T, string>>;
  /** Touched fields */
  touched: Partial<Record<keyof T, boolean>>;
  /** Mark a field as touched */
  setTouched: (field: keyof T, touched?: boolean) => void;
  /** Mark all fields as touched */
  touchAll: () => void;
  /** Whether the form is valid */
  isValid: boolean;
  /** Validate the form and return validated data or null */
  validate: () => T | null;
  /** Handle field change event */
  handleChange: (field: keyof T) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  /** Handle field blur event */
  handleBlur: (field: keyof T) => () => void;
  /** Check if a field has an error and has been touched */
  hasError: (field: keyof T) => boolean;
  /** Get error message for a field */
  getError: (field: keyof T) => string | undefined;
}
