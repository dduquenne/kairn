"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { z } from "zod";
import { cn } from "../../utils/cn";
import { FormField } from "./FormField";
import { FormSection } from "./FormSection";
import { useFormValidation } from "./useFormValidation";
import type { FormSubmissionStatus, FormMessages, FormColors } from "./types";

/**
 * Default contact form schema
 */
const defaultContactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().email("Please enter a valid email address."),
  message: z.string().trim().min(10, "Please enter a message (at least 10 characters)."),
  honeypot: z.string().optional(),
});

type DefaultContactFormValues = z.infer<typeof defaultContactSchema>;

export interface ContactFormProps {
  /** API endpoint to submit to */
  apiEndpoint?: string;
  /** Field labels */
  labels?: {
    name?: string;
    email?: string;
    message?: string;
  };
  /** Field placeholders */
  placeholders?: {
    name?: string;
    email?: string;
    message?: string;
  };
  /** Form messages */
  messages?: FormMessages;
  /** Color configuration */
  colors?: FormColors;
  /** Submit button text */
  submitText?: string;
  /** Loading text */
  loadingText?: string;
  /** Privacy policy URL */
  privacyPolicyUrl?: string;
  /** Privacy policy text */
  privacyPolicyText?: string;
  /** CSRF token (if using external CSRF management) */
  csrfToken?: string;
  /** CSRF loading state */
  csrfLoading?: boolean;
  /** CSRF error */
  csrfError?: string | null;
  /** Refresh CSRF token callback */
  refreshCsrfToken?: () => Promise<void>;
  /** Callback after successful submission */
  onSuccess?: () => void | Promise<void>;
  /** Callback after failed submission */
  onError?: (error: Error) => void;
  /** Custom class name */
  className?: string;
  /** Custom submit button */
  submitButton?: ReactNode;
  /** Additional form content (rendered after fields, before submit) */
  children?: ReactNode;
  /** Conversion tracking callback */
  onConversion?: (type: string, action: string) => void | Promise<void>;
}

/**
 * Generic configurable contact form
 *
 * @example
 * ```tsx
 * <ContactForm
 *   apiEndpoint="/api/contact"
 *   labels={{
 *     name: "Full Name",
 *     email: "Email Address",
 *     message: "Your Message",
 *   }}
 *   privacyPolicyUrl="/privacy"
 *   onSuccess={() => console.log("Form submitted!")}
 * />
 * ```
 */
