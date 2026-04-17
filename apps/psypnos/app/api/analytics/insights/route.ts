import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

import {
  getAnalyticsSummary,
  getAnalyticsSummaryWithComparison,
  getTrafficSources,
} from '../store-index';

export const dynamic = 'force-dynamic';

// Vercel serverless function timeout — single Claude API call
export const maxDuration = 60;

interface Insight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  metric?: string;
  value?: string | number;
}

interface TopSection {
  section: string;
  visits: number;
  avgTime: number;
}

interface ConversionData {
  clicks: number;
  completed: number;
  rate: number;
}

interface TrafficSource {
  source: string;
  medium: string;
  visits: number;
  conversionRate: number;
}

interface AnalyticsSummary {
  totalVisits: number;
  uniqueSessions: number;
  averageTimeOnSite: number;
  conversionRate: number;
  topSections: TopSection[];
  conversionByType: Record<string, ConversionData>;
}

interface AnalyticsComparison {
  current: {
    totalVisits: number;
    uniqueSessions: number;
    averageTimeOnSite: number;
    conversionRate: number;
  };
  previous: {
    totalVisits: number;
    uniqueSessions: number;
    averageTimeOnSite: number;
    conversionRate: number;
  };
  comparison: {
    totalVisitsChange: number;
    uniqueSessionsChange: number;
    averageTimeOnSiteChange: number;
    conversionRateChange: number;
  };
}

/**
 * Generate AI-powered insights from analytics data using Claude
 * Analyzes trends, anomalies, and provides actionable recommendations
 */
export async function GET(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY non configurée' }, { status: 500 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = (searchParams.get('timeRange') || 'week') as
      | 'day'
      | 'week'
      | 'month'
      | 'year';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Fetch analytics data — now respects date filters
    const [summary, comparison, trafficSources] = await Promise.all([
      getAnalyticsSummary(startDate, endDate) as Promise<AnalyticsSummary>,
      getAnalyticsSummaryWithComparison(timeRange) as Promise<AnalyticsComparison>,
      getTrafficSources(startDate, endDate) as Promise<TrafficSource[]>,
    ]);

    // Prepare prompt for Claude
    const prompt = `Tu es un expert en analyse de données web et en optimisation de conversion. Analyse les données analytics suivantes d'un site de psychothérapie (Psypnos) et génère 3-5 insights actionnables.

**Métriques actuelles:**
- Visites totales: ${summary.totalVisits}
- Sessions uniques: ${summary.uniqueSessions}
- Temps moyen sur site: ${Math.round(summary.averageTimeOnSite / 60000)} minutes
- Taux de conversion global: ${summary.conversionRate.toFixed(2)}%

**Comparaison vs période précédente (${timeRange === 'day' ? 'hier' : timeRange === 'week' ? 'semaine dernière' : timeRange === 'month' ? 'mois dernier' : 'année dernière'}):**
- Visites: ${comparison.comparison.totalVisitsChange >= 0 ? '+' : ''}${comparison.comparison.totalVisitsChange.toFixed(1)}%
- Sessions: ${comparison.comparison.uniqueSessionsChange >= 0 ? '+' : ''}${comparison.comparison.uniqueSessionsChange.toFixed(1)}%
- Temps moyen: ${comparison.comparison.averageTimeOnSiteChange >= 0 ? '+' : ''}${comparison.comparison.averageTimeOnSiteChange.toFixed(1)}%
- Taux de conversion: ${comparison.comparison.conversionRateChange >= 0 ? '+' : ''}${comparison.comparison.conversionRateChange.toFixed(2)}% (points)

**Top 3 sections les plus visitées:**
${summary.topSections
  .slice(0, 3)
  .map(
    (s, i) =>
      `${i + 1}. ${s.section}: ${s.visits} visites (${Math.round(s.avgTime / 1000)}s en moyenne)`
  )
  .join('\n')}

**Conversions par type:**
${Object.entries(summary.conversionByType)
  .map(
    ([type, data]) =>
      `- ${type}: ${data.completed} complétées sur ${data.clicks} clics (${data.rate.toFixed(1)}%)`
  )
  .join('\n')}

**Top 3 sources de trafic:**
${trafficSources
  .slice(0, 3)
  .map(
    (s, i) =>
      `${i + 1}. ${s.source} (${s.medium}): ${s.visits} visites, conversion ${s.conversionRate.toFixed(1)}%`
  )
  .join('\n')}

**Instructions:**
1. Identifie les patterns intéressants ou préoccupants
2. Pour chaque insight, explique POURQUOI c'est important pour un site de psychothérapie
3. Propose une action CONCRÈTE et spécifique
4. Priorise les insights par impact potentiel

Réponds UNIQUEMENT avec un JSON valide dans ce format exact (pas de markdown, pas de texte avant/après):
{
  "insights": [
    {
      "type": "positive" | "negative" | "neutral" | "warning",
      "title": "Titre court et percutant",
      "description": "Explication claire de l'observation (2-3 phrases max)",
      "action": "Action concrète recommandée avec étapes spécifiques",
      "priority": "high" | "medium" | "low",
      "metric": "Métrique concernée (optionnel)",
      "value": "Valeur actuelle (optionnel)"
    }
  ]
}`;

    // Call Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse response
    const firstBlock = message.content[0];
    const responseText = firstBlock?.type === 'text' ? firstBlock.text : '';

    let insights: Insight[] = [];

    try {
      const parsed = JSON.parse(responseText);
      insights = parsed.insights || [];
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);

      // Fallback: Generate basic insights from data
      insights = generateFallbackInsights(summary, comparison);
    }

    return Response.json(
      {
        insights,
        generatedAt: new Date().toISOString(),
        model: 'claude-sonnet-4-6',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating insights:', error);

    // Return fallback insights on error
    const startDate = request.nextUrl.searchParams.get('startDate') || undefined;
    const endDate = request.nextUrl.searchParams.get('endDate') || undefined;
    const summary = (await getAnalyticsSummary(startDate, endDate)) as AnalyticsSummary;
    const comparison = (await getAnalyticsSummaryWithComparison('week')) as AnalyticsComparison;

    return Response.json(
      {
        insights: generateFallbackInsights(summary, comparison),
        generatedAt: new Date().toISOString(),
        model: 'fallback',
        error: 'AI insights unavailable, showing basic analysis',
      },
      { status: 200 }
    );
  }
}

