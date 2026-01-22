"use client";

import { useState, useCallback } from "react";

export type ExportFormat = "csv" | "xlsx" | "pdf" | "json";

export interface UseExportOptions {
  /** Base URL for export API */
  exportBaseUrl?: string;
  /** File name prefix for downloads */
  fileNamePrefix?: string;
  /** Callback on export start */
  onExportStart?: (format: ExportFormat) => void;
  /** Callback on export success */
  onExportSuccess?: (format: ExportFormat) => void;
  /** Callback on export error */
  onExportError?: (format: ExportFormat, error: Error) => void;
}

export interface UseExportResult {
  /** Whether an export is in progress */
  isExporting: boolean;
  /** Export data as CSV */
  exportCsv: <T>(data: T[], columns: ExportColumn<T>[], filename?: string) => void;
  /** Export data via API endpoint */
  exportFromApi: (endpoint: string, params?: Record<string, string>, filename?: string) => Promise<void>;
  /** Download a file from a blob */
  downloadBlob: (blob: Blob, filename: string) => void;
  /** Print content (opens print dialog) */
  printContent: (htmlContent: string) => void;
}

export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  format?: (value: unknown) => string;
}

/**
 * useExport - Hook for exporting data in various formats
 *
 * @example
 * ```tsx
 * const { isExporting, exportCsv, exportFromApi } = useExport({
 *   fileNamePrefix: "analytics-report",
 * });
 *
 * // Export client-side data
 * const columns = [
 *   { key: "name", label: "Name" },
 *   { key: "views", label: "Views" },
 * ];
 * exportCsv(data, columns, "page-views");
 *
 * // Export from API
 * await exportFromApi("/api/analytics/export", { type: "summary" });
 * ```
 */
export function useExport({
  exportBaseUrl = "/api",
  fileNamePrefix = "export",
  onExportStart,
  onExportSuccess,
  onExportError,
}: UseExportOptions = {}): UseExportResult {
  const [isExporting, setIsExporting] = useState(false);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, []);

  const exportCsv = useCallback(
    <T,>(data: T[], columns: ExportColumn<T>[], filename?: string) => {
      setIsExporting(true);
      onExportStart?.("csv");

      try {
        // Build CSV header
        const headers = columns.map((col) => `"${col.label}"`).join(",");

        // Build CSV rows
        const rows = data.map((item) =>
          columns
            .map((col) => {
              const value = typeof col.key === "string" && col.key.includes(".")
                ? col.key.split(".").reduce((obj, key) => {
                    return obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key] : undefined;
                  }, item as unknown)
                : item[col.key as keyof T];

              const formattedValue = col.format ? col.format(value) : String(value ?? "");

              // Escape quotes and wrap in quotes
              return `"${formattedValue.replace(/"/g, '""')}"`;
            })
            .join(",")
        );

        // Combine header and rows
        const csv = [headers, ...rows].join("\n");

        // Add BOM for Excel UTF-8 compatibility
        const bom = "\uFEFF";
        const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });

        const finalFilename = filename
          ? `${filename}.csv`
          : `${fileNamePrefix}-${new Date().toISOString().split("T")[0]}.csv`;

        downloadBlob(blob, finalFilename);
        onExportSuccess?.("csv");
      } catch (error) {
        console.error("CSV export error:", error);
        onExportError?.("csv", error instanceof Error ? error : new Error("Export failed"));
      } finally {
        setIsExporting(false);
      }
    },
    [fileNamePrefix, downloadBlob, onExportStart, onExportSuccess, onExportError]
  );

  const exportFromApi = useCallback(
    async (endpoint: string, params?: Record<string, string>, filename?: string) => {
      setIsExporting(true);

      // Determine format from endpoint or params
      const format: ExportFormat = endpoint.includes("excel") || endpoint.includes("xlsx")
        ? "xlsx"
        : endpoint.includes("pdf")
          ? "pdf"
          : endpoint.includes("json")
            ? "json"
            : "csv";

      onExportStart?.(format);

      try {
        const url = endpoint.startsWith("http") ? endpoint : `${exportBaseUrl}${endpoint}`;
        const queryString = params ? `?${new URLSearchParams(params).toString()}` : "";

        const response = await fetch(`${url}${queryString}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Export failed: ${response.statusText}`);
        }

        // Handle PDF that returns HTML for printing
        if (format === "pdf") {
          const html = await response.text();
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
            }, 500);
          }
        } else {
          const blob = await response.blob();
          const extension = format === "xlsx" ? "xlsx" : format === "json" ? "json" : "csv";
          const finalFilename = filename
            ? `${filename}.${extension}`
            : `${fileNamePrefix}-${new Date().toISOString().split("T")[0]}.${extension}`;

          downloadBlob(blob, finalFilename);
        }

        onExportSuccess?.(format);
      } catch (error) {
        console.error("API export error:", error);
        onExportError?.(format, error instanceof Error ? error : new Error("Export failed"));
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [exportBaseUrl, fileNamePrefix, downloadBlob, onExportStart, onExportSuccess, onExportError]
  );

  const printContent = useCallback((htmlContent: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }, []);

  return {
    isExporting,
    exportCsv,
    exportFromApi,
    downloadBlob,
    printContent,
  };
}
