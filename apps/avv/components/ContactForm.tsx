/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { trackConversionEvent } from "../hooks/useAnalytics";
import { useCSRF } from "../hooks/useCSRF";

import { CTAButton } from "./CTAButton";

const initialValues = {
  name: "",
  email: "",
  message: "",
  honeypot: ""
};

type FormValues = typeof initialValues;

type SubmissionStatus = "idle" | "pending" | "success" | "error";

type FieldName = keyof FormValues;

type ContactFormProps = {
  className?: string;
};

const joinClassName = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

const validateValues = (values: FormValues) => {
  const errors: Partial<Record<FieldName, string>> = {};

  if (values.name.trim().length < 2) {
    errors.name = "Merci d’indiquer votre nom.";
  }

  if (!values.email.trim()) {
    errors.email = "Merci d’indiquer une adresse e-mail.";
  } else {
    const emailPattern = /\S+@\S+\.\S+/u;
    if (!emailPattern.test(values.email.trim())) {
      errors.email = "Merci d’indiquer une adresse e-mail valide.";
    }
  }

  if (values.message.trim().length < 10) {
    errors.message = "Merci de partager un message d’au moins 10 caractères.";
  }

  return errors;
};

export function ContactForm({ className }: ContactFormProps) {
  const [values, setValues] = useState<FormValues>({ ...initialValues });
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { csrfToken, isLoading: csrfLoading, error: csrfError, refreshToken } = useCSRF();

  const fieldIds = useMemo(
    () => ({
      name: "contact-name",
      email: "contact-email",
      message: "contact-message",
      honeypot: "contact-company"
    }),
    []
  );

  const handleFieldChange = useCallback(
    (field: FieldName) =>
      (
        event:
          | ChangeEvent<HTMLInputElement>
          | ChangeEvent<HTMLTextAreaElement>
      ) => {
        const value = event.target.value;

        setValues((current) => ({
          ...current,
          [field]: value
        }));

        if (status !== "pending") {
          setStatus("idle");
        }
        setErrorMessage(null);
      },
    [status]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (status === "pending") {
        return;
      }

      // Vérifier que le token CSRF est disponible
      if (!csrfToken) {
        setErrorMessage(
          "Erreur de sécurité. Veuillez rafraîchir la page et réessayer."
        );
        setStatus("error");
        return;
      }

      const errors = validateValues(values);
      if (Object.keys(errors).length > 0) {
        const firstError = errors[Object.keys(errors)[0] as FieldName];
        setErrorMessage(firstError ?? "Merci de vérifier les informations fournies.");
        setStatus("error");
        const firstField = Object.keys(errors)[0] as FieldName | undefined;
        if (firstField) {
          const element = document.getElementById(fieldIds[firstField]);
          if (element && "focus" in element) {
            (element as HTMLElement).focus();
          }
        }
        return;
      }

      if (values.honeypot.trim() !== "") {
        setValues({ ...initialValues });
        setStatus("success");
        return;
      }

      setStatus("pending");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
          },
          body: JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim(),
            message: values.message.trim(),
            csrf_token: csrfToken,
            meta: {
              honeypot: values.honeypot.trim(),
              submitted_at: new Date().toISOString(),
              source_page: window.location.href
            }
          })
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message =
            body?.message ??
            "Une erreur est survenue. Veuillez réessayer dans quelques instants.";
          throw new Error(message);
        }

        // Track successful conversion
        await trackConversionEvent(
          "contact_form",
          "form_submission_success",
          true
        );

        setValues({ ...initialValues });
        setStatus("success");

        // Rafraîchir le token CSRF après une soumission réussie
        await refreshToken();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue. Veuillez réessayer dans quelques instants.";
        setErrorMessage(message);
        setStatus("error");
      }
    },
    [fieldIds, status, values, csrfToken, refreshToken]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={joinClassName("grid gap-6", className)}
      noValidate
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col text-left text-sm text-ivory/80" htmlFor={fieldIds.name}>
          Nom
          <input
            id={fieldIds.name}
            type="text"
            name="name"
            value={values.name}
            onChange={handleFieldChange("name")}
            required
            className="mt-2 rounded-full border border-ivory/10 bg-night/80 px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
            autoComplete="name"
          />
        </label>
        <label className="flex flex-col text-left text-sm text-ivory/80" htmlFor={fieldIds.email}>
          Email
          <input
            id={fieldIds.email}
            type="email"
            name="email"
            value={values.email}
            onChange={handleFieldChange("email")}
            required
            className="mt-2 rounded-full border border-ivory/10 bg-night/80 px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
            autoComplete="email"
          />
        </label>
      </div>
      <label className="flex flex-col text-left text-sm text-ivory/80" htmlFor={fieldIds.message}>
        Message
        <textarea
          id={fieldIds.message}
          name="message"
          rows={4}
          value={values.message}
          onChange={handleFieldChange("message")}
          required
          className="mt-2 rounded-3xl border border-ivory/10 bg-night/80 px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </label>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={fieldIds.honeypot}>Votre société</label>
        <input
          id={fieldIds.honeypot}
          name="company"
          type="text"
          value={values.honeypot}
          onChange={handleFieldChange("honeypot")}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {csrfError && (
        <div
          className="rounded-2xl border border-feedback-error/40 bg-feedback-error/10 p-4 text-feedback-error-foreground"
          role="alert"
        >
          Erreur de sécurité : {csrfError}. Veuillez rafraîchir la page.
        </div>
      )}
      {status === "pending" && (
        <div
          className="rounded-2xl border border-feedback-info/40 bg-feedback-info/10 p-4 text-feedback-info-foreground"
          role="status"
          aria-live="polite"
        >
          Envoi en cours… Merci de patienter un instant.
        </div>
      )}
      {status === "success" && (
        <div
          className="rounded-2xl border border-feedback-success/40 bg-feedback-success/10 p-4 text-feedback-success-foreground"
          role="status"
          aria-live="polite"
        >
          Merci, votre message a bien été transmis. Je vous réponds au plus vite.
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
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ivory/60">
          En envoyant ce formulaire, vous acceptez notre{" "}
          <Link
            href="/politique-de-confidentialite"
            target="_blank"
            rel="noreferrer noopener"
            className="text-ivory underline underline-offset-4"
          >
            politique de confidentialité
          </Link>
          .
        </p>
        <CTAButton
          type="submit"
          variant="primary"
          disabled={status === "pending" || csrfLoading || !csrfToken || !!csrfError}
        >
          {status === "pending" ? "Envoi en cours…" : "Envoyer"}
        </CTAButton>
      </div>
    </form>
  );
}