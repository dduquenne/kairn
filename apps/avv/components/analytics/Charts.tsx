/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  title: string;
  data: DataPoint[];
  maxValue?: number;
}

export function BarChart({ title, data, maxValue }: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      <h3 className="mb-6 text-lg font-semibold text-gold">{title}</h3>
      <div className="space-y-4">
        {data.map((point, index) => (
          <div
            key={point.label}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="transition-colors"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-ivory/70">{point.label}</span>
              <div className="flex items-center gap-2">
                {hoveredIndex === index && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="font-semibold text-gold"
                  >
                    {point.value}
                  </motion.span>
                )}
                <span className={`font-semibold ${hoveredIndex === index ? "text-gold" : "text-ivory"}`}>
                  {hoveredIndex !== index && point.value}
                </span>
              </div>
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`mt-2 h-2 origin-left rounded-full transition-all ${
                hoveredIndex === index
                  ? "bg-gold shadow-lg shadow-gold/50"
                  : "bg-gradient-to-r from-gold via-gold/60 to-gold/30"
              }`}
              style={{ width: `${(point.value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface LineChartProps {
  title: string;
  data: DataPoint[];
}

export function LineChart({ title, data }: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((d) => (d.value / max) * 100);

  // Create SVG path for the line
  const pathData = points
    .map((point, index) => {
      const x = (index / (points.length - 1 || 1)) * 100;
      const y = 100 - point;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      <h3 className="mb-6 text-lg font-semibold text-gold">{title}</h3>
      <div className="space-y-4">
        <div className="relative">
          <svg viewBox="0 0 100 100" className="h-40 w-full" preserveAspectRatio="none">
            {/* Grid background */}
            <defs>
              <pattern
                id="grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(199,169,98,0.1)" strokeWidth="0.5" />
              </pattern>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(199,169,98,0.5)" />
                <stop offset="100%" stopColor="rgba(199,169,98,0)" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Line */}
            <polyline
              points={pathData}
              fill="none"
              stroke="rgba(199,169,98,1)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />

            {/* Fill area under the line */}
            <polygon
              points={`0,100 ${pathData} 100,100`}
              fill="url(#areaGradient)"
              opacity="0.3"
            />

            {/* Data points */}
            {points.map((point, index) => {
              const x = (index / (points.length - 1 || 1)) * 100;
              const y = 100 - point;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={hoveredIndex === index ? "2.5" : "1.5"}
                  fill={hoveredIndex === index ? "rgba(199,169,98,1)" : "rgba(199,169,98,1)"}
                  stroke={hoveredIndex === index ? "rgba(245,241,230,1)" : "none"}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}

            {/* Tooltip vertical line */}
            {hoveredIndex !== null && (
              <line
                x1={(hoveredIndex / (points.length - 1 || 1)) * 100}
                y1="0"
                x2={(hoveredIndex / (points.length - 1 || 1)) * 100}
                y2="100"
                stroke="rgba(199,169,98,0.4)"
                strokeWidth="1"
                strokeDasharray="2,2"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Tooltip */}
          {hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 left-1/2 -translate-x-1/2 bg-night border border-gold/50 rounded px-3 py-2 whitespace-nowrap"
            >
              <p className="text-xs text-gold font-semibold">{data[hoveredIndex].label}</p>
              <p className="text-sm text-ivory font-bold">{data[hoveredIndex].value}</p>
            </motion.div>
          )}
        </div>

        {/* Data labels */}
        <div className="flex justify-between text-xs text-ivory/70">
          {data.map((point, index) => (
            <span
              key={point.label}
              className={`text-center flex-1 cursor-pointer transition-colors ${
                hoveredIndex === index ? "text-gold font-semibold" : ""
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
