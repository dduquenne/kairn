/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — pre-existing type patterns (SeminarOutput Decimal, JSON metadata)
/**
 * Cron job pour la promotion automatique des séminaires sur les réseaux sociaux
 *
 * Déclenchement : QStash quotidien à 06:00 (heure Paris)
 *
 * Fonctionnement :
 * 1. Récupère les séminaires à venir (< 45 jours)
 * 2. Pour chaque séminaire, détermine le jalon de promotion atteint
 * 3. Si le jalon n'a pas déjà été traité, génère du contenu via Claude API
 * 4. Crée des posts SCHEDULED pour chaque plateforme active
 * 5. Le CRON social-publish existant les publie à l'heure programmée
 *
 * Jalons de promotion :
 * - Jalon 1 (J-45) : Annonce initiale — tone=informatif, angle=benefices
 * - Jalon 2 (J-18) : Premier rappel — tone=inspirant, angle=histoire
 * - Jalon 3 (J-7)  : Rappel semaine — tone=promotionnel, angle=pratique
 * - Jalon 4 (J-3)  : Dernières places — tone=personnel, angle=probleme
 * - Jalon 5 (J-1)  : Dernière chance — tone=promotionnel, angle=benefices
 *
 * Sécurité : Vérifie CRON_SECRET (Vercel CRON) ou signature QStash
 * Timeout : Max 1 séminaire par invocation pour rester sous 60s
 */

import Anthropic from '@anthropic-ai/sdk';
import { verifyCronAuth } from '@kairn/core/scheduler';
import { NextRequest, NextResponse } from 'next/server';

import { getUpcomingSeminars, type SeminarOutput } from '@/app/api/seminars/prisma-store';
import { parseMultiPlatformResponse, parseGenerationResponse } from '@/lib/social/prompts/builder';
import {
  buildSeminarSystemPrompt,
  buildSeminarMultiPlatformPrompt,
  type SeminarInput,
  type SeminarGenerationOptions,
} from '@/lib/social/prompts/seminar-builder';
import { getAllSocialAccounts, createSocialPost, getSocialPosts } from '@/lib/social/store';
import type {
  SocialPlatform,
  ContentTone,
  ContentAngle,
  SeminarUrgencyLevel,
  GeneratedContent,
} from '@/lib/social/types';

// ===========================================
// Configuration
// ===========================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2048;

/**
 * Définition des jalons de promotion.
 * Chaque jalon est déclenché quand daysUntilEvent <= threshold.
 */
const PROMOTION_MILESTONES: Array<{
  milestone: number;
  threshold: number;
  urgencyLevel: SeminarUrgencyLevel;
  tone: ContentTone;
  angle: ContentAngle;
  label: string;
}> = [
  {
    milestone: 1,
    threshold: 45,
    urgencyLevel: 1,
    tone: 'informatif',
    angle: 'benefices',
    label: 'Annonce initiale',
  },
  {
    milestone: 2,
    threshold: 18,
    urgencyLevel: 2,
    tone: 'inspirant',
    angle: 'histoire',
    label: 'Premier rappel',
  },
  {
    milestone: 3,
    threshold: 7,
    urgencyLevel: 3,
    tone: 'promotionnel',
    angle: 'pratique',
    label: 'Rappel semaine',
  },
  {
    milestone: 4,
    threshold: 3,
    urgencyLevel: 4,
    tone: 'personnel',
    angle: 'probleme',
    label: 'Dernières places',
  },
  {
    milestone: 5,
    threshold: 1,
    urgencyLevel: 5,
    tone: 'promotionnel',
    angle: 'benefices',
    label: 'Dernière chance',
  },
];

/**
 * Horaires de publication étalés par plateforme (heure Paris).
 * Le CRON social-publish récupérera chaque post à l'heure programmée.
 */
const PLATFORM_PUBLISH_HOURS: Partial<Record<SocialPlatform, number>> = {
  LINKEDIN: 8,
  FACEBOOK: 9,
  THREADS: 10,
  INSTAGRAM: 11,
};

// ===========================================
// Anthropic Client
// ===========================================

let anthropicClient: Anthropic | null = null;

/**
 * Retourne le client Anthropic (singleton)
 */
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('[PromoteSeminars] ANTHROPIC_API_KEY non configurée.');
    }
    anthropicClient = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// ===========================================
