// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Reusable Form Field Component
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FIELD_MOTION } from "../constants";
import { joinClassNames } from "../utils";
import type { FormField as FormFieldType, FormErrors } from "../types";
import { REASSURANCE_MESSAGES } from "../constants";

interface FormFieldProps {
  id: FormFieldType;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "textarea" | "select";
  autoComplete?: string;
  placeholder?: string;
  value: string | number | "";
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  disabled?: boolean;
  touched?: boolean;
  error?: string;
  min?: number;
  max?: number;
  rows?: number;
  inputMode?: "text" | "numeric" | "tel" | "email";
  children?: React.ReactNode; // For select options
  className?: string;
}

const LABEL_CLASS = "text-xs font-semibold uppercase tracking-[0.2em] text-ivory/60";
const REASSURANCE_CLASS = "text-sm text-feedback-success";
const ERROR_TEXT_CLASS = "text-sm text-feedback-error";
const BASE_INPUT_CLASS =
  "w-full rounded-2xl border px-4 py-3 text-base text-ivory placeholder:text-ivory/35 shadow-inner shadow-night/40 transition focus:outline-none focus:ring-2";
const VALID_FIELD_CLASS =
  "border-ivory/15 bg-night/60 focus:border-gold/60 focus:ring-gold/30";
const ERROR_FIELD_CLASS =
  "border-feedback-error/60 bg-night/60 focus:border-feedback-error focus:ring-feedback-error/30";

export function FormField({
  id,
  label,
  type = "text",
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
}: FormFieldProps) {
  const hasError = touched && error;
  const fieldClass = joinClassNames(
    BASE_INPUT_CLASS,
    hasError ? ERROR_FIELD_CLASS : VALID_FIELD_CLASS,
    className
  );

  const showReassurance = touched && !error;
  const reassuranceMessage = REASSURANCE_MESSAGES[id];

  return (
    <motion.div {...FIELD_MOTION} className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>

      {type === "textarea" ? (
        <textarea
          id={id}
          className={joinClassNames(fieldClass, `min-h-[${rows * 30}px] resize-y`)}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={onChange}
          rows={rows}
        />
      ) : type === "select" ? (
        <select
          id={id}
          className={fieldClass}
          disabled={disabled}
          value={value}
          onChange={onChange}
        >
          {children}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          className={fieldClass}
          placeholder={placeholder}
          disabled={disabled}
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
            className={ERROR_TEXT_CLASS}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {error}
          </motion.span>
        ) : showReassurance && reassuranceMessage ? (
          <motion.span
            key={`${id}-hint`}
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
