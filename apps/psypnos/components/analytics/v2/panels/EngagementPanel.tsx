"use client";

import { motion } from "framer-motion";
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
import { Clock, MousePointer, Scroll, Percent, ArrowRight } from "lucide-react";

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
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-night/60 to-night/40 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Clock size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-ivory/50">Durée session</p>
              <p className="text-xl font-bold text-ivory">
                {isLoading ? "..." : formatDuration(avgSessionDuration)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-night/60 to-night/40 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <MousePointer size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-ivory/50">Pages/session</p>
              <p className="text-xl font-bold text-ivory">
                {isLoading ? "..." : avgPagesPerSession.toFixed(1)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-red-500/20 bg-gradient-to-br from-night/60 to-night/40 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Percent size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-xs text-ivory/50">Taux de rebond</p>
              <p className="text-xl font-bold text-ivory">
                {isLoading ? "..." : `${bounceRate.toFixed(1)}%`}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-green-500/20 bg-gradient-to-br from-night/60 to-night/40 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Scroll size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs text-ivory/50">Scroll moyen</p>
              <p className="text-xl font-bold text-ivory">
                {isLoading ? "..." : `${scrollDepth.toFixed(0)}%`}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Section Engagement Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
        >
          <h3 className="text-lg font-semibold text-gold mb-4">Temps par section</h3>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <div className="h-64">
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
                  <Bar dataKey="avgTime" radius={[0, 4, 4, 0]} maxBarSize={30}>
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
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
        >
          <h3 className="text-lg font-semibold text-gold mb-4">Par appareil</h3>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gold/10 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {deviceBreakdown.map((device, index) => (
                <motion.div
                  key={device.device}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-night/50 border border-gold/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-ivory capitalize">
                      {device.device}
                    </span>
                    <div className="flex items-center gap-4 text-xs text-ivory/60">
                      <span>{device.sessions.toLocaleString("fr-FR")} sessions</span>
                      <span className="text-gold font-semibold">
                        {device.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-night/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${device.percentage}%` }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-gold/60 rounded-full"
                    />
                  </div>
                  <p className="mt-2 text-xs text-ivory/40">
                    Durée moyenne : {formatDuration(device.avgDuration)}
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
        className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
      >
        <h3 className="text-lg font-semibold text-gold mb-4">Engagement par section</h3>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gold/10 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/10">
                  <th className="text-left py-3 px-4 text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Temps moy.
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Scroll
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Interactions
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-ivory/50 uppercase tracking-wider">
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
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-ivory">
                        {section.section}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-ivory">
                        {formatDuration(section.avgTime)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-night/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-400"
                            style={{ width: `${section.scrollDepth}%` }}
                          />
                        </div>
                        <span className="text-sm text-ivory/60 w-10">
                          {section.scrollDepth.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-ivory">
                        {section.interactions.toLocaleString("fr-FR")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-sm font-medium ${
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
