"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, Check, FileText } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  category: string;
  description: string;
  date: string;
  published: boolean;
  image?: string;
}

interface ArticleSelectorProps {
  articles: BlogPost[];
  isLoading: boolean;
  selectedArticle: BlogPost | null;
  onSelect: (article: BlogPost | null) => void;
}

export function ArticleSelector({
  articles,
  isLoading,
  selectedArticle,
  onSelect,
}: ArticleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter articles based on search
  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;

    const query = searchQuery.toLowerCase();
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query)
    );
  }, [articles, searchQuery]);

  // Group articles by category
  const groupedArticles = useMemo(() => {
    const groups: Record<string, BlogPost[]> = {};

    filteredArticles.forEach((article) => {
      if (!groups[article.category]) {
        groups[article.category] = [];
      }
      groups[article.category]!.push(article);
    });

    return groups;
  }, [filteredArticles]);

  const handleSelect = (article: BlogPost) => {
    onSelect(article);
    setIsOpen(false);
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <div className="h-16 animate-pulse rounded-lg bg-gold/10" />
    );
  }

  return (
    <div className={`relative ${isOpen ? "z-[100]" : ""}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
          isOpen
            ? "border-gold bg-night/70"
            : "border-gold/20 bg-night/50 hover:border-gold/40"
        }`}
      >
        {selectedArticle ? (
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ivory truncate">
              {selectedArticle.title}
            </p>
            <p className="mt-0.5 text-sm text-ivory/60">
              {selectedArticle.category} • {new Date(selectedArticle.date).toLocaleDateString("fr-FR")}
            </p>
          </div>
        ) : (
          <span className="text-ivory/50">Sélectionner un article...</span>
        )}
        <ChevronDown
          className={`ml-3 h-5 w-5 flex-shrink-0 text-ivory/50 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop - z-index très élevé pour passer au-dessus des autres panneaux */}
          <div
            className="fixed inset-0 z-[101]"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery("");
            }}
          />

          {/* Dropdown Content - z-index plus élevé que le backdrop */}
          <div className="absolute left-0 right-0 top-full z-[102] mt-2 max-h-96 overflow-hidden rounded-lg border border-gold/20 bg-night shadow-xl">
            {/* Search */}
            <div className="border-b border-gold/10 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un article..."
                  className="w-full rounded-lg border border-gold/10 bg-night/50 py-2 pl-10 pr-4 text-sm text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Articles List */}
            <div className="max-h-72 overflow-y-auto p-2">
              {Object.keys(groupedArticles).length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="mx-auto h-8 w-8 text-ivory/30" />
                  <p className="mt-2 text-sm text-ivory/50">
                    {searchQuery
                      ? "Aucun article trouvé"
                      : "Aucun article publié disponible"}
                  </p>
                </div>
              ) : (
                Object.entries(groupedArticles).map(([category, categoryArticles]) => (
                  <div key={category} className="mb-2 last:mb-0">
                    <p className="mb-1 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold/70">
                      {category}
                    </p>
                    {categoryArticles.map((article) => (
                      <button
                        key={article.slug}
                        onClick={() => handleSelect(article)}
                        className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition ${
                          selectedArticle?.slug === article.slug
                            ? "bg-gold/10"
                            : "hover:bg-gold/5"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-ivory truncate">
                            {article.title}
                          </p>
                          <p className="mt-0.5 text-xs text-ivory/50 line-clamp-1">
                            {article.description}
                          </p>
                        </div>
                        {selectedArticle?.slug === article.slug && (
                          <Check className="h-4 w-4 flex-shrink-0 text-gold" />
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Selected Article Preview */}
      {selectedArticle && (
        <div className="mt-4 rounded-lg border border-gold/10 bg-night/30 p-4">
          <div className="flex gap-4">
            {selectedArticle.image && (
              <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ivory line-clamp-2">
                {selectedArticle.title}
              </p>
              <p className="mt-1 text-sm text-ivory/60 line-clamp-2">
                {selectedArticle.description}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-ivory/50">
                <span className="rounded-full bg-gold/10 px-2 py-0.5 text-gold">
                  {selectedArticle.category}
                </span>
                <span>
                  {new Date(selectedArticle.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
