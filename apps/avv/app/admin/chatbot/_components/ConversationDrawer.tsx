"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

import type { ConversationDetail, ConversationPreview } from "../types";

interface ConversationDrawerProps {
  conversation: ConversationPreview | null;
  open: boolean;
  onClose: () => void;
  onDelete: (conversation: ConversationPreview) => void;
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationDrawer({
  conversation,
  open,
  onClose,
  onDelete,
}: ConversationDrawerProps) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/chatbot/conversations/${id}`);
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && conversation) {
      void fetchDetail(conversation.id);
    } else {
      setDetail(null);
      setError(null);
    }
  }, [open, conversation, fetchDetail]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-[70] flex justify-end transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Détail de la conversation"
      >
        <div
          className={`flex h-full w-full flex-col bg-night/95 shadow-xl transition-transform duration-300 ease-in-out sm:w-[32rem] lg:w-[40rem] ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-night/40 px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold text-gold">
                Conversation
              </h2>
              {detail && (
                <p className="text-xs text-ivory/40">
                  {formatFullDate(detail.createdAt)} &middot;{" "}
                  {detail.messageCount} messages
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
                className="rounded-md p-2 text-ivory/70 transition hover:bg-night/60 hover:text-ivory"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Meta info bar */}
          {detail && (
            <div className="flex flex-wrap gap-3 border-b border-night/40 px-4 py-2">
              <MetaTag label="Statut" value={statusLabel(detail.status)} />
              <MetaTag
                label="Satisfaction"
                value={
                  detail.satisfied === true
                    ? "👍 Satisfait"
                    : detail.satisfied === false
                      ? "👎 Insatisfait"
                      : "Pas de retour"
                }
              />
              {detail.totalTokens > 0 && (
                <MetaTag label="Tokens" value={detail.totalTokens.toLocaleString("fr-FR")} />
              )}
              {detail.avgProcessingTime !== null && (
                <MetaTag label="Temps moyen" value={`${detail.avgProcessingTime} ms`} />
              )}
              {detail.referrer && (
                <MetaTag label="Page" value={detail.referrer} />
              )}
              {detail.deviceType && (
                <MetaTag label="Appareil" value={detail.deviceType} />
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-4 text-center text-sm text-rose-400">
                {error}
              </div>
            )}

            {detail && !loading && (
              <div className="space-y-3">
                {detail.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        msg.role === "user"
                          ? "rounded-br-md bg-gold/20 text-ivory"
                          : msg.role === "system"
                            ? "rounded-bl-md border border-blue-400/20 bg-blue-400/5 text-blue-300"
                            : "rounded-bl-md bg-night/80 text-ivory/90"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-ivory/40">
                          {msg.role === "user"
                            ? "Visiteur"
                            : msg.role === "assistant"
                              ? "ChatBot IA"
                              : "Système"}
                        </span>
                        <span className="text-[10px] text-ivory/30">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </p>
                      {(msg.tokensUsed || msg.processingTime) && (
                        <div className="mt-1.5 flex gap-3 text-[10px] text-ivory/25">
                          {msg.tokensUsed && (
                            <span>{msg.tokensUsed} tokens</span>
                          )}
                          {msg.processingTime && (
                            <span>{msg.processingTime} ms</span>
                          )}
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

function MetaTag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-ivory/40">{label}:</span>
      <span className="font-medium text-ivory/70">{value}</span>
    </div>
  );
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "En cours",
    ended: "Terminée",
    transferred: "Transférée",
  };
  return labels[status] || status;
}
