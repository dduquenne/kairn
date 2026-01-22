"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
} from "recharts";
import { cn } from "@kairn/ui";
import { chartTheme, CHART_COLORS } from "./theme";

export interface DataPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  /** Chart title */
  title: string;
  /** Data points to display */
  data: DataPoint[];
  /** Whether to show the brush (zoom) control */
  showBrush?: boolean;
  /** Whether to show the legend */
  showLegend?: boolean;
  /** Line color */
  color?: string;
  /** Chart height in pixels */
  height?: number;
  /** Custom class names */
  className?: string;
  /** X-axis data key */
  xAxisKey?: string;
  /** Y-axis data key */
  yAxisKey?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Value formatter for tooltip */
  valueFormatter?: (value: number) => string;
}

/**
 * LineChart - Interactive line chart with zoom and tooltips
 *
 * @example
 * ```tsx
 * const data = [
 *   { label: "Jan", value: 100 },
 *   { label: "Feb", value: 150 },
 *   { label: "Mar", value: 120 },
 * ];
 *
 * <LineChart
 *   title="Monthly Visitors"
 *   data={data}
 *   color="#4ADE80"
 *   showBrush
 * />
 * ```
 */
export function LineChart({
  title,
  data,
  showBrush = true,
  showLegend = false,
  color = CHART_COLORS.gold,
  height = 300,
  className,
  yAxisLabel = "Valeur",
  valueFormatter,
}: LineChartProps) {
  // Transform data for Recharts format
  const chartData = data.map((point) => ({
    name: point.label,
    valeur: point.value,
  }));

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
        <RechartsLineChart
          data={chartData}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <defs>
            <linearGradient id={`colorValue-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray={chartTheme.grid.strokeDasharray}
            stroke={chartTheme.grid.stroke}
            vertical={false}
          />

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

          <Tooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            itemStyle={chartTheme.tooltip.itemStyle}
            cursor={chartTheme.tooltip.cursor}
            formatter={valueFormatter ? (value: number) => [valueFormatter(value), yAxisLabel] : undefined}
          />

          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "12px",
                color: "#F5F1E6",
              }}
            />
          )}

          <Line
            type="monotone"
            dataKey="valeur"
            name={yAxisLabel}
            stroke={color}
            strokeWidth={2}
            fill={`url(#colorValue-${color.replace("#", "")})`}
            dot={{
              fill: color,
              strokeWidth: 2,
              r: 4,
              stroke: "#0D0A08",
            }}
            activeDot={{
              r: 6,
              strokeWidth: 2,
              stroke: "#F5F1E6",
              fill: color,
            }}
            animationDuration={chartTheme.animation.duration}
          />

          {showBrush && data.length > 10 && (
            <Brush
              dataKey="name"
              height={30}
              stroke={color}
              fill="rgba(13,10,8,0.3)"
              travellerWidth={10}
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
}

export interface MultiLineChartProps {
  /** Chart title */
  title: string;
  /** Data points with multiple values */
  data: Array<{
    label: string;
    [key: string]: number | string;
  }>;
  /** Configuration for each line */
  lines: LineConfig[];
  /** Whether to show the brush control */
  showBrush?: boolean;
  /** Chart height in pixels */
  height?: number;
  /** Custom class names */
  className?: string;
  /** Value formatter for tooltip */
  valueFormatter?: (value: number) => string;
}

/**
 * MultiLineChart - Compare multiple metrics on one chart
 *
 * @example
 * ```tsx
 * const data = [
 *   { label: "Jan", visits: 100, conversions: 10 },
 *   { label: "Feb", visits: 150, conversions: 18 },
 * ];
 *
 * const lines = [
 *   { dataKey: "visits", name: "Visits", color: "#4ADE80" },
 *   { dataKey: "conversions", name: "Conversions", color: "#60A5FA" },
 * ];
 *
 * <MultiLineChart title="Traffic Overview" data={data} lines={lines} />
 * ```
 */
export function MultiLineChart({
  title,
  data,
  lines,
  showBrush = true,
  height = 300,
  className,
  valueFormatter,
}: MultiLineChartProps) {
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
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray={chartTheme.grid.strokeDasharray}
            stroke={chartTheme.grid.stroke}
            vertical={false}
          />

          <XAxis
            dataKey="label"
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

          <Tooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={{
              ...chartTheme.tooltip.labelStyle,
              marginBottom: "8px",
            }}
            itemStyle={{
              ...chartTheme.tooltip.itemStyle,
              fontSize: "13px",
              fontWeight: "600",
              padding: "2px 0",
            }}
            cursor={chartTheme.tooltip.cursor}
            formatter={valueFormatter ? (value: number, name: string) => [valueFormatter(value), name] : undefined}
          />

          <Legend
            wrapperStyle={{
              paddingTop: "20px",
              fontSize: "12px",
            }}
            iconType="line"
          />

          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={{
                fill: line.color,
                strokeWidth: 2,
                r: 3,
                stroke: "#0D0A08",
              }}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: "#F5F1E6",
                fill: line.color,
              }}
              animationDuration={chartTheme.animation.duration}
            />
          ))}

          {showBrush && data.length > 10 && (
            <Brush
              dataKey="label"
              height={30}
              stroke={CHART_COLORS.gold}
              fill="rgba(13,10,8,0.3)"
              travellerWidth={10}
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
