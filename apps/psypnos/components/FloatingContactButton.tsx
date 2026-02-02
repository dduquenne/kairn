'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { trackConversionEvent } from '../hooks/useAnalytics';
import { useCSRF } from '../hooks/useCSRF';
import { useToast } from '../lib/toast-context';

// Types
type RequestType = '' | 'premiere_consultation' | 'question_generale' | 'seminaire';

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  requestType: RequestType;
  message: string;
  consent: boolean;
  honeypot: string;
}

type SubmissionStatus = 'idle' | 'pending' | 'success' | 'error';

const initialValues: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  requestType: '',
  message: '',
  consent: false,
  honeypot: '',
};

const requestTypeOptions = [
  { value: '', label: 'Choisir le type de demande' },
  { value: 'premiere_consultation', label: 'Première consultation' },
  { value: 'question_generale', label: 'Question générale' },
  { value: 'seminaire', label: 'Séminaire de respiration holotropique' },
];

// Validation
const validateForm = (values: FormValues) => {
  const errors: Partial<Record<keyof FormValues, string>> = {};

  if (values.firstName.trim().length < 2) {
    errors.firstName = 'Le prénom doit contenir au moins 2 caractères.';
  }

  if (values.lastName.trim().length < 2) {
    errors.lastName = 'Le nom doit contenir au moins 2 caractères.';
  }

  const emailPattern = /\S+@\S+\.\S+/u;
  if (!values.email.trim() || !emailPattern.test(values.email.trim())) {
    errors.email = 'Veuillez entrer une adresse e-mail valide.';
  }

  if (values.phone.trim()) {
    const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$|^\+?\d{10,15}$/;
    if (!phoneRegex.test(values.phone.replace(/\s/g, ''))) {
      errors.phone = 'Format de téléphone invalide.';
    }
  }

  if (!values.requestType) {
    errors.requestType = 'Veuillez sélectionner le type de demande.';
  }

  if (values.message.trim().length < 10) {
    errors.message = 'Le message doit contenir au moins 10 caractères.';
  }

  if (!values.consent) {
    errors.consent = 'Vous devez accepter la politique de confidentialité.';
  }

  return errors;
};

// Custom hook for scroll direction detection
function useScrollDirection() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Show on scroll up (negative delta) or near top
      if (scrollDelta < -5 || currentScrollY < 100) {
        setIsVisible(true);
      }
      // Hide on scroll down (positive delta) with threshold
      else if (scrollDelta > 5) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  return { isVisible, isMobile };
}

// Floating Action Button Component
export function FloatingContactButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const { isVisible } = useScrollDirection();
  const pathname = usePathname();

  // Hide on admin pages
  const isAdminPage = pathname?.startsWith('/admin');
  if (isAdminPage) {
    return null;
  }

  // Pulse animation every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
    // Track FAB click
    trackConversionEvent('fab_click', 'contact_modal_opened', false);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            className="fixed bottom-6 right-6 z-40 md:bottom-8 md:right-8"
          >
            <div className="relative">
              {/* Button */}
              <button
                onClick={handleOpen}
                aria-label="Ouvrir le formulaire de contact"
                className={`bg-gold text-night shadow-gold/30 hover:shadow-gold/40 focus:ring-gold focus:ring-offset-night group relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 md:h-14 md:w-14 ${
                  isPulsing ? 'animate-pulse' : ''
                }`}
              >
                <Calendar className="h-5 w-5 transition-transform group-hover:scale-110 md:h-6 md:w-6" />

                {/* Pulse ring */}
                {isPulsing && (
                  <span className="bg-gold/50 absolute inset-0 animate-ping rounded-full" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <ContactModal isOpen={isModalOpen} onClose={handleClose} />
    </>
  );
}

