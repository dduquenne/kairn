// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import Link from "next/link";
import { z } from "zod";
import { trackConversionEvent } from "../hooks/useAnalytics";
import { useCSRF } from "../hooks/useCSRF";

const contactPreferenceValues = [
  "",
  "telephone",
  "email",
  "indifferent"
] as const;

const sessionTypeValues = ["", "presentiel", "visio", "telephone", "indecis"] as const;

const referralValues = [
  "",
  "bouche_a_oreille",
  "internet",
  "reseaux_sociaux",
  "recommandation",
  "conference_atelier",
  "autre"
] as const;

const appointmentRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Merci d’indiquer votre nom."),
    email: z
      .string()
      .email("Merci d’indiquer une adresse e-mail valide."),
    phone: z
      .string()
      .optional()
      .transform((value) => value?.trim() ?? "")
      .refine(
        (value) => value.length === 0 || /^[+0-9\s().-]{6,}$/u.test(value),
        {
          message:
            "Merci d’indiquer un numéro de téléphone valide (espaces et indicatifs acceptés)."
        }
      ),
    contact_preference: z.enum(contactPreferenceValues),
    reason: z
      .string()
      .trim()
      .min(10, "Merci de préciser le motif de votre demande (au moins 10 caractères)."),
    session_type: z.enum(sessionTypeValues),
    availability: z
      .string()
      .optional()
      .transform((value) => value?.trim() ?? ""),
    referral: z.enum(referralValues),
    solidarity_request: z.boolean(),
    solidarity_details: z
      .string()
      .optional()
      .transform((value) => value?.trim() ?? ""),
    consent: z
      .boolean()
      .refine((value) => value === true, {
        message: "Merci de cocher la case de consentement."
      })
  })
  .superRefine((data, ctx) => {
    if (data.solidarity_request && (!data.solidarity_details || data.solidarity_details.length < 10)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["solidarity_details"],
        message: "Merci de préciser brièvement votre situation pour le tarif solidaire (quelques mots suffisent)."
      });
    }
  })
  .transform((data) => ({
    ...data,
    name: data.name.trim(),
    reason: data.reason.trim(),
    availability: data.availability?.trim?.() ?? data.availability,
    phone: data.phone?.trim?.() ?? data.phone
  }));

type AppointmentRequestData = z.infer<typeof appointmentRequestSchema>;

type FormValues = AppointmentRequestData & {
  honeypot: string;
};

type FormField = keyof FormValues;

type FormErrors = Partial<Record<FormField, string>>;

const initialValues: FormValues = {
  name: "",
  email: "",
  phone: "",
  contact_preference: "",
  reason: "",
  session_type: "",
  availability: "",
  referral: "",
  solidarity_request: false,
  solidarity_details: "",
  consent: false,
  honeypot: ""
};

const STORAGE_KEY = "psypnos-appointment-request-form";

const logStorageError = (message: string, error: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, error);
  }
};

const validateForm = (values: FormValues) => {
  const { honeypot, ...formValues } = values;
  const parsed = appointmentRequestSchema.safeParse(formValues);

  if (parsed.success) {
    return {
      data: { ...parsed.data, honeypot: honeypot.trim() },
      errors: {} as FormErrors
    };
  }

  const errors: FormErrors = {};

  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") {
      errors[key as FormField] = issue.message;
    }
  }

  return { data: null, errors };
};

