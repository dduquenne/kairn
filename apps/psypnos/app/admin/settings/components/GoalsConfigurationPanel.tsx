"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Target,
  Edit2,
  Trash2,
  Power,
  Link,
  MousePointer,
  Clock,
  Layers,
  Zap,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Mail,
  MailPlus,
  CalendarCheck,
} from "lucide-react";
import { useState, useCallback } from "react";

import type {
  Goal,
  GoalType,
  GoalTemplate,
} from "../types";
import {
  GOAL_TYPE_LABELS,
  GOAL_TYPE_DESCRIPTIONS,
  GOAL_TEMPLATES,
} from "../types";

import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { GoalFormModal } from "./GoalFormModal";

interface GoalsConfigurationPanelProps {
  goals: Goal[];
  onBack: () => void;
  onRefresh: () => void;
}

const GOAL_TYPE_ICONS: Record<GoalType, React.ComponentType<{ className?: string }>> = {
  destination: Link,
  event: MousePointer,
  duration: Clock,
  pages_per_session: Layers,
};

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mail: Mail,
  "mail-plus": MailPlus,
  "check-circle": CheckCircle,
  clock: Clock,
  layers: Layers,
  "calendar-check": CalendarCheck,
};

export function GoalsConfigurationPanel({
  goals,
  onBack,
  onRefresh,
}: GoalsConfigurationPanelProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleEnabled = useCallback(async (goal: Goal) => {
    try {
      const response = await fetch(`/api/analytics/goals?id=${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !goal.enabled }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error toggling goal:", error);
    }
  }, [onRefresh]);

  const handleDelete = useCallback(async () => {
    if (!deletingGoal) return;

    try {
      const response = await fetch(`/api/analytics/goals?id=${deletingGoal.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
        setDeletingGoal(null);
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  }, [deletingGoal, onRefresh]);

  const handleSave = useCallback(async (data: Partial<Goal>) => {
    setIsSubmitting(true);
    try {
      const url = editingGoal
        ? `/api/analytics/goals?id=${editingGoal.id}`
        : "/api/analytics/goals";
      const method = editingGoal ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onRefresh();
        setShowCreateModal(false);
        setEditingGoal(null);
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error("Error saving goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingGoal, onRefresh]);

  const handleSelectTemplate = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
    setShowCreateModal(true);
  };

  const getGoalDescription = (goal: Goal) => {
    switch (goal.type) {
      case "destination":
        return `Page: ${goal.destinationUrl}`;
      case "event":
        return [
          goal.eventCategory && `Catégorie: ${goal.eventCategory}`,
          goal.eventAction && `Action: ${goal.eventAction}`,
          goal.eventLabel && `Label: ${goal.eventLabel}`,
        ]
          .filter(Boolean)
          .join(" • ");
      case "duration":
        return `${goal.comparison === "greater_than" ? ">" : "<"} ${goal.durationSeconds}s`;
      case "pages_per_session":
        return `${goal.comparison === "greater_than" ? ">" : "<"} ${goal.pagesCount} pages`;
      default:
        return "";
    }
  };

  const enabledGoals = goals.filter((g) => g.enabled);
  const totalValue = goals.reduce((sum, g) => sum + (g.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-ivory/20 bg-night/60 text-ivory/60 transition-colors hover:bg-night/80 hover:text-ivory"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-ivory">Configuration des objectifs</h2>
            <p className="text-sm text-ivory/60">
              {goals.length} objectif{goals.length !== 1 ? "s" : ""} configuré{goals.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold transition-all hover:bg-gold/20"
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
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvel objectif</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Target className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ivory">{enabledGoals.length}</p>
              <p className="text-xs text-ivory/50">Objectifs actifs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ivory">{goals.length}</p>
              <p className="text-xs text-ivory/50">Total définis</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
              <DollarSign className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ivory">{totalValue}€</p>
              <p className="text-xs text-ivory/50">Valeur totale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Panel */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent p-6">
              <h3 className="mb-4 text-sm font-semibold text-emerald-400">
                Modèles d'objectifs prédéfinis
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {GOAL_TEMPLATES.map((template) => {
                  const Icon = TEMPLATE_ICONS[template.icon] || Target;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="group flex items-start gap-3 rounded-xl border border-ivory/10 bg-night/40 p-4 text-left transition-all hover:border-emerald-500/30 hover:bg-night/60"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-ivory">{template.name}</p>
                        <p className="mt-0.5 text-xs text-ivory/50 line-clamp-2">
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

      {/* Goals List */}
      {goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ivory/20 bg-night/40 py-16"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Target className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-ivory">Aucun objectif configuré</h3>
          <p className="mt-2 text-sm text-ivory/60">
            Créez votre premier objectif pour mesurer vos performances
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" />
            Créer un objectif
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal, index) => {
            const TypeIcon = GOAL_TYPE_ICONS[goal.type];
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl border transition-all ${
                  goal.enabled
                    ? "border-ivory/20 bg-gradient-to-br from-night/80 to-night/60"
                    : "border-ivory/10 bg-night/40 opacity-70"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all ${
                          goal.enabled
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-ivory/10 text-ivory/40"
                        }`}
                      >
                        <TypeIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-ivory">{goal.name}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              goal.enabled
                                ? "bg-green-500/20 text-green-400"
                                : "bg-ivory/10 text-ivory/50"
                            }`}
                          >
                            {goal.enabled ? "Actif" : "Inactif"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-ivory/10 px-2.5 py-1 text-xs text-ivory/70">
                            {GOAL_TYPE_LABELS[goal.type]}
                          </span>
                          {goal.value !== undefined && goal.value > 0 && (
                            <span className="flex items-center gap-1 rounded-lg bg-gold/10 px-2.5 py-1 text-xs text-gold">
                              <DollarSign className="h-3 w-3" />
                              {goal.value}€
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-ivory/50">
                          {getGoalDescription(goal)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleToggleEnabled(goal)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                          goal.enabled
                            ? "border-green-500/20 text-green-400 hover:bg-green-500/10"
                            : "border-ivory/10 text-ivory/40 hover:bg-ivory/5"
                        }`}
                        title={goal.enabled ? "Désactiver" : "Activer"}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingGoal(goal)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-ivory/10 text-ivory/60 transition-colors hover:bg-ivory/5 hover:text-ivory"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingGoal(goal)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Goal Types Guide */}
      {goals.length > 0 && (
        <div className="rounded-2xl border border-ivory/10 bg-night/40 p-6">
          <h3 className="mb-4 text-sm font-semibold text-ivory/70">
            Types d'objectifs disponibles
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((type) => {
              const Icon = GOAL_TYPE_ICONS[type];
              const count = goals.filter((g) => g.type === type).length;
              return (
                <div
                  key={type}
                  className="flex items-start gap-3 rounded-xl bg-night/60 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ivory/10">
                    <Icon className="h-4 w-4 text-ivory/60" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ivory">
                        {GOAL_TYPE_LABELS[type]}
                      </p>
                      {count > 0 && (
                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-400">
                          {count}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ivory/50">
                      {GOAL_TYPE_DESCRIPTIONS[type]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(showCreateModal || editingGoal) && (
          <GoalFormModal
            goal={editingGoal}
            template={selectedTemplate}
            isSubmitting={isSubmitting}
            onClose={() => {
              setShowCreateModal(false);
              setEditingGoal(null);
              setSelectedTemplate(null);
            }}
            onSave={handleSave}
          />
        )}

        {deletingGoal && (
          <DeleteConfirmationModal
            title="Supprimer l'objectif"
            message={`Êtes-vous sûr de vouloir supprimer l'objectif "${deletingGoal.name}" ? Cette action est irréversible et supprimera également l'historique des conversions associées.`}
            onConfirm={handleDelete}
            onCancel={() => setDeletingGoal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
