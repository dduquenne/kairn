'use client';

/**
 * Media Tab
 *
 * Image management: preview, generation, upload, prompt customization.
 */

import {
  Sparkles,
  Upload,
  Loader2,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';

import { BlogImage, BlogImageProposal, getCleanImagePath } from '../BlogImage';

interface MediaTabProps {
  image?: string;
  imagePrompt?: string;
  slug?: string;
  title: string;
  content: string;
  isGeneratingPrompt: boolean;
  isGeneratingImages: boolean;
  isUploadingImage: boolean;
  isRegeneratingPrompt: boolean;
  imageProposals: string[];
  onImageChange: (image: string) => void;
  onImagePromptChange: (prompt: string) => void;
  onGenerateImage: () => void;
  onUploadImage: (file: File) => void;
  onSelectProposal: (url: string) => void;
  onRegenerateImages: () => void;
  onRegeneratePrompt: () => void;
}

/**
 * Onglet de gestion des médias (image principale)
 */
export function MediaTab({
  image,
  imagePrompt,
  slug,
  title,
  content,
  isGeneratingPrompt,
  isGeneratingImages,
  isUploadingImage,
  isRegeneratingPrompt,
  imageProposals,
  onImageChange,
  onImagePromptChange,
  onGenerateImage,
  onUploadImage,
  onSelectProposal,
  onRegenerateImages,
  onRegeneratePrompt,
}: MediaTabProps) {
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [selectedProposalUrl, setSelectedProposalUrl] = useState<string | null>(null);

  const isGenerating = isGeneratingPrompt || isGeneratingImages;
  const canGenerate = title.trim() && content.trim() && slug?.trim();

  const imageReloadKey = useMemo(() => {
    return image ? `${image}-${Date.now()}` : 'no-image';
  }, [image]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUploadImage(file);
      }
      e.target.value = '';
    },
    [onUploadImage]
  );

  const handleSelectAndConfirm = useCallback(
    (url: string) => {
      setSelectedProposalUrl(url);
      onSelectProposal(url);
    },
    [onSelectProposal]
  );

  const handleRemoveImage = useCallback(() => {
    onImageChange('');
    setSelectedProposalUrl(null);
  }, [onImageChange]);

  const displayPath = useMemo(() => {
    return getCleanImagePath(image);
  }, [image]);

  const isProposalSelected = useCallback(
    (proposalUrl: string) => {
      const cleanProposal = getCleanImagePath(proposalUrl);
      const cleanImage = getCleanImagePath(image);
      const cleanSelected = selectedProposalUrl ? getCleanImagePath(selectedProposalUrl) : null;

      return cleanProposal === cleanImage || cleanProposal === cleanSelected;
    },
    [image, selectedProposalUrl]
  );

  return (
    <div className="space-y-6">
      {/* Section: Aperçu de l'image principale */}
      <div className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-6 backdrop-blur-sm">
        <h3 className="text-ivory mb-4 text-lg font-semibold">Image principale</h3>

        {image ? (
          <div className="space-y-4">
            <div className="border-gold/20 relative aspect-video w-full overflow-hidden rounded-lg border">
              <BlogImage
                src={image}
                alt="Aperçu de l'image de l'article"
                className="h-full w-full object-cover"
                containerClassName="h-full w-full"
                reloadKey={imageReloadKey}
                showRetryButton={true}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="bg-night/80 text-ivory/70 absolute right-3 top-3 z-20 rounded-lg p-2 transition hover:bg-red-500/20 hover:text-red-400"
                title="Supprimer l'image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-night/40 text-ivory/60 flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
              <ImageIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{displayPath}</span>
            </div>
          </div>
        ) : (
          <div className="border-gold/20 bg-night/20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
            <ImageIcon className="text-gold/30 h-12 w-12" />
            <p className="text-ivory/50 mt-4">Aucune image sélectionnée</p>
            <p className="text-ivory/30 mt-1 text-sm">
              Générez une image avec l&apos;IA ou téléchargez la vôtre
            </p>
          </div>
        )}
      </div>

      {/* Section: Actions */}
      <div className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-6 backdrop-blur-sm">
        <h3 className="text-ivory mb-4 text-lg font-semibold">Ajouter une image</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onGenerateImage}
            disabled={!canGenerate || isGenerating}
            className="border-gold/30 from-gold/10 to-gold/5 hover:border-gold/50 hover:from-gold/15 hover:to-gold/10 flex flex-col items-center gap-3 rounded-xl border-2 bg-gradient-to-br p-6 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="text-gold h-8 w-8 animate-spin" />
            ) : (
              <Sparkles className="text-gold h-8 w-8" />
            )}
            <div className="text-center">
              <p className="text-ivory font-semibold">
                {isGeneratingPrompt
                  ? 'Analyse du contenu...'
                  : isGeneratingImages
                    ? 'Génération en cours...'
                    : "Générer avec l'IA"}
              </p>
              <p className="text-ivory/50 mt-1 text-sm">
                {canGenerate
                  ? 'Crée une image unique basée sur votre article'
                  : "Remplissez d'abord le titre et le contenu"}
              </p>
            </div>
          </button>

          <label
            className={`border-ivory/20 bg-night/20 hover:border-ivory/40 hover:bg-night/30 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 transition ${
              isUploadingImage || !slug ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            <input
              type="file"
              accept=".webp,image/webp,.jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleFileSelect}
              disabled={isUploadingImage || !slug}
              className="hidden"
            />
            {isUploadingImage ? (
              <Loader2 className="text-ivory/60 h-8 w-8 animate-spin" />
            ) : (
              <Upload className="text-ivory/60 h-8 w-8" />
            )}
            <div className="text-center">
              <p className="text-ivory font-semibold">
                {isUploadingImage ? 'Téléchargement...' : 'Télécharger'}
              </p>
              <p className="text-ivory/50 mt-1 text-sm">
                {slug ? 'Format WebP, JPG ou PNG' : "Définissez d'abord un slug"}
              </p>
            </div>
          </label>
        </div>

        {/* Éditeur de prompt */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowPromptEditor(!showPromptEditor)}
            className="text-gold/70 hover:text-gold text-sm transition"
          >
            {showPromptEditor ? 'Masquer' : 'Personnaliser'} le prompt de génération
          </button>

          {showPromptEditor && (
            <div className="mt-3 space-y-3">
              <textarea
                value={imagePrompt || ''}
                onChange={e => onImagePromptChange(e.target.value)}
                rows={4}
                className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full resize-none rounded-lg border px-4 py-3 text-sm transition focus:outline-none"
                placeholder="Décrivez l'image souhaitée (sera auto-généré si vide)"
              />

              <div className="border-gold/10 bg-gold/5 flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="flex-1">
                  <p className="text-ivory text-sm font-medium">
                    Régénérer le prompt avec l&apos;IA
                  </p>
                  <p className="text-ivory/50 mt-0.5 text-xs">
                    Utilise les directives de style du site
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRegeneratePrompt}
                  disabled={isRegeneratingPrompt || !title.trim() || !content.trim()}
                  className="bg-gold/20 text-gold hover:bg-gold/30 ml-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRegeneratingPrompt ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isRegeneratingPrompt ? 'Génération...' : 'Régénérer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section: Propositions générées */}
      {imageProposals.length > 0 && (
        <div className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-ivory text-lg font-semibold">Propositions générées</h3>
            <button
              type="button"
              onClick={onRegenerateImages}
              disabled={isGeneratingImages}
              className="bg-gold/10 text-gold hover:bg-gold/20 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isGeneratingImages ? 'animate-spin' : ''}`} />
              Régénérer
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {imageProposals.map((proposalUrl, index) => (
              <BlogImageProposal
                key={`${proposalUrl}-${index}`}
                src={proposalUrl}
                alt={`Proposition ${index + 1}`}
                isSelected={isProposalSelected(proposalUrl)}
                onClick={() => handleSelectAndConfirm(proposalUrl)}
                index={index}
              />
            ))}
          </div>

          <p className="text-ivory/50 mt-4 text-center text-sm">
            Cliquez sur une image pour la sélectionner comme image principale. Vous pouvez changer
            d&apos;avis jusqu&apos;à l&apos;enregistrement.
          </p>
        </div>
      )}
    </div>
  );
}
