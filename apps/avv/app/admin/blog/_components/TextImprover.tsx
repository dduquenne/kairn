'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader } from 'lucide-react';
import { useState } from 'react';

interface TextImproverProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onImprove: (improvedText: string) => void;
}

export function TextImprover({ isOpen, onClose, selectedText, onImprove }: TextImproverProps) {
  const [improvementInstructions, setImprovementInstructions] = useState('');
  const [useAvvStyle, setUseAvvStyle] = useState(true);
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
      const csrfResponse = await fetch('/api/csrf-token');
      const { token: csrfToken } = await csrfResponse.json();

      const response = await fetch('/api/blog/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          selectedText,
          improvementInstructions: improvementInstructions.trim(),
          useAvvStyle,
          meta: { honeypot: '' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'amélioration");
      }

      const data = await response.json();

      if (!data.success || !data.improvedText) {
        throw new Error('Réponse invalide du serveur');
      }

      // Appeler le callback avec le texte amélioré
      onImprove(data.improvedText);

      // Réinitialiser et fermer
      setImprovementInstructions('');
      onClose();
    } catch (err) {
      console.error('Error improving text:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsImproving(false);
    }
  };

  const handleClose = () => {
    if (!isImproving) {
      setImprovementInstructions('');
      setError(null);
      onClose();
    }
  };

  const suggestedInstructions = [
    'Améliorer la clarté',
    'Rendre plus empathique',
    'Simplifier le vocabulaire',
    'Ajouter un exemple concret',
    'Reformuler de manière plus poétique',
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
            className="bg-night/80 fixed inset-0 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="border-gold/20 from-night/95 to-night/90 w-full max-w-2xl rounded-lg border bg-gradient-to-br p-6 shadow-2xl backdrop-blur-xl">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gold/20 rounded-lg p-2">
                    <Sparkles className="text-gold h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-ivory text-xl font-semibold">
                      Améliorer le texte sélectionné
                    </h2>
                    <p className="text-ivory/60 text-sm">
                      {selectedText.length} caractères sélectionnés
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isImproving}
                  className="text-ivory/70 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Selected text preview */}
                <div>
                  <label className="text-gold mb-2 block text-sm font-medium">
                    Texte sélectionné
                  </label>
                  <div className="border-gold/20 bg-night/50 max-h-32 overflow-y-auto rounded-lg border p-3">
                    <p className="text-ivory/70 whitespace-pre-wrap text-sm">{selectedText}</p>
                  </div>
                </div>

                {/* Instructions input */}
                <div>
                  <label className="text-gold mb-2 block text-sm font-medium">
                    Comment souhaitez-vous améliorer ce texte ? *
                  </label>
                  <textarea
                    value={improvementInstructions}
                    onChange={e => {
                      setImprovementInstructions(e.target.value);
                      setError(null);
                    }}
                    disabled={isImproving}
                    rows={4}
                    className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full rounded-lg border px-4 py-3 transition focus:outline-none disabled:opacity-50"
                    placeholder="Ex: Rendre ce passage plus empathique et ajouter une métaphore..."
                  />
                  {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                </div>

                {/* Suggested instructions */}
                <div>
                  <label className="text-gold mb-2 block text-sm font-medium">
                    Suggestions rapides
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedInstructions.map((instruction, index) => (
                      <button
                        key={index}
                        onClick={() => setImprovementInstructions(instruction)}
                        disabled={isImproving}
                        className="border-gold/20 bg-night/50 text-ivory/70 hover:border-gold/40 hover:text-ivory rounded-full border px-3 py-1 text-sm transition disabled:opacity-50"
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
                    id="useAvvStyle"
                    checked={useAvvStyle}
                    onChange={e => setUseAvvStyle(e.target.checked)}
                    disabled={isImproving}
                    className="border-gold/20 text-gold focus:ring-gold h-4 w-4 rounded disabled:opacity-50"
                  />
                  <label htmlFor="useAvvStyle" className="text-ivory text-sm font-medium">
                    Utiliser le style rédactionnel AVV
                  </label>
                </div>

                {/* Info box */}
                <div className="border-gold/20 bg-gold/5 rounded-lg border p-4">
                  <p className="text-ivory/70 text-sm">
                    <strong className="text-gold">Note :</strong> Claude va améliorer uniquement le
                    texte sélectionné selon vos instructions. Le texte amélioré remplacera la
                    sélection actuelle. Vous pourrez toujours utiliser Ctrl+Z pour annuler.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="border-gold/10 mt-6 flex items-center justify-between gap-3 border-t pt-4">
                {/* Indicateur de progression */}
                {isImproving && (
                  <div className="flex items-center gap-2">
                    <Loader className="text-gold h-4 w-4 animate-spin" />
                    <span className="text-ivory/70 text-xs">Amélioration en cours...</span>
                  </div>
                )}
                {!isImproving && <div />}

                {/* Boutons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isImproving}
                    className="border-gold/30 text-gold hover:bg-gold/10 rounded-lg border px-6 py-3 font-medium transition disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleImprove}
                    disabled={isImproving || !improvementInstructions.trim()}
                    className="bg-gold/20 text-gold hover:bg-gold/30 flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition disabled:opacity-50"
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
