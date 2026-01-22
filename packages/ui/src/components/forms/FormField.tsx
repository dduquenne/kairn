"use client";

import { useMemo, type ReactNode, type ChangeEvent } from "react";
import { cn } from "../../utils/cn";
import type { FormFieldConfig } from "./types";

export interface FormFieldProps extends Omit<FormFieldConfig, "name"> {
  /** Field name */
  name: string;
  /** Field ID (defaults to name) */
  id?: string;
  /** Current value */
  value: string | boolean | number;
  /** Change handler */
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Error message */
  error?: string;
  /** Whether the field has been touched */
  touched?: boolean;
  /** Whether to show the error */
  showError?: boolean;
  /** Custom input class name */
  inputClassName?: string;
  /** Custom label class name */
  labelClassName?: string;
  /** Custom error class name */
  errorClassName?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Children (for custom content) */
  children?: ReactNode;
}

/**
 * Form field component with label, input, and error message
 *
 * @example
 * ```tsx
 * <FormField
 *   name="email"
 *   label="Email"
 *   type="email"
 *   value={values.email}
 *   onChange={handleChange("email")}
 *   onBlur={handleBlur("email")}
 *   error={getError("email")}
 *   required
 * />
 * ```
 */
export function FormField({
  name,
  id,
  label,
  type,
  placeholder,
  required,
  autoComplete,
  rows = 4,
  options = [],
  helpText,
  hidden,
  value,
  onChange,
  onBlur,
  error,
  touched,
  showError = true,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  disabled,
  children,
}: FormFieldProps) {
  const fieldId = id ?? name;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(error && (touched || showError));
  const isCheckbox = type === "checkbox";

  const baseInputStyles = cn(
    "w-full rounded-xl border px-4 py-3 text-base transition-all",
    "focus:outline-none focus:ring-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Default dark theme styles (can be overridden)
    "border-ivory/20 bg-night/70 text-ivory placeholder:text-ivory/40",
    "focus:border-gold focus:ring-gold/40"
  );

  const errorInputStyles = cn(
    "border-feedback-error/60 focus:border-feedback-error focus:ring-feedback-error/40"
  );

  const inputClasses = cn(
    baseInputStyles,
    hasError && errorInputStyles,
    inputClassName
  );

  const labelClasses = cn(
    "block text-sm font-medium",
    // Default dark theme styles
    "text-ivory",
    labelClassName
  );

  const errorClasses = cn(
    "mt-2 text-sm",
    // Default error styling
    "text-feedback-error-foreground",
    errorClassName
  );

  const inputProps = useMemo(
    () => ({
      id: fieldId,
      name,
      disabled,
      "aria-invalid": hasError,
      "aria-describedby": hasError ? errorId : undefined,
    }),
    [fieldId, name, disabled, hasError, errorId]
  );

  // Hidden field (for honeypot)
  if (hidden) {
    return (
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={fieldId}>{label}</label>
        <input
          {...inputProps}
          type="text"
          value={value as string}
          onChange={onChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
    );
  }

  // Checkbox field
  if (isCheckbox) {
    return (
      <div className={cn("flex items-start gap-3", className)}>
        <input
          {...inputProps}
          type="checkbox"
          checked={value as boolean}
          onChange={onChange}
          onBlur={onBlur}
          className={cn(
            "mt-1 h-5 w-5 rounded border",
            "border-ivory/40 bg-night/60 text-gold focus:ring-gold",
            inputClassName
          )}
        />
        <div className="flex-1">
          <label htmlFor={fieldId} className={cn("text-sm", labelClassName)}>
            {children ?? label}
            {required && <span className="ml-1 text-feedback-error" aria-hidden="true">*</span>}
          </label>
          {helpText && (
            <p className="mt-1 text-xs text-ivory/60">{helpText}</p>
          )}
          {hasError && (
            <p id={errorId} className={errorClasses} role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Select field
  if (type === "select") {
    return (
      <div className={className}>
        <label className={labelClasses} htmlFor={fieldId}>
          {label}
          {required && <span className="ml-1 text-feedback-error" aria-hidden="true">*</span>}
        </label>
        <select
          {...inputProps}
          value={value as string}
          onChange={onChange}
          onBlur={onBlur}
          className={inputClasses}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helpText && (
          <p className="mt-2 text-xs text-ivory/60">{helpText}</p>
        )}
        {hasError && (
          <p id={errorId} className={errorClasses} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Textarea field
  if (type === "textarea") {
    return (
      <div className={className}>
        <label className={labelClasses} htmlFor={fieldId}>
          {label}
          {required && <span className="ml-1 text-feedback-error" aria-hidden="true">*</span>}
        </label>
        <textarea
          {...inputProps}
          value={value as string}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className={cn(inputClasses, "mt-2")}
        />
        {helpText && (
          <p className="mt-2 text-xs text-ivory/60">{helpText}</p>
        )}
        {hasError && (
          <p id={errorId} className={errorClasses} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Default input field (text, email, tel, password, number)
  return (
    <div className={className}>
      <label className={labelClasses} htmlFor={fieldId}>
        {label}
        {required && <span className="ml-1 text-feedback-error" aria-hidden="true">*</span>}
      </label>
      <input
        {...inputProps}
        type={type}
        value={value as string | number}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={cn(inputClasses, "mt-2")}
      />
      {helpText && (
        <p className="mt-2 text-xs text-ivory/60">{helpText}</p>
      )}
      {hasError && (
        <p id={errorId} className={errorClasses} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

