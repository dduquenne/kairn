// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

/**
 * Virtual Table Component
 * Phase 4: Frontend Optimization
 *
 * Efficiently renders large tables using virtualization.
 * Only renders rows that are visible in the viewport.
 */

import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string | number;
  minWidth?: string | number;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  visibleRows?: number;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  emptyMessage?: string;
  loading?: boolean;
  stickyHeader?: boolean;
}

// Get nested value from object using dot notation
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function VirtualTableInner<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 48,
  visibleRows = 10,
  className = "",
  onRowClick,
  searchable = false,
  searchPlaceholder = "Rechercher...",
  searchKeys,
  emptyMessage = "Aucune donnée disponible",
  loading = false,
  stickyHeader = true,
}: VirtualTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    const keys = searchKeys || (columns.map((c) => c.key) as (keyof T)[]);

    return data.filter((row) =>
      keys.some((key) => {
        const value = getNestedValue(row, key as string);
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchKeys, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (bValue == null) return sortConfig.direction === "asc" ? -1 : 1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortConfig.direction === "asc") {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [filteredData, sortConfig]);

  // Calculate visible range
  const totalHeight = sortedData.length * rowHeight;
  const containerHeight = visibleRows * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const endIndex = Math.min(
    sortedData.length,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + 2
  );
  const visibleData = sortedData.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Handle sort
  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc"
          ? { key, direction: "desc" }
          : null;
      }
      return { key, direction: "asc" };
    });
  }, []);

  // Reset scroll when data changes significantly
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [searchQuery]);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden ${className}`}>
      {/* Search */}
      {searchable && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <div
          ref={containerRef}
          className="overflow-y-auto"
          style={{ maxHeight: containerHeight + 48 }} // +48 for header
          onScroll={handleScroll}
        >
          <table className="w-full">
            {/* Header */}
            <thead
              className={`bg-gray-50 dark:bg-gray-800 ${stickyHeader ? "sticky top-0 z-10" : ""}`}
            >
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      column.align === "center"
                        ? "text-center"
                        : column.align === "right"
                        ? "text-right"
                        : "text-left"
                    } ${column.sortable ? "cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700" : ""}`}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                    }}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.sortable && sortConfig?.key === String(column.key) && (
                        <span className="text-indigo-500">
                          {sortConfig.direction === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="relative">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                <>
                  {/* Spacer for virtualization */}
                  <tr style={{ height: offsetY }} />

                  {/* Visible rows */}
                  {visibleData.map((row, localIndex) => {
                    const globalIndex = startIndex + localIndex;
                    return (
                      <motion.tr
                        key={globalIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`border-b border-gray-200 dark:border-gray-700 ${
                          onRowClick
                            ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            : ""
                        }`}
                        style={{ height: rowHeight }}
                        onClick={() => onRowClick?.(row, globalIndex)}
                      >
                        {columns.map((column) => {
                          const value = getNestedValue(row, String(column.key));
                          return (
                            <td
                              key={String(column.key)}
                              className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${
                                column.align === "center"
                                  ? "text-center"
                                  : column.align === "right"
                                  ? "text-right"
                                  : "text-left"
                              }`}
                              style={{
                                width: column.width,
                                minWidth: column.minWidth,
                              }}
                            >
                              {column.render
                                ? column.render(value, row, globalIndex)
                                : value != null
                                ? String(value)
                                : "-"}
                            </td>
                          );
                        })}
                      </motion.tr>
                    );
                  })}

                  {/* Bottom spacer for virtualization */}
                  <tr
                    style={{
                      height: Math.max(0, totalHeight - offsetY - visibleData.length * rowHeight),
                    }}
                  />
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer with count */}
      {sortedData.length > 0 && (
        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {searchQuery ? (
            <>
              {sortedData.length} résultat(s) sur {data.length} total
            </>
          ) : (
            <>{sortedData.length} ligne(s)</>
          )}
        </div>
      )}
    </div>
  );
}

// Memoized export
export const VirtualTable = memo(VirtualTableInner) as typeof VirtualTableInner;

export default VirtualTable;
