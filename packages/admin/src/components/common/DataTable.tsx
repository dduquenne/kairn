"use client";

import { ReactNode } from "react";
import { cn } from "@kairn/ui";

export interface DataTableColumn<T> {
  /** Unique key for the column (can be a keyof T or custom string) */
  key: keyof T | string;
  /** Column header label */
  label: string;
  /** Column alignment */
  align?: "left" | "center" | "right";
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (value: T[keyof T], row: T, index: number) => ReactNode;
  /** Column width (CSS value) */
  width?: string;
  /** Whether to hide on mobile */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  /** Array of data to display */
  data: T[];
  /** Column configuration */
  columns: DataTableColumn<T>[];
  /** Function to get a unique key for each row */
  getRowKey: (row: T, index: number) => string | number;
  /** Called when a row is clicked */
  onRowClick?: (row: T, index: number) => void;
  /** Whether the table is loading */
  loading?: boolean;
  /** Empty state content */
  emptyState?: ReactNode;
  /** Custom class names for the table */
  className?: string;
  /** Whether to show row hover effect */
  hoverable?: boolean;
  /** Whether to show row borders */
  bordered?: boolean;
  /** Accent color */
  accentColor?: string;
}

/**
 * DataTable - Simple data table component for admin dashboards
 *
 * @example
 * ```tsx
 * const columns = [
 *   { key: 'name', label: 'Name' },
 *   { key: 'email', label: 'Email' },
 *   {
 *     key: 'status',
 *     label: 'Status',
 *     render: (value) => <Badge>{value}</Badge>
 *   },
 * ];
 *
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   getRowKey={(row) => row.id}
 *   onRowClick={(row) => openDetail(row)}
 * />
 * ```
 */
export function DataTable<T extends object>({
  data,
  columns,
  getRowKey,
  onRowClick,
  loading = false,
  emptyState,
  className,
  hoverable = true,
  bordered = true,
  accentColor = "gold",
}: DataTableProps<T>) {
  const getCellValue = (row: T, column: DataTableColumn<T>): unknown => {
    if (typeof column.key === "string" && column.key.includes(".")) {
      // Support dot notation for nested values
      return column.key.split(".").reduce((obj, key) => {
        return obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key] : undefined;
      }, row as unknown);
    }
    return row[column.key as keyof T];
  };

  if (loading) {
    return (
      <div className={cn("rounded-xl border border-gold/20 bg-night/60 p-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-1/4 rounded bg-gold/20" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded bg-gold/10" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={cn("rounded-xl border border-gold/20 bg-night/60 p-8 text-center", className)}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-gold/20 bg-night/60", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className={cn("border-b", `border-${accentColor}/20`)}>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  "px-4 py-3 font-semibold text-ivory/70",
                  column.align === "right"
                    ? "text-right"
                    : column.align === "center"
                      ? "text-center"
                      : "text-left",
                  column.hideOnMobile && "hidden sm:table-cell"
                )}
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={getRowKey(row, rowIndex)}
              className={cn(
                "transition",
                bordered && `border-b border-${accentColor}/10`,
                hoverable && `hover:bg-${accentColor}/5`,
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(row, rowIndex)}
            >
              {columns.map((column) => {
                const value = getCellValue(row, column);
                return (
                  <td
                    key={String(column.key)}
                    className={cn(
                      "px-4 py-3 text-ivory/70",
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                          ? "text-center"
                          : "text-left",
                      column.hideOnMobile && "hidden sm:table-cell"
                    )}
                    style={{ width: column.width }}
                  >
                    {column.render
                      ? column.render(value as T[keyof T], row, rowIndex)
                      : String(value ?? "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
