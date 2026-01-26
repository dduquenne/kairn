"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Eye,
  Users,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Calendar,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  BarChart3,
  Link2,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { SocialPlatformIcon } from "./accounts/_components/SocialPlatformIcon";
import type { SocialPlatform, PostStatus } from "@/lib/social/types";

// ===========================================
// Types
// ===========================================

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  failedPosts: number;
  draftPosts: number;
  totalImpressions: number;
  totalReach: number;
  totalEngagements: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number;
}

interface PlatformStats {
  platform: SocialPlatform;
  postsCount: number;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

interface TrendDataPoint {
  date: string;
  impressions: number;
  engagements: number;
  posts: number;
}

interface RecentPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  blogTitle: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  externalPostId: string | null;
  errorMessage: string | null;
  accountName: string;
}

// ===========================================
// Helpers
// ===========================================

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "#1877F2",
  LINKEDIN: "#0A66C2",
  INSTAGRAM: "#E4405F",
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
          <CheckCircle className="h-3 w-3" />
          Publié
        </span>
      );
    case "SCHEDULED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
          <Clock className="h-3 w-3" />
          Programmé
        </span>
      );
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
          <Clock className="h-3 w-3" />
          Brouillon
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
          <AlertCircle className="h-3 w-3" />
          Échec
        </span>
      );
    case "PUBLISHING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Publication...
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-400">
          {status}
        </span>
      );
  }
}

// ===========================================
// Stat Card Component
// ===========================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subValue?: string;
}

