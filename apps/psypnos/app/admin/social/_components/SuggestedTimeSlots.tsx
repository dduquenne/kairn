'use client';

import { motion } from 'framer-motion';
import { Clock, Sparkles, Star, Trophy } from 'lucide-react';
import { useMemo } from 'react';

import { computeSuggestedTimes } from '@/lib/social/suggested-times';
import type { SocialPlatform } from '@/lib/social/types';

// ===========================================
// Types
// ===========================================

interface SuggestedTimeSlotsProps {
  platform: SocialPlatform;
  articleDate?: string | null;
  selectedDate?: Date | null;
  onSelect: (date: Date) => void;
  maxSuggestions?: number;
}

// ===========================================
// Component
// ===========================================

/**
 * Affiche les creneaux de publication suggeres pour une plateforme,
 * en mettant en avant le creneau ideal et les creneaux recommandes.
 */
export function SuggestedTimeSlots({
  platform,
  articleDate,
  selectedDate,
  onSelect,
  maxSuggestions = 8,
}: SuggestedTimeSlotsProps) {
  const suggestions = useMemo(
    () => computeSuggestedTimes(platform, articleDate, maxSuggestions),
    [platform, articleDate, maxSuggestions]
  );

  const idealSlot = suggestions.find(s => s.isIdeal);
  const primarySlots = suggestions.filter(s => s.isPrimary && !s.isIdeal);
  const secondarySlots = suggestions.filter(s => !s.isPrimary);

  const isArticleDateInFuture = articleDate ? new Date(articleDate) > new Date() : false;

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-ivory/50 flex items-center gap-1.5 text-xs">
          <Sparkles className="h-3 w-3" />
          Creneaux recommandes
        </p>
        {articleDate && isArticleDateInFuture && (
          <p className="text-ivory/40 text-xs">
            Ref. article :{' '}
            {new Date(articleDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </p>
        )}
      </div>

      {/* Ideal slot — highlighted card */}
      {idealSlot && (
        <motion.button
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          onClick={() => onSelect(idealSlot.date)}
          className={`group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:scale-[1.01] ${
            selectedDate?.getTime() === idealSlot.date.getTime()
              ? 'border-gold bg-gold/15 ring-gold/40 ring-2'
              : 'border-gold/40 bg-gold/10 hover:border-gold/60 hover:bg-gold/15'
          }`}
        >
          <div className="bg-gold/20 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
            <Trophy className="text-gold h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-ivory text-sm font-medium">{idealSlot.label}</p>
            <p className="text-ivory/50 text-xs">
              {isArticleDateInFuture
                ? "Pic d'audience proche de la publication"
                : "Prochain pic d'audience"}
            </p>
          </div>
          <span className="bg-gold/20 text-gold flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium">
            Ideal
          </span>
        </motion.button>
      )}

      {/* Primary slots */}
      {primarySlots.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-ivory/40 text-xs uppercase tracking-wider">Recommandes</p>
          <div className="flex flex-wrap gap-2">
            {primarySlots.map((slot, idx) => (
              <motion.button
                key={slot.date.getTime()}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.03 }}
                onClick={() => onSelect(slot.date)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all hover:scale-105 ${
                  selectedDate?.getTime() === slot.date.getTime()
                    ? 'bg-gold/25 text-gold ring-gold/40 ring-2'
                    : 'bg-gold/15 text-gold hover:bg-gold/25'
                }`}
              >
                <Star className="h-3 w-3" />
                {slot.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Secondary slots */}
      {secondarySlots.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-ivory/40 text-xs uppercase tracking-wider">Autres creneaux</p>
          <div className="flex flex-wrap gap-2">
            {secondarySlots.map((slot, idx) => (
              <motion.button
                key={slot.date.getTime()}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.03 }}
                onClick={() => onSelect(slot.date)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all hover:scale-105 ${
                  selectedDate?.getTime() === slot.date.getTime()
                    ? 'bg-ivory/20 text-ivory ring-gold/40 ring-2'
                    : 'bg-ivory/10 text-ivory/60 hover:bg-ivory/20 hover:text-ivory/80'
                }`}
              >
                <Clock className="h-3 w-3" />
                {slot.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
