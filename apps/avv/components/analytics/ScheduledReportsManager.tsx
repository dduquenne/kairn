/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Power,
  Mail,
  FileText,
  Clock,
  RefreshCw,
  Send,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  recipients: string[];
  format: "email" | "pdf" | "both";
  sections: string[];
  enabled: boolean;
  lastSent?: string;
  nextScheduled?: string;
  createdAt: string;
  updatedAt: string;
}

const frequencyLabels: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
};

const formatLabels: Record<string, string> = {
  email: "Email HTML",
  pdf: "PDF",
  both: "Email + PDF",
};

const sectionLabels: Record<string, string> = {
  summary: "Resume",
  traffic: "Sources de trafic",
  conversions: "Conversions",
  sections: "Sections",
  devices: "Appareils",
  cohorts: "Cohortes",
  insights: "Analyses IA",
};

const dayOfWeekLabels = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function ScheduledReportsManager() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    frequency: "daily" | "weekly" | "monthly";
    dayOfWeek: number;
    dayOfMonth: number;
    timeOfDay: string;
    recipients: string;
    format: "email" | "pdf" | "both";
    sections: string[];
    enabled: boolean;
  }>({
    name: "",
    description: "",
    frequency: "weekly",
    dayOfWeek: 1,
    dayOfMonth: 1,
    timeOfDay: "08:00",
    recipients: "",
    format: "email",
    sections: ["summary", "traffic", "conversions"],
    enabled: true,
  });

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics/scheduled-reports");
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      recipients: formData.recipients.split(",").map((e) => e.trim()).filter(Boolean),
      dayOfWeek: formData.frequency === "weekly" ? formData.dayOfWeek : undefined,
      dayOfMonth: formData.frequency === "monthly" ? formData.dayOfMonth : undefined,
    };

    try {
      const url = editingReport
        ? `/api/analytics/scheduled-reports?id=${editingReport.id}`
        : "/api/analytics/scheduled-reports";
      const method = editingReport ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setEditingReport(null);
        resetForm();
        await fetchReports();
      }
    } catch (error) {
      console.error("Error saving report:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce rapport programme ?")) return;

    try {
      const response = await fetch(`/api/analytics/scheduled-reports?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchReports();
      }
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  const handleToggle = async (report: ScheduledReport) => {
    try {
      const response = await fetch(`/api/analytics/scheduled-reports?id=${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !report.enabled }),
      });
      if (response.ok) {
        await fetchReports();
      }
    } catch (error) {
      console.error("Error toggling report:", error);
    }
  };

  const handleEdit = (report: ScheduledReport) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      description: report.description || "",
      frequency: report.frequency,
      dayOfWeek: report.dayOfWeek || 1,
      dayOfMonth: report.dayOfMonth || 1,
      timeOfDay: report.timeOfDay,
      recipients: report.recipients.join(", "),
      format: report.format,
      sections: report.sections,
      enabled: report.enabled,
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      frequency: "weekly",
      dayOfWeek: 1,
      dayOfMonth: 1,
      timeOfDay: "08:00",
      recipients: "",
      format: "email",
      sections: ["summary", "traffic", "conversions"],
      enabled: true,
    });
  };

  const toggleSection = (section: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...prev.sections, section],
    }));
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
          <Calendar className="text-gold" size={24} />
          <h3 className="text-lg font-semibold text-ivory">Rapports Programmes</h3>
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">
            {reports.filter((r) => r.enabled).length} actifs
          </span>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingReport(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-night transition-colors hover:bg-gold/90"
        >
          <Plus size={16} />
          Nouveau Rapport
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="rounded-lg border border-gold/20 bg-night/40 p-8 text-center">
            <Calendar className="mx-auto mb-3 text-gold/40" size={48} />
            <p className="text-ivory/60">Aucun rapport programme</p>
            <p className="mt-1 text-sm text-ivory/40">
              Configurez des rapports automatiques pour recevoir vos analyses par email.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className={`rounded-lg border ${
                report.enabled ? "border-gold/30" : "border-ivory/10"
              } bg-night/40 p-4 transition-all hover:bg-night/60`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gold/20 p-2 text-gold">
                      <Send size={16} />
                    </div>
                    <div>
                      <h4 className="font-medium text-ivory">{report.name}</h4>
                      <p className="text-sm text-ivory/60">
                        {frequencyLabels[report.frequency]}
                        {report.frequency === "weekly" && report.dayOfWeek !== undefined
                          ? ` (${dayOfWeekLabels[report.dayOfWeek]})`
                          : ""}
                        {report.frequency === "monthly" && report.dayOfMonth !== undefined
                          ? ` (le ${report.dayOfMonth})`
                          : ""}{" "}
                        a {report.timeOfDay} - {formatLabels[report.format]}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-ivory/50">
                      <Mail size={12} />
                      {report.recipients.length} destinataire(s)
                    </div>
                    <div className="flex items-center gap-1 text-xs text-ivory/50">
                      <FileText size={12} />
                      {report.sections.length} section(s)
                    </div>
                    {report.lastSent && (
                      <div className="flex items-center gap-1 text-xs text-ivory/50">
                        <Clock size={12} />
                        Dernier envoi: {new Date(report.lastSent).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                    {report.nextScheduled && (
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <Clock size={12} />
                        Prochain: {new Date(report.nextScheduled).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {report.sections.map((section) => (
                      <span
                        key={section}
                        className="rounded bg-ivory/10 px-2 py-0.5 text-xs text-ivory/60"
                      >
                        {sectionLabels[section] || section}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(report)}
                    className={`rounded-lg p-2 transition-colors ${
                      report.enabled
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-ivory/10 text-ivory/40 hover:bg-ivory/20"
                    }`}
                    title={report.enabled ? "Desactiver" : "Activer"}
                  >
                    <Power size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(report)}
                    className="rounded-lg bg-ivory/10 p-2 text-ivory/60 transition-colors hover:bg-ivory/20 hover:text-ivory"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
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
              {editingReport ? "Modifier le rapport" : "Nouveau rapport programme"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-ivory/70">Nom du rapport</label>
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
                  <label className="mb-1 block text-sm text-ivory/70">Frequence</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value as "daily" | "weekly" | "monthly" })
                    }
                    className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                  >
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-ivory/70">Heure d'envoi</label>
                  <input
                    type="time"
                    value={formData.timeOfDay}
                    onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                    className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                    required
                  />
                </div>
              </div>

              {formData.frequency === "weekly" && (
                <div>
                  <label className="mb-1 block text-sm text-ivory/70">Jour de la semaine</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                  >
                    {dayOfWeekLabels.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.frequency === "monthly" && (
                <div>
                  <label className="mb-1 block text-sm text-ivory/70">Jour du mois</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm text-ivory/70">
                  Destinataires (separes par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-ivory/70">Format</label>
                <select
                  value={formData.format}
                  onChange={(e) =>
                    setFormData({ ...formData, format: e.target.value as "email" | "pdf" | "both" })
                  }
                  className="w-full rounded-lg border border-gold/20 bg-night/60 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                >
                  <option value="email">Email HTML</option>
                  <option value="pdf">PDF en piece jointe</option>
                  <option value="both">Email + PDF</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-ivory/70">Sections a inclure</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sectionLabels).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSection(key)}
                      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        formData.sections.includes(key)
                          ? "bg-gold text-night"
                          : "bg-ivory/10 text-ivory/70 hover:bg-ivory/20"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded border-gold/20 bg-night/60 text-gold focus:ring-gold"
                />
                <label htmlFor="enabled" className="text-sm text-ivory/70">
                  Activer le rapport
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingReport(null);
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
                  {editingReport ? "Enregistrer" : "Creer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
