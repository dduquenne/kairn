// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Edit2, Trash2, CheckCircle, TrendingUp, X, Save } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  type: 'destination' | 'event' | 'duration' | 'pages_per_session';
  destinationUrl?: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  durationSeconds?: number;
  comparison?: 'greater_than' | 'less_than';
  pagesCount?: number;
  value?: number;
  enabled: boolean;
  createdAt: string;
}

interface GoalSummary {
  goal: Goal;
  completions: number;
  completionRate: number;
  totalValue: number;
  uniqueSessions: number;
}

interface GoalsDashboardProps {
  startDate?: string;
  endDate?: string;
}

const GOAL_TYPE_LABELS: Record<string, string> = {
  destination: "Page de destination",
  event: "Événement",
  duration: "Durée de session",
  pages_per_session: "Pages par session",
};

export function GoalsDashboard({ startDate, endDate }: GoalsDashboardProps) {
  const [goalsSummary, setGoalsSummary] = useState<GoalSummary[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("summary", "true");
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const [summaryRes, goalsRes] = await Promise.all([
        fetch(`/api/analytics/goals?${params.toString()}`),
        fetch("/api/analytics/goals"),
      ]);

      if (!summaryRes.ok || !goalsRes.ok) {
        throw new Error("Failed to fetch goals");
      }

      const summary = await summaryRes.json();
      const goals = await goalsRes.json();

      setGoalsSummary(summary);
      setAllGoals(goals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [startDate, endDate]);

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet objectif ?")) return;

    try {
      const res = await fetch(`/api/analytics/goals?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete goal");
      await fetchGoals();
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleToggleGoal = async (goal: Goal) => {
    try {
      const res = await fetch(`/api/analytics/goals?id=${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !goal.enabled }),
      });

      if (!res.ok) throw new Error("Failed to toggle goal");
      await fetchGoals();
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="text-gold" size={24} />
          <h3 className="text-lg font-semibold text-gold">Objectifs</h3>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gold/10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-red-300">
        {error}
      </div>
    );
  }

  const totalCompletions = goalsSummary.reduce((sum, g) => sum + g.completions, 0);
  const totalValue = goalsSummary.reduce((sum, g) => sum + g.totalValue, 0);

  return (
    <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="text-gold" size={24} />
          <h3 className="text-lg font-semibold text-gold">Objectifs (Goals)</h3>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gold/20 border border-gold/50 px-3 py-2 text-sm font-medium text-gold hover:bg-gold/30 transition"
        >
          <Plus size={16} />
          Nouvel objectif
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-night/50 border border-gold/10 p-4 text-center">
          <p className="text-2xl font-bold text-gold">{allGoals.filter(g => g.enabled).length}</p>
          <p className="text-xs text-ivory/60">Objectifs actifs</p>
        </div>
        <div className="rounded-lg bg-night/50 border border-gold/10 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{totalCompletions}</p>
          <p className="text-xs text-ivory/60">Completions</p>
        </div>
        <div className="rounded-lg bg-night/50 border border-gold/10 p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{totalValue.toFixed(0)}€</p>
          <p className="text-xs text-ivory/60">Valeur totale</p>
        </div>
      </div>

      {/* Goals List */}
      {goalsSummary.length === 0 ? (
        <div className="text-center py-8 text-ivory/60">
          <Target className="mx-auto mb-3 opacity-50" size={48} />
          <p>Aucun objectif défini</p>
          <p className="text-sm">Créez votre premier objectif pour suivre les conversions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goalsSummary.map((item, index) => (
            <motion.div
              key={item.goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-lg border p-4 ${
                item.goal.enabled
                  ? "border-gold/20 bg-night/30"
                  : "border-gray-500/20 bg-gray-500/5 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-ivory">{item.goal.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-gold/20 text-gold">
                      {GOAL_TYPE_LABELS[item.goal.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-green-400">
                      <CheckCircle size={14} className="inline mr-1" />
                      {item.completions} completions
                    </span>
                    <span className="text-blue-400">
                      <TrendingUp size={14} className="inline mr-1" />
                      {(item.completionRate ?? 0).toFixed(1)}% taux
                    </span>
                    {item.goal.value && (
                      <span className="text-gold">
                        {(item.totalValue ?? 0).toFixed(0)}€ valeur
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleGoal(item.goal)}
                    className={`p-2 rounded transition ${
                      item.goal.enabled
                        ? "text-green-400 hover:bg-green-500/20"
                        : "text-gray-400 hover:bg-gray-500/20"
                    }`}
                    title={item.goal.enabled ? "Désactiver" : "Activer"}
                  >
                    <CheckCircle size={18} />
                  </button>
                  <button
                    onClick={() => setEditingGoal(item.goal)}
                    className="p-2 rounded text-gold/70 hover:bg-gold/20 transition"
                    title="Modifier"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(item.goal.id)}
                    className="p-2 rounded text-red-400/70 hover:bg-red-500/20 transition"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingGoal) && (
        <GoalModal
          goal={editingGoal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingGoal(null);
          }}
          onSave={fetchGoals}
        />
      )}
    </div>
  );
}

interface GoalModalProps {
  goal: Goal | null;
  onClose: () => void;
  onSave: () => void;
}

function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const [formData, setFormData] = useState({
    name: goal?.name || "",
    type: goal?.type || "event" as const,
    destinationUrl: goal?.destinationUrl || "",
    eventCategory: goal?.eventCategory || "",
    eventAction: goal?.eventAction || "",
    eventLabel: goal?.eventLabel || "",
    durationSeconds: goal?.durationSeconds || 120,
    comparison: goal?.comparison || "greater_than" as const,
    pagesCount: goal?.pagesCount || 3,
    value: goal?.value || 0,
    enabled: goal?.enabled ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = goal ? `/api/analytics/goals?id=${goal.id}` : "/api/analytics/goals";
      const method = goal ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save goal");

      onSave();
      onClose();
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="mx-4 max-w-lg w-full rounded-lg border border-gold/30 bg-gradient-to-br from-night/95 to-night/80 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-ivory">
            {goal ? "Modifier l'objectif" : "Nouvel objectif"}
          </h2>
          <button onClick={onClose} className="text-ivory/60 hover:text-ivory">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gold mb-1">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-ivory placeholder-ivory/50 focus:border-gold focus:outline-none"
              placeholder="Ex: Inscription newsletter"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gold mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-ivory focus:border-gold focus:outline-none"
            >
              <option value="event">Événement</option>
              <option value="destination">Page de destination</option>
              <option value="duration">Durée de session</option>
              <option value="pages_per_session">Pages par session</option>
            </select>
          </div>

          {/* Type-specific fields */}
          {formData.type === "destination" && (
            <div>
              <label className="block text-sm font-medium text-gold mb-1">URL de destination</label>
              <input
                type="text"
                value={formData.destinationUrl}
                onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-ivory placeholder-ivory/50 focus:border-gold focus:outline-none"
                placeholder="/merci, /confirmation"
              />
            </div>
          )}

          {formData.type === "event" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gold mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={formData.eventCategory}
                    onChange={(e) => setFormData({ ...formData, eventCategory: e.target.value })}
                    className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-ivory placeholder-ivory/50 focus:border-gold focus:outline-none"
                    placeholder="CTA, Form"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gold mb-1">Action</label>
                  <input
                    type="text"
                    value={formData.eventAction}
                    onChange={(e) => setFormData({ ...formData, eventAction: e.target.value })}
                    className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-ivory placeholder-ivory/50 focus:border-gold focus:outline-none"
                    placeholder="Click, Submit"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gold mb-1">Label (optionnel)</label>
                <input
                  type="text"
                  value={formData.eventLabel}
                  onChange={(e) => setFormData({ ...formData, eventLabel: e.target.value })}
                  className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-ivory placeholder-ivory/50 focus:border-gold focus:outline-none"
                  placeholder="newsletter, contact"
                />
              </div>
            </>
          )}

          {formData.type === "duration" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gold mb-1">Durée (secondes)</label>
                <input
                  type="number"
                  value={formData.durationSeconds}
                  onChange={(e) => setFormData({ ...formData, durationSeconds: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-ivory focus:border-gold focus:outline-none"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gold mb-1">Comparaison</label>
                <select
                  value={formData.comparison}
                  onChange={(e) => setFormData({ ...formData, comparison: e.target.value as any })}
                  className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-ivory focus:border-gold focus:outline-none"
                >
                  <option value="greater_than">Plus de</option>
                  <option value="less_than">Moins de</option>
                </select>
              </div>
            </div>
          )}

          {formData.type === "pages_per_session" && (
            <div>
              <label className="block text-sm font-medium text-gold mb-1">Nombre de pages minimum</label>
              <input
                type="number"
                value={formData.pagesCount}
                onChange={(e) => setFormData({ ...formData, pagesCount: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-ivory focus:border-gold focus:outline-none"
                min={1}
              />
            </div>
          )}

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gold mb-1">Valeur (€)</label>
            <input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
              className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-ivory focus:border-gold focus:outline-none"
              min={0}
              step={0.01}
            />
            <p className="text-xs text-ivory/50 mt-1">Valeur monétaire estimée pour chaque completion</p>
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="rounded border-gold/30 bg-night/50 text-gold focus:ring-gold"
            />
            <label htmlFor="enabled" className="text-sm text-ivory">
              Activer cet objectif
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gold/30 px-4 py-2 font-medium text-gold hover:bg-gold/10 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gold/20 border border-gold/50 px-4 py-2 font-medium text-gold hover:bg-gold/30 transition disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
