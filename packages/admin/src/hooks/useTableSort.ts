"use client";

import { useState, useCallback } from "react";

export type SortDirection = "asc" | "desc";

export interface UseTableSortOptions<T> {
  /** Initial sort key */
  initialSortKey?: keyof T | string;
  /** Initial sort direction */
  initialSortDirection?: SortDirection;
  /** Custom compare function for specific keys */
  compareFunctions?: Record<string, (a: T, b: T) => number>;
}

export interface UseTableSortResult<T> {
  /** Current sort key */
  sortKey: keyof T | string | null;
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Function to sort data array */
  sortData: (data: T[]) => T[];
  /** Toggle sort on a column */
  toggleSort: (key: keyof T | string) => void;
  /** Set sort to a specific key and direction */
  setSort: (key: keyof T | string, direction?: SortDirection) => void;
  /** Clear sorting */
  clearSort: () => void;
  /** Check if a column is currently sorted */
  isSorted: (key: keyof T | string) => boolean;
  /** Get sort direction for a column */
  getSortDirection: (key: keyof T | string) => SortDirection | null;
}

/**
 * useTableSort - Hook for managing table sorting state
 *
 * @example
 * ```tsx
 * const { sortKey, sortDirection, sortData, toggleSort } = useTableSort<User>({
 *   initialSortKey: "name",
 *   initialSortDirection: "asc",
 * });
 *
 * const sortedUsers = sortData(users);
 *
 * return (
 *   <table>
 *     <thead>
 *       <tr>
 *         <th onClick={() => toggleSort("name")}>
 *           Name {sortKey === "name" && (sortDirection === "asc" ? "↑" : "↓")}
 *         </th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       {sortedUsers.map(user => ...)}
 *     </tbody>
 *   </table>
 * );
 * ```
 */
export function useTableSort<T extends object>({
  initialSortKey,
  initialSortDirection = "asc",
  compareFunctions = {},
}: UseTableSortOptions<T> = {}): UseTableSortResult<T> {
  const [sortKey, setSortKey] = useState<keyof T | string | null>(initialSortKey ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);

  const toggleSort = useCallback(
    (key: keyof T | string) => {
      if (sortKey === key) {
        // Toggle direction
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        // New column, default to descending (most common for metrics)
        setSortKey(key);
        setSortDirection("desc");
      }
    },
    [sortKey]
  );

  const setSort = useCallback((key: keyof T | string, direction: SortDirection = "desc") => {
    setSortKey(key);
    setSortDirection(direction);
  }, []);

  const clearSort = useCallback(() => {
    setSortKey(null);
    setSortDirection("asc");
  }, []);

  const isSorted = useCallback(
    (key: keyof T | string) => sortKey === key,
    [sortKey]
  );

  const getSortDirection = useCallback(
    (key: keyof T | string) => (sortKey === key ? sortDirection : null),
    [sortKey, sortDirection]
  );

  const sortData = useCallback(
    (data: T[]): T[] => {
      if (!sortKey) return data;

      return [...data].sort((a, b) => {
        // Use custom compare function if provided
        const keyStr = String(sortKey);
        if (compareFunctions[keyStr]) {
          const result = compareFunctions[keyStr](a, b);
          return sortDirection === "asc" ? result : -result;
        }

        // Get values, supporting dot notation for nested properties
        const getValue = (obj: T, key: string): unknown => {
          if (key.includes(".")) {
            return key.split(".").reduce((o, k) => {
              return o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined;
            }, obj as unknown);
          }
          return obj[key as keyof T];
        };

        const aValue = getValue(a, keyStr);
        const bValue = getValue(b, keyStr);

        let comparison = 0;

        // Handle different types
        if (aValue === null || aValue === undefined) {
          comparison = 1;
        } else if (bValue === null || bValue === undefined) {
          comparison = -1;
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
          comparison = aValue === bValue ? 0 : aValue ? -1 : 1;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    },
    [sortKey, sortDirection, compareFunctions]
  );

  return {
    sortKey,
    sortDirection,
    sortData,
    toggleSort,
    setSort,
    clearSort,
    isSorted,
    getSortDirection,
  };
}
