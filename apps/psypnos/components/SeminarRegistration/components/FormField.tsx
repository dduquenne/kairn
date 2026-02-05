/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Reusable Form Field Component - WCAG 2.1 AA Compliant
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { FIELD_MOTION, REASSURANCE_MESSAGES } from '../constants';
import type { FormField as FormFieldType, FormErrors } from '../types';
import { joinClassNames } from '../utils';

interface FormFieldProps {
  id: FormFieldType;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select';
  autoComplete?: string;
  placeholder?: string;
  value: string | number | '';
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  disabled?: boolean;
  touched?: boolean;
  error?: string;
  min?: number;
  max?: number;
  rows?: number;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
  children?: React.ReactNode; // For select options
  className?: string;
  required?: boolean;
  hint?: string;
}

const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-[0.2em] text-ivory/60';
const REASSURANCE_CLASS = 'text-sm text-feedback-success';
const ERROR_TEXT_CLASS = 'text-sm text-feedback-error';
const HINT_CLASS = 'text-xs text-ivory/50';
const BASE_INPUT_CLASS =
  'w-full rounded-2xl border px-4 py-3 text-base text-ivory placeholder:text-ivory/35 shadow-inner shadow-night/40 transition focus-ring-inset';
const VALID_FIELD_CLASS = 'border-ivory/15 bg-night/60';
const ERROR_FIELD_CLASS = 'border-feedback-error/60 bg-night/60';

export function FormField({
  id,
  label,
  type = 'text',
  autoComplete,
  placeholder,
  value,
  onChange,
  disabled = false,
  touched = false,
  error,
  min,
  max,
  rows = 4,
  inputMode,
  children,
  className,
  required = false,
  hint,
}: FormFieldProps) {
  const hasError = touched && error;
  const fieldClass = joinClassNames(
    BASE_INPUT_CLASS,
    hasError ? ERROR_FIELD_CLASS : VALID_FIELD_CLASS,
    className
  );

  const showReassurance = touched && !error;
  const reassuranceMessage = REASSURANCE_MESSAGES[id];

  // Generate unique IDs for accessibility
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const reassuranceId = `${id}-reassurance`;

  // Build aria-describedby value
  const getAriaDescribedBy = () => {
    const ids: string[] = [];
    if (hasError) ids.push(errorId);
    else if (showReassurance && reassuranceMessage) ids.push(reassuranceId);
    if (hint) ids.push(hintId);
    return ids.length > 0 ? ids.join(' ') : undefined;
  };

  const commonProps = {
    id,
    disabled,
    'aria-invalid': hasError ? true : undefined,
    'aria-describedby': getAriaDescribedBy(),
    'aria-required': required || undefined,
  };

  return (
    <motion.div {...FIELD_MOTION} className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {required && (
          <>
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> (obligatoire)</span>
          </>
        )}
      </label>

      {hint && (
        <span id={hintId} className={HINT_CLASS}>
          {hint}
        </span>
      )}

      {type === 'textarea' ? (
        <textarea
          {...commonProps}
          className={joinClassNames(fieldClass, `min-h-[${rows * 30}px] resize-y`)}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows}
        />
      ) : type === 'select' ? (
        <select {...commonProps} className={fieldClass} value={value} onChange={onChange}>
          {children}
        </select>
      ) : (
        <input
          {...commonProps}
          type={type}
          autoComplete={autoComplete}
          className={fieldClass}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          inputMode={inputMode}
        />
      )}

      <AnimatePresence mode="wait">
        {hasError ? (
          <motion.span
            key={`${id}-error`}
            id={errorId}
            className={ERROR_TEXT_CLASS}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {error}
          </motion.span>
        ) : showReassurance && reassuranceMessage ? (
          <motion.span
            key={`${id}-hint`}
            id={reassuranceId}
            className={REASSURANCE_CLASS}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {reassuranceMessage}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
