'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Bell,
  BellOff,
  Edit2,
  Trash2,
  History,
  Mail,
  Webhook,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Target,
  Clock,
  LogOut,
  CheckCircle,
  XCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  Layers,
  CalendarCheck,
  MailPlus,
} from 'lucide-react';
import { useState, useCallback } from 'react';

import { AlertFormModal } from './AlertFormModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import type { Alert, AlertHistory, AlertCondition, AlertTemplate } from './types';
import { METRIC_LABELS, TIME_WINDOW_LABELS, ALERT_TEMPLATES } from './types';

/** Props du composant AlertsTab */
export interface AlertsTabProps {
  alerts: Alert[];
  onRefresh: () => void;
}

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'trending-down': TrendingDown,
  'trending-up': TrendingUp,
  'alert-triangle': AlertTriangle,
  target: Target,
  clock: Clock,
  'log-out': LogOut,
  mail: Mail,
  'mail-plus': MailPlus,
  'check-circle': CheckCircle,
  layers: Layers,
  'calendar-check': CalendarCheck,
};

/**
 * Onglet de gestion des alertes analytics.
 * Affiche la liste des alertes, les modèles prédéfinis et permet la création/édition/suppression.
 */
export function AlertsTab({ alerts, onRefresh }: AlertsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<Alert | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AlertTemplate | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [alertHistories, setAlertHistories] = useState<Record<string, AlertHistory[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Bascule l'état actif/inactif d'une alerte */
  const handleToggleEnabled = useCallback(
    async (alert: Alert) => {
      try {
        const response = await fetch(`/api/analytics/alerts?id=${alert.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !alert.enabled }),
        });

        if (response.ok) {
          onRefresh();
        }
      } catch (error) {
        console.error('Error toggling alert:', error);
      }
    },
    [onRefresh]
  );

  /** Supprime l'alerte sélectionnée */
  const handleDelete = useCallback(async () => {
    if (!deletingAlert) return;

    try {
      const response = await fetch(`/api/analytics/alerts?id=${deletingAlert.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
        setDeletingAlert(null);
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  }, [deletingAlert, onRefresh]);

  /** Sauvegarde une alerte (création ou mise à jour) */
  const handleSave = useCallback(
    async (data: Partial<Alert>) => {
      setIsSubmitting(true);
      try {
        const url = editingAlert
          ? `/api/analytics/alerts?id=${editingAlert.id}`
          : '/api/analytics/alerts';
        const method = editingAlert ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          onRefresh();
          setShowCreateModal(false);
          setEditingAlert(null);
          setSelectedTemplate(null);
        }
      } catch (error) {
        console.error('Error saving alert:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingAlert, onRefresh]
  );

  /** Charge et affiche/masque l'historique d'une alerte */
  const handleLoadHistory = useCallback(
    async (alertId: string) => {
      if (expandedHistory === alertId) {
        setExpandedHistory(null);
        return;
      }

      setExpandedHistory(alertId);
      if (alertHistories[alertId]) return;

      setLoadingHistory(alertId);
      try {
        const response = await fetch(`/api/analytics/alerts?id=${alertId}&includeHistory=true`);
        if (response.ok) {
          const data = await response.json();
          setAlertHistories(prev => ({
            ...prev,
            [alertId]: data.history || [],
          }));
        }
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoadingHistory(null);
      }
    },
    [expandedHistory, alertHistories]
  );

  /** Sélectionne un modèle prédéfini et ouvre le formulaire */
  const handleSelectTemplate = (template: AlertTemplate) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
    setShowCreateModal(true);
  };

  const enabledAlerts = alerts.filter(a => a.enabled).length;
  const totalTriggers = alerts.reduce((sum, a) => sum + (a.triggerCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-ivory text-xl font-bold">Configuration des alertes</h2>
          <p className="text-ivory/60 text-sm">
            {alerts.length} alerte{alerts.length !== 1 ? 's' : ''} configurée
            {alerts.length !== 1 ? 's' : ''}, {enabledAlerts} active{enabledAlerts !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Modèles rapides</span>
            <span className="sm:hidden">Modèles</span>
          </button>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setShowCreateModal(true);
            }}
            className="bg-gold text-night hover:bg-gold/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle alerte</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">{alerts.length}</p>
              <p className="text-ivory/50 text-xs">Total configurées</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">{enabledAlerts}</p>
              <p className="text-ivory/50 text-xs">Actives</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <History className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">{totalTriggers}</p>
              <p className="text-ivory/50 text-xs">Déclenchements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Panel */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-gold/20 from-gold/5 rounded-2xl border bg-gradient-to-r to-transparent p-6">
              <h3 className="text-gold mb-4 text-sm font-semibold">
                Modèles d&apos;alertes prédéfinis
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ALERT_TEMPLATES.map(template => {
                  const Icon = TEMPLATE_ICONS[template.icon] || AlertTriangle;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="border-ivory/10 bg-night/40 hover:border-gold/30 hover:bg-night/60 group flex items-start gap-3 rounded-xl border p-4 text-left transition-all"
                    >
                      <div className="bg-gold/10 text-gold flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-ivory font-medium">{template.name}</p>
                        <p className="text-ivory/50 mt-0.5 line-clamp-2 text-xs">
                          {template.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-ivory/20 bg-night/40 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
            <Bell className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="text-ivory mt-4 text-lg font-medium">Aucune alerte configurée</h3>
          <p className="text-ivory/60 mt-2 text-sm">
            Créez votre première alerte pour surveiller vos métriques
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gold text-night hover:bg-gold/90 mt-6 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all"
          >
            <Plus className="h-4 w-4" />
            Créer une alerte
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              index={index}
              expanded={expandedHistory === alert.id}
              history={alertHistories[alert.id]}
              loadingHistory={loadingHistory === alert.id}
              onToggle={() => handleToggleEnabled(alert)}
              onEdit={() => setEditingAlert(alert)}
              onDelete={() => setDeletingAlert(alert)}
              onToggleHistory={() => handleLoadHistory(alert.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(showCreateModal || editingAlert) && (
          <AlertFormModal
            alert={editingAlert}
            template={selectedTemplate}
            isSubmitting={isSubmitting}
            onClose={() => {
              setShowCreateModal(false);
              setEditingAlert(null);
              setSelectedTemplate(null);
            }}
            onSave={handleSave}
          />
        )}

        {deletingAlert && (
          <DeleteConfirmationModal
            title="Supprimer l'alerte"
            message={`Êtes-vous sûr de vouloir supprimer l'alerte "${deletingAlert.name}" ? Cette action est irréversible.`}
            onConfirm={handleDelete}
            onCancel={() => setDeletingAlert(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface AlertCardProps {
  alert: Alert;
  index: number;
  expanded: boolean;
  history?: AlertHistory[];
  loadingHistory: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleHistory: () => void;
}

/** Carte d'une alerte individuelle avec historique dépliable */
function AlertCard({
  alert,
  index,
  expanded,
  history,
  loadingHistory,
  onToggle,
  onEdit,
  onDelete,
  onToggleHistory,
}: AlertCardProps) {
  /** Retourne le symbole de la condition */
  const getConditionSymbol = (condition: AlertCondition) => {
    switch (condition) {
      case 'greater_than':
        return '>';
      case 'less_than':
        return '<';
      case 'equals':
        return '=';
      case 'change_percent':
        return '±%';
    }
  };

  /** Formate le seuil selon la métrique */
  const formatThreshold = (a: Alert) => {
    if (a.condition === 'change_percent') {
      return `${a.threshold > 0 ? '+' : ''}${a.threshold}%`;
    }
    if (a.metric === 'conversion_rate' || a.metric === 'bounce_rate') {
      return `${a.threshold}%`;
    }
    if (a.metric === 'avg_time') {
      return `${a.threshold}s`;
    }
    return a.threshold.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border transition-all ${
        alert.enabled
          ? 'border-ivory/20 from-night/80 to-night/60 bg-gradient-to-r'
          : 'border-ivory/10 bg-night/40 opacity-70'
      }`}
    >
      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Alert Info */}
          <div className="flex items-start gap-4">
            <button
              onClick={onToggle}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all ${
                alert.enabled ? 'bg-amber-500/20 text-amber-400' : 'bg-ivory/10 text-ivory/40'
              }`}
            >
              {alert.enabled ? <Bell className="h-6 w-6" /> : <BellOff className="h-6 w-6" />}
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-ivory font-semibold">{alert.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    alert.enabled ? 'bg-green-500/20 text-green-400' : 'bg-ivory/10 text-ivory/50'
                  }`}
                >
                  {alert.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              {alert.description && (
                <p className="text-ivory/60 mt-1 text-sm">{alert.description}</p>
              )}

              {/* Condition Preview */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="bg-ivory/10 text-ivory/70 rounded-lg px-2.5 py-1">
                  {METRIC_LABELS[alert.metric]}
                </span>
                <span className="text-gold font-mono">{getConditionSymbol(alert.condition)}</span>
                <span className="bg-gold/10 text-gold rounded-lg px-2.5 py-1 font-semibold">
                  {formatThreshold(alert)}
                </span>
                <span className="text-ivory/50">sur</span>
                <span className="text-ivory/70">
                  {TIME_WINDOW_LABELS[alert.timeWindow].toLowerCase()}
                </span>
              </div>

              {/* Channels */}
              <div className="mt-3 flex items-center gap-2">
                {alert.channels.includes('email') && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email</span>
                  </div>
                )}
                {alert.channels.includes('webhook') && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs text-purple-400">
                    <Webhook className="h-3.5 w-3.5" />
                    <span>Webhook</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:shrink-0">
            {alert.triggerCount > 0 && (
              <button
                onClick={onToggleHistory}
                className="border-ivory/10 bg-ivory/5 text-ivory/70 hover:bg-ivory/10 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors"
              >
                <History className="h-4 w-4" />
                <span>{alert.triggerCount}</span>
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            <button
              onClick={onEdit}
              className="border-ivory/10 text-ivory/60 hover:bg-ivory/5 hover:text-ivory flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* History Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-ivory/10 bg-night/40 border-t p-4">
              <h4 className="text-ivory/70 mb-3 text-sm font-medium">
                Historique des déclenchements
              </h4>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-4">
                  <div className="border-gold h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
                </div>
              ) : history && history.length > 0 ? (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {history.slice(0, 10).map(h => (
                    <div
                      key={h.id}
                      className="bg-night/60 flex items-center justify-between rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-ivory/80">{h.message}</p>
                          <p className="text-ivory/50 text-xs">
                            Valeur: {h.actualValue} (seuil: {h.threshold})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {h.notificationsSent.map((n, i) => (
                          <div
                            key={i}
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${
                              n.success
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {n.success ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                          </div>
                        ))}
                        <span className="text-ivory/50 text-xs">
                          {new Date(h.triggeredAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-ivory/50 py-4 text-center text-sm">
                  Aucun déclenchement enregistré
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
