/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * PWA Data Mode Helper
 *
 * Permet de basculer entre données réelles et données simulées
 * via la variable d'environnement NEXT_PUBLIC_PWA_DATA_MODE
 */

export type DataMode = 'real' | 'mock';

/**
 * Récupère le mode de données actuel
 */
export function getDataMode(): DataMode {
  const mode = process.env.NEXT_PUBLIC_PWA_DATA_MODE;
  return mode === 'mock' ? 'mock' : 'real';
}

/**
 * Vérifie si on est en mode mock
 */
export function isMockMode(): boolean {
  return getDataMode() === 'mock';
}

/**
 * Vérifie si on est en mode real
 */
export function isRealMode(): boolean {
  return getDataMode() === 'real';
}

/**
 * Génère des données de graphique mockées
 * Note: Le format de date doit être ISO (YYYY-MM-DD) pour être cohérent
 * avec les données réelles de l'API et éviter les problèmes de parsing
 */
export function generateMockChartData(
  timeRange: '24h' | '7d' | '30d' | '90d'
): Array<{ date: string; value: number }> {
  const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

  return Array.from({ length: days }, (_, i) => {
    const date = new Date();

    if (timeRange === '24h') {
      // Pour 24h, on génère des heures du jour actuel
      date.setHours(date.getHours() - (days - i - 1));
      return {
        // Format ISO pour les heures: YYYY-MM-DDTHH:00
        date: date.toISOString().slice(0, 13) + ':00',
        value: Math.floor(Math.random() * 100) + 50,
      };
    } else {
      // Pour les autres périodes, on génère des jours
      date.setDate(date.getDate() - (days - i - 1));
      return {
        // Format ISO pour les jours: YYYY-MM-DD (cohérent avec l'API)
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 100) + 50,
      };
    }
  });
}

/**
 * Log le mode de données au chargement (pour debug)
 */
export function logDataMode() {
  const mode = getDataMode();
  const emoji = mode === 'mock' ? '🎭' : '📊';
  console.log(`${emoji} PWA Data Mode: ${mode.toUpperCase()}`);
}

// ============================================
// MOCK DATA GENERATORS FOR ADMIN ANALYTICS
// ============================================

/**
 * Génère un nombre aléatoire dans une plage avec variation réaliste
 */
function randomInRange(min: number, max: number, variance = 0.3): number {
  const base = Math.random() * (max - min) + min;
  const variation = (Math.random() - 0.5) * variance * base;
  return Math.max(0, Math.floor(base + variation));
}

/**
 * Génère des données de visites brutes mockées pour le mode temps réel
 * Retourne des visites individuelles avec timestamps
 */
export function generateMockRawVisits(
  startDate?: string,
  endDate?: string
): Array<{ timestamp: string; sessionId: string; page: string }> {
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getTime() - 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : now;
  const data: Array<{ timestamp: string; sessionId: string; page: string }> = [];

  const pages = ['/', '/a-propos', '/services', '/contact', '/blog', '/seminaires', '/faq'];

  // Générer entre 5 et 20 visites dans la dernière heure
  const numVisits = randomInRange(5, 20);

  for (let i = 0; i < numVisits; i++) {
    const visitTime = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    data.push({
      timestamp: visitTime.toISOString(),
      sessionId: `session-${Date.now()}-${i}`,
      page: pages[Math.floor(Math.random() * pages.length)],
    });
  }

  return data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Génère des données de visites mockées pour une période donnée.
 *
 * IMPORTANT: Le champ `period` DOIT être un timestamp ISO-8601 complet
 * (ex: "2026-02-19T00:00:00.000Z") pour être compatible avec le frontend
 * (chartDateUtils.ts) qui le parse via `new Date(visit.period)`.
 *
 * Les anciens formats ("2026-W08", "2026-02", "2026") ne sont PAS parsables
 * par `new Date()` et provoquaient des graphiques à zéro en mode simulation.
 *
 * Le format doit correspondre exactement à ce que retourne PostgreSQL via
 * `date_trunc()` : un timestamp tronqué au début de la période (jour, lundi
 * de la semaine, 1er du mois, 1er janvier).
 */
export function generateMockVisits(
  timeRange: 'day' | 'week' | 'month' | 'year',
  customStartDate?: string,
  customEndDate?: string
): Array<{ period: string; visits: number; sessions: number }> {
  const now = new Date();
  const data: Array<{ period: string; visits: number; sessions: number }> = [];

  if (timeRange === 'day') {
    // Daily buckets: midnight UTC for each of the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)
      );
      data.push({
        period: date.toISOString(),
        visits: randomInRange(80, 150),
        sessions: randomInRange(60, 120),
      });
    }
  } else if (timeRange === 'week') {
    // Weekly buckets: Monday at midnight UTC (ISO week start, matches date_trunc('week'))
    for (let i = 11; i >= 0; i--) {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i * 7)
      );
      // Align to Monday (ISO week start)
      const dayOfWeek = date.getUTCDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      date.setUTCDate(date.getUTCDate() + diff);
      date.setUTCHours(0, 0, 0, 0);
      data.push({
        period: date.toISOString(),
        visits: randomInRange(400, 800),
        sessions: randomInRange(300, 650),
      });
    }
  } else if (timeRange === 'month') {
    // Monthly buckets: 1st of each month at midnight UTC (matches date_trunc('month'))
    for (let i = 11; i >= 0; i--) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      data.push({
        period: date.toISOString(),
        visits: randomInRange(1500, 3000),
        sessions: randomInRange(1200, 2500),
      });
    }
  } else {
    // Yearly buckets: January 1st at midnight UTC (matches date_trunc('year'))
    for (let i = 9; i >= 0; i--) {
      const date = new Date(Date.UTC(now.getUTCFullYear() - i, 0, 1));
      data.push({
        period: date.toISOString(),
        visits: randomInRange(15000, 30000),
        sessions: randomInRange(12000, 25000),
      });
    }
  }

  return data;
}

