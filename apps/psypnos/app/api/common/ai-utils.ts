/**
 * Utilitaires communs pour les appels IA (Claude, OpenAI)
 *
 * Fournit :
 * - Parsing JSON robuste (extraction avant parsing)
 * - Retry avec backoff exponentiel
 * - Timeout sur les appels API
 */

/**
 * Extrait et parse du JSON depuis une réponse texte
 * Gère les cas où Claude ajoute du texte avant/après le JSON
 *
 * @param text - Texte contenant du JSON
 * @param fallback - Valeur de retour si le parsing échoue
 * @returns L'objet parsé ou le fallback
 */
export function parseJsonFromText<T>(text: string, fallback?: T): T {
  if (!text || typeof text !== 'string') {
    if (fallback !== undefined) return fallback;
    throw new Error('Texte vide ou invalide pour le parsing JSON');
  }

  // Nettoyer le texte
  const cleanedText = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Essai 1: Parser directement le texte nettoyé
  try {
    return JSON.parse(cleanedText) as T;
  } catch {
    // Continuer avec les autres méthodes
  }

  // Essai 2: Chercher un objet JSON (commence par { et finit par })
  const objectMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]) as T;
    } catch {
      // Continuer
    }
  }

  // Essai 3: Chercher un tableau JSON (commence par [ et finit par ])
  const arrayMatch = cleanedText.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]) as T;
    } catch {
      // Continuer
    }
  }

  // Essai 4: Essayer de réparer le JSON tronqué
  // Compte les accolades/crochets ouverts et ferme-les si nécessaire
  try {
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;

    for (const char of cleanedText) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        if (char === '[') openBrackets++;
        if (char === ']') openBrackets--;
      }
    }

    // Réparer si déséquilibré
    if (openBraces > 0 || openBrackets > 0) {
      let repairedText = cleanedText;

      // Fermer les chaînes non terminées si on est en string
      if (inString) {
        repairedText += '"';
      }

      // Ajouter les accolades/crochets manquants
      repairedText += ']'.repeat(openBrackets);
      repairedText += '}'.repeat(openBraces);

      return JSON.parse(repairedText) as T;
    }
  } catch {
    // Continuer
  }

  // Si tout échoue, retourner le fallback ou lever une erreur
  if (fallback !== undefined) {
    console.warn('Parsing JSON échoué, utilisation du fallback:', text.slice(0, 200));
    return fallback;
  }

  throw new Error(`Impossible de parser le JSON: ${text.slice(0, 500)}...`);
}

/**
 * Options pour le retry avec backoff
 */
export interface RetryOptions {
  /** Nombre maximum de tentatives (défaut: 3) */
  maxRetries?: number;
  /** Délai initial en ms (défaut: 1000) */
  initialDelayMs?: number;
  /** Multiplicateur pour le backoff (défaut: 2) */
  backoffMultiplier?: number;
  /** Délai maximum en ms (défaut: 30000) */
  maxDelayMs?: number;
  /** Fonction pour déterminer si une erreur est retriable */
  isRetriable?: (error: unknown) => boolean;
  /** Callback appelé avant chaque retry */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

/**
 * Erreurs par défaut considérées comme retriables
 */
const DEFAULT_RETRIABLE_ERRORS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'EAI_AGAIN',
  'rate_limit',
  'overloaded',
  '529', // Anthropic overloaded
  '503', // Service Unavailable
  '502', // Bad Gateway
  '504', // Gateway Timeout
];

/**
 * Vérifie si une erreur est retriable par défaut
 */
function defaultIsRetriable(error: unknown): boolean {
  if (!error) return false;

  const errorString = String(error).toLowerCase();
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';

  return DEFAULT_RETRIABLE_ERRORS.some(
    code => errorString.includes(code.toLowerCase()) || errorMessage.includes(code.toLowerCase())
  );
}

