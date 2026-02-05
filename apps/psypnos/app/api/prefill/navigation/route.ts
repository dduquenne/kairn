/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Type incompatibilities to fix
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';

const navigationSchema = z.object({
  sessionId: z.string(),
  history: z.array(
    z.object({
      path: z.string(),
      title: z.string().optional(),
      timestamp: z.number(),
      timeSpent: z.number().optional(),
    })
  ),
});

// Service inference rules
const SERVICE_INFERENCE_RULES: Record<
  string,
  { service: string; keywords: string[]; weight: number }
> = {
  '/blog/gestion-stress': {
    service: "Gestion du stress et de l'anxiété",
    keywords: ['stress', 'anxiété'],
    weight: 3,
  },
  '/blog/anxiete': {
    service: "Gestion du stress et de l'anxiété",
    keywords: ['anxiété'],
    weight: 3,
  },
  '/services/hypnose': { service: 'Hypnothérapie', keywords: ['hypnose'], weight: 2 },
  '/services/sophrologie': {
    service: 'Sophrologie',
    keywords: ['sophrologie', 'relaxation'],
    weight: 2,
  },
  '/blog/arreter-fumer': { service: 'Arrêt du tabac', keywords: ['tabac', 'cigarette'], weight: 3 },
  '/blog/tabac': { service: 'Arrêt du tabac', keywords: ['tabac'], weight: 3 },
  '/blog/perte-poids': { service: 'Perte de poids', keywords: ['poids', 'minceur'], weight: 3 },
  '/blog/sommeil': { service: 'Troubles du sommeil', keywords: ['sommeil', 'insomnie'], weight: 3 },
  '/blog/confiance-soi': { service: 'Confiance en soi', keywords: ['confiance'], weight: 3 },
  '/blog/phobies': { service: 'Phobies et peurs', keywords: ['phobie', 'peur'], weight: 3 },
  '/seminaires': {
    service: 'Séminaires et ateliers',
    keywords: ['séminaire', 'atelier'],
    weight: 2,
  },
};

/**
 * POST /api/prefill/navigation
 * Sync navigation history from client
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = navigationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { sessionId, history } = parsed.data;

    // Check if consent was given
    const existing = await prisma.navigationHistory.findUnique({
      where: { sessionId },
    });

    if (!existing?.consentGiven) {
      return NextResponse.json({ error: 'Consentement requis' }, { status: 403 });
    }

    // Analyze navigation to infer interests
    const analysis = analyzeNavigation(history);

    // Calculate time per page
    const timePerPage: Record<string, number> = {};
    for (const entry of history) {
      if (entry.timeSpent) {
        timePerPage[entry.path] = (timePerPage[entry.path] || 0) + entry.timeSpent;
      }
    }

    // Update navigation history
    await prisma.navigationHistory.update({
      where: { sessionId },
      data: {
        pagesVisited: history,
        timePerPage,
        interests: analysis.interests,
        suggestedService: analysis.primaryService,
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Navigation sync error:', error);
    return NextResponse.json({ error: 'Erreur lors de la synchronisation' }, { status: 500 });
  }
}

interface NavigationEntry {
  path: string;
  title?: string;
  timestamp: number;
  timeSpent?: number;
}

interface AnalysisResult {
  primaryService: string | null;
  interests: string[];
  confidence: number;
}

function analyzeNavigation(history: NavigationEntry[]): AnalysisResult {
  if (history.length === 0) {
    return {
      primaryService: null,
      interests: [],
      confidence: 0,
    };
  }

  // Score each service based on page visits
  const serviceScores: Record<string, number> = {};
  const allInterests: Set<string> = new Set();

  for (const entry of history) {
    // Check path matches
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
    confidence,
  };
}
