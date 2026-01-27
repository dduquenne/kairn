"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { Eye, Users, MousePointer, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface ChartDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

interface TopPage {
  path: string;
  views: number;
  uniqueVisitors: number;
  percentage: number;
  change?: number;
}

interface TrafficPanelProps {
  chartData: ChartDataPoint[];
  topPages: TopPage[];
  totalViews: number;
  totalVisitors: number;
  newVisitors: number;
  isLoading?: boolean;
}

type ChartType = "line" | "area" | "bar";

export function TrafficPanel({
  chartData,
  topPages,
  totalViews,
  totalVisitors,
  newVisitors,
  isLoading = false,
}: TrafficPanelProps) {
  const [chartType, setChartType] = useState<ChartType>("area");

  const chartTypes: { value: ChartType; label: string }[] = [
    { value: "line", label: "Ligne" },
    { value: "area", label: "Aire" },
    { value: "bar", label: "Barres" },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const current = payload[0]?.value || 0;
      const previous = payload[0]?.payload?.previousValue;
      const change = previous ? ((current - previous) / previous) * 100 : null;

      return (
        <div className="rounded-lg border border-gold/20 bg-night/95 backdrop-blur-sm px-4 py-3 shadow-xl">
          <p className="text-xs text-ivory/60 mb-1">{label}</p>
          <p className="text-xl font-bold text-ivory">
            {current.toLocaleString("fr-FR")}
          </p>
          {change !== null && (
            <p
              className={`text-xs font-medium mt-1 ${
                change >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% vs période
              précédente
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
            <XAxis
              dataKey="label"
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: "rgba(245, 245, 240, 0.5)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: "rgba(245, 245, 240, 0.5)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#D4AF37"
              strokeWidth={2}
              dot={{ fill: "#D4AF37", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "#D4AF37", stroke: "#fff", strokeWidth: 2 }}
            />
            <Brush
              dataKey="label"
              height={30}
              stroke="#D4AF37"
              fill="rgba(26, 26, 46, 0.8)"
              tickFormatter={() => ""}
            />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
            <XAxis
              dataKey="label"
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: "rgba(245, 245, 240, 0.5)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: "rgba(245, 245, 240, 0.5)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#D4AF37"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
            <Brush
              dataKey="label"
              height={30}
              stroke="#D4AF37"
              fill="rgba(26, 26, 46, 0.8)"
              tickFormatter={() => ""}
            />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
            <XAxis
              dataKey="label"
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: "rgba(245, 245, 240, 0.5)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: "rgba(245, 245, 240, 0.5)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill="#D4AF37"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Brush
              dataKey="label"
              height={30}
              stroke="#D4AF37"
              fill="rgba(26, 26, 46, 0.8)"
              tickFormatter={() => ""}
            />
          </BarChart>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Mini Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10 flex-shrink-0">
              <Eye size={18} className="text-gold sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ivory/50">Pages vues</p>
              <p className="text-lg sm:text-xl font-bold text-ivory truncate">
                {isLoading ? "..." : totalViews.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
              <Users size={18} className="text-blue-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ivory/50">Visiteurs uniques</p>
              <p className="text-lg sm:text-xl font-bold text-ivory truncate">
                {isLoading ? "..." : totalVisitors.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-green-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
              <MousePointer size={18} className="text-green-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ivory/50">Nouveaux visiteurs</p>
              <p className="text-lg sm:text-xl font-bold text-ivory truncate">
                {isLoading ? "..." : newVisitors.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gold">Visiteurs</h3>
          <div className="flex items-center gap-1 rounded-lg border border-gold/20 p-1">
            {chartTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setChartType(type.value)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-colors ${
                  chartType === type.value
                    ? "bg-gold text-night"
                    : "text-ivory/60 hover:text-ivory"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-60 sm:h-80">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Top Pages Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
      >
        <h3 className="text-base sm:text-lg font-semibold text-gold mb-3 sm:mb-4">Pages populaires</h3>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gold/10 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {topPages.map((page, index) => (
              <motion.div
                key={page.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-ivory/5 transition-colors group"
              >
                {/* Rank */}
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                    index === 0
                      ? "bg-gold/20 text-gold"
                      : index === 1
                      ? "bg-ivory/10 text-ivory/80"
                      : index === 2
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-ivory/5 text-ivory/50"
                  }`}
                >
                  {index + 1}
                </div>

                {/* Page Path */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-ivory truncate group-hover:text-gold transition-colors">
                    {page.path}
                  </p>
                  <p className="text-xs text-ivory/50 hidden sm:block">
                    {page.uniqueVisitors.toLocaleString("fr-FR")} visiteurs uniques
                  </p>
                </div>

                {/* Views */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm font-semibold text-ivory">
                    {page.views.toLocaleString("fr-FR")}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-xs">
                    <span className="text-ivory/50 hidden sm:inline">{page.percentage.toFixed(1)}%</span>
                    {page.change !== undefined && (
                      <span
                        className={`flex items-center ${
                          page.change >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {page.change >= 0 ? (
                          <ArrowUpRight size={12} />
                        ) : (
                          <ArrowDownRight size={12} />
                        )}
                        {Math.abs(page.change).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar - hidden on mobile */}
                <div className="hidden sm:block w-24 h-1.5 bg-night/40 rounded-full overflow-hidden flex-shrink-0">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${page.percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="h-full bg-gradient-to-r from-gold to-gold/60"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
