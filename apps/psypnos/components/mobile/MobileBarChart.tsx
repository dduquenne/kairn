/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
}

interface MobileBarChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
}

export function MobileBarChart({ data, color = "#C9A961", height = 200 }: MobileBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis
          dataKey="name"
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
          cursor={{ fill: '#C9A96110' }}
        />
        <Bar
          dataKey="value"
          fill={color}
          radius={[4, 4, 0, 0]}
          activeBar={{
            fill: "#E5C158",
            stroke: "rgba(212,175,55,0.4)",
            strokeWidth: 1.5,
            fillOpacity: 0.9,
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
