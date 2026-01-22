"use client";

import { useState, useCallback } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@kairn/ui";

export interface DateRangePickerProps {
  /** Start date in YYYY-MM-DD format */
  startDate: string;
  /** End date in YYYY-MM-DD format */
  endDate: string;
  /** Callback when dates change */
  onDateChange: (startDate: string, endDate: string) => void;
  /** Locale for date formatting */
  locale?: string;
  /** Custom class names */
  className?: string;
  /** Accent color */
  accentColor?: string;
  /** Date format options */
  dateFormatOptions?: Intl.DateTimeFormatOptions;
  /** Quick presets to show */
  presets?: Array<{
    label: string;
    getValue: () => { startDate: string; endDate: string };
  }>;
}

const formatDateString = (date: Date): string => {
  return date.toISOString().split("T")[0] ?? "";
};

const DEFAULT_PRESETS: Array<{
  label: string;
  getValue: () => { startDate: string; endDate: string };
}> = [
  {
    label: "7 derniers jours",
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return {
        startDate: formatDateString(start),
        endDate: formatDateString(end),
      };
    },
  },
  {
    label: "30 derniers jours",
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return {
        startDate: formatDateString(start),
        endDate: formatDateString(end),
      };
    },
  },
  {
    label: "Ce mois",
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: formatDateString(start),
        endDate: formatDateString(now),
      };
    },
  },
  {
    label: "Mois dernier",
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: formatDateString(start),
        endDate: formatDateString(end),
      };
    },
  },
];

/**
 * DateRangePicker - Date range selector for filtering data
 *
 * @example
 * ```tsx
 * <DateRangePicker
 *   startDate={filters.startDate}
 *   endDate={filters.endDate}
 *   onDateChange={(start, end) => setFilters({ ...filters, startDate: start, endDate: end })}
 * />
 * ```
 */
export function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  locale = "fr-FR",
  className,
  accentColor = "gold",
  dateFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
  presets = DEFAULT_PRESETS,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  const handleApply = useCallback(() => {
    onDateChange(localStartDate, localEndDate);
    setIsOpen(false);
  }, [localStartDate, localEndDate, onDateChange]);

  const handleCancel = useCallback(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
    setIsOpen(false);
  }, [startDate, endDate]);

  const handlePreset = useCallback(
    (preset: (typeof presets)[0]) => {
      const { startDate: start, endDate: end } = preset.getValue();
      setLocalStartDate(start);
      setLocalEndDate(end);
      onDateChange(start, end);
      setIsOpen(false);
    },
    [onDateChange]
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, dateFormatOptions);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-ivory transition",
          `border-${accentColor}/30 bg-night/60 hover:bg-${accentColor}/10`
        )}
      >
        <Calendar size={16} className={`text-${accentColor}`} />
        <span>
          {formatDate(startDate)} - {formatDate(endDate)}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={handleCancel} />

          {/* Dropdown */}
          <div
            className={cn(
              "absolute right-0 z-50 mt-2 w-80 rounded-lg border p-4 shadow-xl backdrop-blur-sm",
              `border-${accentColor}/30 bg-gradient-to-br from-night/95 to-night/90`
            )}
          >
            {/* Quick Presets */}
            {presets.length > 0 && (
              <div className="mb-4 border-b border-gold/20 pb-4">
                <p className={cn("mb-2 text-xs font-semibold", `text-${accentColor}/70`)}>
                  Raccourcis
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePreset(preset)}
                      className={cn(
                        "rounded-md px-2 py-1.5 text-xs text-ivory/70 transition",
                        `hover:bg-${accentColor}/10 hover:text-ivory`
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <h3 className={cn("mb-3 text-sm font-semibold", `text-${accentColor}`)}>
              Plage personnalisee
            </h3>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-ivory/70">Date de debut</label>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border bg-night/50 px-3 py-2 text-sm text-ivory",
                    `border-${accentColor}/30 focus:border-${accentColor} focus:outline-none`
                  )}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-ivory/70">Date de fin</label>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border bg-night/50 px-3 py-2 text-sm text-ivory",
                    `border-${accentColor}/30 focus:border-${accentColor} focus:outline-none`
                  )}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCancel}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm text-ivory transition",
                  `border-${accentColor}/30 hover:bg-${accentColor}/10`
                )}
              >
                Annuler
              </button>
              <button
                onClick={handleApply}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition",
                  `bg-${accentColor}/20 border-${accentColor}/50 text-${accentColor} hover:bg-${accentColor}/30`
                )}
              >
                Appliquer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
