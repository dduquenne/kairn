"use client";

import { motion } from "framer-motion";
import { Zap, BarChart3, Clock } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CustomEventGroup {
  category: string;
  action: string;
  count: number;
  lastSeen: string;
}

interface CustomEventsPanelProps {
  events: CustomEventGroup[];
  totalEvents: number;
  uniqueCategories: number;
  isLoading?: boolean;
}

export function CustomEventsPanel({
  events,
  totalEvents,
  uniqueCategories,
  isLoading = false,
}: CustomEventsPanelProps) {
  const [view, setView] = useState<"table" | "chart">("table");

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  // Group events by category for chart
  const categoryData = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + event.count;
    return acc;
  }, {});

  const chartData = Object.entries(categoryData)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const COLORS = [
    "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
    "#818cf8", "#7c3aed", "#5b21b6", "#4c1d95",
    "#6d28d9", "#9333ea",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Zap className="w-4 h-4" />
            Total des événements
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalEvents.toLocaleString('fr-FR')}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <BarChart3 className="w-4 h-4" />
            Catégories uniques
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {uniqueCategories}
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("table")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            view === "table"
              ? "bg-indigo-100 text-indigo-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Tableau
        </button>
        <button
          onClick={() => setView("chart")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            view === "chart"
              ? "bg-indigo-100 text-indigo-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Graphique
        </button>
      </div>

      {view === "table" ? (
        /* Events table */
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-2 font-medium">Catégorie</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium text-right">Occurrences</th>
                <th className="pb-2 font-medium text-right">
                  <Clock className="w-3.5 h-3.5 inline" /> Dernière
                </th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 20).map((event, index) => (
                <tr
                  key={`${event.category}-${event.action}-${index}`}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      {event.category}
                    </span>
                  </td>
                  <td className="py-2 text-gray-700">{event.action}</td>
                  <td className="py-2 text-right font-medium text-gray-900">
                    {event.count.toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2 text-right text-gray-500 text-xs">
                    {new Date(event.lastSeen).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              Aucun événement personnalisé enregistré sur cette période.
            </p>
          )}
        </div>
      ) : (
        /* Chart view */
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="category"
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [
                  value.toLocaleString('fr-FR'),
                  "Événements",
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((_entry, index) => (
                  <rect key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
