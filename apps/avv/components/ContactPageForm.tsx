'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

import { useCSRF } from '../hooks/useCSRF';

/**
 * Valeurs du formulaire de contact de la page /contact
 */
type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
  honeypot: string;
};

const initialValues: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  consent: false,
  honeypot: '',
};

type SubmissionStatus = 'idle' | 'pending' | 'success' | 'error';

type FieldErrors = Partial<Record<keyof FormValues, string>>;

/**
 * Validation côté client des champs du formulaire
 */
function validateValues(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (values.firstName.trim().length < 2) {
    errors.firstName = "Merci d'indiquer votre prénom.";
  }

  if (values.lastName.trim().length < 2) {
    errors.lastName = "Merci d'indiquer votre nom.";
  }

  if (!values.email.trim()) {
    errors.email = "Merci d'indiquer une adresse e-mail.";
  } else {
    const emailPattern = /\S+@\S+\.\S+/u;
    if (!emailPattern.test(values.email.trim())) {
      errors.email = "Merci d'indiquer une adresse e-mail valide.";
    }
  }

  if (!values.subject) {
    errors.subject = 'Merci de choisir un sujet.';
  }

  if (values.message.trim().length < 10) {
    errors.message = "Merci de partager un message d'au moins 10 caractères.";
  }

  if (!values.consent) {
    errors.consent = "Merci d'accepter la politique de confidentialité.";
  }

  return errors;
}

/**
 * Formulaire de contact complet pour la page /contact
 *
 * Gère la soumission via fetch() avec protection CSRF,
 * validation côté client, et honeypot anti-spam.
 */