// Modal Component
interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [values, setValues] = useState<FormValues>({ ...initialValues });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { csrfToken, isLoading: csrfLoading, error: csrfError, refreshToken } = useCSRF();
  const { addToast } = useToast();

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow close animation
      const timeout = setTimeout(() => {
        setValues({ ...initialValues });
        setErrors({});
        setTouched({});
        setStatus('idle');
        setErrorMessage(null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Focus trap and Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus first element when modal opens
    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleFieldChange = useCallback(
    (field: keyof FormValues) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value =
          e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;

        setValues(prev => ({ ...prev, [field]: value }));

        // Clear error on change
        if (errors[field]) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      },
    [errors]
  );

  const handleBlur = useCallback(
    (field: keyof FormValues) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));

      // Validate single field
      const fieldErrors = validateForm(values);
      if (fieldErrors[field]) {
        setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }));
      }
    },
    [values]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (status === 'pending') return;

      // Check CSRF token
      if (!csrfToken) {
        setErrorMessage('Erreur de sécurité. Veuillez rafraîchir la page.');
        setStatus('error');
        return;
      }

      // Validate all fields
      const validationErrors = validateForm(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setTouched({
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          requestType: true,
          message: true,
          consent: true,
          honeypot: true,
        });
        return;
      }

      // Honeypot check
      if (values.honeypot.trim()) {
        setValues({ ...initialValues });
        setStatus('success');
        onClose();
        addToast({
          title: 'Message envoyé !',
          description: 'Merci pour votre message. Je vous répondrai sous 48h.',
          variant: 'success',
        });
        return;
      }

      setStatus('pending');
      setErrorMessage(null);

      try {
        const response = await fetch('/api/quick-contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim(),
            phone: values.phone.trim() || undefined,
            requestType: values.requestType,
            message: values.message.trim(),
            consent: values.consent,
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
          throw new Error(body?.message ?? 'Une erreur est survenue.');
        }

        // Track successful conversion
        await trackConversionEvent('quick_contact_form', 'form_submission_success', true);

        setValues({ ...initialValues });
        setStatus('success');
        onClose();

        addToast({
          title: 'Message envoyé !',
          description: 'Merci pour votre message. Je vous répondrai sous 48h.',
          variant: 'success',
        });

        // Refresh CSRF token
        await refreshToken();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.';
        setErrorMessage(message);
        setStatus('error');
      }
    },
    [values, status, csrfToken, onClose, addToast, refreshToken]
  );

  const inputBaseClass =
    'w-full rounded-xl border px-4 py-3 text-base transition-all focus:outline-none focus:ring-2 border-ivory/20 bg-night/70 text-ivory placeholder:text-ivory/40 focus:border-gold focus:ring-gold/40';

  const inputErrorClass =
    'border-feedback-error/60 focus:border-feedback-error focus:ring-feedback-error/40';

  const labelClass = 'block text-sm font-medium text-ivory mb-2';

  const getInputClass = (field: keyof FormValues) =>
    `${inputBaseClass} ${touched[field] && errors[field] ? inputErrorClass : ''}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-night/80 fixed inset-0 z-50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            className="border-ivory/10 bg-night fixed inset-x-4 bottom-4 top-4 z-50 mx-auto flex max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[85vh] md:-translate-x-1/2 md:-translate-y-1/2"
          >
            {/* Header */}
            <div className="border-ivory/10 flex items-center justify-between border-b px-6 py-4">
              <h2
                id="contact-modal-title"
                className="font-display text-ivory text-xl font-semibold"
              >
                Prendre rendez-vous ou poser une question
              </h2>
              <button
                ref={firstFocusableRef}
                onClick={onClose}
                aria-label="Fermer le formulaire"
                className="text-ivory/60 hover:bg-ivory/10 hover:text-ivory focus:ring-gold rounded-full p-2 transition-colors focus:outline-none focus:ring-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4" noValidate>
              <div className="space-y-4">
                {/* Name fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fab-firstName" className={labelClass}>
                      Prénom <span className="text-feedback-error">*</span>
                    </label>
                    <input
                      id="fab-firstName"
                      type="text"
                      value={values.firstName}
                      onChange={handleFieldChange('firstName')}
                      onBlur={handleBlur('firstName')}
                      className={getInputClass('firstName')}
                      autoComplete="given-name"
                      aria-invalid={touched.firstName && !!errors.firstName}
                      aria-describedby={errors.firstName ? 'fab-firstName-error' : undefined}
                    />
                    {touched.firstName && errors.firstName && (
                      <p
                        id="fab-firstName-error"
                        className="text-feedback-error-foreground mt-1 text-sm"
                        role="alert"
                      >
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="fab-lastName" className={labelClass}>
                      Nom <span className="text-feedback-error">*</span>
                    </label>
                    <input
                      id="fab-lastName"
                      type="text"
                      value={values.lastName}
                      onChange={handleFieldChange('lastName')}
                      onBlur={handleBlur('lastName')}
                      className={getInputClass('lastName')}
                      autoComplete="family-name"
                      aria-invalid={touched.lastName && !!errors.lastName}
                      aria-describedby={errors.lastName ? 'fab-lastName-error' : undefined}
                    />
                    {touched.lastName && errors.lastName && (
                      <p
                        id="fab-lastName-error"
                        className="text-feedback-error-foreground mt-1 text-sm"
                        role="alert"
                      >
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="fab-email" className={labelClass}>
                    Email <span className="text-feedback-error">*</span>
                  </label>
                  <input
                    id="fab-email"
                    type="email"
                    value={values.email}
                    onChange={handleFieldChange('email')}
                    onBlur={handleBlur('email')}
                    className={getInputClass('email')}
                    autoComplete="email"
                    aria-invalid={touched.email && !!errors.email}
                    aria-describedby={errors.email ? 'fab-email-error' : undefined}
                  />
                  {touched.email && errors.email && (
                    <p
                      id="fab-email-error"
                      className="text-feedback-error-foreground mt-1 text-sm"
                      role="alert"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="fab-phone" className={labelClass}>
                    Téléphone <span className="text-ivory/50">(optionnel)</span>
                  </label>
                  <input
                    id="fab-phone"
                    type="tel"
                    value={values.phone}
                    onChange={handleFieldChange('phone')}
                    onBlur={handleBlur('phone')}
                    className={getInputClass('phone')}
                    autoComplete="tel"
                    aria-invalid={touched.phone && !!errors.phone}
                    aria-describedby={errors.phone ? 'fab-phone-error' : undefined}
                  />
                  {touched.phone && errors.phone && (
                    <p
                      id="fab-phone-error"
                      className="text-feedback-error-foreground mt-1 text-sm"
                      role="alert"
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Request Type */}
                <div>
                  <label htmlFor="fab-requestType" className={labelClass}>
                    Type de demande <span className="text-feedback-error">*</span>
                  </label>
                  <select
                    id="fab-requestType"
                    value={values.requestType}
                    onChange={handleFieldChange('requestType')}
                    onBlur={handleBlur('requestType')}
                    className={getInputClass('requestType')}
                    aria-invalid={touched.requestType && !!errors.requestType}
                    aria-describedby={errors.requestType ? 'fab-requestType-error' : undefined}
                  >
                    {requestTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {touched.requestType && errors.requestType && (
                    <p
                      id="fab-requestType-error"
                      className="text-feedback-error-foreground mt-1 text-sm"
                      role="alert"
                    >
                      {errors.requestType}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="fab-message" className={labelClass}>
                    Message <span className="text-feedback-error">*</span>
                  </label>
                  <textarea
                    id="fab-message"
                    rows={4}
                    value={values.message}
                    onChange={handleFieldChange('message')}
                    onBlur={handleBlur('message')}
                    className={getInputClass('message')}
                    aria-invalid={touched.message && !!errors.message}
                    aria-describedby={errors.message ? 'fab-message-error' : undefined}
                  />
                  {touched.message && errors.message && (
                    <p
                      id="fab-message-error"
                      className="text-feedback-error-foreground mt-1 text-sm"
                      role="alert"
                    >
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Consent */}
                <div className="flex items-start gap-3">
                  <input
                    id="fab-consent"
                    type="checkbox"
                    checked={values.consent}
                    onChange={handleFieldChange('consent')}
                    onBlur={handleBlur('consent')}
                    className="border-ivory/40 bg-night/60 text-gold focus:ring-gold mt-1 h-5 w-5 rounded border"
                    aria-invalid={touched.consent && !!errors.consent}
                    aria-describedby={errors.consent ? 'fab-consent-error' : undefined}
                  />
                  <div className="flex-1">
                    <label htmlFor="fab-consent" className="text-ivory/80 text-sm">
                      J&apos;accepte la{' '}
                      <Link
                        href="/politique-de-confidentialite"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-gold hover:text-gold-light underline underline-offset-4"
                      >
                        politique de confidentialité
                      </Link>{' '}
                      <span className="text-feedback-error">*</span>
                    </label>
                    {touched.consent && errors.consent && (
                      <p
                        id="fab-consent-error"
                        className="text-feedback-error-foreground mt-1 text-sm"
                        role="alert"
                      >
                        {errors.consent}
                      </p>
                    )}
                  </div>
                </div>

                {/* Honeypot */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="fab-company">Société</label>
                  <input
                    id="fab-company"
                    type="text"
                    value={values.honeypot}
                    onChange={handleFieldChange('honeypot')}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* CSRF Error */}
                {csrfError && (
                  <div
                    className="border-feedback-error/40 bg-feedback-error/10 text-feedback-error-foreground rounded-xl border p-3 text-sm"
                    role="alert"
                  >
                    Erreur de sécurité : {csrfError}. Veuillez rafraîchir la page.
                  </div>
                )}

                {/* Submission Error */}
                {status === 'error' && errorMessage && (
                  <div
                    className="border-feedback-error/40 bg-feedback-error/10 text-feedback-error-foreground rounded-xl border p-3 text-sm"
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="border-ivory/10 border-t px-6 py-4">
              <button
                type="submit"
                onClick={e => {
                  e.preventDefault();
                  const form = modalRef.current?.querySelector('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }}
                disabled={status === 'pending' || csrfLoading || !csrfToken || !!csrfError}
                className="from-gold via-gold/95 to-gold text-night shadow-gold/25 hover:from-gold/90 hover:via-gold hover:to-gold/90 hover:shadow-gold/35 focus:ring-gold focus:ring-offset-night w-full rounded-xl bg-gradient-to-r px-6 py-3 font-semibold shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'pending' ? 'Envoi en cours…' : 'Envoyer'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default FloatingContactButton;