// Helpers
// ===========================================

/**
 * Calcule le nombre de jours avant le séminaire
 */
function getDaysUntilEvent(startAt: string): number {
  const start = new Date(startAt);
  const now = new Date();
  const diffTime = start.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Convertit un SeminarOutput (Prisma) en SeminarInput (prompt builder)
 */
function toSeminarInput(seminar: SeminarOutput): SeminarInput {
  return {
    id: seminar.id,
    title: seminar.title,
    description: seminar.description,
    speakers: seminar.speakers,
    startAt: seminar.startAt,
    endAt: seminar.endAt,
    capacity: seminar.capacity,
    price: seminar.price,
    deposit: seminar.deposit,
    tags: seminar.tags,
    thumbnail: seminar.thumbnail,
  };
}

/**
 * Détermine le jalon le plus élevé atteint pour un séminaire.
 * Retourne tous les jalons dont le threshold est >= daysUntilEvent.
 */
function getActiveMilestones(daysUntilEvent: number) {
  return PROMOTION_MILESTONES.filter(m => daysUntilEvent <= m.threshold);
}

/**
 * Vérifie si un jalon a déjà été traité pour un séminaire donné.
 * Recherche dans les posts existants via metadata.
 */
async function getMilestonesDone(seminarId: string): Promise<Set<number>> {
  const allPosts = await getSocialPosts({});
  const done = new Set<number>();

  for (const post of allPosts) {
    const meta = post.metadata as Record<string, unknown> | null;
    if (meta && meta.seminarId === seminarId && typeof meta.milestone === 'number') {
      done.add(meta.milestone as number);
    }
  }

  return done;
}

/**
 * Crée une date de publication pour aujourd'hui à l'heure donnée (fuseau Paris)
 */
function getScheduledDate(hour: number): Date {
  const now = new Date();
  // Paris est UTC+1 ou UTC+2 selon l'heure d'été
  // On calcule en créant la date en UTC correspondant à l'heure Paris souhaitée
  const parisOffset = getParisTzOffset(now);
  const scheduled = new Date(now);
  scheduled.setUTCHours(hour - parisOffset, 0, 0, 0);

  // Si l'heure est déjà passée aujourd'hui, programmer pour dans 30 minutes
  if (scheduled.getTime() <= now.getTime()) {
    return new Date(now.getTime() + 30 * 60 * 1000);
  }

  return scheduled;
}

/**
 * Retourne le décalage horaire Paris/UTC en heures
 */
function getParisTzOffset(date: Date): number {
  // Simple heuristique : CET (UTC+1) d'octobre à mars, CEST (UTC+2) d'avril à septembre
  const month = date.getUTCMonth();
  return month >= 3 && month <= 9 ? 2 : 1;
}

// ===========================================
// Génération multi-plateforme
// ===========================================

/**
 * Génère du contenu pour un séminaire sur toutes les plateformes actives
 */
async function generateSeminarPosts(
  seminar: SeminarInput,
  platforms: SocialPlatform[],
  options: SeminarGenerationOptions
): Promise<GeneratedContent[]> {
  const client = getAnthropicClient();
  const systemPrompt = buildSeminarSystemPrompt();

  if (platforms.length === 1) {
    // Import buildSeminarUserPrompt pour single platform
    const { buildSeminarUserPrompt } = await import('@/lib/social/prompts/seminar-builder');
    const userPrompt = buildSeminarUserPrompt(seminar, platforms[0]!, options);
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    const parsed = parseGenerationResponse(responseText);
    if (!parsed) {
      console.error('[PromoteSeminars] Failed to parse single-platform response');
      return [];
    }

    return [
      {
        platform: platforms[0]!,
        content: parsed.content,
        hashtags: parsed.hashtags,
        suggestedMediaUrl: seminar.thumbnail,
      },
    ];
  }

  const userPrompt = buildSeminarMultiPlatformPrompt(seminar, platforms, options);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS * platforms.length,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  const parsed = parseMultiPlatformResponse(responseText);
  if (!parsed) {
    console.error('[PromoteSeminars] Failed to parse multi-platform response');
    return [];
  }

  return parsed.map(gen => ({
    platform: gen.platform,
    content: gen.content,
    hashtags: gen.hashtags,
    suggestedMediaUrl: seminar.thumbnail,
  }));
}

// ===========================================
// Traitement principal
// ===========================================

/**
 * Traite un séminaire : génère et programme les posts pour le jalon atteint
 */
async function processSeminar(
  seminar: SeminarOutput,
  milestoneConfig: (typeof PROMOTION_MILESTONES)[number],
  accounts: Array<{ id: string; platform: SocialPlatform; isActive: boolean }>
): Promise<{ postsCreated: number; errors: string[] }> {
  const errors: string[] = [];
  let postsCreated = 0;

  // Déterminer les plateformes actives
  const activePlatforms = [
    ...new Set(
      accounts
        .filter(a => a.isActive && PLATFORM_PUBLISH_HOURS[a.platform] !== undefined)
        .map(a => a.platform)
    ),
  ] as SocialPlatform[];

  if (activePlatforms.length === 0) {
    errors.push('Aucun compte social actif configuré');
    return { postsCreated, errors };
  }

  // Générer le contenu
  const seminarInput = toSeminarInput(seminar);
  const options: SeminarGenerationOptions = {
    tone: milestoneConfig.tone,
    angle: milestoneConfig.angle,
    urgencyLevel: milestoneConfig.urgencyLevel,
    customInstructions: `Ce post fait partie d'une campagne automatique de promotion (jalon ${milestoneConfig.milestone}/5 : ${milestoneConfig.label}). Le séminaire a lieu dans ${getDaysUntilEvent(seminar.startAt)} jours.`,
  };

  let generations: GeneratedContent[];
  try {
    generations = await generateSeminarPosts(seminarInput, activePlatforms, options);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    errors.push(`Erreur de génération IA : ${msg}`);
    return { postsCreated, errors };
  }

  if (generations.length === 0) {
    errors.push('Aucun contenu généré par Claude API');
    return { postsCreated, errors };
  }

  // Créer un post SCHEDULED par génération
  for (const gen of generations) {
    const account = accounts.find(a => a.platform === gen.platform && a.isActive);
    if (!account) {
      errors.push(`Pas de compte actif pour ${gen.platform}`);
      continue;
    }

    const publishHour = PLATFORM_PUBLISH_HOURS[gen.platform] || 9;
    const scheduledAt = getScheduledDate(publishHour);

    try {
      await createSocialPost({
        accountId: account.id,
        platform: gen.platform,
        content: gen.content,
        hashtags: gen.hashtags,
        mediaUrls: gen.suggestedMediaUrl ? [gen.suggestedMediaUrl] : [],
        scheduledAt,
        generatedBy: 'ai',
        aiModel: MODEL,
        metadata: {
          seminarId: seminar.id,
          seminarTitle: seminar.title,
          milestone: milestoneConfig.milestone,
          milestoneLabel: milestoneConfig.label,
          urgencyLevel: milestoneConfig.urgencyLevel,
          tone: milestoneConfig.tone,
          angle: milestoneConfig.angle,
          automated: true,
        },
      });
      postsCreated++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      errors.push(`Erreur création post ${gen.platform} : ${msg}`);
    }
  }

  return { postsCreated, errors };
}

// ===========================================
// GET - Exécution du cron
// ===========================================

/**
 * Handler principal du CRON promote-seminars
 */
export async function GET(request: NextRequest) {
  const invocationId = Math.random().toString(36).substring(2, 10);
  const startTime = Date.now();

  console.log(
    `[Cron PromoteSeminars][${invocationId}] ▶ Invocation démarrée à ${new Date().toISOString()}`
  );

  // Authentification
  const authResult = await verifyCronAuth(request);
  if (!authResult.valid) {
    console.warn(
      `[Cron PromoteSeminars][${invocationId}] ✗ Accès non autorisé (source: ${authResult.source}): ${authResult.error}`
    );
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  console.log(`[Cron PromoteSeminars][${invocationId}] Auth OK via ${authResult.source}`);

  // Vérifier la configuration API
  if (!ANTHROPIC_API_KEY) {
    console.warn(`[Cron PromoteSeminars][${invocationId}] ✗ ANTHROPIC_API_KEY non configurée`);
    return NextResponse.json(
      { success: false, error: 'ANTHROPIC_API_KEY non configurée' },
      { status: 500 }
    );
  }

  try {
    // 1. Récupérer les séminaires à venir
    const seminars = await getUpcomingSeminars();
    if (seminars.length === 0) {
      const duration = Date.now() - startTime;
      console.log(
        `[Cron PromoteSeminars][${invocationId}] ◀ Aucun séminaire à venir (${duration}ms)`
      );
      return NextResponse.json({
        success: true,
        message: 'Aucun séminaire à venir',
        processed: 0,
        duration,
      });
    }

    // 2. Récupérer les comptes sociaux actifs
    const accounts = await getAllSocialAccounts();
    const activeAccounts = accounts.filter(a => a.isActive);
    if (activeAccounts.length === 0) {
      const duration = Date.now() - startTime;
      console.log(
        `[Cron PromoteSeminars][${invocationId}] ◀ Aucun compte social actif (${duration}ms)`
      );
      return NextResponse.json({
        success: true,
        message: 'Aucun compte social actif',
        processed: 0,
        duration,
      });
    }

    // 3. Pour chaque séminaire, vérifier les jalons
    let totalPostsCreated = 0;
    let seminarsProcessed = 0;
    const allErrors: string[] = [];
    const results: Array<{
      seminarId: string;
      seminarTitle: string;
      milestone: number;
      milestoneLabel: string;
      postsCreated: number;
    }> = [];

    for (const seminar of seminars) {
      const daysUntil = getDaysUntilEvent(seminar.startAt);

      // Ignorer les séminaires trop lointains (> 45 jours)
      if (daysUntil > 45) continue;

      // Ignorer les séminaires déjà passés
      if (daysUntil < 0) continue;

      const activeMilestones = getActiveMilestones(daysUntil);
      if (activeMilestones.length === 0) continue;

      const milestonesDone = await getMilestonesDone(seminar.id);

      // Trouver le jalon le plus récent non encore traité
      const pendingMilestone = activeMilestones
        .sort((a, b) => b.milestone - a.milestone) // Plus élevé en premier
        .find(m => !milestonesDone.has(m.milestone));

      if (!pendingMilestone) continue; // Tous les jalons sont déjà traités

      console.log(
        `[Cron PromoteSeminars][${invocationId}] Séminaire "${seminar.title}" (J-${daysUntil}) → Jalon ${pendingMilestone.milestone}: ${pendingMilestone.label}`
      );

      // Traiter un seul séminaire par invocation pour respecter le timeout de 60s
      const result = await processSeminar(seminar, pendingMilestone, activeAccounts);
      seminarsProcessed++;
      totalPostsCreated += result.postsCreated;
      allErrors.push(...result.errors);
      results.push({
        seminarId: seminar.id,
        seminarTitle: seminar.title,
        milestone: pendingMilestone.milestone,
        milestoneLabel: pendingMilestone.label,
        postsCreated: result.postsCreated,
      });

      // Limiter à 1 séminaire par invocation (contrainte de timeout 60s)
      break;
    }

    const duration = Date.now() - startTime;

    if (seminarsProcessed === 0) {
      console.log(
        `[Cron PromoteSeminars][${invocationId}] ◀ Aucun jalon à traiter (${duration}ms)`
      );
      return NextResponse.json({
        success: true,
        message: 'Aucun jalon de promotion à traiter',
        seminarsChecked: seminars.length,
        processed: 0,
        duration,
      });
    }

    console.log(
      `[Cron PromoteSeminars][${invocationId}] ◀ Terminé en ${duration}ms: ` +
        `${seminarsProcessed} séminaire(s), ${totalPostsCreated} post(s) créé(s)`
    );

    return NextResponse.json({
      success: true,
      message: `Promotion terminée: ${totalPostsCreated} post(s) créé(s) pour ${seminarsProcessed} séminaire(s)`,
      seminarsChecked: seminars.length,
      processed: seminarsProcessed,
      postsCreated: totalPostsCreated,
      results,
      errors: allErrors.length > 0 ? allErrors : undefined,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[Cron PromoteSeminars][${invocationId}] ✗ Erreur critique après ${duration}ms:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur critique',
        duration,
      },
      { status: 500 }
    );
  }
}

// Accepter aussi POST car QStash envoie POST par défaut
export { GET as POST };

// Configuration pour Vercel Cron
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 secondes max pour le cron
