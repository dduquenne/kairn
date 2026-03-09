/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { ReactNode } from "react";

import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh(onRefresh);

  return (
    <div id="pull-to-refresh-container" className="relative">
      {/* Pull Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{
          opacity: pullDistance > 0 ? 1 : 0,
          y: pullDistance > 0 ? Math.min(pullDistance - 50, 70) : -50
        }}
        className="absolute top-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
      >
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : isPulling ? 180 : 0 }}
          transition={{
            duration: isRefreshing ? 1 : 0.3,
            repeat: isRefreshing ? Infinity : 0,
            ease: isRefreshing ? "linear" : "easeOut"
          }}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gold/20 border border-gold/30"
        >
          <RefreshCw className="h-5 w-5 text-gold" />
        </motion.div>
      </motion.div>

      {children}
    </div>
  );
}
