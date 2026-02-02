'use client';

import { motion } from 'framer-motion';
import { Eye, Users, MousePointer, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from 'recharts';

interface ChartDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

interface TopPage {
  path: string;
  views: number;
  uniqueVisitors: number;
  percentage: number;
  change?: number;
}

interface TrafficPanelProps {
  chartData: ChartDataPoint[];
  topPages: TopPage[];
  totalViews: number;
  totalVisitors: number;
  newVisitors: number;
  isLoading?: boolean;
}

type ChartType = 'line' | 'area' | 'bar';

export function TrafficPanel({
  chartData,
  topPages,
  totalViews,
  totalVisitors,
  newVisitors,
  isLoading = false,
}: TrafficPanelProps) {
  const [chartType, setChartType] = useState<ChartType>('area');

  const chartTypes: { value: ChartType; label: string }[] = [
    { value: 'line', label: 'Ligne' },
    { value: 'area', label: 'Aire' },
    { value: 'bar', label: 'Barres' },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const current = payload[0]?.value || 0;
      const previous = payload[0]?.payload?.previousValue;
      const change = previous ? ((current - previous) / previous) * 100 : null;

      return (
        <div className="border-gold/20 bg-night/95 rounded-lg border px-4 py-3 shadow-xl backdrop-blur-sm">
          <p className="text-ivory/60 mb-1 text-xs">{label}</p>
          <p className="text-ivory text-xl font-bold">{current.toLocaleString('fr-FR')}</p>
          {change !== null && (
            <p
              className={`mt-1 text-xs font-medium ${
                change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% vs période précédente
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
            <XAxis
              dataKey="label"
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: 'rgba(245, 245, 240, 0.5)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: 'rgba(245, 245, 240, 0.5)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#D4AF37"
              strokeWidth={2}
              dot={{ fill: '#D4AF37', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#D4AF37', stroke: '#fff', strokeWidth: 2 }}
            />
            <Brush
              dataKey="label"
              height={30}
              stroke="#D4AF37"
              fill="rgba(26, 26, 46, 0.8)"
              tickFormatter={() => ''}
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="trafficColorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
            <XAxis
              dataKey="label"
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: 'rgba(245, 245, 240, 0.5)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: 'rgba(245, 245, 240, 0.5)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#D4AF37"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#trafficColorValue)"
            />
            <Brush
              dataKey="label"
              height={30}
              stroke="#D4AF37"
              fill="rgba(26, 26, 46, 0.8)"
              tickFormatter={() => ''}
            />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
            <XAxis
              dataKey="label"
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: 'rgba(245, 245, 240, 0.5)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(245, 245, 240, 0.3)"
              tick={{ fill: 'rgba(245, 245, 240, 0.5)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Brush
              dataKey="label"
              height={30}
              stroke="#D4AF37"
              fill="rgba(26, 26, 46, 0.8)"
              tickFormatter={() => ''}
            />
          </BarChart>
        );
    }
  };

  return (
    <div className="space-y-4 overflow-x-hidden sm:space-y-6">
      {/* Mini Stats Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gold/10 flex-shrink-0 rounded-lg p-2">
              <Eye size={18} className="text-gold sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Pages vues</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : totalViews.toLocaleString('fr-FR')}
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
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-lg bg-blue-500/10 p-2">
              <Users size={18} className="text-blue-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Visiteurs uniques</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : totalVisitors.toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="from-night/60 to-night/40 rounded-xl border border-green-500/20 bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-lg bg-green-500/10 p-2">
              <MousePointer size={18} className="text-green-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Nouveaux visiteurs</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : newVisitors.toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
      >
        <div className="mb-4 flex flex-col justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
          <h3 className="text-gold text-base font-semibold sm:text-lg">Visiteurs</h3>
          <div className="border-gold/20 flex items-center gap-1 rounded-lg border p-1">
            {chartTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setChartType(type.value)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 ${
                  chartType === type.value ? 'bg-gold text-night' : 'text-ivory/60 hover:text-ivory'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-60 sm:h-80">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="border-gold/20 border-t-gold h-8 w-8 animate-spin rounded-full border-2" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Top Pages Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
      >
        <h3 className="text-gold mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
          Pages populaires
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gold/10 h-12 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {topPages.map((page, index) => (
              <motion.div
                key={page.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-ivory/5 group flex items-center gap-2 rounded-lg p-2 transition-colors sm:gap-4 sm:p-3"
              >
                {/* Rank */}
                <div
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm ${
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
                </div>

                {/* Page Path */}
                <div className="min-w-0 flex-1">
                  <p className="text-ivory group-hover:text-gold truncate text-xs font-medium transition-colors sm:text-sm">
                    {page.path}
                  </p>
                  <p className="text-ivory/50 hidden text-xs sm:block">
                    {page.uniqueVisitors.toLocaleString('fr-FR')} visiteurs uniques
                  </p>
                </div>

                {/* Views */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-ivory text-xs font-semibold sm:text-sm">
                    {page.views.toLocaleString('fr-FR')}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-xs">
                    <span className="text-ivory/50 hidden sm:inline">
                      {page.percentage.toFixed(1)}%
                    </span>
                    {page.change !== undefined && (
                      <span
                        className={`flex items-center ${
                          page.change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {page.change >= 0 ? (
                          <ArrowUpRight size={12} />
                        ) : (
                          <ArrowDownRight size={12} />
                        )}
                        {Math.abs(page.change).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar - hidden on mobile */}
                <div className="bg-night/40 hidden h-1.5 w-24 flex-shrink-0 overflow-hidden rounded-full sm:block">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${page.percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="from-gold to-gold/60 h-full bg-gradient-to-r"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
