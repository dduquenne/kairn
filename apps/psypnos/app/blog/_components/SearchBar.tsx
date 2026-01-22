"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, X, Filter, SlidersHorizontal } from "lucide-react";
import type { BlogPostSummary } from "@/lib/blog";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface SearchBarProps {
  posts: BlogPostSummary[];
  onResultsChange?: (filteredPosts: BlogPostSummary[]) => void;
}

type SortOption = "date-desc" | "date-asc" | "title";

export function SearchBar({ posts, onResultsChange }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Extraire toutes les catégories et tags uniques
  const categories = useMemo(() => {
    const cats = new Set(posts.map((post) => post.category));
    return ["all", ...Array.from(cats)];
  }, [posts]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [posts]);

  // Filtrage et recherche
  const filteredPosts = useMemo(() => {
    let results = posts;

    // Filtre par recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.category.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== "all") {
      results = results.filter((post) => post.category === selectedCategory);
    }

    // Filtre par tags
    if (selectedTags.length > 0) {
      results = results.filter((post) =>
        selectedTags.every((tag) => post.tags.includes(tag))
      );
    }

    // Tri
    results = [...results].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return results;
  }, [posts, searchQuery, selectedCategory, selectedTags, sortBy]);

  // Notifier le parent des changements
  useEffect(() => {
    onResultsChange?.(filteredPosts);
  }, [filteredPosts]);

  // Afficher les résultats quand on recherche
  useEffect(() => {
    setShowResults(searchQuery.trim().length > 0);
  }, [searchQuery]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTags([]);
    setSortBy("date-desc");
    setShowResults(false);
  };

  const hasActiveFilters =
    searchQuery.trim() || selectedCategory !== "all" || selectedTags.length > 0;

  return (
    <div className="relative mb-8">
      {/* Barre de recherche principale */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-ivory/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un article, une catégorie, un tag..."
            className="w-full rounded-lg border border-ivory/20 bg-night/50 py-3 pl-12 pr-24 text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
            aria-label="Rechercher dans le blog"
          />
          <div className="absolute right-2 flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="rounded-lg p-2 text-ivory/50 hover:bg-ivory/10 hover:text-ivory transition-colors"
                title="Réinitialiser les filtres"
                aria-label="Réinitialiser les filtres"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-lg p-2 transition-colors ${
                showFilters || hasActiveFilters
                  ? "bg-gold/20 text-gold"
                  : "text-ivory/50 hover:bg-ivory/10 hover:text-ivory"
              }`}
              title="Afficher les filtres"
              aria-label="Afficher les filtres"
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Indicateur de résultats */}
        {hasActiveFilters && (
          <div className="mt-2 text-sm text-ivory/60">
            {filteredPosts.length} résultat{filteredPosts.length > 1 ? "s" : ""} trouvé
            {filteredPosts.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Panneau de filtres avancés */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-lg border border-ivory/10 bg-night/30 p-6 space-y-6">
              {/* Filtre catégorie */}
              <div>
                <label className="mb-3 block text-sm font-medium text-ivory/80">
                  Catégorie
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night ${
                        selectedCategory === category
                          ? "bg-gold text-night"
                          : "border border-ivory/20 bg-transparent text-ivory/70 hover:border-gold/50 hover:text-gold"
                      }`}
                    >
                      {category === "all" ? "Toutes" : category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre tags */}
              <div>
                <label className="mb-3 block text-sm font-medium text-ivory/80">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night ${
                        selectedTags.includes(tag)
                          ? "bg-gold/20 text-gold border border-gold/50"
                          : "border border-ivory/20 bg-transparent text-ivory/60 hover:border-gold/30 hover:text-gold/80"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tri */}
              <div>
                <label className="mb-3 block text-sm font-medium text-ivory/80">
                  Trier par
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSortBy("date-desc")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night ${
                      sortBy === "date-desc"
                        ? "bg-gold text-night"
                        : "border border-ivory/20 bg-transparent text-ivory/70 hover:border-gold/50 hover:text-gold"
                    }`}
                  >
                    Plus récent
                  </button>
                  <button
                    onClick={() => setSortBy("date-asc")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night ${
                      sortBy === "date-asc"
                        ? "bg-gold text-night"
                        : "border border-ivory/20 bg-transparent text-ivory/70 hover:border-gold/50 hover:text-gold"
                    }`}
                  >
                    Plus ancien
                  </button>
                  <button
                    onClick={() => setSortBy("title")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night ${
                      sortBy === "title"
                        ? "bg-gold text-night"
                        : "border border-ivory/20 bg-transparent text-ivory/70 hover:border-gold/50 hover:text-gold"
                    }`}
                  >
                    Alphabétique
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Résultats de recherche en dropdown */}
      <AnimatePresence>
        {showResults && searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-full rounded-lg border border-ivory/20 bg-night shadow-xl max-h-96 overflow-y-auto"
          >
            {filteredPosts.length > 0 ? (
              <div className="p-2">
                {filteredPosts.slice(0, 5).map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="block rounded-lg p-4 hover:bg-ivory/5 transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night"
                    onClick={() => {
                      setShowResults(false);
                      setSearchQuery("");
                    }}
                  >
                    <div className="mb-1 text-sm font-medium text-ivory">
                      {post.title}
                    </div>
                    <div className="mb-2 text-xs text-ivory/60 line-clamp-2">
                      {post.excerpt}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ivory/50">
                      <span className="text-gold">{post.category}</span>
                      <span>•</span>
                      <span>{post.readingTime}</span>
                    </div>
                  </Link>
                ))}
                {filteredPosts.length > 5 && (
                  <div className="mt-2 px-4 py-2 text-center text-sm text-ivory/60">
                    +{filteredPosts.length - 5} autre
                    {filteredPosts.length - 5 > 1 ? "s" : ""} résultat
                    {filteredPosts.length - 5 > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-ivory/60">
                <Search className="mx-auto mb-2 h-8 w-8 text-ivory/30" />
                <p className="text-sm">Aucun résultat trouvé</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
