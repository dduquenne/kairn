/**
 * Tone Definitions
 *
 * Centralized definitions of available writing tones for blog content generation.
 * Used in article generation modals and AI content workflows.
 */

/**
 * Union type des tons d'écriture disponibles
 */
export type ToneOption =
  | 'informatif'
  | 'pédagogique'
  | 'inspirant'
  | 'narratif'
  | 'conversationnel'
  | 'professionnel'
  | 'provocateur'
  | 'humoristique'
  | 'poétique'
  | 'introspectif'
  | 'engagé'
  | 'scientifique'
  | 'pragmatique'
  | 'analytique'
  | 'apaisant';

/**
 * Structure d'une définition de ton
 */
export interface ToneDefinition {
  /** Identifiant du ton */
  value: ToneOption;
  /** Libellé affiché */
  label: string;
  /** Catégorie de regroupement */
  category: string;
}

/**
 * Liste des tons disponibles, regroupés par catégorie.
 *
 * Catégories :
 * - Information : tons factuels et éducatifs
 * - Créatif & Émotionnel : tons expressifs et artistiques
 * - Approche & Réflexion : tons introspectifs et analytiques
 * - Ton & Engagement : tons orientés communication
 */
export const AVAILABLE_TONES: ToneDefinition[] = [
  // Informatif & Pédagogique
  { value: 'informatif', label: 'Informatif', category: 'Information' },
  { value: 'pédagogique', label: 'Pédagogique', category: 'Information' },
  { value: 'scientifique', label: 'Scientifique', category: 'Information' },

  // Créatif & Émotionnel
  {
    value: 'inspirant',
    label: 'Inspirant',
    category: 'Créatif & Émotionnel',
  },
  {
    value: 'narratif',
    label: 'Narratif',
    category: 'Créatif & Émotionnel',
  },
  {
    value: 'poétique',
    label: 'Poétique',
    category: 'Créatif & Émotionnel',
  },
  {
    value: 'humoristique',
    label: 'Humoristique',
    category: 'Créatif & Émotionnel',
  },

  // Approche & Réflexion
  {
    value: 'introspectif',
    label: 'Introspectif',
    category: 'Approche & Réflexion',
  },
  {
    value: 'analytique',
    label: 'Analytique',
    category: 'Approche & Réflexion',
  },
  {
    value: 'pragmatique',
    label: 'Pragmatique',
    category: 'Approche & Réflexion',
  },
  {
    value: 'apaisant',
    label: 'Apaisant',
    category: 'Approche & Réflexion',
  },

  // Ton & Engagement
  {
    value: 'conversationnel',
    label: 'Conversationnel',
    category: 'Ton & Engagement',
  },
  {
    value: 'professionnel',
    label: 'Professionnel',
    category: 'Ton & Engagement',
  },
  {
    value: 'provocateur',
    label: 'Provocateur',
    category: 'Ton & Engagement',
  },
  { value: 'engagé', label: 'Engagé', category: 'Ton & Engagement' },
];

/**
 * Catégories de tons pour l'affichage groupé
 */
export const TONE_CATEGORIES = [
  'Information',
  'Créatif & Émotionnel',
  'Approche & Réflexion',
  'Ton & Engagement',
] as const;

/**
 * Type des catégories de tons
 */
export type ToneCategory = (typeof TONE_CATEGORIES)[number];
