"use client";

import {
  Sparkles,
  Upload,
  Loader2,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Wand2,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";

import { BlogImage, BlogImageProposal, getCleanImagePath } from "../BlogImage";

interface MediaTabProps {
  /** Chemin de l'image principale (ex: /images/blog/slug.webp) */
  image?: string;
  /** Prompt utilisé pour la génération d'image */
  imagePrompt?: string;
  /** Slug de l'article (requis pour la génération/upload) */
  slug?: string;
  /** Titre de l'article */
  title: string;
  /** Contenu de l'article */
  content: string;
  /** Génération du prompt en cours */
  isGeneratingPrompt: boolean;
  /** Génération des images en cours */
  isGeneratingImages: boolean;
  /** Upload d'image en cours */
  isUploadingImage: boolean;
  /** Régénération du prompt en cours */
  isRegeneratingPrompt: boolean;
  /** Liste des URLs des propositions d'images générées */
  imageProposals: string[];
  /** Callback pour changer l'image principale */
  onImageChange: (image: string) => void;
  /** Callback pour changer le prompt */
  onImagePromptChange: (prompt: string) => void;
  /** Callback pour lancer la génération d'images */
  onGenerateImage: () => void;
  /** Callback pour uploader une image */
  onUploadImage: (file: File) => void;
  /** Callback pour sélectionner une proposition */
  onSelectProposal: (url: string) => void;
  /** Callback pour régénérer les images */
  onRegenerateImages: () => void;
  /** Callback pour régénérer le prompt */
  onRegeneratePrompt: () => void;
}

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

  // État combiné pour la génération
  const isGenerating = isGeneratingPrompt || isGeneratingImages;
  const canGenerate = title.trim() && content.trim() && slug?.trim();

  // Clé de rechargement pour forcer le refresh des images quand elles changent
  // Basée sur l'image actuelle pour détecter les changements
  const imageReloadKey = useMemo(() => {
    return image ? `${image}-${Date.now()}` : "no-image";
  }, [image]);

  // Gérer la sélection d'un fichier
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUploadImage(file);
      }
      // Reset l'input pour permettre de re-sélectionner le même fichier
      e.target.value = "";
    },
    [onUploadImage]
  );

  // Gérer la sélection d'une proposition
  const handleSelectAndConfirm = useCallback(
    (url: string) => {
      setSelectedProposalUrl(url);
      onSelectProposal(url);
    },
    [onSelectProposal]
  );

  // Supprimer l'image actuelle
  const handleRemoveImage = useCallback(() => {
    onImageChange("");
    setSelectedProposalUrl(null);
  }, [onImageChange]);

  // Affichage du chemin propre de l'image (sans paramètres)
  const displayPath = useMemo(() => {
    return getCleanImagePath(image);
  }, [image]);

  // Vérifier si une proposition est sélectionnée
  const isProposalSelected = useCallback(
    (proposalUrl: string) => {
      // Comparer les chemins propres (sans timestamps)
      const cleanProposal = getCleanImagePath(proposalUrl);
      const cleanImage = getCleanImagePath(image);
      const cleanSelected = selectedProposalUrl
        ? getCleanImagePath(selectedProposalUrl)
        : null;

      return cleanProposal === cleanImage || cleanProposal === cleanSelected;
    },
    [image, selectedProposalUrl]
  );

  return (
    <div className="space-y-6">
      {/* Section: Aperçu de l'image principale */}
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold text-ivory">
          Image principale
        </h3>

        {image ? (
          <div className="space-y-4">
            {/* Aperçu de l'image */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gold/20">
              <BlogImage
                src={image}
                alt="Aperçu de l'image de l'article"
                className="h-full w-full object-cover"
                containerClassName="h-full w-full"
                reloadKey={imageReloadKey}
                showRetryButton={true}
              />
              {/* Bouton supprimer */}
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute right-3 top-3 rounded-lg bg-night/80 p-2 text-ivory/70 transition hover:bg-red-500/20 hover:text-red-400 z-20"
                title="Supprimer l'image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Chemin de l'image */}
            <div className="flex items-center gap-2 rounded-lg bg-night/40 px-3 py-2 text-sm text-ivory/60">
              <ImageIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{displayPath}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gold/20 bg-night/20 py-12">
            <ImageIcon className="h-12 w-12 text-gold/30" />
            <p className="mt-4 text-ivory/50">Aucune image sélectionnée</p>
            <p className="mt-1 text-sm text-ivory/30">
              Générez une image avec l&apos;IA ou téléchargez la vôtre
            </p>
          </div>
        )}
      </div>

      {/* Section: Actions pour ajouter une image */}
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold text-ivory">
          Ajouter une image
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Bouton génération IA */}
          <button
            type="button"
            onClick={onGenerateImage}
            disabled={!canGenerate || isGenerating}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5 p-6 transition hover:border-gold/50 hover:from-gold/15 hover:to-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            ) : (
              <Sparkles className="h-8 w-8 text-gold" />
            )}
            <div className="text-center">
              <p className="font-semibold text-ivory">
                {isGeneratingPrompt
                  ? "Analyse du contenu..."
                  : isGeneratingImages
                    ? "Génération en cours..."
                    : "Générer avec l'IA"}
              </p>
              <p className="mt-1 text-sm text-ivory/50">
                {canGenerate
                  ? "Crée une image unique basée sur votre article"
                  : "Remplissez d'abord le titre et le contenu"}
              </p>
            </div>
          </button>

          {/* Bouton upload manuel */}
          <label
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ivory/20 bg-night/20 p-6 transition hover:border-ivory/40 hover:bg-night/30 ${
              isUploadingImage || !slug ? "cursor-not-allowed opacity-50" : ""
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
              <Loader2 className="h-8 w-8 animate-spin text-ivory/60" />
            ) : (
              <Upload className="h-8 w-8 text-ivory/60" />
            )}
            <div className="text-center">
              <p className="font-semibold text-ivory">
                {isUploadingImage ? "Téléchargement..." : "Télécharger"}
              </p>
              <p className="mt-1 text-sm text-ivory/50">
                {slug ? "Format WebP, JPG ou PNG" : "Définissez d'abord un slug"}
              </p>
            </div>
          </label>
        </div>

        {/* Éditeur de prompt (optionnel) */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowPromptEditor(!showPromptEditor)}
            className="text-sm text-gold/70 hover:text-gold transition"
          >
            {showPromptEditor ? "Masquer" : "Personnaliser"} le prompt de
            génération
          </button>

          {showPromptEditor && (
            <div className="mt-3 space-y-3">
              <textarea
                value={imagePrompt || ""}
                onChange={(e) => onImagePromptChange(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-3 text-sm text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none resize-none"
                placeholder="Décrivez l'image souhaitée (sera auto-généré si vide)"
              />

              {/* Bouton de régénération du prompt IA */}
              <div className="flex items-center justify-between rounded-lg border border-gold/10 bg-gold/5 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ivory">
                    Régénérer le prompt avec l&apos;IA
                  </p>
                  <p className="text-xs text-ivory/50 mt-0.5">
                    Utilise les dernières directives Appréciez Votre Vie (silhouettes,
                    lumière dorée, palette officielle)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRegeneratePrompt}
                  disabled={
                    isRegeneratingPrompt || !title.trim() || !content.trim()
                  }
                  className="ml-4 flex items-center gap-2 rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRegeneratingPrompt ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isRegeneratingPrompt ? "Génération..." : "Régénérer"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section: Propositions générées */}
      {imageProposals.length > 0 && (
        <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ivory">
              Propositions générées
            </h3>
            <button
              type="button"
              onClick={onRegenerateImages}
              disabled={isGeneratingImages}
              className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-1.5 text-sm font-medium text-gold transition hover:bg-gold/20 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isGeneratingImages ? "animate-spin" : ""}`}
              />
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

          {/* Message d'aide */}
          <p className="mt-4 text-center text-sm text-ivory/50">
            Cliquez sur une image pour la sélectionner comme image principale.
            Vous pouvez changer d&apos;avis jusqu&apos;à l&apos;enregistrement.
          </p>
        </div>
      )}
    </div>
  );
}
