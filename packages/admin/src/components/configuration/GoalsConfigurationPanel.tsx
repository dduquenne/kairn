'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { useState, useCallback } from 'react';

import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { GoalFormModal } from './GoalFormModal';
import type { Goal, GoalType, GoalTemplate } from './types';
import { GOAL_TYPE_LABELS, GOAL_TYPE_DESCRIPTIONS, GOAL_TEMPLATES } from './types';

/** Props du composant GoalsConfigurationPanel */
export interface GoalsConfigurationPanelProps {
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
  'mail-plus': MailPlus,
  'check-circle': CheckCircle,
  clock: Clock,
  layers: Layers,
  'calendar-check': CalendarCheck,
};

/**
 * Panneau de configuration des objectifs avec bouton retour.
 * Variante du GoalsTab utilisée dans la page settings avec navigation.
 */
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

  /** Bascule l'état actif/inactif d'un objectif */
  const handleToggleEnabled = useCallback(
    async (goal: Goal) => {
      try {
        const response = await fetch(`/api/analytics/goals?id=${goal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !goal.enabled }),
        });

        if (response.ok) {
          onRefresh();
        }
      } catch (error) {
        console.error('Error toggling goal:', error);
      }
    },
    [onRefresh]
  );

  /** Supprime l'objectif sélectionné */
  const handleDelete = useCallback(async () => {
    if (!deletingGoal) return;

    try {
      const response = await fetch(`/api/analytics/goals?id=${deletingGoal.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
        setDeletingGoal(null);
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  }, [deletingGoal, onRefresh]);

  /** Sauvegarde un objectif (création ou mise à jour) */
  const handleSave = useCallback(
    async (data: Partial<Goal>) => {
      setIsSubmitting(true);
      try {
        const url = editingGoal
          ? `/api/analytics/goals?id=${editingGoal.id}`
          : '/api/analytics/goals';
        const method = editingGoal ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          onRefresh();
          setShowCreateModal(false);
          setEditingGoal(null);
          setSelectedTemplate(null);
        }
      } catch (error) {
        console.error('Error saving goal:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingGoal, onRefresh]
  );

  /** Sélectionne un modèle prédéfini et ouvre le formulaire */
  const handleSelectTemplate = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
    setShowCreateModal(true);
  };

  /** Génère la description d'un objectif selon son type */
  const getGoalDescription = (goal: Goal) => {
    switch (goal.type) {
      case 'destination':
        return `Page: ${goal.destinationUrl}`;
      case 'event':
        return [
          goal.eventCategory && `Catégorie: ${goal.eventCategory}`,
          goal.eventAction && `Action: ${goal.eventAction}`,
          goal.eventLabel && `Label: ${goal.eventLabel}`,
        ]
          .filter(Boolean)
          .join(' • ');
      case 'duration':
        return `${goal.comparison === 'greater_than' ? '>' : '<'} ${goal.durationSeconds}s`;
      case 'pages_per_session':
        return `${goal.comparison === 'greater_than' ? '>' : '<'} ${goal.pagesCount} pages`;
      default:
        return '';
    }
  };

  const enabledGoals = goals.filter(g => g.enabled);
  const totalValue = goals.reduce((sum, g) => sum + (g.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="border-ivory/20 bg-night/60 text-ivory/60 hover:bg-night/80 hover:text-ivory flex h-10 w-10 items-center justify-center rounded-xl border transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-ivory text-xl font-bold">Configuration des objectifs</h2>
            <p className="text-ivory/60 text-sm">
              {goals.length} objectif{goals.length !== 1 ? 's' : ''} configuré
              {goals.length !== 1 ? 's' : ''}
            </p>
          </div>
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
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvel objectif</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Target className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">{enabledGoals.length}</p>
              <p className="text-ivory/50 text-xs">Objectifs actifs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">{goals.length}</p>
              <p className="text-ivory/50 text-xs">Total définis</p>
            </div>
          </div>
        </div>
        <div className="border-gold/20 bg-gold/5 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-gold/20 flex h-10 w-10 items-center justify-center rounded-lg">
              <DollarSign className="text-gold h-5 w-5" />
            </div>
            <div>
              <p className="text-ivory text-2xl font-bold">{totalValue}€</p>
              <p className="text-ivory/50 text-xs">Valeur totale</p>
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
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent p-6">
              <h3 className="mb-4 text-sm font-semibold text-emerald-400">
                Modèles d&apos;objectifs prédéfinis
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {GOAL_TEMPLATES.map(template => {
                  const Icon = TEMPLATE_ICONS[template.icon] || Target;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="border-ivory/10 bg-night/40 hover:bg-night/60 group flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover:border-emerald-500/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
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

      {/* Goals List */}
      {goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-ivory/20 bg-night/40 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Target className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-ivory mt-4 text-lg font-medium">Aucun objectif configuré</h3>
          <p className="text-ivory/60 mt-2 text-sm">
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
                    ? 'border-ivory/20 from-night/80 to-night/60 bg-gradient-to-br'
                    : 'border-ivory/10 bg-night/40 opacity-70'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all ${
                          goal.enabled
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-ivory/10 text-ivory/40'
                        }`}
                      >
                        <TypeIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-ivory font-semibold">{goal.name}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              goal.enabled
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-ivory/10 text-ivory/50'
                            }`}
                          >
                            {goal.enabled ? 'Actif' : 'Inactif'}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="bg-ivory/10 text-ivory/70 rounded-lg px-2.5 py-1 text-xs">
                            {GOAL_TYPE_LABELS[goal.type]}
                          </span>
                          {goal.value !== undefined && goal.value > 0 && (
                            <span className="bg-gold/10 text-gold flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs">
                              <DollarSign className="h-3 w-3" />
                              {goal.value}€
                            </span>
                          )}
                        </div>

                        <p className="text-ivory/50 mt-2 text-sm">{getGoalDescription(goal)}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleToggleEnabled(goal)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                          goal.enabled
                            ? 'border-green-500/20 text-green-400 hover:bg-green-500/10'
                            : 'border-ivory/10 text-ivory/40 hover:bg-ivory/5'
                        }`}
                        title={goal.enabled ? 'Désactiver' : 'Activer'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingGoal(goal)}
                        className="border-ivory/10 text-ivory/60 hover:bg-ivory/5 hover:text-ivory flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
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
        <div className="border-ivory/10 bg-night/40 rounded-2xl border p-6">
          <h3 className="text-ivory/70 mb-4 text-sm font-semibold">
            Types d&apos;objectifs disponibles
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map(type => {
              const Icon = GOAL_TYPE_ICONS[type];
              const count = goals.filter(g => g.type === type).length;
              return (
                <div key={type} className="bg-night/60 flex items-start gap-3 rounded-xl p-3">
                  <div className="bg-ivory/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="text-ivory/60 h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-ivory text-sm font-medium">{GOAL_TYPE_LABELS[type]}</p>
                      {count > 0 && (
                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-400">
                          {count}
                        </span>
                      )}
                    </div>
                    <p className="text-ivory/50 mt-0.5 text-xs">{GOAL_TYPE_DESCRIPTIONS[type]}</p>
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
