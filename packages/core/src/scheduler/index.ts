/**
 * Module Scheduler - Gestion des tâches planifiées avec QStash
 *
 * Ce module fournit :
 * - Un client QStash pour programmer des tâches
 * - La vérification de signature pour sécuriser les endpoints CRON
 * - Des helpers pour les cas d'usage courants
 */

// Client QStash
export {
  createQStashClient,
  getQStashClient,
  resetQStashClient,
  schedulePost,
  scheduleRecurring,
  publishDelayed,
  cancelMessage,
  deleteSchedule,
  listSchedules,
  getSchedule,
  pauseSchedule,
  resumeSchedule,
  type ScheduleConfig,
  type PublishConfig,
  type ScheduleResult,
  type PublishResult,
  type QStashClientConfig,
} from './qstash-client';

// Vérification de signature
export {
  verifyQStashSignature,
  verifyCronAuth,
  isValidCronRequest,
  verifyCronSecretSync,
  resetReceiver,
  type VerifyQStashConfig,
  type VerifyResult,
} from './verify-qstash';

/**
 * Configuration CRON par défaut pour les sites Kairn
 *
 * Ces configurations définissent les intervalles de scheduling
 * utilisés par le script setup-qstash-schedules.ts
 */
export const DEFAULT_CRON_SCHEDULES = {
  /** Publication des posts sociaux - toutes les 5 minutes */
  'social-publish': '*/5 * * * *',

  /** Récupération des analytics sociaux - toutes les 4 heures */
  'fetch-social-analytics': '0 */4 * * *',

  /** Rafraîchissement des tokens OAuth - toutes les heures */
  'refresh-tokens': '0 * * * *',

  /** Rapport quotidien - 8h00 chaque jour */
  'daily-report': '0 8 * * *',

  /** Rapport hebdomadaire - Lundi 9h00 */
  'weekly-report': '0 9 * * 1',

  /** Nettoyage unifié (données + jobs) - 3h00 chaque jour */
  cleanup: '0 3 * * *',

  /** Snapshot quotidien des comptes sociaux - 6h00 chaque jour */
  'snapshot-social-accounts': '0 6 * * *',

  /** Agrégation des analytics - toutes les heures à :30 */
  aggregate: '30 * * * *',

  /** Vérification des alertes - toutes les 15 minutes */
  'check-alerts': '*/15 * * * *',

  /** Traitement des rapports programmés - toutes les heures à :45 */
  'process-reports': '45 * * * *',

  /** Réconciliation QStash des posts planifiés - toutes les heures à :15 */
  'reconcile-qstash': '15 * * * *',

  /** Promotion automatique des séminaires - 6h00 chaque jour */
  'promote-seminars': '0 6 * * *',
} as const;

export type CronJobName = keyof typeof DEFAULT_CRON_SCHEDULES;

/**
 * Génère l'URL complète pour un endpoint CRON
 */
export function getCronEndpointUrl(baseUrl: string, jobName: CronJobName): string {
  // Nettoyer l'URL de base (enlever le trailing slash)
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/api/cron/${jobName}`;
}

/**
 * Crée toutes les configurations de schedule pour un site
 */
export function createScheduleConfigs(
  baseUrl: string,
  jobs?: CronJobName[]
): Array<{ name: CronJobName; destination: string; cron: string }> {
  const jobList = jobs || (Object.keys(DEFAULT_CRON_SCHEDULES) as CronJobName[]);

  return jobList.map(name => ({
    name,
    destination: getCronEndpointUrl(baseUrl, name),
    cron: DEFAULT_CRON_SCHEDULES[name],
  }));
}
