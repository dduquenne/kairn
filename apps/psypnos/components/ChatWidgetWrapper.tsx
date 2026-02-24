'use client';

import { ChatWidget } from '@kairn/ui';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { trackConversionEvent } from '../hooks/useAnalytics';

/**
 * Psypnos-specific wrapper for the AI ChatWidget.
 *
 * Positioned bottom-left to avoid overlap with the FloatingContactButton (bottom-right).
 * Respects the admin chatbot toggle setting and hides on admin pages.
 */
export function PsypnosChatWidget() {
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
      siteName="Psypnos"
      greeting="Bonjour ! Je suis l'assistant virtuel de Psypnos. Je peux répondre à vos questions sur l'hypnothérapie, la sophrologie et nos services. Comment puis-je vous aider ?"
      placeholder="Posez votre question..."
      suggestedQuestions={[
        'Quels services proposez-vous ?',
        'Comment se déroule une séance ?',
        'Quels sont vos tarifs ?',
        'Comment prendre rendez-vous ?',
      ]}
      primaryColor="#c7a962"
      secondaryColor="#1a1a2e"
      position="bottom-left"
      contactUrl="/contact"
      onBookAppointment={handleBookAppointment}
      onConversationEnd={handleConversationEnd}
    />
  );
}

export default PsypnosChatWidget;
