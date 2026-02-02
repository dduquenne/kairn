"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings2,
  Bell,
  Target,
  Share2,
  Users,
  Sparkles,
} from "lucide-react";

import { ConfigurationTabNavigation, type ConfigTabId } from "./_components/ConfigurationTabNavigation";
import { AlertsTab } from "./_components/AlertsTab";
import { GoalsTab } from "./_components/GoalsTab";
import { SocialNetworksTab } from "./_components/SocialNetworksTab";
import { UsersTab } from "./_components/UsersTab";
import type { Alert, Goal } from "../settings/types";

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  isActive: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  role: "admin";
  createdAt: string;
  updatedAt: string;
}

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<ConfigTabId>("alerts");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, goalsRes, socialRes, usersRes] = await Promise.all([
        fetch("/api/analytics/alerts"),
        fetch("/api/analytics/goals"),
        fetch("/api/social/accounts"),
        fetch("/api/admin/users"),
      ]);

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }

      if (goalsRes.ok) {
        const data = await goalsRes.json();
        setGoals(Array.isArray(data) ? data : []);
      }

      if (socialRes.ok) {
        const data = await socialRes.json();
        setSocialAccounts(data.accounts || []);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : []);
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
  const activeAccounts = socialAccounts.filter((a) => a.isActive).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-sm text-ivory/60">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
            <Settings2 className="h-7 w-7 text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ivory">Configuration</h1>
            <p className="text-sm text-ivory/60">
              Gérez l'ensemble des paramètres de votre site
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 rounded-2xl bg-gradient-to-r from-night/80 to-night/60 p-4 sm:p-6 border border-ivory/10 sm:grid-cols-4"
      >
        <QuickStat
          icon={Bell}
          label="Alertes actives"
          value={enabledAlerts}
          total={alerts.length}
          color="text-amber-400"
        />
        <QuickStat
          icon={Target}
          label="Objectifs actifs"
          value={enabledGoals}
          total={goals.length}
          color="text-emerald-400"
        />
        <QuickStat
          icon={Share2}
          label="Comptes sociaux"
          value={activeAccounts}
          total={socialAccounts.length}
          color="text-blue-400"
        />
        <QuickStat
          icon={Users}
          label="Utilisateurs"
          value={users.length}
          color="text-purple-400"
        />
      </motion.div>

      {/* Tab Navigation */}
      <ConfigurationTabNavigation
        activeTab={activeTab}
        onChange={setActiveTab}
        badges={{
          alerts: enabledAlerts,
          goals: enabledGoals,
          social: activeAccounts,
          users: users.length,
        }}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "alerts" && (
            <AlertsTab
              alerts={alerts}
              onRefresh={fetchData}
            />
          )}

          {activeTab === "goals" && (
            <GoalsTab
              goals={goals}
              onRefresh={fetchData}
            />
          )}

          {activeTab === "social" && (
            <SocialNetworksTab
              accounts={socialAccounts}
              onRefresh={fetchData}
            />
          )}

          {activeTab === "users" && (
            <UsersTab
              users={users}
              onRefresh={fetchData}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/5 to-transparent p-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20">
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-ivory">Conseils de configuration</h3>
            <ul className="mt-2 space-y-2 text-sm text-ivory/70">
              <li className="flex items-start gap-2">
                <Bell className="mt-0.5 h-4 w-4 text-amber-400 flex-shrink-0" />
                <span>
                  Configurez des alertes pour être notifié en cas de baisse significative du trafic ou des conversions.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="mt-0.5 h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Définissez des objectifs clairs pour suivre vos KPIs et mesurer votre progression.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Share2 className="mt-0.5 h-4 w-4 text-blue-400 flex-shrink-0" />
                <span>
                  Connectez vos réseaux sociaux pour automatiser la publication de vos contenus.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 text-purple-400 flex-shrink-0" />
                <span>
                  Gérez les accès administrateur et renforcez la sécurité avec des mots de passe forts.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total?: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-night/60 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-ivory">
          {value}
          {total !== undefined && (
            <span className="text-sm font-normal text-ivory/40">/{total}</span>
          )}
        </p>
        <p className="text-xs text-ivory/50">{label}</p>
      </div>
    </div>
  );
}
