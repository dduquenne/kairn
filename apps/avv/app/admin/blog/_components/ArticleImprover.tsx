'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Loader } from 'lucide-react';
import { useState } from 'react';

interface ArticleImproverProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  onImprove: (improvedContent: string) => void;
}

export function ArticleImprover({
  isOpen,
  onClose,
  currentContent,
  onImprove,
}: ArticleImproverProps) {
  const [improvementPrompt, setImprovementPrompt] = useState('');
  const [useAvvStyle, setUseAvvStyle] = useState(true);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImprove = async () => {
    if (!improvementPrompt.trim()) {
      setError("Veuillez saisir des instructions d'amélioration");
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      // Récupérer le token CSRF
      const csrfResponse = await fetch('/api/csrf-token');
      const { token: csrfToken } = await csrfResponse.json();

      // Utiliser /api/blog/improve-text pour améliorer le contenu complet
      const response = await fetch('/api/blog/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          selectedText: currentContent,
          improvementInstructions: improvementPrompt.trim(),
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

      // Appeler le callback avec le contenu amélioré
      onImprove(data.improvedText);

      // Réinitialiser et fermer
      setImprovementPrompt('');
      onClose();
    } catch (err) {
      console.error('Error improving article:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsImproving(false);
    }
  };

  const handleClose = () => {
    if (!isImproving) {
      setImprovementPrompt('');
      setError(null);
      onClose();
    }
  };

  const suggestedPrompts = [
    'Améliorer la clarté et la lisibilité',
    "Renforcer l'approche empathique",
    "Ajouter plus d'exemples concrets",
    'Optimiser pour le SEO',
    'Approfondir les conseils pratiques',
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
                    <Wand2 className="text-gold h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-ivory text-xl font-semibold">
                      Améliorer l&apos;article avec Claude
                    </h2>
                    <p className="text-ivory/60 text-sm">
                      Décrivez comment vous souhaitez améliorer le contenu
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
                {/* Instructions input */}
                <div>
                  <label className="text-gold mb-2 block text-sm font-medium">
                    Instructions d&apos;amélioration *
                  </label>
                  <textarea
                    value={improvementPrompt}
                    onChange={e => {
                      setImprovementPrompt(e.target.value);
                      setError(null);
                    }}
                    disabled={isImproving}
                    rows={6}
                    className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full rounded-lg border px-4 py-3 transition focus:outline-none disabled:opacity-50"
                    placeholder="Ex: Renforcer la dimension empathique et ajouter des exemples concrets de situations vécues par les lecteurs..."
                  />
                  {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                </div>

                {/* Suggested prompts */}
                <div>
                  <label className="text-gold mb-2 block text-sm font-medium">
                    Suggestions rapides
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setImprovementPrompt(prompt)}
                        disabled={isImproving}
                        className="border-gold/20 bg-night/50 text-ivory/70 hover:border-gold/40 hover:text-ivory rounded-full border px-3 py-1 text-sm transition disabled:opacity-50"
                      >
                        {prompt}
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
                    <strong className="text-gold">Note :</strong> Claude va analyser votre contenu
                    actuel et l&apos;améliorer selon vos instructions. Le contenu amélioré
                    remplacera le contenu actuel de l&apos;éditeur. Vous pourrez toujours utiliser
                    Ctrl+Z pour annuler.
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
                    disabled={isImproving || !improvementPrompt.trim()}
                    className="bg-gold/20 text-gold hover:bg-gold/30 flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition disabled:opacity-50"
                  >
                    {isImproving ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Amélioration en cours...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5" />
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
