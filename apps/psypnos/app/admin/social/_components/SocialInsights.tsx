'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Zap,
  Calendar,
  Target,
  Activity,
  BarChart3,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

import type { SocialPlatform, PostStatus } from '@/lib/social/types';

import { SocialPlatformIcon } from '../accounts/_components/SocialPlatformIcon';

// Dynamic imports for Recharts to avoid SSR issues
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), {
  ssr: false,
});
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), {
  ssr: false,
});
const Area = dynamic(() => import('recharts').then(mod => mod.Area), {
  ssr: false,
});
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), {
  ssr: false,
});
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), {
  ssr: false,
});
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), {
  ssr: false,
});
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), {
  ssr: false,
});
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), {
  ssr: false,
});

// ===========================================
// Types
// ===========================================

interface InsightPost {
  id: string;
  platform: SocialPlatform;
  status: PostStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
}

interface PlatformMetric {
  platform: SocialPlatform;
  posts: number;
  published: number;
  scheduled: number;
  color: string;
}

interface TrendPoint {
  date: string;
  posts: number;
  published: number;
}

interface SocialInsightsProps {
  posts: InsightPost[];
  analytics?: {
    impressions: number;
    engagements: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  } | null;
  isCompact?: boolean;
}

// ===========================================
// Constants
// ===========================================

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  FACEBOOK: '#1877F2',
  LINKEDIN: '#0A66C2',
  INSTAGRAM: '#E4405F',
  TWITTER: '#1DA1F2',
  THREADS: '#000000',
};

// ===========================================
// Helpers
// ===========================================

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getWeeklyTrend(posts: InsightPost[]): TrendPoint[] {
  const today = new Date();
  const weeks: TrendPoint[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i * 7);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekPosts = posts.filter(p => {
      const postDate = new Date(p.publishedAt || p.scheduledAt || '');
      return postDate >= weekStart && postDate <= weekEnd;
    });

    weeks.push({
      date: weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      posts: weekPosts.length,
      published: weekPosts.filter(p => p.status === 'PUBLISHED').length,
    });
  }

  return weeks;
}

// ===========================================
// Sub-components
// ===========================================

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: number;
  subValue?: string;
}

