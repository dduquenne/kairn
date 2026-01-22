// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Tracker principal pour les analytics
 *
 * Ce module fournit une classe singleton qui gère tout le tracking:
 * - Vues de pages
 * - Scroll depth
 * - Temps sur page
 * - Sections visibles
 * - Conversions
 * - Événements personnalisés
 *
 * Les événements sont accumulés et envoyés par batch pour optimiser les performances.
 */

import {
  TrackingEvent,
  TrackingPayload,
  TrackingResponse,
  TrackerConfig,
  DEFAULT_TRACKER_CONFIG,
  PageViewEvent,
  PageExitEvent,
  ScrollDepthEvent,
  SectionViewEvent,
  SectionTimeEvent,
  ConversionTrackingEvent,
  CustomTrackingEvent,
  SessionEndEvent,
  ConversionType,
} from './types';
import { SessionManager, getSessionManager } from './session';

// ============================================
// Utilitaires
// ============================================

/**
 * Vérifie si on est côté serveur
 */
function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Vérifie si c'est un bot
 */
function isBot(): boolean {
  if (isServer()) return false;
  return /bot|crawler|spider|crawling|headless|lighthouse|pingdom|gtmetrix/i.test(
    navigator.userAgent
  );
}

/**
 * Vérifie si l'utilisateur est connecté en tant qu'admin
 * En vérifiant la présence du cookie d'authentification admin
 */
function isAdminUser(): boolean {
  if (isServer()) return false;
  return document.cookie.includes('psypnos_admin_token=');
}

/**
 * Debounce une fonction
 */
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: unknown[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };

  return debounced;
}

// ============================================
// Classe Tracker
// ============================================

/**
 * Tracker principal des analytics
 *
 * Utilise le pattern singleton pour garantir une seule instance
 */
