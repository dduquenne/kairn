'use client';

import { motion } from 'framer-motion';
import {
  X,
  Bell,
  Mail,
  Webhook,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  Info,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import type {
  Alert,
  AlertMetric,
  AlertCondition,
  AlertTimeWindow,
  AlertType,
  AlertChannel,
  AlertTemplate,
} from './types';
import { METRIC_LABELS, CONDITION_LABELS, TIME_WINDOW_LABELS, ALERT_TYPE_LABELS } from './types';

/** Props du modal de formulaire d'alerte */
export interface AlertFormModalProps {
  alert?: Alert | null;
  template?: AlertTemplate | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (data: Partial<Alert>) => void;
}

type Step = 'basics' | 'condition' | 'notifications' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'basics', label: 'Informations' },
  { id: 'condition', label: 'Condition' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'review', label: 'Confirmation' },
];

/**
 * Modal de création/édition d'alerte avec wizard multi-étapes.
 *
 * Étapes : Informations de base → Condition → Notifications → Confirmation.
 */
export function AlertFormModal({
  alert,
  template,
  isSubmitting,
  onClose,
  onSave,
}: AlertFormModalProps) {
  const [step, setStep] = useState<Step>('basics');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'threshold' as AlertType,
    metric: 'visits' as AlertMetric,
    condition: 'greater_than' as AlertCondition,
    threshold: 100,
    timeWindow: 'day' as AlertTimeWindow,
    channels: ['email'] as AlertChannel[],
    emailRecipients: [''],
    webhookUrl: '',
    enabled: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (alert) {
      setFormData({
        name: alert.name,
        description: alert.description || '',
        type: alert.type,
        metric: alert.metric,
        condition: alert.condition,
        threshold: alert.threshold,
        timeWindow: alert.timeWindow,
        channels: alert.channels,
        emailRecipients: alert.emailRecipients.length > 0 ? alert.emailRecipients : [''],
        webhookUrl: alert.webhookUrl || '',
        enabled: alert.enabled,
      });
    } else if (template) {
      setFormData(prev => ({
        ...prev,
        name: template.name,
        description: template.description,
        ...template.preset,
        emailRecipients: [''],
      }));
    }
  }, [alert, template]);

  /** Valide les champs de l'étape courante */
  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'basics':
        if (!formData.name.trim()) {
          newErrors.name = 'Le nom est requis';
        }
        break;
      case 'condition':
        if (formData.threshold === undefined || isNaN(formData.threshold)) {
          newErrors.threshold = 'Le seuil est requis';
        }
        break;
      case 'notifications':
        if (formData.channels.length === 0) {
          newErrors.channels = 'Sélectionnez au moins un canal';
        }
        if (formData.channels.includes('email')) {
          const validEmails = formData.emailRecipients.filter(
            e => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
          );
          if (validEmails.length === 0) {
            newErrors.email = 'Au moins un email valide est requis';
          }
        }
        if (formData.channels.includes('webhook') && !formData.webhookUrl.trim()) {
          newErrors.webhookUrl = "L'URL webhook est requise";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Passe à l'étape suivante après validation */
  const handleNext = () => {
    if (!validateStep(step)) return;

    const stepIndex = STEPS.findIndex(s => s.id === step);
    const nextStep = STEPS[stepIndex + 1];
    if (stepIndex < STEPS.length - 1 && nextStep) {
      setStep(nextStep.id);
    }
  };

  /** Revient à l'étape précédente */
  const handleBack = () => {
    const stepIndex = STEPS.findIndex(s => s.id === step);
    const prevStep = STEPS[stepIndex - 1];
    if (stepIndex > 0 && prevStep) {
      setStep(prevStep.id);
    }
  };

  /** Soumet le formulaire */
  const handleSubmit = () => {
    if (!validateStep('notifications')) return;

    const data: Partial<Alert> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      metric: formData.metric,
      condition: formData.condition,
      threshold: formData.threshold,
      timeWindow: formData.timeWindow,
      channels: formData.channels,
      emailRecipients: formData.channels.includes('email')
        ? formData.emailRecipients.filter(e => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
        : [],
      webhookUrl: formData.channels.includes('webhook') ? formData.webhookUrl.trim() : undefined,
      enabled: formData.enabled,
    };

    onSave(data);
  };

  /** Ajoute un champ destinataire email */
  const addEmailRecipient = () => {
    setFormData(prev => ({
      ...prev,
      emailRecipients: [...prev.emailRecipients, ''],
    }));
  };

  /** Supprime un destinataire email */
  const removeEmailRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter((_, i) => i !== index),
    }));
  };

  /** Met à jour un destinataire email */
  const updateEmailRecipient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      emailRecipients: prev.emailRecipients.map((e, i) => (i === index ? value : e)),
    }));
  };

  /** Active/désactive un canal de notification */
  const toggleChannel = (channel: AlertChannel) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === step);

  /** Génère un aperçu texte de la condition configurée */
  const getConditionPreview = () => {
    const metric = METRIC_LABELS[formData.metric];
    const condition = CONDITION_LABELS[formData.condition];
    const threshold =
      formData.condition === 'change_percent'
        ? `${formData.threshold > 0 ? '+' : ''}${formData.threshold}%`
        : formData.metric === 'conversion_rate' || formData.metric === 'bounce_rate'
          ? `${formData.threshold}%`
          : formData.metric === 'avg_time'
            ? `${formData.threshold}s`
            : formData.threshold.toLocaleString();
    const timeWindow = TIME_WINDOW_LABELS[formData.timeWindow].toLowerCase();

    return `${metric} ${condition.toLowerCase()} ${threshold} (${timeWindow})`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="border-ivory/20 bg-night/95 relative w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl"
      >
        {/* Header */}
        <div className="border-ivory/10 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-ivory text-lg font-semibold">
                {alert ? "Modifier l'alerte" : 'Nouvelle alerte'}
              </h2>
              {template && !alert && (
                <p className="text-gold text-xs">
                  <Sparkles className="mr-1 inline h-3 w-3" />
                  Basé sur &quot;{template.name}&quot;
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ivory/50 hover:bg-ivory/10 hover:text-ivory flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="border-ivory/10 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => index < currentStepIndex && setStep(s.id)}
                  disabled={index > currentStepIndex}
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                      index < currentStepIndex
                        ? 'bg-green-500/20 text-green-400'
                        : index === currentStepIndex
                          ? 'bg-gold text-night'
                          : 'bg-ivory/10 text-ivory/40'
                    }`}
                  >
                    {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span
                    className={`hidden text-sm sm:block ${
                      index === currentStepIndex ? 'text-ivory font-medium' : 'text-ivory/50'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-8 rounded-full sm:w-12 ${
                      index < currentStepIndex ? 'bg-green-500/40' : 'bg-ivory/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {step === 'basics' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div>
                <label className="text-ivory mb-2 block text-sm font-medium">
                  Nom de l&apos;alerte <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Alerte trafic quotidien"
                  className="border-ivory/20 bg-night/60 text-ivory placeholder:text-ivory/40 focus:border-gold focus:ring-gold/40 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                />
                {errors.name && <p className="mt-1.5 text-sm text-red-400">{errors.name}</p>}
              </div>

              <div>
                <label className="text-ivory mb-2 block text-sm font-medium">
                  Description (optionnel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez le but de cette alerte..."
                  rows={3}
                  className="border-ivory/20 bg-night/60 text-ivory placeholder:text-ivory/40 focus:border-gold focus:ring-gold/40 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="text-ivory mb-2 block text-sm font-medium">
                  Type d&apos;alerte
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                  {(Object.keys(ALERT_TYPE_LABELS) as AlertType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData(prev => ({ ...prev, type }))}
                      className={`rounded-xl border px-4 py-3 text-sm transition-all ${
                        formData.type === type
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-ivory/20 text-ivory/60 hover:border-ivory/40'
                      }`}
                    >
                      {ALERT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'condition' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="border-gold/20 bg-gold/5 rounded-xl border p-4">
                <p className="text-gold mb-2 text-xs font-medium">Aperçu de la condition</p>
                <p className="text-ivory text-lg">{getConditionPreview()}</p>
              </div>

              <div>
                <label className="text-ivory mb-2 block text-sm font-medium">
                  Métrique à surveiller
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(Object.keys(METRIC_LABELS) as AlertMetric[]).map(metric => (
                    <button
                      key={metric}
                      onClick={() => setFormData(prev => ({ ...prev, metric }))}
                      className={`rounded-xl border px-3 py-2.5 text-sm transition-all ${
                        formData.metric === metric
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-ivory/20 text-ivory/60 hover:border-ivory/40'
                      }`}
                    >
                      {METRIC_LABELS[metric]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-ivory mb-2 block text-sm font-medium">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        condition: e.target.value as AlertCondition,
                      }))
                    }
                    className="border-ivory/20 bg-night/60 text-ivory focus:border-gold focus:ring-gold/40 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  >
                    {(Object.keys(CONDITION_LABELS) as AlertCondition[]).map(condition => (
                      <option key={condition} value={condition}>
                        {CONDITION_LABELS[condition]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-ivory mb-2 block text-sm font-medium">
                    Seuil <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.threshold}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          threshold: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="border-ivory/20 bg-night/60 text-ivory focus:border-gold focus:ring-gold/40 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                    />
                    {(formData.condition === 'change_percent' ||
                      formData.metric === 'conversion_rate' ||
                      formData.metric === 'bounce_rate') && (
                      <span className="text-ivory/50 absolute right-4 top-1/2 -translate-y-1/2">
                        %
                      </span>
                    )}
                    {formData.metric === 'avg_time' && formData.condition !== 'change_percent' && (
                      <span className="text-ivory/50 absolute right-4 top-1/2 -translate-y-1/2">
                        sec
                      </span>
                    )}
                  </div>
                  {errors.threshold && (
                    <p className="mt-1.5 text-sm text-red-400">{errors.threshold}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-ivory mb-2 block text-sm font-medium">
                  Fenêtre de temps
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.keys(TIME_WINDOW_LABELS) as AlertTimeWindow[]).map(window => (
                    <button
                      key={window}
                      onClick={() => setFormData(prev => ({ ...prev, timeWindow: window }))}
                      className={`rounded-xl border px-3 py-2.5 text-sm transition-all ${
                        formData.timeWindow === window
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-ivory/20 text-ivory/60 hover:border-ivory/40'
                      }`}
                    >
                      {TIME_WINDOW_LABELS[window]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div>
                <label className="text-ivory mb-3 block text-sm font-medium">
                  Canaux de notification <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleChannel('email')}
                    className={`flex flex-1 items-center gap-3 rounded-xl border p-4 transition-all ${
                      formData.channels.includes('email')
                        ? 'border-blue-500/40 bg-blue-500/10'
                        : 'border-ivory/20 hover:border-ivory/40'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        formData.channels.includes('email')
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-ivory/10 text-ivory/40'
                      }`}
                    >
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-ivory font-medium">Email</p>
                      <p className="text-ivory/50 text-xs">Notification par email</p>
                    </div>
                  </button>

                  <button
                    onClick={() => toggleChannel('webhook')}
                    className={`flex flex-1 items-center gap-3 rounded-xl border p-4 transition-all ${
                      formData.channels.includes('webhook')
                        ? 'border-purple-500/40 bg-purple-500/10'
                        : 'border-ivory/20 hover:border-ivory/40'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        formData.channels.includes('webhook')
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-ivory/10 text-ivory/40'
                      }`}
                    >
                      <Webhook className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-ivory font-medium">Webhook</p>
                      <p className="text-ivory/50 text-xs">Intégration externe</p>
                    </div>
                  </button>
                </div>
                {errors.channels && (
                  <p className="mt-1.5 text-sm text-red-400">{errors.channels}</p>
                )}
              </div>

              {formData.channels.includes('email') && (
                <div>
                  <label className="text-ivory mb-2 block text-sm font-medium">
                    Destinataires email <span className="text-red-400">*</span>
                  </label>
                  <div className="space-y-2">
                    {formData.emailRecipients.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={e => updateEmailRecipient(index, e.target.value)}
                          placeholder="email@exemple.com"
                          className="border-ivory/20 bg-night/60 text-ivory placeholder:text-ivory/40 focus:border-gold focus:ring-gold/40 flex-1 rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                        />
                        {formData.emailRecipients.length > 1 && (
                          <button
                            onClick={() => removeEmailRecipient(index)}
                            className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addEmailRecipient}
                    className="text-gold mt-2 flex items-center gap-2 text-sm hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un destinataire
                  </button>
                  {errors.email && <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>}
                </div>
              )}

              {formData.channels.includes('webhook') && (
                <div>
                  <label className="text-ivory mb-2 block text-sm font-medium">
                    URL Webhook <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.webhookUrl}
                    onChange={e => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://exemple.com/webhook"
                    className="border-ivory/20 bg-night/60 text-ivory placeholder:text-ivory/40 focus:border-gold focus:ring-gold/40 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                  />
                  {errors.webhookUrl && (
                    <p className="mt-1.5 text-sm text-red-400">{errors.webhookUrl}</p>
                  )}
                  <p className="text-ivory/50 mt-2 flex items-start gap-2 text-xs">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Le webhook recevra un POST avec les détails de l&apos;alerte en JSON
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="border-ivory/20 bg-night/60 rounded-xl border p-5">
                <h3 className="text-ivory mb-4 font-semibold">Récapitulatif de l&apos;alerte</h3>

                <div className="space-y-4">
                  <div className="border-ivory/10 flex justify-between border-b pb-3">
                    <span className="text-ivory/60">Nom</span>
                    <span className="text-ivory font-medium">{formData.name}</span>
                  </div>

                  {formData.description && (
                    <div className="border-ivory/10 flex justify-between border-b pb-3">
                      <span className="text-ivory/60">Description</span>
                      <span className="text-ivory max-w-[200px] truncate">
                        {formData.description}
                      </span>
                    </div>
                  )}

                  <div className="border-ivory/10 flex justify-between border-b pb-3">
                    <span className="text-ivory/60">Condition</span>
                    <span className="text-gold">{getConditionPreview()}</span>
                  </div>

                  <div className="border-ivory/10 flex justify-between border-b pb-3">
                    <span className="text-ivory/60">Notifications</span>
                    <div className="flex gap-2">
                      {formData.channels.includes('email') && (
                        <span className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                          <Mail className="h-3 w-3" />
                          Email
                        </span>
                      )}
                      {formData.channels.includes('webhook') && (
                        <span className="flex items-center gap-1 rounded-lg bg-purple-500/10 px-2 py-1 text-xs text-purple-400">
                          <Webhook className="h-3 w-3" />
                          Webhook
                        </span>
                      )}
                    </div>
                  </div>

                  {formData.channels.includes('email') && (
                    <div className="flex justify-between pb-3">
                      <span className="text-ivory/60">Destinataires</span>
                      <span className="text-ivory">
                        {formData.emailRecipients.filter(e => e.trim()).length} email(s)
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
                  <p className="text-ivory font-medium">Prêt à créer</p>
                  <p className="text-ivory/60 text-sm">
                    L&apos;alerte sera activée immédiatement après création
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="border-ivory/10 flex items-center justify-between border-t px-6 py-4">
          <button
            onClick={handleBack}
            disabled={step === 'basics'}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              step === 'basics'
                ? 'text-ivory/30 cursor-not-allowed'
                : 'text-ivory/70 hover:text-ivory'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          {step !== 'review' ? (
            <button
              onClick={handleNext}
              className="bg-gold text-night hover:bg-gold/90 flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-all"
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
                  {alert ? 'Mettre à jour' : "Créer l'alerte"}
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
