"use client";

import { useState } from "react";
import { Edit, Trash2, Users, Calendar, MapPin, Eye, EyeOff } from "lucide-react";
import { cn } from "@kairn/ui";
import { ConfirmDialog } from "../common/ConfirmDialog";

export interface Seminar {
  id: string;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  location: string;
  maxParticipants?: number;
  currentParticipants: number;
  isPublished: boolean;
  price?: number;
  image?: string;
}

export interface SeminarsTableProps {
  /** Seminars to display */
  seminars: Seminar[];
  /** Callback when edit is clicked */
  onEdit?: (seminar: Seminar) => void;
  /** Callback when delete is clicked */
  onDelete?: (id: string) => Promise<void>;
  /** Callback when visibility is toggled */
  onToggleVisibility?: (id: string, isPublished: boolean) => Promise<void>;
  /** Callback when participants is clicked */
  onViewParticipants?: (seminar: Seminar) => void;
  /** Whether actions are loading */
  isLoading?: boolean;
  /** Custom class names */
  className?: string;
}

/**
 * SeminarsTable - Table for managing seminars/events
 */
export function SeminarsTable({
  seminars,
  onEdit,
  onDelete,
  onToggleVisibility,
  onViewParticipants,
  isLoading = false,
  className,
}: SeminarsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <div className={cn("overflow-x-auto rounded-xl border border-gold/20 bg-night/60", className)}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold/20">
              <th className="px-4 py-3 text-left font-semibold text-ivory/70">Seminaire</th>
              <th className="px-4 py-3 text-left font-semibold text-ivory/70">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-ivory/70">Lieu</th>
              <th className="px-4 py-3 text-center font-semibold text-ivory/70">Participants</th>
              <th className="px-4 py-3 text-center font-semibold text-ivory/70">Statut</th>
              <th className="px-4 py-3 text-right font-semibold text-ivory/70">Actions</th>
            </tr>
          </thead>
          <tbody>
            {seminars.map((seminar) => (
              <tr
                key={seminar.id}
                className="border-b border-gold/10 hover:bg-gold/5 transition"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {seminar.image ? (
                      <img
                        src={seminar.image}
                        alt={seminar.title}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20 text-gold">
                        <Calendar size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-ivory">{seminar.title}</p>
                      {seminar.price !== undefined && (
                        <p className="text-xs text-gold">
                          {seminar.price === 0 ? "Gratuit" : `${seminar.price}€`}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-ivory/70">
                    <Calendar size={14} className="text-gold/70" />
                    <span>{formatDate(seminar.date)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-ivory/70">
                    <MapPin size={14} className="text-gold/70" />
                    <span className="max-w-[150px] truncate">{seminar.location}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onViewParticipants?.(seminar)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold transition hover:bg-gold/20"
                  >
                    <Users size={12} />
                    {seminar.currentParticipants}
                    {seminar.maxParticipants && ` / ${seminar.maxParticipants}`}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                      seminar.isPublished
                        ? "bg-green-500/20 text-green-400"
                        : "bg-ivory/10 text-ivory/50"
                    )}
                  >
                    {seminar.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                    {seminar.isPublished ? "Publie" : "Brouillon"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {onToggleVisibility && (
                      <button
                        onClick={() => onToggleVisibility(seminar.id, !seminar.isPublished)}
                        disabled={isLoading}
                        className="rounded-md p-2 text-ivory/50 transition hover:bg-gold/10 hover:text-gold disabled:opacity-50"
                        title={seminar.isPublished ? "Masquer" : "Publier"}
                      >
                        {seminar.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(seminar)}
                        className="rounded-md p-2 text-ivory/50 transition hover:bg-gold/10 hover:text-gold"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => setDeleteId(seminar.id)}
                        className="rounded-md p-2 text-red-400/50 transition hover:bg-red-500/10 hover:text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer le seminaire ?"
        description="Cette action supprimera egalement toutes les inscriptions. Elle est irreversible."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        variant="danger"
      />
    </>
  );
}
