/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
}

export function DateRangePicker({ startDate, endDate, onDateChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  const handleApply = () => {
    onDateChange(localStartDate, localEndDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
    setIsOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gold/30 bg-night/60 px-3 py-2 text-sm text-ivory hover:bg-gold/10 transition"
      >
        <Calendar size={16} className="text-gold" />
        <span>
          {formatDate(startDate)} - {formatDate(endDate)}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleCancel}
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gold/30 bg-gradient-to-br from-night/95 to-night/90 p-4 shadow-xl backdrop-blur-sm">
            <h3 className="mb-3 text-sm font-semibold text-gold">Plage de dates personnalisée</h3>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-ivory/70">Date de début</label>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-ivory/70">Date de fin</label>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-gold/30 px-3 py-2 text-sm text-ivory hover:bg-gold/10 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleApply}
                className="flex-1 rounded-lg bg-gold/20 border border-gold/50 px-3 py-2 text-sm font-medium text-gold hover:bg-gold/30 transition"
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
