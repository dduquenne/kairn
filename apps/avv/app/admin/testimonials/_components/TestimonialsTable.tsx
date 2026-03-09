"use client";

import type { Testimonial } from "../types";

type TestimonialsTableProps = {
  testimonials: Testimonial[];
  onEdit: (testimonial: Testimonial) => void;
  onDelete: (testimonial: Testimonial) => void;
};

export function TestimonialsTable({ testimonials, onEdit, onDelete }: TestimonialsTableProps) {
  if (testimonials.length === 0) {
    return (
      <div className="rounded-lg border border-night/40 bg-night/60 p-10 text-center text-sm text-ivory/70">
        Aucun témoignage pour le moment. Cliquez sur « Ajouter » pour en créer un.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-night/40 bg-night/60 shadow-aurora/40">
      <table className="min-w-full divide-y divide-night/40 text-sm">
        <thead className="bg-night/80 text-xs uppercase tracking-wide text-ivory/60">
          <tr>
            <th scope="col" className="px-3 py-3 text-left font-medium sm:px-4">
              Témoignage
            </th>
            <th scope="col" className="hidden px-3 py-3 text-left font-medium sm:table-cell sm:px-4">
              Auteur·rice
            </th>
            <th scope="col" className="hidden px-3 py-3 text-left font-medium md:table-cell md:px-4">
              Fonction
            </th>
            <th scope="col" className="hidden px-3 py-3 text-left font-medium lg:table-cell lg:px-4">
              Mise à jour
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium sm:px-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-night/40">
          {testimonials.map((testimonial) => (
            <tr key={testimonial.id} className="bg-night/40 text-ivory/90">
              <td className="px-3 py-3 sm:px-4">
                <p className="text-sm text-ivory/70">{truncate(testimonial.quote, 80)}</p>
                <p className="mt-1 text-xs font-medium text-ivory sm:hidden">
                  {testimonial.author}
                </p>
              </td>
              <td className="hidden px-3 py-3 font-medium text-ivory sm:table-cell sm:px-4">
                {testimonial.author}
              </td>
              <td className="hidden px-3 py-3 text-ivory/70 md:table-cell md:px-4">
                {testimonial.role ?? "—"}
              </td>
              <td className="hidden px-3 py-3 text-ivory/70 lg:table-cell lg:px-4">
                {formatDate(testimonial.updatedAt)}
              </td>
              <td className="px-3 py-3 sm:px-4">
                <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(testimonial)}
                    className="rounded-md border border-night/40 px-3 py-1 text-xs font-medium text-ivory/70 transition hover:border-gold/60 hover:text-gold"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(testimonial)}
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

function truncate(value: string, maxLength = 120): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

function formatDate(value: string): string {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return value;
  }
}
