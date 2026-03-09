'use client';

import { motion } from 'framer-motion';
import { Bot, Search, FileSearch, Clock, Globe, Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BotVisit {
  date: string;
  visits: number;
}

interface BotType {
  name: string;
  type: 'search_engine' | 'social' | 'seo_tool' | 'monitor' | 'other';
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

const getBotIcon = (type: BotType['type']) => {
  switch (type) {
    case 'search_engine':
      return <Search size={16} className="text-green-400" />;
    case 'social':
      return <Globe size={16} className="text-blue-400" />;
    case 'seo_tool':
      return <FileSearch size={16} className="text-purple-400" />;
    case 'monitor':
      return <Activity size={16} className="text-yellow-400" />;
    default:
      return <Bot size={16} className="text-ivory/50" />;
  }
};

const getBotTypeLabel = (type: BotType['type']) => {
  switch (type) {
    case 'search_engine':
      return 'Moteur de recherche';
    case 'social':
      return 'Réseau social';
    case 'seo_tool':
      return 'Outil SEO';
    case 'monitor':
      return 'Monitoring';
    default:
      return 'Autre';
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
        <div className="bg-night/95 rounded-lg border border-green-500/20 px-4 py-3 shadow-xl backdrop-blur-sm">
          <p className="text-ivory/60 mb-1 text-xs">{label}</p>
          <p className="text-lg font-bold text-green-400">{payload[0]?.value || 0} visites bots</p>
        </div>
      );
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 overflow-x-hidden sm:space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="from-night/60 to-night/40 rounded-xl border border-green-500/20 bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0 rounded-lg bg-green-500/10 p-1.5 sm:p-2">
              <Bot size={16} className="text-green-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 truncate text-[10px] sm:text-xs">Visites bots</p>
              <p className="text-ivory text-base font-bold sm:text-xl">
                {isLoading ? '...' : totalBotVisits.toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="from-night/60 to-night/40 rounded-xl border border-blue-500/20 bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0 rounded-lg bg-blue-500/10 p-1.5 sm:p-2">
              <Search size={16} className="text-blue-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 truncate text-[10px] sm:text-xs">Bots uniques</p>
              <p className="text-ivory text-base font-bold sm:text-xl">
                {isLoading ? '...' : uniqueBots}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="from-night/60 to-night/40 rounded-xl border border-purple-500/20 bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0 rounded-lg bg-purple-500/10 p-1.5 sm:p-2">
              <FileSearch size={16} className="text-purple-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 truncate text-[10px] sm:text-xs">Pages crawlées</p>
              <p className="text-ivory text-base font-bold sm:text-xl">
                {isLoading ? '...' : crawledPages}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gold/10 flex-shrink-0 rounded-lg p-1.5 sm:p-2">
              <Clock size={16} className="text-gold sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 truncate text-[10px] sm:text-xs">Crawl/jour</p>
              <p className="text-ivory text-base font-bold sm:text-xl">
                {isLoading ? '...' : avgCrawlRate.toFixed(0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Bot Visits Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="from-night/60 to-night/40 rounded-xl border border-green-500/20 bg-gradient-to-br p-4 sm:p-6"
        >
          <h3 className="mb-3 text-base font-semibold text-green-400 sm:mb-4 sm:text-lg">
            Activité des bots
          </h3>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center sm:h-48">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500/20 border-t-green-400" />
            </div>
          ) : (
            <div className="h-40 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={botVisitsTimeline}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="seoColorBots" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 197, 94, 0.1)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(245, 245, 240, 0.3)"
                    tick={{ fill: 'rgba(245, 245, 240, 0.5)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(245, 245, 240, 0.3)"
                    tick={{ fill: 'rgba(245, 245, 240, 0.5)', fontSize: 11 }}
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
                    fill="url(#seoColorBots)"
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
          className="from-night/60 to-night/40 rounded-xl border border-green-500/20 bg-gradient-to-br p-4 sm:p-6"
        >
          <h3 className="mb-3 text-base font-semibold text-green-400 sm:mb-4 sm:text-lg">
            Bots identifiés
          </h3>

          {isLoading ? (
            <div className="space-y-2 sm:space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-green-500/10 sm:h-14" />
              ))}
            </div>
          ) : botTypes.length === 0 ? (
            <div className="py-6 text-center sm:py-8">
              <Bot size={32} className="text-ivory/20 mx-auto mb-2 sm:mb-3 sm:h-10 sm:w-10" />
              <p className="text-ivory/50 text-xs sm:text-sm">Aucun bot détecté</p>
            </div>
          ) : (
            <div className="max-h-40 space-y-1.5 overflow-y-auto sm:max-h-48 sm:space-y-2">
              {botTypes.map((bot, index) => (
                <motion.div
                  key={bot.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-night/50 flex items-center gap-2 rounded-lg border border-green-500/10 p-2 transition-colors hover:border-green-500/30 sm:gap-3 sm:p-3"
                >
                  <div className="flex-shrink-0 rounded-lg bg-green-500/10 p-1 sm:p-1.5">
                    {getBotIcon(bot.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-ivory truncate text-xs font-medium sm:text-sm">{bot.name}</p>
                    <p className="text-ivory/40 truncate text-[10px] sm:text-xs">
                      {getBotTypeLabel(bot.type)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-semibold text-green-400 sm:text-sm">{bot.visits}</p>
                    <p className="text-ivory/40 text-[10px] sm:text-xs">{bot.pages} pages</p>
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
        className="from-night/60 to-night/40 rounded-xl border border-green-500/20 bg-gradient-to-br p-4 sm:p-6"
      >
        <h3 className="mb-3 text-base font-semibold text-green-400 sm:mb-4 sm:text-lg">
          Pages les plus crawlées
        </h3>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-green-500/10 sm:h-12" />
            ))}
          </div>
        ) : topCrawledPages.length === 0 ? (
          <div className="py-6 text-center sm:py-8">
            <FileSearch size={32} className="text-ivory/20 mx-auto mb-2 sm:mb-3 sm:h-10 sm:w-10" />
            <p className="text-ivory/50 text-xs sm:text-sm">Aucune donnée de crawl</p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-green-500/10">
                  <th className="text-ivory/50 px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider sm:px-4 sm:py-3 sm:text-xs">
                    Page
                  </th>
                  <th className="text-ivory/50 px-2 py-2 text-right text-[10px] font-medium uppercase tracking-wider sm:px-4 sm:py-3 sm:text-xs">
                    Crawls
                  </th>
                  <th className="text-ivory/50 hidden px-2 py-2 text-right text-[10px] font-medium uppercase tracking-wider sm:table-cell sm:px-4 sm:py-3 sm:text-xs">
                    Dernier
                  </th>
                  <th className="text-ivory/50 hidden px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider sm:px-4 sm:py-3 sm:text-xs md:table-cell">
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
                    className="hover:bg-ivory/5 border-b border-green-500/5 transition-colors"
                  >
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <span className="text-ivory block max-w-[120px] truncate text-xs font-medium sm:max-w-[200px] sm:text-sm">
                        {page.path}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right sm:px-4 sm:py-3">
                      <span className="text-xs font-semibold text-green-400 sm:text-sm">
                        {page.crawlCount}
                      </span>
                    </td>
                    <td className="hidden px-2 py-2 text-right sm:table-cell sm:px-4 sm:py-3">
                      <span className="text-ivory/50 text-[10px] sm:text-xs">
                        {formatDate(page.lastCrawled)}
                      </span>
                    </td>
                    <td className="hidden px-2 py-2 sm:px-4 sm:py-3 md:table-cell">
                      <div className="flex flex-wrap items-center gap-1">
                        {page.botTypes.slice(0, 2).map(botType => (
                          <span
                            key={botType}
                            className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400 sm:px-2 sm:text-xs"
                          >
                            {botType}
                          </span>
                        ))}
                        {page.botTypes.length > 2 && (
                          <span className="text-ivory/40 text-[10px] sm:text-xs">
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
