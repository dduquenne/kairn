'use client';

import { MessageCircle, X, Send, Loader2, ThumbsUp, ThumbsDown, Calendar } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

import { cn } from '../../utils/cn';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestedActions?: SuggestedAction[];
}

export interface SuggestedAction {
  type: 'link' | 'appointment' | 'contact';
  label: string;
  url?: string;
}

export interface ChatWidgetProps {
  /** API endpoint for chat */
  apiEndpoint?: string;
  /** Site name for context */
  siteName?: string;
  /** Initial greeting message */
  greeting?: string;
  /** Placeholder text for input */
  placeholder?: string;
  /** Suggested questions to display */
  suggestedQuestions?: string[];
  /** Primary color for the widget */
  primaryColor?: string;
  /** Secondary/background color */
  secondaryColor?: string;
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left';
  /** Contact URL for appointment booking */
  contactUrl?: string;
  /** Callback when user wants to book appointment */
  onBookAppointment?: () => void;
  /** Callback when conversation ends */
  onConversationEnd?: (satisfied: boolean | null) => void;
  /** Session ID for analytics */
  sessionId?: string;
  /** Custom CSS class */
  className?: string;
}

export interface ChatWidgetColors {
  primary: string;
  secondary: string;
  text: string;
  textMuted: string;
  surface: string;
  border: string;
}

const DEFAULT_COLORS: ChatWidgetColors = {
  primary: '#c7a962',
  secondary: '#1a1a2e',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.7)',
  surface: '#252542',
  border: 'rgba(255, 255, 255, 0.1)',
};

const DEFAULT_GREETING = `Bonjour ! Je suis l'assistant virtuel. Je peux répondre à vos questions sur nos services d'hypnothérapie et de sophrologie. Comment puis-je vous aider ?`;

const DEFAULT_SUGGESTED_QUESTIONS = [
  'Quels services proposez-vous ?',
  'Comment se déroule une séance ?',
  'Quels sont vos tarifs ?',
  'Comment prendre rendez-vous ?',
];

