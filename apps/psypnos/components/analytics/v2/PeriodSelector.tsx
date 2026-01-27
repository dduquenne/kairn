"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, Clock, Check } from "lucide-react";

export type PeriodType =
  | "realtime"
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "last3months"
  | "thisYear"
  | "custom";

interface PeriodOption {
  value: PeriodType;
  label: string;
  shortLabel: string;
  icon?: React.ReactNode;
  description?: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  {
    value: "realtime",
    label: "Temps réel",
    shortLabel: "Live",
    icon: <Clock size={14} className="text-green-400" />,
    description: "Dernière heure, actualisation auto",
  },
  {
    value: "today",
    label: "Aujourd'hui",
    shortLabel: "Auj.",
    description: "Depuis minuit",
  },
  {
    value: "yesterday",
    label: "Hier",
    shortLabel: "Hier",
    description: "Journée complète",
  },
  {
    value: "last7days",
    label: "7 derniers jours",
    shortLabel: "7j",
    description: "Semaine glissante",
  },
  {
    value: "last30days",
    label: "30 derniers jours",
    shortLabel: "30j",
    description: "Mois glissant",
  },
  {
    value: "thisMonth",
    label: "Ce mois",
    shortLabel: "Mois",
    description: "Depuis le 1er",
  },
  {
    value: "lastMonth",
    label: "Mois dernier",
    shortLabel: "M-1",
    description: "Mois complet précédent",
  },
  {
    value: "last3months",
    label: "3 derniers mois",
    shortLabel: "3m",
    description: "Trimestre glissant",
  },
  {
    value: "thisYear",
    label: "Cette année",
    shortLabel: "Année",
    description: "Depuis janvier",
  },
  {
    value: "custom",
    label: "Personnalisé",
    shortLabel: "Custom",
    icon: <Calendar size={14} />,
    description: "Choisir les dates",
  },
];

interface PeriodSelectorProps {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
}

export function PeriodSelector({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: PeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(customStartDate || "");
  const [tempEndDate, setTempEndDate] = useState(customEndDate || "");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = PERIOD_OPTIONS.find((opt) => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowCustomPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize temp dates when opening custom picker
  useEffect(() => {
    if (showCustomPicker) {
      const defaultStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0] ?? "";
      const defaultEnd = new Date().toISOString().split("T")[0] ?? "";
      setTempStartDate(customStartDate || defaultStart);
      setTempEndDate(customEndDate || defaultEnd);
    }
  }, [showCustomPicker, customStartDate, customEndDate]);

  const handleOptionClick = (option: PeriodOption) => {
    if (option.value === "custom") {
      setShowCustomPicker(true);
    } else {
      onChange(option.value);
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const handleApplyCustomDates = () => {
    if (tempStartDate && tempEndDate && onCustomDateChange) {
      onCustomDateChange(tempStartDate, tempEndDate);
      onChange("custom");
    }
    setIsOpen(false);
    setShowCustomPicker(false);
  };

  const formatCustomLabel = () => {
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
      const end = new Date(customEndDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
      return `${start} - ${end}`;
    }
    return "Personnalisé";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg border transition-colors ${
          isOpen
            ? "border-gold bg-gold/10 text-gold"
            : "border-gold/30 bg-gold/5 text-ivory hover:border-gold/50"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {selectedOption?.icon || <Calendar size={16} className="text-gold flex-shrink-0" />}
        <span className="text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-none">
          {value === "custom" ? formatCustomLabel() : (
            <>
              <span className="hidden sm:inline">{selectedOption?.label}</span>
              <span className="sm:hidden">{selectedOption?.shortLabel}</span>
            </>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
        {value === "realtime" && (
          <motion.span
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gold/20 bg-night/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden z-[100]"
          >
            {!showCustomPicker ? (
              <>
                {/* Quick Presets */}
                <div className="p-2">
                  <p className="px-3 py-2 text-xs text-ivory/40 uppercase tracking-wider">
                    Période rapide
                  </p>
                  <div className="space-y-0.5">
                    {PERIOD_OPTIONS.slice(0, 5).map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => handleOptionClick(option)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                          value === option.value
                            ? "bg-gold/20 text-gold"
                            : "text-ivory hover:bg-ivory/5"
                        }`}
                        whileHover={{ x: 2 }}
                      >
                        <div className="flex items-center gap-3">
                          {option.icon || (
                            <div className="w-3.5 h-3.5 rounded-full border border-current opacity-50" />
                          )}
                          <div>
                            <span className="text-sm font-medium">
                              {option.label}
                            </span>
                            {option.description && (
                              <p className="text-xs text-ivory/40">
                                {option.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {value === option.value && (
                          <Check size={16} className="text-gold" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gold/10" />

                {/* Extended Periods */}
                <div className="p-2">
                  <p className="px-3 py-2 text-xs text-ivory/40 uppercase tracking-wider">
                    Période étendue
                  </p>
                  <div className="space-y-0.5">
                    {PERIOD_OPTIONS.slice(5, 9).map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => handleOptionClick(option)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                          value === option.value
                            ? "bg-gold/20 text-gold"
                            : "text-ivory hover:bg-ivory/5"
                        }`}
                        whileHover={{ x: 2 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full border border-current opacity-50" />
                          <div>
                            <span className="text-sm font-medium">
                              {option.label}
                            </span>
                            {option.description && (
                              <p className="text-xs text-ivory/40">
                                {option.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {value === option.value && (
                          <Check size={16} className="text-gold" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gold/10" />

                {/* Custom Option */}
                <div className="p-2">
                  <motion.button
                    onClick={() => {
                      const customOption = PERIOD_OPTIONS.find(opt => opt.value === "custom");
                      if (customOption) handleOptionClick(customOption);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                      value === "custom"
                        ? "bg-gold/20 text-gold"
                        : "text-ivory hover:bg-ivory/5"
                    }`}
                    whileHover={{ x: 2 }}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={14} />
                      <div>
                        <span className="text-sm font-medium">Personnalisé</span>
                        <p className="text-xs text-ivory/40">
                          Choisir les dates exactes
                        </p>
                      </div>
                    </div>
                    {value === "custom" && (
                      <Check size={16} className="text-gold" />
                    )}
                  </motion.button>
                </div>
              </>
            ) : (
              /* Custom Date Picker */
              <div className="p-4">
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="text-xs text-gold hover:underline mb-4"
                >
                  ← Retour aux préréglages
                </button>

                <h4 className="text-sm font-semibold text-ivory mb-4">
                  Sélectionner une période
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-ivory/60 mb-1.5">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      max={tempEndDate || undefined}
                      className="w-full px-3 py-2 rounded-lg border border-gold/30 bg-night/50 text-ivory text-sm focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ivory/60 mb-1.5">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      min={tempStartDate || undefined}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 rounded-lg border border-gold/30 bg-night/50 text-ivory text-sm focus:border-gold focus:outline-none"
                    />
                  </div>

                  <motion.button
                    onClick={handleApplyCustomDates}
                    disabled={!tempStartDate || !tempEndDate}
                    className="w-full py-2.5 rounded-lg bg-gold text-night font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Appliquer
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
