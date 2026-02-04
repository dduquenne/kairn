/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Gestionnaire de session pour le tracking analytics
 *
 * Ce module gère la création, persistance et expiration des sessions utilisateur.
 * Une session représente une visite continue d'un utilisateur sur le site.
 */

import { UAParser } from 'ua-parser-js';

import {
  SessionData,
  DeviceType,
  generateSessionId,
  DEFAULT_TRACKER_CONFIG,
} from './types';

// ============================================
// Constantes
// ============================================

const SESSION_STORAGE_KEY = DEFAULT_TRACKER_CONFIG.sessionStorageKey;
const SESSION_TIMEOUT = DEFAULT_TRACKER_CONFIG.sessionTimeout;
const VISITOR_ID_KEY = 'psypnos_visitor_id';

// ============================================
// Classe SessionManager
// ============================================

/**
 * Gestionnaire de sessions utilisateur
 *
 * Responsabilités:
 * - Créer/restaurer les sessions
 * - Gérer l'expiration des sessions
 * - Persister les données de session
 * - Détecter les visiteurs de retour
 */
export class SessionManager {
  private session: SessionData | null = null;
  private activityTimeout: ReturnType<typeof setTimeout> | null = null;
  private onSessionEnd: ((session: SessionData) => void) | null = null;

  constructor() {
    // Ne rien faire côté serveur
    if (typeof window === 'undefined') return;

    // Restaurer ou créer une session
    this.initSession();

    // Écouter l'activité utilisateur
    this.setupActivityListeners();
  }

  // ============================================
  // Méthodes publiques
  // ============================================

  /**
   * Récupère la session courante
   */
  getSession(): SessionData | null {
    return this.session;
  }

  /**
   * Récupère l'ID de session courant
   */
  getSessionId(): string {
    return this.session?.id || '';
  }

  /**
   * Met à jour l'activité de la session
   */
  updateActivity(): void {
    if (!this.session) return;

    this.session.lastActivityAt = new Date().toISOString();
    this.persistSession();
    this.resetActivityTimeout();
  }

  /**
   * Incrémente le compteur de pages vues
   */
  incrementPageViews(): void {
    if (!this.session) return;

    this.session.pageViewCount++;
    this.updateActivity();
  }

  /**
   * Définit le callback de fin de session
   */
  setOnSessionEnd(callback: (session: SessionData) => void): void {
    this.onSessionEnd = callback;
  }

  /**
   * Force la fin de la session courante
   */
  endSession(): void {
    if (!this.session) return;

    // Appeler le callback si défini
    if (this.onSessionEnd) {
      this.onSessionEnd(this.session);
    }

    // Nettoyer
    this.clearActivityTimeout();
    this.session = null;
    this.clearSessionStorage();
  }

  /**
   * Vérifie si la session est une session "bounce" (une seule page vue)
   */
  isBounce(): boolean {
    return this.session?.pageViewCount === 1;
  }

  /**
   * Vérifie si c'est un visiteur de retour
   */
  isReturningVisitor(): boolean {
    return this.session?.isReturning || false;
  }

