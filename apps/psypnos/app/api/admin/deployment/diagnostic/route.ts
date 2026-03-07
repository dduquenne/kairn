/**
 * GET/POST /api/admin/deployment/diagnostic
 *
 * Runtime health and AI-powered diagnostic for Vercel Serverless environment.
 * GET returns raw metrics, POST adds Claude AI analysis.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { DiagnosticAnalysis, RuntimeHealth } from '@kairn/core/deployment';
import { NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { checkRedisHealth } from '@/lib/cache/redis';
import { isDatabaseConnected, prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// System Prompt for Vercel-aware diagnostic
// ---------------------------------------------------------------------------

const DIAGNOSTIC_SYSTEM_PROMPT = `Tu es un expert DevOps spécialisé dans les déploiements Vercel et le monitoring d'applications Next.js en production.

Contexte technique :
- Framework: Next.js (App Router) avec TypeScript
- Hébergement: Vercel Serverless (région CDG1 Paris)
- Base de données: PostgreSQL sur Supabase (Prisma ORM)
- Cache: Redis optionnel (Upstash)
- CRON: Upstash QStash
- Node.js 22, pnpm

Ton rôle : analyser les métriques runtime et fournir un diagnostic avec recommandations priorisées.

Réponds EXACTEMENT avec ce format XML :

<DIAGNOSTIC>
<OVERALL_HEALTH>excellent|good|warning|critical</OVERALL_HEALTH>
<SUMMARY>Résumé en 2-3 phrases</SUMMARY>
<FINDINGS>
<FINDING category="database|redis|memory|deployment|performance" status="ok|warning|critical">
<MESSAGE>Constat court</MESSAGE>
<DETAILS>Détails techniques (optionnel)</DETAILS>
</FINDING>
</FINDINGS>
<RECOMMENDATIONS>
<RECOMMENDATION priority="high|medium|low">
<TITLE>Titre</TITLE>
<DESCRIPTION>Description détaillée</DESCRIPTION>
</RECOMMENDATION>
</RECOMMENDATIONS>
<INSIGHTS>
<INSIGHT>Observation pertinente</INSIGHT>
</INSIGHTS>
</DIAGNOSTIC>`;

// ---------------------------------------------------------------------------
// Metrics Collection (Vercel-safe — no shell commands)
// ---------------------------------------------------------------------------

/** Metrics shape for the diagnostic */
interface VercelMetrics {
  timestamp: string;
  environment: string;
  region: string | null;
  version: string;
  buildId: string;
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    percentUsed: number;
  };
  database: {
    status: 'up' | 'down';
    latencyMs: number;
    error?: string;
    connectionCount?: number;
    databaseSize?: string;
  };
  redis: {
    status: 'up' | 'down' | 'disabled';
    latencyMs?: number;
    error?: string;
  };
  uptime: number;
  nodeVersion: string;
}

/**
 * Collect runtime metrics (Vercel-safe, no filesystem/shell access)
 * @returns Metrics object
 */
async function collectMetrics(): Promise<VercelMetrics> {
  const memUsage = process.memoryUsage();

  // Database check
  let dbStatus: VercelMetrics['database'];
  const dbStart = Date.now();
  try {
    const connected = await isDatabaseConnected();
    let connectionCount: number | undefined;
    let databaseSize: string | undefined;

    if (connected) {
      try {
        const countResult = await prisma.$queryRaw<
          Array<{ count: bigint }>
        >`SELECT count(*) as count FROM pg_stat_activity`;
        connectionCount = Number(countResult[0]?.count || 0);

        const sizeResult = await prisma.$queryRaw<
          Array<{ size: string }>
        >`SELECT pg_size_pretty(pg_database_size(current_database())) as size`;
        databaseSize = sizeResult[0]?.size;
      } catch {
        // Extended metrics may not be available (permissions)
      }
    }

    dbStatus = {
      status: connected ? 'up' : 'down',
      latencyMs: Date.now() - dbStart,
      connectionCount,
      databaseSize,
    };
  } catch (error) {
    dbStatus = {
      status: 'down',
      latencyMs: Date.now() - dbStart,
      error: error instanceof Error ? error.message : 'Unknown',
    };
  }

  // Redis check
  let redisStatus: VercelMetrics['redis'];
  if (!process.env.REDIS_URL) {
    redisStatus = { status: 'disabled' };
  } else {
    const redisHealth = await checkRedisHealth();
    redisStatus = {
      status: redisHealth.available ? 'up' : 'down',
      latencyMs: redisHealth.latencyMs,
      error: redisHealth.error,
    };
  }

  // Read version from env or default
  const version = process.env.npm_package_version || '1.0.0';
  const buildId = process.env.NEXT_BUILD_ID || process.env.VERCEL_DEPLOYMENT_ID || 'dev';

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    region: process.env.VERCEL_REGION ?? null,
    version,
    buildId,
    memory: {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
      percentUsed: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    },
    database: dbStatus,
    redis: redisStatus,
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
  };
}

// ---------------------------------------------------------------------------
// AI Analysis
// ---------------------------------------------------------------------------

/**
 * Build the diagnostic prompt from collected metrics
 * @param metrics - Runtime metrics
 * @returns Prompt string for Claude
 */
