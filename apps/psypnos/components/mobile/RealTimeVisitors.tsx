// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface RealTimeVisitorsProps {
  count: number;
  isConnected: boolean;
  todayVisits?: number;
  todayTrend?: number;
}

export function RealTimeVisitors({
  count,
  isConnected,
  todayVisits,
  todayTrend,
}: RealTimeVisitorsProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate count changes
  useEffect(() => {
    if (count !== displayCount) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setDisplayCount(count);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [count, displayCount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-gold/10 to-green-500/10 border border-gold/30 rounded-2xl p-4 relative overflow-hidden"
    >
      {/* Animated background pulse when connected */}
      {isConnected && (
        <motion.div
          className="absolute inset-0 bg-green-500/5"
          animate={{
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <div className="relative flex items-center justify-between">
        {/* Left: Real-time visitors */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-green-500/20">
              <Zap className="h-5 w-5 text-green-400" />
            </div>
            {/* Pulse indicator */}
            {isConnected && (
              <motion.div
                className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>

          <div>
            <p className="text-xs text-ivory/50 uppercase tracking-wide font-medium">En ligne</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={displayCount}
                initial={{ opacity: 0, y: isAnimating ? 10 : 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-bold text-green-400"
              >
                {displayCount}
                <span className="text-sm font-normal text-ivory/50 ml-1">
                  visiteur{displayCount !== 1 ? "s" : ""}
                </span>
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Separator */}
        <div className="h-12 w-px bg-gold/20" />

        {/* Right: Today's stats */}
        {todayVisits !== undefined && (
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold/20">
              <Activity className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-xs text-ivory/50 uppercase tracking-wide font-medium">
                Aujourd'hui
              </p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-bold text-ivory">
                  {todayVisits.toLocaleString("fr-FR")}
                </p>
                {todayTrend !== undefined && (
                  <span
                    className={`text-xs font-bold ${todayTrend >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {todayTrend >= 0 ? "↑" : "↓"}
                    {Math.abs(todayTrend)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connection status */}
      <div className="mt-3 flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}
        />
        <span className={`text-xs ${isConnected ? "text-green-400/70" : "text-red-400/70"}`}>
          {isConnected ? "Temps réel actif" : "Connexion perdue"}
        </span>
      </div>
    </motion.div>
  );
}
