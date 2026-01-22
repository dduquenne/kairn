// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * ============================================================================
 * REGISTRE CENTRALISÉ DES ENDPOINTS API
 * ============================================================================
 *
 * Ce fichier documente et centralise tous les endpoints API du projet.
 * Il sert de référence unique pour:
 * - Les routes API disponibles
 * - Les méthodes HTTP supportées
 * - Les paramètres requis
 * - L'authentification nécessaire
 * - Les cas d'usage
 *
 * Utilisation:
 * - import { API_ROUTES, getApiUrl } from '@/lib/config'
 * - const url = getApiUrl('blog', 'generateImage')
 *
 * @module lib/config/api
 * @version 1.0.0
 * @date 2025-12-08
 */

/**
 * REGISTRE DES ENDPOINTS API PAR DOMAINE
 */
export const API_ROUTES = {
  // ========================================================================
  // BLOG - Gestion du contenu blog
  // ========================================================================
  blog: {
    // Generate article content via Claude
    generateArticle: {
      path: '/api/blog/generate',
      method: 'POST',
      description: 'Générer le contenu d\'un article via Claude AI',
      authenticated: true,
      params: {
        title: 'Titre de l\'article',
        category: 'Catégorie (Comprendre, Traverser, Découvrir, Cheminer)',
        seoIntent: 'Intention SEO',
        persona: 'Persona lecteur',
        tags: 'Tags (array)',
      },
    },

    // Generate image prompt for article
    generatePrompt: {
      path: '/api/blog/generate-prompt',
      method: 'POST',
      description: 'Générer un prompt image via Claude AI',
      authenticated: true,
      params: {
        title: 'Titre de l\'article',
        content: 'Contenu de l\'article',
        category: 'Catégorie',
        tags: 'Tags (array)',
        seoIntent: 'Intention SEO',
        persona: 'Persona lecteur',
        tones: 'Tons (array)',
      },
    },

    // Generate images from prompt
    generateImage: {
      path: '/api/blog/generate-image',
      method: 'POST',
      description: 'Générer des images via DALL-E 3',
      authenticated: true,
      params: {
        prompt: 'Prompt image',
        quantity: 'Nombre d\'images (1-3)',
      },
    },

    // Upload custom image
    uploadImage: {
      path: '/api/blog/upload-image',
      method: 'POST',
      description: 'Télécharger une image personnalisée',
      authenticated: true,
      params: {
        file: 'Fichier image (FormData)',
        filename: 'Nom du fichier',
      },
    },

    // Confirm image selection for article
    confirmImageSelection: {
      path: '/api/blog/confirm-image-selection',
      method: 'POST',
      description: 'Confirmer la sélection d\'une image pour un article',
      authenticated: true,
      params: {
        articleId: 'ID de l\'article',
        imageUrl: 'URL de l\'image sélectionnée',
      },
    },

    // Improve article text
    improveText: {
      path: '/api/blog/improve-text',
      method: 'POST',
      description: 'Améliorer un texte via Claude AI',
      authenticated: true,
      params: {
        text: 'Texte à améliorer',
        tone: 'Ton souhaité',
      },
    },

    // Get all blog posts
    getAllPosts: {
      path: '/api/blog/posts',
      method: 'GET',
      description: 'Récupérer tous les articles de blog',
      authenticated: false,
    },

    // Get analytics for blog
    getAnalytics: {
      path: '/api/blog/analytics',
      method: 'GET',
      description: 'Récupérer les statistiques du blog',
      authenticated: true,
    },

    // Track CTA clicks
    trackCtaClick: {
      path: '/api/blog/cta-clicks',
      method: 'POST',
      description: 'Enregistrer un clic sur CTA',
      authenticated: false,
      params: {
        slug: 'Slug de l\'article',
        ctaType: 'Type de CTA',
      },
    },

    // Track FAQ clicks
    trackFaqClick: {
      path: '/api/blog/faq-clicks',
      method: 'POST',
      description: 'Enregistrer un clic sur question FAQ',
      authenticated: false,
      params: {
        slug: 'Slug de l\'article',
        question: 'Question cliquée',
      },
    },
  },

  // ========================================================================
  // ANALYTICS - Suivi et métriques
  // ========================================================================
  analytics: {
    // Get section time analytics
    getSectionTime: {
      path: '/api/analytics/section-time',
      method: 'GET',
      description: 'Récupérer les temps passés par section',
      authenticated: true,
    },

    // Get trends
    getTrends: {
      path: '/api/analytics/trends',
      method: 'GET',
      description: 'Récupérer les tendances',
      authenticated: true,
    },

    // Purge analytics data
    purgeData: {
      path: '/api/analytics/purge',
      method: 'DELETE',
      description: 'Supprimer les données d\'analytics',
      authenticated: true,
    },
  },

  // ========================================================================
  // AUTHENTICATION - Gestion de l'authentification
  // ========================================================================
  auth: {
    // Login
    login: {
      path: '/api/auth/login',
      method: 'POST',
      description: 'Se connecter',
      authenticated: false,
      params: {
        email: 'Email de l\'utilisateur',
        password: 'Mot de passe',
      },
    },

    // Logout
    logout: {
      path: '/api/auth/logout',
      method: 'POST',
      description: 'Se déconnecter',
      authenticated: true,
    },

    // Reset password
    forgotPassword: {
      path: '/api/auth/forgot-password',
      method: 'POST',
      description: 'Demander la réinitialisation du mot de passe',
      authenticated: false,
      params: {
        email: 'Email de l\'utilisateur',
      },
    },
  },

  // ========================================================================
  // SEMINARS - Gestion des séminaires
  // ========================================================================
  seminars: {
    // Get all seminars
    getAll: {
      path: '/api/seminars',
      method: 'GET',
      description: 'Récupérer tous les séminaires',
      authenticated: false,
    },

    // Create registration
    register: {
      path: '/api/registrations',
      method: 'POST',
      description: 'S\'inscrire à un séminaire',
      authenticated: false,
      params: {
        seminarId: 'ID du séminaire',
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Email',
        phone: 'Téléphone',
      },
    },
  },

  // ========================================================================
  // CONTACT - Formulaires de contact
  // ========================================================================
  contact: {
    // Send contact message
    sendMessage: {
      path: '/api/contact',
      method: 'POST',
      description: 'Envoyer un message de contact',
      authenticated: false,
      params: {
        name: 'Nom complet',
        email: 'Email',
        message: 'Message',
      },
    },
  },

  // ========================================================================
  // ADMIN - Routes administrateur
  // ========================================================================
  admin: {
    // User management
    users: {
      getAll: {
        path: '/api/admin/users',
        method: 'GET',
        description: 'Récupérer tous les utilisateurs',
        authenticated: true,
      },
      getById: {
        path: '/api/admin/users/[id]',
        method: 'GET',
        description: 'Récupérer un utilisateur par ID',
        authenticated: true,
      },
      resetPassword: {
        path: '/api/admin/users/[id]/reset-password',
        method: 'POST',
        description: 'Réinitialiser le mot de passe d\'un utilisateur',
        authenticated: true,
      },
    },

    // Testimonials management
    testimonials: {
      getAll: {
        path: '/api/testimonials',
        method: 'GET',
        description: 'Récupérer tous les témoignages',
        authenticated: true,
      },
      create: {
        path: '/api/testimonials',
        method: 'POST',
        description: 'Créer un témoignage',
        authenticated: true,
      },
    },
  },

  // ========================================================================
  // ASSISTANT - IA Assistant
  // ========================================================================
  assistant: {
    // Chat with AI assistant
    chat: {
      path: '/api/assistant',
      method: 'POST',
      description: 'Converser avec l\'assistant IA',
      authenticated: false,
      params: {
        message: 'Message à envoyer',
        threadId: 'ID du thread (optionnel)',
      },
    },
  },
} as const;