export function ContactForm({
  apiEndpoint = "/api/contact",
  labels = {},
  placeholders = {},
  messages = {},
  colors = {},
  submitText = "Send",
  loadingText = "Sending...",
  privacyPolicyUrl,
  privacyPolicyText = "privacy policy",
  csrfToken: externalCsrfToken,
  csrfLoading: externalCsrfLoading,
  csrfError: externalCsrfError,
  refreshCsrfToken,
  onSuccess,
  onError,
  className,
  submitButton,
  children,
  onConversion,
}: ContactFormProps) {
  const [status, setStatus] = useState<FormSubmissionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use external CSRF or internal state
  const [internalCsrfToken, setInternalCsrfToken] = useState<string | null>(null);
  const csrfToken = externalCsrfToken ?? internalCsrfToken;
  const csrfLoading = externalCsrfLoading ?? false;
  const csrfError = externalCsrfError ?? null;

  // Form validation
  const {
    values,
    handleChange,
    handleBlur,
    hasError,
    getError,
    validate,
    reset,
  } = useFormValidation({
    initialValues: {
      name: "",
      email: "",
      message: "",
      honeypot: "",
    } as DefaultContactFormValues,
    schema: defaultContactSchema,
  });

  // Generate internal CSRF token if not provided externally
  useEffect(() => {
    if (!externalCsrfToken && typeof window !== "undefined") {
      // Generate a simple CSRF token
      const token = crypto.randomUUID();
      setInternalCsrfToken(token);
    }
  }, [externalCsrfToken]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (status === "pending") return;

      // Validate CSRF
      if (!csrfToken) {
        setErrorMessage(messages.csrfError ?? "Security error. Please refresh the page.");
        setStatus("error");
        return;
      }

      // Validate form
      const validatedData = validate();
      if (!validatedData) {
        setStatus("error");
        return;
      }

      // Check honeypot
      if (validatedData.honeypot && validatedData.honeypot.trim() !== "") {
        // Bot detected - fake success
        reset();
        setStatus("success");
        return;
      }

      setStatus("pending");
      setErrorMessage(null);

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({
            name: validatedData.name,
            email: validatedData.email,
            message: validatedData.message,
            csrf_token: csrfToken,
            meta: {
              honeypot: validatedData.honeypot?.trim() ?? "",
              submitted_at: new Date().toISOString(),
              source_page: typeof window !== "undefined" ? window.location.href : "",
            },
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message = body?.message ?? messages.error ?? "An error occurred. Please try again.";
          throw new Error(message);
        }

        // Track conversion
        if (onConversion) {
          await onConversion("contact_form", "form_submission_success");
        }

        reset();
        setStatus("success");

        // Refresh CSRF token
        if (refreshCsrfToken) {
          await refreshCsrfToken();
        }

        // Callback
        if (onSuccess) {
          await onSuccess();
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : messages.error ?? "An error occurred. Please try again.";
        setErrorMessage(message);
        setStatus("error");

        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    },
    [
      status,
      csrfToken,
      validate,
      reset,
      apiEndpoint,
      messages,
      onConversion,
      refreshCsrfToken,
      onSuccess,
      onError,
    ]
  );

  // Field IDs
  const fieldIds = useMemo(
    () => ({
      name: "contact-name",
      email: "contact-email",
      message: "contact-message",
      honeypot: "contact-company",
    }),
    []
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("grid gap-6", className)}
      noValidate
    >
      <FormSection columns={2}>
        <FormField
          name="name"
          id={fieldIds.name}
          label={labels.name ?? "Name"}
          type="text"
          value={values.name}
          onChange={handleChange("name")}
          onBlur={handleBlur("name")}
          error={getError("name")}
          touched={hasError("name")}
          placeholder={placeholders.name}
          autoComplete="name"
          required
        />
        <FormField
          name="email"
          id={fieldIds.email}
          label={labels.email ?? "Email"}
          type="email"
          value={values.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          error={getError("email")}
          touched={hasError("email")}
          placeholder={placeholders.email}
          autoComplete="email"
          required
        />
      </FormSection>

      <FormField
        name="message"
        id={fieldIds.message}
        label={labels.message ?? "Message"}
        type="textarea"
        value={values.message}
        onChange={handleChange("message")}
        onBlur={handleBlur("message")}
        error={getError("message")}
        touched={hasError("message")}
        placeholder={placeholders.message}
        rows={4}
        required
      />

      {/* Honeypot */}
      <FormField
        name="honeypot"
        id={fieldIds.honeypot}
        label="Company"
        type="text"
        value={values.honeypot ?? ""}
        onChange={handleChange("honeypot")}
        hidden
      />

      {/* Additional content */}
      {children}

      {/* CSRF Error */}
      {csrfError && (
        <div
          className="rounded-2xl border border-feedback-error/40 bg-feedback-error/10 p-4 text-feedback-error-foreground"
          role="alert"
        >
          {messages.csrfError ?? `Security error: ${csrfError}. Please refresh the page.`}
        </div>
      )}

      {/* Status messages */}
      {status === "pending" && (
        <div
          className="rounded-2xl border border-feedback-info/40 bg-feedback-info/10 p-4 text-feedback-info-foreground"
          role="status"
          aria-live="polite"
        >
          {messages.loading ?? "Sending... Please wait."}
        </div>
      )}

      {status === "success" && (
        <div
          className="rounded-2xl border border-feedback-success/40 bg-feedback-success/10 p-4 text-feedback-success-foreground"
          role="status"
          aria-live="polite"
        >
          {messages.success ?? "Thank you! Your message has been sent successfully."}
        </div>
      )}

      {status === "error" && errorMessage && (
        <div
          className="rounded-2xl border border-feedback-error/40 bg-feedback-error/10 p-4 text-feedback-error-foreground"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* Footer with privacy policy and submit button */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        {privacyPolicyUrl && (
          <p className="text-xs text-ivory/60">
            By submitting this form, you agree to our{" "}
            <a
              href={privacyPolicyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-ivory underline underline-offset-4"
            >
              {privacyPolicyText}
            </a>
            .
          </p>
        )}

        {submitButton ?? (
          <button
            type="submit"
            disabled={status === "pending" || csrfLoading || !csrfToken || !!csrfError}
            className={cn(
              "inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-semibold transition",
              "bg-gold text-night hover:bg-gold/90",
              "focus:outline-none focus:ring-2 focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-night",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {status === "pending" ? loadingText : submitText}
          </button>
        )}
      </div>
    </form>
  );
}

