"use client";

import { useEffect, useState, useCallback } from "react";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { RealTimeIndicator } from "@/components/mobile/RealTimeIndicator";
import { SwipeableAlertCard } from "@/components/mobile/SwipeableAlertCard";
import { NotificationToastContainer } from "@/components/mobile/NotificationToast";
import { useRealTimeAnalytics } from "@/hooks/useRealTimeAnalytics";
import { useNotifications } from "@/hooks/useNotifications";
import {
  AlertTriangle,
  CheckCircle,
  Bell,
  BellOff,
  Filter,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Alert {
  id: string;
  type: "anomaly" | "spike" | "drop" | "info";
  title: string;
  message: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  read?: boolean;
}

interface ToastNotification {
  id: string;
  type: "drop" | "spike" | "error" | "slow";
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
}

type FilterType = "all" | "unread" | "high" | "medium" | "low";

export default function MobileAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const { sendNotification, sendBadgeUpdate } = useNotifications();

  const handleRealTimeUpdate = useCallback(
    (update: any) => {
      if (update.type === "anomaly") {
        const newAlert: Alert = {
          id: `alert-${Date.now()}`,
          type: update.data.type || "anomaly",
          title: update.data.title || "Nouvelle anomalie",
          message: update.data.message || "Une anomalie a été détectée",
          timestamp: update.timestamp,
          severity: update.data.severity || "medium",
          read: false,
        };

        setAlerts((prev) => [newAlert, ...prev]);

        const toastNotif: ToastNotification = {
          id: newAlert.id,
          type:
            newAlert.type === "anomaly"
              ? "error"
              : newAlert.type === "info"
                ? "slow"
                : (newAlert.type as "drop" | "spike"),
          title: newAlert.title,
          message: newAlert.message,
          severity: newAlert.severity,
        };
        setToastNotifications((prev) => [...prev, toastNotif]);

        sendNotification({
          title: newAlert.title,
          body: newAlert.message,
          tag: newAlert.id,
          data: { url: "/admin/analytics/mobile/alerts" },
        });

        sendBadgeUpdate(1);
      }
    },
    [sendNotification, sendBadgeUpdate]
  );

  const { isConnected, updateCount } = useRealTimeAnalytics({
    enabled: true,
    onUpdate: handleRealTimeUpdate,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/analytics/alerts");
      if (response.ok) {
        const result = await response.json();
        setAlerts(
          (result.alerts || []).map((a: Alert) => ({
            ...a,
            read: a.read ?? false,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissToast = useCallback((id: string) => {
    setToastNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleView = useCallback((id: string) => {
    // Mark as read when viewing
    handleMarkRead(id);
    // Could open a modal or navigate to detail view
  }, [handleMarkRead]);

  const handleMarkAllRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  const handleDeleteAll = useCallback(() => {
    setAlerts([]);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Calculate counts
  const unreadCount = alerts.filter((a) => !a.read).length;
  const highCount = alerts.filter((a) => a.severity === "high").length;

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    switch (filter) {
      case "unread":
        return !alert.read;
      case "high":
        return alert.severity === "high";
      case "medium":
        return alert.severity === "medium";
      case "low":
        return alert.severity === "low";
      default:
        return true;
    }
  });

  // Group alerts by severity for priority display
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gold/10 rounded-lg animate-pulse w-1/3" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gold/10 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <NotificationToastContainer
        notifications={toastNotifications}
        onDismiss={dismissToast}
      />

      <PullToRefresh onRefresh={loadData}>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-ivory">Alertes</h1>
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-red-500 text-white text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-ivory/50">
                {alerts.length > 0
                  ? `${alerts.length} alerte${alerts.length > 1 ? "s" : ""}${
                      highCount > 0 ? ` • ${highCount} critique${highCount > 1 ? "s" : ""}` : ""
                    }`
                  : "Aucune alerte"}
              </p>
            </motion.div>
            <RealTimeIndicator isConnected={isConnected} updateCount={updateCount} />
          </div>

          {/* Action bar */}
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-2"
            >
              {/* Filter button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    filter !== "all"
                      ? "bg-gold/20 border-gold/30 text-gold"
                      : "bg-ivory/5 border-ivory/10 text-ivory/60"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {filter === "all"
                      ? "Toutes"
                      : filter === "unread"
                        ? "Non lues"
                        : filter === "high"
                          ? "Critiques"
                          : filter === "medium"
                            ? "Moyennes"
                            : "Faibles"}
                  </span>
                </button>

                {/* Filter dropdown */}
                <AnimatePresence>
                  {showFilterMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-40 bg-night border border-gold/20 rounded-xl overflow-hidden shadow-xl z-10"
                    >
                      {(["all", "unread", "high", "medium", "low"] as FilterType[]).map(
                        (f) => (
                          <button
                            key={f}
                            onClick={() => {
                              setFilter(f);
                              setShowFilterMenu(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                              filter === f
                                ? "bg-gold/20 text-gold"
                                : "text-ivory/70 hover:bg-ivory/5"
                            }`}
                          >
                            {f === "all"
                              ? "Toutes"
                              : f === "unread"
                                ? "Non lues"
                                : f === "high"
                                  ? "Critiques"
                                  : f === "medium"
                                    ? "Moyennes"
                                    : "Faibles"}
                          </button>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ivory/5 border border-ivory/10 text-ivory/60 text-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Tout lire</span>
                  </button>
                )}
                <button
                  onClick={handleDeleteAll}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Effacer</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Swipe hint */}
          {alerts.length > 0 && (
            <p className="text-xs text-ivory/30 text-center">
              Glissez vers la droite pour marquer comme lu, vers la gauche pour supprimer
            </p>
          )}

          {/* Alerts list */}
          {sortedAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 px-6"
            >
              <div className="p-4 rounded-2xl bg-green-500/10 mb-4">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
              <p className="text-lg font-medium text-ivory mb-2">
                {filter === "all" ? "Tout va bien !" : "Aucune alerte"}
              </p>
              <p className="text-sm text-ivory/50 text-center">
                {filter === "all"
                  ? "Aucune anomalie détectée dans vos statistiques"
                  : "Aucune alerte ne correspond à ce filtre"}
              </p>
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className="mt-4 text-sm text-gold underline"
                >
                  Voir toutes les alertes
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3">
              {sortedAlerts.map((alert, index) => (
                <SwipeableAlertCard
                  key={alert.id}
                  alert={alert}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onView={handleView}
                  index={index}
                />
              ))}
            </div>
          )}

          {/* Notification settings hint */}
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 py-4"
            >
              <Bell className="h-4 w-4 text-ivory/30" />
              <p className="text-xs text-ivory/30">
                Configurez vos notifications dans Réglages
              </p>
            </motion.div>
          )}
        </div>
      </PullToRefresh>
    </>
  );
}