export default function AppointmentRequestForm() {
  const [formValues, setFormValues] = useState<FormValues>({ ...initialValues });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { csrfToken, isLoading: csrfLoading, error: csrfError, refreshToken } = useCSRF();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCanSubmit(true);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FormValues> | null;
        if (parsed) {
          const nextValues = { ...initialValues, ...parsed } as FormValues;
          setFormValues(nextValues);
          const validation = validateForm(nextValues);
          setErrors(validation.errors);
        }
      }
    } catch (error) {
      logStorageError("Unable to restore appointment form values", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formValues));
    } catch (error) {
      logStorageError("Unable to persist appointment form values", error);
    }
  }, [formValues, isHydrated]);

  const fieldIds = useMemo(() => ({
    name: "name",
    email: "email",
    phone: "phone",
    contact_preference: "contact-preference",
    reason: "reason",
    session_type: "session-type",
    availability: "availability",
    referral: "referral",
    solidarity_request: "solidarity-request",
    solidarity_details: "solidarity-details",
    consent: "consent",
    honeypot: "company"
  }), []);

  const handleFieldChange = useCallback(
    (field: FormField) =>
      (
        event:
          | ChangeEvent<HTMLInputElement>
          | ChangeEvent<HTMLTextAreaElement>
          | ChangeEvent<HTMLSelectElement>
      ) => {
        const target = event.target;
        const value =
          target instanceof HTMLInputElement && target.type === "checkbox"
            ? target.checked
            : target.value;

        setFormValues((previous) => {
          const next = { ...previous, [field]: value } as FormValues;
          const validation = validateForm(next);
          setErrors(validation.errors);
          return next;
        });

        setGeneralError(null);
        setTouched((previous) =>
          previous[field]
            ? previous
            : {
                ...previous,
                [field]: true
              }
        );
      },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setShowSuccess(false);
      setGeneralError(null);

      // Vérifier que le token CSRF est disponible
      if (!csrfToken) {
        setGeneralError(
          "Erreur de sécurité. Veuillez rafraîchir la page et réessayer."
        );
        return;
      }

      const validation = validateForm(formValues);

      if (!validation.data) {
        setErrors(validation.errors);
        setTouched({
          name: true,
          email: true,
          phone: true,
          contact_preference: true,
          reason: true,
          session_type: true,
          availability: true,
          referral: true,
          solidarity_request: true,
          solidarity_details: true,
          consent: true,
          honeypot: true
        });

        const firstField = Object.keys(validation.errors)[0] as FormField | undefined;
        if (firstField) {
          const element = document.getElementById(fieldIds[firstField]);
          if (element && "focus" in element) {
            (element as HTMLElement).focus();
          }
        }
        return;
      }

      if (!canSubmit) {
        setGeneralError(
          "Merci de patienter quelques secondes avant d'envoyer votre demande."
        );
        return;
      }

      if (validation.data.honeypot !== "") {
        setShowSuccess(true);
        return;
      }

      setIsSubmitting(true);

      try {
        const { honeypot, ...payload } = validation.data;

        const response = await fetch("/api/appointment-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
          },
          body: JSON.stringify({
            ...payload,
            csrf_token: csrfToken,
            meta: {
              honeypot,
              submitted_at: new Date().toISOString(),
              source_page: window.location.href
            }
          })
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          const message =
            errorBody?.message ??
            "Une erreur est survenue. Veuillez réessayer dans quelques instants.";
          throw new Error(message);
        }

        // Track successful conversion
        await trackConversionEvent(
          "appointment_request",
          "form_submission_success",
          true
        );

        setShowSuccess(true);
        setGeneralError(null);
        setFormValues({ ...initialValues });
        setErrors({});
        setTouched({});
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(STORAGE_KEY);
        }

        // Rafraîchir le token CSRF après une soumission réussie
        await refreshToken();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue. Veuillez réessayer dans quelques instants.";
        setGeneralError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [canSubmit, fieldIds, formValues, csrfToken, refreshToken]
  );

  const isFieldInvalid = useCallback(
    (field: FormField) => Boolean(errors[field] && touched[field]),
    [errors, touched]
  );

  const renderError = useCallback(
    (field: FormField) => {
      if (!isFieldInvalid(field)) {
        return null;
      }

      const id = `${fieldIds[field]}-error`;
      return (
        <p id={id} className="mt-2 text-sm text-red-400" role="alert">
          {errors[field]}
        </p>
      );
    },
    [errors, fieldIds, isFieldInvalid]
  );

  return (
    <section className="mx-auto max-w-3xl space-y-8 rounded-3xl border border-ivory/10 bg-night/60 p-8 shadow-xl shadow-night/40">
      <header className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold text-ivory">
          Demande de premier rendez-vous
        </h1>
        <p className="text-base text-ivory/80">
          Ce formulaire vous permet de demander un premier rendez-vous pour un accompagnement en psychothérapie ou en hypnose.
          Les informations transmises sont strictement confidentielles. Vous serez recontacté(e) dans les meilleurs délais pour convenir d’un échange.
        </p>
      </header>

      <div className="space-y-4 rounded-3xl border border-ivory/10 bg-night/60 p-6 text-sm text-ivory/80">
        <p className="text-base font-semibold text-ivory">Tarifs et modalités</p>
        <p>
          Le tarif d’une séance est de 70 €. Je propose un tarif solidaire de 40–50 € pour les personnes en difficulté financière. N’hésitez pas à m’en parler en toute confidentialité.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Durée d’une séance : 1 heure.</li>
          <li>Modes de paiement acceptés : chèque, virement ou espèces.</li>
          <li>En cas d’empêchement, merci de prévenir au moins 48h à l’avance afin de libérer le créneau ; une annulation tardive peut entraîner la facturation de la séance.</li>
        </ul>
      </div>

      <form className="space-y-6" noValidate onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label
              className="block text-sm font-medium text-ivory"
              htmlFor={fieldIds.name}
            >
              Prénom et Nom <span aria-hidden="true">*</span>
            </label>
            <input
              id={fieldIds.name}
              name="name"
              type="text"
              placeholder="Votre nom complet"
              value={formValues.name}
              onChange={handleFieldChange("name")}
              onBlur={handleFieldChange("name")}
              required
              aria-invalid={isFieldInvalid("name")}
              aria-describedby={
                isFieldInvalid("name") ? `${fieldIds.name}-error` : undefined
              }
              className="mt-2 w-full rounded-xl border border-ivory/20 bg-night/70 px-4 py-3 text-base text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
            {renderError("name")}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-ivory"
              htmlFor={fieldIds.email}
            >
              Adresse e-mail <span aria-hidden="true">*</span>
            </label>
            <input
              id={fieldIds.email}
              name="email"
              type="email"
              placeholder="exemple@domaine.fr"
              value={formValues.email}
              onChange={handleFieldChange("email")}
              onBlur={handleFieldChange("email")}
              required
              aria-invalid={isFieldInvalid("email")}
              aria-describedby={
                isFieldInvalid("email") ? `${fieldIds.email}-error` : undefined
              }
              className="mt-2 w-full rounded-xl border border-ivory/20 bg-night/70 px-4 py-3 text-base text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
              autoComplete="email"
            />
            {renderError("email")}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-ivory"
              htmlFor={fieldIds.phone}
            >
              Numéro de téléphone
            </label>
            <input
              id={fieldIds.phone}
              name="phone"
              type="tel"
              placeholder="06 12 34 56 78"
              value={formValues.phone}
              onChange={handleFieldChange("phone")}
              onBlur={handleFieldChange("phone")}
              aria-invalid={isFieldInvalid("phone")}
              aria-describedby={
                isFieldInvalid("phone") ? `${fieldIds.phone}-error` : undefined
              }
              className="mt-2 w-full rounded-xl border border-ivory/20 bg-night/70 px-4 py-3 text-base text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
              autoComplete="tel"
            />
            {renderError("phone")}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-ivory"
              htmlFor={fieldIds.contact_preference}
            >
              Préférence de contact
            </label>
            <select
              id={fieldIds.contact_preference}
              name="contact_preference"
              value={formValues.contact_preference}
              onChange={handleFieldChange("contact_preference")}
              onBlur={handleFieldChange("contact_preference")}
              aria-invalid={isFieldInvalid("contact_preference")}
              aria-describedby={
                isFieldInvalid("contact_preference")
                  ? `${fieldIds.contact_preference}-error`
                  : undefined
              }
              className="mt-2 w-full rounded-xl border border-ivory/20 bg-night/70 px-4 py-3 text-base text-ivory focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="">-- Sélectionnez une option --</option>
              <option value="telephone">Téléphone</option>
              <option value="email">E-mail</option>
              <option value="indifferent">Peu importe</option>
            </select>
            {renderError("contact_preference")}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-ivory"
              htmlFor={fieldIds.reason}
            >
              Motif de votre demande <span aria-hidden="true">*</span>
            </label>
            <textarea
              id={fieldIds.reason}
              name="reason"
              placeholder="Ex. : anxiété, deuil, perte de sens, accompagnement du changement..."
              value={formValues.reason}
              onChange={handleFieldChange("reason")}
              onBlur={handleFieldChange("reason")}
              required
              aria-invalid={isFieldInvalid("reason")}
              aria-describedby={
                isFieldInvalid("reason") ? `${fieldIds.reason}-error` : undefined
              }
              className="mt-2 w-full rounded-xl border border-ivory/20 bg-night/70 px-4 py-3 text-base text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
              rows={4}
            />
            {renderError("reason")}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-ivory"
              htmlFor={fieldIds.session_type}
            >
              Souhaitez-vous une première séance en présentiel ou en visioconférence ?
            </label>
            <select
              id={fieldIds.session_type}
              name="session_type"
              value={formValues.session_type}
              onChange={handleFieldChange("session_type")}
              onBlur={handleFieldChange("session_type")}
              aria-invalid={isFieldInvalid("session_type")}
              aria-describedby={
                isFieldInvalid("session_type") ? `${fieldIds.session_type}-error` : undefined
              }
              className="mt-2 w-full rounded-xl border border-ivory/20 bg-night/70 px-4 py-3 text-base text-ivory focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="">-- Sélectionnez une option --</option>
              <option value="presentiel">Présentiel à Saint-Julien-du-Sault</option>
              <option value="visio">Visioconférence</option>
              <option value="telephone">Téléphone</option>
              <option value="indecis">Je ne sais pas encore</option>
            </select>
            {renderError("session_type")}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-ivory"
              htmlFor={fieldIds.availability}
            >
              Disponibilités souhaitées
            </label>
            <textarea
              id={fieldIds.availability}
              name="availability"
              placeholder="Ex. : semaine, week-end, matin, après-midi…"
              value={formValues.availability}
              onChange={handleFieldChange("availability")}
              onBlur={handleFieldChange("availability")}
              aria-invalid={isFieldInvalid("availability")}
              aria-describedby={
                isFieldInvalid("availability")
                  ? `${fieldIds.availability}-error`
                  : undefined
              }
              className="mt-2 w-full rounded-xl border border-ivory/20 bg-night/70 px-4 py-3 text-base text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
              rows={3}
            />
            {renderError("availability")}
          </div>

          <div className="space-y-3 rounded-2xl border border-ivory/15 bg-night/70 p-4">
            <div className="flex items-start gap-3">
              <input
                id={fieldIds.solidarity_request}
                name="solidarity_request"
                type="checkbox"
                checked={formValues.solidarity_request}
                onChange={handleFieldChange("solidarity_request")}
                onBlur={handleFieldChange("solidarity_request")}
                aria-invalid={isFieldInvalid("solidarity_details")}
                className="mt-1 h-5 w-5 rounded border border-ivory/40 bg-night/60 text-gold focus:ring-gold"
              />
              <div className="space-y-1 text-sm text-ivory/80">
                <label htmlFor={fieldIds.solidarity_request} className="font-medium text-ivory">
                  Je souhaite discuter d’un tarif solidaire
                </label>
                <p>
                  Les demandes sont étudiées au cas par cas, en toute confidentialité, pour que l’accompagnement reste accessible.
                </p>
              </div>
            </div>
            {formValues.solidarity_request && (
              <div>
                <label
                  className="block text-sm font-medium text-ivory"
                  htmlFor={fieldIds.solidarity_details}
                >
                  Précisez brièvement votre situation
                </label>
                <textarea
                  id={fieldIds.solidarity_details}
                  name="solidarity_details"
                  placeholder="Ex. : situation étudiante, période de transition professionnelle, difficultés ponctuelles..."
                  value={formValues.solidarity_details}
                  onChange={handleFieldChange("solidarity_details")}
                  onBlur={handleFieldChange("solidarity_details")}
                  aria-invalid={isFieldInvalid("solidarity_details")}
                  aria-describedby={
                    isFieldInvalid("solidarity_details")
                      ? `${fieldIds.solidarity_details}-error`
                      : undefined
                  }
                  className="mt-2 w-full rounded-xl border border-ivory/20 bg-night/70 px-4 py-3 text-base text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
                  rows={3}
                />
                {renderError("solidarity_details")}
              </div>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-ivory"
              htmlFor={fieldIds.referral}
            >
              Comment avez-vous entendu parler de moi ?
            </label>
            <select
              id={fieldIds.referral}
              name="referral"
              value={formValues.referral}
              onChange={handleFieldChange("referral")}
              onBlur={handleFieldChange("referral")}
              aria-invalid={isFieldInvalid("referral")}
              aria-describedby={
                isFieldInvalid("referral") ? `${fieldIds.referral}-error` : undefined
              }
              className="mt-2 w-full rounded-xl border border-ivory/20 bg-night/70 px-4 py-3 text-base text-ivory focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="">-- Sélectionnez une option --</option>
              <option value="bouche_a_oreille">Bouche à oreille</option>
              <option value="internet">Recherche Internet</option>
              <option value="reseaux_sociaux">Réseaux sociaux</option>
              <option value="recommandation">Recommandation d’un professionnel</option>
              <option value="conference_atelier">Conférence ou atelier</option>
              <option value="autre">Autre</option>
            </select>
            {renderError("referral")}
          </div>

          <div className="flex items-start gap-3">
            <input
              id={fieldIds.consent}
              name="consent"
              type="checkbox"
              checked={formValues.consent}
              onChange={handleFieldChange("consent")}
              onBlur={handleFieldChange("consent")}
              required
              aria-invalid={isFieldInvalid("consent")}
              aria-describedby={
                isFieldInvalid("consent") ? `${fieldIds.consent}-error` : undefined
              }
              className="mt-1 h-5 w-5 rounded border border-ivory/40 bg-night/60 text-gold focus:ring-gold"
            />
            <label htmlFor={fieldIds.consent} className="text-sm text-ivory/80">
              <span className="font-medium text-ivory">Consentement RGPD *</span>
              <br />
              J’accepte que mes données soient utilisées uniquement dans le cadre de ma demande de rendez-vous, conformément à la
              {" "}
              <Link
                href="/politique-de-confidentialite"
                target="_blank"
                rel="noreferrer noopener"
                className="text-ivory underline underline-offset-4"
              >
                politique de confidentialité
              </Link>
              .
            </label>
          </div>
          {renderError("consent")}
        </div>

        <div className="sr-only" aria-hidden="true">
          <label htmlFor={fieldIds.honeypot}>Votre société</label>
          <input
            id={fieldIds.honeypot}
            name="company"
            type="text"
            value={formValues.honeypot}
            onChange={handleFieldChange("honeypot")}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {!showSuccess && (
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 text-base font-semibold text-night transition hover:bg-gold/90 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-night disabled:cursor-not-allowed disabled:bg-gold/60"
              disabled={isSubmitting || !canSubmit || csrfLoading || !csrfToken || !!csrfError}
            >
              {isSubmitting ? "Envoi en cours..." : csrfLoading ? "Chargement..." : "Envoyer ma demande"}
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-ivory/20 px-6 py-3 text-base font-semibold text-ivory transition hover:border-ivory/40 hover:bg-ivory/10 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-night"
            >
              Annuler et retourner à l'accueil
            </Link>
          </div>
        )}

        {showSuccess && (
          <div
            className="rounded-2xl border border-feedback-success/40 bg-feedback-success/10 p-4"
            role="status"
            aria-live="polite"
          >
            <p className="mb-4 font-semibold text-feedback-success-foreground">
              Merci, votre demande a bien été envoyée.
            </p>
            <p className="mb-4 text-sm text-feedback-success-foreground">
              Je vous recontacte prochainement pour convenir d'un échange.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-gold/60 bg-transparent px-6 py-2 text-sm font-semibold text-gold transition hover:bg-gold/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold focus:ring-offset-night"
            >
              Retour à l'accueil
            </Link>
          </div>
        )}

        {csrfError && !showSuccess && (
          <div
            className="rounded-2xl border border-feedback-error/40 bg-feedback-error/10 p-4 text-feedback-error-foreground"
            role="alert"
          >
            Erreur de sécurité : {csrfError}. Veuillez rafraîchir la page.
          </div>
        )}

        {generalError && !showSuccess && (
          <div
            className="rounded-2xl border border-feedback-error/40 bg-feedback-error/10 p-4 text-feedback-error-foreground"
            role="alert"
          >
            {generalError}
          </div>
        )}

        {!showSuccess && (
          <p className="text-sm text-ivory/60">
            Une confirmation vous sera envoyée par e-mail. Consultez également notre {""}
            <Link
              href="/politique-de-confidentialite"
              target="_blank"
              rel="noreferrer noopener"
              className="text-ivory underline underline-offset-4"
            >
              Politique de confidentialité
            </Link>
            .
          </p>
        )}
      </form>
    </section>
  );
}
