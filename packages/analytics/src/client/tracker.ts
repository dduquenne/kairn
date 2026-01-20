/**
 * Main analytics tracker
 *
 * This module provides a singleton class that manages all tracking:
 * - Page views
 * - Scroll depth
 * - Time on page
 * - Visible sections
 * - Conversions
 * - Custom events
 *
 * Events are batched and sent together to optimize performance.
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
} from '../types';
import { SessionManager, getSessionManager } from './session';

// ============================================
// Utilities
// ============================================

/**
 * Checks if running server-side
 */
function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Checks if user is a bot
 */
function isBot(): boolean {
  if (isServer()) return false;
  return /bot|crawler|spider|crawling|headless|lighthouse|pingdom|gtmetrix/i.test(
    navigator.userAgent
  );
}

/**
 * Checks if user is logged in as admin
 */
function isAdminUser(adminCookieName?: string): boolean {
  if (isServer()) return false;
  if (!adminCookieName) return false;
  return document.cookie.includes(`${adminCookieName}=`);
}

/**
 * Debounces a function
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
// Tracker Class
// ============================================

/**
 * Main analytics tracker
 *
 * Uses singleton pattern to guarantee a single instance
 */
export class Tracker {
  private config: TrackerConfig;
  private sessionManager: SessionManager;
  private eventQueue: TrackingEvent[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;
  private isSending = false;

  // Page tracking state
  private currentPage: string = '';
  private pageStartTime: number = 0;
  private maxScrollDepth: number = 0;
  private scrollTrackedThresholds: Set<number> = new Set();

  // Section tracking
  private sectionObserver: IntersectionObserver | null = null;
  private sectionStartTimes: Map<string, number> = new Map();
  private sectionTotalTimes: Map<string, number> = new Map();
  private visibleSections: Set<string> = new Set();
  private sectionTimeInterval: ReturnType<typeof setInterval> | null = null;

  // Bound handlers (to be able to remove them)
  private boundHandleScroll: () => void;
  private boundHandleBeforeUnload: () => void;
  private boundHandleVisibilityChange: () => void;

  constructor(config: Partial<TrackerConfig> = {}) {
    this.config = { ...DEFAULT_TRACKER_CONFIG, ...config };
    this.sessionManager = getSessionManager({
      sessionStorageKey: this.config.sessionStorageKey,
      sessionTimeout: this.config.sessionTimeout,
    });

    // Bind handlers
    this.boundHandleScroll = debounce(this.handleScroll.bind(this), this.config.scrollDebounce);
    this.boundHandleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.boundHandleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initializes the tracker
   */
  init(): void {
    if (isServer() || this.isInitialized) return;

    // Ignore bots
    if (isBot()) {
      this.log('Bot detected, tracking disabled');
      return;
    }

    // Ignore admin users
    if (isAdminUser(this.config.adminCookieName)) {
      this.log('Admin user detected, tracking disabled');
      return;
    }

    // Check excluded paths
    if (this.isExcludedPath(window.location.pathname)) {
      this.log('Path excluded from tracking:', window.location.pathname);
      return;
    }

    this.isInitialized = true;

    // Set up listeners
    this.setupEventListeners();

    // Set up section observer
    this.setupSectionObserver();

    // Start batch interval
    this.startBatchInterval();

    // Session end callback
    this.sessionManager.setOnSessionEnd(() => {
      this.trackSessionEnd();
    });

    // Track first page view
    this.trackPageView();

    this.log('Tracker initialized');
  }

  /**
   * Stops the tracker
   */
  destroy(): void {
    if (!this.isInitialized) return;

    // Send remaining events
    this.flush();

    // Remove listeners
    this.removeEventListeners();

    // Stop section observer
    this.stopSectionObserver();

    // Stop batch interval
    this.stopBatchInterval();

    this.isInitialized = false;
    this.log('Tracker destroyed');
  }

  // ============================================
  // Public Tracking API
  // ============================================

  /**
   * Tracks a page view
   */
  trackPageView(): void {
    if (!this.isInitialized) return;

    const url = window.location.pathname;

    // If new page, send exit event for old page
    if (this.currentPage && this.currentPage !== url) {
      this.trackPageExit();
    }

    // Update state
    this.currentPage = url;
    this.pageStartTime = Date.now();
    this.maxScrollDepth = 0;
    this.scrollTrackedThresholds.clear();

    // Increment page counter
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
    this.log('Page view tracked:', url);
  }

  /**
   * Tracks scroll depth
   */
  trackScrollDepth(depth: number): void {
    if (!this.isInitialized) return;

    // Update max
    if (depth > this.maxScrollDepth) {
      this.maxScrollDepth = depth;
    }

    // Check thresholds
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
        this.log('Scroll depth tracked:', `${threshold}%`);
      }
    }
  }

