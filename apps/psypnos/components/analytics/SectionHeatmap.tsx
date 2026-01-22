// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ArrowUp, ArrowDown, Grid3X3, Table as TableIcon } from "lucide-react";

interface SectionHeatmapData {
  section: string;
  visitors: number;
  avgTimeSeconds: number;
  scrollRate: number;
  conversionsFromSection: number;
  conversionsByType: Record<
    string,
    { count: number; type: "appointment_request" | "seminar_registration" | "contact_form" }
  >;
}

interface SectionHeatmapProps {
  data: SectionHeatmapData[];
}

type SortField = "section" | "visitors" | "avgTime" | "scrollRate" | "conversions" | "score";
type SortDirection = "asc" | "desc";
type ViewMode = "table" | "grid";

// Heat color interpolation based on value (0-100)
function getHeatColor(value: number, opacity: number = 1): string {
  // Gradient from blue (cold) through green to red (hot)
  if (value < 33) {
    // Blue to green
    const ratio = value / 33;
    const r = Math.round(59 + (74 - 59) * ratio);
    const g = Math.round(130 + (222 - 130) * ratio);
    const b = Math.round(246 + (128 - 246) * ratio);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  } else if (value < 66) {
    // Green to yellow
    const ratio = (value - 33) / 33;
    const r = Math.round(74 + (234 - 74) * ratio);
    const g = Math.round(222 + (179 - 222) * ratio);
    const b = Math.round(128 + (8 - 128) * ratio);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  } else {
    // Yellow to red
    const ratio = (value - 66) / 34;
    const r = Math.round(234 + (239 - 234) * ratio);
    const g = Math.round(179 + (68 - 179) * ratio);
    const b = Math.round(8 + (68 - 8) * ratio);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}

export function SectionHeatmap({ data }: SectionHeatmapProps) {
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const maxVisitors = Math.max(...data.map((s) => s.visitors), 1);
  const maxConversions = Math.max(...data.map((s) => s.conversionsFromSection), 1);
  const maxTime = Math.max(...data.map((s) => s.avgTimeSeconds), 1);

  const typeLabels: Record<string, string> = {
    appointment_request: "RDV",
    seminar_registration: "Séminaire",
    contact_form: "Contact",
  };

  // Calculate score for a section
  const calculateScore = (section: SectionHeatmapData) => {
    const conversionRate =
      section.visitors > 0
        ? (section.conversionsFromSection / section.visitors) * 100
        : 0;
    const scrollScore = section.scrollRate;
    const timeScore = Math.min((section.avgTimeSeconds / 60) * 100, 100);
    const conversionScore = Math.min(conversionRate * 10, 100);
    return scrollScore * 0.3 + timeScore * 0.4 + conversionScore * 0.3;
  };

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortField) {
      case "section":
        return sortDirection === "asc"
          ? a.section.localeCompare(b.section)
          : b.section.localeCompare(a.section);
      case "visitors":
        aValue = a.visitors;
        bValue = b.visitors;
        break;
      case "avgTime":
        aValue = a.avgTimeSeconds;
        bValue = b.avgTimeSeconds;
        break;
      case "scrollRate":
        aValue = a.scrollRate;
        bValue = b.scrollRate;
        break;
      case "conversions":
        aValue = a.conversionsFromSection;
        bValue = b.conversionsFromSection;
        break;
      case "score":
      default:
        aValue = calculateScore(a);
        bValue = calculateScore(b);
        break;
    }

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left font-semibold text-ivory/70 cursor-pointer hover:text-gold transition group"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          {sortField === field ? (
            sortDirection === "asc" ? (
              <ArrowUp size={14} />
            ) : (
              <ArrowDown size={14} />
            )
          ) : (
            <ArrowUpDown size={14} />
          )}
        </span>
      </div>
    </th>
  );

  return (
    <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gold">
            Heatmap : Engagement par Section
          </h3>
          <p className="text-xs text-ivory/50 mt-1">
            Cliquez sur les en-têtes pour trier les données
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg transition ${
              viewMode === "table"
                ? "bg-gold/20 text-gold"
                : "text-ivory/50 hover:text-ivory hover:bg-ivory/10"
            }`}
            title="Vue tableau"
          >
            <TableIcon size={18} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition ${
              viewMode === "grid"
                ? "bg-gold/20 text-gold"
                : "text-ivory/50 hover:text-ivory hover:bg-ivory/10"
            }`}
            title="Vue grille"
          >
            <Grid3X3 size={18} />
          </button>
        </div>
      </div>

      {/* Grid View (True Heatmap) */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedData.map((section, index) => {
            const score = calculateScore(section);
            const heatColor = getHeatColor(score, 0.3);

            return (
              <motion.div
                key={section.section}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="relative rounded-lg p-4 border border-gold/10 overflow-hidden group hover:border-gold/30 transition-all cursor-pointer"
                style={{ backgroundColor: heatColor }}
              >
                {/* Background heat indicator */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(circle at center, ${getHeatColor(score, 0.5)} 0%, transparent 70%)`,
                  }}
                />

                <div className="relative">
                  <h4 className="text-sm font-medium text-ivory truncate mb-2">
                    {section.section.charAt(0).toUpperCase() + section.section.slice(1)}
                  </h4>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-ivory/60">Visiteurs</span>
                      <span className="text-ivory font-medium">{section.visitors}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-ivory/60">Temps</span>
                      <span className="text-ivory font-medium">{section.avgTimeSeconds}s</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-ivory/60">Scroll</span>
                      <span className={`font-medium ${
                        section.scrollRate >= 75 ? "text-green-400" :
                        section.scrollRate >= 50 ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {section.scrollRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-ivory/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ivory/50">Score</span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: getHeatColor(score) }}
                      >
                        {score.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/20">
                <SortHeader field="section">Section</SortHeader>
                <SortHeader field="visitors">Visiteurs</SortHeader>
                <SortHeader field="avgTime">Temps moy.</SortHeader>
                <SortHeader field="scrollRate">Scroll</SortHeader>
                <SortHeader field="conversions">Conv.</SortHeader>
                <th className="px-4 py-3 text-left font-semibold text-ivory/70">Types</th>
                <SortHeader field="score">Score</SortHeader>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((section, index) => {
                const visitorBar = (section.visitors / maxVisitors) * 100;
                const timeBar = (section.avgTimeSeconds / maxTime) * 100;
                const conversionBar = (section.conversionsFromSection / maxConversions) * 100;
                const score = calculateScore(section);
                const heatBgColor = getHeatColor(score, 0.1);

                return (
                  <motion.tr
                    key={section.section}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gold/10 hover:bg-gold/5 transition"
                    style={{ backgroundColor: heatBgColor }}
                  >
                    {/* Section Name */}
                    <td className="px-4 py-3 text-ivory font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getHeatColor(score) }}
                        />
                        {section.section.charAt(0).toUpperCase() + section.section.slice(1)}
                      </div>
                    </td>

                    {/* Visitors with mini bar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-night/40 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${visitorBar}%` }}
                            transition={{ duration: 0.6, delay: index * 0.03 }}
                          />
                        </div>
                        <span className="text-ivory/70 text-xs min-w-[2.5rem]">
                          {section.visitors}
                        </span>
                      </div>
                    </td>

                    {/* Average Time with mini bar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-night/40 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${timeBar}%` }}
                            transition={{ duration: 0.6, delay: index * 0.03 }}
                          />
                        </div>
                        <span className="text-ivory/70 text-xs min-w-[2rem]">
                          {section.avgTimeSeconds}s
                        </span>
                      </div>
                    </td>

                    {/* Scroll Rate with visual indicator */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 relative">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              className="text-night/60"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeDasharray={`${section.scrollRate * 0.88} 100`}
                              className={
                                section.scrollRate >= 75
                                  ? "text-green-400"
                                  : section.scrollRate >= 50
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-ivory">
                            {section.scrollRate.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Conversions with mini bar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-night/40 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${conversionBar}%` }}
                            transition={{ duration: 0.6, delay: index * 0.03 + 0.1 }}
                          />
                        </div>
                        <span className="text-green-400 font-medium text-xs min-w-[1.5rem]">
                          {section.conversionsFromSection}
                        </span>
                      </div>
                    </td>

                    {/* Conversion Types */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(section.conversionsByType).map(([type, convData]) => (
                          <span
                            key={type}
                            className="px-1.5 py-0.5 text-[10px] bg-gold/20 text-gold rounded"
                            title={`${convData.count} ${typeLabels[type as keyof typeof typeLabels]}`}
                          >
                            {typeLabels[type as keyof typeof typeLabels]}: {convData.count}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Engagement Score with heat indicator */}
                    <td className="px-4 py-3">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm"
                        style={{
                          backgroundColor: getHeatColor(score, 0.2),
                          color: getHeatColor(score),
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getHeatColor(score) }}
                        />
                        {score.toFixed(0)}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gold/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-ivory/50">
            <strong>Score :</strong> 30% Scroll + 40% Temps moyen + 30% Taux conversion
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ivory/50">Intensité :</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatColor(10) }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatColor(30) }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatColor(50) }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatColor(70) }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatColor(90) }} />
            </div>
            <span className="text-xs text-ivory/50">Froid → Chaud</span>
          </div>
        </div>
      </div>
    </div>
  );
}
