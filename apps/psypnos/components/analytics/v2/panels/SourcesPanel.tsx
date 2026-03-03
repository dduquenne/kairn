'use client';

import { motion } from 'framer-motion';
import {
  Globe,
  Search,
  Share2,
  Mail,
  Link,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { getFrenchDepartment } from '../../../../lib/frenchDepartments';

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
  regionCode?: string;
  city?: string;
  visitors: number;
  percentage: number;
}

interface SourcesPanelProps {
  sources: TrafficSource[];
  geoCountries: GeoLocation[];
  geoCities: GeoLocation[];
  directTraffic: number;
  organicTraffic: number;
  referralTraffic: number;
  socialTraffic: number;
  isLoading?: boolean;
}

const COLORS = ['#D4AF37', '#3B82F6', '#22C55E', '#A855F7', '#F59E0B', '#EF4444'];

const getMediumIcon = (medium: string) => {
  switch (medium?.toLowerCase()) {
    case 'organic':
      return <Search size={16} className="text-green-400" />;
    case 'social':
      return <Share2 size={16} className="text-blue-400" />;
    case 'email':
      return <Mail size={16} className="text-purple-400" />;
    case 'referral':
      return <Link size={16} className="text-orange-400" />;
    default:
      return <Globe size={16} className="text-ivory/50" />;
  }
};