/**
 * Génère un résumé d'analytics mocké
 */
export function generateMockSummary() {
  const sections = [
    'Accueil',
    'À propos',
    'Services - Sophrologie individuelle',
    'Services - Sophrologie de couple',
    'Services - Thérapie transpersonnelle',
    'Services - Somatothérapie',
    'Blog',
    'Contact',
    'Séminaires',
    'FAQ',
  ];

  return {
    totalVisits: randomInRange(500, 1200),
    uniqueSessions: randomInRange(400, 1000),
    averageTimeOnSite: randomInRange(120000, 300000), // 2-5 minutes in ms
    conversionRate: Math.random() * 3 + 1, // 1-4%
    topSections: sections.map(section => ({
      section,
      avgTime: randomInRange(30000, 180000), // 30s - 3min
      visits: randomInRange(50, 300),
    })),
    conversionByType: {
      appointment_request: {
        clicks: randomInRange(50, 150),
        completed: randomInRange(10, 50),
        rate: Math.random() * 30 + 10, // 10-40%
      },
      seminar_registration: {
        clicks: randomInRange(20, 80),
        completed: randomInRange(5, 30),
        rate: Math.random() * 25 + 15, // 15-40%
      },
      contact_form: {
        clicks: randomInRange(30, 100),
        completed: randomInRange(8, 40),
        rate: Math.random() * 30 + 15, // 15-45%
      },
    },
  };
}

/**
 * Génère des données de comparaison mockées
 */
export function generateMockComparison() {
  const current = {
    totalVisits: randomInRange(500, 1200),
    uniqueSessions: randomInRange(400, 1000),
    averageTimeOnSite: randomInRange(120000, 300000),
    conversionRate: Math.random() * 3 + 1,
  };

  const previous = {
    totalVisits: randomInRange(450, 1150),
    uniqueSessions: randomInRange(380, 950),
    averageTimeOnSite: randomInRange(110000, 280000),
    conversionRate: Math.random() * 3 + 0.8,
  };

  return {
    current,
    previous,
    comparison: {
      totalVisitsChange:
        ((current.totalVisits - previous.totalVisits) / previous.totalVisits) * 100,
      uniqueSessionsChange:
        ((current.uniqueSessions - previous.uniqueSessions) / previous.uniqueSessions) * 100,
      averageTimeOnSiteChange:
        ((current.averageTimeOnSite - previous.averageTimeOnSite) / previous.averageTimeOnSite) *
        100,
      conversionRateChange:
        ((current.conversionRate - previous.conversionRate) / previous.conversionRate) * 100,
    },
  };
}

/**
 * Génère des données de heatmap mockées
 */
