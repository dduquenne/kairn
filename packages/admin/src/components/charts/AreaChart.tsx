"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
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

export interface AreaConfig {
  dataKey: string;
  name: string;
  color: string;
  fillOpacity?: number;
}

export interface AreaChartProps {
  /** Chart title */
  title: string;
  /** Data points to display */
  data: DataPoint[] | Array<{ label: string; [key: string]: number | string }>;
  /** Whether to show the brush (zoom) control */
  showBrush?: boolean;
  /** Whether to show the legend */
  showLegend?: boolean;
  /** Area fill color */
  color?: string;
  /** Fill opacity (0-1) */
  fillOpacity?: number;
  /** Chart height in pixels */
  height?: number;
  /** Custom class names */
  className?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Value formatter for tooltip */
  valueFormatter?: (value: number) => string;
  /** Configuration for stacked areas (optional) */
  areas?: AreaConfig[];
  /** Whether areas should be stacked */
  stacked?: boolean;
}

/**
 * AreaChart - Area chart with gradient fill
 *
 * @example
 * ```tsx
 * const data = [
 *   { label: "Jan", value: 100 },
 *   { label: "Feb", value: 150 },
 *   { label: "Mar", value: 120 },
 * ];
 *
 * <AreaChart
 *   title="Monthly Revenue"
 *   data={data}
 *   color="#4ADE80"
 *   fillOpacity={0.3}
 * />
 * ```
 */
export function AreaChart({
  title,
  data,
  showBrush = true,
  showLegend = false,
  color = CHART_COLORS.gold,
  fillOpacity = 0.3,
  height = 300,
  className,
  yAxisLabel = "Valeur",
  valueFormatter,
  areas,
  stacked = false,
}: AreaChartProps) {
  // Transform data for Recharts format if simple data
  const firstItem = data[0];
  const isSimpleData = data.length > 0 && firstItem && "value" in firstItem;
  const chartData = isSimpleData
    ? (data as DataPoint[]).map((point) => ({
        name: point.label,
        valeur: point.value,
      }))
    : data;

  const gradientId = `gradient-${color.replace("#", "")}`;

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
        <RechartsAreaChart
          data={chartData}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <defs>
            {areas ? (
              areas.map((area) => (
                <linearGradient
                  key={area.dataKey}
                  id={`gradient-${area.color.replace("#", "")}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={area.color} stopOpacity={area.fillOpacity ?? fillOpacity} />
                  <stop offset="95%" stopColor={area.color} stopOpacity={0} />
                </linearGradient>
              ))
            ) : (
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={fillOpacity} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            )}
          </defs>

          <CartesianGrid
            strokeDasharray={chartTheme.grid.strokeDasharray}
            stroke={chartTheme.grid.stroke}
            vertical={false}
          />

          <XAxis
            dataKey={isSimpleData ? "name" : "label"}
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
            formatter={valueFormatter ? (value: number, name: string) => [valueFormatter(value), name] : undefined}
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

          {areas ? (
            areas.map((area) => (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                name={area.name}
                stroke={area.color}
                strokeWidth={2}
                fill={`url(#gradient-${area.color.replace("#", "")})`}
                stackId={stacked ? "stack" : undefined}
                animationDuration={chartTheme.animation.duration}
              />
            ))
          ) : (
            <Area
              type="monotone"
              dataKey="valeur"
              name={yAxisLabel}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={chartTheme.animation.duration}
            />
          )}

          {showBrush && chartData.length > 10 && (
            <Brush
              dataKey={isSimpleData ? "name" : "label"}
              height={30}
              stroke={color}
              fill="rgba(13,10,8,0.3)"
              travellerWidth={10}
            />
          )}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
