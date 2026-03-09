'use client';

/**
 * Smart Form Prefill Library
 *
 * Analyzes user navigation to suggest relevant services and personalize forms.
 * Requires explicit user consent before storing data.
 */

const STORAGE_KEY = 'avv_navigation_history';
const CONSENT_KEY = 'avv_prefill_consent';

export interface NavigationEntry {
  path: string;
  title?: string;
  timestamp: number;
  timeSpent?: number;
}

export interface UserInterests {
  primaryService: string | null;
  interests: string[];
  suggestedMessage: string | null;
  confidence: number;
}

export interface PrefillData {
  suggestedService: string | null;
  suggestedMessage: string | null;
  interests: string[];
}

// Service inference rules based on page visits
const SERVICE_INFERENCE_RULES: Record<
  string,
  { service: string; keywords: string[]; weight: number }
> = {
  // Pages about stress/anxiety
  '/blog/gestion-stress': { service: 'stress', keywords: ['stress', 'anxiété'], weight: 3 },
  '/blog/anxiete': { service: 'stress', keywords: ['anxiété'], weight: 3 },
  '/services/somatotherapie': { service: 'somatothérapie', keywords: ['somatothérapie'], weight: 2 },
  '/services/sophrologie': {
    service: 'sophrologie',
    keywords: ['sophrologie', 'relaxation'],
    weight: 2,
  },
  // Specific issues
  '/blog/arreter-fumer': { service: 'tabac', keywords: ['tabac', 'cigarette'], weight: 3 },
  '/blog/tabac': { service: 'tabac', keywords: ['tabac'], weight: 3 },
  '/blog/perte-poids': { service: 'poids', keywords: ['poids', 'minceur'], weight: 3 },
  '/blog/sommeil': { service: 'sommeil', keywords: ['sommeil', 'insomnie'], weight: 3 },
  '/blog/confiance-soi': { service: 'confiance', keywords: ['confiance'], weight: 3 },
  '/blog/phobies': { service: 'phobies', keywords: ['phobie', 'peur'], weight: 3 },
  // Seminars
  '/seminaires': { service: 'seminaire', keywords: ['séminaire', 'atelier'], weight: 2 },
};

// Service display names
const SERVICE_NAMES: Record<string, string> = {
  stress: "Gestion du stress et de l'anxiété",
  somatothérapie: 'Somatothérapie',
  sophrologie: 'Sophrologie',
  tabac: 'Arrêt du tabac',
  poids: 'Perte de poids',
  sommeil: 'Troubles du sommeil',
  confiance: 'Confiance en soi',
  phobies: 'Phobies et peurs',
  seminaire: 'Séminaires et ateliers',
};

// Suggested messages based on primary interest
const SUGGESTED_MESSAGES: Record<string, string> = {
  stress: 'Bonjour, je souhaiterais en savoir plus sur vos séances pour la gestion du stress.',
  tabac: "Bonjour, je suis intéressé(e) par l'arrêt du tabac par somatothérapie.",
  poids: "Bonjour, je voudrais des informations sur l'accompagnement pour la perte de poids.",
  sommeil: "Bonjour, je rencontre des difficultés de sommeil et j'aimerais prendre rendez-vous.",
  confiance: 'Bonjour, je souhaite travailler sur ma confiance en moi.',
  phobies: "Bonjour, j'aimerais me faire accompagner pour surmonter mes peurs.",
  somatothérapie: "Bonjour, je suis intéressé(e) par l'somatothérapie.",
  sophrologie: 'Bonjour, je voudrais découvrir la sophrologie.',
  seminaire: 'Bonjour, je suis intéressé(e) par vos prochains séminaires.',
};

/**
 * Check if user has given consent for prefill tracking
 */
export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'true';
}

/**
 * Set user consent for prefill tracking
 */
export function setConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;

  if (granted) {
    localStorage.setItem(CONSENT_KEY, 'true');
  } else {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }

  // Sync with server
  syncConsentWithServer(granted);
}

/**
 * Sync consent status with server
 */
