"use client";

type DeleteConfirmationProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function DeleteConfirmation({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
  onCancel,
  onConfirm,
  loading = false,
}: DeleteConfirmationProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 text-center">
      <div className="w-full max-w-md rounded-xl border border-rose-400/40 bg-night/90 p-6 text-left shadow-aurora">
        <h3 className="text-lg font-semibold text-ivory">{title}</h3>
        <p className="mt-2 text-sm text-ivory/70">{description}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-night/40 px-4 py-2 text-sm text-ivory/70 transition hover:border-night/60 hover:text-ivory"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-md bg-rose-500/80 px-4 py-2 text-sm font-semibold text-ivory transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Suppression..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
