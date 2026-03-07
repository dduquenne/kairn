'use client';

import { X, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { ConversationDetail, ConversationPreview } from './types';

interface ConversationDrawerProps {
  conversation: ConversationPreview | null;
  open: boolean;
  onClose: () => void;
  onDelete: (conversation: ConversationPreview) => void;
  /** API base path for conversation details */
  apiBasePath?: string;
}

/** Format a date string to full French locale */
function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format a date string to time only */
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** French label for conversation status */
function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'En cours',
    ended: 'Terminée',
    transferred: 'Transférée',
  };
  return labels[status] || status;
}

/** Small metadata tag */
function MetaTag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-ivory/40">{label}:</span>
      <span className="text-ivory/70 font-medium">{value}</span>
    </div>
  );
}

/** Side drawer showing full conversation details */
export function ConversationDrawer({
  conversation,
  open,
  onClose,
  onDelete,
  apiBasePath = '/api/admin/chatbot/conversations',
}: ConversationDrawerProps) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBasePath}/${id}`);
        if (!response.ok) throw new Error('Erreur de chargement');
        const data = await response.json();
        setDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    },
    [apiBasePath]
  );

  useEffect(() => {
    if (open && conversation) {
      void fetchDetail(conversation.id);
    } else {
      setDetail(null);
      setError(null);
    }
  }, [open, conversation, fetchDetail]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-0 z-[70] flex justify-end transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Détail de la conversation"
      >
        <div
          className={`bg-night/95 flex h-full w-full flex-col shadow-xl transition-transform duration-300 ease-in-out sm:w-[32rem] lg:w-[40rem] ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="border-night/40 flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-gold text-lg font-semibold">Conversation</h2>
              {detail && (
                <p className="text-ivory/40 text-xs">
                  {formatFullDate(detail.createdAt)} &middot; {detail.messageCount} messages
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {conversation && (
                <button
                  onClick={() => onDelete(conversation)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-400/10"
                >
                  Supprimer
                </button>
              )}
              <button
                onClick={onClose}
                className="text-ivory/70 hover:bg-night/60 hover:text-ivory rounded-md p-2 transition"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {detail && (
            <div className="border-night/40 flex flex-wrap gap-3 border-b px-4 py-2">
              <MetaTag label="Statut" value={statusLabel(detail.status)} />
              <MetaTag
                label="Satisfaction"
                value={
                  detail.satisfied === true
                    ? '\uD83D\uDC4D Satisfait'
                    : detail.satisfied === false
                      ? '\uD83D\uDC4E Insatisfait'
                      : 'Pas de retour'
                }
              />
              {detail.totalTokens > 0 && (
                <MetaTag label="Tokens" value={detail.totalTokens.toLocaleString('fr-FR')} />
              )}
              {detail.avgProcessingTime !== null && (
                <MetaTag label="Temps moyen" value={`${detail.avgProcessingTime} ms`} />
              )}
              {detail.referrer && <MetaTag label="Page" value={detail.referrer} />}
              {detail.deviceType && <MetaTag label="Appareil" value={detail.deviceType} />}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-gold h-6 w-6 animate-spin" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-4 text-center text-sm text-rose-400">
                {error}
              </div>
            )}

            {detail && !loading && (
              <div className="space-y-3">
                {detail.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-gold/20 text-ivory rounded-br-md'
                          : msg.role === 'system'
                            ? 'rounded-bl-md border border-blue-400/20 bg-blue-400/5 text-blue-300'
                            : 'bg-night/80 text-ivory/90 rounded-bl-md'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-ivory/40 text-[10px] font-semibold uppercase tracking-wider">
                          {msg.role === 'user'
                            ? 'Visiteur'
                            : msg.role === 'assistant'
                              ? 'ChatBot IA'
                              : 'Système'}
                        </span>
                        <span className="text-ivory/30 text-[10px]">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      {(msg.tokensUsed || msg.processingTime) && (
                        <div className="text-ivory/25 mt-1.5 flex gap-3 text-[10px]">
                          {msg.tokensUsed && <span>{msg.tokensUsed} tokens</span>}
                          {msg.processingTime && <span>{msg.processingTime} ms</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
