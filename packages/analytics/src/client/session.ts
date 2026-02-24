/**
 * Session manager for analytics tracking
 *
 * This module manages user session creation, persistence, and expiration.
 * A session represents a continuous user visit on the site.
 */

import { UAParser } from 'ua-parser-js';

import {
  SessionData,
  DeviceType,
  generateSessionId,
  DEFAULT_TRACKER_CONFIG,
} from '../types';

// ============================================
// SessionManager Class
// ============================================

/**
 * User session manager
 *
 * Responsibilities:
 * - Create/restore sessions
 * - Manage session expiration
 * - Persist session data
 * - Detect returning visitors
 */
export class SessionManager {
  private session: SessionData | null = null;
  private activityTimeout: ReturnType<typeof setTimeout> | null = null;
  private onSessionEnd: ((session: SessionData) => void) | null = null;
  private throttledActivityHandler: ((...args: unknown[]) => void) | null = null;
  private config: {
    sessionStorageKey: string;
    sessionTimeout: number;
    visitorIdKey: string;
  };

  constructor(config?: Partial<{
    sessionStorageKey: string;
    sessionTimeout: number;
    visitorIdKey: string;
  }>) {
    this.config = {
      sessionStorageKey: config?.sessionStorageKey || DEFAULT_TRACKER_CONFIG.sessionStorageKey,
      sessionTimeout: config?.sessionTimeout || DEFAULT_TRACKER_CONFIG.sessionTimeout,
      visitorIdKey: config?.visitorIdKey || 'kairn_visitor_id',
    };

    // Don't do anything server-side
    if (typeof window === 'undefined') return;

    // Restore or create a session
    this.initSession();

    // Listen for user activity
    this.setupActivityListeners();
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Gets the current session
   */
  getSession(): SessionData | null {
    return this.session;
  }

  /**
   * Gets the current session ID
   */
  getSessionId(): string {
    return this.session?.id || '';
  }

  /**
   * Updates session activity
   */
  updateActivity(): void {
    if (!this.session) return;

    this.session.lastActivityAt = new Date().toISOString();
    this.persistSession();
    this.resetActivityTimeout();
  }

  /**
   * Increments page view counter
   */
  incrementPageViews(): void {
    if (!this.session) return;

    this.session.pageViewCount++;
    this.updateActivity();
  }

  /**
   * Sets the session end callback
   */
  setOnSessionEnd(callback: (session: SessionData) => void): void {
    this.onSessionEnd = callback;
  }

  /**
   * Forces current session to end
   */
  endSession(): void {
    if (!this.session) return;

    // Call callback if defined
    if (this.onSessionEnd) {
      this.onSessionEnd(this.session);
    }

    // Cleanup
    this.clearActivityTimeout();
    this.session = null;
    this.clearSessionStorage();
  }

  /**
   * Checks if this is a bounce session (single page view)
   */
  isBounce(): boolean {
    return this.session?.pageViewCount === 1;
  }

  /**
   * Checks if this is a returning visitor
   */
  isReturningVisitor(): boolean {
    return this.session?.isReturning || false;
  }

  /**
   * Cleanup on destruction
   */
  destroy(): void {
    this.clearActivityTimeout();

    if (typeof window !== 'undefined' && this.throttledActivityHandler) {
      window.removeEventListener('mousemove', this.throttledActivityHandler);
      window.removeEventListener('keydown', this.throttledActivityHandler);
      window.removeEventListener('scroll', this.throttledActivityHandler);
      window.removeEventListener('click', this.throttledActivityHandler);
      window.removeEventListener('touchstart', this.throttledActivityHandler);
      this.throttledActivityHandler = null;
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Initializes the session (restore or create)
   */
  private initSession(): void {
    // Try to restore an existing session
    const existingSession = this.loadSession();

    if (existingSession && this.isSessionValid(existingSession)) {
      // Existing valid session
      this.session = existingSession;
      this.updateActivity();
    } else {
      // Create a new session
      this.session = this.createNewSession();
      this.persistSession();
    }

    this.resetActivityTimeout();
  }

  /**
   * Creates a new session
   */
  private createNewSession(): SessionData {
    const parser = new UAParser();
    const result = parser.getResult();

    // Determine device type
    const deviceType: DeviceType = this.detectDeviceType(result);

    // Extract UTM params from URL
    const urlParams = new URLSearchParams(window.location.search);

    // Check if returning visitor
    const isReturning = this.checkReturningVisitor();

    // Mark as visitor
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
   * Detects device type
   */
  private detectDeviceType(
    uaResult: ReturnType<UAParser['getResult']>
  ): DeviceType {
    // UAParser device type
    if (uaResult.device.type === 'mobile') return 'mobile';
    if (uaResult.device.type === 'tablet') return 'tablet';

    // Fallback based on screen size
    const width = window.screen.width;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';

    return 'desktop';
  }

  /**
   * Checks if this is a returning visitor
   */
  private checkReturningVisitor(): boolean {
    try {
      const visitorId = localStorage.getItem(this.config.visitorIdKey);
      return visitorId !== null;
    } catch {
      return false;
    }
  }

  /**
   * Marks user as visitor (to detect returns)
   */
  private markAsVisitor(): void {
    try {
      if (!localStorage.getItem(this.config.visitorIdKey)) {
        const visitorId = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(this.config.visitorIdKey, visitorId);
      }
    } catch {
      // localStorage not available
    }
  }

  /**
   * Checks if a session is still valid
   */
  private isSessionValid(session: SessionData): boolean {
    const lastActivity = new Date(session.lastActivityAt).getTime();
    const now = Date.now();
    return now - lastActivity < this.config.sessionTimeout;
  }

  /**
   * Loads session from storage
   */
  private loadSession(): SessionData | null {
    try {
      // Try sessionStorage first (browser session)
      let data = sessionStorage.getItem(this.config.sessionStorageKey);

      // Fallback to localStorage
      if (!data) {
        data = localStorage.getItem(this.config.sessionStorageKey);
      }

      if (data) {
        return JSON.parse(data) as SessionData;
      }
    } catch {
      // Parsing error, ignore
    }
    return null;
  }

  /**
   * Persists session to storage
   */
  private persistSession(): void {
    if (!this.session) return;

    try {
      const data = JSON.stringify(this.session);
      // Store in both for robustness
      sessionStorage.setItem(this.config.sessionStorageKey, data);
      localStorage.setItem(this.config.sessionStorageKey, data);
    } catch {
      // Storage not available
    }
  }

  /**
   * Clears session from storage
   */
  private clearSessionStorage(): void {
    try {
      sessionStorage.removeItem(this.config.sessionStorageKey);
      localStorage.removeItem(this.config.sessionStorageKey);
    } catch {
      // Ignore
    }
  }

  /**
   * Sets up activity listeners
   */
  private setupActivityListeners(): void {
    // Throttle to avoid too many calls
    // Store reference so destroy() can properly remove the listeners
    this.throttledActivityHandler = this.throttle(this.handleActivity.bind(this), 1000);

    window.addEventListener('mousemove', this.throttledActivityHandler, { passive: true });
    window.addEventListener('keydown', this.throttledActivityHandler, { passive: true });
    window.addEventListener('scroll', this.throttledActivityHandler, { passive: true });
    window.addEventListener('click', this.throttledActivityHandler, { passive: true });
    window.addEventListener('touchstart', this.throttledActivityHandler, { passive: true });

    // Handle page close
    window.addEventListener('beforeunload', () => {
      this.persistSession();
    });

    // Handle visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.persistSession();
      }
    });
  }

  /**
   * Handles user activity
   */
  private handleActivity = (): void => {
    this.updateActivity();
  };

  /**
   * Resets activity timeout
   */
  private resetActivityTimeout(): void {
    this.clearActivityTimeout();

    this.activityTimeout = setTimeout(() => {
      // Session expired due to inactivity
      this.endSession();
    }, this.config.sessionTimeout);
  }

  /**
   * Clears activity timeout
   */
  private clearActivityTimeout(): void {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
  }

  /**
   * Throttling utility
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

export interface SessionManagerConfig {
  sessionStorageKey?: string;
  sessionTimeout?: number;
  visitorIdKey?: string;
}

/**
 * Gets the SessionManager singleton instance
 */
export function getSessionManager(config?: SessionManagerConfig): SessionManager {
  if (typeof window === 'undefined') {
    // Server-side, return empty manager
    return new SessionManager(config);
  }

  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(config);
  }

  return sessionManagerInstance;
}

/**
 * Resets the singleton (for tests)
 */
export function resetSessionManager(): void {
  if (sessionManagerInstance) {
    sessionManagerInstance.destroy();
    sessionManagerInstance = null;
  }
}
