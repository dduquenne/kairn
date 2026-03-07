'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/** Props du modal de confirmation de suppression */
export interface DeleteConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal de confirmation pour les actions destructives.
 *
 * Affiche un message d'avertissement et demande une confirmation
 * avant de procéder à la suppression.
 */
export function DeleteConfirmationModal({
  title,
  message,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-night/95 relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500/30 shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-ivory text-lg font-semibold">{title}</h3>
              <p className="text-ivory/70 mt-2 text-sm">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-ivory/50 hover:bg-ivory/10 hover:text-ivory flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="border-ivory/20 text-ivory hover:bg-ivory/5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              Supprimer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
