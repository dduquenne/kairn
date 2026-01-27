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
  countryCode?: string;
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
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Traffic Distribution */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gold mb-3 sm:mb-4">
            Répartition du trafic
          </h3>

          {isLoading ? (
            <div className="h-48 sm:h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-32 h-32 sm:w-48 sm:h-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
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
              <div className="flex-1 w-full space-y-2 sm:space-y-3">
                {pieData.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 sm:gap-3"
                  >
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs sm:text-sm text-ivory flex-1 truncate">{item.name}</span>
                    <span className="text-xs sm:text-sm font-medium text-ivory/80">
                      {item.value.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-[10px] sm:text-xs text-ivory/50 w-10 sm:w-12 text-right">
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
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gold flex items-center gap-2">
              <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="truncate">Géolocalisation</span>
            </h3>
            <div className="flex items-center gap-0.5 sm:gap-1 rounded-lg border border-gold/20 p-0.5 sm:p-1 flex-shrink-0">
              <button
                onClick={() => setGeoView("countries")}
                className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-colors ${
                  geoView === "countries"
                    ? "bg-gold text-night"
                    : "text-ivory/60 hover:text-ivory"
                }`}
              >
                Pays
              </button>
              <button
                onClick={() => setGeoView("cities")}
                className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-colors ${
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
            <div className="space-y-2 sm:space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 sm:h-10 bg-gold/10 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {geoData.slice(0, 6).map((location, index) => (
                <motion.div
                  key={`${location.country}-${location.city || index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-ivory/5 transition-colors"
                >
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0 ${
                      index === 0
                        ? "bg-gold/20 text-gold"
                        : "bg-ivory/10 text-ivory/60"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="flex-1 text-xs sm:text-sm text-ivory truncate min-w-0">
                    {geoView === "cities" && location.city
                      ? location.countryCode === "FR"
                        ? location.city
                        : `${location.city} (${location.countryCode || location.country})`
                      : location.country}
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <div className="w-12 sm:w-20 h-1 sm:h-1.5 bg-night/40 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${location.percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="h-full bg-gold"
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs text-ivory/50 w-7 sm:w-8 text-right">
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
        className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
      >
        <h3 className="text-base sm:text-lg font-semibold text-gold mb-3 sm:mb-4">
          Toutes les sources
        </h3>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 sm:h-12 bg-gold/10 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-gold/10">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider hidden sm:table-cell">
                    Medium
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Visites
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider hidden md:table-cell">
                    Sessions
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Conv.
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider hidden sm:table-cell">
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
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {getMediumIcon(source.medium)}
                        <span className="text-xs sm:text-sm font-medium text-ivory truncate max-w-[80px] sm:max-w-[150px]">
                          {source.source}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-ivory/10 text-ivory/60">
                        {source.medium}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                      <span className="text-xs sm:text-sm text-ivory">
                        {source.visits.toLocaleString("fr-FR")}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right hidden md:table-cell">
                      <span className="text-xs sm:text-sm text-ivory/60">
                        {source.uniqueSessions.toLocaleString("fr-FR")}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                      <span
                        className={`text-xs sm:text-sm font-medium ${
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
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right hidden sm:table-cell">
                      {source.change !== undefined ? (
                        <span
                          className={`flex items-center justify-end gap-1 text-[10px] sm:text-xs font-medium ${
                            source.change >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {source.change >= 0 ? (
                            <ArrowUpRight size={10} className="sm:w-3 sm:h-3" />
                          ) : (
                            <ArrowDownRight size={10} className="sm:w-3 sm:h-3" />
                          )}
                          {Math.abs(source.change).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-xs text-ivory/30">-</span>
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