/**
 * Exécute une fonction avec retry et backoff exponentiel
 *
 * @param fn - Fonction async à exécuter
 * @param options - Options de retry
 * @returns Le résultat de la fonction
 * @throws L'erreur de la dernière tentative si toutes échouent
 *
 * @example
 * const result = await withRetry(
 *   () => anthropic.messages.create({...}),
 *   { maxRetries: 3, initialDelayMs: 1000 }
 * );
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    isRetriable = defaultIsRetriable,
    onRetry,
  } = options;

  let lastError: unknown;
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Si c'est la dernière tentative ou l'erreur n'est pas retriable, throw
      if (attempt >= maxRetries || !isRetriable(error)) {
        throw error;
      }

      // Log et callback
      console.warn(
        `Tentative ${attempt}/${maxRetries} échouée, retry dans ${delayMs}ms:`,
        error instanceof Error ? error.message : error
      );

      if (onRetry) {
        onRetry(attempt, error, delayMs);
      }

      // Attendre avant le retry
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Augmenter le délai pour la prochaine tentative
      delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
    }
  }

  // Ne devrait pas arriver, mais par sécurité
  throw lastError;
}

/**
 * Crée une promesse avec timeout
 *
 * @param promise - Promesse à envelopper
 * @param timeoutMs - Timeout en millisecondes
 * @param timeoutMessage - Message d'erreur en cas de timeout
 * @returns La promesse avec timeout
 *
 * @example
 * const result = await withTimeout(
 *   anthropic.messages.create({...}),
 *   60000,
 *   'Appel API Claude timeout après 60s'
 * );
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = `Opération timeout après ${timeoutMs}ms`
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Combine retry et timeout pour un appel API robuste
 *
 * @param fn - Fonction async à exécuter
 * @param timeoutMs - Timeout par tentative
 * @param retryOptions - Options de retry
 * @returns Le résultat de la fonction
 *
 * @example
 * const result = await withRetryAndTimeout(
 *   () => anthropic.messages.create({...}),
 *   60000,
 *   { maxRetries: 3 }
 * );
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return withRetry(() => withTimeout(fn(), timeoutMs, `Appel API timeout après ${timeoutMs}ms`), {
    ...retryOptions,
    isRetriable: error => {
      // Timeout est retriable
      if (error instanceof Error && error.message.includes('timeout')) {
        return true;
      }
      // Utiliser la fonction par défaut ou celle fournie
      return (retryOptions.isRetriable || defaultIsRetriable)(error);
    },
  });
}

/**
 * Extrait un bloc XML d'un texte
 * Utile pour parser les réponses Claude avec balises XML
 *
 * @param text - Texte contenant des balises XML
 * @param tagName - Nom de la balise à extraire
 * @returns Le contenu de la balise ou undefined
 */
export function extractXmlBlock(text: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = text.match(regex);
  return match?.[1]?.trim();
}

/**
 * Vérifie si une réponse XML est complète (toutes les balises fermées)
 *
 * @param text - Texte XML à vérifier
 * @param requiredTags - Liste des balises qui doivent être présentes et fermées
 * @returns Objet avec statut de validation et balises manquantes
 */
export function validateXmlCompletion(
  text: string,
  requiredTags: string[]
): { isComplete: boolean; missingTags: string[]; truncatedTags: string[] } {
  const missingTags: string[] = [];
  const truncatedTags: string[] = [];

  for (const tag of requiredTags) {
    const openRegex = new RegExp(`<${tag}>`, 'i');
    const closeRegex = new RegExp(`<\\/${tag}>`, 'i');

    const hasOpen = openRegex.test(text);
    const hasClose = closeRegex.test(text);

    if (!hasOpen) {
      missingTags.push(tag);
    } else if (!hasClose) {
      truncatedTags.push(tag);
    }
  }

  return {
    isComplete: missingTags.length === 0 && truncatedTags.length === 0,
    missingTags,
    truncatedTags,
  };
}
