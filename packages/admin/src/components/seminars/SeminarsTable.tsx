'use client';

import { cn } from '@kairn/ui';
import { Edit, Trash2, Share2, Calendar } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * Speaker information for a seminar
 */
export interface SeminarSpeaker {
  firstName: string;
  lastName: string;
}

/**
 * Seminar data shape used by the admin table.
 * Supports both simple (date/location) and enriched (speakers/startAt/endAt) models.
 */
export interface Seminar {
  id: string;
  title: string;
  description?: string;
  speakers?: SeminarSpeaker[];
  startAt?: string;
  endAt?: string;
  date?: Date;
  endDate?: Date;
  location?: string;
  capacity?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  price?: number;
  deposit?: number;
  order?: string;
  tags?: string[];
  thumbnail?: string;
  seminarType?: string;
  isPublished?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Props for the SeminarsTable component
 */
export interface SeminarsTableProps {
  /** Seminars to display */
  seminars: Seminar[];
  /** Callback when edit is clicked */
  onEdit?: (seminar: Seminar) => void;
  /** Callback when delete is clicked */
  onDelete?: (seminar: Seminar) => void;
  /** Callback when share is clicked */
  onShare?: (seminar: Seminar) => void;
  /** Whether to show delete confirmation inline */
  showDeleteConfirm?: boolean;
  /** Custom delete handler (used with showDeleteConfirm) */
  onDeleteConfirm?: (id: string) => Promise<void>;
  /** Whether actions are loading */
  isLoading?: boolean;
  /** Custom class names */
  className?: string;
  /** Custom empty state message */
  emptyMessage?: string;
}

/**
 * SeminarsTable - Configurable table for managing seminars/events
 *
 * Supports both simple (date/location) and enriched (speakers/startAt/endAt) seminar models.
 */
export function SeminarsTable({
  seminars,
  onEdit,
  onDelete,
  onShare,
  showDeleteConfirm = false,
  onDeleteConfirm,
  isLoading = false,
  className,
  emptyMessage = 'Aucun séminaire pour le moment. Cliquez sur « Créer » pour en ajouter un.',
}: SeminarsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasSpeakers = seminars.some(s => s.speakers && s.speakers.length > 0);
  const hasLocation = seminars.some(s => s.location);

  /** @internal */
  const handleDelete = async () => {
    if (!deleteId || !onDeleteConfirm) return;
    setIsDeleting(true);
    try {
      await onDeleteConfirm(deleteId);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  /** @internal */
  const handleDeleteClick = (seminar: Seminar) => {
    if (showDeleteConfirm && onDeleteConfirm) {
      setDeleteId(seminar.id);
    } else if (onDelete) {
      onDelete(seminar);
    }
  };

  if (seminars.length === 0) {
    return (
      <div className="border-night/40 bg-night/60 text-ivory/70 rounded-lg border p-10 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'border-night/40 bg-night/60 shadow-aurora/40 overflow-x-auto rounded-xl border',
          className
        )}
      >
        <table className="divide-night/40 min-w-full divide-y text-sm">
          <thead className="bg-night/80 text-ivory/60 text-xs uppercase tracking-wide">
            <tr>
              <th scope="col" className="px-3 py-3 text-left font-medium sm:px-4">
                Titre
              </th>
              {hasSpeakers && (
                <th
                  scope="col"
                  className="hidden px-3 py-3 text-left font-medium sm:table-cell sm:px-4"
                >
                  Intervenants
                </th>
              )}
              {hasLocation && (
                <th
                  scope="col"
                  className="hidden px-3 py-3 text-left font-medium sm:table-cell sm:px-4"
                >
                  Lieu
                </th>
              )}
              <th
                scope="col"
                className="hidden px-3 py-3 text-left font-medium md:table-cell md:px-4"
              >
                Période
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3 text-left font-medium lg:table-cell lg:px-4"
              >
                Capacité
              </th>
              <th scope="col" className="px-3 py-3 text-right font-medium sm:px-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-night/40 divide-y">
            {seminars.map(seminar => (
              <tr key={seminar.id} className="bg-night/40 text-ivory/90">
                <td className="px-3 py-3 sm:px-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      {seminar.thumbnail ? (
                        <img
                          src={seminar.thumbnail}
                          alt={seminar.title}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : null}
                      <div>
                        <span className="text-ivory font-medium">{seminar.title}</span>
                        {seminar.price !== undefined && (
                          <p className="text-gold text-xs">
                            {seminar.price === 0 ? 'Gratuit' : `${seminar.price}€`}
                          </p>
                        )}
                      </div>
                    </div>
                    {seminar.tags && seminar.tags.length > 0 && (
                      <span className="text-ivory/60 text-xs">{seminar.tags.join(', ')}</span>
                    )}
                    {hasSpeakers && (
                      <span className="text-ivory/50 text-xs sm:hidden">
                        {renderSpeakers(seminar)}
                      </span>
                    )}
                    <span className="text-ivory/50 text-xs md:hidden">
                      {formatDateRange(seminar)}
                    </span>
                  </div>
                </td>
                {hasSpeakers && (
                  <td className="text-ivory/80 hidden px-3 py-3 sm:table-cell sm:px-4">
                    {renderSpeakers(seminar)}
                  </td>
                )}
                {hasLocation && (
                  <td className="hidden px-3 py-3 sm:table-cell sm:px-4">
                    <span className="text-ivory/70 max-w-[150px] truncate">{seminar.location}</span>
                  </td>
                )}
                <td className="text-ivory/80 hidden px-3 py-3 md:table-cell md:px-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gold/70" />
                    {formatDateRange(seminar)}
                  </div>
                </td>
                <td className="hidden px-3 py-3 lg:table-cell lg:px-4">
                  <span className="bg-night/60 text-gold rounded-full px-3 py-1 text-xs font-semibold">
                    {seminar.capacity ?? seminar.maxParticipants ?? '—'}
                    {seminar.currentParticipants !== undefined &&
                      ` (${seminar.currentParticipants} inscrits)`}
                  </span>
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                    {onShare && (
                      <button
                        type="button"
                        onClick={() => onShare(seminar)}
                        disabled={isLoading}
                        className="border-gold/40 text-gold/70 hover:border-gold hover:bg-gold/10 hover:text-gold rounded-md border p-1.5 transition disabled:opacity-50"
                        title="Diffuser sur les réseaux sociaux"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(seminar)}
                        disabled={isLoading}
                        className="border-night/40 text-ivory/70 hover:border-gold/60 hover:text-gold rounded-md border px-3 py-1 text-xs font-medium transition disabled:opacity-50"
                        title="Modifier"
                      >
                        <span className="hidden sm:inline">Modifier</span>
                        <Edit size={16} className="sm:hidden" />
                      </button>
                    )}
                    {(onDelete || (showDeleteConfirm && onDeleteConfirm)) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(seminar)}
                        disabled={isLoading}
                        className="rounded-md border border-rose-500/40 px-3 py-1 text-xs font-medium text-rose-300 transition hover:border-rose-400 hover:text-rose-200 disabled:opacity-50"
                        title="Supprimer"
                      >
                        <span className="hidden sm:inline">Supprimer</span>
                        <Trash2 size={16} className="sm:hidden" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          open={!!deleteId}
          title="Supprimer le séminaire ?"
          description="Cette action supprimera également toutes les inscriptions. Elle est irréversible."
          onCancel={() => setDeleteId(null)}
          onConfirm={handleDelete}
          loading={isDeleting}
          variant="danger"
        />
      )}
    </>
  );
}

/**
 * Format speakers list as a display string
 */
function renderSpeakers(seminar: Seminar): string {
  if (!seminar.speakers || seminar.speakers.length === 0) return '';
  return seminar.speakers
    .map(speaker => `${speaker.firstName} ${speaker.lastName}`.trim())
    .join(' & ');
}

/**
 * Format date range for display
 */
function formatDateRange(seminar: Seminar): string {
  const startRaw = seminar.startAt ?? seminar.date?.toISOString();
  const endRaw = seminar.endAt ?? seminar.endDate?.toISOString();

  if (!startRaw) return '—';

  try {
    const start = new Date(startRaw);
    if (Number.isNaN(start.getTime())) return startRaw;

    if (!endRaw) {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(start);
    }

    const end = new Date(endRaw);
    if (Number.isNaN(end.getTime())) return startRaw;

    const sameMonth =
      start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

    if (sameMonth) {
      const monthFormatter = new Intl.DateTimeFormat('fr-FR', {
        month: 'short',
        year: 'numeric',
      });
      const startDay = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(start);
      const endDay = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(end);
      return `${startDay}-${endDay} ${monthFormatter.format(start)}`;
    }

    const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`;
  } catch {
    return startRaw;
  }
}
