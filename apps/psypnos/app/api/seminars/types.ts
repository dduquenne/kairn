/**
 * Seminar type constants and base types for the Psypnos site.
 */
export const SEMINAR_TYPES = [
  { value: 'respiration-holotropique', label: 'Respiration holotropique' },
  { value: 'breathwork', label: 'Breathwork' },
  { value: 'rebirth', label: 'Rebirth' },
  { value: 'meditation', label: 'Méditation' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'developpement-personnel', label: 'Développement personnel' },
  { value: 'autre', label: 'Autre' },
] as const;

export type SeminarType = (typeof SEMINAR_TYPES)[number]['value'];
