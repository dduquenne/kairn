'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';

import { cn } from '../../utils/cn';

import type {
  FloatingContactButtonProps,
  FloatingContactButtonColors,
  FloatingContactButtonLabels,
  ContactModalProps,
  FormValues,
  FormValidationErrors,
  SubmissionStatus,
} from './types';

// Default colors (can be overridden)
const DEFAULT_COLORS: FloatingContactButtonColors = {
  primary: 'bg-amber-500',
  primaryText: 'text-gray-900',
  background: 'bg-gray-900',
  text: 'text-gray-100',
  textMuted: 'text-gray-400',
  border: 'border-gray-100/20',
  focusRing: 'focus:ring-amber-500',
  error: 'text-red-400',
  inputBackground: 'bg-gray-900/70',
};

// Default labels (French)
const DEFAULT_LABELS: FloatingContactButtonLabels = {
  modalTitle: 'Prendre rendez-vous ou poser une question',
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  phoneOptional: '(optionnel)',
  requestType: 'Type de demande',
  message: 'Message',
  consentText: "J'accepte la",
  privacyPolicyLinkText: 'politique de confidentialité',
  submit: 'Envoyer',
  submitting: 'Envoi en cours…',
  required: '*',
  closeAriaLabel: 'Fermer le formulaire',
  fabAriaLabel: 'Ouvrir le formulaire de contact',
  successTitle: 'Message envoyé !',
  successDescription: 'Merci pour votre message. Je vous répondrai sous 48h.',
  securityError: 'Erreur de sécurité. Veuillez rafraîchir la page.',
  validation: {
    firstNameMin: 'Le prénom doit contenir au moins 2 caractères.',
    lastNameMin: 'Le nom doit contenir au moins 2 caractères.',
    emailInvalid: 'Veuillez entrer une adresse e-mail valide.',
    phoneInvalid: 'Format de téléphone invalide.',
    requestTypeRequired: 'Veuillez sélectionner le type de demande.',
    messageMin: 'Le message doit contenir au moins 10 caractères.',
    consentRequired: 'Vous devez accepter la politique de confidentialité.',
  },
};

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

/**
 * Floating Action Button with contact form modal
 *
 * A reusable component that displays a floating action button in the corner
 * of the screen. When clicked, it opens a modal with a contact form.
 */
export function FloatingContactButton({
  onTrackConversion,
  csrf,
  toast,
  apiEndpoint = '/api/quick-contact',
  privacyPolicyUrl = '/politique-de-confidentialite',
  requestTypeOptions,
  colors: customColors,
  labels: customLabels,
  icon,
  hiddenPaths = ['/admin'],
  enablePulse = true,
  pulseInterval = 10000,
  className,
}: FloatingContactButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const { isVisible } = useScrollDirection();
  const pathname = usePathname();

  const colors = { ...DEFAULT_COLORS, ...customColors };
  const labels = { ...DEFAULT_LABELS, ...customLabels };

  // Hide on specified paths
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path));
  if (shouldHide) {
    return null;
  }

  // Pulse animation
  useEffect(() => {
    if (!enablePulse) return;

    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    }, pulseInterval);

    return () => clearInterval(interval);
  }, [enablePulse, pulseInterval]);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
    onTrackConversion?.('fab_click', 'contact_modal_opened', false);
  }, [onTrackConversion]);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const iconElement: ReactNode = icon ?? (
    <Calendar className="h-5 w-5 transition-transform group-hover:scale-110 md:h-6 md:w-6" />
  );

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
              <button
                onClick={handleOpen}
                aria-label={labels.fabAriaLabel}
                className={cn(
                  'group relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 md:h-14 md:w-14',
                  colors.primary,
                  colors.primaryText,
                  colors.focusRing,
                  isPulsing && 'animate-pulse',
                  className
                )}
              >
                {iconElement}

                {/* Pulse ring */}
                {isPulsing && (
                  <span
                    className={cn(
                      'absolute inset-0 animate-ping rounded-full opacity-50',
                      colors.primary
                    )}
                  />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={handleClose}
        csrf={csrf}
        toast={toast}
        onTrackConversion={onTrackConversion}
        apiEndpoint={apiEndpoint}
        privacyPolicyUrl={privacyPolicyUrl}
        requestTypeOptions={requestTypeOptions}
        colors={colors}
        labels={labels}
      />
    </>
  );
}

