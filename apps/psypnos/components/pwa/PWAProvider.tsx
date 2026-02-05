'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

import {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
  isPushSupported,
  getNotificationPermission,
} from '@/lib/push-notifications';
import {
  hasConsent as hasPrefillConsent,
  setConsent as setPrefillConsent,
  trackPageVisit,
  getPrefillData,
  type PrefillData,
} from '@/lib/smart-prefill';

export interface PWAContextValue {
  // Service Worker
  isServiceWorkerReady: boolean;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;

  // Push Notifications
  isPushSupported: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  isSubscribedToPush: boolean;
  subscribeToPush: (topics?: string[]) => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;

  // Smart Prefill
  hasPrefillConsent: boolean;
  setPrefillConsent: (granted: boolean) => void;
  prefillData: PrefillData | null;

  // Online status
  isOnline: boolean;
}

const PWAContext = createContext<PWAContextValue | null>(null);

export function usePWA(): PWAContextValue {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

export interface PWAProviderProps {
  children: ReactNode;
  enableServiceWorker?: boolean;
  enablePushNotifications?: boolean;
  enableSmartPrefill?: boolean;
}

export function PWAProvider({
  children,
  enableServiceWorker = true,
  enablePushNotifications = true,
  enableSmartPrefill = true,
}: PWAProviderProps) {
  // Service Worker state
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  // Push Notifications state
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(
    'unsupported'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Smart Prefill state
  const [prefillConsent, setPrefillConsentState] = useState(false);
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null);

  // Online status
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Initialize Service Worker
  useEffect(() => {
    if (!enableServiceWorker) return;

    const init = async () => {
      const registration = await registerServiceWorker();
      if (registration) {
        setServiceWorkerRegistration(registration);
        setIsServiceWorkerReady(true);
      }
    };

    init();
  }, [enableServiceWorker]);

  // Initialize Push Notifications
  useEffect(() => {
    if (!enablePushNotifications) return;

    const init = async () => {
      const permission = getNotificationPermission();
      setPushPermission(permission);

      if (permission !== 'unsupported') {
        const subscribed = await isSubscribedToPush();
        setIsSubscribed(subscribed);
      }
    };

    init();
  }, [enablePushNotifications]);

  // Initialize Smart Prefill
  useEffect(() => {
    if (!enableSmartPrefill) return;

    const consent = hasPrefillConsent();
    setPrefillConsentState(consent);

    if (consent) {
      // Track page visit
      trackPageVisit(window.location.pathname, document.title);
      // Get prefill data
      const data = getPrefillData();
      setPrefillData(data);
    }
  }, [enableSmartPrefill]);

  // Track page changes for prefill
  useEffect(() => {
    if (!enableSmartPrefill || !prefillConsent) return;

    const handleRouteChange = () => {
      trackPageVisit(window.location.pathname, document.title);
      const data = getPrefillData();
      setPrefillData(data);
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [enableSmartPrefill, prefillConsent]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Push subscription handler
  const handleSubscribe = useCallback(async (topics: string[] = ['all']): Promise<boolean> => {
    const sessionId =
      sessionStorage.getItem('psypnos_session_id') ||
      `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await subscribeToPush(topics, sessionId);

    if (result.success) {
      setIsSubscribed(true);
      setPushPermission('granted');
    }

    return result.success;
  }, []);

  // Push unsubscription handler
  const handleUnsubscribe = useCallback(async (): Promise<boolean> => {
    const result = await unsubscribeFromPush();
    if (result) {
      setIsSubscribed(false);
    }
    return result;
  }, []);

  // Prefill consent handler
  const handleSetPrefillConsent = useCallback((granted: boolean) => {
    setPrefillConsent(granted);
    setPrefillConsentState(granted);

    if (granted) {
      trackPageVisit(window.location.pathname, document.title);
      const data = getPrefillData();
      setPrefillData(data);
    } else {
      setPrefillData(null);
    }
  }, []);

  const value: PWAContextValue = {
    // Service Worker
    isServiceWorkerReady,
    serviceWorkerRegistration,

    // Push Notifications
    isPushSupported: isPushSupported(),
    pushPermission,
    isSubscribedToPush: isSubscribed,
    subscribeToPush: handleSubscribe,
    unsubscribeFromPush: handleUnsubscribe,

    // Smart Prefill
    hasPrefillConsent: prefillConsent,
    setPrefillConsent: handleSetPrefillConsent,
    prefillData,

    // Online status
    isOnline,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export default PWAProvider;