  /**
   * Nettoyage lors de la destruction
   */
  destroy(): void {
    this.clearActivityTimeout();

    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.handleActivity);
      window.removeEventListener('keydown', this.handleActivity);
      window.removeEventListener('scroll', this.handleActivity);
      window.removeEventListener('click', this.handleActivity);
      window.removeEventListener('touchstart', this.handleActivity);
    }
  }

  // ============================================
  // Méthodes privées
  // ============================================

  /**
   * Initialise la session (restaure ou crée)
   */
  private initSession(): void {
    // Essayer de restaurer une session existante
    const existingSession = this.loadSession();

    if (existingSession && this.isSessionValid(existingSession)) {
      // Session existante valide
      this.session = existingSession;
      this.updateActivity();
    } else {
      // Créer une nouvelle session
      this.session = this.createNewSession();
      this.persistSession();
    }

    this.resetActivityTimeout();
  }

  /**
   * Crée une nouvelle session
   */
  private createNewSession(): SessionData {
    const parser = new UAParser();
    const result = parser.getResult();

    // Déterminer le type d'appareil
    const deviceType: DeviceType = this.detectDeviceType(result);

    // Extraire les paramètres UTM de l'URL
    const urlParams = new URLSearchParams(window.location.search);

    // Vérifier si c'est un visiteur de retour
    const isReturning = this.checkReturningVisitor();

    // Marquer comme visiteur
    this.markAsVisitor();

    return {
      id: generateSessionId(),
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      landingPage: window.location.pathname,
      referrer: document.referrer || null,
      utmSource: urlParams.get('utm_source'),
      utmMedium: urlParams.get('utm_medium'),
      utmCampaign: urlParams.get('utm_campaign'),
      utmTerm: urlParams.get('utm_term'),
      utmContent: urlParams.get('utm_content'),
      deviceType,
      browser: result.browser.name || null,
      os: result.os.name || null,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pageViewCount: 0,
      isReturning,
    };
  }

  /**
   * Détecte le type d'appareil
   */
  private detectDeviceType(
    uaResult: ReturnType<UAParser['getResult']>
  ): DeviceType {
    // UAParser device type
    if (uaResult.device.type === 'mobile') return 'mobile';
    if (uaResult.device.type === 'tablet') return 'tablet';

    // Fallback basé sur la taille d'écran
    const width = window.screen.width;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';

    return 'desktop';
  }

  /**
   * Vérifie si c'est un visiteur de retour
   */
  private checkReturningVisitor(): boolean {
    try {
      const visitorId = localStorage.getItem(VISITOR_ID_KEY);
      return visitorId !== null;
    } catch {
      return false;
    }
  }

  /**
   * Marque l'utilisateur comme visiteur (pour détecter les retours)
   */
  private markAsVisitor(): void {
    try {
      if (!localStorage.getItem(VISITOR_ID_KEY)) {
        const visitorId = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
      }
    } catch {
      // localStorage non disponible
    }
  }

  /**
   * Vérifie si une session est encore valide
   */
  private isSessionValid(session: SessionData): boolean {
    const lastActivity = new Date(session.lastActivityAt).getTime();
    const now = Date.now();
    return now - lastActivity < SESSION_TIMEOUT;
  }

  /**
   * Charge la session depuis le stockage
   */
  private loadSession(): SessionData | null {
    try {
      // Essayer sessionStorage d'abord (session navigateur)
      let data = sessionStorage.getItem(SESSION_STORAGE_KEY);

      // Fallback sur localStorage
      if (!data) {
        data = localStorage.getItem(SESSION_STORAGE_KEY);
      }

      if (data) {
        return JSON.parse(data) as SessionData;
      }
    } catch {
      // Erreur de parsing, ignorer
    }
    return null;
  }

  /**
   * Persiste la session dans le stockage
   */
  private persistSession(): void {
    if (!this.session) return;

    try {
      const data = JSON.stringify(this.session);
      // Stocker dans les deux pour robustesse
      sessionStorage.setItem(SESSION_STORAGE_KEY, data);
      localStorage.setItem(SESSION_STORAGE_KEY, data);
    } catch {
      // Stockage non disponible
    }
  }

  /**
   * Efface la session du stockage
   */
  private clearSessionStorage(): void {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignorer
    }
  }

  /**
   * Configure les listeners d'activité
   */
  private setupActivityListeners(): void {
    // Throttle pour éviter trop d'appels
    const throttledHandler = this.throttle(this.handleActivity.bind(this), 1000);

    window.addEventListener('mousemove', throttledHandler, { passive: true });
    window.addEventListener('keydown', throttledHandler, { passive: true });
    window.addEventListener('scroll', throttledHandler, { passive: true });
    window.addEventListener('click', throttledHandler, { passive: true });
    window.addEventListener('touchstart', throttledHandler, { passive: true });

    // Gérer la fermeture de page
    window.addEventListener('beforeunload', () => {
      this.persistSession();
    });

    // Gérer la visibilité
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.persistSession();
      }
    });
  }

  /**
   * Gère l'activité utilisateur
   */
  private handleActivity = (): void => {
    this.updateActivity();
  };

  /**
   * Réinitialise le timeout d'activité
   */
  private resetActivityTimeout(): void {
    this.clearActivityTimeout();

    this.activityTimeout = setTimeout(() => {
      // Session expirée par inactivité
      this.endSession();
    }, SESSION_TIMEOUT);
  }

  /**
   * Efface le timeout d'activité
   */
  private clearActivityTimeout(): void {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
  }

  /**
   * Utilitaire de throttling
   */
  private throttle<T extends (...args: unknown[]) => void>(
    func: T,
    limit: number
  ): T {
    let lastCall = 0;
    return ((...args: unknown[]) => {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        func(...args);
      }
    }) as T;
  }
}

// ============================================
// Singleton
// ============================================

let sessionManagerInstance: SessionManager | null = null;

/**
 * Récupère l'instance singleton du SessionManager
 */
export function getSessionManager(): SessionManager {
  if (typeof window === 'undefined') {
    // Côté serveur, retourner un manager vide
    return new SessionManager();
  }

  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }

  return sessionManagerInstance;
}

/**
 * Réinitialise le singleton (pour les tests)
 */
export function resetSessionManager(): void {
  if (sessionManagerInstance) {
    sessionManagerInstance.destroy();
    sessionManagerInstance = null;
  }
}