function buildPrompt(metrics: VercelMetrics): string {
  const uptimeMin = Math.floor(metrics.uptime / 60);

  return `Analyse ces métriques runtime Vercel et fournis un diagnostic :

## Environnement
- **Environnement**: ${metrics.environment}
- **Région Vercel**: ${metrics.region || 'N/A'}
- **Version**: ${metrics.version}
- **Build ID**: ${metrics.buildId}
- **Node.js**: ${metrics.nodeVersion}
- **Uptime fonction**: ${uptimeMin}m ${metrics.uptime % 60}s

## Mémoire (Serverless)
- **Heap**: ${metrics.memory.heapUsedMB}MB / ${metrics.memory.heapTotalMB}MB (${metrics.memory.percentUsed}%)
- **RSS**: ${metrics.memory.rssMB}MB

## Base de données PostgreSQL
- **Statut**: ${metrics.database.status}
- **Latence**: ${metrics.database.latencyMs}ms
${metrics.database.connectionCount !== undefined ? `- **Connexions**: ${metrics.database.connectionCount}` : ''}
${metrics.database.databaseSize ? `- **Taille**: ${metrics.database.databaseSize}` : ''}
${metrics.database.error ? `- **Erreur**: ${metrics.database.error}` : ''}

## Redis
- **Statut**: ${metrics.redis.status}
${metrics.redis.latencyMs !== undefined ? `- **Latence**: ${metrics.redis.latencyMs}ms` : ''}
${metrics.redis.error ? `- **Erreur**: ${metrics.redis.error}` : ''}`;
}

/**
 * Parse Claude's XML diagnostic response
 * @param response - Raw XML string from Claude
 * @returns Structured diagnostic analysis
 */
function parseDiagnosticResponse(response: string): DiagnosticAnalysis {
  const healthMatch = response.match(
    /<OVERALL_HEALTH>(excellent|good|warning|critical)<\/OVERALL_HEALTH>/
  );
  const summaryMatch = response.match(/<SUMMARY>([\s\S]*?)<\/SUMMARY>/);

  const findingsRegex =
    /<FINDING\s+category="([^"]+)"\s+status="(ok|warning|critical)">\s*<MESSAGE>([\s\S]*?)<\/MESSAGE>\s*(?:<DETAILS>([\s\S]*?)<\/DETAILS>)?\s*<\/FINDING>/g;
  const findings: DiagnosticAnalysis['findings'] = [];
  let m;
  while ((m = findingsRegex.exec(response)) !== null) {
    findings.push({
      category: m[1] ?? 'system',
      status: (m[2] ?? 'ok') as 'ok' | 'warning' | 'critical',
      message: (m[3] ?? '').trim(),
      details: m[4]?.trim(),
    });
  }

  const recsRegex =
    /<RECOMMENDATION\s+priority="(high|medium|low)">\s*<TITLE>([\s\S]*?)<\/TITLE>\s*<DESCRIPTION>([\s\S]*?)<\/DESCRIPTION>\s*<\/RECOMMENDATION>/g;
  const recommendations: DiagnosticAnalysis['recommendations'] = [];
  while ((m = recsRegex.exec(response)) !== null) {
    recommendations.push({
      priority: (m[1] ?? 'medium') as 'high' | 'medium' | 'low',
      title: (m[2] ?? '').trim(),
      description: (m[3] ?? '').trim(),
    });
  }

  const insightsRegex = /<INSIGHT>([\s\S]*?)<\/INSIGHT>/g;
  const insights: string[] = [];
  while ((m = insightsRegex.exec(response)) !== null) {
    insights.push((m[1] ?? '').trim());
  }

  return {
    overallHealth: (healthMatch?.[1] as DiagnosticAnalysis['overallHealth']) || 'warning',
    summary: summaryMatch?.[1]?.trim() || 'Diagnostic non disponible',
    findings:
      findings.length > 0
        ? findings
        : [{ category: 'system', status: 'ok', message: 'Aucun problème détecté' }],
    recommendations:
      recommendations.length > 0
        ? recommendations
        : [
            {
              priority: 'low',
              title: 'Surveillance continue',
              description: 'Continuer le monitoring régulier.',
            },
          ],
    performanceInsights: insights.length > 0 ? insights : [],
  };
}

// ---------------------------------------------------------------------------
// Route Handlers
// ---------------------------------------------------------------------------

/** GET — Return raw runtime metrics without AI analysis */
export async function GET(): Promise<NextResponse> {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const metrics = await collectMetrics();

    const health: RuntimeHealth = {
      status:
        metrics.database.status === 'down'
          ? 'unhealthy'
          : metrics.database.latencyMs > 1000
            ? 'degraded'
            : 'healthy',
      timestamp: metrics.timestamp,
      version: metrics.version,
      buildId: metrics.buildId,
      environment: metrics.environment,
      region: metrics.region,
      checks: {
        database: {
          status: metrics.database.status,
          latencyMs: metrics.database.latencyMs,
          error: metrics.database.error,
        },
        redis: {
          status: metrics.redis.status,
          latencyMs: metrics.redis.latencyMs,
          error: metrics.redis.error,
        },
        memory: {
          heapUsedMB: metrics.memory.heapUsedMB,
          rssMB: metrics.memory.rssMB,
          percentUsed: metrics.memory.percentUsed,
        },
      },
    };

    return NextResponse.json(
      { success: true, health },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[Diagnostic] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du diagnostic',
      },
      { status: 500 }
    );
  }
}

/** POST — Runtime metrics + Claude AI analysis */
export async function POST(): Promise<NextResponse> {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const metrics = await collectMetrics();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          metrics,
          error: "ANTHROPIC_API_KEY non configurée. L'analyse IA n'est pas disponible.",
        },
        { status: 503 }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const prompt = buildPrompt(metrics);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.3,
      system: DIAGNOSTIC_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const firstBlock = message.content[0];
    const responseText = firstBlock?.type === 'text' ? firstBlock.text : '';
    if (!responseText) {
      throw new Error('Aucune réponse de Claude');
    }

    const analysis = parseDiagnosticResponse(responseText);

    return NextResponse.json(
      { success: true, metrics, analysis },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[Diagnostic] AI error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du diagnostic IA',
      },
      { status: 500 }
    );
  }
}
