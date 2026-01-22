"use client";

import { useState } from "react";
import { cn } from "@kairn/ui";

export interface SeminarFormData {
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  location: string;
  maxParticipants?: number;
  price?: number;
  image?: string;
  isPublished: boolean;
}

export interface SeminarFormProps {
  /** Initial form data */
  initialData?: Partial<SeminarFormData>;
  /** Callback when form is submitted */
  onSubmit: (data: SeminarFormData) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Whether form is loading */
  isLoading?: boolean;
  /** Custom class names */
  className?: string;
}

/**
 * SeminarForm - Form for creating/editing seminars
 */
export function SeminarForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: SeminarFormProps) {
  const [formData, setFormData] = useState<Partial<SeminarFormData>>({
    title: "",
    description: "",
    date: "",
    location: "",
    isPublished: false,
    ...initialData,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title?.trim() || !formData.date || !formData.location?.trim()) {
      setError("Title, date and location are required");
      return;
    }

    try {
      await onSubmit(formData as SeminarFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ivory/70">Titre</label>
        <input
          type="text"
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ivory/70">Description</label>
        <textarea
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
        />
      </div>

      {/* Date & End Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ivory/70">Date de debut</label>
          <input
            type="datetime-local"
            value={formData.date || ""}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ivory/70">Date de fin</label>
          <input
            type="datetime-local"
            value={formData.endDate || ""}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ivory/70">Lieu</label>
        <input
          type="text"
          value={formData.location || ""}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
        />
      </div>

      {/* Max Participants & Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ivory/70">Places max</label>
          <input
            type="number"
            min="0"
            value={formData.maxParticipants || ""}
            onChange={(e) =>
              setFormData({ ...formData, maxParticipants: e.target.value ? parseInt(e.target.value) : undefined })
            }
            className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
            placeholder="Illimite"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ivory/70">Prix (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.price || ""}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })
            }
            className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
            placeholder="Gratuit"
          />
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ivory/70">Image URL</label>
        <input
          type="url"
          value={formData.image || ""}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
          placeholder="https://..."
        />
      </div>

      {/* Publish toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublished"
          checked={formData.isPublished || false}
          onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
          className="h-4 w-4 rounded border-gold/30 bg-night/50 text-gold focus:ring-gold"
        />
        <label htmlFor="isPublished" className="text-sm text-ivory/70">
          Publier le seminaire
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gold/20 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-gold/30 px-4 py-2 text-sm text-ivory/70 transition hover:bg-gold/10 disabled:opacity-50"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-gold/20 border border-gold/50 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30 disabled:opacity-50"
        >
          {isLoading ? "..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
