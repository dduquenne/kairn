"use client";

import { useState, useMemo, useEffect, type ElementType } from "react";

import { cn } from "../../utils/cn";

import type { BlogPostSummary, BlogSortOption, LinkComponent } from "./types";

export interface SearchBarProps {
  /** Blog posts to search */
  posts: BlogPostSummary[];
  /** Callback when filtered results change */
  onResultsChange?: (filteredPosts: BlogPostSummary[]) => void;
  /** Custom link component */
  linkComponent?: LinkComponent;
  /** Base URL for blog posts */
  blogBaseUrl?: string;
  /** Search placeholder text */
  placeholder?: string;
  /** Labels for filters */
  labels?: {
    category?: string;
    tags?: string;
    sortBy?: string;
    allCategories?: string;
    sortDateDesc?: string;
    sortDateAsc?: string;
    sortTitle?: string;
    results?: string;
    noResults?: string;
    resetFilters?: string;
    showFilters?: string;
  };
  /** Maximum results to show in dropdown */
  maxDropdownResults?: number;
  /** Custom class name */
  className?: string;
  /** Motion component for animations */
  motionComponent?: ElementType;
  /** AnimatePresence component */
  animatePresenceComponent?: ElementType;
}

/**
 * Search bar component with filtering and sorting
 *
 * @example
 * ```tsx
 * <SearchBar
 *   posts={posts}
 *   onResultsChange={setFilteredPosts}
 *   linkComponent={Link}
 * />
 * ```
 */
export function SearchBar({
  posts,
  onResultsChange,
  linkComponent: LinkComp,
  blogBaseUrl = "/blog",
  placeholder = "Search posts...",
  labels = {},
  maxDropdownResults = 5,
  className,
  motionComponent: Motion,
  animatePresenceComponent: AnimatePresence,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<BlogSortOption>("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Default labels
  const l = {
    category: labels.category ?? "Category",
    tags: labels.tags ?? "Tags",
    sortBy: labels.sortBy ?? "Sort by",
    allCategories: labels.allCategories ?? "All",
    sortDateDesc: labels.sortDateDesc ?? "Newest",
    sortDateAsc: labels.sortDateAsc ?? "Oldest",
    sortTitle: labels.sortTitle ?? "Alphabetical",
    results: labels.results ?? "results found",
    noResults: labels.noResults ?? "No results found",
    resetFilters: labels.resetFilters ?? "Reset filters",
    showFilters: labels.showFilters ?? "Show filters",
  };

  // Use custom Link component or default anchor
  const Link = LinkComp ?? (({ href, children, className, onClick, ...props }: { href: string; children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <a href={href} className={className} onClick={onClick} {...props}>
      {children}
    </a>
  ));

  // Extract unique categories and tags
  const categories = useMemo(() => {
    const cats = new Set(posts.map((post) => post.category));
    return ["all", ...Array.from(cats)];
  }, [posts]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [posts]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let results = posts;

    // Text search
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

    // Category filter
    if (selectedCategory !== "all") {
      results = results.filter((post) => post.category === selectedCategory);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      results = results.filter((post) =>
        selectedTags.every((tag) => post.tags.includes(tag))
      );
    }

    // Sort
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

  // Notify parent of changes
  useEffect(() => {
    onResultsChange?.(filteredPosts);
  }, [filteredPosts, onResultsChange]);

  // Show results dropdown when searching
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

  // Filter panel content
  const filterPanel = (
    <div className="mt-4 rounded-lg border border-ivory/10 bg-night/30 p-6 space-y-6">
      {/* Category filter */}
      <div>
        <label className="mb-3 block text-sm font-medium text-ivory/80">
          {l.category}
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night",
                selectedCategory === category
                  ? "bg-gold text-night"
                  : "border border-ivory/20 bg-transparent text-ivory/70 hover:border-gold/50 hover:text-gold"
              )}
            >
              {category === "all" ? l.allCategories : category}
            </button>
          ))}
        </div>
      </div>

      {/* Tags filter */}
      <div>
        <label className="mb-3 block text-sm font-medium text-ivory/80">
          {l.tags}
        </label>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night",
                selectedTags.includes(tag)
                  ? "bg-gold/20 text-gold border border-gold/50"
                  : "border border-ivory/20 bg-transparent text-ivory/60 hover:border-gold/30 hover:text-gold/80"
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="mb-3 block text-sm font-medium text-ivory/80">
          {l.sortBy}
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "date-desc" as const, label: l.sortDateDesc },
            { value: "date-asc" as const, label: l.sortDateAsc },
            { value: "title" as const, label: l.sortTitle },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSortBy(option.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night",
                sortBy === option.value
                  ? "bg-gold text-night"
                  : "border border-ivory/20 bg-transparent text-ivory/70 hover:border-gold/50 hover:text-gold"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Results dropdown content
  const resultsDropdown = (
    <div className="absolute z-50 mt-2 w-full rounded-lg border border-ivory/20 bg-night shadow-xl max-h-96 overflow-y-auto">
      {filteredPosts.length > 0 ? (
        <div className="p-2">
          {filteredPosts.slice(0, maxDropdownResults).map((post) => (
            <Link
              key={post.slug}
              href={`${blogBaseUrl}/${post.slug}`}
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
          {filteredPosts.length > maxDropdownResults && (
            <div className="mt-2 px-4 py-2 text-center text-sm text-ivory/60">
              +{filteredPosts.length - maxDropdownResults} more {l.results}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-ivory/60">
          <svg
            className="mx-auto mb-2 h-8 w-8 text-ivory/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-sm">{l.noResults}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("relative mb-8", className)}>
      {/* Search input */}
      <div className="relative">
        <div className="relative flex items-center">
          {/* Search icon */}
          <svg
            className="absolute left-4 h-5 w-5 text-ivory/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-ivory/20 bg-night/50 py-3 pl-12 pr-24 text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
            aria-label="Search"
          />
          <div className="absolute right-2 flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg p-2 text-ivory/50 hover:bg-ivory/10 hover:text-ivory transition-colors"
                title={l.resetFilters}
                aria-label={l.resetFilters}
              >
                {/* X icon */}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "rounded-lg p-2 transition-colors",
                showFilters || hasActiveFilters
                  ? "bg-gold/20 text-gold"
                  : "text-ivory/50 hover:bg-ivory/10 hover:text-ivory"
              )}
              title={l.showFilters}
              aria-label={l.showFilters}
              aria-expanded={showFilters}
            >
              {/* Sliders icon */}
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Results count */}
        {hasActiveFilters && (
          <div className="mt-2 text-sm text-ivory/60">
            {filteredPosts.length} {l.results}
          </div>
        )}
      </div>

      {/* Filter panel */}
      {AnimatePresence ? (
        <AnimatePresence>
          {showFilters &&
            (Motion ? (
              <Motion
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {filterPanel}
              </Motion>
            ) : (
              filterPanel
            ))}
        </AnimatePresence>
      ) : (
        showFilters && filterPanel
      )}

      {/* Search results dropdown */}
      {AnimatePresence ? (
        <AnimatePresence>
          {showResults &&
            searchQuery.trim() &&
            (Motion ? (
              <Motion
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {resultsDropdown}
              </Motion>
            ) : (
              resultsDropdown
            ))}
        </AnimatePresence>
      ) : (
        showResults && searchQuery.trim() && resultsDropdown
      )}
    </div>
  );
}