export function generateMockHeatmap() {
  const sections = [
    'Accueil',
    'À propos',
    'Services - Sophrologie individuelle',
    'Services - Sophrologie de couple',
    'Services - Thérapie transpersonnelle',
    'Services - Somatothérapie',
    'Blog',
    'Contact',
    'Séminaires',
    'FAQ',
  ];

  return sections.map(section => ({
    section,
    visitors: randomInRange(50, 300),
    avgTimeSeconds: randomInRange(30, 180),
    scrollRate: Math.random() * 40 + 60, // 60-100%
    conversionsFromSection: randomInRange(2, 25),
    conversionsByType: {
      appointment_request: {
        count: randomInRange(1, 10),
        type: 'appointment_request' as const,
      },
      seminar_registration: {
        count: randomInRange(0, 8),
        type: 'seminar_registration' as const,
      },
      contact_form: {
        count: randomInRange(1, 7),
        type: 'contact_form' as const,
      },
    },
  }));
}

/**
 * Génère des sources de trafic mockées
 */
export function generateMockTrafficSources() {
  const sources = [
    { source: 'google', medium: 'organic' },
    { source: 'direct', medium: '(none)' },
    { source: 'facebook', medium: 'social' },
    { source: 'instagram', medium: 'social' },
    { source: 'linkedin', medium: 'social' },
    { source: 'google', medium: 'cpc' },
    { source: 'newsletter', medium: 'email' },
    { source: 'psychologies.com', medium: 'referral' },
    { source: 'passeportsante.net', medium: 'referral' },
  ];

  return sources.map(({ source, medium }) => ({
    source,
    medium,
    visits: randomInRange(20, 200),
    uniqueSessions: randomInRange(15, 180),
    conversionRate: Math.random() * 5 + 0.5, // 0.5-5.5%
  }));
}

/**
 * Génère des données d'appareils mockées
 */
export function generateMockDeviceData() {
  return [
    {
      deviceType: 'desktop',
      visits: randomInRange(300, 600),
      uniqueSessions: randomInRange(250, 550),
      avgTimeOnSite: randomInRange(150000, 350000), // 2.5-5.8 min
    },
    {
      deviceType: 'mobile',
      visits: randomInRange(200, 500),
      uniqueSessions: randomInRange(180, 450),
      avgTimeOnSite: randomInRange(90000, 200000), // 1.5-3.3 min
    },
    {
      deviceType: 'tablet',
      visits: randomInRange(50, 150),
      uniqueSessions: randomInRange(40, 130),
      avgTimeOnSite: randomInRange(120000, 250000), // 2-4.2 min
    },
  ];
}

/**
 * Génère des données complètes de dashboard mockées
 */
export function generateMockDashboardData(
  timeRange: 'day' | 'week' | 'month' | 'year' | 'hour' = 'day',
  customStartDate?: string,
  customEndDate?: string
) {
  // Pour le mode temps réel (hour), retourner des visites brutes avec timestamps
  const isRealtimeMode = timeRange === 'hour';

  return {
    summary: generateMockSummary(),
    comparison: generateMockComparison(),
    visits: isRealtimeMode
      ? generateMockRawVisits(customStartDate, customEndDate)
      : generateMockVisits(
          timeRange as 'day' | 'week' | 'month' | 'year',
          customStartDate,
          customEndDate
        ),
    heatmap: generateMockHeatmap(),
    trafficSources: generateMockTrafficSources(),
    deviceBreakdown: generateMockDeviceData(),
  };
}

// ============================================
// MOCK DATA GENERATORS FOR BLOG ANALYTICS
// ============================================

/**
 * Liste des slugs d'articles de blog réels du site Appréciez Votre Vie
 */
const BLOG_ARTICLE_SLUGS = [
  'comprendre-somatothérapie-ericksonienne',
  'comprendre-psychotherapie-transpersonnelle',
  'comprendre-pourquoi-psychotherapie',
  'comprendre-fonctionnement-psychotherapie',
  'traverser-choisir-therapeute',
  'traverser-anxiete-angoisse-stress',
  'comprendre-traumatismes-psychiques-guerir',
  'comprendre-mecanismes-defense',
  'comprendre-corps-emotions-corps',
  'decouvrir-etats-modifies-conscience',
  'decouvrir-respiration-holotropique',
  'comprendre-stress-travail-apport',
  'comprendre-blessures-attachement',
  'comprendre-crise-de-vie',
  'comprendre-deuil-traspersonnel',
  'traverser-un-deuil',
  'traverser-commencer-psychotherapie',
  'decouvrir-enfant-interieur',
  'cheminer-apres-psychotherapie',
  'traverser-accueillir-emotions',
];

/**
 * Génère des statistiques mockées pour les articles de blog
 */
