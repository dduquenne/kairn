"use client";

import { Bookmark } from "lucide-react";
import { useState, useEffect } from "react";

interface SaveArticleButtonProps {
  slug: string;
  title: string;
}

export function SaveArticleButton({ slug, title }: SaveArticleButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'article est déjà sauvegardé
    const savedArticles = getSavedArticles();
    setIsSaved(savedArticles.some((article) => article.slug === slug));
    setIsLoading(false);
  }, [slug]);

  const getSavedArticles = (): Array<{ slug: string; title: string; savedAt: string }> => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("avv-saved-articles");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const toggleSave = () => {
    const savedArticles = getSavedArticles();

    if (isSaved) {
      // Retirer l'article
      const filtered = savedArticles.filter((article) => article.slug !== slug);
      localStorage.setItem("avv-saved-articles", JSON.stringify(filtered));
      setIsSaved(false);
    } else {
      // Ajouter l'article
      const newArticle = {
        slug,
        title,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(
        "avv-saved-articles",
        JSON.stringify([...savedArticles, newArticle])
      );
      setIsSaved(true);
    }
  };

  if (isLoading) {
    // Skeleton pour éviter l'erreur d'hydratation
    return (
      <div
        className="flex items-center gap-2 rounded-full border border-ivory/20 bg-transparent px-4 py-2 text-sm font-medium"
        aria-hidden="true"
      >
        <div className="h-4 w-4 animate-pulse rounded bg-ivory/20" />
        <div className="h-4 w-20 animate-pulse rounded bg-ivory/20" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleSave}
      className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night ${
        isSaved
          ? "border-gold/50 bg-gold/10 text-gold hover:bg-gold/20"
          : "border-ivory/20 bg-transparent text-ivory/70 hover:border-gold/30 hover:bg-gold/5 hover:text-gold"
      }`}
      aria-label={isSaved ? "Retirer des favoris" : "Ajouter aux favoris"}
      title={isSaved ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Bookmark
        className={`h-4 w-4 transition-all ${
          isSaved ? "fill-gold" : "group-hover:fill-gold/20"
        }`}
      />
      <span>{isSaved ? "Sauvegardé" : "Sauvegarder"}</span>
    </button>
  );
}
