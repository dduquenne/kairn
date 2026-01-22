"use client";

import { Share2 } from "lucide-react";
import type { Seminar } from "../types";

type SeminarsTableProps = {
  seminars: Seminar[];
  onEdit: (seminar: Seminar) => void;
  onDelete: (seminar: Seminar) => void;
  onShare: (seminar: Seminar) => void;
};

export function SeminarsTable({ seminars, onEdit, onDelete, onShare }: SeminarsTableProps) {
  if (seminars.length === 0) {
    return (
      <div className="rounded-lg border border-night/40 bg-night/60 p-10 text-center text-sm text-ivory/70">
        Aucun séminaire pour le moment. Cliquez sur « Créer » pour en ajouter un.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-night/40 bg-night/60 shadow-aurora/40">
      <table className="min-w-full divide-y divide-night/40 text-sm">
        <thead className="bg-night/80 text-xs uppercase tracking-wide text-ivory/60">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-medium">
              Titre
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium">
              Intervenants
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium">
              Période
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium">
              Capacité
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-night/40">
          {seminars.map((seminar) => (
            <tr key={seminar.id} className="bg-night/40 text-ivory/90">
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-ivory">{seminar.title}</span>
                  <span className="text-xs text-ivory/60">{renderTags(seminar.tags)}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-ivory/80">{renderSpeakers(seminar)}</td>
              <td className="px-4 py-3 text-ivory/80">{formatDateRange(seminar.startAt, seminar.endAt)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-night/60 px-3 py-1 text-xs font-semibold text-gold">
                  {seminar.capacity}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onShare(seminar)}
                    className="rounded-md border border-gold/40 p-1.5 text-gold/70 transition hover:border-gold hover:text-gold hover:bg-gold/10"
                    title="Diffuser sur les réseaux sociaux"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(seminar)}
                    className="rounded-md border border-night/40 px-3 py-1 text-xs font-medium text-ivory/70 transition hover:border-gold/60 hover:text-gold"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(seminar)}
                    className="rounded-md border border-rose-500/40 px-3 py-1 text-xs font-medium text-rose-300 transition hover:border-rose-400 hover:text-rose-200"
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderTags(tags: string[]): string {
  return tags.join(", ");
}

function renderSpeakers(seminar: Seminar): string {
  return seminar.speakers
    .map((speaker) => `${speaker.firstName} ${speaker.lastName}`.trim())
    .join(" & ");
}

function formatDateRange(startAt: string, endAt: string): string {
  try {
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return `${startAt} – ${endAt}`;
    }

    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    if (sameMonth) {
      const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
        month: "short",
        year: "numeric",
      });
      const startDay = new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(start);
      const endDay = new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(end);
      return `${startDay}-${endDay} ${monthFormatter.format(start)}`;
    }

    return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`;
  } catch (error) {
    return `${startAt} – ${endAt}`;
  }
}
