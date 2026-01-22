// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ArrowUp, ArrowDown, Medal, TrendingUp, TrendingDown } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  format?: (value: T[keyof T], row: T, allRows: T[]) => React.ReactNode;
  getValue?: (row: T) => number | string;
  highlightExtremes?: boolean;
}

interface SortableTableProps<T> {
  title: string;
  subtitle?: string;
  data: T[];
  columns: Column<T>[];
  defaultSortKey?: keyof T | string;
  defaultSortDirection?: "asc" | "desc";
  showRanking?: boolean;
  maxRows?: number;
}

type SortDirection = "asc" | "desc";

// Get numeric value from a row for a given column
function getNumericValue<T>(row: T, column: Column<T>): number {
  if (column.getValue) {
    const val = column.getValue(row);
    return typeof val === "number" ? val : parseFloat(val as string) || 0;
  }
  const val = row[column.key as keyof T];
  return typeof val === "number" ? val : parseFloat(val as string) || 0;
}

// Determine if a value is extreme (min or max)
function getExtremeStatus<T>(
  row: T,
  column: Column<T>,
  allRows: T[]
): "max" | "min" | null {
  if (!column.highlightExtremes || allRows.length < 3) return null;

  const currentValue = getNumericValue(row, column);
  const allValues = allRows.map((r) => getNumericValue(r, column));
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);

  if (currentValue === max && max !== min) return "max";
  if (currentValue === min && max !== min) return "min";
  return null;
}

export function SortableTable<T extends object>({
  title,
  subtitle,
  data,
  columns,
  defaultSortKey,
  defaultSortDirection = "desc",
  showRanking = false,
  maxRows,
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | string | null>(
    defaultSortKey || null
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSortDirection
  );

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    const column = columns.find((c) => c.key === sortKey);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = column.getValue ? column.getValue(a) : a[sortKey as keyof T];
      const bValue = column.getValue ? column.getValue(b) : b[sortKey as keyof T];

      let comparison = 0;
      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection, columns]);

  const displayData = maxRows ? sortedData.slice(0, maxRows) : sortedData;

  const SortIcon = ({ columnKey }: { columnKey: keyof T | string }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="text-gold" />
    ) : (
      <ArrowDown size={14} className="text-gold" />
    );
  };

  return (
    <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gold">{title}</h3>
        {subtitle && <p className="text-xs text-ivory/50 mt-1">{subtitle}</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold/20">
              {showRanking && (
                <th className="px-2 py-3 text-center font-semibold text-ivory/70 w-12">
                  #
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 font-semibold text-ivory/70 ${
                    column.sortable !== false ? "cursor-pointer hover:text-gold" : ""
                  } ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : "text-left"
                  } group transition`}
                  onClick={() =>
                    column.sortable !== false && handleSort(column.key)
                  }
                >
                  <div
                    className={`flex items-center gap-1 ${
                      column.align === "right"
                        ? "justify-end"
                        : column.align === "center"
                          ? "justify-center"
                          : ""
                    }`}
                  >
                    <span>{column.label}</span>
                    {column.sortable !== false && <SortIcon columnKey={column.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.03 }}
                className="border-b border-gold/10 hover:bg-gold/5 transition"
              >
                {showRanking && (
                  <td className="px-2 py-3 text-center">
                    {rowIndex < 3 ? (
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          rowIndex === 0
                            ? "bg-yellow-500/20 text-yellow-400"
                            : rowIndex === 1
                              ? "bg-gray-400/20 text-gray-300"
                              : "bg-amber-700/20 text-amber-600"
                        }`}
                      >
                        {rowIndex === 0 ? <Medal size={14} /> : rowIndex + 1}
                      </span>
                    ) : (
                      <span className="text-ivory/40">{rowIndex + 1}</span>
                    )}
                  </td>
                )}
                {columns.map((column) => {
                  const extremeStatus = getExtremeStatus(row, column, data);
                  const value = row[column.key as keyof T];

                  return (
                    <td
                      key={String(column.key)}
                      className={`px-4 py-3 ${
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                            ? "text-center"
                            : "text-left"
                      } ${
                        extremeStatus === "max"
                          ? "text-green-400 font-semibold"
                          : extremeStatus === "min"
                            ? "text-red-400"
                            : "text-ivory/70"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-1 ${
                          column.align === "right"
                            ? "justify-end"
                            : column.align === "center"
                              ? "justify-center"
                              : ""
                        }`}
                      >
                        {extremeStatus === "max" && (
                          <TrendingUp size={14} className="text-green-400" />
                        )}
                        {extremeStatus === "min" && (
                          <TrendingDown size={14} className="text-red-400" />
                        )}
                        {column.format
                          ? column.format(value, row, data)
                          : String(value ?? "")}
                      </div>
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {maxRows && data.length > maxRows && (
        <div className="mt-4 text-center">
          <span className="text-xs text-ivory/40">
            Affichage de {maxRows} sur {data.length} lignes
          </span>
        </div>
      )}
    </div>
  );
}
