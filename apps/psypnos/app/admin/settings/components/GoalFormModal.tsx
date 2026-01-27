"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Target,
  Link,
  MousePointer,
  Clock,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  Info,
  Sparkles,
  DollarSign,
} from "lucide-react";

import type {
  Goal,
  GoalType,
  GoalComparison,
  GoalTemplate,
} from "../types";
import {
  GOAL_TYPE_LABELS,
  GOAL_TYPE_DESCRIPTIONS,
  COMPARISON_LABELS,
} from "../types";

interface GoalFormModalProps {
  goal?: Goal | null;
  template?: GoalTemplate | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (data: Partial<Goal>) => void;
}

type Step = "type" | "details" | "value" | "review";

const STEPS: { id: Step; label: string }[] = [
  { id: "type", label: "Type" },
  { id: "details", label: "Détails" },
  { id: "value", label: "Valeur" },
  { id: "review", label: "Confirmation" },
];

const GOAL_TYPE_ICONS: Record<GoalType, React.ComponentType<{ className?: string }>> = {
  destination: Link,
  event: MousePointer,
  duration: Clock,
  pages_per_session: Layers,
};

export function GoalFormModal({
  goal,
  template,
  isSubmitting,
  onClose,
  onSave,
}: GoalFormModalProps) {
  const [step, setStep] = useState<Step>("type");
  const [formData, setFormData] = useState({
    name: "",
    type: "event" as GoalType,
    destinationUrl: "",
    eventCategory: "",
    eventAction: "",
    eventLabel: "",
    durationSeconds: 60,
    comparison: "greater_than" as GoalComparison,
    pagesCount: 3,
    value: 0,
    enabled: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize from goal or template
  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        type: goal.type,
        destinationUrl: goal.destinationUrl || "",
        eventCategory: goal.eventCategory || "",
        eventAction: goal.eventAction || "",
        eventLabel: goal.eventLabel || "",
        durationSeconds: goal.durationSeconds || 60,
        comparison: goal.comparison || "greater_than",
        pagesCount: goal.pagesCount || 3,
        value: goal.value || 0,
        enabled: goal.enabled,
      });
      // Skip to details if editing
      setStep("details");
    } else if (template) {
      setFormData((prev) => ({
        ...prev,
        name: template.name,
        ...template.preset,
      }));
      // Go to details since type is pre-selected
      setStep("details");
    }
  }, [goal, template]);

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case "type":
        // Type is always valid (pre-selected)
        break;
      case "details":
        if (!formData.name.trim()) {
          newErrors.name = "Le nom est requis";
        }
        if (formData.type === "destination" && !formData.destinationUrl.trim()) {
          newErrors.destinationUrl = "L'URL de destination est requise";
        }
        if (formData.type === "event" && !formData.eventCategory.trim() && !formData.eventAction.trim()) {
          newErrors.event = "Au moins une catégorie ou action est requise";
        }
        break;
      case "value":
        // Value is optional, always valid
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    const stepIndex = STEPS.findIndex((s) => s.id === step);
    const nextStep = STEPS[stepIndex + 1];
    if (stepIndex < STEPS.length - 1 && nextStep) {
      setStep(nextStep.id);
    }
  };

  const handleBack = () => {
    const stepIndex = STEPS.findIndex((s) => s.id === step);
    const prevStep = STEPS[stepIndex - 1];
    if (stepIndex > 0 && prevStep) {
      setStep(prevStep.id);
    }
  };

  const handleSubmit = () => {
    const data: Partial<Goal> = {
      name: formData.name.trim(),
      type: formData.type,
      enabled: formData.enabled,
    };

    // Add type-specific fields
    switch (formData.type) {
      case "destination":
        data.destinationUrl = formData.destinationUrl.trim();
        break;
      case "event":
        if (formData.eventCategory.trim()) data.eventCategory = formData.eventCategory.trim();
        if (formData.eventAction.trim()) data.eventAction = formData.eventAction.trim();
        if (formData.eventLabel.trim()) data.eventLabel = formData.eventLabel.trim();
        break;
      case "duration":
        data.durationSeconds = formData.durationSeconds;
        data.comparison = formData.comparison;
        break;
      case "pages_per_session":
        data.pagesCount = formData.pagesCount;
        data.comparison = formData.comparison;
        break;
    }

    // Add value if set
    if (formData.value > 0) {
      data.value = formData.value;
    }

    onSave(data);
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const getGoalPreview = () => {
    switch (formData.type) {
      case "destination":
        return `Visite de ${formData.destinationUrl || "[URL]"}`;
      case "event":
        const parts = [
          formData.eventCategory && `Catégorie: ${formData.eventCategory}`,
          formData.eventAction && `Action: ${formData.eventAction}`,
          formData.eventLabel && `Label: ${formData.eventLabel}`,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(" • ") : "Événement personnalisé";
      case "duration":
        return `Session ${formData.comparison === "greater_than" ? ">" : "<"} ${formData.durationSeconds} secondes`;
      case "pages_per_session":
        return `${formData.pagesCount} pages par session (${formData.comparison === "greater_than" ? "minimum" : "maximum"})`;
      default:
        return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-ivory/20 bg-night/95 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ivory/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <Target className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ivory">
                {goal ? "Modifier l'objectif" : "Nouvel objectif"}
              </h2>
              {template && !goal && (
                <p className="text-xs text-emerald-400">
                  <Sparkles className="mr-1 inline h-3 w-3" />
                  Basé sur "{template.name}"
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ivory/50 transition-colors hover:bg-ivory/10 hover:text-ivory"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-ivory/10 px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => index < currentStepIndex && setStep(s.id)}
                  disabled={index > currentStepIndex}
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                      index < currentStepIndex
                        ? "bg-green-500/20 text-green-400"
                        : index === currentStepIndex
                          ? "bg-emerald-500 text-white"
                          : "bg-ivory/10 text-ivory/40"
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`hidden text-sm sm:block ${
                      index === currentStepIndex
                        ? "font-medium text-ivory"
                        : "text-ivory/50"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-8 rounded-full sm:w-12 ${
                      index < currentStepIndex ? "bg-green-500/40" : "bg-ivory/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {step === "type" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-ivory/70">
                Choisissez le type d'objectif que vous souhaitez suivre
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((type) => {
                  const Icon = GOAL_TYPE_ICONS[type];
                  const isSelected = formData.type === type;

                  return (
                    <button
                      key={type}
                      onClick={() => setFormData((prev) => ({ ...prev, type }))}
                      className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-ivory/20 hover:border-ivory/40"
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-ivory/10 text-ivory/50"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium text-ivory">
                          {GOAL_TYPE_LABELS[type]}
                        </p>
                        <p className="mt-1 text-xs text-ivory/50">
                          {GOAL_TYPE_DESCRIPTIONS[type]}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              {/* Goal Preview */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <Info className="h-3.5 w-3.5" />
                  {GOAL_TYPE_LABELS[formData.type]}
                </div>
                <p className="mt-1 text-sm text-ivory">{getGoalPreview()}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ivory">
                  Nom de l'objectif <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Inscription newsletter"
                  className="w-full rounded-xl border border-ivory/20 bg-night/60 px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                {errors.name && (
                  <p className="mt-1.5 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Type-specific fields */}
              {formData.type === "destination" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-ivory">
                    URL de destination <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.destinationUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, destinationUrl: e.target.value }))
                    }
                    placeholder="/merci ou /confirmation"
                    className="w-full rounded-xl border border-ivory/20 bg-night/60 px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  {errors.destinationUrl && (
                    <p className="mt-1.5 text-sm text-red-400">{errors.destinationUrl}</p>
                  )}
                  <p className="mt-2 flex items-start gap-2 text-xs text-ivory/50">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    L'objectif sera déclenché quand un visiteur atteint cette page
                  </p>
                </div>
              )}

              {formData.type === "event" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ivory">
                      Catégorie d'événement
                    </label>
                    <input
                      type="text"
                      value={formData.eventCategory}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, eventCategory: e.target.value }))
                      }
                      placeholder="Ex: contact, newsletter, booking"
                      className="w-full rounded-xl border border-ivory/20 bg-night/60 px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ivory">
                      Action
                    </label>
                    <input
                      type="text"
                      value={formData.eventAction}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, eventAction: e.target.value }))
                      }
                      placeholder="Ex: submit, click, subscribe"
                      className="w-full rounded-xl border border-ivory/20 bg-night/60 px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ivory">
                      Label (optionnel)
                    </label>
                    <input
                      type="text"
                      value={formData.eventLabel}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, eventLabel: e.target.value }))
                      }
                      placeholder="Ex: header-form, footer-cta"
                      className="w-full rounded-xl border border-ivory/20 bg-night/60 px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  {errors.event && (
                    <p className="text-sm text-red-400">{errors.event}</p>
                  )}
                </>
              )}

              {formData.type === "duration" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ivory">
                      Comparaison
                    </label>
                    <select
                      value={formData.comparison}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          comparison: e.target.value as GoalComparison,
                        }))
                      }
                      className="w-full rounded-xl border border-ivory/20 bg-night/60 px-4 py-3 text-ivory focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {(Object.keys(COMPARISON_LABELS) as GoalComparison[]).map((comp) => (
                        <option key={comp} value={comp}>
                          {COMPARISON_LABELS[comp]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ivory">
                      Durée (secondes)
                    </label>
                    <input
                      type="number"
                      value={formData.durationSeconds}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          durationSeconds: parseInt(e.target.value) || 0,
                        }))
                      }
                      min={1}
                      className="w-full rounded-xl border border-ivory/20 bg-night/60 px-4 py-3 text-ivory focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>
              )}

              {formData.type === "pages_per_session" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ivory">
                      Comparaison
                    </label>
                    <select
                      value={formData.comparison}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          comparison: e.target.value as GoalComparison,
                        }))
                      }
                      className="w-full rounded-xl border border-ivory/20 bg-night/60 px-4 py-3 text-ivory focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {(Object.keys(COMPARISON_LABELS) as GoalComparison[]).map((comp) => (
                        <option key={comp} value={comp}>
                          {COMPARISON_LABELS[comp]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ivory">
                      Nombre de pages
                    </label>
                    <input
                      type="number"
                      value={formData.pagesCount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pagesCount: parseInt(e.target.value) || 0,
                        }))
                      }
                      min={1}
                      className="w-full rounded-xl border border-ivory/20 bg-night/60 px-4 py-3 text-ivory focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === "value" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="mt-0.5 h-5 w-5 text-gold" />
                  <div>
                    <p className="font-medium text-ivory">Valeur monétaire</p>
                    <p className="mt-1 text-sm text-ivory/60">
                      Attribuez une valeur à cet objectif pour calculer le ROI de vos actions
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ivory">
                  Valeur de conversion (optionnel)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        value: parseFloat(e.target.value) || 0,
                      }))
                    }
                    min={0}
                    step={0.01}
                    placeholder="0"
                    className="w-full rounded-xl border border-ivory/20 bg-night/60 px-4 py-3 pr-12 text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ivory/50">
                    €
                  </span>
                </div>
                <p className="mt-2 text-xs text-ivory/50">
                  Cette valeur sera utilisée pour calculer la valeur totale des conversions
                </p>
              </div>

              <div className="rounded-xl border border-ivory/10 bg-night/40 p-4">
                <h4 className="text-sm font-medium text-ivory/70">Exemples de valeurs</h4>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ivory/50">Inscription newsletter</span>
                    <span className="text-gold">5€ - 10€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ivory/50">Formulaire de contact</span>
                    <span className="text-gold">10€ - 25€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ivory/50">Prise de rendez-vous</span>
                    <span className="text-gold">50€ - 100€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ivory/50">Achat / Réservation</span>
                    <span className="text-gold">Variable (panier moyen)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "review" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="rounded-xl border border-ivory/20 bg-night/60 p-5">
                <h3 className="mb-4 font-semibold text-ivory">Récapitulatif de l'objectif</h3>

                <div className="space-y-4">
                  <div className="flex justify-between border-b border-ivory/10 pb-3">
                    <span className="text-ivory/60">Nom</span>
                    <span className="font-medium text-ivory">{formData.name}</span>
                  </div>

                  <div className="flex justify-between border-b border-ivory/10 pb-3">
                    <span className="text-ivory/60">Type</span>
                    <span className="text-ivory">{GOAL_TYPE_LABELS[formData.type]}</span>
                  </div>

                  <div className="flex justify-between border-b border-ivory/10 pb-3">
                    <span className="text-ivory/60">Condition</span>
                    <span className="text-emerald-400">{getGoalPreview()}</span>
                  </div>

                  {formData.value > 0 && (
                    <div className="flex justify-between pb-3">
                      <span className="text-ivory/60">Valeur</span>
                      <span className="flex items-center gap-1 text-gold">
                        <DollarSign className="h-4 w-4" />
                        {formData.value}€
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
                  <Check className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-ivory">Prêt à créer</p>
                  <p className="text-sm text-ivory/60">
                    L'objectif sera activé immédiatement après création
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-ivory/10 px-6 py-4">
          <button
            onClick={handleBack}
            disabled={step === "type" || Boolean(goal && step === "details")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              step === "type" || (goal && step === "details")
                ? "cursor-not-allowed text-ivory/30"
                : "text-ivory/70 hover:text-ivory"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          {step !== "review" ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-600"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-green-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-green-600 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {goal ? "Mettre à jour" : "Créer l'objectif"}
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
