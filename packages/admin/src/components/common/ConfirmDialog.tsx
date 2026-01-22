"use client";

import { useEffect, useCallback } from "react";
import { cn } from "@kairn/ui";

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Title of the dialog */
  title: string;
  /** Description text */
  description: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Callback when cancel is clicked */
  onCancel: () => void;
  /** Callback when confirm is clicked */
  onConfirm: () => void;
  /** Whether the confirm action is in progress */
  loading?: boolean;
  /** Variant determines the confirm button style */
  variant?: "danger" | "warning" | "default";
  /** Custom class names */
  className?: string;
}

const VARIANT_STYLES = {
  danger: {
    border: "border-rose-400/40",
    button: "bg-rose-500/80 hover:bg-rose-500",
    loadingText: "Suppression...",
  },
  warning: {
    border: "border-amber-400/40",
    button: "bg-amber-500/80 hover:bg-amber-500",
    loadingText: "Traitement...",
  },
  default: {
    border: "border-gold/40",
    button: "bg-gold/80 hover:bg-gold text-night",
    loadingText: "Traitement...",
  },
};

/**
 * ConfirmDialog - Confirmation modal for destructive or important actions
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showDeleteDialog}
 *   title="Delete item?"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   variant="danger"
 *   onCancel={() => setShowDeleteDialog(false)}
 *   onConfirm={handleDelete}
 *   loading={isDeleting}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onCancel,
  onConfirm,
  loading = false,
  variant = "danger",
  className,
}: ConfirmDialogProps) {
  const styles = VARIANT_STYLES[variant];

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onCancel();
      }
    },
    [onCancel, loading]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div
        className={cn(
          "w-full max-w-md rounded-xl border bg-night/90 p-6 text-left shadow-aurora",
          styles.border,
          className
        )}
      >
        <h3
          id="confirm-dialog-title"
          className="text-lg font-semibold text-ivory"
        >
          {title}
        </h3>
        <p
          id="confirm-dialog-description"
          className="mt-2 text-sm text-ivory/70"
        >
          {description}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={cn(
              "rounded-md border border-night/40 px-4 py-2 text-sm text-ivory/70 transition",
              "hover:border-night/60 hover:text-ivory",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold text-ivory transition",
              "disabled:cursor-not-allowed disabled:opacity-60",
              styles.button
            )}
          >
            {loading ? styles.loadingText : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
