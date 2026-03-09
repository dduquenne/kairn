/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface DataPoint {
  date: string;
  value: number;
  previousValue?: number;
}

interface MobileAreaChartProps {
  data: DataPoint[];
  comparisonData?: DataPoint[];
  color?: string;
  height?: number;
  showComparison?: boolean;
  title?: string;
  showAnnotations?: boolean;
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const currentValue = payload[0]?.value;
    const previousValue = payload[1]?.value;

    return (
      <div className="bg-night/95 border border-gold/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="text-xs text-ivory/60 mb-1">{label}</p>
        <p className="text-sm font-bold text-gold">
          {currentValue?.toLocaleString("fr-FR")} visites
        </p>
        {previousValue !== undefined && (
          <p className="text-xs text-ivory/50 mt-1">
            Période préc. : {previousValue?.toLocaleString("fr-FR")}
          </p>
        )}
        {previousValue !== undefined && currentValue !== undefined && (
          <p
            className={`text-xs font-semibold mt-1 ${
              currentValue >= previousValue ? "text-green-400" : "text-red-400"
            }`}
          >
            {currentValue >= previousValue ? "↑" : "↓"}{" "}
            {Math.abs(((currentValue - previousValue) / previousValue) * 100).toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
}

export function MobileAreaChart({
  data,
  comparisonData,
  color = "#C9A961",
  height = 220,
  showComparison = false,
  title,
  showAnnotations = true,
}: MobileAreaChartProps) {
  const [isComparing, setIsComparing] = useState(showComparison);

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gold/5 border border-gold/20 rounded-2xl p-4"
      >
        <h3 className="text-lg font-semibold text-ivory mb-4">{title || "Évolution"}</h3>
        <div
          className="flex flex-col items-center justify-center text-ivory/40"
          style={{ height }}
        >
          <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">Aucune donnée pour cette période</p>
          <p className="text-xs mt-1 opacity-70">Les visites apparaîtront ici</p>
        </div>
      </motion.div>
    );
  }

  // Merge data with comparison data if available
  const chartData = data.map((item, index) => ({
    ...item,
    previousValue: comparisonData?.[index]?.value,
  }));

  // Find max and min points for annotations
  const maxPoint = data.reduce((max, point) => (point.value > max.value ? point : max), data[0]);
  const minPoint = data.reduce((min, point) => (point.value < min.value ? point : min), data[0]);
  const avgValue = data.reduce((sum, point) => sum + point.value, 0) / data.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gold/5 border border-gold/20 rounded-2xl p-4"
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-ivory">{title || "Évolution"}</h3>
          {showAnnotations && (
            <p className="text-xs text-ivory/50 mt-0.5">
              Moy. {Math.round(avgValue).toLocaleString("fr-FR")} • Max{" "}
              {maxPoint?.value.toLocaleString("fr-FR")}
            </p>
          )}
        </div>

        {comparisonData && comparisonData.length > 0 && (
          <button
            onClick={() => setIsComparing(!isComparing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isComparing
                ? "bg-gold/20 text-gold border border-gold/30"
                : "bg-ivory/5 text-ivory/50 border border-ivory/10"
            }`}
          >
            {isComparing ? "Comparaison ON" : "Comparer"}
          </button>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />

          <XAxis
            dataKey="date"
            stroke="#C9A96140"
            style={{ fontSize: "10px" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              // Format date for mobile display
              // Handle ISO date format (YYYY-MM-DD or YYYY-MM-DDTHH:00)
              if (!value) return '';

              const date = new Date(value);
              if (isNaN(date.getTime())) {
                // If parsing fails, return the raw value
                return String(value);
              }

              // Check if this is an hourly format (contains 'T')
              if (String(value).includes('T')) {
                return `${date.getHours()}h`;
              }

              // Standard day/month format
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
          />

          <YAxis
            stroke="#C9A96140"
            style={{ fontSize: "10px" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
              return value.toString();
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Average reference line */}
          {showAnnotations && (
            <ReferenceLine
              y={avgValue}
              stroke="#C9A96140"
              strokeDasharray="5 5"
              label={{
                value: "Moy",
                position: "insideTopRight",
                fill: "#C9A96160",
                fontSize: 10,
              }}
            />
          )}

          {/* Comparison area (previous period) - shown first so it's behind */}
          {isComparing && comparisonData && (
            <Area
              type="monotone"
              dataKey="previousValue"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#colorPrevious)"
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 4, fill: "#94a3b8" }}
            />
          )}

          {/* Main area */}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#colorValue)"
            fillOpacity={1}
            dot={false}
            activeDot={{
              r: 6,
              fill: color,
              stroke: "#0e1f2f",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend when comparing */}
      {isComparing && comparisonData && (
        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-gold/10">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-gold rounded" />
            <span className="text-xs text-ivory/60">Période actuelle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-gray-400 rounded border-dashed" style={{ borderStyle: 'dashed', borderWidth: 1 }} />
            <span className="text-xs text-ivory/60">Période précédente</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
