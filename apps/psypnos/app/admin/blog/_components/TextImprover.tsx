"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader } from "lucide-react";
import { useState } from "react";

interface TextImproverProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onImprove: (improvedText: string) => void;
}

export function TextImprover({
  isOpen,
  onClose,
  selectedText,
  onImprove,
}: TextImproverProps) {
  const [improvementInstructions, setImprovementInstructions] = useState("");
  const [usePsypnosStyle, setUsePsypnosStyle] = useState(true);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImprove = async () => {
    if (!improvementInstructions.trim()) {
      setError("Veuillez saisir des instructions d'amélioration");
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      // Récupérer le token CSRF
      const csrfResponse = await fetch("/api/csrf-token");
      const { token: csrfToken } = await csrfResponse.json();

      const response = await fetch("/api/blog/improve-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          selectedText,
          improvementInstructions: improvementInstructions.trim(),
          usePsypnosStyle,
          meta: { honeypot: "" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'amélioration");
      }

      const data = await response.json();

      if (!data.success || !data.improvedText) {
        throw new Error("Réponse invalide du serveur");
      }

      // Appeler le callback avec le texte amélioré
      onImprove(data.improvedText);

      // Réinitialiser et fermer
      setImprovementInstructions("");
      onClose();
    } catch (err) {
      console.error("Error improving text:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    } finally {
      setIsImproving(false);
    }
  };

  const handleClose = () => {
    if (!isImproving) {
      setImprovementInstructions("");
      setError(null);
      onClose();
    }
  };

  const suggestedInstructions = [
    "Améliorer la clarté",
    "Rendre plus empathique",
    "Simplifier le vocabulaire",
    "Ajouter un exemple concret",
    "Reformuler de manière plus poétique",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-night/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl rounded-lg border border-gold/20 bg-gradient-to-br from-night/95 to-night/90 p-6 shadow-2xl backdrop-blur-xl">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gold/20 p-2">
                    <Sparkles className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-ivory">
                      Améliorer le texte sélectionné
                    </h2>
                    <p className="text-sm text-ivory/60">
                      {selectedText.length} caractères sélectionnés
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isImproving}
                  className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Selected text preview */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gold">
                    Texte sélectionné
                  </label>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-gold/20 bg-night/50 p-3">
                    <p className="text-sm text-ivory/70 whitespace-pre-wrap">
                      {selectedText}
                    </p>
                  </div>
                </div>

                {/* Instructions input */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gold">
                    Comment souhaitez-vous améliorer ce texte ? *
                  </label>
                  <textarea
                    value={improvementInstructions}
                    onChange={(e) => {
                      setImprovementInstructions(e.target.value);
                      setError(null);
                    }}
                    disabled={isImproving}
                    rows={4}
                    className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-3 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none disabled:opacity-50"
                    placeholder="Ex: Rendre ce passage plus empathique et ajouter une métaphore..."
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-400">{error}</p>
                  )}
                </div>

                {/* Suggested instructions */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gold">
                    Suggestions rapides
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedInstructions.map((instruction, index) => (
                      <button
                        key={index}
                        onClick={() => setImprovementInstructions(instruction)}
                        disabled={isImproving}
                        className="rounded-full border border-gold/20 bg-night/50 px-3 py-1 text-sm text-ivory/70 transition hover:border-gold/40 hover:text-ivory disabled:opacity-50"
                      >
                        {instruction}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style option */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="usePsypnosStyle"
                    checked={usePsypnosStyle}
                    onChange={(e) => setUsePsypnosStyle(e.target.checked)}
                    disabled={isImproving}
                    className="h-4 w-4 rounded border-gold/20 text-gold focus:ring-gold disabled:opacity-50"
                  />
                  <label
                    htmlFor="usePsypnosStyle"
                    className="text-sm font-medium text-ivory"
                  >
                    Utiliser le style rédactionnel PSYPNOS
                  </label>
                </div>

                {/* Info box */}
                <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
                  <p className="text-sm text-ivory/70">
                    <strong className="text-gold">Note :</strong> Claude va
                    améliorer uniquement le texte sélectionné selon vos
                    instructions. Le texte amélioré remplacera la sélection
                    actuelle. Vous pourrez toujours utiliser Ctrl+Z pour
                    annuler.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-gold/10 pt-4">
                {/* Indicateur de progression */}
                {isImproving && (
                  <div className="flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin text-gold" />
                    <span className="text-xs text-ivory/70">Amélioration en cours...</span>
                  </div>
                )}
                {!isImproving && <div />}

                {/* Boutons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isImproving}
                    className="rounded-lg border border-gold/30 px-6 py-3 font-medium text-gold transition hover:bg-gold/10 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleImprove}
                    disabled={isImproving || !improvementInstructions.trim()}
                    className="flex items-center gap-2 rounded-lg bg-gold/20 px-6 py-3 font-medium text-gold transition hover:bg-gold/30 disabled:opacity-50"
                  >
                    {isImproving ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Amélioration en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Améliorer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
