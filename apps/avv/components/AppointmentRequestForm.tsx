/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { z } from 'zod';

import { trackConversionEvent } from '../hooks/useAnalytics';
import { useCSRF } from '../hooks/useCSRF';

const contactPreferenceValues = ['', 'telephone', 'email', 'indifferent'] as const;

const sessionTypeValues = ['', 'presentiel', 'visio', 'telephone', 'indecis'] as const;

const referralValues = [
  '',
  'bouche_a_oreille',
  'internet',
  'reseaux_sociaux',
  'recommandation',
  'conference_atelier',
  'autre',
] as const;

const appointmentRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        2,
        'Veuillez indiquer votre prénom et nom (minimum 2 caractères). Exemple : Jean Dupont'
      ),
    email: z
      .string()
      .email('Veuillez entrer une adresse e-mail valide. Exemple : jean.dupont@exemple.fr'),
    phone: z
      .string()
      .optional()
      .transform(value => (value?.trim() ?? '').replace(/[\s.\-()]/g, ''))
      .refine(
        value => value.length === 0 || /^(\+33|0)[1-9](\d{2}){4}$|^\+?\d{10,15}$/.test(value),
        {
          message:
            'Format de téléphone invalide. Utilisez le format : 06 12 34 56 78 ou +33 6 12 34 56 78',
        }
      ),
    contact_preference: z.enum(contactPreferenceValues),
    reason: z
      .string()
      .trim()
      .min(
        10,
        'Veuillez décrire brièvement le motif de votre demande (minimum 10 caractères). Quelques mots sur votre situation suffisent.'
      ),
    session_type: z.enum(sessionTypeValues),
    availability: z
      .string()
      .optional()
      .transform(value => value?.trim() ?? ''),
    referral: z.enum(referralValues),
    solidarity_request: z.boolean(),
    solidarity_details: z
      .string()
      .optional()
      .transform(value => value?.trim() ?? ''),
    consent: z.boolean().refine(value => value === true, {
      message: 'Vous devez accepter la politique de confidentialité pour envoyer votre demande.',
    }),
  })
  .superRefine((data, ctx) => {
    if (
      data.solidarity_request &&
      (!data.solidarity_details || data.solidarity_details.length < 10)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['solidarity_details'],
        message:
          'Veuillez préciser brièvement votre situation pour le tarif solidaire (minimum 10 caractères). Cette information reste confidentielle.',
      });
    }
  })
  .transform(data => ({
    ...data,
    name: data.name.trim(),
    reason: data.reason.trim(),
    availability: data.availability?.trim?.() ?? data.availability,
  }));

type AppointmentRequestData = z.infer<typeof appointmentRequestSchema>;

type FormValues = AppointmentRequestData & {
  honeypot: string;
};

type FormField = keyof FormValues;

type FormErrors = Partial<Record<FormField, string>>;

const initialValues: FormValues = {
  name: '',
  email: '',
  phone: '',
  contact_preference: '',
  reason: '',
  session_type: '',
  availability: '',
  referral: '',
  solidarity_request: false,
  solidarity_details: '',
  consent: false,
  honeypot: '',
};

const STORAGE_KEY = 'avv-appointment-request-form';

const logStorageError = (message: string, error: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(message, error);
  }
};

