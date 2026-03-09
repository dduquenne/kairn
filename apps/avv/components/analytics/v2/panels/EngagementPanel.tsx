"use client";

import { motion } from "framer-motion";
import { Clock, MousePointer, Scroll, Percent, ArrowRight } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SectionEngagement {
  section: string;
  avgTime: number; // seconds
  scrollDepth: number; // percentage
  interactions: number;
  bounceRate: number;
}

interface DeviceBreakdown {
  device: string;
  sessions: number;
  avgDuration: number;
  percentage: number;
}

interface EngagementPanelProps {
  avgSessionDuration: number; // seconds
  avgPagesPerSession: number;
  bounceRate: number;
  scrollDepth: number;
  sectionEngagement: SectionEngagement[];
  deviceBreakdown: DeviceBreakdown[];
  isLoading?: boolean;
}

export function EngagementPanel({
  avgSessionDuration,
  avgPagesPerSession,
  bounceRate,
  scrollDepth,
  sectionEngagement,
  deviceBreakdown,
  isLoading = false,
}: EngagementPanelProps) {
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gold/20 bg-night/95 backdrop-blur-sm px-4 py-3 shadow-xl">
          <p className="text-xs text-ivory/60 mb-1">{label}</p>
          <p className="text-lg font-bold text-ivory">
            {formatDuration(payload[0]?.value || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Color palette for bars
  const COLORS = ["#D4AF37", "#3B82F6", "#22C55E", "#A855F7", "#F59E0B", "#EF4444"];

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
              <Clock size={16} className="text-purple-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ivory/50 truncate">Durée session</p>
              <p className="text-base sm:text-xl font-bold text-ivory">
                {isLoading ? "..." : formatDuration(avgSessionDuration)}
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
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
              <MousePointer size={16} className="text-blue-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ivory/50 truncate">Pages/session</p>
              <p className="text-base sm:text-xl font-bold text-ivory">
                {isLoading ? "..." : avgPagesPerSession.toFixed(1)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-red-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/10 flex-shrink-0">
              <Percent size={16} className="text-red-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ivory/50 truncate">Taux de rebond</p>
              <p className="text-base sm:text-xl font-bold text-ivory">
                {isLoading ? "..." : `${bounceRate.toFixed(1)}%`}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-green-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 flex-shrink-0">
              <Scroll size={16} className="text-green-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ivory/50 truncate">Scroll moyen</p>
              <p className="text-base sm:text-xl font-bold text-ivory">
                {isLoading ? "..." : `${scrollDepth.toFixed(0)}%`}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Section Engagement Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gold mb-3 sm:mb-4">Temps par section</h3>

          {isLoading ? (
            <div className="h-48 sm:h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sectionEngagement.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(212, 175, 55, 0.1)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="rgba(245, 245, 240, 0.3)"
                    tick={{ fill: "rgba(245, 245, 240, 0.5)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="section"
                    stroke="rgba(245, 245, 240, 0.3)"
                    tick={{ fill: "rgba(245, 245, 240, 0.5)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tickFormatter={(value) =>
                      value.length > 12 ? `${value.slice(0, 12)}...` : value
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="avgTime"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={30}
                    activeBar={{
                      fill: "#E5C158",
                      stroke: "rgba(212,175,55,0.4)",
                      strokeWidth: 1.5,
                      fillOpacity: 0.9,
                    }}
                  >
                    {sectionEngagement.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gold mb-3 sm:mb-4">Par appareil</h3>

          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 sm:h-16 bg-gold/10 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {deviceBreakdown.map((device, index) => (
                <motion.div
                  key={device.device}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 sm:p-4 rounded-lg bg-night/50 border border-gold/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-ivory capitalize">
                      {device.device}
                    </span>
                    <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-ivory/60">
                      <span className="hidden sm:inline">{device.sessions.toLocaleString("fr-FR")} sessions</span>
                      <span className="text-gold font-semibold">
                        {device.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-1.5 sm:h-2 bg-night/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${device.percentage}%` }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-gold/60 rounded-full"
                    />
                  </div>
                  <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-ivory/40">
                    Durée : {formatDuration(device.avgDuration)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Section Engagement Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
      >
        <h3 className="text-base sm:text-lg font-semibold text-gold mb-3 sm:mb-4">Engagement par section</h3>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 sm:h-12 bg-gold/10 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gold/10">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Temps
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider hidden sm:table-cell">
                    Scroll
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider hidden sm:table-cell">
                    Interactions
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Rebond
                  </th>
                </tr>
              </thead>
              <tbody>
                {sectionEngagement.map((section, index) => (
                  <motion.tr
                    key={section.section}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gold/5 hover:bg-ivory/5 transition-colors"
                  >
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span className="text-xs sm:text-sm font-medium text-ivory">
                        {section.section}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                      <span className="text-xs sm:text-sm text-ivory">
                        {formatDuration(section.avgTime)}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 sm:w-16 h-1.5 bg-night/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-400"
                            style={{ width: `${section.scrollDepth}%` }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm text-ivory/60 w-8 sm:w-10">
                          {section.scrollDepth.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right hidden sm:table-cell">
                      <span className="text-xs sm:text-sm text-ivory">
                        {section.interactions.toLocaleString("fr-FR")}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          section.bounceRate > 60
                            ? "text-red-400"
                            : section.bounceRate > 40
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        {section.bounceRate.toFixed(1)}%
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
