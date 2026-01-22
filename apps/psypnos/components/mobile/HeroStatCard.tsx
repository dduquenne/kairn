// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useMemo } from "react";

interface HeroStatCardProps {
  title: string;
  value: number | string;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon;
  sparklineData?: number[];
  subtitle?: string;
  color?: "gold" | "green" | "red";
}

// Mini sparkline component
function Sparkline({ data, color = "#C9A961" }: { data: number[]; color?: string }) {
  const width = 120;
  const height = 32;
  const padding = 2;

  const normalizedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data.map((value) => ((value - min) / range) * (height - padding * 2));
  }, [data]);

  if (normalizedData.length === 0) return null;

  const points = normalizedData
    .map((value, index) => {
      const x = (index / (normalizedData.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - value;
      return `${x},${y}`;
    })
    .join(" ");

  // Create area path
  const areaPath = `M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`;
  const linePath = `M ${points}`;

  return (
    <svg width={width} height={height} className="opacity-60">
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparklineGradient)" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Trend color helper
function getTrendColor(trend: number): string {
  if (trend > 10) return "#34d399"; // green
  if (trend < -10) return "#f87171"; // red
  if (trend > 0) return "#C9A961"; // gold (positive but moderate)
  if (trend < 0) return "#fb923c"; // orange (negative but moderate)
  return "#94a3b8"; // gray (stable)
}

function getTrendBgColor(trend: number): string {
  if (trend > 10) return "bg-green-500/10";
  if (trend < -10) return "bg-red-500/10";
  if (trend > 0) return "bg-gold/10";
  if (trend < 0) return "bg-orange-500/10";
  return "bg-gray-500/10";
}

export function HeroStatCard({
  title,
  value,
  trend,
  trendLabel = "vs période préc.",
  icon: Icon,
  sparklineData,
  subtitle,
  color = "gold",
}: HeroStatCardProps) {
  const colorClasses = {
    gold: "bg-gold/10 border-gold/30",
    green: "bg-green-500/10 border-green-500/30",
    red: "bg-red-500/10 border-red-500/30",
  };

  const sparklineColor = color === "green" ? "#34d399" : color === "red" ? "#f87171" : "#C9A961";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 border-2 ${colorClasses[color]} relative overflow-hidden`}
    >
      {/* Icon background */}
      <div className="absolute top-4 right-4 opacity-20">
        <Icon className="h-12 w-12 text-gold" />
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-5 w-5 text-gold opacity-80" />
        <p className="text-sm font-semibold uppercase tracking-wider text-ivory/70">{title}</p>
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <p className="text-4xl font-bold text-ivory">
          {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
        </p>
        {subtitle && <p className="text-sm text-ivory/50 mt-1">{subtitle}</p>}
      </div>

      {/* Trend indicator */}
      {trend !== undefined && (
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${getTrendBgColor(trend)}`}
            style={{ color: getTrendColor(trend) }}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-xs text-ivory/50">{trendLabel}</span>
        </div>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-2">
          <Sparkline data={sparklineData} color={sparklineColor} />
        </div>
      )}
    </motion.div>
  );
}