const validateForm = (values: FormValues) => {
  const { honeypot, ...formValues } = values;
  const parsed = appointmentRequestSchema.safeParse(formValues);

  if (parsed.success) {
    return {
      data: { ...parsed.data, honeypot: honeypot.trim() },
      errors: {} as FormErrors,
    };
  }

  const errors: FormErrors = {};

  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
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
    if (typeof window === 'undefined') {
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
      logStorageError('Unable to restore appointment form values', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formValues));
    } catch (error) {
      logStorageError('Unable to persist appointment form values', error);
    }
  }, [formValues, isHydrated]);

  const fieldIds = useMemo(
    () => ({
      name: 'name',
      email: 'email',
      phone: 'phone',
      contact_preference: 'contact-preference',
      reason: 'reason',
      session_type: 'session-type',
      availability: 'availability',
      referral: 'referral',
      solidarity_request: 'solidarity-request',
      solidarity_details: 'solidarity-details',
      consent: 'consent',
      honeypot: 'company',
    }),
    []
  );

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
          target instanceof HTMLInputElement && target.type === 'checkbox'
            ? target.checked
            : target.value;

        setFormValues(previous => {
          const next = { ...previous, [field]: value } as FormValues;
          const validation = validateForm(next);
          setErrors(validation.errors);
          return next;
        });

        setGeneralError(null);
        setTouched(previous =>
          previous[field]
            ? previous
            : {
                ...previous,
                [field]: true,
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
        setGeneralError('Erreur de sécurité. Veuillez rafraîchir la page et réessayer.');
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
          honeypot: true,
        });

        const firstField = Object.keys(validation.errors)[0] as FormField | undefined;
        if (firstField) {
          const element = document.getElementById(fieldIds[firstField]);
          if (element && 'focus' in element) {
            (element as HTMLElement).focus();
          }
        }
        return;
      }

      if (!canSubmit) {
        setGeneralError("Merci de patienter quelques secondes avant d'envoyer votre demande.");
        return;
      }

      if (validation.data.honeypot !== '') {
        setShowSuccess(true);
        return;
      }

      setIsSubmitting(true);

      try {
        const { honeypot, ...payload } = validation.data;

        const response = await fetch('/api/appointment-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            ...payload,
            csrf_token: csrfToken,
            meta: {
              honeypot,
              submitted_at: new Date().toISOString(),
              source_page: window.location.href,
            },
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          const message =
            errorBody?.message ??
            'Une erreur est survenue. Veuillez réessayer dans quelques instants.';
          throw new Error(message);
        }

        // Track successful conversion
        await trackConversionEvent('appointment_request', 'form_submission_success', true);

        setShowSuccess(true);
        setGeneralError(null);
        setFormValues({ ...initialValues });
        setErrors({});
        setTouched({});
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(STORAGE_KEY);
        }

        // Rafraîchir le token CSRF après une soumission réussie
        await refreshToken();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue. Veuillez réessayer dans quelques instants.';
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
    <section
      className="border-ivory/10 bg-night/60 shadow-night/40 mx-auto max-w-3xl space-y-8 rounded-3xl border p-8 shadow-xl"
      aria-labelledby="appointment-form-title"
    >
      <header className="space-y-4 text-center">
        <h1 id="appointment-form-title" className="text-ivory text-3xl font-semibold">
          Demande de premier rendez-vous
        </h1>
        <p className="text-ivory/80 text-base">
          Ce formulaire vous permet de demander un premier rendez-vous pour un accompagnement en
          sophrologie ou en somatothérapie. Les informations transmises sont strictement
          confidentielles. Vous serez recontacté(e) dans les meilleurs délais pour convenir
          d&apos;un échange.
        </p>
      </header>

      {/* Zone d'annonce des erreurs pour les lecteurs d'écran */}
      <div
        id="appointment-errors-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className="border-ivory/10 bg-night/60 text-ivory/80 space-y-4 rounded-3xl border p-6 text-sm">
        <p className="text-ivory text-base font-semibold">Tarifs et modalités</p>
        <p>
          Le tarif d’une séance est de 70 €. Je propose un tarif solidaire de 40–50 € pour les
          personnes en difficulté financière. N’hésitez pas à m’en parler en toute confidentialité.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Durée d’une séance : 1 heure.</li>
          <li>Modes de paiement acceptés : chèque, virement ou espèces.</li>
          <li>
            En cas d’empêchement, merci de prévenir au moins 48h à l’avance afin de libérer le
            créneau ; une annulation tardive peut entraîner la facturation de la séance.
          </li>
        </ul>
      </div>

      <form className="space-y-6" noValidate onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label className="text-ivory block text-sm font-medium" htmlFor={fieldIds.name}>
              Prénom et Nom <span aria-hidden="true">*</span>
              <span className="sr-only">(obligatoire)</span>
            </label>
            <input
              id={fieldIds.name}
              name="name"
              type="text"
              placeholder="Votre nom complet"
              value={formValues.name}
              onChange={handleFieldChange('name')}
              onBlur={handleFieldChange('name')}
              required
              aria-required="true"
              aria-invalid={isFieldInvalid('name')}
              aria-describedby={
                isFieldInvalid('name') ? `${fieldIds.name}-error` : `${fieldIds.name}-hint`
              }
              autoComplete="name"
              className="border-ivory/20 bg-night/70 text-ivory placeholder:text-ivory/40 focus-ring-inset mt-2 w-full rounded-xl border px-4 py-3 text-base"
            />
            <span id={`${fieldIds.name}-hint`} className="sr-only">
              Entrez votre prénom suivi de votre nom de famille
            </span>
            {renderError('name')}
          </div>

          <div>
            <label className="text-ivory block text-sm font-medium" htmlFor={fieldIds.email}>
              Adresse e-mail <span aria-hidden="true">*</span>
              <span className="sr-only">(obligatoire)</span>
            </label>
            <input
              id={fieldIds.email}
              name="email"
              type="email"
              placeholder="exemple@domaine.fr"
              value={formValues.email}
              onChange={handleFieldChange('email')}
              onBlur={handleFieldChange('email')}
              required
              aria-required="true"
              aria-invalid={isFieldInvalid('email')}
              aria-describedby={
                isFieldInvalid('email') ? `${fieldIds.email}-error` : `${fieldIds.email}-hint`
              }
              className="border-ivory/20 bg-night/70 text-ivory placeholder:text-ivory/40 focus-ring-inset mt-2 w-full rounded-xl border px-4 py-3 text-base"
              autoComplete="email"
            />
            <span id={`${fieldIds.email}-hint`} className="text-ivory/50 mt-1 block text-xs">
              Format attendu : exemple@domaine.fr
            </span>
            {renderError('email')}
          </div>

          <div>
            <label className="text-ivory block text-sm font-medium" htmlFor={fieldIds.phone}>
              Numéro de téléphone <span className="text-ivory/50">(optionnel)</span>
            </label>
            <input
              id={fieldIds.phone}
              name="phone"
              type="tel"
              placeholder="06 12 34 56 78"
              value={formValues.phone}
              onChange={handleFieldChange('phone')}
              onBlur={handleFieldChange('phone')}
              aria-invalid={isFieldInvalid('phone')}
              aria-describedby={
                isFieldInvalid('phone') ? `${fieldIds.phone}-error` : `${fieldIds.phone}-hint`
              }
              className="border-ivory/20 bg-night/70 text-ivory placeholder:text-ivory/40 focus-ring-inset mt-2 w-full rounded-xl border px-4 py-3 text-base"
              autoComplete="tel"
            />
            <span id={`${fieldIds.phone}-hint`} className="text-ivory/50 mt-1 block text-xs">
              Format : 06 12 34 56 78 ou +33 6 12 34 56 78
            </span>
            {renderError('phone')}
          </div>

          <div>
            <label
              className="text-ivory block text-sm font-medium"
              htmlFor={fieldIds.contact_preference}
            >
              Préférence de contact <span className="text-ivory/50">(optionnel)</span>
            </label>
            <select
              id={fieldIds.contact_preference}
              name="contact_preference"
              value={formValues.contact_preference}
              onChange={handleFieldChange('contact_preference')}
              onBlur={handleFieldChange('contact_preference')}
              aria-invalid={isFieldInvalid('contact_preference')}
              aria-describedby={
                isFieldInvalid('contact_preference')
                  ? `${fieldIds.contact_preference}-error`
                  : undefined
              }
              className="border-ivory/20 bg-night/70 text-ivory focus-ring-inset mt-2 w-full rounded-xl border px-4 py-3 text-base"
            >
              <option value="">-- Sélectionnez une option --</option>
              <option value="telephone">Téléphone</option>
              <option value="email">E-mail</option>
              <option value="indifferent">Peu importe</option>
            </select>
            {renderError('contact_preference')}
          </div>

          <div>
            <label className="text-ivory block text-sm font-medium" htmlFor={fieldIds.reason}>
              Motif de votre demande <span aria-hidden="true">*</span>
              <span className="sr-only">(obligatoire)</span>
            </label>
            <textarea
              id={fieldIds.reason}
              name="reason"
              placeholder="Ex. : anxiété, deuil, perte de sens, accompagnement du changement..."
              value={formValues.reason}
              onChange={handleFieldChange('reason')}
              onBlur={handleFieldChange('reason')}
              required
              aria-required="true"
              aria-invalid={isFieldInvalid('reason')}
              aria-describedby={
                isFieldInvalid('reason') ? `${fieldIds.reason}-error` : `${fieldIds.reason}-hint`
              }
              className="border-ivory/20 bg-night/70 text-ivory placeholder:text-ivory/40 focus-ring-inset mt-2 w-full rounded-xl border px-4 py-3 text-base"
              rows={4}
            />
            <span id={`${fieldIds.reason}-hint`} className="text-ivory/50 mt-1 block text-xs">
              Quelques mots sur ce qui vous amène suffisent (minimum 10 caractères)
            </span>
            {renderError('reason')}
          </div>

          <div>
            <label className="text-ivory block text-sm font-medium" htmlFor={fieldIds.session_type}>
              Souhaitez-vous une première séance en présentiel ou en visioconférence ?{' '}
              <span className="text-ivory/50">(optionnel)</span>
            </label>
            <select
              id={fieldIds.session_type}
              name="session_type"
              value={formValues.session_type}
              onChange={handleFieldChange('session_type')}
              onBlur={handleFieldChange('session_type')}
              aria-invalid={isFieldInvalid('session_type')}
              aria-describedby={
                isFieldInvalid('session_type') ? `${fieldIds.session_type}-error` : undefined
              }
              className="border-ivory/20 bg-night/70 text-ivory focus-ring-inset mt-2 w-full rounded-xl border px-4 py-3 text-base"
            >
              <option value="">-- Sélectionnez une option --</option>
              <option value="presentiel">Présentiel à Saint-Julien-du-Sault</option>
              <option value="visio">Visioconférence</option>
              <option value="telephone">Téléphone</option>
              <option value="indecis">Je ne sais pas encore</option>
            </select>
            {renderError('session_type')}
          </div>

          <div>
            <label className="text-ivory block text-sm font-medium" htmlFor={fieldIds.availability}>
              Disponibilités souhaitées <span className="text-ivory/50">(optionnel)</span>
            </label>
            <textarea
              id={fieldIds.availability}
              name="availability"
              placeholder="Ex. : semaine, week-end, matin, après-midi…"
              value={formValues.availability}
              onChange={handleFieldChange('availability')}
              onBlur={handleFieldChange('availability')}
              aria-invalid={isFieldInvalid('availability')}
              aria-describedby={
                isFieldInvalid('availability') ? `${fieldIds.availability}-error` : undefined
              }
              className="border-ivory/20 bg-night/70 text-ivory placeholder:text-ivory/40 focus-ring-inset mt-2 w-full rounded-xl border px-4 py-3 text-base"
              rows={3}
            />
            {renderError('availability')}
          </div>

          <fieldset className="border-ivory/15 bg-night/70 space-y-3 rounded-2xl border p-4">
            <legend className="sr-only">Option tarif solidaire</legend>
            <div className="flex items-start gap-3">
              <input
                id={fieldIds.solidarity_request}
                name="solidarity_request"
                type="checkbox"
                checked={formValues.solidarity_request}
                onChange={handleFieldChange('solidarity_request')}
                onBlur={handleFieldChange('solidarity_request')}
                aria-describedby="solidarity-description"
                className="border-ivory/40 bg-night/60 text-gold focus-ring mt-1 h-5 w-5 rounded border"
              />
              <div className="text-ivory/80 space-y-1 text-sm">
                <label
                  htmlFor={fieldIds.solidarity_request}
                  className="text-ivory cursor-pointer font-medium"
                >
                  Je souhaite discuter d&apos;un tarif solidaire
                </label>
                <p id="solidarity-description">
                  Les demandes sont étudiées au cas par cas, en toute confidentialité, pour que
                  l&apos;accompagnement reste accessible.
                </p>
              </div>
            </div>
            {formValues.solidarity_request && (
              <div>
                <label
                  className="text-ivory block text-sm font-medium"
                  htmlFor={fieldIds.solidarity_details}
                >
                  Précisez brièvement votre situation <span aria-hidden="true">*</span>
                  <span className="sr-only">(obligatoire si tarif solidaire demandé)</span>
                </label>
                <textarea
                  id={fieldIds.solidarity_details}
                  name="solidarity_details"
                  placeholder="Ex. : situation étudiante, période de transition professionnelle, difficultés ponctuelles..."
                  value={formValues.solidarity_details}
                  onChange={handleFieldChange('solidarity_details')}
                  onBlur={handleFieldChange('solidarity_details')}
                  aria-required={formValues.solidarity_request}
                  aria-invalid={isFieldInvalid('solidarity_details')}
                  aria-describedby={
                    isFieldInvalid('solidarity_details')
                      ? `${fieldIds.solidarity_details}-error`
                      : `${fieldIds.solidarity_details}-hint`
                  }
                  className="border-ivory/20 bg-night/70 text-ivory placeholder:text-ivory/40 focus-ring-inset mt-2 w-full rounded-xl border px-4 py-3 text-base"
                  rows={3}
                />
                <span
                  id={`${fieldIds.solidarity_details}-hint`}
                  className="text-ivory/50 mt-1 block text-xs"
                >
                  Cette information reste strictement confidentielle (minimum 10 caractères)
                </span>
                {renderError('solidarity_details')}
              </div>
            )}
          </fieldset>

          <div>
            <label className="text-ivory block text-sm font-medium" htmlFor={fieldIds.referral}>
              Comment avez-vous entendu parler de moi ?{' '}
              <span className="text-ivory/50">(optionnel)</span>
            </label>
            <select
              id={fieldIds.referral}
              name="referral"
              value={formValues.referral}
              onChange={handleFieldChange('referral')}
              onBlur={handleFieldChange('referral')}
              aria-invalid={isFieldInvalid('referral')}
              aria-describedby={
                isFieldInvalid('referral') ? `${fieldIds.referral}-error` : undefined
              }
              className="border-ivory/20 bg-night/70 text-ivory focus-ring-inset mt-2 w-full rounded-xl border px-4 py-3 text-base"
            >
              <option value="">-- Sélectionnez une option --</option>
              <option value="bouche_a_oreille">Bouche à oreille</option>
              <option value="internet">Recherche Internet</option>
              <option value="reseaux_sociaux">Réseaux sociaux</option>
              <option value="recommandation">Recommandation d&apos;un professionnel</option>
              <option value="conference_atelier">Conférence ou atelier</option>
              <option value="autre">Autre</option>
            </select>
            {renderError('referral')}
          </div>

          <fieldset className="m-0 border-none p-0">
            <legend className="sr-only">Consentement RGPD (obligatoire)</legend>
            <div className="flex items-start gap-3">
              <input
                id={fieldIds.consent}
                name="consent"
                type="checkbox"
                checked={formValues.consent}
                onChange={handleFieldChange('consent')}
                onBlur={handleFieldChange('consent')}
                required
                aria-required="true"
                aria-invalid={isFieldInvalid('consent')}
                aria-describedby={
                  isFieldInvalid('consent') ? `${fieldIds.consent}-error` : 'consent-description'
                }
                className="border-ivory/40 bg-night/60 text-gold focus-ring mt-1 h-5 w-5 rounded border"
              />
              <label
                htmlFor={fieldIds.consent}
                className="text-ivory/80 cursor-pointer text-sm"
                id="consent-description"
              >
                <span className="text-ivory font-medium">
                  Consentement RGPD <span aria-hidden="true">*</span>
                  <span className="sr-only">(obligatoire)</span>
                </span>
                <br />
                J&apos;accepte que mes données soient utilisées uniquement dans le cadre de ma
                demande de rendez-vous, conformément à la{' '}
                <Link
                  href="/politique-de-confidentialite"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-ivory focus-ring rounded underline underline-offset-4"
                >
                  politique de confidentialité
                </Link>
                .
              </label>
            </div>
            {renderError('consent')}
          </fieldset>
        </div>

        <div className="sr-only" aria-hidden="true">
          <label htmlFor={fieldIds.honeypot}>Votre société</label>
          <input
            id={fieldIds.honeypot}
            name="company"
            type="text"
            value={formValues.honeypot}
            onChange={handleFieldChange('honeypot')}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {!showSuccess && (
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="bg-gold text-night hover:bg-gold/90 focus-ring-offset disabled:bg-gold/60 inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold transition disabled:cursor-not-allowed"
              disabled={isSubmitting || !canSubmit || csrfLoading || !csrfToken || !!csrfError}
            >
              {isSubmitting
                ? 'Envoi en cours...'
                : csrfLoading
                  ? 'Chargement...'
                  : 'Envoyer ma demande'}
            </button>
            <Link
              href="/"
              className="border-ivory/20 text-ivory hover:border-ivory/40 hover:bg-ivory/10 focus-ring-offset inline-flex items-center justify-center rounded-xl border px-6 py-3 text-base font-semibold transition"
            >
              Annuler et retourner à l&apos;accueil
            </Link>
          </div>
        )}

        {showSuccess && (
          <div
            className="border-feedback-success/40 bg-feedback-success/10 rounded-2xl border p-4"
            role="status"
            aria-live="polite"
          >
            <h2 className="text-feedback-success-foreground mb-4 font-semibold">
              Merci, votre demande a bien été envoyée.
            </h2>
            <p className="text-feedback-success-foreground mb-4 text-sm">
              Je vous recontacte prochainement pour convenir d&apos;un échange.
            </p>
            <Link
              href="/"
              className="border-gold/60 text-gold hover:bg-gold/10 focus-ring-offset inline-flex items-center justify-center rounded-full border bg-transparent px-6 py-2 text-sm font-semibold transition"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        )}

        {csrfError && !showSuccess && (
          <div
            className="border-feedback-error/40 bg-feedback-error/10 text-feedback-error-foreground rounded-2xl border p-4"
            role="alert"
          >
            Erreur de sécurité : {csrfError}. Veuillez rafraîchir la page.
          </div>
        )}

        {generalError && !showSuccess && (
          <div
            className="border-feedback-error/40 bg-feedback-error/10 text-feedback-error-foreground rounded-2xl border p-4"
            role="alert"
          >
            {generalError}
          </div>
        )}

        {!showSuccess && (
          <p className="text-ivory/60 text-sm">
            <span aria-hidden="true">*</span> Champs obligatoires. Une confirmation vous sera
            envoyée par e-mail. Consultez également notre{' '}
            <Link
              href="/politique-de-confidentialite"
              target="_blank"
              rel="noreferrer noopener"
              className="text-ivory focus-ring rounded underline underline-offset-4"
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