export function generateMockBlogAnalytics() {
  const articles = BLOG_ARTICLE_SLUGS.map(slug => {
    const views = randomInRange(50, 500);
    const uniqueVisitors = randomInRange(30, Math.min(views, 400));

    return {
      slug,
      views,
      uniqueVisitors,
      averageViews: (views / uniqueVisitors).toFixed(2),
      lastViewed: new Date(Date.now() - randomInRange(0, 7 * 24 * 60 * 60 * 1000)).toISOString(),
    };
  }).sort((a, b) => b.views - a.views);

  const totalViews = articles.reduce((sum, article) => sum + article.views, 0);
  const allUniqueSessions = new Set(
    articles.flatMap(a =>
      Array.from({ length: a.uniqueVisitors }, (_, i) => `${a.slug}-session-${i}`)
    )
  );

  return {
    articles,
    totalViews,
    totalUniqueVisitors: allUniqueSessions.size,
  };
}

/**
 * Génère des statistiques mockées pour un article de blog spécifique
 */
export function generateMockBlogArticleStats(slug: string) {
  const views = randomInRange(50, 500);
  const uniqueVisitors = randomInRange(30, Math.min(views, 400));

  return {
    slug,
    views,
    uniqueVisitors,
    lastViewed: new Date(Date.now() - randomInRange(0, 7 * 24 * 60 * 60 * 1000)).toISOString(),
  };
}

/**
 * Génère des statistiques mockées pour les clics FAQ
 */
export function generateMockFaqClicks(articleSlug?: string) {
  const faqQuestions = [
    "Qu'est-ce que l'somatothérapie ?",
    'Combien de séances sont nécessaires ?',
    'La sophrologie et relaxation est-elle pour moi ?',
    'Comment se déroule une première séance ?',
    'Quelle est la différence avec la psychanalyse ?',
    'Est-ce remboursé par la sécurité sociale ?',
    'Peut-on faire de la thérapie en ligne ?',
    'Comment choisir son thérapeute ?',
    'Combien de temps dure une séance ?',
    'À quelle fréquence consulter ?',
  ];

  const slugsToUse = articleSlug ? [articleSlug] : BLOG_ARTICLE_SLUGS.slice(0, 10);

  const clicks = slugsToUse.flatMap(slug =>
    Array.from({ length: randomInRange(5, 30) }, (_, i) => {
      const faqIndex = randomInRange(0, 4);
      return {
        faqId: `${slug}-${faqIndex}`,
        articleSlug: slug,
        faqIndex,
        question: faqQuestions[faqIndex] || `Question FAQ ${faqIndex}`,
        timestamp: new Date(Date.now() - randomInRange(0, 30 * 24 * 60 * 60 * 1000)).toISOString(),
      };
    })
  );

  // Construire le résumé par faqId
  const summary: Record<string, { opens: number; closes: number }> = {};
  clicks.forEach(click => {
    if (!summary[click.faqId]) {
      summary[click.faqId] = { opens: 0, closes: 0 };
    }
    summary[click.faqId].opens += 1;
  });

  return {
    clicks: clicks.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    summary,
  };
}

/**
 * Génère des statistiques mockées pour les clics CTA
 */
export function generateMockCtaClicks(articleSlug?: string) {
  const ctaTypes = ['appointment', 'seminar'] as const;
  const slugsToUse = articleSlug ? [articleSlug] : BLOG_ARTICLE_SLUGS.slice(0, 15);

  const clicks = slugsToUse.flatMap(slug => {
    const appointmentClicks = randomInRange(2, 15);
    const seminarClicks = randomInRange(1, 10);

    return [
      ...Array.from({ length: appointmentClicks }, () => ({
        type: 'appointment' as const,
        articleSlug: slug,
        timestamp: new Date(Date.now() - randomInRange(0, 30 * 24 * 60 * 60 * 1000)).toISOString(),
      })),
      ...Array.from({ length: seminarClicks }, () => ({
        type: 'seminar' as const,
        articleSlug: slug,
        timestamp: new Date(Date.now() - randomInRange(0, 30 * 24 * 60 * 60 * 1000)).toISOString(),
      })),
    ];
  });

  const summary = {
    appointment: clicks.filter(c => c.type === 'appointment').length,
    seminar: clicks.filter(c => c.type === 'seminar').length,
  };

  return {
    clicks: clicks.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    summary,
  };
}

/**
 * Génère des statistiques complètes de blog mockées
 */
export function generateMockCompleteBlogStats() {
  return {
    analytics: generateMockBlogAnalytics(),
    faqClicks: generateMockFaqClicks(),
    ctaClicks: generateMockCtaClicks(),
  };
}

