/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, WifiOff } from "lucide-react";

interface RealTimeIndicatorProps {
  isConnected: boolean;
  updateCount: number;
}

export function RealTimeIndicator({ isConnected, updateCount }: RealTimeIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {isConnected ? (
        <motion.div
          key="connected"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1.5"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Activity className="h-4 w-4 text-green-400" />
          </motion.div>
          <span className="text-xs font-medium text-green-400">
            Temps réel {updateCount > 0 && `(${updateCount})`}
          </span>
        </motion.div>
      ) : (
        <motion.div
          key="disconnected"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1.5"
        >
          <WifiOff className="h-4 w-4 text-red-400" />
          <span className="text-xs font-medium text-red-400">Hors ligne</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
