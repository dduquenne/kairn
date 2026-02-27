'use client';

import { motion } from 'framer-motion';
import {
  Share2,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  TrendingUp,
  Clock,
  Instagram,
  Linkedin,
  Calendar,
  BarChart3,
  Sparkles,
  Award,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Image,
  Video,
  FileText,
  Layers,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Types
export interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'threads';
  type: 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'text';
  content: string;
  publishedAt: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  engagementRate: number;
  thumbnailUrl?: string;
}

export interface PlatformStats {
  platform: string;
  icon: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'threads';
  followers: number;
  followersChange: number;
  posts: number;
  reach: number;
  engagement: number;
  engagementRate: number;
  color: string;
}

export interface PostTypeStats {
  type: string;
  count: number;
  avgEngagement: number;
  percentage: number;
}

export interface EngagementTrend {
  label: string;
  reach: number;
  engagement: number;
  posts: number;
}

export interface BestPostingTime {
  day: string;
  hour: number;
  engagement: number;
}

export interface PostsPanelData {
  totalPosts: number;
  postsChange: number;
  totalReach: number;
  reachChange: number;
  totalEngagement: number;
  engagementChange: number;
  avgEngagementRate: number;
  engagementRateChange: number;
  totalFollowers: number;
  followersChange: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  platforms: PlatformStats[];
  topPosts: SocialPost[];
  postTypes: PostTypeStats[];
  engagementTrends: EngagementTrend[];
  bestPostingTimes: BestPostingTime[];
  dateRangeExpanded?: boolean;
  effectiveDateRange?: { startDate: string; endDate: string };
}

interface PostsPanelProps {
  data: PostsPanelData | null;
  isLoading?: boolean;
}

// Platform icons component
const PlatformIcon = ({
  platform,
  size = 18,
  className = '',
}: {
  platform: string;
  size?: number;
  className?: string;
}) => {
  switch (platform) {
    case 'instagram':
      return <Instagram size={size} className={className} />;
    case 'linkedin':
      return <Linkedin size={size} className={className} />;
    case 'facebook':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          fill="currentColor"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'threads':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          fill="currentColor"
        >
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017C1.5 8.418 2.35 5.564 3.995 3.516 5.845 1.205 8.598.024 12.179 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.26 1.33-3.017.88-.724 2.107-1.127 3.461-1.137.96-.007 1.83.137 2.594.432 0-.497-.016-.949-.048-1.357h2.044c.105 1.028.105 2.201.043 3.08.397.202.783.42 1.217.606 1.06.587 1.886 1.416 2.378 2.445.716 1.502.813 4.157-1.248 6.173-1.794 1.755-4.02 2.545-7.205 2.57z" />
        </svg>
      );
    default:
      return <Share2 size={size} className={className} />;
  }
};

// Post type icon
const PostTypeIcon = ({ type, size = 16 }: { type: string; size?: number }) => {
  switch (type) {
    case 'image':
      return <Image size={size} className="text-blue-400" />;
    case 'video':
    case 'reel':
      return <Video size={size} className="text-purple-400" />;
    case 'carousel':
      return <Layers size={size} className="text-green-400" />;
    case 'story':
      return <Clock size={size} className="text-orange-400" />;
    case 'text':
      return <FileText size={size} className="text-gray-400" />;
    default:
      return <Share2 size={size} className="text-ivory/50" />;
  }
};

// Platform colors
const platformColors: Record<string, string> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
  threads: '#000000',
};

