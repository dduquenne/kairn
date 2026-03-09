'use client';

import { ChatWidget } from '@kairn/ui';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { trackConversionEvent } from '../hooks/useAnalytics';

/**
 * Get or create a persistent session ID for chatbot conversation tracking.
 * Stored in sessionStorage so it persists across page navigations within
 * the same browser session.
 */
function getChatSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('avv_chat_session');
  if (!id) {
    id = `chat_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('avv_chat_session', id);
  }
  return id;
}

/**
 * AVV-specific wrapper for the AI ChatWidget.
 *
 * Positioned bottom-left to avoid overlap with the FloatingContactButton (bottom-right).
 * Respects the admin chatbot toggle setting and hides on admin pages.
 */
export function AvvChatWidget() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch('/api/chatbot-status');
        if (response.ok) {
          const data = await response.json();
          setEnabled(data.enabled);
        } else {
          setEnabled(true);
        }
      } catch {
        setEnabled(true);
      }
    }
    void checkStatus();
  }, []);

  // Don't render on admin pages or while checking status
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) return null;
  if (enabled === null || !enabled) return null;

  const handleBookAppointment = () => {
    trackConversionEvent('appointment_request', 'chatbot_suggestion', false);
    window.location.href = '/contact';
  };

  const handleConversationEnd = async (satisfied: boolean | null) => {
    if (satisfied !== null) {
      await trackConversionEvent('fab_click', 'chatbot_feedback', satisfied);
    }
  };

  return (
    <ChatWidget
      apiEndpoint="/api/chat"
      siteName="Appréciez Votre Vie"
      greeting="Bonjour ! Je suis l'assistant virtuel d'Appréciez Votre Vie. Je peux répondre à vos questions sur la sophrologie, la relaxation, la somatothérapie, le breathwork et le reiki. Comment puis-je vous aider ?"
      placeholder="Posez votre question..."
      suggestedQuestions={[
        'Quels sont vos services en sophrologie ?',
        'Comment se déroule une séance de somatothérapie ?',
        'Qu\'est-ce que le breathwork et le rebirth ?',
        'Proposez-vous des séances de reiki ?',
      ]}
      primaryColor="#9b72b0"
      secondaryColor="#2d1b4e"
      position="bottom-left"
      contactUrl="/contact"
      sessionId={getChatSessionId()}
      onBookAppointment={handleBookAppointment}
      onConversationEnd={handleConversationEnd}
    />
  );
}

export default AvvChatWidget;
