// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  date: string;
  value: number;
}

interface MobileLineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
}

export function MobileLineChart({ data, color = "#C9A961", height = 200 }: MobileLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis
          dataKey="date"
          stroke="#C9A96160"
          style={{ fontSize: '11px' }}
          tickLine={false}
        />
        <YAxis
          stroke="#C9A96160"
          style={{ fontSize: '11px' }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #C9A96130',
            borderRadius: '8px',
            fontSize: '12px'
          }}
          labelStyle={{ color: '#C9A961' }}
          itemStyle={{ color: '#F5F5DC' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