// Custom tooltip for charts
interface TooltipPayloadEntry {
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="border-gold/20 bg-night/95 rounded-lg border p-3 shadow-xl backdrop-blur-xl">
        <p className="text-ivory/60 mb-2 text-xs">{label}</p>
        {payload.map((entry: TooltipPayloadEntry) => (
          <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString('fr-FR')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PostsPanel({ data, isLoading = false }: PostsPanelProps) {
  console.log('[PostsPanel:Debug][Render] PostsPanel rendu avec:', {
    isLoading,
    dataIsNull: data === null,
    totalPosts: data?.totalPosts ?? 'N/A',
    totalReach: data?.totalReach ?? 'N/A',
    totalEngagement: data?.totalEngagement ?? 'N/A',
    platformsCount: data?.platforms?.length ?? 'N/A',
    topPostsCount: data?.topPosts?.length ?? 'N/A',
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('fr-FR');
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Heatmap data for best posting times
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const hours = [9, 12, 15, 18, 21];

  const getHeatmapValue = (day: string, hour: number): number => {
    if (!data?.bestPostingTimes) return 0;
    const found = data.bestPostingTimes.find(t => t.day === day && t.hour === hour);
    return found?.engagement || 0;
  };

  const maxHeatmapValue = data?.bestPostingTimes
    ? Math.max(...data.bestPostingTimes.map(t => t.engagement), 1)
    : 1;

  return (
    <div className="space-y-4 overflow-x-hidden sm:space-y-6">
      {/* Bannière quand les données sont élargies au-delà de la période sélectionnée */}
      {data?.dateRangeExpanded && data.effectiveDateRange && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3"
        >
          <Info size={18} className="flex-shrink-0 text-amber-400" />
          <p className="text-sm text-amber-200">
            Aucune activité sur la période sélectionnée. Les données affichées couvrent la période{' '}
            <span className="font-semibold text-amber-100">
              {new Date(data.effectiveDateRange.startDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            {' \u2013 '}
            <span className="font-semibold text-amber-100">
              {new Date(data.effectiveDateRange.endDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </p>
        </motion.div>
      )}

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {/* Total Posts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gold/10 flex-shrink-0 rounded-lg p-2">
              <Share2 size={18} className="text-gold sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Posts publiés</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : formatNumber(data?.totalPosts ?? 0)}
              </p>
              {data?.postsChange !== undefined && (
                <p
                  className={`flex items-center gap-0.5 text-xs ${data.postsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {data.postsChange >= 0 ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {Math.abs(data.postsChange).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Total Reach */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="from-night/60 to-night/40 rounded-xl border border-blue-500/20 bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-lg bg-blue-500/10 p-2">
              <Eye size={18} className="text-blue-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Portée totale</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : formatNumber(data?.totalReach ?? 0)}
              </p>
              {data?.reachChange !== undefined && (
                <p
                  className={`flex items-center gap-0.5 text-xs ${data.reachChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {data.reachChange >= 0 ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {Math.abs(data.reachChange).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Total Engagement */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="from-night/60 to-night/40 rounded-xl border border-pink-500/20 bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-lg bg-pink-500/10 p-2">
              <Heart size={18} className="text-pink-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Engagements</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : formatNumber(data?.totalEngagement ?? 0)}
              </p>
              {data?.engagementChange !== undefined && (
                <p
                  className={`flex items-center gap-0.5 text-xs ${data.engagementChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {data.engagementChange >= 0 ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {Math.abs(data.engagementChange).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Engagement Rate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="from-night/60 to-night/40 rounded-xl border border-green-500/20 bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-lg bg-green-500/10 p-2">
              <TrendingUp size={18} className="text-green-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Taux d'engagement</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : `${(data?.avgEngagementRate ?? 0).toFixed(2)}%`}
              </p>
              {data?.engagementRateChange !== undefined && (
                <p
                  className={`flex items-center gap-0.5 text-xs ${data.engagementRateChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {data.engagementRateChange >= 0 ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {Math.abs(data.engagementRateChange).toFixed(2)}%
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Total Followers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="from-night/60 to-night/40 col-span-2 rounded-xl border border-purple-500/20 bg-gradient-to-br p-3 sm:col-span-1 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-lg bg-purple-500/10 p-2">
              <Users size={18} className="text-purple-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Abonnés totaux</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : formatNumber(data?.totalFollowers ?? 0)}
              </p>
              {data?.followersChange !== undefined && (
                <p
                  className={`flex items-center gap-0.5 text-xs ${data.followersChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {data.followersChange >= 0 ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  +{formatNumber(Math.abs(data.followersChange))}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Platform Breakdown & Engagement Trends */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Platform Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-gold" />
            <h3 className="text-gold text-base font-semibold sm:text-lg">
              Performance par plateforme
            </h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gold/10 h-20 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !data?.platforms || data.platforms.length === 0 ? (
            <div className="py-8 text-center">
              <Share2 size={32} className="text-ivory/20 mx-auto mb-2" />
              <p className="text-ivory/50 text-sm">Aucune donnée de plateforme</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.platforms.map((platform, index) => (
                <motion.div
                  key={platform.platform}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-night/50 border-gold/10 hover:border-gold/20 rounded-lg border p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-shrink-0 rounded-lg p-2"
                      style={{ backgroundColor: `${platform.color}20` }}
                    >
                      <PlatformIcon platform={platform.icon} size={20} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-ivory font-medium capitalize">
                          {platform.platform}
                        </span>
                        <span className="text-ivory/60 text-xs">{platform.posts} posts</span>
                      </div>
                      <div className="text-ivory/60 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {formatNumber(platform.followers)}
                          <span
                            className={
                              platform.followersChange >= 0 ? 'text-green-400' : 'text-red-400'
                            }
                          >
                            ({platform.followersChange >= 0 ? '+' : ''}
                            {platform.followersChange}%)
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {formatNumber(platform.reach)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={12} />
                          {platform.engagementRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Engagement Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-gold" />
            <h3 className="text-gold text-base font-semibold sm:text-lg">Tendances d'engagement</h3>
          </div>

          {isLoading ? (
            <div className="bg-gold/10 h-[250px] animate-pulse rounded-lg" />
          ) : !data?.engagementTrends || data.engagementTrends.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center">
              <div className="text-center">
                <TrendingUp size={32} className="text-ivory/20 mx-auto mb-2" />
                <p className="text-ivory/50 text-sm">Aucune donnée de tendance</p>
              </div>
            </div>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.engagementTrends}>
                  <defs>
                    <linearGradient id="postsReachGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="postsEngagementGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={value => formatNumber(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="reach"
                    name="Portée"
                    stroke="#3B82F6"
                    fill="url(#postsReachGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    name="Engagement"
                    stroke="#EC4899"
                    fill="url(#postsEngagementGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Top Performing Posts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-gold" />
            <h3 className="text-gold text-base font-semibold sm:text-lg">
              Posts les plus performants
            </h3>
          </div>
          <span className="text-ivory/40 text-xs">{data?.topPosts?.length ?? 0} posts</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gold/10 h-20 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : !data?.topPosts || data.topPosts.length === 0 ? (
          <div className="py-12 text-center">
            <Share2 size={48} className="text-ivory/20 mx-auto mb-4" />
            <p className="text-ivory/50">Aucun post disponible</p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-gold/20 border-b">
                  <th className="text-ivory/70 px-4 py-3 text-left font-semibold">#</th>
                  <th className="text-ivory/70 px-4 py-3 text-left font-semibold">Plateforme</th>
                  <th className="text-ivory/70 px-4 py-3 text-left font-semibold">Contenu</th>
                  <th className="text-ivory/70 px-4 py-3 text-center font-semibold">Type</th>
                  <th className="text-ivory/70 px-4 py-3 text-center font-semibold">Portée</th>
                  <th className="text-ivory/70 px-4 py-3 text-center font-semibold">
                    <Heart size={14} className="inline text-pink-400" />
                  </th>
                  <th className="text-ivory/70 px-4 py-3 text-center font-semibold">
                    <MessageCircle size={14} className="inline text-blue-400" />
                  </th>
                  <th className="text-ivory/70 px-4 py-3 text-center font-semibold">
                    <Repeat2 size={14} className="inline text-green-400" />
                  </th>
                  <th className="text-ivory/70 px-4 py-3 text-center font-semibold">Taux</th>
                  <th className="text-ivory/70 px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.topPosts.slice(0, 10).map((post, index) => (
                  <motion.tr
                    key={post.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-gold/10 hover:bg-ivory/5 border-b transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0
                            ? 'bg-gold/20 text-gold'
                            : index === 1
                              ? 'bg-ivory/10 text-ivory/80'
                              : index === 2
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-ivory/5 text-ivory/50'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="inline-flex rounded-lg p-1.5"
                        style={{ backgroundColor: `${platformColors[post.platform] || '#666'}20` }}
                      >
                        <PlatformIcon platform={post.platform} size={16} className="text-white" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ivory max-w-[200px] truncate text-sm" title={post.content}>
                        {truncateText(post.content, 50)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <PostTypeIcon type={post.type} />
                        <span className="text-ivory/60 text-xs capitalize">{post.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye size={14} className="text-blue-400/60" />
                        <span className="text-ivory font-semibold">{formatNumber(post.reach)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-pink-400">
                      {formatNumber(post.likes)}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-blue-400">
                      {formatNumber(post.comments)}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-green-400">
                      {formatNumber(post.shares)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          post.engagementRate >= 5
                            ? 'bg-green-500/20 text-green-400'
                            : post.engagementRate >= 2
                              ? 'bg-gold/20 text-gold'
                              : 'bg-ivory/10 text-ivory/60'
                        }`}
                      >
                        {post.engagementRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-ivory/60 px-4 py-3 text-xs">
                      {formatDate(post.publishedAt)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Post Types & Best Posting Times */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Post Types Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Layers size={18} className="text-gold" />
            <h3 className="text-gold text-base font-semibold sm:text-lg">Performance par type</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gold/10 h-12 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !data?.postTypes || data.postTypes.length === 0 ? (
            <div className="py-8 text-center">
              <Layers size={32} className="text-ivory/20 mx-auto mb-2" />
              <p className="text-ivory/50 text-sm">Aucune donnée de type</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.postTypes.map((postType, index) => (
                <motion.div
                  key={postType.type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-ivory/5 flex items-center gap-3 rounded-lg p-3 transition-colors"
                >
                  <PostTypeIcon type={postType.type} size={20} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-ivory text-sm font-medium capitalize">
                        {postType.type}
                      </span>
                      <span className="text-ivory/50 text-xs">{postType.count} posts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-night/40 h-2 flex-1 overflow-hidden rounded-full">
                        <motion.div
                          className="from-gold to-gold/60 h-full bg-gradient-to-r"
                          initial={{ width: 0 }}
                          animate={{ width: `${postType.percentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        />
                      </div>
                      <span className="text-gold w-12 text-right text-xs font-medium">
                        {postType.avgEngagement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Best Posting Times Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gold" />
            <h3 className="text-gold text-base font-semibold sm:text-lg">
              Meilleurs moments pour poster
            </h3>
          </div>

          {isLoading ? (
            <div className="bg-gold/10 h-[200px] animate-pulse rounded-lg" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-ivory/50 p-2 font-normal"></th>
                    {hours.map(hour => (
                      <th key={hour} className="text-ivory/50 p-2 font-normal">
                        {hour}h
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day, dayIndex) => (
                    <tr key={day}>
                      <td className="text-ivory/70 p-2 font-medium">{day}</td>
                      {hours.map(hour => {
                        const value = getHeatmapValue(day, hour);
                        const intensity = value / maxHeatmapValue;
                        return (
                          <td key={`${day}-${hour}`} className="p-1">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: dayIndex * 0.05 + hour * 0.01 }}
                              className="hover:ring-gold/50 flex h-8 w-10 cursor-pointer items-center justify-center rounded-md transition-all hover:ring-2"
                              style={{
                                backgroundColor:
                                  value > 0
                                    ? `rgba(212, 175, 55, ${Math.max(0.1, intensity)})`
                                    : 'rgba(255, 255, 255, 0.05)',
                              }}
                              title={`${day} ${hour}h: ${value.toFixed(0)} engagements`}
                            >
                              {intensity > 0.7 && <Sparkles size={12} className="text-gold" />}
                            </motion.div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-ivory/50 mt-3 flex items-center justify-end gap-3 text-xs">
                <span>Faible</span>
                <div className="flex gap-1">
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map(opacity => (
                    <div
                      key={opacity}
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: `rgba(212, 175, 55, ${opacity})` }}
                    />
                  ))}
                </div>
                <span>Élevé</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Engagement Breakdown by Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Heart size={18} className="text-gold" />
          <h3 className="text-gold text-base font-semibold sm:text-lg">
            Répartition des interactions
          </h3>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gold/10 h-24 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "J'aime",
                value: data?.totalLikes ?? 0,
                icon: Heart,
                color: 'text-pink-400',
                bgColor: 'bg-pink-500/10',
                borderColor: 'border-pink-500/20',
              },
              {
                label: 'Commentaires',
                value: data?.totalComments ?? 0,
                icon: MessageCircle,
                color: 'text-blue-400',
                bgColor: 'bg-blue-500/10',
                borderColor: 'border-blue-500/20',
              },
              {
                label: 'Partages',
                value: data?.totalShares ?? 0,
                icon: Repeat2,
                color: 'text-green-400',
                bgColor: 'bg-green-500/10',
                borderColor: 'border-green-500/20',
              },
              {
                label: 'Enregistrements',
                value: data?.totalSaves ?? 0,
                icon: Calendar,
                color: 'text-purple-400',
                bgColor: 'bg-purple-500/10',
                borderColor: 'border-purple-500/20',
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + index * 0.05 }}
                className={`rounded-xl border ${stat.borderColor} ${stat.bgColor} p-4 text-center`}
              >
                <stat.icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
                <p className="text-ivory text-2xl font-bold">{formatNumber(stat.value)}</p>
                <p className="text-ivory/50 mt-1 text-xs">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
