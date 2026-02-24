/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Vercel serverless function timeout — single Claude API call
export const maxDuration = 60;

/**
 * Prompt système pour l'analyse des logs de déploiement
 */
const DEPLOYMENT_ANALYSIS_SYSTEM_PROMPT = `Tu es un expert DevOps et ingénieur système spécialisé dans l'analyse des erreurs de déploiement.

Ton rôle est d'analyser les logs de déploiement échoués et de fournir:
1. Un diagnostic clair et précis du problème
2. Des solutions concrètes et actionnables
3. Des recommandations pour prévenir ce type d'erreur à l'avenir

Tu dois être:
- Précis et technique dans ton analyse
- Pratique et orienté solutions
- Capable d'identifier les causes racines
- Pédagogue pour expliquer les problèmes complexes

Contexte technique de l'application:
- Framework: Next.js 14 avec TypeScript
- Base de données: PostgreSQL avec Prisma ORM
- Cache: Redis
- Process manager: PM2
- Serveur: VPS Gandi (Linux)
- Gestionnaire de paquets: pnpm
- Node.js version: 22

Le script de déploiement automatisé effectue les phases suivantes:
1. prerequisites - Vérification des prérequis (git, pnpm, node, pm2)
2. backup - Création d'un backup de la base de données
3. git - Mise à jour du code depuis le dépôt
4. dependencies - Installation des dépendances (pnpm install)
5. migrations - Exécution des migrations Prisma
6. build - Build de l'application Next.js
7. deploy - Redémarrage de l'application avec PM2
8. healthcheck - Vérification que l'application répond
9. rollback - En cas d'échec, retour à la version précédente`;

/**
 * Interface pour la réponse d'analyse
 */
interface AnalysisResponse {
  success: boolean;
  analysis?: {
    summary: string;
    errorType: string;
    phase: string;
    rootCause: string;
    solutions: Array<{
      title: string;
      description: string;
      commands?: string[];
      priority: 'high' | 'medium' | 'low';
    }>;
    prevention: string[];
    additionalNotes?: string;
  };
  error?: string;
}

/**
 * POST /api/admin/deployment/analyze
 * Analyse les logs d'un déploiement échoué avec Claude
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Check admin auth
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const { deploymentId } = body;

    if (!deploymentId) {
      return NextResponse.json(
        { success: false, error: 'ID de déploiement requis' },
        { status: 400 }
      );
    }

    // Récupérer le déploiement
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      return NextResponse.json(
        { success: false, error: 'Déploiement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que c'est un déploiement échoué ou rollback
    if (!['failed', 'rolled_back'].includes(deployment.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "L'analyse n'est disponible que pour les déploiements échoués",
        },
        { status: 400 }
      );
    }

    // Vérifier que nous avons des logs à analyser
    if (!deployment.logs && !deployment.errorMessage) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun log disponible pour l'analyse",
        },
        { status: 400 }
      );
    }

    // Vérifier la clé API Anthropic
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[Deployment Analysis] ANTHROPIC_API_KEY non configurée');
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration API Claude manquante',
        },
        { status: 500 }
      );
    }

    // Construire le prompt d'analyse
    const analysisPrompt = buildAnalysisPrompt(deployment);

    // Appeler Claude pour l'analyse
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.3, // Plus déterministe pour les analyses techniques
      system: DEPLOYMENT_ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    // Extraire la réponse
    const responseContent = message.content[0].type === 'text' ? message.content[0].text : '';

    if (!responseContent) {
      throw new Error('Aucune réponse de Claude');
    }

    // Parser la réponse structurée
    const analysis = parseAnalysisResponse(responseContent);

    const response: AnalysisResponse = {
      success: true,
      analysis,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Deployment Analysis] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de l'analyse",
      },
      { status: 500 }
    );
  }
}

/**
 * Construit le prompt d'analyse à partir des données du déploiement
 */