/**
 * TYPE POUR LES ROUTES API
 */
export type ApiRoute = typeof API_ROUTES;

/**
 * Obtient l'URL complète d'un endpoint API
 * @param domain - Domaine API (ex: 'blog', 'analytics', 'auth')
 * @param endpoint - Endpoint spécifique (ex: 'generateArticle', 'getAll')
 * @param baseUrl - URL de base (défaut: '')
 * @returns URL complète de l'API
 *
 * @example
 * // Returns '/api/blog/generate'
 * getApiUrl('blog', 'generateArticle')
 *
 * @example
 * // Returns 'https://psypnos.fr/api/blog/posts'
 * getApiUrl('blog', 'getAllPosts', 'https://psypnos.fr')
 */
export function getApiUrl(
  domain: keyof ApiRoute,
  endpoint: string,
  baseUrl: string = ''
): string {
  const domainRoutes = API_ROUTES[domain] as any;
  const route = domainRoutes?.[endpoint];

  if (!route) {
    console.warn(`API endpoint not found: ${domain}.${endpoint}`);
    return '';
  }

  const path = route.path;
  return baseUrl ? `${baseUrl}${path}` : path;
}

/**
 * Récupère la documentation d'un endpoint API
 * @param domain - Domaine API
 * @param endpoint - Endpoint spécifique
 * @returns Documentation de l'endpoint
 *
 * @example
 * const doc = getApiDocumentation('blog', 'generateArticle');
 * console.log(doc.description); // 'Générer le contenu d'un article via Claude AI'
 */
export function getApiDocumentation(domain: keyof ApiRoute, endpoint: string) {
  const domainRoutes = API_ROUTES[domain] as any;
  const route = domainRoutes?.[endpoint];

  if (!route) {
    return null;
  }

  return {
    path: route.path,
    method: route.method,
    description: route.description,
    authenticated: route.authenticated,
    params: route.params || {},
  };
}

/**
 * Liste tous les endpoints API d'un domaine
 * @param domain - Domaine API
 * @returns Array d'endpoints
 *
 * @example
 * const blogEndpoints = getApiEndpoints('blog');
 * blogEndpoints.forEach(ep => console.log(ep.path));
 */
export function getApiEndpoints(domain: keyof ApiRoute) {
  const domainRoutes = API_ROUTES[domain] as any;
  const endpoints = [];

  for (const [key, value] of Object.entries(domainRoutes)) {
    if (typeof value === 'object' && value !== null && 'path' in value) {
      endpoints.push({
        name: key,
        ...value,
      });
    }
  }

  return endpoints;
}

/**
 * Vérifie si un endpoint nécessite l'authentification
 * @param domain - Domaine API
 * @param endpoint - Endpoint spécifique
 * @returns true si authentification requise, false sinon
 */
export function requiresAuthentication(domain: keyof ApiRoute, endpoint: string): boolean {
  const domainRoutes = API_ROUTES[domain] as any;
  const route = domainRoutes?.[endpoint];
  return route?.authenticated ?? false;
}
