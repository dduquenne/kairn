"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { cn } from "@kairn/ui";
import { chartTheme, CHART_COLORS } from "./theme";

export interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  /** Chart title */
  title: string;
  /** Data points to display */
  data: DataPoint[];
  /** Whether to display horizontal bars */
  horizontal?: boolean;
  /** Bar color (or use data[].color for individual colors) */
  color?: string;
  /** Chart height in pixels */
  height?: number;
  /** Custom class names */
  className?: string;
  /** Y-axis label for tooltip */
  yAxisLabel?: string;
  /** Whether to show legend */
  showLegend?: boolean;
  /** Value formatter for tooltip and axis */
  valueFormatter?: (value: number) => string;
  /** Radius for bar corners */
  barRadius?: number | [number, number, number, number];
  /** Whether each bar should have its own color from data */
  colorPerBar?: boolean;
}

/**
 * BarChart - Interactive bar chart with tooltips and animations
 *
 * @example
 * ```tsx
 * const data = [
 *   { label: "Chrome", value: 65 },
 *   { label: "Firefox", value: 20 },
 *   { label: "Safari", value: 15 },
 * ];
 *
 * <BarChart
 *   title="Browser Distribution"
 *   data={data}
 *   horizontal
 *   color="#60A5FA"
 * />
 * ```
 */
export function BarChart({
  title,
  data,
  horizontal = true,
  color = CHART_COLORS.gold,
  height = 300,
  className,
  yAxisLabel = "Valeur",
  showLegend = false,
  valueFormatter,
  barRadius,
  colorPerBar = false,
}: BarChartProps) {
  // Transform data for Recharts format
  const chartData = data.map((point) => ({
    name: point.label,
    valeur: point.value,
    color: point.color,
  }));

  const defaultRadius: [number, number, number, number] = horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0];
  const finalRadius = barRadius ?? defaultRadius;

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
        <RechartsBarChart
          data={chartData}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 5, right: 20, bottom: 5, left: horizontal ? 100 : 0 }}
        >
          <CartesianGrid
            strokeDasharray={chartTheme.grid.strokeDasharray}
            stroke={chartTheme.grid.stroke}
            horizontal={!horizontal}
            vertical={horizontal}
          />

          {horizontal ? (
            <>
              <XAxis
                type="number"
                stroke={chartTheme.axis.stroke}
                style={{ fontSize: chartTheme.axis.fontSize, fontFamily: "inherit" }}
                tick={chartTheme.axis.tick}
                tickFormatter={valueFormatter}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke={chartTheme.axis.stroke}
                style={{ fontSize: chartTheme.axis.fontSize, fontFamily: "inherit" }}
                tick={chartTheme.axis.tick}
                width={90}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                stroke={chartTheme.axis.stroke}
                style={{ fontSize: chartTheme.axis.fontSize, fontFamily: "inherit" }}
                tick={chartTheme.axis.tick}
              />
              <YAxis
                stroke={chartTheme.axis.stroke}
                style={{ fontSize: chartTheme.axis.fontSize, fontFamily: "inherit" }}
                tick={chartTheme.axis.tick}
                tickFormatter={valueFormatter}
              />
            </>
          )}

          <Tooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            itemStyle={chartTheme.tooltip.itemStyle}
            cursor={{ fill: "rgba(212,175,55,0.1)" }}
            formatter={valueFormatter ? (value: number) => [valueFormatter(value), yAxisLabel] : undefined}
          />

          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "12px",
              }}
            />
          )}

          <Bar
            dataKey="valeur"
            name={yAxisLabel}
            fill={color}
            radius={finalRadius}
            animationDuration={chartTheme.animation.duration}
            activeBar={chartTheme.activeBar}
          >
            {colorPerBar &&
              chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]}
                />
              ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