function buildAnalysisPrompt(deployment: {
  id: string;
  status: string;
  targetRef: string;
  targetCommit: string | null;
  currentPhase: string | null;
  logs: string | null;
  errorMessage: string | null;
  triggeredAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}): string {
  const duration =
    deployment.startedAt && deployment.completedAt
      ? Math.round((deployment.completedAt.getTime() - deployment.startedAt.getTime()) / 1000)
      : null;

  return `Analyse ce déploiement échoué et fournis un diagnostic détaillé avec des solutions.

## Informations du déploiement

- **ID**: ${deployment.id}
- **Statut**: ${deployment.status}
- **Branche/Tag**: ${deployment.targetRef}
- **Commit**: ${deployment.targetCommit || 'Non disponible'}
- **Phase d'échec**: ${deployment.currentPhase || 'Non déterminée'}
- **Date**: ${deployment.triggeredAt.toISOString()}
- **Durée avant échec**: ${duration ? `${duration}s` : 'Non disponible'}

## Message d'erreur

${deployment.errorMessage || "Aucun message d'erreur spécifique"}

## Logs complets

\`\`\`
${deployment.logs || 'Aucun log disponible'}
\`\`\`

---

**Réponds en utilisant EXACTEMENT ce format XML:**

<ANALYSIS>
<SUMMARY>Résumé concis du problème en 1-2 phrases</SUMMARY>
<ERROR_TYPE>Type d'erreur (ex: BuildError, DependencyError, DatabaseError, GitError, PermissionError, MemoryError, TimeoutError, ConfigurationError, NetworkError, ProcessError)</ERROR_TYPE>
<PHASE>Phase où l'erreur s'est produite</PHASE>
<ROOT_CAUSE>Explication détaillée de la cause racine du problème</ROOT_CAUSE>
<SOLUTIONS>
<SOLUTION priority="high|medium|low">
<TITLE>Titre de la solution</TITLE>
<DESCRIPTION>Description détaillée de la solution</DESCRIPTION>
<COMMANDS>
commande1
commande2
</COMMANDS>
</SOLUTION>
<!-- Ajouter 2-4 solutions au total -->
</SOLUTIONS>
<PREVENTION>
<ITEM>Recommandation 1 pour prévenir ce problème</ITEM>
<ITEM>Recommandation 2</ITEM>
<!-- 2-4 recommandations -->
</PREVENTION>
<NOTES>Notes additionnelles ou contexte important (optionnel)</NOTES>
</ANALYSIS>`;
}

/**
 * Parse la réponse XML de Claude en objet structuré
 */
function parseAnalysisResponse(response: string): AnalysisResponse['analysis'] {
  // Extraire les différentes sections
  const summaryMatch = response.match(/<SUMMARY>([\s\S]*?)<\/SUMMARY>/);
  const errorTypeMatch = response.match(/<ERROR_TYPE>([\s\S]*?)<\/ERROR_TYPE>/);
  const phaseMatch = response.match(/<PHASE>([\s\S]*?)<\/PHASE>/);
  const rootCauseMatch = response.match(/<ROOT_CAUSE>([\s\S]*?)<\/ROOT_CAUSE>/);
  const notesMatch = response.match(/<NOTES>([\s\S]*?)<\/NOTES>/);

  // Extraire les solutions
  const solutionsRegex =
    /<SOLUTION\s+priority="(high|medium|low)">\s*<TITLE>([\s\S]*?)<\/TITLE>\s*<DESCRIPTION>([\s\S]*?)<\/DESCRIPTION>\s*(?:<COMMANDS>([\s\S]*?)<\/COMMANDS>)?\s*<\/SOLUTION>/g;
  const solutions: NonNullable<AnalysisResponse['analysis']>['solutions'] = [];

  let solutionMatch;
  while ((solutionMatch = solutionsRegex.exec(response)) !== null) {
    const commands = solutionMatch[4]
      ? solutionMatch[4]
          .trim()
          .split('\n')
          .map(c => c.trim())
          .filter(c => c)
      : undefined;

    solutions.push({
      priority: solutionMatch[1] as 'high' | 'medium' | 'low',
      title: solutionMatch[2].trim(),
      description: solutionMatch[3].trim(),
      commands: commands?.length ? commands : undefined,
    });
  }

  // Extraire les recommandations de prévention
  const preventionRegex = /<ITEM>([\s\S]*?)<\/ITEM>/g;
  const prevention: string[] = [];

  let preventionMatch;
  while ((preventionMatch = preventionRegex.exec(response)) !== null) {
    prevention.push(preventionMatch[1].trim());
  }

  return {
    summary: summaryMatch?.[1]?.trim() || 'Analyse non disponible',
    errorType: errorTypeMatch?.[1]?.trim() || 'Unknown',
    phase: phaseMatch?.[1]?.trim() || 'Unknown',
    rootCause: rootCauseMatch?.[1]?.trim() || 'Cause non déterminée',
    solutions:
      solutions.length > 0
        ? solutions
        : [
            {
              title: 'Vérification manuelle requise',
              description:
                "Les logs ne permettent pas d'identifier clairement le problème. Une investigation manuelle est recommandée.",
              priority: 'high',
            },
          ],
    prevention:
      prevention.length > 0
        ? prevention
        : ['Effectuer des tests avant le déploiement', 'Monitorer les ressources système'],
    additionalNotes: notesMatch?.[1]?.trim() || undefined,
  };
}
