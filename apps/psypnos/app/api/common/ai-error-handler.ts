/**
 * Gestion centralisée des erreurs IA (Anthropic, OpenAI)
 *
 * Classifie les erreurs SDK en catégories actionnables
 * et fournit des messages utilisateur en français.
 */

export type AIErrorType =
  | 'auth'
  | 'rate_limit'
  | 'model_not_found'
  | 'overloaded'
  | 'timeout'
  | 'content_filter'
  | 'invalid_request'
  | 'network'
  | 'config'
  | 'unknown';

export interface AIErrorInfo {
  type: AIErrorType;
  userMessage: string;
  technicalDetail: string;
  retryable: boolean;
  httpStatus: number;
}

/**
 * Classifie une erreur provenant du SDK Anthropic ou OpenAI
 * et retourne un objet structuré avec message utilisateur en français.
 */
export function classifyAIError(error: unknown): AIErrorInfo {
  if (!error) {
    return {
      type: 'unknown',
      userMessage: 'Une erreur inconnue est survenue.',
      technicalDetail: 'Error object is null/undefined',
      retryable: false,
      httpStatus: 500,
    };
  }

  const statusCode = extractStatusCode(error);
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (
    statusCode === 401 ||
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('api key') ||
    lowerMessage.includes('unauthorized')
  ) {
    return {
      type: 'auth',
      userMessage:
        "La clé API Anthropic est invalide ou expirée. Contactez l'administrateur pour vérifier la configuration.",
      technicalDetail: message,
      retryable: false,
      httpStatus: 401,
    };
  }

  if (
    statusCode === 429 ||
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('rate_limit')
  ) {
    return {
      type: 'rate_limit',
      userMessage:
        'Le service IA est temporairement surchargé (limite de requêtes atteinte). Réessayez dans quelques minutes.',
      technicalDetail: message,
      retryable: true,
      httpStatus: 429,
    };
  }

  if (
    statusCode === 404 ||
    lowerMessage.includes('not_found') ||
    (lowerMessage.includes('model') && lowerMessage.includes('not found'))
  ) {
    return {
      type: 'model_not_found',
      userMessage:
        "Le modèle IA configuré est introuvable. Contactez l'administrateur pour mettre à jour la configuration.",
      technicalDetail: message,
      retryable: false,
      httpStatus: 500,
    };
  }

  if (statusCode === 529 || lowerMessage.includes('overloaded') || lowerMessage.includes('529')) {
    return {
      type: 'overloaded',
      userMessage:
        'Le service IA (Anthropic) est temporairement surchargé. Réessayez dans quelques minutes.',
      technicalDetail: message,
      retryable: true,
      httpStatus: 503,
    };
  }

  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('etimedout') ||
    lowerMessage.includes('timed out')
  ) {
    return {
      type: 'timeout',
      userMessage:
        'La génération a pris trop de temps et a été interrompue. Réessayez ou essayez avec un contenu plus court.',
      technicalDetail: message,
      retryable: true,
      httpStatus: 504,
    };
  }

  if (
    lowerMessage.includes('content_policy') ||
    lowerMessage.includes('safety') ||
    lowerMessage.includes('content filter')
  ) {
    return {
      type: 'content_filter',
      userMessage:
        "Le contenu a été bloqué par le filtre de sécurité de l'IA. Reformulez votre demande.",
      technicalDetail: message,
      retryable: false,
      httpStatus: 400,
    };
  }

  if (
    statusCode === 400 ||
    lowerMessage.includes('invalid_request') ||
    lowerMessage.includes('validation')
  ) {
    return {
      type: 'invalid_request',
      userMessage:
        "La requête envoyée au service IA est invalide. Si le problème persiste, contactez l'administrateur.",
      technicalDetail: message,
      retryable: false,
      httpStatus: 400,
    };
  }

  if (
    lowerMessage.includes('econnreset') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('enetunreach') ||
    lowerMessage.includes('fetch failed')
  ) {
    return {
      type: 'network',
      userMessage:
        'Impossible de contacter le service IA (erreur réseau). Vérifiez votre connexion et réessayez.',
      technicalDetail: message,
      retryable: true,
      httpStatus: 502,
    };
  }

  if (statusCode && statusCode >= 500) {
    return {
      type: 'overloaded',
      userMessage:
        'Le service IA a rencontré une erreur interne. Réessayez dans quelques instants.',
      technicalDetail: message,
      retryable: true,
      httpStatus: statusCode,
    };
  }

  return {
    type: 'unknown',
    userMessage: `Erreur lors de la communication avec le service IA : ${truncate(message, 200)}`,
    technicalDetail: message,
    retryable: false,
    httpStatus: 500,
  };
}

/**
 * Formate une réponse d'erreur NextResponse pour les routes API IA.
 */
export function formatAIErrorResponse(error: unknown): {
  body: { message: string; errorType: AIErrorType; technicalDetail: string; retryable: boolean };
  status: number;
} {
  const info = classifyAIError(error);
  return {
    body: {
      message: info.userMessage,
      errorType: info.type,
      technicalDetail: info.technicalDetail,
      retryable: info.retryable,
    },
    status: info.httpStatus,
  };
}

function extractStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    if ('status' in error && typeof (error as Record<string, unknown>).status === 'number') {
      return (error as Record<string, unknown>).status as number;
    }
    if (
      'statusCode' in error &&
      typeof (error as Record<string, unknown>).statusCode === 'number'
    ) {
      return (error as Record<string, unknown>).statusCode as number;
    }
  }
  return undefined;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}