async function syncConsentWithServer(granted: boolean): Promise<void> {
  try {
    const sessionId = getSessionId();
    await fetch('/api/prefill/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, consentGiven: granted }),
    });
  } catch (error) {
    console.error('Failed to sync consent:', error);
  }
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('avv_session_id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('avv_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Get stored navigation history
 */
export function getNavigationHistory(): NavigationEntry[] {
  if (typeof window === 'undefined' || !hasConsent()) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Track a page visit
 */
export function trackPageVisit(path: string, title?: string): void {
  if (typeof window === 'undefined' || !hasConsent()) return;

  const history = getNavigationHistory();
  const lastEntry = history[history.length - 1];

  // Update time spent on previous page
  if (lastEntry && !lastEntry.timeSpent) {
    lastEntry.timeSpent = Date.now() - lastEntry.timestamp;
  }

  // Add new entry
  history.push({
    path,
    title,
    timestamp: Date.now(),
  });

  // Keep only last 20 entries
  const trimmedHistory = history.slice(-20);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));

    // Sync with server periodically
    if (history.length % 5 === 0) {
      syncNavigationWithServer(trimmedHistory);
    }
  } catch (error) {
    console.error('Failed to store navigation:', error);
  }
}

/**
 * Sync navigation history with server
 */
async function syncNavigationWithServer(history: NavigationEntry[]): Promise<void> {
  if (!hasConsent()) return;

  try {
    const sessionId = getSessionId();
    await fetch('/api/prefill/navigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, history }),
    });
  } catch (error) {
    console.error('Failed to sync navigation:', error);
  }
}

/**
 * Analyze navigation history to infer user interests
 */
export function analyzeInterests(): UserInterests {
  const history = getNavigationHistory();

  if (history.length === 0) {
    return {
      primaryService: null,
      interests: [],
      suggestedMessage: null,
      confidence: 0,
    };
  }

  // Score each service based on page visits
  const serviceScores: Record<string, number> = {};
  const allInterests: Set<string> = new Set();

  for (const entry of history) {
    // Check exact path matches
    for (const [pathPattern, rule] of Object.entries(SERVICE_INFERENCE_RULES)) {
      if (entry.path.includes(pathPattern) || entry.path === pathPattern) {
        serviceScores[rule.service] = (serviceScores[rule.service] || 0) + rule.weight;
        rule.keywords.forEach(k => allInterests.add(k));
      }
    }

    // Check page title for keywords
    if (entry.title) {
      const titleLower = entry.title.toLowerCase();
      for (const rule of Object.values(SERVICE_INFERENCE_RULES)) {
        for (const keyword of rule.keywords) {
          if (titleLower.includes(keyword)) {
            serviceScores[rule.service] = (serviceScores[rule.service] || 0) + 1;
            allInterests.add(keyword);
          }
        }
      }
    }

    // Weight by time spent (if > 30 seconds, add bonus)
    if (entry.timeSpent && entry.timeSpent > 30000) {
      for (const [pathPattern, rule] of Object.entries(SERVICE_INFERENCE_RULES)) {
        if (entry.path.includes(pathPattern)) {
          serviceScores[rule.service] = (serviceScores[rule.service] || 0) + 2;
        }
      }
    }
  }

  // Find primary service
  let primaryService: string | null = null;
  let maxScore = 0;
  let totalScore = 0;

  for (const [service, score] of Object.entries(serviceScores)) {
    totalScore += score;
    if (score > maxScore) {
      maxScore = score;
      primaryService = service;
    }
  }

  // Calculate confidence (0-100)
  const confidence = Math.min(
    100,
    Math.round((maxScore / Math.max(totalScore, 1)) * 100 * (history.length / 5))
  );

  return {
    primaryService,
    interests: Array.from(allInterests),
    suggestedMessage: primaryService ? SUGGESTED_MESSAGES[primaryService] || null : null,
    confidence,
  };
}

/**
 * Get prefill data for forms
 */
export function getPrefillData(): PrefillData {
  const interests = analyzeInterests();

  return {
    suggestedService: interests.primaryService
      ? SERVICE_NAMES[interests.primaryService] || null
      : null,
    suggestedMessage: interests.confidence >= 30 ? interests.suggestedMessage : null,
    interests: interests.interests,
  };
}

/**
 * Clear all stored prefill data
 */
export function clearPrefillData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Hook for tracking navigation automatically
 */
export function useNavigationTracking(): void {
  if (typeof window === 'undefined') return;

  // Track on page load
  if (hasConsent()) {
    trackPageVisit(window.location.pathname, document.title);
  }
}
