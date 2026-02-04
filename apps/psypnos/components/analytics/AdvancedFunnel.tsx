/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { TrendingDown, Users, Clock, AlertTriangle, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

interface FunnelStep {
  stepName: string;
  stepOrder: number;
  users: number;
  conversionRate: number;
  dropoffRate: number;
  avgTimeToNext?: number;
}

interface FunnelAnalysis {
  funnelName: string;
  steps: FunnelStep[];
  overallConversion: number;
  totalUsers: number;
}

interface AdvancedFunnelProps {
  startDate?: string;
  endDate?: string;
}

export function AdvancedFunnel({ startDate, endDate }: AdvancedFunnelProps) {
  const [availableFunnels, setAvailableFunnels] = useState<string[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string>("");
  const [funnelData, setFunnelData] = useState<FunnelAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available funnels
  useEffect(() => {
    const fetchFunnels = async () => {
      try {
        const params = new URLSearchParams();
        params.append("list", "true");
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const res = await fetch(`/api/analytics/funnel?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch funnels");

        const data = await res.json();
        setAvailableFunnels(data.funnels || []);

        // Auto-select first funnel
        if (data.funnels?.length > 0 && !selectedFunnel) {
          setSelectedFunnel(data.funnels[0]);
        }
      } catch (err) {
        console.error("Error fetching funnels:", err);
      }
    };

    fetchFunnels();
  }, [startDate, endDate]);

  // Fetch funnel data when selection changes
  useEffect(() => {
    if (!selectedFunnel) {
      setIsLoading(false);
      return;
    }

    const fetchFunnelData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("funnelName", selectedFunnel);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const res = await fetch(`/api/analytics/funnel?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch funnel data");

        const data = await res.json();
        setFunnelData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFunnelData();
  }, [selectedFunnel, startDate, endDate]);

  const formatTime = (ms?: number) => {
    if (!ms) return "-";
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    return `${Math.round(minutes / 60)}h`;
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingDown className="text-gold" size={24} />
          <h3 className="text-lg font-semibold text-gold">Analyse de Funnel Avancée</h3>
        </div>
        <div className="animate-pulse">
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingDown className="text-gold" size={24} />
          <h3 className="text-lg font-semibold text-gold">Analyse de Funnel Avancée</h3>
        </div>

        {availableFunnels.length > 0 && (
          <select
            value={selectedFunnel}
            onChange={(e) => setSelectedFunnel(e.target.value)}
            className="rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none"
          >
            {availableFunnels.map((funnel) => (
              <option key={funnel} value={funnel}>
                {funnel}
              </option>
            ))}
          </select>
        )}
      </div>

      {!funnelData || funnelData.steps.length === 0 ? (
        <div className="text-center py-12 text-ivory/60">
          <TrendingDown className="mx-auto mb-3 opacity-50" size={48} />
          <p>Aucune donnée de funnel disponible</p>
          <p className="text-sm mt-2">
            Les funnels sont créés automatiquement lorsque vous trackez des étapes
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-lg bg-night/50 border border-gold/10 p-4 text-center">
              <p className="text-2xl font-bold text-gold">{funnelData.totalUsers}</p>
              <p className="text-xs text-ivory/60">Utilisateurs entrés</p>
            </div>
            <div className="rounded-lg bg-night/50 border border-gold/10 p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {(funnelData.overallConversion ?? 0).toFixed(1)}%
              </p>
              <p className="text-xs text-ivory/60">Conversion globale</p>
            </div>
            <div className="rounded-lg bg-night/50 border border-gold/10 p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{funnelData.steps.length}</p>
              <p className="text-xs text-ivory/60">Étapes</p>
            </div>
          </div>

          {/* Funnel Visualization */}
          <div className="space-y-2">
            {funnelData.steps.map((step, index) => {
              const isLast = index === funnelData.steps.length - 1;
              const widthPercent = funnelData.totalUsers > 0
                ? (step.users / funnelData.totalUsers) * 100
                : 0;
              const isHighDropoff = step.dropoffRate > 30;

              return (
                <div key={step.stepOrder}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Step Bar */}
                    <div
                      className="relative rounded-lg overflow-hidden"
                      style={{ width: `${Math.max(widthPercent, 20)}%` }}
                    >
                      <div
                        className={`h-16 ${
                          isHighDropoff && !isLast
                            ? "bg-gradient-to-r from-red-500/30 to-red-500/10"
                            : "bg-gradient-to-r from-gold/30 to-gold/10"
                        } border ${
                          isHighDropoff && !isLast
                            ? "border-red-500/30"
                            : "border-gold/20"
                        } rounded-lg`}
                      />
                      <div className="absolute inset-0 flex items-center px-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-ivory">
                              {step.stepOrder}. {step.stepName}
                            </span>
                            {isHighDropoff && !isLast && (
                              <AlertTriangle size={14} className="text-red-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-ivory/60 mt-1">
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {step.users} utilisateurs
                            </span>
                            {step.avgTimeToNext && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatTime(step.avgTimeToNext)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gold">
                            {widthPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dropoff Indicator */}
                    {!isLast && (
                      <div className="flex items-center ml-4 my-2">
                        <ChevronDown
                          size={20}
                          className={isHighDropoff ? "text-red-400" : "text-gold/50"}
                        />
                        <span
                          className={`text-xs ml-2 ${
                            isHighDropoff ? "text-red-400" : "text-ivory/50"
                          }`}
                        >
                          {(step.conversionRate ?? 0).toFixed(1)}% conversion
                          {isHighDropoff && (
                            <span className="ml-2 px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                              {(step.dropoffRate ?? 0).toFixed(1)}% abandon
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Insights */}
          {funnelData.steps.some((s, i) => i < funnelData.steps.length - 1 && s.dropoffRate > 30) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-400 shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-red-300">Points de friction détectés</h4>
                  <ul className="mt-2 space-y-1 text-sm text-red-200/80">
                    {funnelData.steps
                      .filter((s, i) => i < funnelData.steps.length - 1 && s.dropoffRate > 30)
                      .map((step) => (
                        <li key={step.stepOrder}>
                          • <strong>{step.stepName}</strong>: {(step.dropoffRate ?? 0).toFixed(1)}% d'abandon
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