  /**
   * Tracks a conversion
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
    this.log('Conversion tracked:', conversionType, stepName, completed ? '✓' : '○');
  }

  /**
   * Tracks a custom event
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
    this.log('Custom event:', category, action, label);
  }

  /**
   * Observes a section to track visibility and time spent
   */
  observeSection(element: HTMLElement, sectionId: string, sectionName?: string): void {
    if (!this.isInitialized || !this.sectionObserver) return;

    // Reject invalid section IDs
    if (!sectionId || sectionId.toLowerCase() === 'unknown') {
      this.log('Section ignored (invalid ID):', sectionId);
      return;
    }

    // Store metadata on element
    element.dataset.sectionId = sectionId;
    element.dataset.sectionName = sectionName || sectionId;

    // Observe element
    this.sectionObserver.observe(element);

    this.log('Section observed:', sectionId);
  }

  /**
   * Stops observing a section
   */
  unobserveSection(element: HTMLElement): void {
    if (!this.sectionObserver) return;

    const sectionId = element.dataset.sectionId;
    if (sectionId) {
      // Send accumulated time if section was visible
      if (this.visibleSections.has(sectionId)) {
        this.trackSectionTime(sectionId, element.dataset.sectionName || sectionId);
        this.visibleSections.delete(sectionId);
      }
    }

    this.sectionObserver.unobserve(element);
  }

  /**
   * Forces immediate event sending
   */
  flush(): Promise<void> {
    return this.sendBatch();
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Tracks page exit (called automatically)
   */
  private trackPageExit(): void {
    if (!this.currentPage) return;

    const timeOnPage = Date.now() - this.pageStartTime;

    // Calculate engagement score (0-100)
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
    this.log('Page exit tracked:', this.currentPage, `${timeOnPage}ms`);
  }

  /**
   * Tracks session end
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
    this.log('Session ended:', `${session.pageViewCount} pages`, `${duration}ms`);

    // Force send
    this.flush();
  }

  // ============================================
  // Event Queue Management
  // ============================================

  /**
   * Adds an event to the queue
   */
  private queueEvent(event: TrackingEvent): void {
    this.eventQueue.push(event);

    // Send if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.sendBatch();
    }
  }

