"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@kairn/ui";
import { chartTheme, CHART_COLORS } from "./theme";

export interface PieDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  /** Chart title */
  title: string;
  /** Data points to display */
  data: PieDataPoint[];
  /** Chart height in pixels */
  height?: number;
  /** Custom class names */
  className?: string;
  /** Whether to show legend */
  showLegend?: boolean;
  /** Legend position */
  legendPosition?: "top" | "bottom" | "left" | "right";
  /** Custom colors array */
  colors?: string[];
  /** Whether to show labels on the chart */
  showLabels?: boolean;
  /** Value formatter for tooltip */
  valueFormatter?: (value: number) => string;
  /** Inner radius (0 for pie, > 0 for donut) */
  innerRadius?: number;
  /** Outer radius */
  outerRadius?: number;
}

const DEFAULT_COLORS = Object.values(CHART_COLORS);

/**
 * PieChart - Pie chart for showing proportions
 *
 * @example
 * ```tsx
 * const data = [
 *   { label: "Desktop", value: 65 },
 *   { label: "Mobile", value: 30 },
 *   { label: "Tablet", value: 5 },
 * ];
 *
 * <PieChart
 *   title="Device Distribution"
 *   data={data}
 *   showLegend
 * />
 * ```
 */
export function PieChart({
  title,
  data,
  height = 300,
  className,
  showLegend = true,
  legendPosition = "bottom",
  colors = DEFAULT_COLORS,
  showLabels = false,
  valueFormatter,
  innerRadius = 0,
  outerRadius = 80,
}: PieChartProps) {
  // Transform data for Recharts format
  const chartData = data.map((point, index) => ({
    name: point.label,
    value: point.value,
    color: point.color || colors[index % colors.length],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const renderLabel = ({ name, value, percent }: { name: string; value: number; percent: number }) => {
    if (!showLabels) return null;
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-gold/20 bg-gradient-to-br p-6 backdrop-blur-sm",
        chartTheme.background.card,
        className
      )}
    >
      <h3 className="mb-6 text-lg font-semibold text-gold">{title}</h3>

      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            nameKey="name"
            label={showLabels ? renderLabel : undefined}
            labelLine={showLabels}
            animationDuration={chartTheme.animation.duration}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="rgba(13,10,8,0.8)"
                strokeWidth={2}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            itemStyle={chartTheme.tooltip.itemStyle}
            formatter={(value: number, name: string) => {
              const displayValue = valueFormatter ? valueFormatter(value) : value;
              const percentage = ((value / total) * 100).toFixed(1);
              return [`${displayValue} (${percentage}%)`, name];
            }}
          />

          {showLegend && (
            <Legend
              layout={legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal"}
              verticalAlign={legendPosition === "top" || legendPosition === "bottom" ? legendPosition : "middle"}
              align={legendPosition === "left" || legendPosition === "right" ? legendPosition : "center"}
              wrapperStyle={{
                paddingTop: legendPosition === "bottom" ? "20px" : undefined,
                paddingBottom: legendPosition === "top" ? "20px" : undefined,
                fontSize: "12px",
              }}
              iconType="circle"
              formatter={(value: string) => (
                <span style={{ color: "#F5F1E6" }}>{value}</span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface DonutChartProps extends Omit<PieChartProps, "innerRadius"> {
  /** Text to display in the center */
  centerLabel?: string;
  /** Value to display in the center */
  centerValue?: string | number;
}

/**
 * DonutChart - Donut chart variant with center label
 *
 * @example
 * ```tsx
 * <DonutChart
 *   title="Sales by Category"
 *   data={categoryData}
 *   centerLabel="Total"
 *   centerValue="$1.2M"
 * />
 * ```
 */
export function DonutChart({
  centerLabel,
  centerValue,
  outerRadius = 80,
  ...props
}: DonutChartProps) {
  return (
    <div className="relative">
      <PieChart {...props} innerRadius={outerRadius * 0.6} outerRadius={outerRadius} />
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center" style={{ marginTop: props.title ? "40px" : "0" }}>
            {centerValue && (
              <p className="text-2xl font-bold text-gold">{centerValue}</p>
            )}
            {centerLabel && (
              <p className="text-xs text-ivory/60">{centerLabel}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
