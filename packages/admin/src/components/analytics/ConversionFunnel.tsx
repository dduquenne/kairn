"use client";

import { motion } from "framer-motion";
import { cn } from "@kairn/ui";

export interface ConversionData {
  clicks: number;
  completed: number;
  rate: number;
}

export interface ConversionFunnelProps {
  /** Conversion data keyed by conversion type */
  data: Record<string, ConversionData>;
  /** Labels for conversion types (optional, will use keys as fallback) */
  typeLabels?: Record<string, string>;
  /** Title of the funnel */
  title?: string;
  /** Custom class names */
  className?: string;
  /** Accent color */
  accentColor?: string;
  /** Label for clicks */
  clicksLabel?: string;
  /** Label for conversions */
  conversionsLabel?: string;
  /** Label for total clicks */
  totalClicksLabel?: string;
  /** Label for total conversions */
  totalConversionsLabel?: string;
  /** Label for average rate */
  averageRateLabel?: string;
}

/**
 * ConversionFunnel - Visualize conversion rates for different goals
 *
 * @example
 * ```tsx
 * const data = {
 *   appointment_request: { clicks: 150, completed: 12, rate: 8 },
 *   contact_form: { clicks: 200, completed: 25, rate: 12.5 },
 * };
 *
 * const labels = {
 *   appointment_request: "Appointment Requests",
 *   contact_form: "Contact Forms",
 * };
 *
 * <ConversionFunnel data={data} typeLabels={labels} />
 * ```
 */
export function ConversionFunnel({
  data,
  typeLabels = {},
  title = "Entonnoir de conversion",
  className,
  accentColor = "gold",
  clicksLabel = "clics",
  conversionsLabel = "conversions",
  totalClicksLabel = "Total clics",
  totalConversionsLabel = "Conversions totales",
  averageRateLabel = "Taux moyen",
}: ConversionFunnelProps) {
  const entries = Object.entries(data).sort((a, b) => b[1].clicks - a[1].clicks);

  const totals = entries.reduce(
    (acc, [, item]) => ({
      clicks: acc.clicks + item.clicks,
      completed: acc.completed + item.completed,
    }),
    { clicks: 0, completed: 0 }
  );

  const averageRate =
    entries.length > 0
      ? entries.reduce((sum, [, item]) => sum + item.rate, 0) / entries.length
      : 0;

  return (
    <div
      className={cn(
        "rounded-lg border bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm",
        `border-${accentColor}/20`,
        className
      )}
    >
      <h3 className={cn("mb-6 text-lg font-semibold", `text-${accentColor}`)}>{title}</h3>
      <div className="space-y-4">
        {entries.map(([type, item], index) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-ivory">
                {typeLabels[type] || type}
              </span>
              <div className="flex gap-4 text-xs text-ivory/70">
                <span className={`text-${accentColor}`}>
                  {item.clicks} {clicksLabel}
                </span>
                <span className="font-semibold text-green-400">
                  {item.completed} {conversionsLabel}
                </span>
                <span className={cn("font-semibold", `text-${accentColor}`)}>
                  {(item.rate ?? 0).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className={cn("relative h-8 overflow-hidden rounded-lg border bg-night/40", `border-${accentColor}/10`)}>
              {/* Background bar (clicks) */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={cn("absolute inset-y-0 left-0 origin-left bg-gradient-to-r", `from-${accentColor}/40 to-${accentColor}/20`)}
                style={{ width: "100%" }}
              />

              {/* Conversion bar (rate) */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 + 0.1 }}
                className="absolute inset-y-0 left-0 origin-left bg-gradient-to-r from-green-500 to-green-400"
                style={{ width: `${item.rate}%` }}
              />

              {/* Label */}
              <div className="absolute inset-0 flex items-center px-3">
                <span className="text-xs font-bold text-ivory/80">
                  {(item.rate ?? 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={cn("mt-6 grid grid-cols-3 gap-4 border-t pt-6", `border-${accentColor}/10`)}>
        <div>
          <p className="text-xs text-ivory/70">{totalClicksLabel}</p>
          <p className={cn("mt-1 text-2xl font-bold", `text-${accentColor}`)}>
            {totals.clicks}
          </p>
        </div>
        <div>
          <p className="text-xs text-ivory/70">{totalConversionsLabel}</p>
          <p className="mt-1 text-2xl font-bold text-green-400">{totals.completed}</p>
        </div>
        <div>
          <p className="text-xs text-ivory/70">{averageRateLabel}</p>
          <p className={cn("mt-1 text-2xl font-bold", `text-${accentColor}`)}>
            {averageRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