export class Tracker {
  private config: TrackerConfig;
  private sessionManager: SessionManager;
  private eventQueue: TrackingEvent[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;
  private isSending = false;

  // État de tracking de page
  private currentPage: string = '';
  private pageStartTime: number = 0;
  private maxScrollDepth: number = 0;
  private scrollTrackedThresholds: Set<number> = new Set();

  // Tracking des sections
  private sectionObserver: IntersectionObserver | null = null;
  private sectionStartTimes: Map<string, number> = new Map();
  private sectionTotalTimes: Map<string, number> = new Map();
  private visibleSections: Set<string> = new Set();
  private sectionTimeInterval: ReturnType<typeof setInterval> | null = null;

  // Handlers liés (pour pouvoir les retirer)
  private boundHandleScroll: () => void;
  private boundHandleBeforeUnload: () => void;
  private boundHandleVisibilityChange: () => void;

  constructor(config: Partial<TrackerConfig> = {}) {
    this.config = { ...DEFAULT_TRACKER_CONFIG, ...config };
    this.sessionManager = getSessionManager();

    // Lier les handlers
    this.boundHandleScroll = debounce(this.handleScroll.bind(this), this.config.scrollDebounce);
    this.boundHandleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.boundHandleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  // ============================================
  // Initialisation
  // ============================================

  /**
   * Initialise le tracker
   */
  init(): void {
    if (isServer() || this.isInitialized) return;

    // Vérifier si analytics désactivé
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false') {
      this.log('Analytics désactivé par configuration');
      return;
    }

    // Ignorer les bots
    if (isBot()) {
      this.log('Bot détecté, tracking désactivé');
      return;
    }

    // Ignorer les utilisateurs admin connectés
    if (isAdminUser()) {
      this.log('Utilisateur admin connecté, tracking désactivé');
      return;
    }

    // Vérifier les chemins exclus
    if (this.isExcludedPath(window.location.pathname)) {
      this.log('Chemin exclu du tracking:', window.location.pathname);
      return;
    }

    this.isInitialized = true;

    // Configurer les listeners
    this.setupEventListeners();

    // Configurer l'observation des sections
    this.setupSectionObserver();

    // Démarrer le batch interval
    this.startBatchInterval();

    // Callback de fin de session
    this.sessionManager.setOnSessionEnd((session) => {
      this.trackSessionEnd();
    });

    // Tracker la première page vue
    this.trackPageView();

    this.log('Tracker initialisé');
  }

  /**
   * Arrête le tracker
   */
  destroy(): void {
    if (!this.isInitialized) return;

    // Envoyer les événements restants
    this.flush();

    // Retirer les listeners
    this.removeEventListeners();

    // Arrêter l'observateur de sections
    this.stopSectionObserver();

    // Arrêter le batch interval
    this.stopBatchInterval();

    this.isInitialized = false;
    this.log('Tracker détruit');
  }

  // ============================================
  // API publique de tracking
  // ============================================

  /**
   * Track une vue de page
   */
  trackPageView(): void {
    if (!this.isInitialized) return;

    const url = window.location.pathname;

    // Si c'est une nouvelle page, envoyer l'événement de sortie de l'ancienne
    if (this.currentPage && this.currentPage !== url) {
      this.trackPageExit();
    }

    // Mettre à jour l'état
    this.currentPage = url;
    this.pageStartTime = Date.now();
    this.maxScrollDepth = 0;
    this.scrollTrackedThresholds.clear();

    // Incrémenter le compteur de pages
    this.sessionManager.incrementPageViews();

    const session = this.sessionManager.getSession();
    const isLandingPage = session?.pageViewCount === 1;

    const event: PageViewEvent = {
      type: 'page_view',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionManager.getSessionId(),
      url,
      referrer: document.referrer || null,
      title: document.title,
      isLandingPage,
    };

    this.queueEvent(event);
    this.log('Page vue trackée:', url);
  }

  /**
   * Track une sortie de page (appelé automatiquement)
   */
  private trackPageExit(): void {
    if (!this.currentPage) return;

    const timeOnPage = Date.now() - this.pageStartTime;

    // Calculer un score d'engagement (0-100)
    const engagementScore = this.calculateEngagementScore(
      timeOnPage,
      this.maxScrollDepth
    );

    const event: PageExitEvent = {
      type: 'page_exit',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionManager.getSessionId(),
      url: this.currentPage,
      timeOnPage,
      scrollDepthPercent: this.maxScrollDepth,
      engagementScore,
    };

    this.queueEvent(event);
    this.log('Sortie de page trackée:', this.currentPage, `${timeOnPage}ms`);
  }

  /**
   * Track le scroll depth
   */
  trackScrollDepth(depth: number): void {
    if (!this.isInitialized) return;

    // Mettre à jour le max
    if (depth > this.maxScrollDepth) {
      this.maxScrollDepth = depth;
    }

    // Vérifier les seuils
    for (const threshold of this.config.scrollThresholds) {
      if (depth >= threshold && !this.scrollTrackedThresholds.has(threshold)) {
        this.scrollTrackedThresholds.add(threshold);

        const event: ScrollDepthEvent = {
          type: 'scroll_depth',
          timestamp: new Date().toISOString(),
          sessionId: this.sessionManager.getSessionId(),
          url: this.currentPage,
          depth: threshold,
        };

        this.queueEvent(event);
        this.log('Scroll depth tracké:', `${threshold}%`);
      }
    }
  }

  /**
   * Track une conversion
   */
  trackConversion(
    conversionType: ConversionType,
    stepName: string,
    stepOrder: number,
    completed: boolean,
    value?: number,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.isInitialized) return;

    const event: ConversionTrackingEvent = {
      type: 'conversion',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionManager.getSessionId(),
      url: this.currentPage,
      conversionType,
      stepName,
      stepOrder,
      completed,
      value,
      metadata,
    };

    this.queueEvent(event);
    this.log('Conversion trackée:', conversionType, stepName, completed ? '✓' : '○');
  }