export function ContactPageForm() {
  const [values, setValues] = useState<FormValues>({ ...initialValues });
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { csrfToken, isLoading: csrfLoading, error: csrfError, refreshToken } = useCSRF();

  const fieldIds = useMemo(
    () => ({
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      phone: 'phone',
      subject: 'subject',
      message: 'message',
      consent: 'consent',
      honeypot: 'contact-company',
    }),
    []
  );

  const handleChange = useCallback(
    (field: keyof FormValues) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        const value =
          target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;

        setValues(prev => ({ ...prev, [field]: value }));

        if (status !== 'pending') {
          setStatus('idle');
        }
        setErrorMessage(null);
      },
    [status]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (status === 'pending') return;

      if (!csrfToken) {
        setErrorMessage('Erreur de sécurité. Veuillez rafraîchir la page et réessayer.');
        setStatus('error');
        return;
      }

      const errors = validateValues(values);
      if (Object.keys(errors).length > 0) {
        const firstKey = Object.keys(errors)[0] as keyof FormValues;
        setErrorMessage(errors[firstKey] ?? 'Merci de vérifier les informations fournies.');
        setStatus('error');
        const el = document.getElementById(fieldIds[firstKey]);
        if (el && 'focus' in el) {
          (el as HTMLElement).focus();
        }
        return;
      }

      // Honeypot : si rempli, simuler un succès silencieux
      if (values.honeypot.trim() !== '') {
        setValues({ ...initialValues });
        setStatus('success');
        return;
      }

      setStatus('pending');
      setErrorMessage(null);

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            name: `${values.firstName.trim()} ${values.lastName.trim()}`,
            email: values.email.trim(),
            phone: values.phone.trim() || undefined,
            subject: values.subject || undefined,
            message: values.message.trim(),
            csrf_token: csrfToken,
            meta: {
              honeypot: values.honeypot.trim(),
              submitted_at: new Date().toISOString(),
              source_page: window.location.href,
            },
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message =
            body?.message ?? 'Une erreur est survenue. Veuillez réessayer dans quelques instants.';
          throw new Error(message);
        }

        setValues({ ...initialValues });
        setStatus('success');
        await refreshToken();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue. Veuillez réessayer dans quelques instants.';
        setErrorMessage(message);
        setStatus('error');
      }
    },
    [fieldIds, status, values, csrfToken, refreshToken]
  );

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit}
      aria-labelledby="contact-form-title"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={fieldIds.firstName} className="text-ivory/70 mb-1 block text-sm">
            Prénom <span aria-hidden="true">*</span>
            <span className="sr-only">(obligatoire)</span>
          </label>
          <input
            type="text"
            id={fieldIds.firstName}
            name="firstName"
            required
            aria-required="true"
            aria-describedby="firstName-hint"
            autoComplete="given-name"
            value={values.firstName}
            onChange={handleChange('firstName')}
            className="border-ivory/20 bg-night/50 focus-ring-inset w-full rounded-lg border px-4 py-2.5 text-sm transition-colors"
          />
          <span id="firstName-hint" className="sr-only">
            Entrez votre prénom tel qu&apos;il apparaît sur vos documents officiels
          </span>
        </div>
        <div>
          <label htmlFor={fieldIds.lastName} className="text-ivory/70 mb-1 block text-sm">
            Nom <span aria-hidden="true">*</span>
            <span className="sr-only">(obligatoire)</span>
          </label>
          <input
            type="text"
            id={fieldIds.lastName}
            name="lastName"
            required
            aria-required="true"
            aria-describedby="lastName-hint"
            autoComplete="family-name"
            value={values.lastName}
            onChange={handleChange('lastName')}
            className="border-ivory/20 bg-night/50 focus-ring-inset w-full rounded-lg border px-4 py-2.5 text-sm transition-colors"
          />
          <span id="lastName-hint" className="sr-only">
            Entrez votre nom de famille
          </span>
        </div>
      </div>

      <div>
        <label htmlFor={fieldIds.email} className="text-ivory/70 mb-1 block text-sm">
          Email <span aria-hidden="true">*</span>
          <span className="sr-only">(obligatoire)</span>
        </label>
        <input
          type="email"
          id={fieldIds.email}
          name="email"
          required
          aria-required="true"
          aria-describedby="email-hint"
          autoComplete="email"
          placeholder="exemple@domaine.fr"
          value={values.email}
          onChange={handleChange('email')}
          className="border-ivory/20 bg-night/50 placeholder:text-ivory/40 focus-ring-inset w-full rounded-lg border px-4 py-2.5 text-sm transition-colors"
        />
        <span id="email-hint" className="text-ivory/50 mt-1 block text-xs">
          Format attendu : exemple@domaine.fr
        </span>
      </div>

      <div>
        <label htmlFor={fieldIds.phone} className="text-ivory/70 mb-1 block text-sm">
          Téléphone <span className="text-ivory/50">(optionnel)</span>
        </label>
        <input
          type="tel"
          id={fieldIds.phone}
          name="phone"
          aria-describedby="phone-hint"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          value={values.phone}
          onChange={handleChange('phone')}
          className="border-ivory/20 bg-night/50 placeholder:text-ivory/40 focus-ring-inset w-full rounded-lg border px-4 py-2.5 text-sm transition-colors"
        />
        <span id="phone-hint" className="text-ivory/50 mt-1 block text-xs">
          Format français : 06 12 34 56 78 ou +33 6 12 34 56 78
        </span>
      </div>

      <div>
        <label htmlFor={fieldIds.subject} className="text-ivory/70 mb-1 block text-sm">
          Sujet <span aria-hidden="true">*</span>
          <span className="sr-only">(obligatoire)</span>
        </label>
        <select
          id={fieldIds.subject}
          name="subject"
          required
          aria-required="true"
          aria-describedby="subject-hint"
          value={values.subject}
          onChange={handleChange('subject')}
          className="border-ivory/20 bg-night/50 focus-ring-inset w-full rounded-lg border px-4 py-2.5 text-sm transition-colors"
        >
          <option value="">Choisir un sujet</option>
          <option value="rdv-psychotherapie">Rendez-vous sophrologie</option>
          <option value="rdv-somatothérapie">Rendez-vous somatothérapie</option>
          <option value="info-respiration">Information breathwork & rebirth</option>
          <option value="info-seminaire">Inscription séminaire</option>
          <option value="autre">Autre demande</option>
        </select>
        <span id="subject-hint" className="sr-only">
          Sélectionnez le sujet qui correspond le mieux à votre demande
        </span>
      </div>

      <div>
        <label htmlFor={fieldIds.message} className="text-ivory/70 mb-1 block text-sm">
          Message <span aria-hidden="true">*</span>
          <span className="sr-only">(obligatoire)</span>
        </label>
        <textarea
          id={fieldIds.message}
          name="message"
          rows={5}
          required
          aria-required="true"
          aria-describedby="message-hint"
          value={values.message}
          onChange={handleChange('message')}
          className="border-ivory/20 bg-night/50 placeholder:text-ivory/40 focus-ring-inset w-full resize-none rounded-lg border px-4 py-2.5 text-sm transition-colors"
          placeholder="Décrivez brièvement votre demande..."
        />
        <span id="message-hint" className="text-ivory/50 mt-1 block text-xs">
          Décrivez votre situation ou votre demande en quelques phrases
        </span>
      </div>

      {/* Honeypot anti-spam */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={fieldIds.honeypot}>Votre société</label>
        <input
          id={fieldIds.honeypot}
          name="company"
          type="text"
          value={values.honeypot}
          onChange={handleChange('honeypot')}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <fieldset className="m-0 border-none p-0">
        <legend className="sr-only">Consentement RGPD</legend>
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id={fieldIds.consent}
            name="consent"
            required
            aria-required="true"
            aria-describedby="consent-description"
            checked={values.consent}
            onChange={handleChange('consent')}
            className="border-ivory/20 bg-night/50 text-gold focus-ring mt-1 rounded"
          />
          <label
            htmlFor={fieldIds.consent}
            className="text-ivory/50 text-xs"
            id="consent-description"
          >
            J&apos;accepte que mes données soient utilisées pour répondre à ma demande. Voir la{' '}
            <Link
              href="/politique-de-confidentialite"
              className="text-gold focus-ring rounded hover:underline"
            >
              politique de confidentialité
            </Link>
            . <span aria-hidden="true">*</span>
            <span className="sr-only">(obligatoire)</span>
          </label>
        </div>
      </fieldset>

      {/* Messages de feedback */}
      {csrfError && (
        <div
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
          role="alert"
        >
          Erreur de sécurité : {csrfError}. Veuillez rafraîchir la page.
        </div>
      )}

      {status === 'success' && (
        <div
          className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300"
          role="status"
          aria-live="polite"
        >
          Merci, votre message a bien été transmis. Je vous réponds au plus vite.
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'pending' || csrfLoading || !csrfToken || !!csrfError}
        className="bg-gold hover:bg-gold/90 text-night focus-ring-offset w-full rounded-lg py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'pending' ? 'Envoi en cours…' : 'Envoyer le message'}
      </button>

      <p className="text-ivory/50 mt-2 text-xs">
        <span aria-hidden="true">*</span> Champs obligatoires
      </p>
    </form>
  );
}
