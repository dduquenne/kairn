/**
 * Définitions centralisées des tons disponibles
 * Utilisé dans ArticleGeneratorModal et ArticleGenerator
 */

export type ToneOption =
  | "informatif"
  | "pédagogique"
  | "inspirant"
  | "narratif"
  | "conversationnel"
  | "professionnel"
  | "provocateur"
  | "humoristique"
  | "poétique"
  | "introspectif"
  | "engagé"
  | "scientifique"
  | "pragmatique"
  | "analytique"
  | "apaisant";

export const AVAILABLE_TONES: { value: ToneOption; label: string; category: string }[] = [
  // Informatif & Pédagogique
  { value: "informatif", label: "Informatif", category: "Information" },
  { value: "pédagogique", label: "Pédagogique", category: "Information" },
  { value: "scientifique", label: "Scientifique", category: "Information" },

  // Créatif & Émotionnel
  { value: "inspirant", label: "Inspirant", category: "Créatif & Émotionnel" },
  { value: "narratif", label: "Narratif", category: "Créatif & Émotionnel" },
  { value: "poétique", label: "Poétique", category: "Créatif & Émotionnel" },
  { value: "humoristique", label: "Humoristique", category: "Créatif & Émotionnel" },

  // Approche & Réflexion
  { value: "introspectif", label: "Introspectif", category: "Approche & Réflexion" },
  { value: "analytique", label: "Analytique", category: "Approche & Réflexion" },
  { value: "pragmatique", label: "Pragmatique", category: "Approche & Réflexion" },
  { value: "apaisant", label: "Apaisant", category: "Approche & Réflexion" },

  // Ton & Engagement
  { value: "conversationnel", label: "Conversationnel", category: "Ton & Engagement" },
  { value: "professionnel", label: "Professionnel", category: "Ton & Engagement" },
  { value: "provocateur", label: "Provocateur", category: "Ton & Engagement" },
  { value: "engagé", label: "Engagé", category: "Ton & Engagement" },
];
