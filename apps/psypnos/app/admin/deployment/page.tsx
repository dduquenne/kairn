"use client";

import {
  Rocket,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronUp,
  Shield,
  Server,
  GitBranch,
  History,
  Brain,
  Lightbulb,
  Wrench,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface DeploymentInfo {
  id: string;
  status: "pending" | "in_progress" | "success" | "failed" | "rolled_back";
  targetRef: string;
  targetCommit?: string | null;
  previousCommit?: string | null;
  triggeredBy: string;
  triggeredAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  currentPhase?: string | null;
  progress: number;
  logs?: string | null;
  errorMessage?: string | null;
  healthCheckPassed: boolean;
  rolledBackAt?: string | null;
  rollbackReason?: string | null;
}

interface MaintenanceInfo {
  isActive: boolean;
  reason?: string | null;
  message?: string | null;
  activatedBy?: string | null;
  activatedAt?: string | null;
}

interface BranchInfo {
  name: string;
  isDefault: boolean;
  description: string;
}

interface AnalysisSolution {
  title: string;
  description: string;
  commands?: string[];
  priority: "high" | "medium" | "low";
}

interface DeploymentAnalysis {
  summary: string;
  errorType: string;
  phase: string;
  rootCause: string;
  solutions: AnalysisSolution[];
  prevention: string[];
  additionalNotes?: string;
}

const PHASE_NAMES: Record<string, string> = {
  prerequisites: "Vérification des prérequis",
  backup: "Création du backup",
  git: "Mise à jour du code",
  dependencies: "Installation des dépendances",
  migrations: "Migrations base de données",
  build: "Build de l'application",
  deploy: "Déploiement",
  healthcheck: "Vérification de santé",
  rollback: "Rollback en cours",
  complete: "Terminé",
};

export default function DeploymentPage() {
  const [currentDeployment, setCurrentDeployment] = useState<DeploymentInfo | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceInfo | null>(null);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [history, setHistory] = useState<DeploymentInfo[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("main");
  const [customRef, setCustomRef] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // États pour l'analyse IA
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DeploymentAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analyzedDeploymentId, setAnalyzedDeploymentId] = useState<string | null>(null);

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, maintenanceRes] = await Promise.all([
        fetch("/api/admin/deployment/status"),
        fetch("/api/admin/deployment/maintenance"),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        if (data.hasDeployment) {
          setCurrentDeployment(data);
          setIsDeploying(data.status === "in_progress" || data.status === "pending");
        }
      }

      if (maintenanceRes.ok) {
        const data = await maintenanceRes.json();
        setMaintenance(data);
      }
    } catch (err) {
      console.error("Failed to fetch status:", err);
    }
  }, []);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/deployment/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/deployment/history?limit=10");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchBranches();
    fetchHistory();
  }, [fetchStatus, fetchBranches, fetchHistory]);

  // Poll status during deployment
  useEffect(() => {
    if (!isDeploying) return;

    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [isDeploying, fetchStatus]);

  // Trigger deployment
  const handleDeploy = async () => {
    setError(null);
    setSuccess(null);
    setShowConfirmation(false);

    const targetRef = customRef || selectedBranch;

    try {
      const res = await fetch("/api/admin/deployment/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRef }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setIsDeploying(true);
        fetchStatus();
        fetchHistory();
      } else {
        setError(data.message || "Erreur lors du déploiement");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    }
  };

  // Trigger rollback
  const handleRollback = async () => {
    setError(null);
    setSuccess(null);

    if (!confirm("Êtes-vous sûr de vouloir revenir à la version précédente ?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/deployment/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Manual rollback from admin" }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        fetchStatus();
        fetchHistory();
      } else {
        setError(data.message || "Erreur lors du rollback");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    }
  };

  // Toggle maintenance mode
  const handleToggleMaintenance = async () => {
    setError(null);

    try {
      const res = await fetch("/api/admin/deployment/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: !maintenance?.isActive,
          reason: "manual",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMaintenance((prev) => ({
          ...prev,
          isActive: !prev?.isActive,
        }));
      } else {
        setError(data.error || "Erreur");
      }
    } catch (err) {
      setError("Erreur de connexion");
    }
  };

  // Analyse des logs avec Claude
  const handleAnalyzeLogs = async (deploymentId: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    setShowAnalysis(true);
    setAnalyzedDeploymentId(deploymentId);

    try {
      const res = await fetch("/api/admin/deployment/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deploymentId }),
      });

      const data = await res.json();

      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setAnalysisError(data.error || "Erreur lors de l'analyse");
      }
    } catch (err) {
      setAnalysisError("Erreur de connexion au serveur");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "rolled_back":
        return <RotateCcw className="h-5 w-5 text-orange-500" />;
      case "in_progress":
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "Réussi";
      case "failed":
        return "Échoué";
      case "rolled_back":
        return "Rollback effectué";
      case "in_progress":
        return "En cours";
      case "pending":
        return "En attente";
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ivory">Déploiement</h1>
          <p className="mt-1 text-ivory/60">
            Gérez les déploiements et la maintenance du site
          </p>
        </div>
        <button
          onClick={() => {
            fetchStatus();
            fetchHistory();
          }}
          className="flex items-center gap-2 rounded-lg border border-gold/30 px-4 py-2 text-gold transition hover:bg-gold/10"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Current Status */}
      {currentDeployment && (currentDeployment.status === "in_progress" || currentDeployment.status === "pending") && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <div>
                <h3 className="font-semibold text-ivory">Déploiement en cours</h3>
                <p className="text-sm text-ivory/60">
                  {currentDeployment.targetRef} - {PHASE_NAMES[currentDeployment.currentPhase || ""] || "Initialisation"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-400">{currentDeployment.progress}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-night/50">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${currentDeployment.progress}%` }}
            />
          </div>

          {/* Logs toggle */}
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="mt-4 flex items-center gap-2 text-sm text-ivory/60 hover:text-ivory"
          >
            {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showLogs ? "Masquer les logs" : "Afficher les logs"}
          </button>

          {showLogs && currentDeployment.logs && (
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-night/50 p-4 font-mono text-xs text-ivory/80">
              {currentDeployment.logs}
            </pre>
          )}
        </div>
      )}

      {/* Afficher le statut d'un déploiement échoué récent */}
      {currentDeployment && (currentDeployment.status === "failed" || currentDeployment.status === "rolled_back") && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-ivory">
                  Déploiement {currentDeployment.status === "failed" ? "échoué" : "annulé"}
                </h3>
                <p className="text-sm text-ivory/60">
                  {currentDeployment.targetRef} - {PHASE_NAMES[currentDeployment.currentPhase || ""] || "Phase inconnue"}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleAnalyzeLogs(currentDeployment.id)}
              disabled={isAnalyzing && analyzedDeploymentId === currentDeployment.id}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnalyzing && analyzedDeploymentId === currentDeployment.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Analyser avec Claude
                </>
              )}
            </button>
          </div>

          {currentDeployment.errorMessage && (
            <div className="mt-4 rounded-lg bg-night/50 p-3">
              <p className="text-sm font-medium text-red-400">Message d'erreur :</p>
              <p className="mt-1 font-mono text-sm text-ivory/80">{currentDeployment.errorMessage}</p>
            </div>
          )}

          {/* Logs toggle */}
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="mt-4 flex items-center gap-2 text-sm text-ivory/60 hover:text-ivory"
          >
            {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showLogs ? "Masquer les logs" : "Afficher les logs"}
          </button>

          {showLogs && currentDeployment.logs && (
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-night/50 p-4 font-mono text-xs text-ivory/80">
              {currentDeployment.logs}
            </pre>
          )}
        </div>
      )}

      {/* Section d'analyse IA */}
      {showAnalysis && (
        <DeploymentAnalysisPanel
          analysis={analysis}
          isLoading={isAnalyzing}
          error={analysisError}
          onClose={() => {
            setShowAnalysis(false);
            setAnalysis(null);
            setAnalysisError(null);
            setAnalyzedDeploymentId(null);
          }}
        />
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deploy Panel */}
        <div className="rounded-lg border border-night/40 bg-night/50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Rocket className="h-6 w-6 text-gold" />
            <h2 className="text-lg font-semibold text-ivory">Nouveau déploiement</h2>
          </div>

          <div className="space-y-4">
            {/* Branch selector */}
            <div>
              <label className="mb-2 block text-sm text-ivory/70">
                Branche ou tag
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setCustomRef("");
                }}
                disabled={isDeploying}
                className="w-full rounded-lg border border-night/40 bg-night/80 px-4 py-2 text-ivory focus:border-gold/50 focus:outline-none disabled:opacity-50"
              >
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name} {branch.isDefault && "(default)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom ref input */}
            <div>
              <label className="mb-2 block text-sm text-ivory/70">
                Ou entrer un tag de version (ex: v1.2.3)
              </label>
              <input
                type="text"
                value={customRef}
                onChange={(e) => setCustomRef(e.target.value)}
                placeholder="v1.2.3"
                disabled={isDeploying}
                className="w-full rounded-lg border border-night/40 bg-night/80 px-4 py-2 text-ivory placeholder-ivory/30 focus:border-gold/50 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Deploy button */}
            {!showConfirmation ? (
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={isDeploying}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 font-semibold text-night transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Déploiement en cours...
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5" />
                    Déployer
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                    <div>
                      <p className="font-medium text-orange-400">Confirmation requise</p>
                      <p className="mt-1 text-sm text-ivory/70">
                        Vous êtes sur le point de déployer{" "}
                        <strong className="text-ivory">{customRef || selectedBranch}</strong>.
                        Le site sera temporairement indisponible pendant le déploiement.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 rounded-lg border border-night/40 px-4 py-2 text-ivory transition hover:bg-night/60"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeploy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 font-semibold text-night transition hover:bg-gold/90"
                  >
                    <Play className="h-4 w-4" />
                    Confirmer le déploiement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance & Rollback Panel */}
        <div className="space-y-6">
          {/* Maintenance toggle */}
          <div className="rounded-lg border border-night/40 bg-night/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-6 w-6 text-gold" />
              <h2 className="text-lg font-semibold text-ivory">Mode maintenance</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-ivory/70">
                  {maintenance?.isActive
                    ? "Le site est actuellement en maintenance"
                    : "Le site est accessible au public"}
                </p>
                {maintenance?.activatedAt && maintenance.isActive && (
                  <p className="mt-1 text-sm text-ivory/50">
                    Activé le {formatDate(maintenance.activatedAt)}
                  </p>
                )}
              </div>
              <button
                onClick={handleToggleMaintenance}
                className={`relative h-6 w-12 rounded-full transition ${
                  maintenance?.isActive ? "bg-orange-500" : "bg-night/80"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                    maintenance?.isActive ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Rollback button */}
          <div className="rounded-lg border border-night/40 bg-night/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <RotateCcw className="h-6 w-6 text-gold" />
              <h2 className="text-lg font-semibold text-ivory">Rollback</h2>
            </div>

            <p className="mb-4 text-ivory/70">
              Revenir à la dernière version stable en cas de problème.
            </p>

            <button
              onClick={handleRollback}
              disabled={isDeploying}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-3 font-medium text-orange-400 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-5 w-5" />
              Revenir à la version précédente
            </button>
          </div>
        </div>
      </div>

      {/* Server Status - Full width */}
      <div className="rounded-lg border border-night/40 bg-night/50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <Server className="h-6 w-6 text-gold" />
          <h2 className="text-lg font-semibold text-ivory">État du serveur</h2>
        </div>

        <ServerStatus />
      </div>

      {/* History */}
      <div className="rounded-lg border border-night/40 bg-night/50 p-6">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-gold" />
            <h2 className="text-lg font-semibold text-ivory">Historique des déploiements</h2>
          </div>
          {showHistory ? (
            <ChevronUp className="h-5 w-5 text-ivory/60" />
          ) : (
            <ChevronDown className="h-5 w-5 text-ivory/60" />
          )}
        </button>

        {showHistory && (
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-center text-ivory/50">Aucun déploiement</p>
            ) : (
              history.map((deployment) => (
                <div
                  key={deployment.id}
                  className="flex items-center justify-between rounded-lg border border-night/30 bg-night/30 p-4"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(deployment.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-ivory/50" />
                        <span className="font-medium text-ivory">{deployment.targetRef}</span>
                        {deployment.targetCommit && (
                          <span className="font-mono text-xs text-ivory/50">
                            {deployment.targetCommit.substring(0, 7)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-ivory/50">
                        {getStatusText(deployment.status)} - {formatDate(deployment.triggeredAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-ivory/50">{deployment.triggeredBy}</p>
                      {deployment.completedAt && deployment.startedAt && (
                        <p className="text-xs text-ivory/40">
                          Durée: {Math.round(
                            (new Date(deployment.completedAt).getTime() -
                              new Date(deployment.startedAt).getTime()) /
                              1000
                          )}s
                        </p>
                      )}
                    </div>
                    {(deployment.status === "failed" || deployment.status === "rolled_back") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyzeLogs(deployment.id);
                        }}
                        disabled={isAnalyzing && analyzedDeploymentId === deployment.id}
                        className="flex items-center gap-1.5 rounded-lg bg-purple-600/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Analyser les logs avec Claude AI"
                      >
                        {isAnalyzing && analyzedDeploymentId === deployment.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Brain className="h-3.5 w-3.5" />
                        )}
                        Analyser
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Interfaces pour le diagnostic
interface DiagnosticFinding {
  category: string;
  status: "ok" | "warning" | "critical";
  message: string;
  details?: string;
}

interface DiagnosticRecommendation {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  commands?: string[];
}

interface DiagnosticMaintenanceTask {
  task: string;
  frequency: string;
}

interface DiagnosticAnalysis {
  overallHealth: "excellent" | "good" | "warning" | "critical";
  summary: string;
  findings: DiagnosticFinding[];
  recommendations: DiagnosticRecommendation[];
  maintenanceTasks: DiagnosticMaintenanceTask[];
  performanceInsights: string[];
}

interface DiagnosticMetrics {
  timestamp: string;
  uptime: { process: number; system: number };
  memory: {
    process: { heapUsed: number; heapTotal: number; rss: number; percentUsed: number };
    system: { total: number; free: number; used: number; percentUsed: number };
  };
  cpu: { cores: number; model: string; loadAverage: number[] };
  database: { status: string; latencyMs?: number };
  redis: { status: string; latencyMs?: number };
  system: { platform: string; hostname: string; nodeVersion: string };
}

// Server status component
function ServerStatus() {
  const [health, setHealth] = useState<{
    status: string;
    uptime: number | null;
    uptimeMessage?: string;
    version: string;
    checks: {
      database: { status: string; latencyMs?: number };
      memory: { percentUsed: number };
    };
  } | null>(null);

  // État pour le diagnostic
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState(false);
  const [diagnosticMetrics, setDiagnosticMetrics] = useState<DiagnosticMetrics | null>(null);
  const [diagnosticAnalysis, setDiagnosticAnalysis] = useState<DiagnosticAnalysis | null>(null);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          setHealth(await res.json());
        }
      } catch {
        // Ignore
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRunDiagnostic = async () => {
    setIsLoadingDiagnostic(true);
    setDiagnosticError(null);
    setDiagnosticAnalysis(null);
    setShowDiagnostic(true);

    try {
      const res = await fetch("/api/admin/deployment/diagnostic", {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setDiagnosticMetrics(data.metrics);
        setDiagnosticAnalysis(data.analysis);
      } else {
        setDiagnosticError(data.error || "Erreur lors du diagnostic");
        if (data.metrics) {
          setDiagnosticMetrics(data.metrics);
        }
      }
    } catch {
      setDiagnosticError("Erreur de connexion au serveur");
    } finally {
      setIsLoadingDiagnostic(false);
    }
  };

  if (!health) {
    return <p className="text-ivory/50">Chargement...</p>;
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}j ${hours}h ${mins}m`;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "text-green-400";
      case "good":
        return "text-blue-400";
      case "warning":
        return "text-orange-400";
      case "critical":
        return "text-red-400";
      default:
        return "text-ivory/60";
    }
  };

  const getHealthLabel = (health: string) => {
    switch (health) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Bon";
      case "warning":
        return "Attention";
      case "critical":
        return "Critique";
      default:
        return health;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Haute</span>;
      case "medium":
        return <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">Moyenne</span>;
      case "low":
        return <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">Basse</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-ivory/70">Version déployée</span>
        <span className="font-mono font-medium text-gold">
          v{health.version}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ivory/70">Statut</span>
        <span
          className={`font-medium ${
            health.status === "healthy"
              ? "text-green-400"
              : health.status === "degraded"
              ? "text-orange-400"
              : "text-red-400"
          }`}
        >
          {health.status === "healthy" ? "Opérationnel" : health.status === "degraded" ? "Dégradé" : "Problème"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ivory/70">Uptime</span>
        <span className={health.uptime !== null ? "text-ivory" : "text-ivory/50 italic"}>
          {health.uptime !== null ? formatUptime(health.uptime) : health.uptimeMessage || "Non disponible"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ivory/70">Base de données</span>
        <span
          className={
            health.checks.database.status === "up" ? "text-green-400" : "text-red-400"
          }
        >
          {health.checks.database.status === "up"
            ? `OK (${health.checks.database.latencyMs}ms)`
            : "Erreur"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ivory/70">Mémoire</span>
        <span
          className={
            health.checks.memory.percentUsed < 75
              ? "text-green-400"
              : health.checks.memory.percentUsed < 90
              ? "text-orange-400"
              : "text-red-400"
          }
        >
          {health.checks.memory.percentUsed}%
        </span>
      </div>

      {/* Bouton de diagnostic */}
      <button
        onClick={handleRunDiagnostic}
        disabled={isLoadingDiagnostic}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-400 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoadingDiagnostic ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Diagnostic en cours...
          </>
        ) : (
          <>
            <Brain className="h-4 w-4" />
            Diagnostic approfondi avec Claude
          </>
        )}
      </button>

      {/* Panneau de diagnostic */}
      {showDiagnostic && (
        <div className="mt-4 rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <h4 className="font-semibold text-ivory">Diagnostic serveur</h4>
            </div>
            <button
              onClick={() => {
                setShowDiagnostic(false);
                setDiagnosticAnalysis(null);
                setDiagnosticMetrics(null);
                setDiagnosticError(null);
              }}
              className="rounded p-1 text-ivory/60 transition hover:bg-night/50 hover:text-ivory"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>

          {/* Loading */}
          {isLoadingDiagnostic && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="mt-3 text-sm text-ivory/70">Collecte et analyse des métriques...</p>
            </div>
          )}

          {/* Error */}
          {diagnosticError && !isLoadingDiagnostic && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-sm text-red-400">{diagnosticError}</p>
              </div>
            </div>
          )}

          {/* Métriques brutes (toujours affichées si disponibles) */}
          {diagnosticMetrics && !isLoadingDiagnostic && (
            <div className="space-y-4">
              {/* Overall Health */}
              {diagnosticAnalysis && (
                <div className="rounded-lg border border-night/40 bg-night/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ivory/70">État global</span>
                    <span className={`font-semibold ${getHealthColor(diagnosticAnalysis.overallHealth)}`}>
                      {getHealthLabel(diagnosticAnalysis.overallHealth)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ivory/80">{diagnosticAnalysis.summary}</p>
                </div>
              )}

              {/* Métriques détaillées */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-night/40 bg-night/30 p-3">
                  <p className="text-xs text-ivory/50">Mémoire système</p>
                  <p className="mt-1 text-lg font-semibold text-ivory">
                    {diagnosticMetrics.memory.system.percentUsed}%
                  </p>
                  <p className="text-xs text-ivory/50">
                    {diagnosticMetrics.memory.system.used} / {diagnosticMetrics.memory.system.total} MB
                  </p>
                </div>
                <div className="rounded-lg border border-night/40 bg-night/30 p-3">
                  <p className="text-xs text-ivory/50">CPU Load (1m)</p>
                  <p className="mt-1 text-lg font-semibold text-ivory">
                    {(diagnosticMetrics.cpu.loadAverage[0] ?? 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-ivory/50">{diagnosticMetrics.cpu.cores} coeurs</p>
                </div>
                <div className="rounded-lg border border-night/40 bg-night/30 p-3">
                  <p className="text-xs text-ivory/50">Uptime système</p>
                  <p className="mt-1 text-lg font-semibold text-ivory">
                    {formatUptime(diagnosticMetrics.uptime.system)}
                  </p>
                </div>
                <div className="rounded-lg border border-night/40 bg-night/30 p-3">
                  <p className="text-xs text-ivory/50">Redis</p>
                  <p className={`mt-1 text-lg font-semibold ${
                    diagnosticMetrics.redis.status === "up"
                      ? "text-green-400"
                      : diagnosticMetrics.redis.status === "disabled"
                      ? "text-ivory/50"
                      : "text-red-400"
                  }`}>
                    {diagnosticMetrics.redis.status === "up"
                      ? `OK (${diagnosticMetrics.redis.latencyMs}ms)`
                      : diagnosticMetrics.redis.status === "disabled"
                      ? "Désactivé"
                      : "Erreur"}
                  </p>
                </div>
              </div>

              {/* Findings */}
              {diagnosticAnalysis && diagnosticAnalysis.findings.length > 0 && (
                <div>
                  <h5 className="mb-2 flex items-center gap-2 text-sm font-medium text-ivory">
                    <AlertCircle className="h-4 w-4 text-gold" />
                    Constats
                  </h5>
                  <div className="space-y-2">
                    {diagnosticAnalysis.findings.map((finding, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-lg border border-night/40 bg-night/30 p-2"
                      >
                        {getStatusIcon(finding.status)}
                        <div className="flex-1">
                          <p className="text-sm text-ivory">{finding.message}</p>
                          {finding.details && (
                            <p className="mt-1 text-xs text-ivory/60">{finding.details}</p>
                          )}
                        </div>
                        <span className="text-xs text-ivory/40">{finding.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {diagnosticAnalysis && diagnosticAnalysis.recommendations.length > 0 && (
                <div>
                  <h5 className="mb-2 flex items-center gap-2 text-sm font-medium text-ivory">
                    <Lightbulb className="h-4 w-4 text-gold" />
                    Recommandations
                  </h5>
                  <div className="space-y-2">
                    {diagnosticAnalysis.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-night/40 bg-night/30 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-ivory">{rec.title}</p>
                          {getPriorityBadge(rec.priority)}
                        </div>
                        <p className="mt-1 text-sm text-ivory/70">{rec.description}</p>
                        {rec.commands && rec.commands.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {rec.commands.map((cmd, cmdIndex) => (
                              <code
                                key={cmdIndex}
                                className="block rounded bg-night/50 px-2 py-1 font-mono text-xs text-green-400"
                              >
                                $ {cmd}
                              </code>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Maintenance Tasks */}
              {diagnosticAnalysis && diagnosticAnalysis.maintenanceTasks.length > 0 && (
                <div>
                  <h5 className="mb-2 flex items-center gap-2 text-sm font-medium text-ivory">
                    <Wrench className="h-4 w-4 text-gold" />
                    Maintenance préventive
                  </h5>
                  <div className="rounded-lg border border-night/40 bg-night/30 p-3">
                    <ul className="space-y-2">
                      {diagnosticAnalysis.maintenanceTasks.map((task, index) => (
                        <li key={index} className="flex items-center justify-between text-sm">
                          <span className="text-ivory/80">{task.task}</span>
                          <span className="rounded-full bg-night/50 px-2 py-0.5 text-xs text-ivory/50">
                            {task.frequency}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Performance Insights */}
              {diagnosticAnalysis && diagnosticAnalysis.performanceInsights.length > 0 && (
                <div>
                  <h5 className="mb-2 flex items-center gap-2 text-sm font-medium text-ivory">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    Observations
                  </h5>
                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                    <ul className="space-y-1">
                      {diagnosticAnalysis.performanceInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-ivory/80">
                          <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* System Info */}
              <div className="rounded-lg border border-night/40 bg-night/30 p-3">
                <p className="text-xs text-ivory/50">Informations système</p>
                <p className="mt-1 text-sm text-ivory/70">
                  {diagnosticMetrics.system.platform} • {diagnosticMetrics.system.hostname} • Node {diagnosticMetrics.system.nodeVersion}
                </p>
                <p className="mt-1 text-xs text-ivory/40">
                  Diagnostic effectué le {new Date(diagnosticMetrics.timestamp).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Panneau d'analyse IA
interface DeploymentAnalysisPanelProps {
  analysis: DeploymentAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

function DeploymentAnalysisPanel({
  analysis,
  isLoading,
  error,
  onClose,
}: DeploymentAnalysisPanelProps) {
  const [expandedSolution, setExpandedSolution] = useState<number | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500/50 bg-red-500/10";
      case "medium":
        return "border-orange-500/50 bg-orange-500/10";
      case "low":
        return "border-blue-500/50 bg-blue-500/10";
      default:
        return "border-night/40 bg-night/50";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return { text: "Priorité haute", color: "text-red-400" };
      case "medium":
        return { text: "Priorité moyenne", color: "text-orange-400" };
      case "low":
        return { text: "Priorité basse", color: "text-blue-400" };
      default:
        return { text: "Normal", color: "text-ivory/60" };
    }
  };

  return (
    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ivory">Analyse IA des logs</h3>
            <p className="text-sm text-ivory/60">Diagnostic et recommandations par Claude</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-ivory/60 transition hover:bg-night/50 hover:text-ivory"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
          <p className="mt-4 text-ivory/70">Analyse des logs en cours...</p>
          <p className="mt-1 text-sm text-ivory/50">Cela peut prendre quelques secondes</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="mt-4 text-red-400">{error}</p>
        </div>
      )}

      {/* Analysis results */}
      {analysis && !isLoading && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-lg border border-night/40 bg-night/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
              <div>
                <h4 className="font-medium text-ivory">Résumé</h4>
                <p className="mt-1 text-ivory/80">{analysis.summary}</p>
              </div>
            </div>
          </div>

          {/* Error info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-night/40 bg-night/30 p-4">
              <p className="text-sm text-ivory/60">Type d'erreur</p>
              <p className="mt-1 font-mono text-sm text-red-400">{analysis.errorType}</p>
            </div>
            <div className="rounded-lg border border-night/40 bg-night/30 p-4">
              <p className="text-sm text-ivory/60">Phase d'échec</p>
              <p className="mt-1 font-medium text-ivory">{analysis.phase}</p>
            </div>
          </div>

          {/* Root cause */}
          <div className="rounded-lg border border-night/40 bg-night/30 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <h4 className="font-medium text-ivory">Cause racine</h4>
                <p className="mt-1 whitespace-pre-wrap text-ivory/80">{analysis.rootCause}</p>
              </div>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-gold" />
              <h4 className="font-semibold text-ivory">Solutions recommandées</h4>
            </div>
            <div className="space-y-3">
              {analysis.solutions.map((solution, index) => {
                const priority = getPriorityLabel(solution.priority);
                const isExpanded = expandedSolution === index;

                return (
                  <div
                    key={index}
                    className={`rounded-lg border ${getPriorityColor(solution.priority)} p-4`}
                  >
                    <button
                      onClick={() => setExpandedSolution(isExpanded ? null : index)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Lightbulb className="h-5 w-5 text-gold" />
                        <div>
                          <p className="font-medium text-ivory">{solution.title}</p>
                          <p className={`text-xs ${priority.color}`}>{priority.text}</p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 text-ivory/60 transition ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-3 border-t border-night/30 pt-4">
                        <p className="text-ivory/80">{solution.description}</p>

                        {solution.commands && solution.commands.length > 0 && (
                          <div>
                            <p className="mb-2 text-sm font-medium text-ivory/60">
                              Commandes suggérées :
                            </p>
                            <div className="space-y-1">
                              {solution.commands.map((cmd, cmdIndex) => (
                                <div
                                  key={cmdIndex}
                                  className="flex items-center gap-2 rounded bg-night/50 px-3 py-2"
                                >
                                  <code className="flex-1 font-mono text-sm text-green-400">
                                    $ {cmd}
                                  </code>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(cmd)}
                                    className="rounded p-1 text-ivory/40 transition hover:bg-night/50 hover:text-ivory"
                                    title="Copier la commande"
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prevention */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold text-ivory">Prévention</h4>
            </div>
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <ul className="space-y-2">
                {analysis.prevention.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span className="text-ivory/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Additional notes */}
          {analysis.additionalNotes && (
            <div className="rounded-lg border border-night/40 bg-night/30 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                <div>
                  <h4 className="font-medium text-ivory">Notes additionnelles</h4>
                  <p className="mt-1 whitespace-pre-wrap text-ivory/70">{analysis.additionalNotes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
