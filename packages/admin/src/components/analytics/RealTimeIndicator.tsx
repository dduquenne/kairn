"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";
import { cn } from "@kairn/ui";

export interface RealTimeIndicatorProps {
  /** Number of active visitors */
  activeVisitors: number;
  /** Whether data is being fetched */
  isLoading?: boolean;
  /** Whether real-time tracking is active */
  isLive?: boolean;
  /** Custom class names */
  className?: string;
  /** Label text */
  label?: string;
  /** Singular label for 1 visitor */
  singularLabel?: string;
  /** Plural label for multiple visitors */
  pluralLabel?: string;
  /** Accent color */
  accentColor?: string;
}

/**
 * RealTimeIndicator - Shows current active visitors with live animation
 *
 * @example
 * ```tsx
 * <RealTimeIndicator
 *   activeVisitors={12}
 *   isLive
 *   label="En temps réel"
 * />
 * ```
 */
export function RealTimeIndicator({
  activeVisitors,
  isLoading = false,
  isLive = true,
  className,
  label = "En temps reel",
  singularLabel = "visiteur actif",
  pluralLabel = "visiteurs actifs",
  accentColor = "green",
}: RealTimeIndicatorProps) {
  const [prevVisitors, setPrevVisitors] = useState(activeVisitors);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (activeVisitors !== prevVisitors) {
      setDirection(activeVisitors > prevVisitors ? "up" : "down");
      setPrevVisitors(activeVisitors);

      const timer = setTimeout(() => setDirection(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [activeVisitors, prevVisitors]);

  const visitorLabel = activeVisitors === 1 ? singularLabel : pluralLabel;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
        `border-${accentColor}-500/30 bg-${accentColor}-500/10`,
        className
      )}
    >
      {/* Pulse indicator */}
      <div className="relative">
        <motion.div
          animate={isLive ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn("h-2 w-2 rounded-full", `bg-${accentColor}-500`)}
        />
        {isLive && (
          <motion.div
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn("absolute inset-0 rounded-full", `bg-${accentColor}-500`)}
          />
        )}
      </div>

      {/* Label */}
      <span className={cn("text-xs font-medium", `text-${accentColor}-400`)}>{label}</span>

      {/* Divider */}
      <div className={cn("h-4 w-px", `bg-${accentColor}-500/30`)} />

      {/* Visitor count */}
      <div className="flex items-center gap-1.5">
        <Activity size={14} className={cn(`text-${accentColor}-400`)} />
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn("h-4 w-8 animate-pulse rounded", `bg-${accentColor}-500/20`)}
            />
          ) : (
            <motion.span
              key={activeVisitors}
              initial={{ y: direction === "up" ? 10 : -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: direction === "up" ? -10 : 10, opacity: 0 }}
              className={cn("text-sm font-bold tabular-nums", `text-${accentColor}-400`)}
            >
              {activeVisitors}
            </motion.span>
          )}
        </AnimatePresence>
        <span className="text-xs text-ivory/60">{visitorLabel}</span>
      </div>
    </div>
  );
}
