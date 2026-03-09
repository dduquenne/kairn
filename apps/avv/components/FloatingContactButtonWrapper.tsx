'use client';

import { Calendar } from 'lucide-react';

import { FloatingContactButton } from '@kairn/ui';

import { trackConversionEvent } from '../hooks/useAnalytics';
import { useCSRF } from '../hooks/useCSRF';
import { useToast } from '../lib/toast-context';

/**
 * Request type options for AVV
 */
const REQUEST_TYPE_OPTIONS = [
  { value: '', label: 'Choisir le type de demande' },
  { value: 'premiere_consultation', label: 'Première consultation' },
  { value: 'question_generale', label: 'Question générale' },
  { value: 'seminaire', label: 'Séminaire' },
];

/**
 * AVV-specific colors matching the site theme
 */
const AVV_COLORS = {
  primary: 'bg-gold',
  primaryText: 'text-night',
  background: 'bg-night',
  text: 'text-ivory',
  textMuted: 'text-ivory/60',
  border: 'border-ivory/10',
  focusRing: 'focus:ring-gold',
  error: 'text-feedback-error',
  inputBackground: 'bg-night/70',
};

/**
 * AVV-specific labels (French)
 */
const AVV_LABELS = {
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

/**
 * Floating Action Button with contact form - AVV-specific wrapper
 *
 * This component wraps the shared FloatingContactButton from @kairn/ui
 * and provides AVV-specific configuration and dependencies.
 */
export function AvvFloatingContactButton() {
  const csrf = useCSRF();
  const { addToast } = useToast();

  const handleTrackConversion = async (
    type: string,
    action: string,
    completed: boolean
  ) => {
    await trackConversionEvent(
      type as 'fab_click' | 'quick_contact_form' | 'contact_form' | 'appointment_request' | 'seminar_registration',
      action,
      completed
    );
  };

  return (
    <FloatingContactButton
      csrf={csrf}
      toast={{ addToast }}
      onTrackConversion={handleTrackConversion}
      apiEndpoint="/api/quick-contact"
      privacyPolicyUrl="/politique-de-confidentialite"
      requestTypeOptions={REQUEST_TYPE_OPTIONS}
      colors={AVV_COLORS}
      labels={AVV_LABELS}
      icon={<Calendar className="h-5 w-5 transition-transform group-hover:scale-110 md:h-6 md:w-6" />}
      hiddenPaths={['/admin']}
      enablePulse
      pulseInterval={10000}
    />
  );
}

export default AvvFloatingContactButton;
