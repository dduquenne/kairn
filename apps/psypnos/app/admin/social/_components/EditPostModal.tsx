'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Save, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import type { SocialPlatform } from '@/lib/social/types';

import { SocialPlatformIcon } from '../accounts/_components/SocialPlatformIcon';

import { SuggestedTimeSlots } from './SuggestedTimeSlots';

// ===========================================
// Types
// ===========================================

interface EditablePost {
  id: string;
  platform: SocialPlatform;
  content: string;
  scheduledAt: string | null;
  hashtags?: string[];
}

interface EditPostModalProps {
  post: EditablePost | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (postId: string, data: { scheduledAt: string | null; content?: string }) => Promise<void>;
  articleDate?: string | null;
}

// ===========================================
// Helpers
// ===========================================

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ===========================================
// Main Component
// ===========================================

export function EditPostModal({ post, isOpen, onClose, onSave, articleDate }: EditPostModalProps) {
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isContentEdited, setIsContentEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when post changes
  useEffect(() => {
    if (post) {
      setScheduledDate(post.scheduledAt ? formatDateTimeLocal(new Date(post.scheduledAt)) : '');
      setContent(post.content);
      setIsContentEdited(false);
      setError(null);
    }
  }, [post]);

  const handleSave = useCallback(async () => {
    if (!post) return;

    setIsSaving(true);
    setError(null);

    try {
      const data: { scheduledAt: string | null; content?: string } = {
        scheduledAt: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      };

      if (isContentEdited && content !== post.content) {
        data.content = content;
      }

      await onSave(post.id, data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  }, [post, scheduledDate, content, isContentEdited, onSave, onClose]);

  const handleQuickTime = useCallback((date: Date) => {
    setScheduledDate(formatDateTimeLocal(date));
  }, []);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    setIsContentEdited(true);
  }, []);

  // Character count
  const maxLength: Record<SocialPlatform, number> = {
    FACEBOOK: 63206,
    LINKEDIN: 3000,
    INSTAGRAM: 2200,
    TWITTER: 280,
    THREADS: 500,
  };
  const currentMax = post ? maxLength[post.platform] : 3000;
  const charCount = content.length;
  const isOverLimit = charCount > currentMax;

  return (
    <AnimatePresence>
      {isOpen && post && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-night/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border-gold/20 from-night to-night/95 max-h-[90vh] w-full max-w-lg overflow-hidden rounded-xl border bg-gradient-to-br shadow-2xl"
          >
            {/* Header */}
            <div className="border-gold/20 flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <SocialPlatformIcon platform={post.platform} className="h-6 w-6" />
                <h3 className="text-ivory text-lg font-semibold">Modifier la publication</h3>
              </div>
              <button
                onClick={onClose}
                className="text-ivory/50 hover:bg-gold/10 hover:text-ivory rounded-lg p-1 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[calc(90vh-140px)] space-y-6 overflow-y-auto p-4">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Schedule Date/Time */}
              <div className="space-y-3">
                <label className="text-ivory flex items-center gap-2 text-sm font-medium">
                  <Calendar className="text-gold h-4 w-4" />
                  Date et heure de publication
                </label>

                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  min={formatDateTimeLocal(new Date())}
                  className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-4 py-3 focus:outline-none"
                />

                <p className="text-ivory/50 text-xs">
                  {scheduledDate
                    ? `Programmé pour le ${new Date(scheduledDate).toLocaleString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'Laissez vide pour convertir en brouillon'}
                </p>

                {/* Suggested Time Slots */}
                {post && (
                  <SuggestedTimeSlots
                    platform={post.platform}
                    articleDate={articleDate}
                    selectedDate={scheduledDate ? new Date(scheduledDate) : null}
                    onSelect={handleQuickTime}
                  />
                )}
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-ivory text-sm font-medium">Contenu</label>
                  <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-ivory/50'}`}>
                    {charCount} / {currentMax}
                  </span>
                </div>

                <textarea
                  value={content}
                  onChange={e => handleContentChange(e.target.value)}
                  rows={8}
                  className={`
                    bg-night/50 text-ivory w-full resize-none rounded-lg border px-4 py-3 text-sm focus:outline-none
                    ${isOverLimit ? 'border-red-500/50 focus:border-red-500' : 'border-gold/20 focus:border-gold'}
                  `}
                  placeholder="Contenu de la publication..."
                />

                {isOverLimit && (
                  <p className="text-xs text-red-400">
                    Le contenu dépasse la limite de {currentMax} caractères pour{' '}
                    {post.platform.toLowerCase()}.
                  </p>
                )}
              </div>

              {/* Hashtags (read-only for now) */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="space-y-2">
                  <label className="text-ivory text-sm font-medium">Hashtags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {post.hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gold/10 text-gold rounded-full px-2.5 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-gold/20 flex items-center justify-end gap-3 border-t p-4">
              <button
                onClick={onClose}
                className="border-gold/20 text-ivory/70 hover:border-gold/40 hover:text-ivory rounded-lg border px-4 py-2 text-sm transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isOverLimit}
                className="bg-gold/20 text-gold hover:bg-gold/30 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
