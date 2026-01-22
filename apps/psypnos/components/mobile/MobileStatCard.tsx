// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MobileStatCardProps {
  title: string;
  value: number | string;
  trend?: number;
  icon: LucideIcon;
  color?: "gold" | "green" | "red";
  onClick?: () => void;
}

export function MobileStatCard({
  title,
  value,
  trend,
  icon: Icon,
  color = "gold",
  onClick
}: MobileStatCardProps) {
  const colorClasses = {
    gold: "bg-gold/10 text-gold border-gold/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20"
  };

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`rounded-xl p-4 border ${colorClasses[color]} ${
        onClick ? 'cursor-pointer active:opacity-80' : ''
      } transition-opacity`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium opacity-80">{title}</p>
        <Icon className="h-5 w-5 opacity-60" />
      </div>

      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {trend !== undefined && (
          <span className={`text-sm mb-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
