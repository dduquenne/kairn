'use client';

import { Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface ChatbotToggleProps {
  /** API endpoint to get/set chatbot settings */
  settingsEndpoint?: string;
  /** Callback when status changes */
  onStatusChange?: (enabled: boolean) => void;
}

/** Toggle switch for enabling/disabling the chatbot on the site */
export function ChatbotToggle({
  settingsEndpoint = '/api/admin/chatbot/settings',
  onStatusChange,
}: ChatbotToggleProps) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(settingsEndpoint);
      if (response.ok) {
        const data = await response.json();
        setEnabled(data.chatbotEnabled);
      }
    } catch {
      setEnabled(true);
    } finally {
      setLoading(false);
    }
  }, [settingsEndpoint]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  async function handleToggle() {
    if (toggling || enabled === null) return;

    const newValue = !enabled;
    setToggling(true);

    try {
      const response = await fetch(settingsEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatbotEnabled: newValue }),
      });

      if (response.ok) {
        setEnabled(newValue);
        onStatusChange?.(newValue);
      }
    } catch {
      // Revert on error
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="border-gold/20 bg-night/60 flex items-center gap-3 rounded-xl border px-4 py-3">
        <Loader2 className="text-gold/50 h-4 w-4 animate-spin" />
        <span className="text-ivory/50 text-sm">Chargement...</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors ${
        enabled ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-rose-400/30 bg-rose-400/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg ${
            enabled ? 'bg-emerald-400/15' : 'bg-rose-400/15'
          }`}
        >
          {enabled ? '\u2705' : '\u26D4'}
        </div>
        <div>
          <p className="text-ivory text-sm font-medium">
            ChatBot IA {enabled ? 'activé' : 'désactivé'}
          </p>
          <p className="text-ivory/40 text-xs">
            {enabled
              ? 'Le chatbot est visible sur toutes les pages du site'
              : 'Le chatbot est masqué pour les visiteurs'}
          </p>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={toggling}
        className="relative flex h-7 w-12 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-wait"
        style={{
          backgroundColor: enabled ? 'rgba(52, 211, 153, 0.4)' : 'rgba(107, 114, 128, 0.4)',
        }}
        role="switch"
        aria-checked={enabled ?? false}
        aria-label={enabled ? 'Désactiver le ChatBot' : 'Activer le ChatBot'}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        {toggling && (
          <Loader2 className="text-ivory/60 absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        )}
      </button>
    </div>
  );
}
