/**
 * Configuration Components
 *
 * Composants partagés pour la configuration admin (alertes, objectifs,
 * réseaux sociaux, utilisateurs).
 */

// Types et constantes
// Note: Goal is re-exported as ConfigGoal to avoid collision with analytics Goal
export type {
  AlertType,
  AlertMetric,
  AlertCondition,
  AlertTimeWindow,
  AlertChannel,
  Alert,
  AlertHistory,
  GoalType,
  GoalComparison,
  Goal as ConfigGoal,
  GoalSummary,
  AlertTemplate,
  GoalTemplate,
  ToastHandler,
  SocialAccount,
  AdminUser,
} from './types';
export {
  METRIC_LABELS,
  CONDITION_LABELS,
  TIME_WINDOW_LABELS,
  ALERT_TYPE_LABELS,
  GOAL_TYPE_LABELS,
  GOAL_TYPE_DESCRIPTIONS,
  COMPARISON_LABELS,
  ALERT_TEMPLATES,
  GOAL_TEMPLATES,
} from './types';

// Composants de navigation
export { ConfigurationTabNavigation } from './ConfigurationTabNavigation';
export type { ConfigTabId, ConfigurationTabNavigationProps } from './ConfigurationTabNavigation';

// Icône de plateforme sociale
export { SocialPlatformIcon } from './SocialPlatformIcon';
export type { SocialPlatformIconProps } from './SocialPlatformIcon';

// Modale de suppression
export { DeleteConfirmationModal } from './DeleteConfirmationModal';
export type { DeleteConfirmationModalProps } from './DeleteConfirmationModal';

// Formulaires modaux
export { AlertFormModal } from './AlertFormModal';
export type { AlertFormModalProps } from './AlertFormModal';
export { GoalFormModal } from './GoalFormModal';
export type { GoalFormModalProps } from './GoalFormModal';

// Onglets de configuration
export { AlertsTab } from './AlertsTab';
export type { AlertsTabProps } from './AlertsTab';
export { GoalsTab } from './GoalsTab';
export type { GoalsTabProps } from './GoalsTab';
export { SocialNetworksTab } from './SocialNetworksTab';
export type { SocialNetworksTabProps } from './SocialNetworksTab';
export { UsersTab } from './UsersTab';
export type { UsersTabProps } from './UsersTab';

// Panneaux de configuration (avec bouton retour)
export { AlertsConfigurationPanel } from './AlertsConfigurationPanel';
export type { AlertsConfigurationPanelProps } from './AlertsConfigurationPanel';
export { GoalsConfigurationPanel } from './GoalsConfigurationPanel';
export type { GoalsConfigurationPanelProps } from './GoalsConfigurationPanel';