// ============================================
// MOCK DATA GENERATORS FOR GEOLOCATION
// ============================================

/**
 * Données de localisation réalistes pour la France et pays francophones
 */
const MOCK_LOCATIONS = [
  // France - Principales régions
  {
    country: 'France',
    countryCode: 'FR',
    region: 'Île-de-France',
    regionCode: 'IDF',
    city: 'Paris',
    lat: 48.8566,
    lon: 2.3522,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: 'Île-de-France',
    regionCode: 'IDF',
    city: 'Versailles',
    lat: 48.8014,
    lon: 2.1301,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: "Provence-Alpes-Côte d'Azur",
    regionCode: 'PAC',
    city: 'Marseille',
    lat: 43.2965,
    lon: 5.3698,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: "Provence-Alpes-Côte d'Azur",
    regionCode: 'PAC',
    city: 'Nice',
    lat: 43.7102,
    lon: 7.262,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: 'Auvergne-Rhône-Alpes',
    regionCode: 'ARA',
    city: 'Lyon',
    lat: 45.764,
    lon: 4.8357,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: 'Auvergne-Rhône-Alpes',
    regionCode: 'ARA',
    city: 'Grenoble',
    lat: 45.1885,
    lon: 5.7245,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: 'Occitanie',
    regionCode: 'OCC',
    city: 'Toulouse',
    lat: 43.6047,
    lon: 1.4442,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: 'Occitanie',
    regionCode: 'OCC',
    city: 'Montpellier',
    lat: 43.6108,
    lon: 3.8767,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: 'Nouvelle-Aquitaine',
    regionCode: 'NAQ',
    city: 'Bordeaux',
    lat: 44.8378,
    lon: -0.5792,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: 'Pays de la Loire',
    regionCode: 'PDL',
    city: 'Nantes',
    lat: 47.2184,
    lon: -1.5536,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: 'Grand Est',
    regionCode: 'GES',
    city: 'Strasbourg',
    lat: 48.5734,
    lon: 7.7521,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: 'Hauts-de-France',
    regionCode: 'HDF',
    city: 'Lille',
    lat: 50.6292,
    lon: 3.0573,
    timezone: 'Europe/Paris',
  },
  {
    country: 'France',
    countryCode: 'FR',
    region: 'Bretagne',
    regionCode: 'BRE',
    city: 'Rennes',
    lat: 48.1173,
    lon: -1.6778,
    timezone: 'Europe/Paris',
  },

  // Belgique
  {
    country: 'Belgique',
    countryCode: 'BE',
    region: 'Bruxelles-Capitale',
    regionCode: 'BRU',
    city: 'Bruxelles',
    lat: 50.8503,
    lon: 4.3517,
    timezone: 'Europe/Brussels',
  },
  {
    country: 'Belgique',
    countryCode: 'BE',
    region: 'Flandre',
    regionCode: 'VLG',
    city: 'Anvers',
    lat: 51.2194,
    lon: 4.4025,
    timezone: 'Europe/Brussels',
  },
  {
    country: 'Belgique',
    countryCode: 'BE',
    region: 'Wallonie',
    regionCode: 'WAL',
    city: 'Liège',
    lat: 50.6326,
    lon: 5.5797,
    timezone: 'Europe/Brussels',
  },

  // Suisse
  {
    country: 'Suisse',
    countryCode: 'CH',
    region: 'Genève',
    regionCode: 'GE',
    city: 'Genève',
    lat: 46.2044,
    lon: 6.1432,
    timezone: 'Europe/Zurich',
  },
  {
    country: 'Suisse',
    countryCode: 'CH',
    region: 'Vaud',
    regionCode: 'VD',
    city: 'Lausanne',
    lat: 46.5197,
    lon: 6.6323,
    timezone: 'Europe/Zurich',
  },
  {
    country: 'Suisse',
    countryCode: 'CH',
    region: 'Zürich',
    regionCode: 'ZH',
    city: 'Zürich',
    lat: 47.3769,
    lon: 8.5417,
    timezone: 'Europe/Zurich',
  },

  // Canada (francophone)
  {
    country: 'Canada',
    countryCode: 'CA',
    region: 'Québec',
    regionCode: 'QC',
    city: 'Montréal',
    lat: 45.5017,
    lon: -73.5673,
    timezone: 'America/Montreal',
  },
  {
    country: 'Canada',
    countryCode: 'CA',
    region: 'Québec',
    regionCode: 'QC',
    city: 'Québec',
    lat: 46.8139,
    lon: -71.208,
    timezone: 'America/Montreal',
  },

  // Autres pays
  {
    country: 'Luxembourg',
    countryCode: 'LU',
    region: 'Luxembourg',
    regionCode: 'LU',
    city: 'Luxembourg',
    lat: 49.6116,
    lon: 6.1319,
    timezone: 'Europe/Luxembourg',
  },
  {
    country: 'Maroc',
    countryCode: 'MA',
    region: 'Casablanca-Settat',
    regionCode: 'CS',
    city: 'Casablanca',
    lat: 33.5731,
    lon: -7.5898,
    timezone: 'Africa/Casablanca',
  },
  {
    country: 'Sénégal',
    countryCode: 'SN',
    region: 'Dakar',
    regionCode: 'DK',
    city: 'Dakar',
    lat: 14.7167,
    lon: -17.4677,
    timezone: 'Africa/Dakar',
  },
];

