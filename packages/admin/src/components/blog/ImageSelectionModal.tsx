'use client';

/**
 * Image Selection Modal
 *
 * Modal for previewing and selecting from AI-generated image proposals.
 */

import { X, Loader, Check, RefreshCw, Maximize2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface ImageProposal {
  id: string;
  tempPath: string;
  size: string;
  dimensions: string;
  timestamp: number;
}

interface ImageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSelection: (proposal: ImageProposal) => void;
  onRegenerate?: () => void;
  proposals: ImageProposal[];
  isRegenerating?: boolean;
}

/**
 * Modal de sélection d'image parmi les propositions générées par l'IA
 */
export function ImageSelectionModal({
  isOpen,
  onClose,
  onConfirmSelection,
  onRegenerate,
  proposals,
  isRegenerating = false,
}: ImageSelectionModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(null);
      setZoomedImage(null);
    }
  }, [isOpen, proposals]);

  if (!isOpen) return null;

  const selectedProposal = proposals.find(p => p.id === selectedId);

  const handleConfirm = () => {
    if (selectedProposal) {
      onConfirmSelection(selectedProposal);
    }
  };

  const handleZoom = (tempPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomedImage(tempPath);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="bg-night border-gold/20 relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg border shadow-2xl">
          <div className="bg-night border-gold/20 sticky top-0 z-10 flex items-center justify-between border-b p-6">
            <h2 className="text-gold font-serif text-2xl font-bold">Choisissez votre image</h2>
            <button
              onClick={onClose}
              className="text-ivory/60 hover:bg-gold/10 hover:text-gold rounded-lg p-2 transition"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {proposals.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-ivory/60">Aucune proposition d&apos;image disponible.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {proposals.map(proposal => (
                  <div
                    key={proposal.id}
                    onClick={() => setSelectedId(proposal.id)}
                    className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                      selectedId === proposal.id
                        ? 'border-gold shadow-gold/20 shadow-lg'
                        : 'border-gold/20 hover:border-gold/40'
                    }`}
                  >
                    <div className="bg-night/50 relative aspect-video">
                      <img
                        src={`${proposal.tempPath}?t=${proposal.timestamp}`}
                        alt={`Proposition ${proposal.id}`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      {selectedId === proposal.id && (
                        <div className="bg-gold/10 absolute inset-0 flex items-center justify-center">
                          <div className="bg-gold rounded-full p-2">
                            <Check className="text-night h-6 w-6" />
                          </div>
                        </div>
                      )}
                      <button
                        onClick={e => handleZoom(proposal.tempPath, e)}
                        className="bg-night/80 hover:bg-night text-ivory/60 hover:text-gold absolute right-2 top-2 rounded-lg p-2 transition"
                        aria-label="Agrandir"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="bg-night/80 p-3">
                      <div className="text-ivory/60 flex items-center justify-between text-xs">
                        <span>Image {proposal.id}</span>
                        <span>{proposal.size}</span>
                      </div>
                      <div className="text-ivory/40 mt-1 text-xs">{proposal.dimensions}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="border-gold/20 bg-night/50 text-ivory hover:border-gold hover:bg-gold/10 flex items-center justify-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRegenerating ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Régénération...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Régénérer 3 nouvelles images
                  </>
                )}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="border-gold/20 bg-night/50 text-ivory hover:border-gold hover:bg-gold/10 rounded-lg border px-6 py-3 text-sm font-medium transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedProposal}
                  className="bg-gold text-night hover:bg-gold/90 rounded-lg px-6 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirmer la sélection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-7xl">
            <button
              onClick={() => setZoomedImage(null)}
              className="text-ivory/60 hover:text-gold absolute -top-12 right-0 rounded-lg p-2 transition"
              aria-label="Fermer le zoom"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={zoomedImage}
              alt="Image agrandie"
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