  /**
   * Track un événement personnalisé
   */
  trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.isInitialized) return;

    const event: CustomTrackingEvent = {
      type: 'custom_event',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionManager.getSessionId(),
      url: this.currentPage,
      category,
      action,
      label,
      value,
      metadata,
    };

    this.queueEvent(event);
    this.log('Événement personnalisé:', category, action, label);
  }

  /**
   * Observe une section pour tracker sa visibilité et le temps passé
   */
  observeSection(element: HTMLElement, sectionId: string, sectionName?: string): void {
    if (!this.isInitialized || !this.sectionObserver) return;

    // Reject invalid or unknown section IDs - don't track them
    if (!sectionId || sectionId.toLowerCase() === 'unknown') {
      this.log('Section ignorée (ID invalide):', sectionId);
      return;
    }

    // Stocker les métadonnées sur l'élément
    element.dataset.sectionId = sectionId;
    element.dataset.sectionName = sectionName || sectionId;

    // Observer l'élément
    this.sectionObserver.observe(element);

    this.log('Section observée:', sectionId);
  }

  /**
   * Arrête d'observer une section
   */
  unobserveSection(element: HTMLElement): void {
    if (!this.sectionObserver) return;

    const sectionId = element.dataset.sectionId;
    if (sectionId) {
      // Envoyer le temps accumulé si la section était visible
      if (this.visibleSections.has(sectionId)) {
        this.trackSectionTime(sectionId, element.dataset.sectionName || sectionId);
        this.visibleSections.delete(sectionId);
      }
    }

    this.sectionObserver.unobserve(element);
  }

  /**
   * Force l'envoi immédiat des événements
   */
  flush(): Promise<void> {
    return this.sendBatch();
  }

  // ============================================
  // Tracking de session
  // ============================================

  /**
   * Track la fin de session
   */
  private trackSessionEnd(): void {
    const session = this.sessionManager.getSession();
    if (!session) return;

    const duration = Date.now() - new Date(session.startedAt).getTime();

    const event: SessionEndEvent = {
      type: 'session_end',
      timestamp: new Date().toISOString(),
      sessionId: session.id,
      url: this.currentPage,
      duration,
      pageViewCount: session.pageViewCount,
      exitPage: this.currentPage,
      bounced: session.pageViewCount === 1,
    };

    this.queueEvent(event);
    this.log('Session terminée:', `${session.pageViewCount} pages`, `${duration}ms`);

    // Forcer l'envoi
    this.flush();
  }

  // ============================================
  // Gestion de la queue d'événements
  // ============================================

  /**
   * Ajoute un événement à la queue
   */
  private queueEvent(event: TrackingEvent): void {
    this.eventQueue.push(event);

    // Envoyer si la queue est pleine
    if (this.eventQueue.length >= this.config.batchSize) {
      this.sendBatch();
    }
  }

  /**
   * Envoie le batch d'événements
   */
  private async sendBatch(): Promise<void> {
    if (this.isSending || this.eventQueue.length === 0) return;

    this.isSending = true;
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const session = this.sessionManager.getSession();
      if (!session) {
        this.log('Pas de session, événements ignorés');
        return;
      }

      const payload: TrackingPayload = {
        events: eventsToSend,
        session,
        clientInfo: this.getClientInfo(),
      };

      // Utiliser sendBeacon si disponible et page en cours de fermeture
      if (document.visibilityState === 'hidden' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], {
          type: 'application/json',
        });
        navigator.sendBeacon(this.config.apiEndpoint, blob);
        this.log('Batch envoyé via sendBeacon:', eventsToSend.length, 'événements');
      } else {
        // Sinon, utiliser fetch
        const response = await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          keepalive: true, // Important pour les requêtes en fermeture de page
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: TrackingResponse = await response.json();
        this.log('Batch envoyé:', result.processed, 'événements traités');
      }
    } catch (error) {
      // Remettre les événements dans la queue en cas d'erreur
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
      this.log('Erreur envoi batch:', error);
    } finally {
      this.isSending = false;
    }
  }

  /**
   * Démarre l'intervalle de batch
   */
  private startBatchInterval(): void {
    this.batchTimeout = setInterval(() => {
      this.sendBatch();
    }, this.config.batchInterval);
  }

  /**
   * Arrête l'intervalle de batch
   */
  private stopBatchInterval(): void {
    if (this.batchTimeout) {
      clearInterval(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  // ============================================
  // Event Listeners
  // ============================================

  /**
   * Configure les event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('scroll', this.boundHandleScroll, { passive: true });
    window.addEventListener('beforeunload', this.boundHandleBeforeUnload);
    document.addEventListener('visibilitychange', this.boundHandleVisibilityChange);
  }

  /**
   * Retire les event listeners
   */
  private removeEventListeners(): void {
    window.removeEventListener('scroll', this.boundHandleScroll);
    window.removeEventListener('beforeunload', this.boundHandleBeforeUnload);
    document.removeEventListener('visibilitychange', this.boundHandleVisibilityChange);

    // Annuler le debounce
    (this.boundHandleScroll as ReturnType<typeof debounce>).cancel?.();
  }

  /**
   * Gère le scroll
   */
  private handleScroll(): void {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;

    // Éviter division par zéro
    if (documentHeight <= windowHeight) return;

    const scrollPercent = Math.round(
      (scrollTop / (documentHeight - windowHeight)) * 100
    );

    this.trackScrollDepth(Math.min(scrollPercent, 100));
  }

  /**
   * Gère la fermeture de page
   */
  private handleBeforeUnload(): void {
    // Tracker la sortie de page
    this.trackPageExit();

    // Envoyer tout temps de section accumulé
    this.flushSectionTimes();

    // Forcer l'envoi du batch
    this.flush();
  }

  /**
   * Gère le changement de visibilité
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      // Page cachée - envoyer les données
      this.flushSectionTimes();
      this.flush();
    } else {
      // Page visible - reprendre le tracking des sections
      this.resumeSectionTracking();
    }
  }

  // ============================================
  // Section Observer
  // ============================================

  /**
   * Configure l'observateur de sections
   */
  private setupSectionObserver(): void {
    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          const sectionId = element.dataset.sectionId;
          const sectionName = element.dataset.sectionName;

          if (!sectionId) return;

          if (entry.isIntersecting) {
            // Section visible
            if (!this.visibleSections.has(sectionId)) {
              this.visibleSections.add(sectionId);
              this.sectionStartTimes.set(sectionId, Date.now());

              // Tracker la vue de section
              const viewEvent: SectionViewEvent = {
                type: 'section_view',
                timestamp: new Date().toISOString(),
                sessionId: this.sessionManager.getSessionId(),
                url: this.currentPage,
                sectionId,
                sectionName: sectionName || sectionId,
              };
              this.queueEvent(viewEvent);

              this.log('Section visible:', sectionId);
            }
          } else {
            // Section cachée
            if (this.visibleSections.has(sectionId)) {
              this.trackSectionTime(sectionId, sectionName || sectionId);
              this.visibleSections.delete(sectionId);
              this.sectionStartTimes.delete(sectionId);
            }
          }
        });
      },
      {
        threshold: this.config.sectionVisibilityThreshold,
        rootMargin: '0px',
      }
    );

    // Démarrer l'intervalle de tracking du temps
    this.sectionTimeInterval = setInterval(() => {
      this.updateSectionTimes();
    }, this.config.sectionTimeInterval);
  }

  /**
   * Arrête l'observateur de sections
   */
  private stopSectionObserver(): void {
    if (this.sectionObserver) {
      this.sectionObserver.disconnect();
      this.sectionObserver = null;
    }

    if (this.sectionTimeInterval) {
      clearInterval(this.sectionTimeInterval);
      this.sectionTimeInterval = null;
    }
  }

  /**
   * Met à jour les temps des sections visibles
   */
  private updateSectionTimes(): void {
    const now = Date.now();

    this.visibleSections.forEach((sectionId) => {
      const startTime = this.sectionStartTimes.get(sectionId);
      if (startTime) {
        const elapsed = now - startTime;
        const current = this.sectionTotalTimes.get(sectionId) || 0;
        this.sectionTotalTimes.set(sectionId, current + elapsed);
        this.sectionStartTimes.set(sectionId, now);
      }
    });
  }

  /**
   * Track le temps passé sur une section
   */
  private trackSectionTime(sectionId: string, sectionName: string): void {
    const startTime = this.sectionStartTimes.get(sectionId);
    if (!startTime) return;

    const elapsed = Date.now() - startTime;
    const totalTime = (this.sectionTotalTimes.get(sectionId) || 0) + elapsed;

    const event: SectionTimeEvent = {
      type: 'section_time',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionManager.getSessionId(),
      url: this.currentPage,
      sectionId,
      sectionName,
      timeSpent: totalTime,
      visibilityPercent: 100, // Simplifié pour l'instant
    };

    this.queueEvent(event);
    this.log('Temps section tracké:', sectionId, `${totalTime}ms`);

    // Reset
    this.sectionTotalTimes.delete(sectionId);
  }

  /**
   * Envoie tous les temps de section accumulés
   */
  private flushSectionTimes(): void {
    this.visibleSections.forEach((sectionId) => {
      const element = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;
      const sectionName = element?.dataset.sectionName || sectionId;
      this.trackSectionTime(sectionId, sectionName);
    });
  }

  /**
   * Reprend le tracking des sections après un retour
   */
  private resumeSectionTracking(): void {
    const now = Date.now();
    this.visibleSections.forEach((sectionId) => {
      this.sectionStartTimes.set(sectionId, now);
    });
  }

  // ============================================
  // Utilitaires
  // ============================================

  /**
   * Récupère les informations client
   */
  private getClientInfo(): TrackingPayload['clientInfo'] {
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window,
      connectionType: connection?.effectiveType,
    };
  }

  /**
   * Calcule un score d'engagement (0-100)
   */
  private calculateEngagementScore(timeOnPage: number, scrollDepth: number): number {
    // Temps normalisé (max 5 minutes = 100%)
    const timeScore = Math.min(timeOnPage / (5 * 60 * 1000), 1) * 50;

    // Scroll normalisé
    const scrollScore = (scrollDepth / 100) * 50;

    return Math.round(timeScore + scrollScore);
  }

  /**
   * Vérifie si un chemin est exclu
   * La comparaison est insensible à la casse pour /admin
   */
  private isExcludedPath(path: string): boolean {
    const lowerPath = path.toLowerCase();
    return this.config.excludedPaths.some((excluded) => {
      // Comparaison insensible à la casse pour /admin
      if (excluded.toLowerCase() === '/admin') {
        return lowerPath.startsWith('/admin');
      }
      return path.startsWith(excluded);
    });
  }

  /**
   * Log de debug
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[Tracker]', ...args);
    }
  }
}

// ============================================
// Singleton
// ============================================

let trackerInstance: Tracker | null = null;

/**
 * Récupère l'instance singleton du Tracker
 */
export function getTracker(config?: Partial<TrackerConfig>): Tracker {
  if (isServer()) {
    // Côté serveur, retourner un tracker vide
    return new Tracker(config);
  }

  if (!trackerInstance) {
    trackerInstance = new Tracker(config);
  }

  return trackerInstance;
}

/**
 * Initialise le tracker
 */
export function initTracker(config?: Partial<TrackerConfig>): Tracker {
  const tracker = getTracker(config);
  tracker.init();
  return tracker;
}

/**
 * Réinitialise le singleton (pour les tests)
 */
export function resetTracker(): void {
  if (trackerInstance) {
    trackerInstance.destroy();
    trackerInstance = null;
  }
}
