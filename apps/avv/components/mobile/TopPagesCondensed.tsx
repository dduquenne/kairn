/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChevronDown, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

interface TopPage {
  page: string;
  title: string;
  count: number;
  percentage: number;
}

interface TopPagesCondensedProps {
  className?: string;
  timeRange?: string;
}

export function TopPagesCondensed({ className = "", timeRange = "7d" }: TopPagesCondensedProps) {
  const [data, setData] = useState<{
    topPages: TopPage[];
    totalVisits: number;
    uniquePages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/top-pages?range=${timeRange}&limit=10`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching top pages:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gold/5 border border-gold/20 rounded-2xl p-4 animate-pulse ${className}`}>
        <div className="h-6 bg-gold/10 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gold/10 rounded w-2/3" />
      </div>
    );
  }

  if (!data || data.topPages.length === 0) {
    return (
      <div className={`bg-gold/5 border border-gold/20 rounded-2xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-ivory/50">
          <FileText className="h-5 w-5" />
          <span className="text-sm">Aucune donnée de pages</span>
        </div>
      </div>
    );
  }

  // Get top page
  const topPage = data.topPages[0];

  // Summary text
  const summaryText = `${topPage.title} (${topPage.percentage.toFixed(0)}%)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gold/5 border border-gold/20 rounded-2xl overflow-hidden ${className}`}
    >
      {/* Condensed header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between active:bg-gold/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gold/10">
            <TrendingUp className="h-5 w-5 text-gold" />
          </div>
          <div className="text-left">
            <p className="text-xs text-ivory/50 uppercase tracking-wide font-medium">
              Pages populaires
            </p>
            <p className="text-sm font-semibold text-ivory truncate max-w-[200px]">
              {summaryText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mini stats */}
          <div className="text-right mr-2">
            <span className="text-xs text-ivory/40">{data.uniquePages} pages</span>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-ivory/40" />
          </motion.div>
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Top pages list */}
              <div className="space-y-2">
                <p className="text-xs text-ivory/40 uppercase tracking-wide font-medium">
                  Top Pages
                </p>
                {data.topPages.slice(0, 5).map((page, index) => (
                  <div
                    key={page.page}
                    className="flex items-center justify-between bg-gold/5 rounded-lg p-2.5"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-medium text-gold/60 w-4">
                        {index + 1}
                      </span>
                      <span className="text-sm text-ivory font-medium truncate">
                        {page.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-16 h-1.5 bg-gold/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${page.percentage}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="h-full bg-gold rounded-full"
                        />
                      </div>
                      <span className="text-sm text-ivory/60 w-10 text-right">
                        {page.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total stats */}
              <div className="flex items-center justify-between pt-2 border-t border-gold/10">
                <span className="text-xs text-ivory/40">Total visites</span>
                <span className="text-sm font-semibold text-ivory">{data.totalVisits}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
