import type { SocialPlatform, OptimalTimeSlot } from './types';
import { OPTIMAL_POSTING_TIMES } from './types';

// ===========================================
// Types
// ===========================================

export interface SuggestedTime {
  date: Date;
  label: string;
  isPrimary: boolean;
  isIdeal: boolean;
}

// ===========================================
// Helpers
// ===========================================

/**
 * Formate une date en label lisible (ex: "Lun. 9 mars a 9h00").
 * Affiche "Aujourd'hui" / "Demain" si applicable.
 */
export function formatSlotLabel(date: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const time = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (date.toDateString() === now.toDateString()) return `Aujourd'hui a ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Demain a ${time}`;

  const day = date.toLocaleDateString('fr-FR', { weekday: 'short' });
  const dayNum = date.getDate();
  const month = date.toLocaleDateString('fr-FR', { month: 'short' });

  return `${day.charAt(0).toUpperCase() + day.slice(1)} ${dayNum} ${month} a ${time}`;
}

/**
 * Calcule les creneaux optimaux a partir d'une date de reference.
 * Utilise la date de l'article si fournie, sinon la date du jour.
 * Les creneaux passes (anterieurs a maintenant) sont toujours filtres.
 */
export function computeSuggestedTimes(
  platform: SocialPlatform,
  articleDate?: string | null,
  maxCount: number = 8
): SuggestedTime[] {
  const referenceDate = articleDate ? new Date(articleDate) : new Date();
  const now = new Date();

  // Si la date article est passee, utiliser maintenant comme plancher
  const effectiveStart = referenceDate > now ? referenceDate : now;

  const slots: OptimalTimeSlot[] = OPTIMAL_POSTING_TIMES[platform] || [];
  const suggestions: SuggestedTime[] = [];

  // Generer les 14 prochains jours de creneaux a partir de la date de reference
  for (let dayOffset = 0; dayOffset < 14 && suggestions.length < maxCount; dayOffset++) {
    const date = new Date(effectiveStart);
    date.setDate(effectiveStart.getDate() + dayOffset);
    const dayOfWeek = date.getDay();

    for (const slot of slots) {
      if (slot.dayOfWeek === dayOfWeek) {
        const slotDate = new Date(date);
        slotDate.setHours(slot.hour, 0, 0, 0);

        // Ne pas inclure les creneaux passes
        if (slotDate <= now) continue;

        suggestions.push({
          date: slotDate,
          label: formatSlotLabel(slotDate),
          isPrimary: slot.priority === 'primary',
          isIdeal: false, // sera marque apres le tri
        });
      }
    }
  }

  // Trier par date
  suggestions.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Marquer le premier creneau primary comme "ideal"
  const firstPrimary = suggestions.find(s => s.isPrimary);
  if (firstPrimary) {
    firstPrimary.isIdeal = true;
  }

  return suggestions.slice(0, maxCount);
}
