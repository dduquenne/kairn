/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { TrendingUp, Info, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

import { Tooltip } from "./Tooltip";

interface Attribution {
  source: string;
  medium: string;
  campaign?: string;
  firstTouchConversions: number;
  lastTouchConversions: number;
  linearConversions: number;
  timeDecayConversions: number;
  uShapedConversions: number;
  totalTouchpoints: number;
  uniqueSessions: number;
}

interface AttributionResponse {
  attribution: Attribution[];
  totals: {
    firstTouch: number;
    lastTouch: number;
    linear: number;
    timeDecay: number;
    uShaped: number;
  };
  modelDescriptions: {
    firstTouch: string;
    lastTouch: string;
    linear: string;
    timeDecay: string;
    uShaped: string;
  };
}

interface AttributionComparisonProps {
  startDate?: string;
  endDate?: string;
}

type AttributionModel = 'firstTouch' | 'lastTouch' | 'linear' | 'timeDecay' | 'uShaped';

const MODEL_LABELS: Record<AttributionModel, string> = {
  firstTouch: "First-Touch",
  lastTouch: "Last-Touch",
  linear: "Linéaire",
  timeDecay: "Time-Decay",
  uShaped: "U-Shaped",
};

const MODEL_COLORS: Record<AttributionModel, string> = {
  firstTouch: "bg-blue-500",
  lastTouch: "bg-green-500",
  linear: "bg-purple-500",
  timeDecay: "bg-orange-500",
  uShaped: "bg-pink-500",
};

export function AttributionComparison({ startDate, endDate }: AttributionComparisonProps) {
  const [data, setData] = useState<AttributionResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState<AttributionModel>('lastTouch');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttribution = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const res = await fetch(`/api/analytics/attribution?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch attribution data");

        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttribution();
  }, [startDate, endDate]);

  const getConversionValue = (attr: Attribution, model: AttributionModel): number => {
    switch (model) {
      case 'firstTouch': return attr.firstTouchConversions;
      case 'lastTouch': return attr.lastTouchConversions;
      case 'linear': return attr.linearConversions;
      case 'timeDecay': return attr.timeDecayConversions;
      case 'uShaped': return attr.uShapedConversions;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="text-gold" size={24} />
          <h3 className="text-lg font-semibold text-gold">Attribution Marketing</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gold/10 rounded-lg w-2/3" />
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

  const sortedAttribution = data?.attribution
    .slice()
    .sort((a, b) => getConversionValue(b, selectedModel) - getConversionValue(a, selectedModel))
    .slice(0, 10) || [];

  const maxValue = sortedAttribution.length > 0
    ? Math.max(...sortedAttribution.map(a => getConversionValue(a, selectedModel)))
    : 0;

  return (
    <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="text-gold" size={24} />
        <h3 className="text-lg font-semibold text-gold">Attribution Marketing</h3>
        <Tooltip content="Comparez comment différents modèles d'attribution attribuent les conversions à vos canaux marketing">
          <Info size={16} className="text-ivory/50 cursor-help" />
        </Tooltip>
      </div>

      {/* Model Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(MODEL_LABELS) as AttributionModel[]).map((model) => (
          <button
            key={model}
            onClick={() => setSelectedModel(model)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedModel === model
                ? "bg-gold text-night"
                : "border border-gold/30 text-gold hover:bg-gold/10"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${MODEL_COLORS[model]}`} />
              {MODEL_LABELS[model]}
            </span>
            {data && (
              <span className={`text-xs ml-2 ${
                selectedModel === model ? "text-night/70" : "text-gold/70"
              }`}>
                ({data.totals[model].toFixed(1)})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Model Description */}
      {data && (
        <div className="mb-6 p-3 rounded-lg bg-gold/5 border border-gold/10">
          <p className="text-sm text-ivory/70">
            <strong className="text-gold">{MODEL_LABELS[selectedModel]}:</strong>{" "}
            {data.modelDescriptions[selectedModel]}
          </p>
        </div>
      )}

      {/* Attribution Table/Chart */}
      {sortedAttribution.length > 0 ? (
        <div className="space-y-3">
          {sortedAttribution.map((attr, index) => {
            const value = getConversionValue(attr, selectedModel);
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

            return (
              <motion.div
                key={`${attr.source}-${attr.medium}-${attr.campaign || ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <div className="flex items-center gap-4">
                  {/* Source/Medium Info */}
                  <div className="w-40 shrink-0">
                    <div className="text-sm font-medium text-ivory truncate">
                      {attr.source}
                    </div>
                    <div className="text-xs text-ivory/50">
                      {attr.medium}
                      {attr.campaign && ` / ${attr.campaign}`}
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 relative">
                    <div className="h-8 bg-night/50 rounded-lg overflow-hidden border border-gold/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className={`h-full ${MODEL_COLORS[selectedModel]} opacity-60`}
                      />
                    </div>
                  </div>

                  {/* Value */}
                  <div className="w-20 text-right">
                    <span className="text-lg font-bold text-gold">{value.toFixed(1)}</span>
                  </div>
                </div>

                {/* All models comparison (mini) */}
                <div className="flex items-center gap-3 mt-1 ml-44">
                  {(Object.keys(MODEL_LABELS) as AttributionModel[]).map((model) => {
                    const modelValue = getConversionValue(attr, model);
                    if (model === selectedModel) return null;
                    return (
                      <span key={model} className="text-xs text-ivory/40">
                        {MODEL_LABELS[model]}: {modelValue.toFixed(1)}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-ivory/60">
          <BarChart3 className="mx-auto mb-3 opacity-50" size={48} />
          <p>Aucune donnée d'attribution disponible</p>
          <p className="text-sm mt-2">
            L'attribution nécessite des conversions avec des sources de trafic identifiées
          </p>
        </div>
      )}

      {/* Summary Comparison */}
      {data && sortedAttribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pt-6 border-t border-gold/20"
        >
          <h4 className="text-sm font-medium text-ivory mb-4">
            Comparaison des modèles (Totaux)
          </h4>
          <div className="grid grid-cols-5 gap-4">
            {(Object.keys(MODEL_LABELS) as AttributionModel[]).map((model) => (
              <div
                key={model}
                className={`rounded-lg p-3 text-center transition cursor-pointer ${
                  selectedModel === model
                    ? "bg-gold/20 border border-gold/50"
                    : "bg-night/50 border border-gold/10 hover:border-gold/30"
                }`}
                onClick={() => setSelectedModel(model)}
              >
                <div className={`w-3 h-3 rounded-full ${MODEL_COLORS[model]} mx-auto mb-2`} />
                <p className="text-lg font-bold text-gold">{data.totals[model].toFixed(1)}</p>
                <p className="text-xs text-ivory/60">{MODEL_LABELS[model]}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
