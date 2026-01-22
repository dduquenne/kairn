"use client";

import { useState } from "react";
import { Edit, Trash2, Star, Eye, EyeOff } from "lucide-react";
import { cn } from "@kairn/ui";
import { ConfirmDialog } from "../common/ConfirmDialog";

export interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  image?: string;
  role?: string;
  company?: string;
  isPublished: boolean;
  createdAt: Date;
}

export interface TestimonialsTableProps {
  /** Testimonials to display */
  testimonials: Testimonial[];
  /** Callback when edit is clicked */
  onEdit?: (testimonial: Testimonial) => void;
  /** Callback when delete is clicked */
  onDelete?: (id: string) => Promise<void>;
  /** Callback when visibility is toggled */
  onToggleVisibility?: (id: string, isPublished: boolean) => Promise<void>;
  /** Whether actions are loading */
  isLoading?: boolean;
  /** Custom class names */
  className?: string;
  /** Labels */
  labels?: {
    name?: string;
    content?: string;
    rating?: string;
    status?: string;
    actions?: string;
    published?: string;
    draft?: string;
    deleteTitle?: string;
    deleteDescription?: string;
  };
}

/**
 * TestimonialsTable - Table for managing testimonials
 *
 * @example
 * ```tsx
 * <TestimonialsTable
 *   testimonials={testimonialsList}
 *   onEdit={(t) => openDrawer(t)}
 *   onDelete={handleDelete}
 *   onToggleVisibility={handleToggle}
 * />
 * ```
 */
export function TestimonialsTable({
  testimonials,
  onEdit,
  onDelete,
  onToggleVisibility,
  isLoading = false,
  className,
  labels = {},
}: TestimonialsTableProps) {
  const {
    name = "Nom",
    content = "Contenu",
    rating = "Note",
    status = "Statut",
    actions = "Actions",
    published = "Publie",
    draft = "Brouillon",
    deleteTitle = "Supprimer le temoignage ?",
    deleteDescription = "Cette action est irreversible.",
  } = labels;

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

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={cn(
              i < count ? "fill-gold text-gold" : "text-ivory/20"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={cn("overflow-x-auto rounded-xl border border-gold/20 bg-night/60", className)}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold/20">
              <th className="px-4 py-3 text-left font-semibold text-ivory/70">{name}</th>
              <th className="px-4 py-3 text-left font-semibold text-ivory/70">{content}</th>
              <th className="px-4 py-3 text-center font-semibold text-ivory/70">{rating}</th>
              <th className="px-4 py-3 text-center font-semibold text-ivory/70">{status}</th>
              <th className="px-4 py-3 text-right font-semibold text-ivory/70">{actions}</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.map((testimonial) => (
              <tr
                key={testimonial.id}
                className="border-b border-gold/10 hover:bg-gold/5 transition"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {testimonial.image ? (
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-gold">
                        {testimonial.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-ivory">{testimonial.name}</p>
                      {(testimonial.role || testimonial.company) && (
                        <p className="text-xs text-ivory/50">
                          {[testimonial.role, testimonial.company].filter(Boolean).join(" - ")}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="line-clamp-2 max-w-xs text-ivory/70">{testimonial.content}</p>
                </td>
                <td className="px-4 py-3 text-center">{renderStars(testimonial.rating)}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                      testimonial.isPublished
                        ? "bg-green-500/20 text-green-400"
                        : "bg-ivory/10 text-ivory/50"
                    )}
                  >
                    {testimonial.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                    {testimonial.isPublished ? published : draft}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {onToggleVisibility && (
                      <button
                        onClick={() => onToggleVisibility(testimonial.id, !testimonial.isPublished)}
                        disabled={isLoading}
                        className="rounded-md p-2 text-ivory/50 transition hover:bg-gold/10 hover:text-gold disabled:opacity-50"
                        title={testimonial.isPublished ? "Hide" : "Publish"}
                      >
                        {testimonial.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(testimonial)}
                        className="rounded-md p-2 text-ivory/50 transition hover:bg-gold/10 hover:text-gold"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => setDeleteId(testimonial.id)}
                        className="rounded-md p-2 text-red-400/50 transition hover:bg-red-500/10 hover:text-red-400"
                        title="Delete"
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
        title={deleteTitle}
        description={deleteDescription}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        variant="danger"
      />
    </>
  );
}
