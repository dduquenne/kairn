'use client';

import type {
  DeploymentConfig,
  DiagnosticAnalysis,
  GitHubCheckRun,
  GitHubWorkflowRun,
  MaintenanceModeInfo,
  RuntimeHealth,
  VercelDeployment,
  VercelDeploymentState,
} from '@kairn/core/deployment';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  GitBranch,
  GitCommit,
  Globe,
  Activity,
  Database,
  Shield,
  ChevronDown,
  ChevronUp,
  Brain,
  Lightbulb,
  Wrench,
  Loader2,
  Settings,
  Eye,
  Server,
  Zap,
  Info,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = 'overview' | 'ci' | 'health' | 'maintenance';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** State color CSS classes for Vercel deployment states */
function stateClasses(state: VercelDeploymentState): string {
  switch (state) {
    case 'READY':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'ERROR':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'BUILDING':
    case 'INITIALIZING':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'QUEUED':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'CANCELED':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/** French label for deployment state */
function stateLabel(state: VercelDeploymentState): string {
  const labels: Record<VercelDeploymentState, string> = {
    READY: 'En ligne',
    ERROR: 'Erreur',
    BUILDING: 'Build en cours',
    INITIALIZING: 'Initialisation',
    QUEUED: "En file d'attente",
    CANCELED: 'Annulé',
  };
  return labels[state] ?? state;
}

/** State icon component */
function StateIcon({ state }: { state: VercelDeploymentState }) {
  switch (state) {
    case 'READY':
      return <CheckCircle className="h-4 w-4" />;
    case 'ERROR':
      return <XCircle className="h-4 w-4" />;
    case 'BUILDING':
    case 'INITIALIZING':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'QUEUED':
      return <Clock className="h-4 w-4" />;
    case 'CANCELED':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

/** CI conclusion color classes */
function ciClasses(conclusion: string | null): string {
  switch (conclusion) {
    case 'success':
      return 'bg-emerald-500/20 text-emerald-400';
    case 'failure':
      return 'bg-red-500/20 text-red-400';
    case 'cancelled':
      return 'bg-orange-500/20 text-orange-400';
    default:
      return 'bg-blue-500/20 text-blue-400';
  }
}

/** Format timestamp to relative French string */
function relativeTime(ts: number | string): string {
  const date = typeof ts === 'string' ? new Date(ts) : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format build duration */
function buildDuration(dep: VercelDeployment): string {
  if (!dep.buildingAt) return '—';
  const end = dep.readyAt ?? Date.now();
  const sec = Math.round((end - dep.buildingAt) / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

/** Short commit SHA */
function shortSha(sha: string): string {
  return sha.substring(0, 7);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Alert banner for missing configuration */
function ConfigAlert({ config }: { config: DeploymentConfig }) {
  const missing: string[] = [];
  if (!config.vercel.hasToken) missing.push('VERCEL_TOKEN');
  if (!config.vercel.hasProjectId) missing.push('VERCEL_PROJECT_ID');
  if (!config.github.hasToken) missing.push('GITHUB_TOKEN');
  if (!config.github.repository) missing.push('GITHUB_REPOSITORY');

  if (missing.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <h3 className="font-semibold text-amber-300">Configuration incomplète</h3>
          <p className="mt-1 text-sm text-amber-200/80">
            Les variables d&apos;environnement suivantes ne sont pas configurées :
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missing.map(v => (
              <code key={v} className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                {v}
              </code>
            ))}
          </div>
          <p className="mt-2 text-xs text-amber-200/60">
            Configurez ces variables dans les paramètres Vercel ou dans votre fichier .env.local
            pour activer le suivi des déploiements.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Latest deployment hero card */
function LatestDeploymentCard({ deployment }: { deployment: VercelDeployment }) {
  return (
    <div className="border-night/50 rounded-xl border bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 rounded-lg p-2.5">
            <Globe className="text-gold h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Dernier déploiement</h2>
            <p className="text-ivory/50 text-sm">{relativeTime(deployment.createdAt)}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${stateClasses(deployment.state)}`}
        >
          <StateIcon state={deployment.state} />
          {stateLabel(deployment.state)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <div className="text-ivory/40 mb-1 flex items-center gap-1.5 text-xs">
            <GitBranch className="h-3 w-3" />
            Branche
          </div>
          <p className="truncate font-mono text-sm text-white">
            {deployment.git?.commitRef ?? '—'}
          </p>
          {deployment.git?.commitSha && (
            <div className="text-ivory/40 mt-1 flex items-center gap-1 text-xs">
              <GitCommit className="h-3 w-3" />
              <span className="font-mono">{shortSha(deployment.git.commitSha)}</span>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white/5 px-4 py-3">
          <div className="text-ivory/40 mb-1 flex items-center gap-1.5 text-xs">
            <Clock className="h-3 w-3" />
            Durée du build
          </div>
          <p className="font-mono text-sm text-white">{buildDuration(deployment)}</p>
          <p className="text-ivory/40 mt-1 text-xs">
            {deployment.target === 'production' ? 'Production' : 'Preview'}
          </p>
        </div>

        <div className="rounded-lg bg-white/5 px-4 py-3">
          <div className="text-ivory/40 mb-1 flex items-center gap-1.5 text-xs">
            <ExternalLink className="h-3 w-3" />
            Liens
          </div>
          <div className="flex flex-col gap-1">
            <a
              href={`https://${deployment.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold/80 truncate text-sm transition"
            >
              {deployment.url}
            </a>
            {deployment.inspectorUrl && (
              <a
                href={deployment.inspectorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory/50 hover:text-ivory/70 flex items-center gap-1 text-xs transition"
              >
                <Eye className="h-3 w-3" />
                Voir sur Vercel
              </a>
            )}
          </div>
        </div>
      </div>

      {deployment.git?.commitMessage && (
        <div className="mt-4 rounded-lg bg-white/5 px-4 py-3">
          <p className="text-ivory/70 text-sm">
            <span className="text-ivory/40 mr-2 text-xs">{deployment.git.commitAuthorName}</span>
            {deployment.git.commitMessage}
          </p>
        </div>
      )}
    </div>
  );
}

/** Deployment timeline row */
function DeploymentRow({ dep }: { dep: VercelDeployment }) {
  return (
    <div className="border-night/30 flex items-center gap-3 border-b px-4 py-3 transition last:border-0 hover:bg-white/[0.02]">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${stateClasses(dep.state)}`}
      >
        <StateIcon state={dep.state} />
        {stateLabel(dep.state)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm text-white">{dep.git?.commitMessage || dep.url}</span>
          {dep.target === 'production' && (
            <span className="bg-gold/20 text-gold rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
              Prod
            </span>
          )}
        </div>
        <div className="text-ivory/40 mt-0.5 flex items-center gap-3 text-xs">
          {dep.git?.commitRef && (
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              {dep.git.commitRef}
            </span>
          )}
          {dep.git?.commitSha && <span className="font-mono">{shortSha(dep.git.commitSha)}</span>}
          <span>{relativeTime(dep.createdAt)}</span>
          <span>{buildDuration(dep)}</span>
        </div>
      </div>
      {dep.inspectorUrl && (
        <a
          href={dep.inspectorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ivory/30 hover:text-gold shrink-0 transition"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

/** CI Pipeline card */
function CIPipelineCard({ run, loading }: { run: GitHubWorkflowRun | null; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="border-night/50 flex items-center justify-center rounded-xl border bg-gray-900/30 p-8">
        <Loader2 className="text-gold h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="border-night/50 rounded-xl border bg-gray-900/30 p-6 text-center">
        <Info className="text-ivory/30 mx-auto h-8 w-8" />
        <p className="text-ivory/50 mt-2 text-sm">Aucun pipeline CI trouvé</p>
      </div>
    );
  }

  const passedJobs = run.jobs.filter(j => j.conclusion === 'success').length;
  const failedJobs = run.jobs.filter(j => j.conclusion === 'failure').length;
  const totalJobs = run.jobs.length;

  return (
    <div className="border-night/50 rounded-xl border bg-gray-900/30">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2.5 ${
                run.conclusion === 'success'
                  ? 'bg-emerald-500/10'
                  : run.conclusion === 'failure'
                    ? 'bg-red-500/10'
                    : 'bg-blue-500/10'
              }`}
            >
              <Zap
                className={`h-5 w-5 ${
                  run.conclusion === 'success'
                    ? 'text-emerald-400'
                    : run.conclusion === 'failure'
                      ? 'text-red-400'
                      : 'text-blue-400'
                }`}
              />
            </div>
            <div>
              <h2 className="font-semibold text-white">{run.name}</h2>
              <p className="text-ivory/50 text-sm">
                {run.headBranch} &middot; {shortSha(run.headSha)} &middot;{' '}
                {relativeTime(run.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${ciClasses(run.conclusion)}`}
            >
              {run.conclusion === 'success'
                ? 'Réussi'
                : run.conclusion === 'failure'
                  ? 'Échoué'
                  : run.status === 'in_progress'
                    ? 'En cours'
                    : 'En attente'}
            </span>
            <a
              href={run.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ivory/40 hover:text-gold transition"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {totalJobs > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-ivory/50">
                {passedJobs}/{totalJobs} jobs réussis
                {failedJobs > 0 && (
                  <span className="ml-1 text-red-400">
                    ({failedJobs} échoué{failedJobs > 1 ? 's' : ''})
                  </span>
                )}
              </span>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-ivory/40 hover:text-ivory flex items-center gap-1 transition"
              >
                Détails
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${(passedJobs / totalJobs) * 100}%` }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${(failedJobs / totalJobs) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {expanded && run.jobs.length > 0 && (
        <div className="border-night/30 border-t">
          {run.jobs.map((job: GitHubCheckRun) => (
            <div
              key={job.id}
              className="border-night/20 flex items-center justify-between border-b px-6 py-2.5 last:border-0"
            >
              <div className="flex items-center gap-2">
                {job.conclusion === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : job.conclusion === 'failure' ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                )}
                <span className="text-sm text-white">{job.name}</span>
              </div>
              <a
                href={job.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory/30 hover:text-gold transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Runtime health card */
function HealthCard({
  health,
  loading,
  onDiagnostic,
  diagLoading,
  diagResult,
}: {
  health: RuntimeHealth | null;
  loading: boolean;
  onDiagnostic: () => void;
  diagLoading: boolean;
  diagResult: DiagnosticAnalysis | null;
}) {
  if (loading) {
    return (
      <div className="border-night/50 flex items-center justify-center rounded-xl border bg-gray-900/30 p-8">
        <Loader2 className="text-gold h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!health) {
    return (
      <div className="border-night/50 rounded-xl border bg-gray-900/30 p-6 text-center">
        <Activity className="text-ivory/30 mx-auto h-8 w-8" />
        <p className="text-ivory/50 mt-2 text-sm">Impossible de récupérer les métriques</p>
      </div>
    );
  }

  const healthColor =
    health.status === 'healthy'
      ? 'text-emerald-400'
      : health.status === 'degraded'
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <div className="border-night/50 space-y-4 rounded-xl border bg-gray-900/30 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/5 p-2.5">
            <Server className="text-gold h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Santé de l&apos;application</h2>
            <p className="text-ivory/50 text-sm">
              v{health.version} &middot;{' '}
              {health.region ? `Région ${health.region}` : health.environment}
            </p>
          </div>
        </div>
        <span className={`text-sm font-semibold ${healthColor}`}>
          {health.status === 'healthy'
            ? 'Opérationnel'
            : health.status === 'degraded'
              ? 'Dégradé'
              : 'Hors service'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-ivory/50 flex items-center gap-1.5 text-xs">
              <Database className="h-3 w-3" />
              PostgreSQL
            </span>
            <span
              className={`h-2 w-2 rounded-full ${health.checks.database.status === 'up' ? 'bg-emerald-400' : 'bg-red-400'}`}
            />
          </div>
          <p className="mt-1 font-mono text-sm text-white">
            {health.checks.database.latencyMs
              ? `${health.checks.database.latencyMs}ms`
              : health.checks.database.status}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-ivory/50 flex items-center gap-1.5 text-xs">
              <Zap className="h-3 w-3" />
              Redis
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                health.checks.redis.status === 'up'
                  ? 'bg-emerald-400'
                  : health.checks.redis.status === 'disabled'
                    ? 'bg-gray-500'
                    : 'bg-red-400'
              }`}
            />
          </div>
          <p className="mt-1 font-mono text-sm text-white">
            {health.checks.redis.status === 'disabled'
              ? 'Désactivé'
              : health.checks.redis.latencyMs
                ? `${health.checks.redis.latencyMs}ms`
                : health.checks.redis.status}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-ivory/50 flex items-center gap-1.5 text-xs">
              <Activity className="h-3 w-3" />
              Mémoire
            </span>
            <span
              className={`h-2 w-2 rounded-full ${health.checks.memory.percentUsed < 80 ? 'bg-emerald-400' : 'bg-amber-400'}`}
            />
          </div>
          <p className="mt-1 font-mono text-sm text-white">
            {health.checks.memory.heapUsedMB}MB ({health.checks.memory.percentUsed}%)
          </p>
        </div>
      </div>

      <div className="border-night/30 border-t pt-4">
        <button
          onClick={onDiagnostic}
          disabled={diagLoading}
          className="bg-gold/10 text-gold hover:bg-gold/20 disabled:bg-gold/5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
        >
          {diagLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {diagLoading ? 'Analyse en cours…' : 'Diagnostic IA'}
        </button>

        {diagResult && <DiagnosticPanel analysis={diagResult} />}
      </div>
    </div>
  );
}

/** AI Diagnostic result panel */
function DiagnosticPanel({ analysis }: { analysis: DiagnosticAnalysis }) {
  const healthColors: Record<string, string> = {
    excellent: 'text-emerald-400 bg-emerald-500/10',
    good: 'text-emerald-400 bg-emerald-500/10',
    warning: 'text-amber-400 bg-amber-500/10',
    critical: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="mt-4 space-y-4 rounded-lg bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${healthColors[analysis.overallHealth] ?? 'bg-gray-500/10 text-gray-400'}`}
        >
          {analysis.overallHealth}
        </span>
        <p className="text-ivory/70 text-sm">{analysis.summary}</p>
      </div>

      {analysis.findings.length > 0 && (
        <div>
          <h4 className="text-ivory/50 mb-2 text-xs font-semibold uppercase tracking-wider">
            Constats
          </h4>
          <div className="space-y-1.5">
            {analysis.findings.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                {f.status === 'ok' ? (
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : f.status === 'warning' ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                ) : (
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                )}
                <div>
                  <span className="text-ivory/80">{f.message}</span>
                  {f.details && <p className="text-ivory/40 text-xs">{f.details}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.recommendations.length > 0 && (
        <div>
          <h4 className="text-ivory/50 mb-2 text-xs font-semibold uppercase tracking-wider">
            Recommandations
          </h4>
          <div className="space-y-2">
            {analysis.recommendations.map((r, i) => (
              <div key={i} className="border-night/30 rounded-lg border px-3 py-2">
                <div className="flex items-center gap-2">
                  {r.priority === 'high' ? (
                    <Wrench className="h-3.5 w-3.5 text-red-400" />
                  ) : r.priority === 'medium' ? (
                    <Wrench className="h-3.5 w-3.5 text-amber-400" />
                  ) : (
                    <Lightbulb className="h-3.5 w-3.5 text-blue-400" />
                  )}
                  <span className="text-sm font-medium text-white">{r.title}</span>
                </div>
                <p className="text-ivory/50 mt-1 text-xs">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.performanceInsights.length > 0 && (
        <div>
          <h4 className="text-ivory/50 mb-2 text-xs font-semibold uppercase tracking-wider">
            Insights
          </h4>
          <ul className="space-y-1">
            {analysis.performanceInsights.map((insight, i) => (
              <li key={i} className="text-ivory/60 flex items-start gap-2 text-xs">
                <Lightbulb className="text-gold mt-0.5 h-3 w-3 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Maintenance mode panel */
function MaintenancePanel({
  maintenance,
  loading,
  onToggle,
}: {
  maintenance: MaintenanceModeInfo;
  loading: boolean;
  onToggle: (active: boolean) => void;
}) {
  return (
    <div className="border-night/50 rounded-xl border bg-gray-900/30 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg p-2.5 ${maintenance.isActive ? 'bg-amber-500/10' : 'bg-white/5'}`}
          >
            <Shield
              className={`h-5 w-5 ${maintenance.isActive ? 'text-amber-400' : 'text-ivory/50'}`}
            />
          </div>
          <div>
            <h2 className="font-semibold text-white">Mode maintenance</h2>
            <p className="text-ivory/50 text-sm">
              {maintenance.isActive
                ? `Activé par ${maintenance.activatedBy ?? 'système'}`
                : 'Désactivé'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onToggle(!maintenance.isActive)}
          disabled={loading}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
            maintenance.isActive ? 'bg-amber-500' : 'bg-white/20'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              maintenance.isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {maintenance.isActive && maintenance.message && (
        <p className="text-ivory/60 mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm">
          {maintenance.message}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

/**
 * Admin deployment dashboard page.
 * Displays Vercel deployment status, GitHub CI results, runtime health,
 * and maintenance mode controls.
 */
export default function DeploymentPage() {
  const [config, setConfig] = useState<DeploymentConfig | null>(null);
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(true);
  const [ciRun, setCiRun] = useState<GitHubWorkflowRun | null>(null);
  const [ciLoading, setCiLoading] = useState(true);
  const [health, setHealth] = useState<RuntimeHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<DiagnosticAnalysis | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceModeInfo>({ isActive: false });
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showAllDeployments, setShowAllDeployments] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/deployment/config');
      if (res.ok) setConfig(await res.json());
    } catch {
      /* best-effort */
    }
  }, []);

  const fetchDeployments = useCallback(async () => {
    setDeploymentsLoading(true);
    try {
      const res = await fetch('/api/admin/deployment/deployments?limit=20');
      if (res.ok) {
        const data = await res.json();
        setDeployments(data.deployments ?? []);
      }
    } catch {
      /* empty state */
    } finally {
      setDeploymentsLoading(false);
    }
  }, []);

  const fetchCI = useCallback(async () => {
    setCiLoading(true);
    try {
      const res = await fetch('/api/admin/deployment/ci?mode=latest');
      if (res.ok) {
        const data = await res.json();
        setCiRun(data.run ?? null);
      }
    } catch {
      /* empty state */
    } finally {
      setCiLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/admin/deployment/diagnostic');
      if (res.ok) {
        const data = await res.json();
        setHealth(data.health ?? null);
      }
    } catch {
      /* empty state */
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/deployment/maintenance');
      if (res.ok) setMaintenance(await res.json());
    } catch {
      /* keep default */
    }
  }, []);

  const runDiagnostic = useCallback(async () => {
    setDiagLoading(true);
    setDiagResult(null);
    try {
      const res = await fetch('/api/admin/deployment/diagnostic', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDiagResult(data.analysis ?? null);
      }
    } catch {
      /* retry available */
    } finally {
      setDiagLoading(false);
    }
  }, []);

  const toggleMaintenance = useCallback(async (active: boolean) => {
    setMaintenanceLoading(true);
    try {
      const res = await fetch('/api/admin/deployment/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenance(prev => ({ ...prev, isActive: data.isActive }));
      }
    } catch {
      /* keep previous */
    } finally {
      setMaintenanceLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchConfig(),
      fetchDeployments(),
      fetchCI(),
      fetchHealth(),
      fetchMaintenance(),
    ]);
    setRefreshing(false);
  }, [fetchConfig, fetchDeployments, fetchCI, fetchHealth, fetchMaintenance]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const latestDeployment = deployments[0] ?? null;
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: "Vue d'ensemble", icon: <Globe className="h-4 w-4" /> },
    { id: 'ci', label: 'Pipeline CI', icon: <Zap className="h-4 w-4" /> },
    { id: 'health', label: 'Santé', icon: <Activity className="h-4 w-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gold text-2xl font-bold">Déploiement</h1>
          <p className="text-ivory/50 text-sm">Suivi des déploiements Vercel et pipeline CI/CD</p>
        </div>
        <button
          onClick={() => void refreshAll()}
          disabled={refreshing}
          className="bg-gold/10 text-gold hover:bg-gold/20 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {config && <ConfigAlert config={config} />}

      <div className="border-night/50 flex gap-1 border-b pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'text-gold border-gold border-b-2 bg-white/5'
                : 'text-ivory/50 hover:text-ivory/80 border-b-2 border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {deploymentsLoading ? (
            <div className="border-night/50 flex items-center justify-center rounded-xl border bg-gray-900/30 p-12">
              <Loader2 className="text-gold h-6 w-6 animate-spin" />
            </div>
          ) : latestDeployment ? (
            <LatestDeploymentCard deployment={latestDeployment} />
          ) : (
            <div className="border-night/50 rounded-xl border bg-gray-900/30 p-8 text-center">
              <Settings className="text-ivory/20 mx-auto h-10 w-10" />
              <p className="text-ivory/50 mt-3 text-sm">
                {config?.vercel.configured
                  ? 'Aucun déploiement trouvé'
                  : 'Configurez VERCEL_TOKEN et VERCEL_PROJECT_ID pour voir les déploiements'}
              </p>
            </div>
          )}

          {deployments.length > 1 && (
            <div className="border-night/50 rounded-xl border bg-gray-900/30">
              <div className="flex items-center justify-between px-6 py-4">
                <h3 className="font-semibold text-white">Historique des déploiements</h3>
                <button
                  onClick={() => setShowAllDeployments(!showAllDeployments)}
                  className="text-ivory/40 hover:text-ivory flex items-center gap-1 text-xs transition"
                >
                  {showAllDeployments ? 'Voir moins' : `Voir tout (${deployments.length})`}
                  {showAllDeployments ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </div>
              <div className="border-night/30 border-t">
                {(showAllDeployments ? deployments.slice(1) : deployments.slice(1, 6)).map(dep => (
                  <DeploymentRow key={dep.uid} dep={dep} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ci' && <CIPipelineCard run={ciRun} loading={ciLoading} />}

      {activeTab === 'health' && (
        <HealthCard
          health={health}
          loading={healthLoading}
          onDiagnostic={runDiagnostic}
          diagLoading={diagLoading}
          diagResult={diagResult}
        />
      )}

      {activeTab === 'maintenance' && (
        <MaintenancePanel
          maintenance={maintenance}
          loading={maintenanceLoading}
          onToggle={toggleMaintenance}
        />
      )}
    </div>
  );
}
