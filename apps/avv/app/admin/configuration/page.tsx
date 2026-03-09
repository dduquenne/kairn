'use client';

import {
  AlertsTab,
  ConfigurationTabNavigation,
  GoalsTab,
  SocialNetworksTab,
  UsersTab,
  type Alert,
  type ConfigGoal,
  type ConfigTabId,
  type SocialAccount,
  type AdminUser,
} from '@kairn/admin';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Bell, Target, Share2, Users, Sparkles } from 'lucide-react';
import { useState, useCallback, useEffect, useMemo } from 'react';

import { useToast } from '@/lib/toast-context';

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<ConfigTabId>('alerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [goals, setGoals] = useState<ConfigGoal[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const toast = useMemo(() => ({ addToast }), [addToast]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, goalsRes, socialRes, usersRes] = await Promise.all([
        fetch('/api/analytics/alerts'),
        fetch('/api/analytics/goals'),
        fetch('/api/social/accounts'),
        fetch('/api/admin/users'),
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
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enabledAlerts = alerts.filter(a => a.enabled).length;
  const enabledGoals = goals.filter(g => g.enabled).length;
  const activeAccounts = socialAccounts.filter(a => a.isActive).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="border-gold h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-ivory/60 text-sm">Chargement de la configuration...</p>
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
          <div className="from-gold/20 to-gold/5 border-gold/20 flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br">
            <Settings2 className="text-gold h-7 w-7" />
          </div>
          <div>
            <h1 className="text-ivory text-2xl font-bold">Configuration</h1>
            <p className="text-ivory/60 text-sm">Gérez l'ensemble des paramètres de votre site</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="from-night/80 to-night/60 border-ivory/10 grid grid-cols-2 gap-3 rounded-2xl border bg-gradient-to-r p-4 sm:grid-cols-4 sm:p-6"
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
        <QuickStat icon={Users} label="Utilisateurs" value={users.length} color="text-purple-400" />
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
          {activeTab === 'alerts' && <AlertsTab alerts={alerts} onRefresh={fetchData} />}

          {activeTab === 'goals' && <GoalsTab goals={goals} onRefresh={fetchData} />}

          {activeTab === 'social' && (
            <SocialNetworksTab accounts={socialAccounts} onRefresh={fetchData} toast={toast} />
          )}

          {activeTab === 'users' && <UsersTab users={users} onRefresh={fetchData} toast={toast} />}
        </motion.div>
      </AnimatePresence>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border-gold/20 from-gold/5 rounded-2xl border bg-gradient-to-r to-transparent p-6"
      >
        <div className="flex items-start gap-4">
          <div className="bg-gold/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <Sparkles className="text-gold h-5 w-5" />
          </div>
          <div>
            <h3 className="text-ivory font-semibold">Conseils de configuration</h3>
            <ul className="text-ivory/70 mt-2 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Bell className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                <span>
                  Configurez des alertes pour être notifié en cas de baisse significative du trafic
                  ou des conversions.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                <span>
                  Définissez des objectifs clairs pour suivre vos KPIs et mesurer votre progression.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Share2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                <span>
                  Connectez vos réseaux sociaux pour automatiser la publication de vos contenus.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
                <span>
                  Gérez les accès administrateur et renforcez la sécurité avec des mots de passe
                  forts.
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
    <div className="flex items-center gap-2 sm:gap-3">
      <div
        className={`bg-night/60 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${color}`}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-ivory text-lg font-bold sm:text-xl">
          {value}
          {total !== undefined && (
            <span className="text-ivory/40 text-sm font-normal">/{total}</span>
          )}
        </p>
        <p className="text-ivory/50 truncate text-[11px] sm:text-xs">{label}</p>
      </div>
    </div>
  );
}
