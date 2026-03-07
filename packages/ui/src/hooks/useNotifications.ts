'use client';

/**
 * Hook pour la gestion des notifications navigateur.
 *
 * Abstraction de l'API Notification du navigateur avec gestion
 * des permissions, badges d'application et dégradation gracieuse.
 *
 * @module hooks/useNotifications
 */

import { useState, useEffect, useCallback } from 'react';

/** Options pour envoyer une notification */
export interface SendNotificationOptions {
  /** Titre de la notification */
  title: string;
  /** Corps du message */
  body: string;
  /** URL de l'icône */
  icon?: string;
  /** URL du badge */
  badge?: string;
  /** Tag de regroupement */
  tag?: string;
  /** Données supplémentaires */
  data?: Record<string, unknown>;
}

/** Retour du hook useNotifications */
export interface UseNotificationsReturn {
  /** Indique si les notifications sont supportées */
  isSupported: boolean;
  /** Permission actuelle (granted, denied, default) */
  permission: NotificationPermission;
  /** Demande la permission à l'utilisateur */
  requestPermission: () => Promise<boolean>;
  /** Envoie une notification */
  sendNotification: (options: SendNotificationOptions) => Promise<Notification | null>;
  /** Met à jour le badge de l'application */
  sendBadgeUpdate: (count: number) => Promise<void>;
  /** Efface le badge de l'application */
  clearBadge: () => Promise<void>;
}

/**
 * Hook de gestion des notifications navigateur.
 *
 * Fournit une API simplifiée pour les notifications navigateur,
 * les badges d'application, et la gestion des permissions.
 *
 * @param defaultIcon - URL de l'icône par défaut
 * @param defaultBadge - URL du badge par défaut
 *
 * @example
 * ```tsx
 * const { isSupported, sendNotification, requestPermission } = useNotifications();
 *
 * if (isSupported) {
 *   await requestPermission();
 *   await sendNotification({ title: 'Hello', body: 'World' });
 * }
 * ```
 */
export function useNotifications(
  defaultIcon?: string,
  defaultBadge?: string
): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  /** Demande la permission pour les notifications */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  /** Envoie une notification navigateur */
  const sendNotification = useCallback(
    async (options: SendNotificationOptions): Promise<Notification | null> => {
      if (!isSupported) {
        return null;
      }

      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          return null;
        }
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon ?? defaultIcon,
          badge: options.badge ?? defaultBadge,
          tag: options.tag,
          data: options.data,
          requireInteraction: false,
          silent: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          const url = options.data?.url;
          if (typeof url === 'string') {
            window.location.href = url;
          }
        };

        return notification;
      } catch (error) {
        console.error('Error sending notification:', error);
        return null;
      }
    },
    [isSupported, permission, requestPermission, defaultIcon, defaultBadge]
  );

  /** Met à jour le badge de l'application */
  const sendBadgeUpdate = useCallback(async (count: number): Promise<void> => {
    if ('setAppBadge' in navigator) {
      try {
        await (navigator as unknown as { setAppBadge: (n: number) => Promise<void> }).setAppBadge(
          count
        );
      } catch (error) {
        console.error('Error setting badge:', error);
      }
    }
  }, []);

  /** Efface le badge de l'application */
  const clearBadge = useCallback(async (): Promise<void> => {
    if ('clearAppBadge' in navigator) {
      try {
        await (navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge();
      } catch (error) {
        console.error('Error clearing badge:', error);
      }
    }
  }, []);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    sendBadgeUpdate,
    clearBadge,
  };
}