/**
 * ISP français et francophones
 */
const MOCK_ISPS = [
  'Orange',
  'Free',
  'SFR',
  'Bouygues Telecom',
  'OVH',
  'Proximus (Belgique)',
  'Swisscom',
  'Videotron (Canada)',
  'Bell Canada',
];

/**
 * Génère des données de géolocalisation mockées
 */
export function generateMockGeolocationData() {
  // Nombre de visiteurs total
  const totalVisitors = randomInRange(200, 800);

  // Générer les visiteurs individuels
  const visitors = Array.from({ length: totalVisitors }, (_, i) => {
    const location = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];
    const isp = MOCK_ISPS[Math.floor(Math.random() * MOCK_ISPS.length)];

    return {
      id: `visitor-${i}`,
      sessionId: `session-${i}`,
      timestamp: new Date(Date.now() - randomInRange(0, 30 * 24 * 60 * 60 * 1000)).toISOString(),
      country: location.country,
      countryCode: location.countryCode,
      region: location.region,
      regionCode: location.regionCode,
      city: location.city,
      latitude: location.lat,
      longitude: location.lon,
      timezone: location.timezone,
      isp,
    };
  });

  // Agréger par pays
  const byCountry: Record<string, { count: number; percentage: number; countryCode: string }> = {};
  visitors.forEach(v => {
    if (!byCountry[v.country]) {
      byCountry[v.country] = { count: 0, percentage: 0, countryCode: v.countryCode };
    }
    byCountry[v.country].count++;
  });

  // Calculer les pourcentages
  Object.keys(byCountry).forEach(country => {
    byCountry[country].percentage = (byCountry[country].count / totalVisitors) * 100;
  });

  // Agréger par ville
  const byCity: Record<
    string,
    {
      count: number;
      percentage: number;
      country: string;
      countryCode: string;
      regionCode: string;
      latitude: number;
      longitude: number;
    }
  > = {};
  visitors.forEach(v => {
    const key = `${v.city}, ${v.country}`;
    if (!byCity[key]) {
      byCity[key] = {
        count: 0,
        percentage: 0,
        country: v.country,
        countryCode: v.countryCode,
        regionCode: v.regionCode,
        latitude: v.latitude,
        longitude: v.longitude,
      };
    }
    byCity[key].count++;
  });

  // Calculer les pourcentages pour les villes
  Object.keys(byCity).forEach(city => {
    byCity[city].percentage = (byCity[city].count / totalVisitors) * 100;
  });

  // Top 10 villes
  const topCities = Object.entries(byCity)
    .map(([city, data]) => ({
      city,
      ...data,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Agréger par région
  const byRegion: Record<string, { count: number; percentage: number; country: string }> = {};
  visitors.forEach(v => {
    const key = `${v.region}, ${v.country}`;
    if (!byRegion[key]) {
      byRegion[key] = { count: 0, percentage: 0, country: v.country };
    }
    byRegion[key].count++;
  });

  Object.keys(byRegion).forEach(region => {
    byRegion[region].percentage = (byRegion[region].count / totalVisitors) * 100;
  });

  return {
    totalVisitors,
    visitors,
    byCountry: Object.entries(byCountry)
      .map(([country, data]) => ({
        country,
        ...data,
      }))
      .sort((a, b) => b.count - a.count),
    byRegion: Object.entries(byRegion)
      .map(([region, data]) => ({
        region,
        ...data,
      }))
      .sort((a, b) => b.count - a.count),
    topCities,
  };
}
