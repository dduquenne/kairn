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
} from "recharts";
import { Bot, Search, FileSearch, Clock, Globe, Activity } from "lucide-react";

interface BotVisit {
  date: string;
  visits: number;
}

interface BotType {
  name: string;
  type: "search_engine" | "social" | "seo_tool" | "monitoring" | "other";
  visits: number;
  lastSeen: string;
  pages: number;
}

interface CrawledPage {
  path: string;
  crawlCount: number;
  lastCrawled: string;
  botTypes: string[];
}

interface SEOPanelProps {
  totalBotVisits: number;
  uniqueBots: number;
  crawledPages: number;
  avgCrawlRate: number; // pages per day
  botVisitsTimeline: BotVisit[];
  botTypes: BotType[];
  topCrawledPages: CrawledPage[];
  isLoading?: boolean;
}

const getBotIcon = (type: BotType["type"]) => {
  switch (type) {
    case "search_engine":
      return <Search size={16} className="text-green-400" />;
    case "social":
      return <Globe size={16} className="text-blue-400" />;
    case "seo_tool":
      return <FileSearch size={16} className="text-purple-400" />;
    case "monitoring":
      return <Activity size={16} className="text-yellow-400" />;
    default:
      return <Bot size={16} className="text-ivory/50" />;
  }
};

const getBotTypeLabel = (type: BotType["type"]) => {
  switch (type) {
    case "search_engine":
      return "Moteur de recherche";
    case "social":
      return "Réseau social";
    case "seo_tool":
      return "Outil SEO";
    case "monitoring":
      return "Monitoring";
    default:
      return "Autre";
  }
};

export function SEOPanel({
  totalBotVisits,
  uniqueBots,
  crawledPages,
  avgCrawlRate,
  botVisitsTimeline,
  botTypes,
  topCrawledPages,
  isLoading = false,
}: SEOPanelProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-green-500/20 bg-night/95 backdrop-blur-sm px-4 py-3 shadow-xl">
          <p className="text-xs text-ivory/60 mb-1">{label}</p>
          <p className="text-lg font-bold text-green-400">
            {payload[0]?.value || 0} visites bots
          </p>
        </div>
      );
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-green-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 flex-shrink-0">
              <Bot size={16} className="text-green-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ivory/50 truncate">Visites bots</p>
              <p className="text-base sm:text-xl font-bold text-ivory">
                {isLoading ? "..." : totalBotVisits.toLocaleString("fr-FR")}
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
              <Search size={16} className="text-blue-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ivory/50 truncate">Bots uniques</p>
              <p className="text-base sm:text-xl font-bold text-ivory">
                {isLoading ? "..." : uniqueBots}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
              <FileSearch size={16} className="text-purple-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ivory/50 truncate">Pages crawlées</p>
              <p className="text-base sm:text-xl font-bold text-ivory">
                {isLoading ? "..." : crawledPages}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gold/10 flex-shrink-0">
              <Clock size={16} className="text-gold sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ivory/50 truncate">Crawl/jour</p>
              <p className="text-base sm:text-xl font-bold text-ivory">
                {isLoading ? "..." : avgCrawlRate.toFixed(0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Bot Visits Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-green-500/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-green-400 mb-3 sm:mb-4">
            Activité des bots
          </h3>

          {isLoading ? (
            <div className="h-40 sm:h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="h-40 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={botVisitsTimeline}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorBots" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(34, 197, 94, 0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(245, 245, 240, 0.3)"
                    tick={{ fill: "rgba(245, 245, 240, 0.5)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(245, 245, 240, 0.3)"
                    tick={{ fill: "rgba(245, 245, 240, 0.5)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#22C55E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBots)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Bot Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-green-500/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-green-400 mb-3 sm:mb-4">
            Bots identifiés
          </h3>

          {isLoading ? (
            <div className="space-y-2 sm:space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 sm:h-14 bg-green-500/10 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : botTypes.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Bot size={32} className="mx-auto text-ivory/20 mb-2 sm:mb-3 sm:w-10 sm:h-10" />
              <p className="text-xs sm:text-sm text-ivory/50">Aucun bot détecté</p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
              {botTypes.map((bot, index) => (
                <motion.div
                  key={bot.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-night/50 border border-green-500/10 hover:border-green-500/30 transition-colors"
                >
                  <div className="p-1 sm:p-1.5 rounded-lg bg-green-500/10 flex-shrink-0">
                    {getBotIcon(bot.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-ivory truncate">
                      {bot.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-ivory/40 truncate">
                      {getBotTypeLabel(bot.type)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-semibold text-green-400">
                      {bot.visits}
                    </p>
                    <p className="text-[10px] sm:text-xs text-ivory/40">{bot.pages} pages</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Top Crawled Pages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-green-500/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
      >
        <h3 className="text-base sm:text-lg font-semibold text-green-400 mb-3 sm:mb-4">
          Pages les plus crawlées
        </h3>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 sm:h-12 bg-green-500/10 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : topCrawledPages.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <FileSearch size={32} className="mx-auto text-ivory/20 mb-2 sm:mb-3 sm:w-10 sm:h-10" />
            <p className="text-xs sm:text-sm text-ivory/50">Aucune donnée de crawl</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-green-500/10">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider">
                    Crawls
                  </th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider hidden sm:table-cell">
                    Dernier
                  </th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-medium text-ivory/50 uppercase tracking-wider hidden md:table-cell">
                    Bots
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCrawledPages.map((page, index) => (
                  <motion.tr
                    key={page.path}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-green-500/5 hover:bg-ivory/5 transition-colors"
                  >
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span className="text-xs sm:text-sm font-medium text-ivory truncate block max-w-[120px] sm:max-w-[200px]">
                        {page.path}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                      <span className="text-xs sm:text-sm font-semibold text-green-400">
                        {page.crawlCount}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right hidden sm:table-cell">
                      <span className="text-[10px] sm:text-xs text-ivory/50">
                        {formatDate(page.lastCrawled)}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1 flex-wrap">
                        {page.botTypes.slice(0, 2).map((botType, i) => (
                          <span
                            key={i}
                            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-green-500/10 text-green-400"
                          >
                            {botType}
                          </span>
                        ))}
                        {page.botTypes.length > 2 && (
                          <span className="text-[10px] sm:text-xs text-ivory/40">
                            +{page.botTypes.length - 2}
                          </span>
                        )}
                      </div>
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
