/**
 * Types et constantes pour la configuration des alertes et objectifs.
 *
 * Centralisés dans @kairn/admin pour réutilisation multi-tenant.
 */

// ────────────────────────────────────────────────────────
// Alert types
// ────────────────────────────────────────────────────────

/** Type d'alerte */
export type AlertType = 'threshold' | 'anomaly' | 'trend';

/** Métrique surveillée par une alerte */
export type AlertMetric =
  | 'visits'
  | 'sessions'
  | 'conversions'
  | 'conversion_rate'
  | 'avg_time'
  | 'bounce_rate';

/** Condition de déclenchement */
export type AlertCondition = 'greater_than' | 'less_than' | 'equals' | 'change_percent';

/** Fenêtre de temps */
export type AlertTimeWindow = 'hour' | 'day' | 'week' | 'month';

/** Canal de notification */
export type AlertChannel = 'email' | 'webhook';

/** Alerte configurée */
export interface Alert {
  id: string;
  name: string;
  description?: string;
  type: AlertType;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  timeWindow: AlertTimeWindow;
  channels: AlertChannel[];
  emailRecipients: string[];
  webhookUrl?: string;
  enabled: boolean;
  lastTriggered?: string;
  lastValue?: number;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Historique d'un déclenchement d'alerte */
export interface AlertHistory {
  id: string;
  alertId: string;
  alertName: string;
  triggeredAt: string;
  metric: string;
  condition: string;
  threshold: number;
  actualValue: number;
  message: string;
  notificationsSent: Array<{
    channel: string;
    success: boolean;
    error?: string;
  }>;
}

// ────────────────────────────────────────────────────────
// Goal types
// ────────────────────────────────────────────────────────

/** Type d'objectif */
export type GoalType = 'destination' | 'event' | 'duration' | 'pages_per_session';

/** Comparaison pour les objectifs de durée/pages */
export type GoalComparison = 'greater_than' | 'less_than';

/** Objectif configuré */
export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  destinationUrl?: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  durationSeconds?: number;
  comparison?: GoalComparison;
  pagesCount?: number;
  value?: number;
  enabled: boolean;
  createdAt: string;
}

/** Résumé des performances d'un objectif */
export interface GoalSummary {
  goal: Goal;
  completions: number;
  completionRate: number;
  totalValue: number;
  uniqueSessions: number;
}

// ────────────────────────────────────────────────────────
// Labels et constantes d'affichage
// ────────────────────────────────────────────────────────

/** Labels des métriques d'alerte */
export const METRIC_LABELS: Record<AlertMetric, string> = {
  visits: 'Visites',
  sessions: 'Sessions',
  conversions: 'Conversions',
  conversion_rate: 'Taux de conversion',
  avg_time: 'Temps moyen',
  bounce_rate: 'Taux de rebond',
};

/** Labels des conditions d'alerte */
export const CONDITION_LABELS: Record<AlertCondition, string> = {
  greater_than: 'Supérieur à',
  less_than: 'Inférieur à',
  equals: 'Égal à',
  change_percent: 'Variation de',
};

/** Labels des fenêtres de temps */
export const TIME_WINDOW_LABELS: Record<AlertTimeWindow, string> = {
  hour: 'Dernière heure',
  day: 'Dernier jour',
  week: 'Dernière semaine',
  month: 'Dernier mois',
};

/** Labels des types d'alerte */
export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  threshold: 'Seuil',
  anomaly: 'Anomalie',
  trend: 'Tendance',
};

/** Labels des types d'objectif */
export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  destination: 'Page de destination',
  event: 'Événement',
  duration: 'Durée de session',
  pages_per_session: 'Pages par session',
};

/** Descriptions des types d'objectif */
export const GOAL_TYPE_DESCRIPTIONS: Record<GoalType, string> = {
  destination: 'Déclenché quand un visiteur atteint une page spécifique',
  event: 'Déclenché par une action spécifique (clic, formulaire, etc.)',
  duration: 'Basé sur le temps passé sur le site',
  pages_per_session: 'Basé sur le nombre de pages visitées',
};

/** Labels des comparaisons d'objectif */
export const COMPARISON_LABELS: Record<GoalComparison, string> = {
  greater_than: 'Supérieur à',
  less_than: 'Inférieur à',
};

// ────────────────────────────────────────────────────────
// Templates
// ────────────────────────────────────────────────────────

/** Modèle prédéfini d'alerte pour configuration rapide */
export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  preset: Partial<
    Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount' | 'lastTriggered' | 'lastValue'>
  >;
}

