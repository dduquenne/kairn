"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Star,
  Share2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Tag,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { BlogPostSummary } from "@/lib/blog";
import { DeleteConfirmation } from "../_components/DeleteConfirmation";
import { useToast } from "@/lib/toast-context";

type SortField = "title" | "category" | "date" | "published";
type SortOrder = "asc" | "desc";
type ViewMode = "grid" | "table";

interface BlogSocialStatus {
  blogSlug: string;
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
}

export default function BlogManagementPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    slug: string;
    title: string;
  } | null>(null);
  const [socialStatuses, setSocialStatuses] = useState<Record<string, BlogSocialStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [itemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const { addToast } = useToast();
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const loadSocialStatuses = useCallback(async (slugs: string[]) => {
    if (slugs.length === 0) return;

    try {
      const response = await fetch(
        `/api/social/posts/by-blog?slugs=${slugs.join(",")}&t=${Date.now()}`,
        { cache: "no-store" }
      );

      if (response.ok) {
        const data = await response.json();
        setSocialStatuses(data.statuses || {});
      }
    } catch (error) {
      console.error("Error loading social statuses:", error);
    }
  }, []);

  const loadActiveJobsCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/blog/jobs?limit=10&t=${Date.now()}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        const activeJobs = (data.jobs || []).filter(
          (job: { status: string }) => job.status === "PENDING" || job.status === "PROCESSING"
        );
        setActiveJobsCount(activeJobs.length);
      }
    } catch (error) {
      console.error("Error loading active jobs:", error);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "/api/blog/posts?includeUnpublished=true&t=" + Date.now(),
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Failed to fetch posts");

      const data = await response.json();
      setPosts(data);

      const uniqueCategories = Array.from(new Set(data.map((p: any) => p.category)));
      setCategories(uniqueCategories as string[]);

      const slugs = data.map((p: any) => p.slug);
      await loadSocialStatuses(slugs);
    } catch (error) {
      console.error("Error loading posts:", error);
      addToast({
        title: "Impossible de charger les articles",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast, loadSocialStatuses]);

  useEffect(() => {
    loadPosts();
    loadActiveJobsCount();
  }, [loadPosts, loadActiveJobsCount]);

  const handleTogglePublished = useCallback(
    async (slug: string, currentPublished: boolean) => {
      try {
        const response = await fetch(`/api/blog/posts/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !currentPublished }),
        });

        if (!response.ok) throw new Error("Failed to update");

        addToast({
          title: !currentPublished ? "Article publié" : "Article dépublié",
          variant: "success",
        });
        loadPosts();
      } catch (error) {
        addToast({
          title: "Erreur lors de la mise à jour",
          variant: "error",
        });
      }
      setActiveMenu(null);
    },
    [addToast, loadPosts]
  );

  const handleToggleFeatured = useCallback(
    async (slug: string, currentFeatured: boolean) => {
      try {
        const response = await fetch(`/api/blog/posts/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ featured: !currentFeatured }),
        });

        if (!response.ok) throw new Error("Failed to update");

        addToast({
          title: !currentFeatured ? "Article mis en avant" : "Article retiré de la mise en avant",
          variant: "success",
        });
        loadPosts();
      } catch (error) {
        addToast({
          title: "Erreur lors de la mise à jour",
          variant: "error",
        });
      }
      setActiveMenu(null);
    },
    [addToast, loadPosts]
  );

  const handleDeletePost = useCallback(
    async (slug: string) => {
      try {
        const response = await fetch(`/api/blog/posts/${slug}`, {
          method: "DELETE",
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Failed to delete post");

        addToast({
          title: "Article supprimé",
          variant: "success",
        });
        setDeleteConfirmation(null);
        await new Promise((resolve) => setTimeout(resolve, 500));
        await loadPosts();
      } catch (error) {
        addToast({
          title: "Impossible de supprimer l'article",
          variant: "error",
        });
      }
    },
    [addToast, loadPosts]
  );

  // Filter, sort and paginate
  const { paginatedPosts, totalPages, totalFiltered } = useMemo(() => {
    let filtered = posts.filter((post) => {
      const matchesSearch =
        searchQuery === "" ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "" || post.category === categoryFilter;

      const matchesPublished =
        publishedFilter === "all" ||
        (publishedFilter === "published" && post.published) ||
        (publishedFilter === "draft" && !post.published);

      return matchesSearch && matchesCategory && matchesPublished;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "published":
          comparison = a.published === b.published ? 0 : a.published ? -1 : 1;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPosts = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { paginatedPosts, totalPages, totalFiltered: filtered.length };
  }, [posts, searchQuery, categoryFilter, publishedFilter, sortField, sortOrder, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, publishedFilter]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!activeMenu) return;

      const menuElement = menuRefs.current.get(activeMenu);
      if (menuElement && !menuElement.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeMenu]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const getStatusBadge = (post: BlogPostSummary) => {
    if (!post.published) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
          <EyeOff className="h-3 w-3" />
          Brouillon
        </span>
      );
    }
    if (new Date(post.date) > new Date()) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
          <Calendar className="h-3 w-3" />
          Planifié
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
        <Eye className="h-3 w-3" />
        Publié
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-gold">Administration</p>
          <h1 className="mt-2 text-3xl font-semibold text-ivory">Articles du blog</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/blog/jobs")}
            className="relative inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 px-4 py-3 font-medium text-ivory/80 transition hover:bg-gold/10 hover:text-ivory"
          >
            <Loader2 className={`h-5 w-5 ${activeJobsCount > 0 ? "animate-spin text-amber-400" : ""}`} />
            Générations
            {activeJobsCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-night">
                {activeJobsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push("/admin/blog/new")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 font-medium text-night transition hover:bg-gold/90"
          >
            <Plus className="h-5 w-5" />
            Nouvel article
          </button>
        </div>
      </motion.div>

      {/* Stats & Featured Articles Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid gap-4 lg:grid-cols-[1fr_2fr]"
      >
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          <div className="rounded-lg border border-gold/20 bg-night/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-ivory/50">Total</p>
            <p className="mt-1 text-2xl font-bold text-ivory">{posts.length}</p>
            <p className="text-xs text-ivory/40">articles</p>
          </div>
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-green-400/70">Publiés</p>
            <p className="mt-1 text-2xl font-bold text-green-400">{posts.filter(p => p.published).length}</p>
            <p className="text-xs text-green-400/50">en ligne</p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400/70">Brouillons</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{posts.filter(p => !p.published).length}</p>
            <p className="text-xs text-amber-400/50">en attente</p>
          </div>
          <div className="rounded-lg border border-gold/30 bg-gold/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gold/70">En vedette</p>
            <p className="mt-1 text-2xl font-bold text-gold">{posts.filter(p => p.featured).length}</p>
            <p className="text-xs text-gold/50">mis en avant</p>
          </div>
        </div>

        {/* Featured Articles Showcase */}
        <div className="rounded-lg border border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-gold" />
              <h3 className="font-semibold text-gold">Articles en vedette</h3>
            </div>
            <span className="text-xs text-ivory/50">
              {posts.filter(p => p.featured).length} article{posts.filter(p => p.featured).length !== 1 ? 's' : ''}
            </span>
          </div>

          {posts.filter(p => p.featured).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Star className="mb-2 h-8 w-8 text-ivory/20" />
              <p className="text-sm text-ivory/50">Aucun article mis en avant</p>
              <p className="mt-1 text-xs text-ivory/30">
                Utilisez le menu d&apos;actions pour mettre un article en vedette
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {posts
                .filter(p => p.featured)
                .slice(0, 6)
                .map((post, index) => (
                  <motion.div
                    key={post.slug}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-lg border border-gold/20 bg-night/60 transition hover:border-gold/40"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-night/80">
                      {post.image ? (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gold/20 to-gold/5">
                          <Star className="h-8 w-8 text-gold/30" />
                        </div>
                      )}
                      {/* Overlay with star badge */}
                      <div className="absolute right-2 top-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-bold uppercase text-night">
                          <Star className="h-3 w-3" fill="currentColor" />
                          Vedette
                        </span>
                      </div>
                      {/* Status indicator */}
                      <div className="absolute bottom-2 left-2">
                        {post.published ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-0.5 text-[10px] font-medium text-white">
                            <Eye className="h-2.5 w-2.5" />
                            Publié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-medium text-white">
                            <EyeOff className="h-2.5 w-2.5" />
                            Brouillon
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="p-3">
                      <h4 className="line-clamp-1 text-sm font-medium text-ivory group-hover:text-gold transition">
                        {post.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 text-xs text-ivory/50">
                        <Tag className="h-3 w-3" />
                        <span className="truncate">{post.category}</span>
                      </div>
                    </div>
                    {/* Click overlay */}
                    <button
                      onClick={() => router.push(`/admin/blog/${post.slug}`)}
                      className="absolute inset-0"
                      aria-label={`Modifier ${post.title}`}
                    />
                  </motion.div>
                ))}
            </div>
          )}

          {posts.filter(p => p.featured).length > 6 && (
            <p className="mt-3 text-center text-xs text-ivory/40">
              +{posts.filter(p => p.featured).length - 6} autre{posts.filter(p => p.featured).length - 6 !== 1 ? 's' : ''} article{posts.filter(p => p.featured).length - 6 !== 1 ? 's' : ''} en vedette
            </p>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ivory/40" />
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gold/20 bg-night/50 py-2.5 pl-10 pr-4 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-ivory/50" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gold/20 bg-night/50 px-3 py-2.5 text-sm text-ivory transition focus:border-gold focus:outline-none"
          >
            <option value="">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex rounded-lg border border-gold/20 bg-night/50 p-1">
          {[
            { value: "all", label: "Tous" },
            { value: "published", label: "Publiés" },
            { value: "draft", label: "Brouillons" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPublishedFilter(option.value as any)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                publishedFilter === option.value
                  ? "bg-gold/20 text-gold"
                  : "text-ivory/60 hover:text-ivory"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex rounded-lg border border-gold/20 bg-night/50 p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-2 transition ${
              viewMode === "grid"
                ? "bg-gold/20 text-gold"
                : "text-ivory/60 hover:text-ivory"
            }`}
            title="Affichage en grille"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`rounded-md p-2 transition ${
              viewMode === "table"
                ? "bg-gold/20 text-gold"
                : "text-ivory/60 hover:text-ivory"
            }`}
            title="Affichage en tableau"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Results count */}
      <div className="text-sm text-ivory/50">
        {totalFiltered} article{totalFiltered !== 1 ? "s" : ""} trouvé{totalFiltered !== 1 ? "s" : ""}
      </div>

      {/* Articles Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl border border-gold/10 bg-night/40"
              />
            ))}
          </div>
        ) : paginatedPosts.length === 0 ? (
          <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 py-16 text-center">
            <p className="text-lg text-ivory/50">Aucun article trouvé</p>
            <button
              onClick={() => router.push("/admin/blog/new")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30"
            >
              <Plus className="h-4 w-4" />
              Créer un article
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedPosts.map((post, index) => {
              const socialStatus = socialStatuses[post.slug];

              return (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 overflow-hidden hover:border-gold/40 transition"
                >
                  {/* Image */}
                  <div className="relative h-32 bg-night/60">
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.title}
                        className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gold/20">
                        <Tag className="h-12 w-12" />
                      </div>
                    )}

                    {/* Featured badge */}
                    {post.featured && (
                      <div className="absolute left-3 top-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 px-2 py-1 text-xs font-medium text-night">
                          <Star className="h-3 w-3" fill="currentColor" />
                          En avant
                        </span>
                      </div>
                    )}

                    {/* Quick menu */}
                    <div
                      className="absolute right-2 top-2"
                      ref={(el) => {
                        if (el) menuRefs.current.set(post.slug, el);
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === post.slug ? null : post.slug);
                        }}
                        className="rounded-lg bg-night/80 p-2 text-ivory/70 opacity-0 transition group-hover:opacity-100 hover:bg-night hover:text-ivory"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {activeMenu === post.slug && (
                        <div
                          className="absolute right-0 top-full mt-1 z-10 w-48 rounded-lg border border-gold/20 bg-night/95 py-1 shadow-xl backdrop-blur-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => router.push(`/admin/blog/edit/${post.slug}`)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ivory/80 hover:bg-gold/10 hover:text-ivory"
                          >
                            <Edit2 className="h-4 w-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ivory/80 hover:bg-gold/10 hover:text-ivory"
                          >
                            <Eye className="h-4 w-4" />
                            Voir sur le site
                          </button>
                          <button
                            onClick={() => handleTogglePublished(post.slug, post.published)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ivory/80 hover:bg-gold/10 hover:text-ivory"
                          >
                            {post.published ? (
                              <>
                                <EyeOff className="h-4 w-4" />
                                Dépublier
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4" />
                                Publier
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(post.slug, post.featured || false)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ivory/80 hover:bg-gold/10 hover:text-ivory"
                          >
                            <Star className="h-4 w-4" />
                            {post.featured ? "Retirer de la une" : "Mettre en avant"}
                          </button>
                          <button
                            onClick={() => router.push(`/admin/social/posts/new?blogSlug=${post.slug}`)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ivory/80 hover:bg-gold/10 hover:text-ivory"
                          >
                            <Share2 className="h-4 w-4" />
                            Diffuser sur les réseaux
                          </button>
                          <hr className="my-1 border-gold/10" />
                          <button
                            onClick={() => {
                              setDeleteConfirmation({ slug: post.slug, title: post.title });
                              setActiveMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => router.push(`/admin/blog/edit/${post.slug}`)}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {getStatusBadge(post)}
                      <span className="text-xs text-ivory/40">{post.category}</span>
                    </div>

                    <h3 className="font-semibold text-ivory line-clamp-2 group-hover:text-gold transition">
                      {post.title}
                    </h3>

                    <p className="mt-2 text-sm text-ivory/50 line-clamp-2">{post.description}</p>

                    <div className="mt-3 flex items-center justify-between text-xs text-ivory/40">
                      <span>{new Date(post.date).toLocaleDateString("fr-FR")}</span>
                      {socialStatus && socialStatus.totalPosts > 0 && (
                        <span className="flex items-center gap-1 text-gold/70">
                          <Share2 className="h-3 w-3" />
                          {socialStatus.publishedPosts}/{socialStatus.totalPosts}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="w-16 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ivory/50">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("title")}
                      className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ivory/50 hover:text-ivory transition"
                    >
                      Titre
                      {getSortIcon("title")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("category")}
                      className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ivory/50 hover:text-ivory transition"
                    >
                      Catégorie
                      {getSortIcon("category")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("published")}
                      className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ivory/50 hover:text-ivory transition"
                    >
                      Statut
                      {getSortIcon("published")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ivory/50 hover:text-ivory transition"
                    >
                      Date
                      {getSortIcon("date")}
                    </button>
                  </th>
                  <th className="w-20 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ivory/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {paginatedPosts.map((post, index) => {
                  const socialStatus = socialStatuses[post.slug];

                  return (
                    <motion.tr
                      key={post.slug}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="group hover:bg-gold/5 transition cursor-pointer"
                      onClick={() => router.push(`/admin/blog/edit/${post.slug}`)}
                    >
                      {/* Image */}
                      <td className="px-4 py-3">
                        <div className="relative h-10 w-14 overflow-hidden rounded bg-night/60">
                          {post.image ? (
                            <img
                              src={post.image}
                              alt={post.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gold/20">
                              <Tag className="h-4 w-4" />
                            </div>
                          )}
                          {post.featured && (
                            <div className="absolute -right-1 -top-1">
                              <Star className="h-3 w-3 text-gold" fill="currentColor" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <p className="font-medium text-ivory line-clamp-1 group-hover:text-gold transition">
                            {post.title}
                          </p>
                          <p className="text-xs text-ivory/40 line-clamp-1">{post.description}</p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold/80">
                          {post.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">{getStatusBadge(post)}</td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-ivory/60">
                          {new Date(post.date).toLocaleDateString("fr-FR")}
                        </div>
                        {socialStatus && socialStatus.totalPosts > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gold/70">
                            <Share2 className="h-3 w-3" />
                            {socialStatus.publishedPosts}/{socialStatus.totalPosts}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div
                          className="relative"
                          ref={(el) => {
                            if (el) menuRefs.current.set(`table-${post.slug}`, el);
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(activeMenu === `table-${post.slug}` ? null : `table-${post.slug}`);
                            }}
                            className="rounded-lg p-2 text-ivory/50 transition hover:bg-gold/10 hover:text-ivory"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {activeMenu === `table-${post.slug}` && (
                            <div
                              className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gold/20 bg-night/95 py-1 shadow-xl backdrop-blur-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => router.push(`/admin/blog/edit/${post.slug}`)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ivory/80 hover:bg-gold/10 hover:text-ivory"
                              >
                                <Edit2 className="h-4 w-4" />
                                Modifier
                              </button>
                              <button
                                onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ivory/80 hover:bg-gold/10 hover:text-ivory"
                              >
                                <Eye className="h-4 w-4" />
                                Voir sur le site
                              </button>
                              <button
                                onClick={() => handleTogglePublished(post.slug, post.published)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ivory/80 hover:bg-gold/10 hover:text-ivory"
                              >
                                {post.published ? (
                                  <>
                                    <EyeOff className="h-4 w-4" />
                                    Dépublier
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4" />
                                    Publier
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleToggleFeatured(post.slug, post.featured || false)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ivory/80 hover:bg-gold/10 hover:text-ivory"
                              >
                                <Star className="h-4 w-4" />
                                {post.featured ? "Retirer de la une" : "Mettre en avant"}
                              </button>
                              <button
                                onClick={() => router.push(`/admin/social/posts/new?blogSlug=${post.slug}`)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ivory/80 hover:bg-gold/10 hover:text-ivory"
                              >
                                <Share2 className="h-4 w-4" />
                                Diffuser sur les réseaux
                              </button>
                              <hr className="my-1 border-gold/10" />
                              <button
                                onClick={() => {
                                  setDeleteConfirmation({ slug: post.slug, title: post.title });
                                  setActiveMenu(null);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
            .map((page, idx, array) => (
              <div key={page} className="flex items-center">
                {idx > 0 && array[idx - 1] !== page - 1 && (
                  <span className="px-2 text-ivory/40">...</span>
                )}
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[2.5rem] rounded-lg px-3 py-2 text-sm font-medium transition ${
                    currentPage === page
                      ? "bg-gold/20 text-gold"
                      : "text-ivory/70 hover:bg-gold/10 hover:text-ivory"
                  }`}
                >
                  {page}
                </button>
              </div>
            ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={!!deleteConfirmation}
        title={deleteConfirmation?.title || ""}
        description="Cet article sera définitivement supprimé. Cette action est irréversible."
        onConfirm={() => {
          if (deleteConfirmation) {
            handleDeletePost(deleteConfirmation.slug);
          }
        }}
        onCancel={() => setDeleteConfirmation(null)}
      />
    </div>
  );
}
