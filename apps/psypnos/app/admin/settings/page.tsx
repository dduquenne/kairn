"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Target,
  Settings2,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { AlertsConfigurationPanel } from "./components/AlertsConfigurationPanel";
import { GoalsConfigurationPanel } from "./components/GoalsConfigurationPanel";
import type { Alert, Goal } from "./types";

type ActiveSection = "alerts" | "goals" | null;

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [alertsRes, goalsRes] = await Promise.all([
        fetch("/api/analytics/alerts"),
        fetch("/api/analytics/goals"),
      ]);

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }

      if (goalsRes.ok) {
        const data = await goalsRes.json();
        setGoals(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enabledAlerts = alerts.filter((a) => a.enabled).length;
  const enabledGoals = goals.filter((g) => g.enabled).length;
  const totalTriggers = alerts.reduce((sum, a) => sum + (a.triggerCount || 0), 0);

  const sections = [
    {
      id: "alerts" as const,
      title: "Alertes",
      description: "Configurez des alertes automatiques pour surveiller vos métriques",
      icon: Bell,
      color: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
      iconColor: "text-amber-400",
      stats: [
        { label: "Alertes actives", value: enabledAlerts },
        { label: "Déclenchements", value: totalTriggers },
      ],
    },
    {
      id: "goals" as const,
      title: "Objectifs",
      description: "Définissez des objectifs pour mesurer vos performances",
      icon: Target,
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30",
      iconColor: "text-emerald-400",
      stats: [
        { label: "Objectifs actifs", value: enabledGoals },
        { label: "Total définis", value: goals.length },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-sm text-ivory/60">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
          <Settings2 className="h-7 w-7 text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ivory">Configuration</h1>
          <p className="text-sm text-ivory/60">
            Gérez vos alertes et objectifs d'analyse
          </p>
        </div>
      </motion.div>

      {/* Quick Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 rounded-2xl bg-gradient-to-r from-night/80 to-night/60 p-4 border border-ivory/10 sm:gap-4 sm:p-6 sm:grid-cols-4"
      >
        <QuickStat
          icon={Bell}
          label="Alertes configurées"
          value={alerts.length}
          color="text-amber-400"
        />
        <QuickStat
          icon={Activity}
          label="Alertes actives"
          value={enabledAlerts}
          color="text-green-400"
        />
        <QuickStat
          icon={Target}
          label="Objectifs définis"
          value={goals.length}
          color="text-emerald-400"
        />
        <QuickStat
          icon={TrendingUp}
          label="Objectifs actifs"
          value={enabledGoals}
          color="text-blue-400"
        />
      </motion.div>

      {/* Section Cards */}
      <AnimatePresence mode="wait">
        {activeSection === null ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid gap-6 lg:grid-cols-2"
          >
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.button
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  onClick={() => setActiveSection(section.id)}
                  className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${section.color} ${section.borderColor} p-6 text-left transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-gold/5`}
                >
                  {/* Background decoration */}
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-night/40 ${section.iconColor}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-ivory/40 transition-transform group-hover:translate-x-1 group-hover:text-ivory/60" />
                    </div>

                    <h2 className="mt-4 text-xl font-semibold text-ivory">
                      {section.title}
                    </h2>
                    <p className="mt-2 text-sm text-ivory/60">
                      {section.description}
                    </p>

                    <div className="mt-6 flex gap-6">
                      {section.stats.map((stat) => (
                        <div key={stat.label}>
                          <p className="text-2xl font-bold text-ivory">{stat.value}</p>
                          <p className="text-xs text-ivory/50">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        ) : activeSection === "alerts" ? (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <AlertsConfigurationPanel
              alerts={alerts}
              onBack={() => setActiveSection(null)}
              onRefresh={fetchData}
            />
          </motion.div>
        ) : (
          <motion.div
            key="goals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GoalsConfigurationPanel
              goals={goals}
              onBack={() => setActiveSection(null)}
              onRefresh={fetchData}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips Section */}
      {activeSection === null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/5 to-transparent p-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20">
              <Sparkles className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-ivory">Conseils</h3>
              <ul className="mt-2 space-y-2 text-sm text-ivory/70">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" />
                  <span>
                    Configurez des alertes pour être notifié en cas de baisse
                    significative du trafic ou des conversions.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span>
                    Définissez des objectifs clairs pour suivre vos KPIs et
                    mesurer votre progression.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-night/60 sm:h-10 sm:w-10 sm:rounded-xl ${color}`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-ivory sm:text-xl">{value}</p>
        <p className="truncate text-[11px] text-ivory/50 sm:text-xs">{label}</p>
      </div>
    </div>
  );
}
