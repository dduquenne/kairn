/**
 * Client QStash pour la gestion des tâches planifiées
 *
 * Utilise Upstash QStash pour programmer des tâches CRON
 * sans les limitations de Vercel (40 CRON/jour/projet)
 */

import { Client } from '@upstash/qstash';

// Types pour le scheduling
export interface ScheduleConfig {
  /** URL de l'endpoint à appeler */
  destination: string;
  /** Expression CRON (ex: "0/5 * * * *" pour toutes les 5 min) */
  cron: string;
  /** Nom unique du schedule pour identification */
  scheduleId?: string;
  /** Headers supplémentaires à envoyer */
  headers?: Record<string, string>;
  /** Corps de la requête (sera JSON.stringify si objet) */
  body?: string | Record<string, unknown>;
  /** Nombre de retries en cas d'échec (défaut: 3) */
  retries?: number;
  /** Callback URL pour les notifications de succès/échec */
  callback?: string;
  /** URL pour les notifications d'échec uniquement */
  failureCallback?: string;
}

export interface PublishConfig {
  /** URL de l'endpoint à appeler */
  destination: string;
  /** Délai avant exécution en secondes */
  delay?: number;
  /** Date/heure d'exécution (alternative au delay) */
  notBefore?: Date | number;
  /** Headers supplémentaires */
  headers?: Record<string, string>;
  /** Corps de la requête */
  body?: string | Record<string, unknown>;
  /** Nombre de retries en cas d'échec */
  retries?: number;
  /** Callback URL pour les notifications */
  callback?: string;
  /** URL pour les notifications d'échec uniquement */
  failureCallback?: string;
  /** ID de déduplication (évite les doublons) */
  deduplicationId?: string;
}

export interface ScheduleResult {
  scheduleId: string;
  cron: string;
  destination: string;
}

export interface PublishResult {
  messageId: string;
  destination: string;
  scheduledAt?: Date;
}

export interface QStashClientConfig {
  token?: string;
  baseUrl?: string;
}

/**
 * Crée et retourne une instance du client QStash
 */
export function createQStashClient(config?: QStashClientConfig): Client {
  const token = config?.token || process.env.QSTASH_TOKEN;

  if (!token) {
    throw new Error(
      'QSTASH_TOKEN is required. Set it in environment variables or pass it to createQStashClient.'
    );
  }

  return new Client({
    token,
    ...(config?.baseUrl && { baseUrl: config.baseUrl }),
  });
}

// Singleton pour le client QStash (lazy initialization)
let qstashClient: Client | null = null;

/**
 * Obtient l'instance singleton du client QStash
 */
export function getQStashClient(): Client {
  if (!qstashClient) {
    qstashClient = createQStashClient();
  }
  return qstashClient;
}

/**
 * Réinitialise le client QStash (utile pour les tests)
 */
export function resetQStashClient(): void {
  qstashClient = null;
}

/**
 * Programme une publication de post social à une date précise
 */
export async function schedulePost(
  postId: string,
  scheduledAt: Date,
  baseUrl: string
): Promise<PublishResult> {
  const client = getQStashClient();

  const destination = `${baseUrl}/api/social/posts/${postId}/publish`;
  const notBefore = Math.floor(scheduledAt.getTime() / 1000);

  const result = await client.publishJSON({
    url: destination,
    notBefore,
    retries: 3,
    body: { postId, triggeredAt: new Date().toISOString() },
  });

  return {
    messageId: result.messageId,
    destination,
    scheduledAt,
  };
}

/**
 * Programme une tâche récurrente via CRON
 */
export async function scheduleRecurring(config: ScheduleConfig): Promise<ScheduleResult> {
  const client = getQStashClient();

  const body =
    typeof config.body === 'string'
      ? config.body
      : config.body
        ? JSON.stringify(config.body)
        : undefined;

  const result = await client.schedules.create({
    destination: config.destination,
    cron: config.cron,
    ...(body && { body }),
    ...(config.headers && { headers: config.headers }),
    ...(config.retries !== undefined && { retries: config.retries }),
    ...(config.callback && { callback: config.callback }),
    ...(config.failureCallback && { failureCallback: config.failureCallback }),
  });

  return {
    scheduleId: result.scheduleId,
    cron: config.cron,
    destination: config.destination,
  };
}

/**
 * Programme une tâche unique à exécuter plus tard
 */
export async function publishDelayed(config: PublishConfig): Promise<PublishResult> {
  const client = getQStashClient();

  const body =
    typeof config.body === 'string'
      ? config.body
      : config.body
        ? JSON.stringify(config.body)
        : undefined;

  // Calculer notBefore en timestamp Unix
  let notBefore: number | undefined;
  if (config.notBefore) {
    notBefore =
      config.notBefore instanceof Date
        ? Math.floor(config.notBefore.getTime() / 1000)
        : config.notBefore;
  } else if (config.delay) {
    notBefore = Math.floor(Date.now() / 1000) + config.delay;
  }

  const result = await client.publishJSON({
    url: config.destination,
    ...(notBefore && { notBefore }),
    ...(body && { body: JSON.parse(body) }),
    ...(config.headers && { headers: config.headers }),
    ...(config.retries !== undefined && { retries: config.retries }),
    ...(config.callback && { callback: config.callback }),
    ...(config.failureCallback && { failureCallback: config.failureCallback }),
    ...(config.deduplicationId && { deduplicationId: config.deduplicationId }),
  });

  return {
    messageId: result.messageId,
    destination: config.destination,
    scheduledAt: notBefore ? new Date(notBefore * 1000) : undefined,
  };
}

/**
 * Annule un message programmé
 */
export async function cancelMessage(messageId: string): Promise<void> {
  const client = getQStashClient();
  await client.messages.delete(messageId);
}

/**
 * Supprime un schedule récurrent
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  const client = getQStashClient();
  await client.schedules.delete(scheduleId);
}

/**
 * Liste tous les schedules actifs
 */
export async function listSchedules(): Promise<
  Array<{
    scheduleId: string;
    cron: string;
    destination: string;
    createdAt: number;
  }>
> {
  const client = getQStashClient();
  const schedules = await client.schedules.list();

  return schedules.map(s => ({
    scheduleId: s.scheduleId,
    cron: s.cron,
    destination: s.destination,
    createdAt: s.createdAt,
  }));
}

/**
 * Récupère les détails d'un schedule
 */
export async function getSchedule(scheduleId: string): Promise<{
  scheduleId: string;
  cron: string;
  destination: string;
  createdAt: number;
  isPaused: boolean;
} | null> {
  const client = getQStashClient();

  try {
    const schedule = await client.schedules.get(scheduleId);
    return {
      scheduleId: schedule.scheduleId,
      cron: schedule.cron,
      destination: schedule.destination,
      createdAt: schedule.createdAt,
      isPaused: schedule.isPaused,
    };
  } catch {
    return null;
  }
}

/**
 * Met en pause un schedule
 */
export async function pauseSchedule(scheduleId: string): Promise<void> {
  const client = getQStashClient();
  await client.schedules.pause({ schedule: scheduleId });
}

/**
 * Reprend un schedule en pause
 */
export async function resumeSchedule(scheduleId: string): Promise<void> {
  const client = getQStashClient();
  await client.schedules.resume({ schedule: scheduleId });
}
