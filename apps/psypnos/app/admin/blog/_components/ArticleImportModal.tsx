"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileJson, AlertCircle, CheckCircle2, Loader, AlertTriangle } from "lucide-react";
import { generateSlugFromTitleAndCategory, validateSlug } from "../_utils/generateSlug";

interface ArticleImportData {
  titre: string;
  requete_seo: string;
  intention: string;
  categorie: string;
  persona: string;
  ton: string[];
}

interface ImportedArticle extends ArticleImportData {
  slug?: string;
  status?: "pending" | "success" | "error";
  error?: string;
}

interface ArticleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function ArticleImportModal({ isOpen, onClose, onImportComplete }: ArticleImportModalProps) {
  const [articles, setArticles] = useState<ImportedArticle[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== "application/json") {
      alert("Veuillez sélectionner un fichier JSON");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.articles || !Array.isArray(json.articles)) {
          throw new Error("Le fichier JSON doit contenir un tableau 'articles'");
        }

        // Mapper les articles et générer les slugs avec validation
        const importedArticles: ImportedArticle[] = json.articles.map((article: ArticleImportData) => {
          const slug = generateSlugFromTitleAndCategory(article.titre, article.categorie);
          const validation = validateSlug(slug);

          // Le slug est TOUJOURS valide grâce aux améliorations de generateSlugFromTitleAndCategory
          // Mais on log un avertissement si le slug a dû être généré via fallback
          if (!validation.valid) {
            console.warn(`⚠️ Slug validation échouée pour article "${article.titre}" (${article.categorie}): ${validation.error}`);
          }

          // Vérifier si le slug a utilisé un fallback timestamp (indiquant un problème)
          if (slug.match(/^article-\d+$/)) {
            console.warn(`⚠️ Slug généré via fallback timestamp pour "${article.titre}". Le titre ou la catégorie était problématique.`);
          }

          return {
            ...article,
            slug,
            status: "pending" as const,
          };
        });

        setArticles(importedArticles);
      } catch (error) {
        alert(`Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleImport = useCallback(async () => {
    setIsImporting(true);

    // Importer les articles un par un
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      if (!article) continue;

      try {
        // Créer l'article via l'API
        const response = await fetch("/api/blog/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: article.titre,
            slug: article.slug,
            description: `${article.intention} (${article.requete_seo})`,
            content: `# ${article.titre}\n\n_Article à rédiger_`,
            author: "David Duquenne",
            category: article.categorie,
            tags: [article.requete_seo, ...article.ton],
            published: false, // Toujours en brouillon à l'import
            date: new Date().toISOString().split("T")[0] ?? "",
            faq: [],
            seoIntent: article.intention,
            persona: article.persona,
            tones: article.ton,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Échec de la création");
        }

        // Marquer comme succès
        setArticles(prev => prev.map((a, idx) =>
          idx === i ? { ...a, status: "success" as const } : a
        ));
      } catch (error) {
        // Marquer comme erreur
        setArticles(prev => prev.map((a, idx) =>
          idx === i ? {
            ...a,
            status: "error" as const,
            error: error instanceof Error ? error.message : "Erreur inconnue"
          } : a
        ));
      }
    }

    setIsImporting(false);

    // Attendre un peu puis fermer et recharger
    setTimeout(() => {
      onImportComplete();
      handleClose();
    }, 2000);
  }, [articles, onImportComplete]);

  const handleClose = useCallback(() => {
    setArticles([]);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-night/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg border border-gold/20 bg-gradient-to-br from-night to-night/95 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gold/20 p-6">
            <div className="flex items-center gap-3">
              <FileJson className="h-6 w-6 text-gold" />
              <h2 className="text-2xl font-semibold text-ivory">Importer des articles</h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 140px)" }}>
            {articles.length === 0 ? (
              // Upload zone
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition ${
                  isDragOver
                    ? "border-gold bg-gold/5"
                    : "border-gold/30 hover:border-gold/50 hover:bg-gold/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
                <Upload className="mx-auto h-12 w-12 text-gold/50" />
                <p className="mt-4 text-lg font-medium text-ivory">
                  Glissez-déposez un fichier JSON ici
                </p>
                <p className="mt-2 text-sm text-ivory/50">
                  ou cliquez pour sélectionner un fichier
                </p>
                <div className="mt-6 rounded-lg bg-night/50 p-4 text-left text-xs text-ivory/70">
                  <p className="font-semibold mb-2">Format attendu:</p>
                  <pre className="overflow-x-auto">{`{
  "articles": [
    {
      "titre": "...",
      "requete_seo": "...",
      "intention": "...",
      "categorie": "Comprendre",
      "persona": "...",
      "ton": ["pédagogique", "rassurant"]
    }
  ]
}`}</pre>
                </div>
              </div>
            ) : (
              // Liste des articles à importer
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ivory/70">
                    {articles.length} article{articles.length > 1 ? "s" : ""} à importer
                  </p>
                  {!isImporting && (
                    <button
                      onClick={() => setArticles([])}
                      className="text-sm text-gold hover:text-gold/70"
                    >
                      Changer de fichier
                    </button>
                  )}
                </div>

                {articles.map((article, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border p-4 transition ${
                      article.status === "success"
                        ? "border-green-500/30 bg-green-500/5"
                        : article.status === "error"
                        ? "border-red-500/30 bg-red-500/5"
                        : "border-gold/20 bg-night/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-ivory">{article.titre}</h3>
                          {article.status === "success" && (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          )}
                          {article.status === "error" && (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                          )}
                          {article.status === "pending" && isImporting && (
                            <Loader className="h-4 w-4 animate-spin text-gold" />
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-ivory/50">
                          <span className={article.slug && /^article-\d+$/.test(article.slug) ? "text-amber-400 font-medium" : ""}>
                            Slug: {article.slug}
                          </span>
                          <span>•</span>
                          <span>Catégorie: {article.categorie}</span>
                          <span>•</span>
                          <span>SEO: {article.requete_seo}</span>
                        </div>
                        {article.slug && /^article-\d+$/.test(article.slug) && (
                          <div className="mt-2 flex items-start gap-2 rounded bg-amber-500/10 p-2 text-xs text-amber-300">
                            <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <p>Slug généré automatiquement (le titre ou la catégorie était problématique)</p>
                          </div>
                        )}
                        {article.error && (
                          <p className="mt-2 text-sm text-red-400">{article.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {articles.length > 0 && (
            <div className="flex justify-end gap-3 border-t border-gold/20 p-6">
              <button
                onClick={handleClose}
                disabled={isImporting}
                className="rounded-lg border border-gold/30 px-6 py-2 font-medium text-gold transition hover:bg-gold/10 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex items-center gap-2 rounded-lg bg-gold/20 px-6 py-2 font-medium text-gold transition hover:bg-gold/30 disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Importation en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importer {articles.length} article{articles.length > 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