export function ChatWidget({
  apiEndpoint = '/api/chat',
  siteName = 'Psypnos',
  greeting = DEFAULT_GREETING,
  placeholder = 'Posez votre question...',
  suggestedQuestions = DEFAULT_SUGGESTED_QUESTIONS,
  primaryColor = DEFAULT_COLORS.primary,
  secondaryColor = DEFAULT_COLORS.secondary,
  position = 'bottom-right',
  contactUrl = '/contact',
  onBookAppointment,
  onConversationEnd,
  sessionId,
  className,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, greeting, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content.trim(),
            conversationId: conversationId ?? undefined,
            sessionId,
            context: {
              siteName,
              currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
            },
          }),
        });

        const data = await response.json();

        // Update conversation ID from any response (success or error)
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        // Handle error responses that still contain a displayable message
        if (!response.ok) {
          const errorMessage: ChatMessage = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content:
              data.message ||
              'Désolé, une erreur est survenue. Veuillez réessayer ou nous contacter directement.',
            timestamp: new Date(),
            suggestedActions: data.suggestedActions || [
              { type: 'contact', label: 'Nous contacter', url: contactUrl },
            ],
          };
          setMessages(prev => [...prev, errorMessage]);
        } else {
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
            suggestedActions: data.suggestedActions,
          };

          setMessages(prev => [...prev, assistantMessage]);

          // Show feedback after a few exchanges
          if (messages.length >= 4 && !showFeedback) {
            setShowFeedback(true);
          }
        }
      } catch (error) {
        // Network error — fetch itself failed (offline, DNS, etc.)
        console.error('Chat error:', error);
        setMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content:
              'Désolé, une erreur de connexion est survenue. Vérifiez votre connexion internet et réessayez.',
            timestamp: new Date(),
            suggestedActions: [{ type: 'contact', label: 'Nous contacter', url: contactUrl }],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      apiEndpoint,
      conversationId,
      sessionId,
      siteName,
      messages.length,
      showFeedback,
      contactUrl,
      isLoading,
    ]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleAction = (action: SuggestedAction) => {
    if (action.type === 'appointment') {
      if (onBookAppointment) {
        onBookAppointment();
      } else if (action.url) {
        window.location.href = action.url;
      }
    } else if (action.url) {
      window.open(action.url, '_blank');
    }
  };

  const handleFeedback = async (satisfied: boolean) => {
    setShowFeedback(false);
    onConversationEnd?.(satisfied);

    // Send feedback to API
    if (conversationId) {
      try {
        await fetch(`${apiEndpoint}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, satisfied }),
        });
      } catch (error) {
        console.error('Feedback error:', error);
      }
    }
  };

  const colors: ChatWidgetColors = {
    ...DEFAULT_COLORS,
    primary: primaryColor,
    secondary: secondaryColor,
  };

  return (
    <div
      className={cn(
        'fixed z-50',
        position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4',
        className
      )}
      style={
        {
          '--chat-primary': colors.primary,
          '--chat-secondary': colors.secondary,
          '--chat-surface': colors.surface,
          '--chat-text': colors.text,
          '--chat-text-muted': colors.textMuted,
          '--chat-border': colors.border,
        } as React.CSSProperties
      }
    >
      {/* Chat Window */}
      {isOpen && (
        <div
          className="mb-4 flex h-[500px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{ backgroundColor: colors.secondary }}
          role="dialog"
          aria-modal="true"
          aria-label={`Chat avec ${siteName}`}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: colors.surface }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.primary }}
              >
                <MessageCircle size={20} style={{ color: colors.secondary }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: colors.text }}>
                  Assistant {siteName}
                </h3>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Réponse instantanée
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 transition-colors hover:bg-white/10"
              aria-label="Fermer le chat"
            >
              <X size={20} style={{ color: colors.textMuted }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4" role="log" aria-live="polite">
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2',
                      message.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                    )}
                    style={{
                      backgroundColor: message.role === 'user' ? colors.primary : colors.surface,
                      color: message.role === 'user' ? colors.secondary : colors.text,
                    }}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>

                    {/* Suggested Actions */}
                    {message.suggestedActions && message.suggestedActions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAction(action)}
                            className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: colors.primary,
                              color: colors.secondary,
                            }}
                          >
                            {action.type === 'appointment' && <Calendar size={12} />}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start" role="status" aria-label="Réponse en cours">
                  <div
                    className="rounded-2xl rounded-bl-md px-4 py-3"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <Loader2
                      className="animate-spin"
                      size={20}
                      style={{ color: colors.primary }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )}

              {/* Feedback prompt */}
              {showFeedback && !isLoading && (
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: colors.surface }}
                >
                  <p className="mb-2 text-sm" style={{ color: colors.textMuted }}>
                    Cette conversation vous a-t-elle été utile ?
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleFeedback(true)}
                      className="flex items-center gap-1 rounded-full px-3 py-1 transition-colors hover:bg-green-500/20"
                      style={{ color: '#22c55e' }}
                      aria-label="Oui, la conversation était utile"
                    >
                      <ThumbsUp size={16} aria-hidden="true" />
                      <span className="text-sm">Oui</span>
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      className="flex items-center gap-1 rounded-full px-3 py-1 transition-colors hover:bg-red-500/20"
                      style={{ color: '#ef4444' }}
                      aria-label="Non, la conversation n'était pas utile"
                    >
                      <ThumbsDown size={16} aria-hidden="true" />
                      <span className="text-sm">Non</span>
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions (only show initially) */}
            {messages.length === 1 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium" style={{ color: colors.textMuted }}>
                  Questions fréquentes :
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="rounded-full border px-3 py-1 text-xs transition-colors hover:bg-white/5"
                      style={{
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t p-3"
            style={{ borderColor: colors.border }}
          >
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2"
              style={{ backgroundColor: colors.surface }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={placeholder}
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
                style={{ color: colors.text }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="rounded-full p-2 transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: input.trim() ? colors.primary : 'transparent',
                  color: input.trim() ? colors.secondary : colors.textMuted,
                }}
                aria-label="Envoyer le message"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs" style={{ color: colors.textMuted }}>
              Propulsé par l&apos;IA • Réponses limitées aux services du cabinet
            </p>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: colors.primary }}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        {isOpen ? (
          <X size={24} style={{ color: colors.secondary }} />
        ) : (
          <MessageCircle size={24} style={{ color: colors.secondary }} />
        )}
      </button>
    </div>
  );
}

export default ChatWidget;
