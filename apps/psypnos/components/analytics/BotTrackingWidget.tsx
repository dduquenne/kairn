/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Search,
  Share2,
  BarChart3,
  Activity,
  Globe,
  FileText,
  Clock,
  RefreshCw,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Target,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

interface BotStats {
  summary: {
    totalVisits: number;
    uniqueBots: number;
    uniquePages: number;
    lastVisit: string | null;
    totalSitePages: number;
    crawlCoverage: number;
  };
  byType: Array<{
    type: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  byBot: Array<{
    name: string;
    type: string;
    count: number;
    lastVisit: string;
  }>;
  byPage: Array<{
    page: string;
    visits: number;
    uniqueBots: number;
  }>;
  timeline: Array<{
    date: string;
    count: number;
    searchEngine: number;
    social: number;
    seoTool: number;
    monitor: number;
    other: number;
  }>;
  recentVisits: Array<{
    id: string;
    timestamp: string;
    botName: string;
    botType: string;
    page: string;
    country: string | null;
  }>;
}

const BOT_TYPE_COLORS: Record<string, string> = {
  search_engine: "#22c55e",
  social: "#3b82f6",
  seo_tool: "#a855f7",
  monitor: "#f59e0b",
  other: "#6b7280",
};

const BOT_TYPE_ICONS: Record<string, typeof Search> = {
  search_engine: Search,
  social: Share2,
  seo_tool: BarChart3,
  monitor: Activity,
  other: Bot,
};

interface Props {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
}

export function BotTrackingWidget({ timeRange = "30d", startDate, endDate }: Props) {
  const [stats, setStats] = useState<BotStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"bots" | "pages" | "timeline" | "recent">("bots");

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append("timeRange", timeRange);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/analytics/bots?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch bot analytics");
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching bot stats:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange, startDate, endDate]);

  useEffect(() => {
    setIsLoading(true);
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Bot className="text-gold animate-pulse" size={24} />
          <span className="text-ivory/60">Chargement des statistiques de bots...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-400" size={24} />
          <span className="text-red-300">{error}</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Bot className="text-gold/50" size={24} />
          <span className="text-ivory/60">Aucune donnee de bots disponible</span>
        </div>
      </div>
    );
  }

  const pieData = stats.byType.map((item) => ({
    name: item.label,
    value: item.count,
    color: BOT_TYPE_COLORS[item.type] || BOT_TYPE_COLORS.other,
  }));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gold/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/20">
              <Bot className="text-gold" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gold">Tracking des Bots SEO</h3>
              <p className="text-sm text-ivory/60">
                Analyse des crawlers et robots visitant le site
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-lg bg-night/40 border border-gold/10">
          <div className="flex items-center gap-2 text-ivory/60 text-sm mb-1">
            <TrendingUp size={14} />
            Total Visites
          </div>
          <div className="text-2xl font-bold text-gold">{stats.summary.totalVisits.toLocaleString()}</div>
        </div>

        <div className="p-4 rounded-lg bg-night/40 border border-gold/10">
          <div className="flex items-center gap-2 text-ivory/60 text-sm mb-1">
            <Bot size={14} />
            Bots Uniques
          </div>
          <div className="text-2xl font-bold text-blue-400">{stats.summary.uniqueBots}</div>
        </div>

        <div className="p-4 rounded-lg bg-night/40 border border-gold/10">
          <div className="flex items-center gap-2 text-ivory/60 text-sm mb-1">
            <FileText size={14} />
            Pages Crawlees
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {stats.summary.uniquePages}
            <span className="text-sm text-ivory/40 font-normal ml-1">
              / {stats.summary.totalSitePages}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-night/40 border border-gold/10">
          <div className="flex items-center gap-2 text-ivory/60 text-sm mb-1">
            <Target size={14} />
            Couverture
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold" style={{
              color: stats.summary.crawlCoverage >= 80 ? '#22c55e' :
                     stats.summary.crawlCoverage >= 50 ? '#f59e0b' : '#ef4444'
            }}>
              {stats.summary.crawlCoverage}%
            </div>
            {stats.summary.crawlCoverage >= 80 && (
              <CheckCircle2 size={18} className="text-green-500" />
            )}
          </div>
          <div className="mt-2 w-full h-2 bg-night/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats.summary.crawlCoverage}%`,
                backgroundColor: stats.summary.crawlCoverage >= 80 ? '#22c55e' :
                                 stats.summary.crawlCoverage >= 50 ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-night/40 border border-gold/10">
          <div className="flex items-center gap-2 text-ivory/60 text-sm mb-1">
            <Clock size={14} />
            Derniere Visite
          </div>
          <div className="text-sm font-medium text-ivory">
            {stats.summary.lastVisit
              ? formatTime(stats.summary.lastVisit)
              : "Aucune"}
          </div>
        </div>
      </div>

      {/* Bot Type Distribution */}
      <div className="px-6 pb-6">
        <h4 className="text-sm font-medium text-ivory/80 mb-4">Repartition par Type de Bot</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-64">
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid rgba(212, 175, 55, 0.3)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f5f5f0" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: "#f5f5f0", fontSize: "12px" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Type List */}
          <div className="space-y-3">
            {stats.byType.map((item) => {
              const Icon = BOT_TYPE_ICONS[item.type] || Bot;
              const color = BOT_TYPE_COLORS[item.type] || BOT_TYPE_COLORS.other;

              return (
                <div
                  key={item.type}
                  className="flex items-center justify-between p-3 rounded-lg bg-night/30 border border-gold/10"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>
                    <span className="text-ivory">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-ivory font-medium">{item.count.toLocaleString()}</span>
                    <div className="w-16 h-2 bg-night/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span className="text-ivory/60 text-sm w-10 text-right">{item.percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toggle Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-2 py-4 border-t border-gold/10 text-gold hover:bg-gold/5 transition"
      >
        {showDetails ? (
          <>
            <ChevronUp size={18} />
            Masquer les details
          </>
        ) : (
          <>
            <ChevronDown size={18} />
            Voir les details
          </>
        )}
      </button>

      {/* Detailed Views */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-gold/10"
        >
          {/* Tab Navigation */}
          <div className="flex gap-2 p-4 border-b border-gold/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab("bots")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === "bots"
                  ? "bg-gold text-night"
                  : "bg-night/40 text-ivory/70 hover:bg-night/60"
              }`}
            >
              Top Bots
            </button>
            <button
              onClick={() => setActiveTab("pages")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === "pages"
                  ? "bg-gold text-night"
                  : "bg-night/40 text-ivory/70 hover:bg-night/60"
              }`}
            >
              Pages Crawlees
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === "timeline"
                  ? "bg-gold text-night"
                  : "bg-night/40 text-ivory/70 hover:bg-night/60"
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === "recent"
                  ? "bg-gold text-night"
                  : "bg-night/40 text-ivory/70 hover:bg-night/60"
              }`}
            >
              Visites Recentes
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Top Bots Tab */}
            {activeTab === "bots" && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-ivory/80 mb-4">
                  Classement des Bots les Plus Actifs
                </h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.byBot.slice(0, 10)}
                      layout="vertical"
                      margin={{ left: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
                      <XAxis type="number" stroke="#f5f5f080" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#f5f5f080"
                        tick={{ fill: "#f5f5f0", fontSize: 12 }}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a2e",
                          border: "1px solid rgba(212, 175, 55, 0.3)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#f5f5f0" }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#d4af37"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Bot List Table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-ivory/60 border-b border-gold/10">
                        <th className="pb-3 font-medium">Bot</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium text-right">Visites</th>
                        <th className="pb-3 font-medium text-right">Derniere Activite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byBot.map((bot, index) => (
                        <tr key={bot.name} className="border-b border-gold/5">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-gold/60 text-xs w-5">#{index + 1}</span>
                              <span className="text-ivory font-medium">{bot.name}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span
                              className="px-2 py-1 rounded text-xs"
                              style={{
                                backgroundColor: `${BOT_TYPE_COLORS[bot.type]}20`,
                                color: BOT_TYPE_COLORS[bot.type],
                              }}
                            >
                              {bot.type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 text-right text-ivory">{bot.count.toLocaleString()}</td>
                          <td className="py-3 text-right text-ivory/60 text-xs">
                            {formatTime(bot.lastVisit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pages Tab */}
            {activeTab === "pages" && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-ivory/80 mb-4">
                  Pages les Plus Crawlees
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-ivory/60 border-b border-gold/10">
                        <th className="pb-3 font-medium">#</th>
                        <th className="pb-3 font-medium">Page</th>
                        <th className="pb-3 font-medium text-right">Visites</th>
                        <th className="pb-3 font-medium text-right">Bots Uniques</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byPage.map((page, index) => (
                        <tr key={page.page} className="border-b border-gold/5">
                          <td className="py-3 text-gold/60 text-xs">{index + 1}</td>
                          <td className="py-3">
                            <span className="text-ivory font-mono text-xs">{page.page}</span>
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-gold font-medium">{page.visits.toLocaleString()}</span>
                          </td>
                          <td className="py-3 text-right text-ivory/60">{page.uniqueBots}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-ivory/80 mb-4">
                  Evolution des Visites de Bots
                </h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
                      <XAxis
                        dataKey="date"
                        stroke="#f5f5f080"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis stroke="#f5f5f080" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a2e",
                          border: "1px solid rgba(212, 175, 55, 0.3)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#f5f5f0" }}
                        labelFormatter={formatDate}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="searchEngine"
                        name="Moteurs de recherche"
                        stroke={BOT_TYPE_COLORS.search_engine}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="social"
                        name="Reseaux sociaux"
                        stroke={BOT_TYPE_COLORS.social}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="seoTool"
                        name="Outils SEO"
                        stroke={BOT_TYPE_COLORS.seo_tool}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="monitor"
                        name="Monitoring"
                        stroke={BOT_TYPE_COLORS.monitor}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Visits Tab */}
            {activeTab === "recent" && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-ivory/80 mb-4">
                  50 Dernieres Visites de Bots
                </h4>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-night/90">
                      <tr className="text-left text-ivory/60 border-b border-gold/10">
                        <th className="pb-3 font-medium">Date/Heure</th>
                        <th className="pb-3 font-medium">Bot</th>
                        <th className="pb-3 font-medium">Page</th>
                        <th className="pb-3 font-medium">Pays</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentVisits.map((visit) => (
                        <tr key={visit.id} className="border-b border-gold/5">
                          <td className="py-2 text-ivory/60 text-xs whitespace-nowrap">
                            {formatTime(visit.timestamp)}
                          </td>
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: BOT_TYPE_COLORS[visit.botType] || BOT_TYPE_COLORS.other,
                                }}
                              />
                              <span className="text-ivory">{visit.botName}</span>
                            </div>
                          </td>
                          <td className="py-2">
                            <span className="text-ivory/80 font-mono text-xs truncate max-w-xs block">
                              {visit.page}
                            </span>
                          </td>
                          <td className="py-2">
                            {visit.country && (
                              <div className="flex items-center gap-1 text-ivory/60">
                                <Globe size={12} />
                                <span className="text-xs">{visit.country}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default BotTrackingWidget;