  /**
   * Sends event batch
   */
  private async sendBatch(): Promise<void> {
    if (this.isSending || this.eventQueue.length === 0) return;

    this.isSending = true;
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const session = this.sessionManager.getSession();
      if (!session) {
        this.log('No session, events ignored');
        return;
      }

      const payload: TrackingPayload = {
        events: eventsToSend,
        session,
        clientInfo: this.getClientInfo(),
      };

      // Use sendBeacon if available and page is closing
      if (document.visibilityState === 'hidden' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], {
          type: 'application/json',
        });
        navigator.sendBeacon(this.config.apiEndpoint, blob);
        this.log('Batch sent via sendBeacon:', eventsToSend.length, 'events');
      } else {
        // Otherwise, use fetch
        const response = await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          keepalive: true, // Important for requests during page close
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: TrackingResponse = await response.json();
        this.log('Batch sent:', result.processed, 'events processed');
      }
    } catch (error) {
      // Put events back in queue on error
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
      this.log('Batch send error:', error);
    } finally {
      this.isSending = false;
    }
  }

  /**
   * Starts batch interval
   */
  private startBatchInterval(): void {
    this.batchTimeout = setInterval(() => {
      this.sendBatch();
    }, this.config.batchInterval);
  }

  /**
   * Stops batch interval
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
   * Sets up event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('scroll', this.boundHandleScroll, { passive: true });
    window.addEventListener('beforeunload', this.boundHandleBeforeUnload);
    document.addEventListener('visibilitychange', this.boundHandleVisibilityChange);
  }

  /**
   * Removes event listeners
   */
  private removeEventListeners(): void {
    window.removeEventListener('scroll', this.boundHandleScroll);
    window.removeEventListener('beforeunload', this.boundHandleBeforeUnload);
    document.removeEventListener('visibilitychange', this.boundHandleVisibilityChange);

    // Cancel debounce
    (this.boundHandleScroll as ReturnType<typeof debounce>).cancel?.();
  }

  /**
   * Handles scroll
   */
  private handleScroll(): void {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;

    // Avoid division by zero
    if (documentHeight <= windowHeight) return;

    const scrollPercent = Math.round(
      (scrollTop / (documentHeight - windowHeight)) * 100
    );

    this.trackScrollDepth(Math.min(scrollPercent, 100));
  }

  /**
   * Handles page close
   */
  private handleBeforeUnload(): void {
    // Track page exit
    this.trackPageExit();

    // Send all section times
    this.flushSectionTimes();

    // Force send batch
    this.flush();
  }

  /**
   * Handles visibility change
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      // Page hidden - send data
      this.flushSectionTimes();
      this.flush();
    } else {
      // Page visible - resume section tracking
      this.resumeSectionTracking();
    }
  }

  // ============================================
  // Section Observer
  // ============================================

  /**
   * Sets up section observer
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

              // Track section view
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
            // Section hidden
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

    // Start section time interval
    this.sectionTimeInterval = setInterval(() => {
      this.updateSectionTimes();
    }, this.config.sectionTimeInterval);
  }

  /**
   * Stops section observer
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
   * Updates visible section times
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
   * Tracks time spent on a section
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
      visibilityPercent: 100, // Simplified for now
    };

    this.queueEvent(event);
    this.log('Section time tracked:', sectionId, `${totalTime}ms`);

    // Reset
    this.sectionTotalTimes.delete(sectionId);
  }

  /**
   * Sends all accumulated section times
   */
  private flushSectionTimes(): void {
    this.visibleSections.forEach((sectionId) => {
      const element = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;
      const sectionName = element?.dataset.sectionName || sectionId;
      this.trackSectionTime(sectionId, sectionName);
    });
  }

  /**
   * Resumes section tracking after return
   */
  private resumeSectionTracking(): void {
    const now = Date.now();
    this.visibleSections.forEach((sectionId) => {
      this.sectionStartTimes.set(sectionId, now);
    });
  }

  // ============================================
  // Utilities
  // ============================================

  /**
   * Gets client info
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
   * Calculates engagement score (0-100)
   */
  private calculateEngagementScore(timeOnPage: number, scrollDepth: number): number {
    // Normalized time (max 5 minutes = 100%)
    const timeScore = Math.min(timeOnPage / (5 * 60 * 1000), 1) * 50;

    // Normalized scroll
    const scrollScore = (scrollDepth / 100) * 50;

    return Math.round(timeScore + scrollScore);
  }

  /**
   * Checks if a path is excluded
   */
  private isExcludedPath(path: string): boolean {
    const lowerPath = path.toLowerCase();
    return this.config.excludedPaths.some((excluded) => {
      // Case-insensitive comparison for /admin
      if (excluded.toLowerCase() === '/admin') {
        return lowerPath.startsWith('/admin');
      }
      return path.startsWith(excluded);
    });
  }

  /**
   * Debug log
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
 * Gets the Tracker singleton instance
 */
export function getTracker(config?: Partial<TrackerConfig>): Tracker {
  if (isServer()) {
    // Server-side, return empty tracker
    return new Tracker(config);
  }

  if (!trackerInstance) {
    trackerInstance = new Tracker(config);
  }

  return trackerInstance;
}

/**
 * Initializes the tracker
 */
export function initTracker(config?: Partial<TrackerConfig>): Tracker {
  const tracker = getTracker(config);
  tracker.init();
  return tracker;
}

/**
 * Resets the singleton (for tests)
 */
export function resetTracker(): void {
  if (trackerInstance) {
    trackerInstance.destroy();
    trackerInstance = null;
  }
}