function MetricCard({ label, value, icon: Icon, color, trend, subValue }: MetricCardProps) {
  return (
    <div className="border-gold/20 from-night/60 to-night/40 rounded-lg border bg-gradient-to-br p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-ivory/60 text-xs">{label}</span>
        <div className="rounded-lg p-1.5" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-ivory text-2xl font-semibold">{value}</p>
          {subValue && <p className="text-ivory/50 text-xs">{subValue}</p>}
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformMiniCard({ metric }: { metric: PlatformMetric }) {
  const percentage = metric.posts > 0 ? Math.round((metric.published / metric.posts) * 100) : 0;

  return (
    <div
      className="border-gold/10 bg-night/20 flex items-center gap-3 rounded-lg border p-3"
      style={{ borderLeftColor: metric.color, borderLeftWidth: '3px' }}
    >
      <SocialPlatformIcon platform={metric.platform} className="h-6 w-6" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-ivory text-sm font-medium capitalize">
            {metric.platform.toLowerCase()}
          </span>
          <span className="text-ivory/50 text-xs">{metric.posts}</span>
        </div>
        <div className="bg-gold/10 mt-1.5 h-1.5 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, backgroundColor: metric.color }}
          />
        </div>
      </div>
    </div>
  );
}

// ===========================================
// Main Component
// ===========================================

export function SocialInsights({ posts, analytics, isCompact = false }: SocialInsightsProps) {
  const platformMetrics = useMemo((): PlatformMetric[] => {
    const platforms: SocialPlatform[] = ['FACEBOOK', 'LINKEDIN', 'INSTAGRAM', 'TWITTER', 'THREADS'];
    return platforms
      .map(platform => {
        const platformPosts = posts.filter(p => p.platform === platform);
        return {
          platform,
          posts: platformPosts.length,
          published: platformPosts.filter(p => p.status === 'PUBLISHED').length,
          scheduled: platformPosts.filter(p => p.status === 'SCHEDULED').length,
          color: PLATFORM_COLORS[platform],
        };
      })
      .filter(m => m.posts > 0);
  }, [posts]);

  const weeklyTrend = useMemo(() => getWeeklyTrend(posts), [posts]);

  const statusDistribution = useMemo(() => {
    const distribution = [
      {
        name: 'Publiés',
        value: posts.filter(p => p.status === 'PUBLISHED').length,
        color: '#22C55E',
      },
      {
        name: 'Programmés',
        value: posts.filter(p => p.status === 'SCHEDULED').length,
        color: '#3B82F6',
      },
      {
        name: 'Brouillons',
        value: posts.filter(p => p.status === 'DRAFT').length,
        color: '#F59E0B',
      },
      { name: 'Échecs', value: posts.filter(p => p.status === 'FAILED').length, color: '#EF4444' },
    ].filter(d => d.value > 0);
    return distribution;
  }, [posts]);

  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'PUBLISHED').length;
  const scheduledPosts = posts.filter(p => p.status === 'SCHEDULED').length;

  const publishRate = totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0;

  if (isCompact) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Total" value={totalPosts} icon={BarChart3} color="#D4AF37" />
        <MetricCard
          label="Publiés"
          value={publishedPosts}
          icon={Zap}
          color="#22C55E"
          subValue={`${publishRate}%`}
        />
        <MetricCard label="Programmés" value={scheduledPosts} icon={Calendar} color="#3B82F6" />
        {analytics && (
          <MetricCard
            label="Engagements"
            value={formatNumber(analytics.engagements)}
            icon={Heart}
            color="#EC4899"
            subValue={`${analytics.engagementRate.toFixed(2)}%`}
          />
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <MetricCard
          label="Publications"
          value={totalPosts}
          icon={BarChart3}
          color="#D4AF37"
          subValue="Total"
        />
        <MetricCard
          label="Publiés"
          value={publishedPosts}
          icon={Zap}
          color="#22C55E"
          subValue={`${publishRate}% taux`}
        />
        <MetricCard label="Programmés" value={scheduledPosts} icon={Calendar} color="#3B82F6" />
        {analytics && (
          <>
            <MetricCard
              label="Impressions"
              value={formatNumber(analytics.impressions)}
              icon={Eye}
              color="#D4AF37"
              subValue={`${formatNumber(analytics.reach)} reach`}
            />
            <MetricCard
              label="Engagements"
              value={formatNumber(analytics.engagements)}
              icon={Heart}
              color="#EC4899"
              subValue={`${analytics.engagementRate.toFixed(2)}%`}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Weekly Trend */}
        <div className="border-gold/20 from-night/60 to-night/40 col-span-1 rounded-lg border bg-gradient-to-br p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-gold flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" />
              Activité (7 semaines)
            </h3>
          </div>

          {weeklyTrend.some(w => w.posts > 0) ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="rgba(199,169,98,0.3)"
                    tick={{ fill: 'rgba(245,241,230,0.5)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(26,26,26,0.95)',
                      border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#D4AF37' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="posts"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    fill="url(#colorPosts)"
                    name="Posts"
                  />
                  <Area
                    type="monotone"
                    dataKey="published"
                    stroke="#22C55E"
                    strokeWidth={2}
                    fill="url(#colorPublished)"
                    name="Publiés"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-ivory/40 flex h-[180px] items-center justify-center text-sm">
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="border-gold/20 from-night/60 to-night/40 rounded-lg border bg-gradient-to-br p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-gold flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />
              Distribution
            </h3>
          </div>

          {statusDistribution.length > 0 ? (
            <>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(26,26,26,0.95)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {statusDistribution.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-ivory/70">{item.name}</span>
                    </div>
                    <span className="text-ivory/50">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-ivory/40 flex h-[180px] items-center justify-center text-sm">
              Aucune donnée
            </div>
          )}
        </div>
      </div>

      {/* Platform Breakdown */}
      {platformMetrics.length > 0 && (
        <div className="border-gold/20 from-night/60 to-night/40 rounded-lg border bg-gradient-to-br p-4">
          <h3 className="text-gold mb-4 flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="h-4 w-4" />
            Par plateforme
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {platformMetrics.map(metric => (
              <PlatformMiniCard key={metric.platform} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {/* Analytics Breakdown */}
      {analytics && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <div className="border-gold/10 bg-night/20 rounded-lg border p-3 text-center">
            <Eye className="text-gold/70 mx-auto mb-1 h-4 w-4" />
            <p className="text-ivory text-lg font-semibold">
              {formatNumber(analytics.impressions)}
            </p>
            <p className="text-ivory/50 text-xs">Impressions</p>
          </div>
          <div className="border-gold/10 bg-night/20 rounded-lg border p-3 text-center">
            <Heart className="mx-auto mb-1 h-4 w-4 text-pink-400/70" />
            <p className="text-ivory text-lg font-semibold">{formatNumber(analytics.likes)}</p>
            <p className="text-ivory/50 text-xs">Likes</p>
          </div>
          <div className="border-gold/10 bg-night/20 rounded-lg border p-3 text-center">
            <MessageCircle className="mx-auto mb-1 h-4 w-4 text-blue-400/70" />
            <p className="text-ivory text-lg font-semibold">{formatNumber(analytics.comments)}</p>
            <p className="text-ivory/50 text-xs">Commentaires</p>
          </div>
          <div className="border-gold/10 bg-night/20 rounded-lg border p-3 text-center">
            <Share2 className="mx-auto mb-1 h-4 w-4 text-green-400/70" />
            <p className="text-ivory text-lg font-semibold">{formatNumber(analytics.shares)}</p>
            <p className="text-ivory/50 text-xs">Partages</p>
          </div>
          <div className="border-gold/10 bg-night/20 rounded-lg border p-3 text-center">
            <Target className="mx-auto mb-1 h-4 w-4 text-purple-400/70" />
            <p className="text-ivory text-lg font-semibold">{formatNumber(analytics.reach)}</p>
            <p className="text-ivory/50 text-xs">Portée</p>
          </div>
          <div className="border-gold/10 bg-night/20 rounded-lg border p-3 text-center">
            <Zap className="mx-auto mb-1 h-4 w-4 text-amber-400/70" />
            <p className="text-ivory text-lg font-semibold">
              {analytics.engagementRate.toFixed(2)}%
            </p>
            <p className="text-ivory/50 text-xs">Taux d&apos;eng.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
