// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";

export type TimeRange = "24h" | "7d" | "30d" | "90d";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const ranges: { label: string; value: TimeRange }[] = [
    { label: "24h", value: "24h" },
    { label: "7j", value: "7d" },
    { label: "30j", value: "30d" },
    { label: "90j", value: "90d" },
  ];

  return (
    <div className="flex gap-2 bg-night/60 p-1 rounded-lg border border-gold/20">
      {ranges.map((range) => (
        <motion.button
          key={range.value}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(range.value)}
          className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === range.value
              ? "bg-gold text-night"
              : "text-ivory/60 hover:text-ivory"
          }`}
        >
          {range.label}
        </motion.button>
      ))}
    </div>
  );
}
