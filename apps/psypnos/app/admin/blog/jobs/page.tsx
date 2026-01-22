"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  Filter,
  Search,
  ChevronRight,
  Play,
  FileEdit,
} from "lucide-react";
import { useToast } from "../../../../components/ui/toast";

type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface BlogJob {
  id: string;
  status: JobStatus;
  progress: number;
  currentStep: string | null;
  totalSteps: number;
  topic: string;
  input: {
    topic?: string;
    category?: string;
    targetLength?: string;
  };
  error: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  usedAt: string | null;
  articleSlug: string | null;
}

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; color: string; bgColor: string; icon: typeof Clock }
> = {
  PENDING: {
    label: "En attente",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    icon: Clock,
  },
  PROCESSING: {
    label: "En cours",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    icon: Loader2,
  },
  COMPLETED: {
    label: "Terminé",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Échoué",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    icon: XCircle,
  },
};

const STEP_NAMES = [
  "Plan détaillé",
  "Introduction",
  "Sections",
  "Conclusion",
  "Révision",
  "SEO",
  "Tags",
  "FAQ",
  "Image",
];

const POLLING_INTERVAL_MS = 3000;

export default function BlogJobsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [jobs, setJobs] = useState<BlogJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const loadJobs = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await fetch(`/api/blog/jobs?limit=50&t=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Erreur lors du chargement des jobs");

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Erreur:", error);
      if (showLoading) {
        addToast({
          title: "Erreur lors du chargement des jobs",
          variant: "error",
        });
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [addToast]);

  // Chargement initial
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Polling automatique si des jobs sont en cours
  useEffect(() => {
    const hasActiveJobs = jobs.some(
      (job) => job.status === "PENDING" || job.status === "PROCESSING"
    );

    if (hasActiveJobs && !pollingRef.current) {
      setIsPolling(true);
      pollingRef.current = setInterval(() => {
        loadJobs(false);
      }, POLLING_INTERVAL_MS);
    } else if (!hasActiveJobs && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      setIsPolling(false);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [jobs, loadJobs]);

  // Filtrage des jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesSearch =
        searchQuery === "" ||
        job.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.input?.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [jobs, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "PENDING").length,
      processing: jobs.filter((j) => j.status === "PROCESSING").length,
      completed: jobs.filter((j) => j.status === "COMPLETED").length,
      failed: jobs.filter((j) => j.status === "FAILED").length,
    };
  }, [jobs]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (startedAt: string | null, completedAt: string | null) => {
    if (!startedAt) return "-";
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const duration = Math.round((end - start) / 1000);

    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getCurrentStepIndex = (currentStep: string | null): number => {
    if (!currentStep) return 0;
    const stepLower = currentStep.toLowerCase();
    if (stepLower.includes("plan")) return 1;
    if (stepLower.includes("introduction") || stepLower.includes("intro")) return 2;
    if (stepLower.includes("section")) return 3;
    if (stepLower.includes("conclusion")) return 4;
    if (stepLower.includes("révision") || stepLower.includes("cohérence")) return 5;
    if (stepLower.includes("seo") || stepLower.includes("titre")) return 6;
    if (stepLower.includes("tag")) return 7;
    if (stepLower.includes("faq")) return 8;
    if (stepLower.includes("image")) return 9;
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/blog")}
            className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold">Blog</p>
            <h1 className="mt-1 text-2xl font-semibold text-ivory">
              Génération d'articles
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isPolling && (
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Actualisation auto</span>
            </div>
          )}
          <button
            onClick={() => loadJobs()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gold/30 px-4 py-2 text-sm font-medium text-ivory/80 transition hover:bg-gold/10 hover:text-ivory disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button
            onClick={() => router.push("/admin/blog/new")}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-night transition hover:bg-gold/90"
          >
            <Play className="h-4 w-4" />
            Nouveau
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-5"
      >
        <div className="rounded-lg border border-gold/20 bg-night/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-ivory/50">
            Total
          </p>
          <p className="mt-1 text-2xl font-bold text-ivory">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400/70">
            En attente
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{stats.pending}</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/70">
            En cours
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{stats.processing}</p>
        </div>
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-green-400/70">
            Terminés
          </p>
          <p className="mt-1 text-2xl font-bold text-green-400">{stats.completed}</p>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-red-400/70">
            Échoués
          </p>
          <p className="mt-1 text-2xl font-bold text-red-400">{stats.failed}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ivory/40" />
          <input
            type="text"
            placeholder="Rechercher par sujet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gold/20 bg-night/50 py-2.5 pl-10 pr-4 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-ivory/50" />
          <div className="flex rounded-lg border border-gold/20 bg-night/50 p-1">
            {[
              { value: "all", label: "Tous" },
              { value: "PROCESSING", label: "En cours" },
              { value: "COMPLETED", label: "Terminés" },
              { value: "FAILED", label: "Échoués" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value as JobStatus | "all")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === option.value
                    ? "bg-gold/20 text-gold"
                    : "text-ivory/60 hover:text-ivory"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Jobs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="space-y-3"
      >
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-gold/10 bg-night/40"
              />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-ivory/20" />
            <p className="mt-4 text-lg text-ivory/50">
              {jobs.length === 0
                ? "Aucun job de génération"
                : "Aucun job ne correspond aux filtres"}
            </p>
            <p className="mt-2 text-sm text-ivory/30">
              Lancez une génération depuis la page &quot;Nouvel article&quot;
            </p>
          </div>
        ) : (
          filteredJobs.map((job, index) => {
            const statusConfig = STATUS_CONFIG[job.status];
            const StatusIcon = statusConfig.icon;
            const stepIndex = getCurrentStepIndex(job.currentStep);

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 transition hover:border-gold/40"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left: Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${statusConfig.bgColor}`}
                      >
                        <StatusIcon
                          className={`h-5 w-5 ${statusConfig.color} ${
                            job.status === "PROCESSING" ? "animate-spin" : ""
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-ivory line-clamp-1">
                          {job.topic}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ivory/50">
                          {job.input?.category && (
                            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-gold/80">
                              {job.input.category}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(job.createdAt)}
                          </span>
                          {job.startedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(job.startedAt, job.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress for PROCESSING jobs */}
                    {job.status === "PROCESSING" && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ivory/60">
                            {job.currentStep || "Initialisation..."}
                          </span>
                          <span className="text-gold">{job.progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-night/60">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
                          />
                        </div>
                        {/* Steps indicator */}
                        <div className="flex justify-between gap-1">
                          {STEP_NAMES.map((step, i) => (
                            <div
                              key={step}
                              className={`flex-1 rounded-sm py-0.5 text-center text-[9px] font-medium transition ${
                                i + 1 < stepIndex
                                  ? "bg-gold/30 text-gold"
                                  : i + 1 === stepIndex
                                  ? "bg-gold/50 text-gold animate-pulse"
                                  : "bg-night/40 text-ivory/30"
                              }`}
                              title={step}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error message for FAILED jobs */}
                    {job.status === "FAILED" && job.error && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{job.error}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 lg:flex-shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>

                    {job.usedAt && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Article créé
                      </span>
                    )}

                    {job.status === "COMPLETED" && (
                      job.usedAt && job.articleSlug ? (
                        <button
                          onClick={() => {
                            router.push(`/admin/blog/edit/${job.articleSlug}`);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 transition hover:bg-green-500/30"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          Modifier
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            router.push(`/admin/blog/new?jobId=${job.id}`);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gold/20 px-3 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/30"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          Utiliser
                        </button>
                      )
                    )}

                    <ChevronRight className="h-5 w-5 text-ivory/30" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs text-ivory/40">
        <span>Les étapes de génération :</span>
        {STEP_NAMES.map((step, i) => (
          <span key={step} className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-gold/20 text-[10px] font-medium text-gold">
              {i + 1}
            </span>
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}
