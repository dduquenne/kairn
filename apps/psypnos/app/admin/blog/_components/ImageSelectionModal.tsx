"use client";

import { useEffect, useState } from "react";
import { X, Loader, Check, RefreshCw, Maximize2 } from "lucide-react";

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

  // Réinitialiser la sélection quand le modal s'ouvre ou quand les proposals changent
  useEffect(() => {
    if (isOpen) {
      setSelectedId(null);
      setZoomedImage(null);
    }
  }, [isOpen, proposals]);

  if (!isOpen) return null;

  const selectedProposal = proposals.find((p) => p.id === selectedId);

  const handleConfirm = () => {
    if (selectedProposal) {
      onConfirmSelection(selectedProposal);
    }
  };

  const handleImageClick = (id: string) => {
    setSelectedId(id);
  };

  const handleZoom = (tempPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomedImage(tempPath);
  };

  const closeZoom = () => {
    setZoomedImage(null);
  };

  return (
    <>
      {/* Modal principale */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg bg-night border border-gold/20 shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/20 bg-night p-6">
            <h2 className="text-2xl font-serif font-bold text-gold">
              Choisissez votre image
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-ivory/60 transition hover:bg-gold/10 hover:text-gold"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {proposals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-ivory/60">Aucune proposition d'image disponible.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    onClick={() => handleImageClick(proposal.id)}
                    className={`
                      relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                      ${
                        selectedId === proposal.id
                          ? "border-gold shadow-lg shadow-gold/20"
                          : "border-gold/20 hover:border-gold/40"
                      }
                    `}
                  >
                    {/* Image */}
                    <div className="relative aspect-video bg-night/50">
                      {/* Utiliser img au lieu de Image pour les fichiers temporaires générés dynamiquement */}
                      <img
                        src={`${proposal.tempPath}?t=${proposal.timestamp}`}
                        alt={`Proposition ${proposal.id}`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      {selectedId === proposal.id && (
                        <div className="absolute inset-0 bg-gold/10 flex items-center justify-center">
                          <div className="bg-gold rounded-full p-2">
                            <Check className="h-6 w-6 text-night" />
                          </div>
                        </div>
                      )}
                      {/* Bouton zoom */}
                      <button
                        onClick={(e) => handleZoom(proposal.tempPath, e)}
                        className="absolute top-2 right-2 bg-night/80 hover:bg-night rounded-lg p-2 text-ivory/60 hover:text-gold transition"
                        aria-label="Agrandir"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-3 bg-night/80">
                      <div className="flex justify-between items-center text-xs text-ivory/60">
                        <span>Image {proposal.id}</span>
                        <span>{proposal.size}</span>
                      </div>
                      <div className="text-xs text-ivory/40 mt-1">
                        {proposal.dimensions}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-between">
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="flex items-center justify-center gap-2 rounded-lg border border-gold/20 bg-night/50 px-6 py-3 text-sm font-medium text-ivory transition hover:border-gold hover:bg-gold/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="rounded-lg border border-gold/20 bg-night/50 px-6 py-3 text-sm font-medium text-ivory transition hover:border-gold hover:bg-gold/10"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedProposal}
                  className="rounded-lg bg-gold px-6 py-3 text-sm font-medium text-night transition hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer la sélection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de zoom */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={closeZoom}
        >
          <div className="relative max-w-7xl max-h-[90vh]">
            <button
              onClick={closeZoom}
              className="absolute -top-12 right-0 rounded-lg p-2 text-ivory/60 transition hover:text-gold"
              aria-label="Fermer le zoom"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative w-full h-full">
              {/* Utiliser img pour le zoom des images temporaires */}
              <img
                src={zoomedImage}
                alt="Image agrandie"
                className="object-contain max-h-[85vh] max-w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
