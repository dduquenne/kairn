"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@kairn/ui";

export interface TestimonialFormData {
  name: string;
  content: string;
  rating: number;
  image?: string;
  role?: string;
  company?: string;
  isPublished: boolean;
}

export interface TestimonialFormProps {
  /** Initial form data */
  initialData?: Partial<TestimonialFormData>;
  /** Callback when form is submitted */
  onSubmit: (data: TestimonialFormData) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Whether form is loading */
  isLoading?: boolean;
  /** Custom class names */
  className?: string;
  /** Labels */
  labels?: {
    name?: string;
    content?: string;
    rating?: string;
    role?: string;
    company?: string;
    image?: string;
    publish?: string;
    save?: string;
    cancel?: string;
  };
}

/**
 * TestimonialForm - Form for creating/editing testimonials
 */
export function TestimonialForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
  labels = {},
}: TestimonialFormProps) {
  const {
    name = "Nom",
    content = "Contenu",
    rating = "Note",
    role = "Role",
    company = "Entreprise",
    image = "Image URL",
    publish = "Publier",
    save = "Enregistrer",
    cancel = "Annuler",
  } = labels;

  const [formData, setFormData] = useState<Partial<TestimonialFormData>>({
    name: "",
    content: "",
    rating: 5,
    isPublished: false,
    ...initialData,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name?.trim() || !formData.content?.trim()) {
      setError("Name and content are required");
      return;
    }

    try {
      await onSubmit(formData as TestimonialFormData);
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

      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ivory/70">{name}</label>
        <input
          type="text"
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
        />
      </div>

      {/* Content */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ivory/70">{content}</label>
        <textarea
          value={formData.content || ""}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={4}
          className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
        />
      </div>

      {/* Rating */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ivory/70">{rating}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFormData({ ...formData, rating: star })}
              className="p-1 transition hover:scale-110"
            >
              <Star
                size={24}
                className={cn(
                  star <= (formData.rating || 0)
                    ? "fill-gold text-gold"
                    : "text-ivory/20 hover:text-gold/50"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Role & Company */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ivory/70">{role}</label>
          <input
            type="text"
            value={formData.role || ""}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ivory/70">{company}</label>
          <input
            type="text"
            value={formData.company || ""}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ivory/70">{image}</label>
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
          {publish}
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
            {cancel}
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-gold/20 border border-gold/50 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30 disabled:opacity-50"
        >
          {isLoading ? "..." : save}
        </button>
      </div>
    </form>
  );
}
