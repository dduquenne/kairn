// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Validation des variables d'environnement requises
 * IMPORTANT : Importer ce fichier au démarrage de l'application
 */

// Variables d'environnement critiques requises en production
const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'RESEND_API_KEY',
] as const;

// Variables d'environnement optionnelles mais recommandées
const RECOMMENDED_ENV_VARS = [
  'OPENAI_API_KEY',
  'OPENAI_ASSISTANT_ID',
  'ANTHROPIC_API_KEY',
  'RECAPTCHA_SECRET_KEY',
  'RECAPTCHA_SITE_KEY',
  'CSRF_SECRET',
] as const;

interface ValidationResult {
  valid: boolean;
  missing: string[];
  missingRecommended: string[];
}

/**
 * Valide que toutes les variables d'environnement requises sont présentes
 */
export function validateEnvVars(): ValidationResult {
  const missing: string[] = [];
  const missingRecommended: string[] = [];

  // Vérifier les variables requises
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Vérifier les variables recommandées (seulement en production)
  if (process.env.NODE_ENV === 'production') {
    for (const envVar of RECOMMENDED_ENV_VARS) {
      if (!process.env[envVar]) {
        missingRecommended.push(envVar);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    missingRecommended,
  };
}

/**
 * Valide les variables d'environnement et lance une erreur si des variables critiques manquent
 */
export function validateEnvVarsOrThrow(): void {
  const result = validateEnvVars();

  if (!result.valid) {
    const errorMessage = [
      '❌ ERREUR : Variables d\'environnement critiques manquantes :',
      ...result.missing.map(v => `  - ${v}`),
      '',
      'Ces variables sont requises pour le fonctionnement de l\'application.',
      'Veuillez les configurer dans votre fichier .env ou variables d\'environnement.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  if (result.missingRecommended.length > 0) {
    console.warn(
      '⚠️  AVERTISSEMENT : Variables d\'environnement recommandées manquantes :',
      result.missingRecommended.map(v => `\n  - ${v}`).join('')
    );
    console.warn(
      'Certaines fonctionnalités peuvent ne pas fonctionner correctement.\n'
    );
  }
}

/**
 * Valide que les secrets sont suffisamment complexes en production
 */
export function validateSecretComplexity(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const MIN_SECRET_LENGTH = 32;
  const secretsToCheck = [
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET },
    { name: 'CSRF_SECRET', value: process.env.CSRF_SECRET },
  ];

  for (const { name, value } of secretsToCheck) {
    if (value && value.length < MIN_SECRET_LENGTH) {
      console.warn(
        `⚠️  AVERTISSEMENT : ${name} devrait faire au moins ${MIN_SECRET_LENGTH} caractères en production.`
      );
    }

    if (value && /^(secret|password|123|test|dev)/i.test(value)) {
      throw new Error(
        `❌ ERREUR SÉCURITÉ : ${name} contient un mot faible. ` +
        `Utilisez un secret cryptographiquement sécurisé en production.`
      );
    }
  }
}

// Validation automatique au chargement du module (seulement en production)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  validateEnvVarsOrThrow();
  validateSecretComplexity();
}
