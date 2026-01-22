"use client";

import { useState, useCallback } from "react";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { cn } from "@kairn/ui";

export interface ExportType {
  value: string;
  label: string;
}

export interface ExportButtonProps {
  /** Start date for the export range */
  startDate?: string;
  /** End date for the export range */
  endDate?: string;
  /** Time range preset */
  timeRange?: "day" | "week" | "month" | "year";
  /** Base URL for export API endpoints */
  exportBaseUrl?: string;
  /** Available CSV export types */
  csvExportTypes?: ExportType[];
  /** Whether Excel export is enabled */
  enableExcel?: boolean;
  /** Whether PDF export is enabled */
  enablePdf?: boolean;
  /** Callback on export start */
  onExportStart?: (type: string) => void;
  /** Callback on export success */
  onExportSuccess?: (type: string) => void;
  /** Callback on export error */
  onExportError?: (type: string, error: Error) => void;
  /** File name prefix for downloads */
  fileNamePrefix?: string;
  /** Custom class names */
  className?: string;
  /** Accent color */
  accentColor?: string;
}

const DEFAULT_CSV_TYPES: ExportType[] = [
  { value: "summary", label: "Resume" },
  { value: "sections", label: "Sections" },
  { value: "traffic-sources", label: "Sources de trafic" },
  { value: "devices", label: "Appareils" },
  { value: "visits", label: "Visites detaillees" },
  { value: "conversions", label: "Conversions" },
];

/**
 * ExportButton - Export dropdown for analytics data
 *
 * @example
 * ```tsx
 * <ExportButton
 *   startDate={filters.startDate}
 *   endDate={filters.endDate}
 *   exportBaseUrl="/api/analytics"
 *   fileNamePrefix="analytics-mysite"
 *   onExportSuccess={(type) => toast.success(`${type} exported`)}
 * />
 * ```
 */
export function ExportButton({
  startDate,
  endDate,
  timeRange = "week",
  exportBaseUrl = "/api/analytics",
  csvExportTypes = DEFAULT_CSV_TYPES,
  enableExcel = true,
  enablePdf = true,
  onExportStart,
  onExportSuccess,
  onExportError,
  fileNamePrefix = "analytics",
  className,
  accentColor = "gold",
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const downloadFile = useCallback(
    async (url: string, filename: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
    },
    []
  );

  const handleExportCsv = useCallback(
    async (type: string) => {
      setIsExporting(true);
      onExportStart?.(type);

      try {
        const params = new URLSearchParams({ type });
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        await downloadFile(
          `${exportBaseUrl}/export?${params.toString()}`,
          `${fileNamePrefix}-${type}.csv`
        );

        onExportSuccess?.(type);
        setIsOpen(false);
      } catch (error) {
        console.error("Export error:", error);
        onExportError?.(type, error as Error);
      } finally {
        setIsExporting(false);
      }
    },
    [startDate, endDate, exportBaseUrl, fileNamePrefix, downloadFile, onExportStart, onExportSuccess, onExportError]
  );

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    onExportStart?.("excel");

    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      await downloadFile(
        `${exportBaseUrl}/export-excel?${params.toString()}`,
        `${fileNamePrefix}-${new Date().toISOString().split("T")[0]}.xlsx`
      );

      onExportSuccess?.("excel");
      setIsOpen(false);
    } catch (error) {
      console.error("Excel export error:", error);
      onExportError?.("excel", error as Error);
    } finally {
      setIsExporting(false);
    }
  }, [startDate, endDate, exportBaseUrl, fileNamePrefix, downloadFile, onExportStart, onExportSuccess, onExportError]);

  const handleExportPdf = useCallback(async () => {
    setIsExporting(true);
    onExportStart?.("pdf");

    try {
      const params = new URLSearchParams({ format: "html", timeRange });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`${exportBaseUrl}/export-pdf?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const html = await response.text();

      // Open in new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      onExportSuccess?.("pdf");
      setIsOpen(false);
    } catch (error) {
      console.error("PDF export error:", error);
      onExportError?.("pdf", error as Error);
    } finally {
      setIsExporting(false);
    }
  }, [startDate, endDate, timeRange, exportBaseUrl, onExportStart, onExportSuccess, onExportError]);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
          `border-${accentColor}/30 bg-${accentColor}/10 text-${accentColor} hover:bg-${accentColor}/20`,
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        title="Exporter les donnees"
      >
        <Download size={16} />
        <span className="hidden sm:inline">Exporter</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div
            className={cn(
              "absolute right-0 z-50 mt-2 w-64 rounded-lg border py-2 shadow-xl backdrop-blur-sm",
              `border-${accentColor}/30 bg-gradient-to-br from-night/95 to-night/90`
            )}
          >
            {/* Featured Exports */}
            {(enableExcel || enablePdf) && (
              <div className={cn("mb-2 border-b px-3 pb-2", `border-${accentColor}/20`)}>
                <p className={cn("mb-2 text-xs font-semibold", `text-${accentColor}`)}>
                  Exports Recommandes
                </p>
                <div className="space-y-2">
                  {enableExcel && (
                    <button
                      onClick={handleExportExcel}
                      disabled={isExporting}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-medium transition",
                        `bg-${accentColor}/20 border-${accentColor}/40 text-${accentColor} hover:bg-${accentColor}/30`,
                        "disabled:opacity-50"
                      )}
                    >
                      <FileSpreadsheet size={16} />
                      Export complet Excel
                    </button>
                  )}
                  {enablePdf && (
                    <button
                      onClick={handleExportPdf}
                      disabled={isExporting}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-medium text-ivory transition",
                        "border-ivory/20 bg-ivory/10 hover:bg-ivory/20",
                        "disabled:opacity-50"
                      )}
                    >
                      <Printer size={16} />
                      Rapport PDF / Imprimer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CSV Exports */}
            {csvExportTypes.length > 0 && (
              <>
                <div className="px-3 pt-2">
                  <p className={cn("mb-2 text-xs font-semibold", `text-${accentColor}/70`)}>
                    Format CSV
                  </p>
                </div>
                {csvExportTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleExportCsv(type.value)}
                    disabled={isExporting}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ivory/80 transition",
                      `hover:bg-${accentColor}/10`,
                      "disabled:opacity-50"
                    )}
                  >
                    <FileText size={14} className="text-ivory/50" />
                    {type.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
