"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Globe,
  Search,
  Share2,
  Mail,
  Link,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface TrafficSource {
  source: string;
  medium: string;
  visits: number;
  uniqueSessions: number;
  conversionRate: number;
  change?: number;
}

interface GeoLocation {
  country: string;
  region?: string;
  city?: string;
  visitors: number;
  percentage: number;
}

interface SourcesPanelProps {
  sources: TrafficSource[];
  geoData: GeoLocation[];
  directTraffic: number;
  organicTraffic: number;
  referralTraffic: number;
  socialTraffic: number;
  isLoading?: boolean;
}

const COLORS = ["#D4AF37", "#3B82F6", "#22C55E", "#A855F7", "#F59E0B", "#EF4444"];

const getMediumIcon = (medium: string) => {
  switch (medium?.toLowerCase()) {
    case "organic":
      return <Search size={16} className="text-green-400" />;
    case "social":
      return <Share2 size={16} className="text-blue-400" />;
    case "email":
      return <Mail size={16} className="text-purple-400" />;
    case "referral":
      return <Link size={16} className="text-orange-400" />;
    default:
      return <Globe size={16} className="text-ivory/50" />;
  }
};

export function SourcesPanel({
  sources,
  geoData,
  directTraffic,
  organicTraffic,
  referralTraffic,
  socialTraffic,
  isLoading = false,
}: SourcesPanelProps) {
  const [geoView, setGeoView] = useState<"countries" | "cities">("countries");

  // Prepare pie chart data
  const pieData = [
    { name: "Direct", value: directTraffic, color: "#D4AF37" },
    { name: "Organique", value: organicTraffic, color: "#22C55E" },
    { name: "Referral", value: referralTraffic, color: "#3B82F6" },
    { name: "Social", value: socialTraffic, color: "#A855F7" },
  ].filter((d) => d.value > 0);

  const totalTraffic = pieData.reduce((sum, d) => sum + d.value, 0);

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalTraffic > 0 ? (data.value / totalTraffic) * 100 : 0;
      return (
        <div className="rounded-lg border border-gold/20 bg-night/95 backdrop-blur-sm px-4 py-3 shadow-xl">
          <p className="text-sm font-medium text-ivory">{data.name}</p>
          <p className="text-lg font-bold text-gold">
            {data.value.toLocaleString("fr-FR")} visites
          </p>
          <p className="text-xs text-ivory/60">{percentage.toFixed(1)}% du total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Traffic Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
        >
          <h3 className="text-lg font-semibold text-gold mb-4">
            Répartition du trafic
          </h3>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3">
                {pieData.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-ivory flex-1">{item.name}</span>
                    <span className="text-sm font-medium text-ivory/80">
                      {item.value.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-xs text-ivory/50 w-12 text-right">
                      {totalTraffic > 0
                        ? `${((item.value / totalTraffic) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Geolocation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gold flex items-center gap-2">
              <MapPin size={18} />
              Géolocalisation
            </h3>
            <div className="flex items-center gap-1 rounded-lg border border-gold/20 p-1">
              <button
                onClick={() => setGeoView("countries")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  geoView === "countries"
                    ? "bg-gold text-night"
                    : "text-ivory/60 hover:text-ivory"
                }`}
              >
                Pays
              </button>
              <button
                onClick={() => setGeoView("cities")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  geoView === "cities"
                    ? "bg-gold text-night"
                    : "text-ivory/60 hover:text-ivory"
                }`}
              >
                Villes
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gold/10 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {geoData.slice(0, 6).map((location, index) => (
                <motion.div
                  key={`${location.country}-${location.city || index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-ivory/5 transition-colors"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? "bg-gold/20 text-gold"
                        : "bg-ivory/10 text-ivory/60"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="flex-1 text-sm text-ivory truncate">
                    {geoView === "cities" && location.city
                      ? `${location.city}, ${location.country}`
                      : location.country}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-night/40 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${location.percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="h-full bg-gold"
                      />
                    </div>
                    <span className="text-xs text-ivory/50 w-8 text-right">
                      {location.percentage.toFixed(0)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Sources Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
      >
        <h3 className="text-lg font-semibold text-gold mb-4">
          Toutes les sources
        </h3>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gold/10 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/10">
                  <th className="text-left py-3 px-4 text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Medium
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Visites
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Conv.
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Variation
                  </th>
                </tr>
              </thead>
              <tbody>
                {sources.slice(0, 10).map((source, index) => (
                  <motion.tr
                    key={`${source.source}-${source.medium}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gold/5 hover:bg-ivory/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getMediumIcon(source.medium)}
                        <span className="text-sm font-medium text-ivory truncate max-w-[150px]">
                          {source.source}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-ivory/10 text-ivory/60">
                        {source.medium}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-ivory">
                        {source.visits.toLocaleString("fr-FR")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-ivory/60">
                        {source.uniqueSessions.toLocaleString("fr-FR")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          source.conversionRate >= 5
                            ? "text-green-400"
                            : source.conversionRate >= 2
                            ? "text-gold"
                            : "text-ivory/60"
                        }`}
                      >
                        {source.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {source.change !== undefined ? (
                        <span
                          className={`flex items-center justify-end gap-1 text-xs font-medium ${
                            source.change >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {source.change >= 0 ? (
                            <ArrowUpRight size={12} />
                          ) : (
                            <ArrowDownRight size={12} />
                          )}
                          {Math.abs(source.change).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-xs text-ivory/30">-</span>
                      )}
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
