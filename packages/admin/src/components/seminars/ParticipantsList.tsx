"use client";

import { useState } from "react";
import { Mail, Phone, Calendar, Check, X, Download } from "lucide-react";
import { cn } from "@kairn/ui";

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  registeredAt: Date;
  status: "confirmed" | "pending" | "cancelled";
  notes?: string;
}

export interface ParticipantsListProps {
  /** Participants to display */
  participants: Participant[];
  /** Seminar title for context */
  seminarTitle?: string;
  /** Callback when status is changed */
  onStatusChange?: (id: string, status: Participant["status"]) => Promise<void>;
  /** Callback to export participants */
  onExport?: () => void;
  /** Whether actions are loading */
  isLoading?: boolean;
  /** Custom class names */
  className?: string;
}

/**
 * ParticipantsList - List of seminar participants with status management
 */
export function ParticipantsList({
  participants,
  seminarTitle,
  onStatusChange,
  onExport,
  isLoading = false,
  className,
}: ParticipantsListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: Participant["status"]) => {
    if (!onStatusChange) return;
    setUpdatingId(id);
    try {
      await onStatusChange(id, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusColors = {
    confirmed: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    cancelled: "bg-red-500/20 text-red-400",
  };

  const statusLabels = {
    confirmed: "Confirme",
    pending: "En attente",
    cancelled: "Annule",
  };

  const confirmedCount = participants.filter((p) => p.status === "confirmed").length;
  const pendingCount = participants.filter((p) => p.status === "pending").length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {seminarTitle && (
            <h3 className="text-lg font-semibold text-gold">{seminarTitle}</h3>
          )}
          <p className="text-sm text-ivory/50">
            {participants.length} participant{participants.length !== 1 ? "s" : ""} •{" "}
            <span className="text-green-400">{confirmedCount} confirme{confirmedCount !== 1 ? "s" : ""}</span>
            {pendingCount > 0 && (
              <span className="text-yellow-400"> • {pendingCount} en attente</span>
            )}
          </p>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold transition hover:bg-gold/20"
          >
            <Download size={16} />
            Exporter
          </button>
        )}
      </div>

      {/* Participants list */}
      <div className="space-y-2">
        {participants.length === 0 ? (
          <div className="rounded-xl border border-gold/20 bg-night/60 p-8 text-center text-ivory/50">
            Aucun participant inscrit
          </div>
        ) : (
          participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-4 rounded-xl border border-gold/20 bg-night/60 p-4 transition hover:border-gold/40"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-gold">
                {(participant.name[0] ?? "?").toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ivory">{participant.name}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-ivory/50">
                  <span className="flex items-center gap-1">
                    <Mail size={12} />
                    {participant.email}
                  </span>
                  {participant.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} />
                      {participant.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(participant.registeredAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>

              {/* Status */}
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  statusColors[participant.status]
                )}
              >
                {statusLabels[participant.status]}
              </span>

              {/* Actions */}
              {onStatusChange && participant.status !== "cancelled" && (
                <div className="flex items-center gap-1">
                  {participant.status === "pending" && (
                    <button
                      onClick={() => handleStatusChange(participant.id, "confirmed")}
                      disabled={isLoading || updatingId === participant.id}
                      className="rounded-md p-2 text-green-400/70 transition hover:bg-green-500/10 hover:text-green-400 disabled:opacity-50"
                      title="Confirmer"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange(participant.id, "cancelled")}
                    disabled={isLoading || updatingId === participant.id}
                    className="rounded-md p-2 text-red-400/70 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    title="Annuler"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