export function SourcesPanel({
  sources,
  geoCountries,
  geoCities,
  directTraffic,
  organicTraffic,
  referralTraffic,
  socialTraffic,
  isLoading = false,
}: SourcesPanelProps) {
  const [geoView, setGeoView] = useState<'countries' | 'cities'>('countries');

  // Select the appropriate geo data based on the current view
  const geoData = geoView === 'cities' ? geoCities : geoCountries;

  // Prepare pie chart data
  const pieData = [
    { name: 'Direct', value: directTraffic, color: '#D4AF37' },
    { name: 'Organique', value: organicTraffic, color: '#22C55E' },
    { name: 'Referral', value: referralTraffic, color: '#3B82F6' },
    { name: 'Social', value: socialTraffic, color: '#A855F7' },
  ].filter(d => d.value > 0);

  const totalTraffic = pieData.reduce((sum, d) => sum + d.value, 0);

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalTraffic > 0 ? (data.value / totalTraffic) * 100 : 0;
      return (
        <div className="border-gold/20 bg-night/95 rounded-lg border px-4 py-3 shadow-xl backdrop-blur-sm">
          <p className="text-ivory text-sm font-medium">{data.name}</p>
          <p className="text-gold text-lg font-bold">
            {data.value.toLocaleString('fr-FR')} visites
          </p>
          <p className="text-ivory/60 text-xs">{percentage.toFixed(1)}% du total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 overflow-x-hidden sm:space-y-6">
      {/* Traffic Distribution */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
        >
          <h3 className="text-gold mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
            Répartition du trafic
          </h3>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center sm:h-64">
              <div className="border-gold/20 border-t-gold h-8 w-8 animate-spin rounded-full border-2" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              <div className="h-32 w-32 flex-shrink-0 sm:h-48 sm:w-48">
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
              <div className="w-full flex-1 space-y-2 sm:space-y-3">
                {pieData.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 sm:gap-3"
                  >
                    <div
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full sm:h-3 sm:w-3"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-ivory flex-1 truncate text-xs sm:text-sm">
                      {item.name}
                    </span>
                    <span className="text-ivory/80 text-xs font-medium sm:text-sm">
                      {item.value.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-ivory/50 w-10 text-right text-[10px] sm:w-12 sm:text-xs">
                      {totalTraffic > 0
                        ? `${((item.value / totalTraffic) * 100).toFixed(0)}%`
                        : '0%'}
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
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
        >
          <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
            <h3 className="text-gold flex items-center gap-2 text-base font-semibold sm:text-lg">
              <MapPin size={16} className="sm:h-[18px] sm:w-[18px]" />
              <span className="truncate">Géolocalisation</span>
            </h3>
            <div className="border-gold/20 flex flex-shrink-0 items-center gap-0.5 rounded-lg border p-0.5 sm:gap-1 sm:p-1">
              <button
                onClick={() => setGeoView('countries')}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors sm:px-3 sm:text-xs ${
                  geoView === 'countries' ? 'bg-gold text-night' : 'text-ivory/60 hover:text-ivory'
                }`}
              >
                Pays
              </button>
              <button
                onClick={() => setGeoView('cities')}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors sm:px-3 sm:text-xs ${
                  geoView === 'cities' ? 'bg-gold text-night' : 'text-ivory/60 hover:text-ivory'
                }`}
              >
                Villes
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2 sm:space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gold/10 h-8 animate-pulse rounded-lg sm:h-10" />
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
                  className="hover:bg-ivory/5 flex items-center gap-2 rounded-lg p-1.5 transition-colors sm:gap-3 sm:p-2"
                >
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold sm:h-6 sm:w-6 sm:text-xs ${
                      index === 0 ? 'bg-gold/20 text-gold' : 'bg-ivory/10 text-ivory/60'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-ivory min-w-0 flex-1 truncate text-xs sm:text-sm">
                    {geoView === 'cities' && location.city
                      ? location.countryCode === 'FR'
                        ? (() => {
                            const dept = getFrenchDepartment(
                              location.city ?? '',
                              location.regionCode
                            );
                            return dept ? `${location.city} (${dept})` : location.city;
                          })()
                        : `${location.city} (${location.countryCode || location.country})`
                      : location.country}
                  </span>
                  <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
                    <div className="bg-night/40 h-1 w-12 overflow-hidden rounded-full sm:h-1.5 sm:w-20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${location.percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="bg-gold h-full"
                      />
                    </div>
                    <span className="text-ivory/50 w-7 text-right text-[10px] sm:w-8 sm:text-xs">
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
        className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
      >
        <h3 className="text-gold mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
          Toutes les sources
        </h3>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gold/10 h-10 animate-pulse rounded-lg sm:h-12" />
            ))}
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-gold/10 border-b">
                  <th className="text-ivory/50 px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider sm:px-4 sm:py-3 sm:text-xs">
                    Source
                  </th>
                  <th className="text-ivory/50 hidden px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider sm:table-cell sm:px-4 sm:py-3 sm:text-xs">
                    Medium
                  </th>
                  <th className="text-ivory/50 px-2 py-2 text-right text-[10px] font-medium uppercase tracking-wider sm:px-4 sm:py-3 sm:text-xs">
                    Visiteurs
                  </th>
                  <th className="text-ivory/50 px-2 py-2 text-right text-[10px] font-medium uppercase tracking-wider sm:px-4 sm:py-3 sm:text-xs">
                    Conv.
                  </th>
                  <th className="text-ivory/50 hidden px-2 py-2 text-right text-[10px] font-medium uppercase tracking-wider sm:table-cell sm:px-4 sm:py-3 sm:text-xs">
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
                    className="border-gold/5 hover:bg-ivory/5 border-b transition-colors"
                  >
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {getMediumIcon(source.medium)}
                        <span className="text-ivory max-w-[80px] truncate text-xs font-medium sm:max-w-[150px] sm:text-sm">
                          {source.source}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-2 py-2 sm:table-cell sm:px-4 sm:py-3">
                      <span className="bg-ivory/10 text-ivory/60 rounded-full px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs">
                        {source.medium}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right sm:px-4 sm:py-3">
                      <span className="text-ivory text-xs sm:text-sm">
                        {source.uniqueSessions.toLocaleString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right sm:px-4 sm:py-3">
                      <span
                        className={`text-xs font-medium sm:text-sm ${
                          source.conversionRate >= 5
                            ? 'text-green-400'
                            : source.conversionRate >= 2
                              ? 'text-gold'
                              : 'text-ivory/60'
                        }`}
                      >
                        {source.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="hidden px-2 py-2 text-right sm:table-cell sm:px-4 sm:py-3">
                      {source.change !== undefined ? (
                        <span
                          className={`flex items-center justify-end gap-1 text-[10px] font-medium sm:text-xs ${
                            source.change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {source.change >= 0 ? (
                            <ArrowUpRight size={10} className="sm:h-3 sm:w-3" />
                          ) : (
                            <ArrowDownRight size={10} className="sm:h-3 sm:w-3" />
                          )}
                          {Math.abs(source.change).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-ivory/30 text-[10px] sm:text-xs">-</span>
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