/**
 * Generate fallback insights when AI is unavailable
 */
function generateFallbackInsights(
  summary: AnalyticsSummary,
  comparison: AnalyticsComparison
): Insight[] {
  const insights: Insight[] = [];

  // Traffic trend
  if (comparison.comparison.totalVisitsChange > 10) {
    insights.push({
      type: 'positive',
      title: '📈 Forte croissance du trafic',
      description: `Le trafic a augmenté de ${comparison.comparison.totalVisitsChange.toFixed(1)}% par rapport à la période précédente. Cette croissance indique une bonne visibilité du site.`,
      action:
        'Continuez vos efforts actuels de marketing et identifiez les canaux qui performent le mieux pour les renforcer.',
      priority: 'high',
      metric: 'Visites',
      value: `+${comparison.comparison.totalVisitsChange.toFixed(1)}%`,
    });
  } else if (comparison.comparison.totalVisitsChange < -10) {
    insights.push({
      type: 'warning',
      title: '⚠️ Baisse du trafic',
      description: `Le trafic a diminué de ${Math.abs(comparison.comparison.totalVisitsChange).toFixed(1)}%. Il est important d'identifier rapidement les causes.`,
      action:
        'Vérifiez vos campagnes marketing, le référencement SEO, et analysez si des changements techniques ont pu impacter la visibilité.',
      priority: 'high',
      metric: 'Visites',
      value: `${comparison.comparison.totalVisitsChange.toFixed(1)}%`,
    });
  }

  // Conversion rate
  if (summary.conversionRate < 2) {
    insights.push({
      type: 'warning',
      title: '🎯 Taux de conversion à optimiser',
      description: `Le taux de conversion actuel de ${summary.conversionRate.toFixed(1)}% est inférieur à la moyenne du secteur (3-5%). Il y a une opportunité d'amélioration.`,
      action:
        "Simplifiez les formulaires de contact, ajoutez des témoignages visibles, et testez différents appels à l'action (CTA) plus persuasifs.",
      priority: 'high',
      metric: 'Taux de conversion',
      value: `${summary.conversionRate.toFixed(1)}%`,
    });
  } else if (summary.conversionRate > 5) {
    insights.push({
      type: 'positive',
      title: '✨ Excellent taux de conversion',
      description: `Votre taux de conversion de ${summary.conversionRate.toFixed(1)}% est supérieur à la moyenne du secteur. Vos visiteurs sont bien qualifiés.`,
      action:
        "Documentez ce qui fonctionne bien (CTA, parcours utilisateur, contenu) pour reproduire ces succès sur d'autres pages.",
      priority: 'medium',
      metric: 'Taux de conversion',
      value: `${summary.conversionRate.toFixed(1)}%`,
    });
  }

  // Engagement time
  const avgTimeMinutes = Math.round(summary.averageTimeOnSite / 60000);
  if (avgTimeMinutes < 2) {
    insights.push({
      type: 'negative',
      title: "⏱️ Temps d'engagement faible",
      description: `Les visiteurs passent en moyenne seulement ${avgTimeMinutes} minute(s) sur le site. Cela suggère un manque d'engagement avec le contenu.`,
      action:
        "Améliorez la qualité et la pertinence du contenu, ajoutez des vidéos explicatives, et optimisez la navigation pour encourager l'exploration.",
      priority: 'medium',
      metric: 'Temps moyen',
      value: `${avgTimeMinutes} min`,
    });
  } else if (avgTimeMinutes > 4) {
    insights.push({
      type: 'positive',
      title: '📚 Fort engagement des visiteurs',
      description: `Les visiteurs passent en moyenne ${avgTimeMinutes} minutes sur le site, ce qui indique un fort intérêt pour votre contenu.`,
      action:
        'Capitalisez sur cet engagement en ajoutant des CTA stratégiques dans le contenu le plus consulté pour convertir ces visiteurs engagés.',
      priority: 'low',
      metric: 'Temps moyen',
      value: `${avgTimeMinutes} min`,
    });
  }

  // Conversion funnel
  const conversionTypes = Object.entries(summary.conversionByType);
  if (conversionTypes.length > 0) {
    const worstFunnel = conversionTypes.reduce((worst, current) =>
      current[1].rate < worst[1].rate ? current : worst
    );

    if (worstFunnel && worstFunnel[1].rate < 30) {
      insights.push({
        type: 'warning',
        title: "🔄 Abandon dans l'entonnoir",
        description: `Le tunnel "${worstFunnel[0]}" a un taux de complétion de seulement ${worstFunnel[1].rate.toFixed(1)}%. Beaucoup de visiteurs abandonnent avant la fin.`,
        action:
          "Simplifiez le parcours, réduisez le nombre d'étapes, et ajoutez des indicateurs de progression pour rassurer les utilisateurs.",
        priority: 'high',
        metric: worstFunnel[0],
        value: `${worstFunnel[1].rate.toFixed(1)}%`,
      });
    }
  }

  return insights.slice(0, 5); // Max 5 insights
}
