// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Power,
  Mail,
  Globe,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  History,
  RefreshCw,
} from "lucide-react";

interface Alert {
  id: string;
  name: string;
  description?: string;
  type: "threshold" | "anomaly" | "trend";
  metric: string;
  condition: string;
  threshold: number;
  timeWindow: string;
  channels: string[];
  emailRecipients?: string[];
  webhookUrl?: string;
  enabled: boolean;
  lastTriggered?: string;
  lastValue?: number;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AlertHistory {
  id: string;
  alertId: string;
  alertName: string;
  triggeredAt: string;
  metric: string;
  condition: string;
  threshold: number;
  actualValue: number;
  message: string;
  notificationsSent: Array<{ channel: string; success: boolean; error?: string }>;
}

const metricLabels: Record<string, string> = {
  visits: "Visites",
  sessions: "Sessions",
  conversions: "Conversions",
  conversion_rate: "Taux de conversion",
  avg_time: "Temps moyen",
  bounce_rate: "Taux de rebond",
};

const conditionLabels: Record<string, string> = {
  greater_than: "Superieur a",
  less_than: "Inferieur a",
  equals: "Egal a",
  change_percent: "Variation de",
};

const timeWindowLabels: Record<string, string> = {
  hour: "Derniere heure",
  day: "Dernieres 24h",
  week: "Derniere semaine",
  month: "Dernier mois",
};

export function AlertsManager() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: "threshold" | "anomaly" | "trend";
    metric: string;
    condition: string;
    threshold: number;
    timeWindow: string;
    channels: string[];
    emailRecipients: string;
    webhookUrl: string;
    enabled: boolean;
  }>({
    name: "",
    description: "",
    type: "threshold",
    metric: "visits",
    condition: "greater_than",
    threshold: 0,
    timeWindow: "day",
    channels: [],
    emailRecipients: "",
    webhookUrl: "",
    enabled: true,
  });

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics/alerts");
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics/alerts?id=&includeHistory=true");
      // Actually get history from a different endpoint
      const historyResponse = await fetch("/api/analytics/anomalies?action=detect");
      if (historyResponse.ok) {
        // For now, we'll use alert history from individual alerts
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCheckAlerts = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/cron/check-alerts");
      if (response.ok) {
        await fetchAlerts();
      }
    } catch (error) {
      console.error("Error checking alerts:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Nettoyer les emailRecipients: filtrer les entrées vides et convertir en undefined si vide
    const cleanedEmailRecipients = formData.emailRecipients
      ? formData.emailRecipients.split(",").map((e) => e.trim()).filter((e) => e.length > 0)
      : [];

    const payload = {
      name: formData.name,
      type: formData.type,
      metric: formData.metric,
      condition: formData.condition,
      threshold: formData.threshold,
      timeWindow: formData.timeWindow,
      channels: formData.channels,
      enabled: formData.enabled,
      // Ne pas envoyer description si vide (évite erreur de validation)
      ...(formData.description ? { description: formData.description } : {}),
      // Ne pas envoyer emailRecipients si tableau vide
      ...(cleanedEmailRecipients.length > 0 ? { emailRecipients: cleanedEmailRecipients } : {}),
      // Ne pas envoyer webhookUrl si vide (évite erreur de validation URL)
      ...(formData.webhookUrl ? { webhookUrl: formData.webhookUrl } : {}),
    };

    try {
      const url = editingAlert
        ? `/api/analytics/alerts?id=${editingAlert.id}`
        : "/api/analytics/alerts";
      const method = editingAlert ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setEditingAlert(null);
        resetForm();
        await fetchAlerts();
      }
    } catch (error) {
      console.error("Error saving alert:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette alerte ?")) return;

    try {
      const response = await fetch(`/api/analytics/alerts?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchAlerts();
      }
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  const handleToggle = async (alert: Alert) => {
    try {
      const response = await fetch(`/api/analytics/alerts?id=${alert.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !alert.enabled }),
      });
      if (response.ok) {
        await fetchAlerts();
      }
    } catch (error) {
      console.error("Error toggling alert:", error);
    }
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setFormData({
      name: alert.name,
      description: alert.description || "",
      type: alert.type,
      metric: alert.metric,
      condition: alert.condition,
      threshold: alert.threshold,
      timeWindow: alert.timeWindow,
      channels: alert.channels,
      emailRecipients: alert.emailRecipients?.join(", ") || "",
      webhookUrl: alert.webhookUrl || "",
      enabled: alert.enabled,
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "threshold",
      metric: "visits",
      condition: "greater_than",
      threshold: 0,
      timeWindow: "day",
      channels: [],
      emailRecipients: "",
      webhookUrl: "",
      enabled: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin text-gold" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="text-gold" size={24} />
          <h3 className="text-lg font-semibold text-ivory">Gestion des Alertes</h3>
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">
            {alerts.filter((a) => a.enabled).length} actives
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCheckAlerts}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-sm text-ivory transition-colors hover:bg-gold/10"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            Verifier
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingAlert(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-night transition-colors hover:bg-gold/90"
          >
            <Plus size={16} />
            Nouvelle Alerte
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-lg border border-gold/20 bg-night/40 p-8 text-center">
            <Bell className="mx-auto mb-3 text-gold/40" size={48} />
            <p className="text-ivory/60">Aucune alerte configuree</p>
            <p className="mt-1 text-sm text-ivory/40">
              Creez votre premiere alerte pour etre notifie des changements importants.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border ${
                alert.enabled ? "border-gold/30" : "border-ivory/10"
              } bg-night/40 p-4 transition-all hover:bg-night/60`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        alert.type === "threshold"
                          ? "bg-blue-500/20 text-blue-400"
                          : alert.type === "anomaly"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {alert.type === "threshold" ? (
                        <AlertTriangle size={16} />
                      ) : alert.type === "anomaly" ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingUp size={16} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-ivory">{alert.name}</h4>
                      <p className="text-sm text-ivory/60">
                        {metricLabels[alert.metric]} {conditionLabels[alert.condition].toLowerCase()}{" "}
                        {alert.threshold}
                        {alert.metric.includes("rate") ? "%" : ""} ({timeWindowLabels[alert.timeWindow].toLowerCase()})
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-ivory/50">
                      <Clock size={12} />
                      {alert.lastTriggered
                        ? `Dernier declenchement: ${new Date(alert.lastTriggered).toLocaleString("fr-FR")}`
                        : "Jamais declenchee"}
                    </div>
                    <div className="flex items-center gap-1 text-ivory/50">
                      <Bell size={12} />
                      {alert.triggerCount} declenchements
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.channels.includes("email") && (
                        <span title="Email">
                          <Mail size={12} className="text-gold" />
                        </span>
                      )}
                      {alert.channels.includes("webhook") && (
                        <span title="Webhook">
                          <Globe size={12} className="text-gold" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(alert)}
                    className={`rounded-lg p-2 transition-colors ${
                      alert.enabled
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-ivory/10 text-ivory/40 hover:bg-ivory/20"
                    }`}
                    title={alert.enabled ? "Desactiver" : "Activer"}
                  >
                    <Power size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(alert)}
                    className="rounded-lg bg-ivory/10 p-2 text-ivory/60 transition-colors hover:bg-ivory/20 hover:text-ivory"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="rounded-lg bg-red-500/20 p-2 text-red-400 transition-colors hover:bg-red-500/30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gold/20 bg-night p-6">
            <h3 className="mb-4 text-lg font-semibold text-ivory">
              {editingAlert ? "Modifier l'alerte" : "Nouvelle alerte"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-ivory/70">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-ivory/70">Description (optionnel)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-ivory/70">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "threshold" | "anomaly" | "trend" })}
                    className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                  >
                    <option value="threshold">Seuil</option>
                    <option value="anomaly">Anomalie</option>
                    <option value="trend">Tendance</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-ivory/70">Metrique</label>
                  <select
                    value={formData.metric}
                    onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                    className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                  >
                    {Object.entries(metricLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-ivory/70">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                  >
                    {Object.entries(conditionLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-ivory/70">Seuil</label>
                  <input
                    type="number"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
                    className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-ivory/70">Periode</label>
                <select
                  value={formData.timeWindow}
                  onChange={(e) => setFormData({ ...formData, timeWindow: e.target.value })}
                  className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                >
                  {Object.entries(timeWindowLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-ivory/70">Canaux de notification</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-ivory/70">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes("email")}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...formData.channels, "email"]
                          : formData.channels.filter((c) => c !== "email");
                        setFormData({ ...formData, channels });
                      }}
                      className="rounded border-gold/20 bg-night/60 text-gold focus:ring-gold"
                    />
                    <Mail size={14} /> Email
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ivory/70">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes("webhook")}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...formData.channels, "webhook"]
                          : formData.channels.filter((c) => c !== "webhook");
                        setFormData({ ...formData, channels });
                      }}
                      className="rounded border-gold/20 bg-night/60 text-gold focus:ring-gold"
                    />
                    <Globe size={14} /> Webhook
                  </label>
                </div>
              </div>

              {formData.channels.includes("email") && (
                <div>
                  <label className="mb-1 block text-sm text-ivory/70">
                    Destinataires email (separes par des virgules)
                  </label>
                  <input
                    type="text"
                    value={formData.emailRecipients}
                    onChange={(e) => setFormData({ ...formData, emailRecipients: e.target.value })}
                    placeholder="email1@example.com, email2@example.com"
                    className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                  />
                </div>
              )}

              {formData.channels.includes("webhook") && (
                <div>
                  <label className="mb-1 block text-sm text-ivory/70">URL Webhook</label>
                  <input
                    type="url"
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded border-gold/20 bg-night/60 text-gold focus:ring-gold"
                />
                <label htmlFor="enabled" className="text-sm text-ivory/70">
                  Activer l'alerte
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAlert(null);
                    resetForm();
                  }}
                  className="rounded-lg border border-ivory/20 px-4 py-2 text-sm text-ivory transition-colors hover:bg-ivory/10"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-night transition-colors hover:bg-gold/90"
                >
                  {editingAlert ? "Enregistrer" : "Creer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
