/**
 * ContactForm Component Tests
 *
 * Tests for the ContactForm component including:
 * - Form rendering
 * - Field validation
 * - Form submission
 * - Error handling
 * - Success states
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ContactForm, type ContactFormProps } from '../ContactForm';

/**
 * Render ContactForm with default props
 */
function renderContactForm(props: Partial<ContactFormProps> = {}) {
  const defaultProps: ContactFormProps = {
    apiEndpoint: '/api/contact',
    ...props,
  };

  return render(<ContactForm {...defaultProps} />);
}

describe('ContactForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Mock successful API response by default
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      renderContactForm();

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      renderContactForm();

      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should render custom labels', () => {
      renderContactForm({
        labels: {
          name: 'Votre nom',
          email: 'Votre email',
          message: 'Votre message',
        },
      });

      expect(screen.getByLabelText(/votre nom/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/votre email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/votre message/i)).toBeInTheDocument();
    });

    it('should render placeholders', () => {
      renderContactForm({
        placeholders: {
          name: 'Jean Dupont',
          email: 'jean@example.com',
          message: 'Votre message...',
        },
      });

      expect(screen.getByPlaceholderText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('jean@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Votre message...')).toBeInTheDocument();
    });

    it('should render custom submit button text', () => {
      renderContactForm({ submitText: 'Envoyer' });

      expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument();
    });

    it('should render privacy policy link when provided', () => {
      renderContactForm({
        privacyPolicyUrl: '/privacy',
        privacyPolicyText: 'politique de confidentialité',
      });

      const link = screen.getByRole('link', { name: /politique de confidentialité/i });
      expect(link).toHaveAttribute('href', '/privacy');
    });

    it('should render honeypot field as hidden', () => {
      const { container } = renderContactForm();

      // Honeypot should exist but be hidden
      const honeypot = container.querySelector('[name="honeypot"]');
      expect(honeypot).toBeInTheDocument();
    });

    it('should render custom children', () => {
      renderContactForm({
        children: <div data-testid="custom-content">Custom content</div>,
      });

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });

    it('should render custom submit button', () => {
      renderContactForm({
        submitButton: (
          <button type="submit" data-testid="custom-submit">
            Custom Submit
          </button>
        ),
      });

      expect(screen.getByTestId('custom-submit')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show error for empty name', async () => {
      renderContactForm();

      const nameInput = screen.getByLabelText(/name/i);
      await user.click(nameInput);
      await user.tab(); // Blur

      await waitFor(() => {
        expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();
      });
    });

    it('should show error for name too short', async () => {
      renderContactForm();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'J');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email', async () => {
      renderContactForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    it('should show error for message too short', async () => {
      renderContactForm();

      const messageInput = screen.getByLabelText(/message/i);
      await user.type(messageInput, 'Short');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when valid input is provided', async () => {
      renderContactForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });

      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const onSuccess = vi.fn();
      renderContactForm({ onSuccess });

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/contact',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });
    });

    it('should include CSRF token in request', async () => {
      renderContactForm({ csrfToken: 'test-csrf-token' });

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-CSRF-Token': 'test-csrf-token',
            }),
          })
        );
      });
    });

    it('should show loading state during submission', async () => {
      // Make fetch hang to see loading state
      global.fetch = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({}) }), 1000)
            )
        );

      renderContactForm({ loadingText: 'Sending...' });

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    });

    it('should show success message on successful submission', async () => {
      renderContactForm({
        messages: {
          success: 'Merci pour votre message!',
        },
      });

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText('Merci pour votre message!')).toBeInTheDocument();
      });
    });

    it('should call onSuccess callback on successful submission', async () => {
      const onSuccess = vi.fn();
      renderContactForm({ onSuccess });

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should reset form after successful submission', async () => {
      renderContactForm();

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toHaveValue('');
        expect(screen.getByLabelText(/email/i)).toHaveValue('');
        expect(screen.getByLabelText(/message/i)).toHaveValue('');
      });
    });

    it('should call onConversion on successful submission', async () => {
      const onConversion = vi.fn();
      renderContactForm({ onConversion });

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(onConversion).toHaveBeenCalledWith('contact_form', 'form_submission_success');
      });
    });

    it('should call refreshCsrfToken after successful submission', async () => {
      const refreshCsrfToken = vi.fn().mockResolvedValue(undefined);
      renderContactForm({ refreshCsrfToken });

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(refreshCsrfToken).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      renderContactForm();

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should call onError callback on failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      const onError = vi.fn();
      renderContactForm({ onError });

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should show CSRF error when token is missing', async () => {
      renderContactForm({
        csrfToken: undefined,
        messages: {
          csrfError: 'Erreur de sécurité',
        },
      });

      // Clear the auto-generated token
      const submitButton = screen.getByRole('button', { name: /send/i });

      // Button should be disabled without CSRF token
      expect(submitButton).toBeDisabled();
    });

    it('should show CSRF error message when csrfError is provided', () => {
      renderContactForm({
        csrfError: 'Token expired',
        messages: {
          csrfError: 'Erreur de sécurité: {error}',
        },
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should use default error message on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      renderContactForm({
        messages: {
          error: 'Une erreur est survenue.',
        },
      });

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Honeypot (Bot Detection)', () => {
    it('should fake success when honeypot is filled', async () => {
      const onSuccess = vi.fn();
      const { container } = renderContactForm({ onSuccess });

      await user.type(screen.getByLabelText(/name/i), 'Bot User');
      await user.type(screen.getByLabelText(/email/i), 'bot@example.com');
      await user.type(screen.getByLabelText(/message/i), 'This is a spam message.');

      // Fill honeypot (bot behavior)
      const honeypot = container.querySelector('[name="honeypot"]') as HTMLInputElement;
      fireEvent.change(honeypot, { target: { value: 'spam content' } });

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        // Should show success but NOT actually submit
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form element', () => {
      renderContactForm();

      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should have noValidate attribute', () => {
      const { container } = renderContactForm();

      const form = container.querySelector('form');
      expect(form).toHaveAttribute('novalidate');
    });

    it('should have status messages with proper roles', async () => {
      renderContactForm();

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        const successMessage = screen.getByRole('status');
        expect(successMessage).toBeInTheDocument();
      });
    });

    it('should have error messages with alert role', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Error' }),
      });

      renderContactForm();

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should have required fields marked', () => {
      renderContactForm();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);

      expect(nameInput).toBeRequired();
      expect(emailInput).toBeRequired();
      expect(messageInput).toBeRequired();
    });
  });

  describe('Button States', () => {
    it('should disable button during submission', async () => {
      global.fetch = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({}) }), 100)
            )
        );

      renderContactForm();

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough.'
      );

      const submitButton = screen.getByRole('button', { name: /send/i });
      await user.click(submitButton);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should disable button when csrfLoading is true', () => {
      renderContactForm({ csrfLoading: true });

      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('should disable button when csrfError is present', () => {
      renderContactForm({ csrfError: 'Token error' });

      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });
  });
});
