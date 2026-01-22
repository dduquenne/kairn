// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

interface ExportButtonProps {
  startDate?: string;
  endDate?: string;
  timeRange?: "day" | "week" | "month" | "year";
}

export function ExportButton({ startDate, endDate, timeRange = "week" }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportTypes = [
    { value: "summary", label: "Resume" },
    { value: "sections", label: "Sections" },
    { value: "traffic-sources", label: "Sources de trafic" },
    { value: "devices", label: "Appareils" },
    { value: "visits", label: "Visites detaillees" },
    { value: "conversions", label: "Conversions" },
  ];

  const handleExport = async (type: string) => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ type });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/analytics/export?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${type}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      alert("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/analytics/export-excel?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-psypnos-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsOpen(false);
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Erreur lors de l'export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ format: "html", timeRange });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/analytics/export-pdf?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const html = await response.text();

      // Open in new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        // Trigger print after a short delay to let content load
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      setIsOpen(false);
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Erreur lors de l'export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-medium text-gold hover:bg-gold/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Exporter les données"
      >
        <Download size={16} />
        <span className="hidden sm:inline">Exporter</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-gold/30 bg-gradient-to-br from-night/95 to-night/90 py-2 shadow-xl backdrop-blur-sm">
            {/* Featured Exports */}
            <div className="mb-2 px-3 pb-2 border-b border-gold/20">
              <p className="text-xs font-semibold text-gold mb-2">Exports Recommandes</p>
              <div className="space-y-2">
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="flex w-full items-center gap-2 rounded-md bg-gold/20 px-3 py-2 text-left text-sm font-medium text-gold hover:bg-gold/30 transition disabled:opacity-50 border border-gold/40"
                >
                  <FileSpreadsheet size={16} />
                  Export complet Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex w-full items-center gap-2 rounded-md bg-ivory/10 px-3 py-2 text-left text-sm font-medium text-ivory hover:bg-ivory/20 transition disabled:opacity-50 border border-ivory/20"
                >
                  <Printer size={16} />
                  Rapport PDF / Imprimer
                </button>
              </div>
            </div>

            {/* CSV Exports */}
            <div className="px-3 pt-2">
              <p className="text-xs font-semibold text-gold/70 mb-2">Format CSV</p>
            </div>
            {exportTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleExport(type.value)}
                disabled={isExporting}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ivory/80 hover:bg-gold/10 transition disabled:opacity-50"
              >
                <FileText size={14} className="text-ivory/50" />
                {type.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