// Validation function
function validateForm(
  values: FormValues,
  labels: FloatingContactButtonLabels
): FormValidationErrors {
  const errors: FormValidationErrors = {};

  if (values.firstName.trim().length < 2) {
    errors.firstName = labels.validation.firstNameMin;
  }

  if (values.lastName.trim().length < 2) {
    errors.lastName = labels.validation.lastNameMin;
  }

  const emailPattern = /\S+@\S+\.\S+/u;
  if (!values.email.trim() || !emailPattern.test(values.email.trim())) {
    errors.email = labels.validation.emailInvalid;
  }

  if (values.phone.trim()) {
    const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$|^\+?\d{10,15}$/;
    if (!phoneRegex.test(values.phone.replace(/\s/g, ''))) {
      errors.phone = labels.validation.phoneInvalid;
    }
  }

  if (!values.requestType) {
    errors.requestType = labels.validation.requestTypeRequired;
  }

  if (values.message.trim().length < 10) {
    errors.message = labels.validation.messageMin;
  }

  if (!values.consent) {
    errors.consent = labels.validation.consentRequired;
  }

  return errors;
}

// Modal Component
function ContactModal({
  isOpen,
  onClose,
  csrf,
  toast,
  onTrackConversion,
  apiEndpoint,
  privacyPolicyUrl,
  requestTypeOptions,
  colors,
  labels,
}: ContactModalProps) {
  const [values, setValues] = useState<FormValues>({ ...initialValues });
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { csrfToken, isLoading: csrfLoading, error: csrfError, refreshToken } = csrf;
  const { addToast } = toast;

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
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

    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

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

        if (errors[field as keyof FormValidationErrors]) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field as keyof FormValidationErrors];
            return newErrors;
          });
        }
      },
    [errors]
  );

  const handleBlur = useCallback(
    (field: keyof FormValues) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));

      const fieldErrors = validateForm(values, labels);
      if (fieldErrors[field as keyof FormValidationErrors]) {
        setErrors(prev => ({
          ...prev,
          [field]: fieldErrors[field as keyof FormValidationErrors],
        }));
      }
    },
    [values, labels]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (status === 'pending') return;

      if (!csrfToken) {
        setErrorMessage(labels.securityError);
        setStatus('error');
        return;
      }

      const validationErrors = validateForm(values, labels);
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
          title: labels.successTitle,
          description: labels.successDescription,
          variant: 'success',
        });
        return;
      }

      setStatus('pending');
      setErrorMessage(null);

      try {
        const response = await fetch(apiEndpoint, {
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

        await onTrackConversion?.('quick_contact_form', 'form_submission_success', true);

        setValues({ ...initialValues });
        setStatus('success');
        onClose();

        addToast({
          title: labels.successTitle,
          description: labels.successDescription,
          variant: 'success',
        });

        await refreshToken();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.';
        setErrorMessage(message);
        setStatus('error');
      }
    },
    [
      values,
      status,
      csrfToken,
      onClose,
      addToast,
      refreshToken,
      apiEndpoint,
      labels,
      onTrackConversion,
    ]
  );

  const inputBaseClass = cn(
    'w-full rounded-xl border px-4 py-3 text-base transition-all focus:outline-none focus:ring-2',
    colors.border,
    colors.inputBackground,
    colors.text,
    'placeholder:opacity-40',
    colors.focusRing
  );

  const inputErrorClass = 'border-red-500/60 focus:border-red-500 focus:ring-red-500/40';

  const labelClass = cn('block text-sm font-medium mb-2', colors.text);

  const getInputClass = (field: keyof FormValidationErrors) =>
    cn(inputBaseClass, touched[field] && errors[field] ? inputErrorClass : '');

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
            className={cn(
              'fixed inset-0 z-50 backdrop-blur-sm',
              colors.background,
              'bg-opacity-80'
            )}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              className={cn(
                'flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl',
                colors.border,
                colors.background
              )}
            >
              {/* Header */}
              <div
                className={cn(
                  'flex items-center justify-between border-b px-6 py-4',
                  colors.border
                )}
              >
                <h2 id="contact-modal-title" className={cn('text-xl font-semibold', colors.text)}>
                  {labels.modalTitle}
                </h2>
                <button
                  ref={firstFocusableRef}
                  onClick={onClose}
                  aria-label={labels.closeAriaLabel}
                  className={cn(
                    'rounded-full p-2 transition-colors focus:outline-none focus:ring-2',
                    colors.textMuted,
                    colors.focusRing
                  )}
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
                        {labels.firstName} <span className={colors.error}>{labels.required}</span>
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
                          className={cn('mt-1 text-sm', colors.error)}
                          role="alert"
                        >
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="fab-lastName" className={labelClass}>
                        {labels.lastName} <span className={colors.error}>{labels.required}</span>
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
                          className={cn('mt-1 text-sm', colors.error)}
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
                      {labels.email} <span className={colors.error}>{labels.required}</span>
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
                        className={cn('mt-1 text-sm', colors.error)}
                        role="alert"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="fab-phone" className={labelClass}>
                      {labels.phone}{' '}
                      <span className={colors.textMuted}>{labels.phoneOptional}</span>
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
                        className={cn('mt-1 text-sm', colors.error)}
                        role="alert"
                      >
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Request Type */}
                  <div>
                    <label htmlFor="fab-requestType" className={labelClass}>
                      {labels.requestType} <span className={colors.error}>{labels.required}</span>
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
                        className={cn('mt-1 text-sm', colors.error)}
                        role="alert"
                      >
                        {errors.requestType}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="fab-message" className={labelClass}>
                      {labels.message} <span className={colors.error}>{labels.required}</span>
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
                        className={cn('mt-1 text-sm', colors.error)}
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
                      className={cn(
                        'mt-1 h-5 w-5 rounded border',
                        colors.border,
                        colors.inputBackground,
                        colors.focusRing
                      )}
                      aria-invalid={touched.consent && !!errors.consent}
                      aria-describedby={errors.consent ? 'fab-consent-error' : undefined}
                    />
                    <div className="flex-1">
                      <label htmlFor="fab-consent" className={cn('text-sm', colors.textMuted)}>
                        {labels.consentText}{' '}
                        <a
                          href={privacyPolicyUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={cn(
                            'underline underline-offset-4',
                            colors.primary.replace('bg-', 'text-')
                          )}
                        >
                          {labels.privacyPolicyLinkText}
                        </a>{' '}
                        <span className={colors.error}>{labels.required}</span>
                      </label>
                      {touched.consent && errors.consent && (
                        <p
                          id="fab-consent-error"
                          className={cn('mt-1 text-sm', colors.error)}
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
                      className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400"
                      role="alert"
                    >
                      Erreur de sécurité : {csrfError}. Veuillez rafraîchir la page.
                    </div>
                  )}

                  {/* Submission Error */}
                  {status === 'error' && errorMessage && (
                    <div
                      className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400"
                      role="alert"
                    >
                      {errorMessage}
                    </div>
                  )}
                </div>
              </form>

              {/* Footer */}
              <div className={cn('border-t px-6 py-4', colors.border)}>
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
                  className={cn(
                    'w-full rounded-xl px-6 py-3 font-semibold shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    colors.primary,
                    colors.primaryText,
                    colors.focusRing
                  )}
                >
                  {status === 'pending' ? labels.submitting : labels.submit}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default FloatingContactButton;