function StatCard({ label, value, icon: Icon, color, subValue }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ivory/60">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-ivory">{value}</p>
          {subValue && <p className="mt-1 text-xs text-ivory/40">{subValue}</p>}
        </div>
        <div className={`rounded-lg bg-${color}/20 p-2`}>
          <Icon className={`h-5 w-5 text-${color}`} style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================
// Main Dashboard Component
// ===========================================

export default function SocialDashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/social/analytics?days=30&t=" + Date.now(), {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setPlatformStats(data.platformStats || []);
        setTrendData(data.trendData || []);
        setRecentPosts(data.recentPosts || []);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefreshAnalytics = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/social/analytics/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoursBack: 48 }),
      });

      if (response.ok) {
        const result = await response.json();
        addToast({
          title: "Analytics rafraîchis",
          description: result.message,
          variant: "success",
        });
        // Reload dashboard data
        await loadDashboard();
      } else {
        addToast({
          title: "Erreur",
          description: "Impossible de rafraîchir les analytics",
          variant: "error",
        });
      }
    } catch {
      addToast({
        title: "Erreur",
        description: "Erreur lors du rafraîchissement",
        variant: "error",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gold/20" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gold/20" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-gold/20" />
      </div>
    );
  }

  // Prepare chart data
  const chartData = trendData.map((d) => ({
    name: new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    impressions: d.impressions,
    engagements: d.engagements,
    posts: d.posts,
  }));

  const pieData = platformStats.map((p) => ({
    name: p.platform,
    value: p.postsCount,
    color: PLATFORM_COLORS[p.platform] || "#D4AF37",
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold">
              Tableau de bord
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ivory">
              Réseaux sociaux
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefreshAnalytics}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/20 bg-night/30 px-4 py-2 text-sm text-ivory/70 transition hover:border-gold/40 hover:text-ivory disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Actualiser
            </button>
            <button
              onClick={() => router.push("/admin/social/calendar")}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/20 bg-night/30 px-4 py-2 text-sm text-ivory/70 transition hover:border-gold/40 hover:text-ivory"
            >
              <Calendar className="h-4 w-4" />
              Calendrier
            </button>
            <button
              onClick={() => router.push("/admin/social/posts/new")}
              className="inline-flex items-center gap-2 rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30"
            >
              <Sparkles className="h-4 w-4" />
              Générer du contenu
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          label="Posts publiés"
          value={stats?.publishedPosts || 0}
          icon={CheckCircle}
          color="#22C55E"
          subValue={`${stats?.scheduledPosts || 0} programmés`}
        />
        <StatCard
          label="Impressions"
          value={formatNumber(stats?.totalImpressions || 0)}
          icon={Eye}
          color="#D4AF37"
          subValue={`Reach: ${formatNumber(stats?.totalReach || 0)}`}
        />
        <StatCard
          label="Engagements"
          value={formatNumber(stats?.totalEngagements || 0)}
          icon={Heart}
          color="#EC4899"
          subValue={`${(stats?.averageEngagementRate || 0).toFixed(2)}% taux`}
        />
        <StatCard
          label="Interactions"
          value={formatNumber(
            (stats?.totalLikes || 0) + (stats?.totalComments || 0) + (stats?.totalShares || 0)
          )}
          icon={MessageCircle}
          color="#3B82F6"
          subValue={`${stats?.totalLikes || 0} likes, ${stats?.totalComments || 0} com.`}
        />
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="col-span-1 rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gold">
              Tendances (30 derniers jours)
            </h3>
            <TrendingUp className="h-5 w-5 text-gold/50" />
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="#C7A962"
                  tick={{ fill: "rgba(245,241,230,0.7)", fontSize: 12 }}
                />
                <YAxis
                  stroke="#C7A962"
                  tick={{ fill: "rgba(245,241,230,0.7)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(13,10,8,0.95)",
                    border: "1px solid rgba(212,175,55,0.5)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#D4AF37" }}
                />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  dot={false}
                  name="Impressions"
                />
                <Line
                  type="monotone"
                  dataKey="engagements"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={false}
                  name="Engagements"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-ivory/40">
              Aucune donnée disponible
            </div>
          )}
        </motion.div>

        {/* Platform Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gold">Par plateforme</h3>
            <BarChart3 className="h-5 w-5 text-gold/50" />
          </div>

          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
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
                      backgroundColor: "rgba(13,10,8,0.95)",
                      border: "1px solid rgba(212,175,55,0.5)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-2">
                {platformStats.map((p) => (
                  <div
                    key={p.platform}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <SocialPlatformIcon
                        platform={p.platform}
                        className="h-4 w-4"
                      />
                      <span className="text-ivory/70 capitalize">
                        {p.platform.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-ivory/50">
                      <span>{p.postsCount} posts</span>
                      <span className="text-gold">
                        {p.engagementRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-ivory/40">
              Aucune donnée
            </div>
          )}
        </motion.div>
      </div>

      {/* Platform Performance Cards */}
      {platformStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {platformStats.map((p) => (
            <div
              key={p.platform}
              className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-5"
              style={{ borderLeftColor: PLATFORM_COLORS[p.platform], borderLeftWidth: "3px" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <SocialPlatformIcon platform={p.platform} className="h-8 w-8" />
                <div>
                  <h4 className="font-semibold text-ivory capitalize">
                    {p.platform.toLowerCase()}
                  </h4>
                  <p className="text-xs text-ivory/50">{p.postsCount} publications</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-semibold text-ivory">
                    {formatNumber(p.impressions)}
                  </p>
                  <p className="text-xs text-ivory/50">Impressions</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-ivory">
                    {formatNumber(p.engagements)}
                  </p>
                  <p className="text-xs text-ivory/50">Engagements</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gold">
                    {p.engagementRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-ivory/50">Taux</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-ivory/50">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" /> {p.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {p.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Share2 className="h-3 w-3" /> {p.shares}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Recent Publications History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gold">
            Historique des publications
          </h3>
          <button
            onClick={() => router.push("/admin/social/posts")}
            className="text-sm text-ivory/50 hover:text-gold transition"
          >
            Voir tout →
          </button>
        </div>

        {recentPosts.length > 0 ? (
          <div className="space-y-3">
            {recentPosts.slice(0, 10).map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4 rounded-lg border border-gold/10 bg-night/30 p-4 transition hover:border-gold/20"
              >
                <SocialPlatformIcon
                  platform={post.platform}
                  className="h-8 w-8 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {post.blogTitle && (
                        <p className="text-xs text-ivory/50 mb-1">
                          Article: {post.blogTitle}
                        </p>
                      )}
                      <p className="line-clamp-2 text-sm text-ivory">
                        {post.content}
                      </p>
                    </div>
                    {getStatusBadge(post.status)}
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-ivory/40">
                    <span>{post.accountName}</span>
                    <span>•</span>
                    <span>
                      {post.publishedAt
                        ? `Publié le ${new Date(post.publishedAt).toLocaleDateString("fr-FR")}`
                        : post.scheduledAt
                          ? `Prévu le ${new Date(post.scheduledAt).toLocaleDateString("fr-FR")}`
                          : "Brouillon"}
                    </span>
                    {post.externalPostId && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-green-400">
                          <Link2 className="h-3 w-3" />
                          Lié
                        </span>
                      </>
                    )}
                  </div>

                  {post.status === "FAILED" && post.errorMessage && (
                    <p className="mt-2 text-xs text-red-400">
                      Erreur: {post.errorMessage}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-gold/30" />
            <p className="mt-4 text-ivory/50">Aucune publication pour le moment</p>
            <button
              onClick={() => router.push("/admin/social/posts/new")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30"
            >
              <Plus className="h-4 w-4" />
              Créer ma première publication
            </button>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <button
          onClick={() => router.push("/admin/social/accounts")}
          className="flex items-center gap-4 rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-5 text-left transition hover:border-gold/40"
        >
          <div className="rounded-lg bg-blue-500/20 p-3">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-ivory">Gérer les comptes</h4>
            <p className="text-sm text-ivory/50">Connecter ou configurer les comptes sociaux</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/admin/social/posts")}
          className="flex items-center gap-4 rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-5 text-left transition hover:border-gold/40"
        >
          <div className="rounded-lg bg-purple-500/20 p-3">
            <BarChart3 className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-ivory">Toutes les publications</h4>
            <p className="text-sm text-ivory/50">Voir et gérer toutes vos publications</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/admin/social/calendar")}
          className="flex items-center gap-4 rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-5 text-left transition hover:border-gold/40"
        >
          <div className="rounded-lg bg-green-500/20 p-3">
            <Calendar className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-ivory">Calendrier</h4>
            <p className="text-sm text-ivory/50">Planifier vos publications à venir</p>
          </div>
        </button>
      </motion.div>
    </div>
  );
}
