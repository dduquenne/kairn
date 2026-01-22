// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Calendar, Smartphone, Globe, BarChart3 } from "lucide-react";

interface Cohort {
  cohortName: string;
  acquisitionDate?: string;
  userCount: number;
  retentionDay1: number;
  retentionDay7: number;
  retentionDay30: number;
  conversions: number;
  conversionRate: number;
  averageSessionDuration: number;
  averagePageViews: number;
}

interface CohortResponse {
  cohortBy: string;
  cohorts: Cohort[];
  summary: {
    totalCohorts: number;
    totalUsers: number;
    avgConversionRate: number;
    avgRetentionDay7: number;
  };
}

interface CohortAnalysisProps {
  startDate?: string;
  endDate?: string;
}

type CohortByType = 'week' | 'month' | 'utm_source' | 'referrer' | 'device';

const COHORT_OPTIONS: { value: CohortByType; label: string; icon: React.ReactNode }[] = [
  { value: 'week', label: 'Par semaine', icon: <Calendar size={16} /> },
  { value: 'month', label: 'Par mois', icon: <Calendar size={16} /> },
  { value: 'utm_source', label: 'Par source UTM', icon: <TrendingUp size={16} /> },
  { value: 'referrer', label: 'Par référent', icon: <Globe size={16} /> },
  { value: 'device', label: 'Par appareil', icon: <Smartphone size={16} /> },
];

export function CohortAnalysis({ startDate, endDate }: CohortAnalysisProps) {
  const [cohortBy, setCohortBy] = useState<CohortByType>('week');
  const [data, setData] = useState<CohortResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCohorts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("cohortBy", cohortBy);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const res = await fetch(`/api/analytics/cohorts?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch cohort data");

        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCohorts();
  }, [cohortBy, startDate, endDate]);

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}min`;
  };

  const getRetentionColor = (value: number) => {
    if (value >= 50) return "bg-green-500/40 text-green-200";
    if (value >= 25) return "bg-yellow-500/40 text-yellow-200";
    if (value >= 10) return "bg-orange-500/40 text-orange-200";
    return "bg-red-500/40 text-red-200";
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-gold" size={24} />
          <h3 className="text-lg font-semibold text-gold">Analyse de Cohortes</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gold/10 rounded-lg w-1/3" />
          <div className="h-64 bg-gold/10 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-gold" size={24} />
          <h3 className="text-lg font-semibold text-gold">Analyse de Cohortes</h3>
        </div>

        {/* Cohort Type Selector */}
        <div className="flex flex-wrap gap-2">
          {COHORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setCohortBy(option.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                cohortBy === option.value
                  ? "bg-gold text-night"
                  : "border border-gold/30 text-gold hover:bg-gold/10"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg bg-night/50 border border-gold/10 p-4 text-center">
            <p className="text-2xl font-bold text-gold">{data.summary.totalCohorts}</p>
            <p className="text-xs text-ivory/60">Cohortes</p>
          </div>
          <div className="rounded-lg bg-night/50 border border-gold/10 p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{data.summary.totalUsers}</p>
            <p className="text-xs text-ivory/60">Total utilisateurs</p>
          </div>
          <div className="rounded-lg bg-night/50 border border-gold/10 p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {data.summary.avgConversionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-ivory/60">Conv. moyenne</p>
          </div>
          <div className="rounded-lg bg-night/50 border border-gold/10 p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">
              {data.summary.avgRetentionDay7.toFixed(1)}%
            </p>
            <p className="text-xs text-ivory/60">Rét. J7 moyenne</p>
          </div>
        </div>
      )}

      {/* Cohort Table */}
      {data && data.cohorts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/20">
                <th className="px-3 py-3 text-left font-semibold text-ivory/70">Cohorte</th>
                <th className="px-3 py-3 text-right font-semibold text-ivory/70">Utilisateurs</th>
                <th className="px-3 py-3 text-center font-semibold text-ivory/70">Rét. J1</th>
                <th className="px-3 py-3 text-center font-semibold text-ivory/70">Rét. J7</th>
                <th className="px-3 py-3 text-center font-semibold text-ivory/70">Rét. J30</th>
                <th className="px-3 py-3 text-right font-semibold text-ivory/70">Conv.</th>
                <th className="px-3 py-3 text-right font-semibold text-ivory/70">Durée moy.</th>
                <th className="px-3 py-3 text-right font-semibold text-ivory/70">Pages/sess.</th>
              </tr>
            </thead>
            <tbody>
              {data.cohorts.slice(0, 15).map((cohort, index) => (
                <motion.tr
                  key={cohort.cohortName}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-gold/10 hover:bg-gold/5 transition"
                >
                  <td className="px-3 py-3 text-ivory font-medium">
                    {cohort.cohortName}
                  </td>
                  <td className="px-3 py-3 text-right text-ivory/70">
                    {cohort.userCount}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRetentionColor(cohort.retentionDay1)}`}>
                      {cohort.retentionDay1.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRetentionColor(cohort.retentionDay7)}`}>
                      {cohort.retentionDay7.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRetentionColor(cohort.retentionDay30)}`}>
                      {cohort.retentionDay30.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-green-400 font-medium">
                      {cohort.conversionRate.toFixed(1)}%
                    </span>
                    <span className="text-ivory/50 text-xs ml-1">
                      ({cohort.conversions})
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-gold">
                    {formatDuration(cohort.averageSessionDuration)}
                  </td>
                  <td className="px-3 py-3 text-right text-ivory/70">
                    {cohort.averagePageViews.toFixed(1)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-ivory/60">
          <BarChart3 className="mx-auto mb-3 opacity-50" size={48} />
          <p>Aucune donnée de cohorte disponible</p>
          <p className="text-sm mt-2">
            Les cohortes sont calculées automatiquement à partir des visites
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-ivory/60">
        <span className="font-medium">Légende rétention:</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500/40" /> ≥50%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500/40" /> 25-50%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-500/40" /> 10-25%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500/40" /> &lt;10%
        </span>
      </div>
    </div>
  );
}
