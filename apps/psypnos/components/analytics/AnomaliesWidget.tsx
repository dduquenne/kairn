// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Check,
  Eye,
  Filter,
  Activity,
} from "lucide-react";

interface Anomaly {
  id: string;
  timestamp: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: "low" | "medium" | "high";
  type: "spike" | "drop" | "unusual_pattern";
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

interface AnomalySummary {
  total: number;
  high: number;
  medium: number;
  low: number;
  unacknowledged: number;
}

const metricLabels: Record<string, string> = {
  visits: "Visites",
  sessions: "Sessions",
  conversions: "Conversions",
  conversion_rate: "Taux de conversion",
  avg_time: "Temps moyen",
};

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/50" },
  medium: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/50" },
  low: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/50" },
};

export function AnomaliesWidget() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [summary, setSummary] = useState<AnomalySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [filter, setFilter] = useState<"all" | "unacknowledged">("unacknowledged");
  const [sensitivity, setSensitivity] = useState<"low" | "medium" | "high">("medium");

  const fetchAnomalies = useCallback(async () => {
    try {
      const acknowledged = filter === "all" ? undefined : false;
      const url = `/api/analytics/anomalies${acknowledged !== undefined ? `?acknowledged=${acknowledged}` : ""}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAnomalies(data.anomalies);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching anomalies:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const runDetection = async () => {
    setIsDetecting(true);
    try {
      const response = await fetch(`/api/analytics/anomalies?action=detect&sensitivity=${sensitivity}`);
      if (response.ok) {
        await fetchAnomalies();
      }
    } catch (error) {
      console.error("Error running detection:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  const acknowledgeAnomaly = async (id: string) => {
    try {
      const response = await fetch("/api/analytics/anomalies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        await fetchAnomalies();
      }
    } catch (error) {
      console.error("Error acknowledging anomaly:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin text-gold" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="text-gold" size={24} />
          <h3 className="text-lg font-semibold text-ivory">Detection d'Anomalies</h3>
          {summary && summary.unacknowledged > 0 && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
              {summary.unacknowledged} non traitees
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={sensitivity}
            onChange={(e) => setSensitivity(e.target.value as "low" | "medium" | "high")}
            className="rounded-lg border border-gold/20 bg-night/60 px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none"
          >
            <option value="low">Sensibilite: Basse</option>
            <option value="medium">Sensibilite: Moyenne</option>
            <option value="high">Sensibilite: Haute</option>
          </select>
          <button
            onClick={runDetection}
            disabled={isDetecting}
            className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-night transition-colors hover:bg-gold/90 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isDetecting ? "animate-spin" : ""} />
            Detecter
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{summary.high}</div>
            <div className="text-xs text-red-400/70">Haute severite</div>
          </div>
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{summary.medium}</div>
            <div className="text-xs text-yellow-400/70">Moyenne severite</div>
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{summary.low}</div>
            <div className="text-xs text-blue-400/70">Basse severite</div>
          </div>
          <div className="rounded-lg border border-gold/30 bg-gold/10 p-4 text-center">
            <div className="text-2xl font-bold text-gold">{summary.total}</div>
            <div className="text-xs text-gold/70">Total detectees</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-ivory/50" />
        <button
          onClick={() => setFilter("unacknowledged")}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            filter === "unacknowledged"
              ? "bg-gold text-night"
              : "bg-ivory/10 text-ivory/70 hover:bg-ivory/20"
          }`}
        >
          Non traitees
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            filter === "all"
              ? "bg-gold text-night"
              : "bg-ivory/10 text-ivory/70 hover:bg-ivory/20"
          }`}
        >
          Toutes
        </button>
      </div>

      {/* Anomalies List */}
      <div className="space-y-3">
        {anomalies.length === 0 ? (
          <div className="rounded-lg border border-gold/20 bg-night/40 p-8 text-center">
            <Activity className="mx-auto mb-3 text-green-400" size={48} />
            <p className="text-ivory/60">Aucune anomalie detectee</p>
            <p className="mt-1 text-sm text-ivory/40">
              Les metriques sont dans les limites normales.
            </p>
          </div>
        ) : (
          anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={`rounded-lg border ${severityColors[anomaly.severity].border} ${
                severityColors[anomaly.severity].bg
              } p-4 transition-all hover:opacity-90`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${severityColors[anomaly.severity].bg} ${
                        severityColors[anomaly.severity].text
                      }`}
                    >
                      {anomaly.type === "spike" ? (
                        <TrendingUp size={16} />
                      ) : anomaly.type === "drop" ? (
                        <TrendingDown size={16} />
                      ) : (
                        <AlertTriangle size={16} />
                      )}
                    </div>
                    <div>
                      <h4 className={`font-medium ${severityColors[anomaly.severity].text}`}>
                        {metricLabels[anomaly.metric] || anomaly.metric}
                        <span
                          className={`ml-2 rounded px-2 py-0.5 text-xs uppercase ${
                            severityColors[anomaly.severity].bg
                          }`}
                        >
                          {anomaly.severity}
                        </span>
                      </h4>
                      <p className="text-sm text-ivory/70">{anomaly.message}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-6 text-xs">
                    <div className="text-ivory/50">
                      <span className="font-medium">Valeur attendue:</span>{" "}
                      {anomaly.expectedValue.toFixed(1)}
                    </div>
                    <div className={severityColors[anomaly.severity].text}>
                      <span className="font-medium">Valeur reelle:</span>{" "}
                      {anomaly.actualValue.toFixed(1)}
                    </div>
                    <div className="text-ivory/50">
                      <span className="font-medium">Ecart:</span>{" "}
                      {anomaly.deviation > 0 ? "+" : ""}
                      {anomaly.deviation.toFixed(2)} sigma
                    </div>
                    <div className="text-ivory/40">
                      {new Date(anomaly.timestamp).toLocaleString("fr-FR")}
                    </div>
                  </div>

                  {anomaly.acknowledged && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                      <Check size={12} />
                      Traitee {anomaly.acknowledgedAt && `le ${new Date(anomaly.acknowledgedAt).toLocaleDateString("fr-FR")}`}
                    </div>
                  )}
                </div>

                {!anomaly.acknowledged && (
                  <button
                    onClick={() => acknowledgeAnomaly(anomaly.id)}
                    className="rounded-lg bg-green-500/20 p-2 text-green-400 transition-colors hover:bg-green-500/30"
                    title="Marquer comme traitee"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
