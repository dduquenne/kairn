/**
 * Accessibility tests for ChatWidget component
 *
 * Tests WCAG 2.1 AA compliance for chat interface
 */

import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { axe } from 'vitest-axe';

import { ChatWidget } from '../../components/chat/ChatWidget';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  MessageCircle: (props: Record<string, unknown>) => (
    <span data-testid="message-circle" {...props}>
      msg
    </span>
  ),
  X: (props: Record<string, unknown>) => (
    <span data-testid="x-icon" {...props}>
      x
    </span>
  ),
  Send: (props: Record<string, unknown>) => (
    <span data-testid="send-icon" {...props}>
      send
    </span>
  ),
  Loader2: (props: Record<string, unknown>) => (
    <span data-testid="loader" {...props}>
      load
    </span>
  ),
  ThumbsUp: (props: Record<string, unknown>) => (
    <span data-testid="thumbs-up" {...props}>
      up
    </span>
  ),
  ThumbsDown: (props: Record<string, unknown>) => (
    <span data-testid="thumbs-down" {...props}>
      down
    </span>
  ),
  Calendar: (props: Record<string, unknown>) => (
    <span data-testid="calendar" {...props}>
      cal
    </span>
  ),
}));

// Mock fetch
global.fetch = vi.fn();

afterEach(cleanup);

/**
 * Helper to open the chat widget
 */
function openChat(container: HTMLElement) {
  const buttons = container.querySelectorAll('button');
  const toggleButton = Array.from(buttons).find(
    btn => btn.getAttribute('aria-label') === 'Ouvrir le chat'
  );
  if (toggleButton) {
    fireEvent.click(toggleButton);
  }
}

describe('ChatWidget - Accessibility', () => {
  it('should have accessible toggle button with aria-label', () => {
    const { container } = render(<ChatWidget />);
    const buttons = container.querySelectorAll('button');
    const toggleButton = Array.from(buttons).find(
      btn => btn.getAttribute('aria-label') === 'Ouvrir le chat'
    );
    expect(toggleButton).toBeTruthy();
  });

  it('should have no accessibility violations when closed', async () => {
    const { container } = render(<ChatWidget />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should open dialog with role="dialog" when toggled', () => {
    const { container } = render(<ChatWidget />);
    openChat(container);

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-label')).toBeTruthy();
  });

  it('should have no accessibility violations when open', async () => {
    const { container } = render(<ChatWidget siteName="TestSite" />);
    openChat(container);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have log role on messages area', () => {
    const { container } = render(<ChatWidget />);
    openChat(container);

    const log = container.querySelector('[role="log"]');
    expect(log).not.toBeNull();
    expect(log?.getAttribute('aria-live')).toBe('polite');
  });

  it('should have accessible send button with aria-label', () => {
    const { container } = render(<ChatWidget />);
    openChat(container);

    const sendButton = container.querySelector('[aria-label="Envoyer le message"]');
    expect(sendButton).not.toBeNull();
  });

  it('should have accessible close button inside dialog', () => {
    const { container } = render(<ChatWidget />);
    openChat(container);

    const dialog = container.querySelector('[role="dialog"]');
    const closeButton = dialog?.querySelector('[aria-label="Fermer le chat"]');
    expect(closeButton).not.toBeNull();
  });

  it('should have decorative send icon marked with aria-hidden', () => {
    const { container } = render(<ChatWidget />);
    openChat(container);

    const sendIcon = container.querySelector('[data-testid="send-icon"]');
    expect(sendIcon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should have accessible input with placeholder', () => {
    const { container } = render(<ChatWidget placeholder="Votre question..." />);
    openChat(container);

    const input = container.querySelector('input[placeholder="Votre question..."]');
    expect(input).not.toBeNull();
  });
});