/** Modèles d'alertes prédéfinis */
export const ALERT_TEMPLATES: AlertTemplate[] = [
  {
    id: 'traffic-drop',
    name: 'Chute de trafic',
    description: 'Alerte si le trafic chute de plus de 30%',
    icon: 'trending-down',
    preset: {
      type: 'threshold',
      metric: 'visits',
      condition: 'change_percent',
      threshold: -30,
      timeWindow: 'day',
      channels: ['email'],
      enabled: true,
    },
  },
  {
    id: 'high-bounce',
    name: 'Taux de rebond élevé',
    description: 'Alerte si le taux de rebond dépasse 70%',
    icon: 'log-out',
    preset: {
      type: 'threshold',
      metric: 'bounce_rate',
      condition: 'greater_than',
      threshold: 70,
      timeWindow: 'day',
      channels: ['email'],
      enabled: true,
    },
  },
  {
    id: 'conversion-drop',
    name: 'Baisse des conversions',
    description: 'Alerte si les conversions chutent de plus de 20%',
    icon: 'alert-triangle',
    preset: {
      type: 'threshold',
      metric: 'conversions',
      condition: 'change_percent',
      threshold: -20,
      timeWindow: 'day',
      channels: ['email'],
      enabled: true,
    },
  },
  {
    id: 'traffic-spike',
    name: 'Pic de trafic',
    description: 'Alerte si le trafic augmente de plus de 100%',
    icon: 'trending-up',
    preset: {
      type: 'threshold',
      metric: 'visits',
      condition: 'change_percent',
      threshold: 100,
      timeWindow: 'hour',
      channels: ['email'],
      enabled: true,
    },
  },
  {
    id: 'goal-achieved',
    name: 'Objectif quotidien',
    description: 'Alerte quand 1000 visites sont atteintes',
    icon: 'target',
    preset: {
      type: 'threshold',
      metric: 'visits',
      condition: 'greater_than',
      threshold: 1000,
      timeWindow: 'day',
      channels: ['email'],
      enabled: true,
    },
  },
  {
    id: 'slow-sessions',
    name: 'Sessions courtes',
    description: 'Alerte si le temps moyen chute sous 60 secondes',
    icon: 'clock',
    preset: {
      type: 'threshold',
      metric: 'avg_time',
      condition: 'less_than',
      threshold: 60,
      timeWindow: 'day',
      channels: ['email'],
      enabled: true,
    },
  },
];

/** Modèle prédéfini d'objectif pour configuration rapide */
export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  preset: Partial<Omit<Goal, 'id' | 'createdAt'>>;
}

/** Modèles d'objectifs prédéfinis */
export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'contact-form',
    name: 'Formulaire de contact',
    description: 'Suivi des soumissions de formulaire',
    icon: 'mail',
    preset: {
      type: 'event',
      eventCategory: 'contact',
      eventAction: 'submit',
      value: 10,
      enabled: true,
    },
  },
  {
    id: 'newsletter',
    name: 'Inscription newsletter',
    description: 'Suivi des inscriptions à la newsletter',
    icon: 'mail-plus',
    preset: {
      type: 'event',
      eventCategory: 'newsletter',
      eventAction: 'subscribe',
      value: 5,
      enabled: true,
    },
  },
  {
    id: 'thank-you-page',
    name: 'Page de confirmation',
    description: "Visite d'une page de remerciement",
    icon: 'check-circle',
    preset: {
      type: 'destination',
      destinationUrl: '/merci',
      value: 20,
      enabled: true,
    },
  },
  {
    id: 'engaged-visitor',
    name: 'Visiteur engagé',
    description: 'Session de plus de 3 minutes',
    icon: 'clock',
    preset: {
      type: 'duration',
      durationSeconds: 180,
      comparison: 'greater_than',
      value: 5,
      enabled: true,
    },
  },
  {
    id: 'deep-visit',
    name: 'Visite approfondie',
    description: 'Plus de 5 pages visitées par session',
    icon: 'layers',
    preset: {
      type: 'pages_per_session',
      pagesCount: 5,
      comparison: 'greater_than',
      value: 8,
      enabled: true,
    },
  },
  {
    id: 'booking',
    name: 'Prise de rendez-vous',
    description: 'Réservation confirmée',
    icon: 'calendar-check',
    preset: {
      type: 'event',
      eventCategory: 'booking',
      eventAction: 'confirm',
      value: 50,
      enabled: true,
    },
  },
];

// ────────────────────────────────────────────────────────
// Toast handler (injection de dépendance)
// ────────────────────────────────────────────────────────

/** Interface pour l'injection du système de notifications toast */
export interface ToastHandler {
  addToast: (toast: { title: string; description?: string; variant: 'success' | 'error' }) => void;
}

// ────────────────────────────────────────────────────────
// Social types (pour SocialNetworksTab)
// ────────────────────────────────────────────────────────

/** Compte de réseau social connecté */
export interface SocialAccount {
  id: string;
  platform: string;
  accountId?: string;
  accountName: string;
  tokenExpiry?: string | null;
  scope?: string[];
  isActive: boolean;
  lastUsed?: string | null;
  createdAt?: string;
  updatedAt?: string;
  metadata?: {
    pageId?: string;
    pageName?: string;
    igUsername?: string;
    personId?: string;
    avatarUrl?: string;
  };
}

/** Utilisateur administrateur */
export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  createdAt: string;
  updatedAt: string;
}
