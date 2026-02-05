/**
 * Types for the FloatingContactButton component
 */

export type RequestType = '' | string;

export interface RequestTypeOption {
  value: string;
  label: string;
}

export interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  requestType: RequestType;
  message: string;
  consent: boolean;
  honeypot: string;
}

export type SubmissionStatus = 'idle' | 'pending' | 'success' | 'error';

export interface FormValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  requestType?: string;
  message?: string;
  consent?: string;
}

/**
 * Color configuration for the FAB
 */
export interface FloatingContactButtonColors {
  /** Primary button background color (Tailwind class) */
  primary: string;
  /** Primary text color (Tailwind class) */
  primaryText: string;
  /** Background color for modal (Tailwind class) */
  background: string;
  /** Text color (Tailwind class) */
  text: string;
  /** Muted text color (Tailwind class) */
  textMuted: string;
  /** Border color (Tailwind class) */
  border: string;
  /** Focus ring color (Tailwind class) */
  focusRing: string;
  /** Error color (Tailwind class) */
  error: string;
  /** Input background color (Tailwind class) */
  inputBackground: string;
}

/**
 * Labels configuration for internationalization
 */
export interface FloatingContactButtonLabels {
  /** Modal title */
  modalTitle: string;
  /** First name field label */
  firstName: string;
  /** Last name field label */
  lastName: string;
  /** Email field label */
  email: string;
  /** Phone field label */
  phone: string;
  /** Phone optional text */
  phoneOptional: string;
  /** Request type field label */
  requestType: string;
  /** Message field label */
  message: string;
  /** Consent text */
  consentText: string;
  /** Privacy policy link text */
  privacyPolicyLinkText: string;
  /** Submit button text */
  submit: string;
  /** Submit button loading text */
  submitting: string;
  /** Required field indicator */
  required: string;
  /** Close button aria label */
  closeAriaLabel: string;
  /** FAB aria label */
  fabAriaLabel: string;
  /** Success toast title */
  successTitle: string;
  /** Success toast description */
  successDescription: string;
  /** Security error message */
  securityError: string;
  /** Validation errors */
  validation: {
    firstNameMin: string;
    lastNameMin: string;
    emailInvalid: string;
    phoneInvalid: string;
    requestTypeRequired: string;
    messageMin: string;
    consentRequired: string;
  };
}

/**
 * Props for useCSRF hook result
 */
export interface CSRFHookResult {
  csrfToken: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
}

/**
 * Props for useToast hook result
 */
export interface ToastHookResult {
  addToast: (toast: {
    title: string;
    description: string;
    variant: 'success' | 'error' | 'info' | 'warning';
  }) => void;
}

/**
 * Props for the FloatingContactButton component
 */
export interface FloatingContactButtonProps {
  /**
   * Function to track conversion events
   */
  onTrackConversion?: (
    type: string,
    action: string,
    completed: boolean
  ) => void | Promise<void>;

  /**
   * CSRF hook result for security
   */
  csrf: CSRFHookResult;

  /**
   * Toast hook result for notifications
   */
  toast: ToastHookResult;

  /**
   * API endpoint for form submission
   * @default '/api/quick-contact'
   */
  apiEndpoint?: string;

  /**
   * Privacy policy URL
   * @default '/politique-de-confidentialite'
   */
  privacyPolicyUrl?: string;

  /**
   * Request type options for the select
   */
  requestTypeOptions: RequestTypeOption[];

  /**
   * Color configuration
   */
  colors?: Partial<FloatingContactButtonColors>;

  /**
   * Labels configuration for i18n
   */
  labels?: Partial<FloatingContactButtonLabels>;

  /**
   * Icon component to display in the FAB
   * @default Calendar icon from lucide-react
   */
  icon?: React.ReactNode;

  /**
   * Paths to hide the FAB on (e.g., admin pages)
   * @default ['/admin']
   */
  hiddenPaths?: string[];

  /**
   * Whether to enable pulse animation
   * @default true
   */
  enablePulse?: boolean;

  /**
   * Pulse animation interval in milliseconds
   * @default 10000
   */
  pulseInterval?: number;

  /**
   * Custom class name for the FAB
   */
  className?: string;
}

/**
 * Props for the ContactModal component
 */
export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  csrf: CSRFHookResult;
  toast: ToastHookResult;
  onTrackConversion?: (
    type: string,
    action: string,
    completed: boolean
  ) => void | Promise<void>;
  apiEndpoint: string;
  privacyPolicyUrl: string;
  requestTypeOptions: RequestTypeOption[];
  colors: FloatingContactButtonColors;
  labels: FloatingContactButtonLabels;
}
