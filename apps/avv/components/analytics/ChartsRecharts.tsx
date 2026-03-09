/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
} from "recharts";

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  title: string;
  data: DataPoint[];
  showBrush?: boolean;
  showLegend?: boolean;
  color?: string;
}

/**
 * Interactive Line Chart with Recharts
 * Features: zoom/brush, tooltips, responsive, animations
 */
export function LineChart({
  title,
  data,
  showBrush = true,
  showLegend = false,
  color = "#D4AF37"
}: LineChartProps) {
  // Transform data for Recharts format
  const chartData = data.map((point) => ({
    name: point.label,
    valeur: point.value,
  }));

  return (
    <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      <h3 className="mb-6 text-lg font-semibold text-gold">{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart
          data={chartData}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(199,169,98,0.1)"
            vertical={false}
          />

          <XAxis
            dataKey="name"
            stroke="#C7A962"
            style={{
              fontSize: "12px",
              fontFamily: "inherit",
            }}
            tick={{ fill: "rgba(245,241,230,0.7)" }}
          />

          <YAxis
            stroke="#C7A962"
            style={{
              fontSize: "12px",
              fontFamily: "inherit",
            }}
            tick={{ fill: "rgba(245,241,230,0.7)" }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(13,10,8,0.95)",
              border: "1px solid rgba(212,175,55,0.5)",
              borderRadius: "8px",
              padding: "12px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            }}
            labelStyle={{
              color: "#D4AF37",
              fontWeight: "600",
              fontSize: "13px",
              marginBottom: "4px",
            }}
            itemStyle={{
              color: "#F5F1E6",
              fontSize: "14px",
              fontWeight: "700",
            }}
            cursor={{
              stroke: "rgba(212,175,55,0.3)",
              strokeWidth: 2,
            }}
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
            name="Valeur"
            stroke={color}
            strokeWidth={2}
            fill="url(#colorValue)"
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
            animationDuration={800}
          />

          {showBrush && data.length > 10 && (
            <Brush
              dataKey="name"
              height={30}
              stroke={color}
              fill="rgba(13,10,8,0.3)"
              travellerWidth={10}
              style={{
                marginTop: "10px",
              }}
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BarChartProps {
  title: string;
  data: DataPoint[];
  horizontal?: boolean;
  color?: string;
}

/**
 * Interactive Bar Chart with Recharts
 * Features: drill-down, tooltips, responsive, animations
 */
export function BarChart({
  title,
  data,
  horizontal = true,
  color = "#D4AF37"
}: BarChartProps) {
  // Transform data for Recharts format
  const chartData = data.map((point) => ({
    name: point.label,
    valeur: point.value,
  }));

  return (
    <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      <h3 className="mb-6 text-lg font-semibold text-gold">{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart
          data={chartData}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 5, right: 20, bottom: 5, left: horizontal ? 100 : 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(199,169,98,0.1)"
            horizontal={!horizontal}
            vertical={horizontal}
          />

          {horizontal ? (
            <>
              <XAxis
                type="number"
                stroke="#C7A962"
                style={{
                  fontSize: "12px",
                  fontFamily: "inherit",
                }}
                tick={{ fill: "rgba(245,241,230,0.7)" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#C7A962"
                style={{
                  fontSize: "12px",
                  fontFamily: "inherit",
                }}
                tick={{ fill: "rgba(245,241,230,0.7)" }}
                width={90}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                stroke="#C7A962"
                style={{
                  fontSize: "12px",
                  fontFamily: "inherit",
                }}
                tick={{ fill: "rgba(245,241,230,0.7)" }}
              />
              <YAxis
                stroke="#C7A962"
                style={{
                  fontSize: "12px",
                  fontFamily: "inherit",
                }}
                tick={{ fill: "rgba(245,241,230,0.7)" }}
              />
            </>
          )}

          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(13,10,8,0.95)",
              border: "1px solid rgba(212,175,55,0.5)",
              borderRadius: "8px",
              padding: "12px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            }}
            labelStyle={{
              color: "#D4AF37",
              fontWeight: "600",
              fontSize: "13px",
              marginBottom: "4px",
            }}
            itemStyle={{
              color: "#F5F1E6",
              fontSize: "14px",
              fontWeight: "700",
            }}
            cursor={{
              fill: "rgba(212,175,55,0.1)",
            }}
          />

          <Bar
            dataKey="valeur"
            name="Valeur"
            fill={color}
            radius={horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]}
            animationDuration={800}
            activeBar={{
              fill: "#E5C158",
              stroke: "rgba(212,175,55,0.4)",
              strokeWidth: 1.5,
              fillOpacity: 0.9,
            }}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MultiLineChartProps {
  title: string;
  data: Array<{
    label: string;
    [key: string]: number | string;
  }>;
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  showBrush?: boolean;
}

/**
 * Multi-line chart for comparing multiple metrics
 */
export function MultiLineChart({
  title,
  data,
  lines,
  showBrush = true,
}: MultiLineChartProps) {
  return (
    <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      <h3 className="mb-6 text-lg font-semibold text-gold">{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(199,169,98,0.1)"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            stroke="#C7A962"
            style={{
              fontSize: "12px",
              fontFamily: "inherit",
            }}
            tick={{ fill: "rgba(245,241,230,0.7)" }}
          />

          <YAxis
            stroke="#C7A962"
            style={{
              fontSize: "12px",
              fontFamily: "inherit",
            }}
            tick={{ fill: "rgba(245,241,230,0.7)" }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(13,10,8,0.95)",
              border: "1px solid rgba(212,175,55,0.5)",
              borderRadius: "8px",
              padding: "12px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            }}
            labelStyle={{
              color: "#D4AF37",
              fontWeight: "600",
              fontSize: "13px",
              marginBottom: "8px",
            }}
            itemStyle={{
              color: "#F5F1E6",
              fontSize: "13px",
              fontWeight: "600",
              padding: "2px 0",
            }}
            cursor={{
              stroke: "rgba(212,175,55,0.3)",
              strokeWidth: 2,
            }}
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
              animationDuration={800}
            />
          ))}

          {showBrush && data.length > 10 && (
            <Brush
              dataKey="label"
              height={30}
              stroke="#D4AF37"
              fill="rgba(13,10,8,0.3)"
              travellerWidth={10}
              style={{
                marginTop: "10px",
              }}
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
