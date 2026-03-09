'use client';

export const dynamic = 'force-dynamic';

import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';

import { BlogPostSummary } from '@/lib/blog';
import { useToast } from '@/lib/toast-context';

import { DeleteConfirmation } from '../_components/DeleteConfirmation';

type SortField = 'title' | 'category' | 'date' | 'published';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'table';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [itemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const { addToast } = useToast();
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const loadSocialStatuses = useCallback(async (slugs: string[]) => {
    if (slugs.length === 0) return;

    try {
      const response = await fetch(
        `/api/social/posts/by-blog?slugs=${slugs.join(',')}&t=${Date.now()}`,
        { cache: 'no-store' }
      );

      if (response.ok) {
        const data = await response.json();
        setSocialStatuses(data.statuses || {});
      }
    } catch (error) {
      console.error('Error loading social statuses:', error);
    }
  }, []);

  const loadActiveJobsCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/blog/jobs?limit=10&t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        const activeJobs = (data.jobs || []).filter(
          (job: { status: string }) => job.status === 'PENDING' || job.status === 'PROCESSING'
        );
        setActiveJobsCount(activeJobs.length);
      }
    } catch (error) {
      console.error('Error loading active jobs:', error);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/blog/posts?includeUnpublished=true&t=' + Date.now(), {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to fetch posts');

      const data = await response.json();
      setPosts(data);

      const uniqueCategories = Array.from(new Set(data.map((p: any) => p.category)));
      setCategories(uniqueCategories as string[]);

      const slugs = data.map((p: any) => p.slug);
      await loadSocialStatuses(slugs);
    } catch (error) {
      console.error('Error loading posts:', error);
      addToast({
        title: 'Impossible de charger les articles',
        variant: 'error',
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
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published: !currentPublished }),
        });

        if (!response.ok) throw new Error('Failed to update');

        addToast({
          title: !currentPublished ? 'Article publié' : 'Article dépublié',
          variant: 'success',
        });
        loadPosts();
      } catch (error) {
        addToast({
          title: 'Erreur lors de la mise à jour',
          variant: 'error',
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
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured: !currentFeatured }),
        });

        if (!response.ok) throw new Error('Failed to update');

        addToast({
          title: !currentFeatured ? 'Article mis en avant' : 'Article retiré de la mise en avant',
          variant: 'success',
        });
        loadPosts();
      } catch (error) {
        addToast({
          title: 'Erreur lors de la mise à jour',
          variant: 'error',
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
          method: 'DELETE',
          cache: 'no-store',
        });

        if (!response.ok) throw new Error('Failed to delete post');

        addToast({
          title: 'Article supprimé',
          variant: 'success',
        });
        setDeleteConfirmation(null);
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadPosts();
      } catch (error) {
        addToast({
          title: "Impossible de supprimer l'article",
          variant: 'error',
        });
      }
    },
    [addToast, loadPosts]
  );

  // Filter, sort and paginate
  const { paginatedPosts, totalPages, totalFiltered } = useMemo(() => {
    const filtered = posts.filter(post => {
      const matchesSearch =
        searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === '' || post.category === categoryFilter;

      const matchesPublished =
        publishedFilter === 'all' ||
        (publishedFilter === 'published' && post.published) ||
        (publishedFilter === 'draft' && !post.published);

      return matchesSearch && matchesCategory && matchesPublished;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'published':
          comparison = a.published === b.published ? 0 : a.published ? -1 : 1;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPosts = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { paginatedPosts, totalPages, totalFiltered: filtered.length };
  }, [
    posts,
    searchQuery,
    categoryFilter,
    publishedFilter,
    sortField,
    sortOrder,
    currentPage,
    itemsPerPage,
  ]);

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
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
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
          <p className="text-gold text-sm uppercase tracking-[0.3em]">Administration</p>
          <h1 className="text-ivory mt-2 text-3xl font-semibold">Articles du blog</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/blog/jobs')}
            className="border-gold/30 text-ivory/80 hover:bg-gold/10 hover:text-ivory relative inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-medium transition"
          >
            <Loader2
              className={`h-5 w-5 ${activeJobsCount > 0 ? 'animate-spin text-amber-400' : ''}`}
            />
            Générations
            {activeJobsCount > 0 && (
              <span className="text-night absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold">
                {activeJobsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push('/admin/blog/new')}
            className="bg-gold text-night hover:bg-gold/90 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition"
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
          <div className="border-gold/20 bg-night/50 rounded-lg border p-4">
            <p className="text-ivory/50 text-xs font-medium uppercase tracking-wider">Total</p>
            <p className="text-ivory mt-1 text-2xl font-bold">{posts.length}</p>
            <p className="text-ivory/40 text-xs">articles</p>
          </div>
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-green-400/70">
              Publiés
            </p>
            <p className="mt-1 text-2xl font-bold text-green-400">
              {posts.filter(p => p.published).length}
            </p>
            <p className="text-xs text-green-400/50">en ligne</p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400/70">
              Brouillons
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-400">
              {posts.filter(p => !p.published).length}
            </p>
            <p className="text-xs text-amber-400/50">en attente</p>
          </div>
          <div className="border-gold/30 bg-gold/5 rounded-lg border p-4">
            <p className="text-gold/70 text-xs font-medium uppercase tracking-wider">En vedette</p>
            <p className="text-gold mt-1 text-2xl font-bold">
              {posts.filter(p => p.featured).length}
            </p>
            <p className="text-gold/50 text-xs">mis en avant</p>
          </div>
        </div>

        {/* Featured Articles Showcase */}
        <div className="border-gold/30 from-gold/10 to-gold/5 rounded-lg border bg-gradient-to-br p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="text-gold h-5 w-5" />
              <h3 className="text-gold font-semibold">Articles en vedette</h3>
            </div>
            <span className="text-ivory/50 text-xs">
              {posts.filter(p => p.featured).length} article
              {posts.filter(p => p.featured).length !== 1 ? 's' : ''}
            </span>
          </div>

          {posts.filter(p => p.featured).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Star className="text-ivory/20 mb-2 h-8 w-8" />
              <p className="text-ivory/50 text-sm">Aucun article mis en avant</p>
              <p className="text-ivory/30 mt-1 text-xs">
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
                    className="border-gold/20 bg-night/60 hover:border-gold/40 group relative overflow-hidden rounded-lg border transition"
                  >
                    {/* Image */}
                    <div className="bg-night/80 relative aspect-[16/9] overflow-hidden">
                      {post.image ? (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="from-gold/20 to-gold/5 flex h-full w-full items-center justify-center bg-gradient-to-br">
                          <Star className="text-gold/30 h-8 w-8" />
                        </div>
                      )}
                      {/* Overlay with star badge */}
                      <div className="absolute right-2 top-2">
                        <span className="bg-gold/90 text-night inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
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
                      <h4 className="text-ivory group-hover:text-gold line-clamp-1 text-sm font-medium transition">
                        {post.title}
                      </h4>
                      <div className="text-ivory/50 mt-1 flex items-center gap-2 text-xs">
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
            <p className="text-ivory/40 mt-3 text-center text-xs">
              +{posts.filter(p => p.featured).length - 6} autre
              {posts.filter(p => p.featured).length - 6 !== 1 ? 's' : ''} article
              {posts.filter(p => p.featured).length - 6 !== 1 ? 's' : ''} en vedette
            </p>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        {/* Search */}
        <div className="relative flex-1 sm:min-w-[200px]">
          <Search className="text-ivory/40 absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full rounded-lg border py-2.5 pl-10 pr-4 transition focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="text-ivory/50 h-5 w-5 shrink-0" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border-gold/20 bg-night/50 text-ivory focus:border-gold min-w-0 rounded-lg border px-3 py-2.5 text-sm transition focus:outline-none"
          >
            <option value="">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="border-gold/20 bg-night/50 flex rounded-lg border p-1">
            {[
              { value: 'all', label: 'Tous' },
              { value: 'published', label: 'Publiés' },
              { value: 'draft', label: 'Brouillons' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setPublishedFilter(option.value as any)}
                className={`rounded-md px-2 py-1.5 text-sm font-medium transition sm:px-3 ${
                  publishedFilter === option.value
                    ? 'bg-gold/20 text-gold'
                    : 'text-ivory/60 hover:text-ivory'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="border-gold/20 bg-night/50 flex rounded-lg border p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-2 transition ${
                viewMode === 'grid' ? 'bg-gold/20 text-gold' : 'text-ivory/60 hover:text-ivory'
              }`}
              title="Affichage en grille"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-md p-2 transition ${
                viewMode === 'table' ? 'bg-gold/20 text-gold' : 'text-ivory/60 hover:text-ivory'
              }`}
              title="Affichage en tableau"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results count */}
      <div className="text-ivory/50 text-sm">
        {totalFiltered} article{totalFiltered !== 1 ? 's' : ''} trouvé
        {totalFiltered !== 1 ? 's' : ''}
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
                className="border-gold/10 bg-night/40 h-48 animate-pulse rounded-xl border"
              />
            ))}
          </div>
        ) : paginatedPosts.length === 0 ? (
          <div className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br py-16 text-center">
            <p className="text-ivory/50 text-lg">Aucun article trouvé</p>
            <button
              onClick={() => router.push('/admin/blog/new')}
              className="bg-gold/20 text-gold hover:bg-gold/30 mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              <Plus className="h-4 w-4" />
              Créer un article
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedPosts.map((post, index) => {
              const socialStatus = socialStatuses[post.slug];

              return (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-gold/20 from-night/60 to-night/40 hover:border-gold/40 group relative overflow-hidden rounded-xl border bg-gradient-to-br transition"
                >
                  {/* Image */}
                  <div className="bg-night/60 relative h-32">
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.title}
                        className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                      />
                    ) : (
                      <div className="text-gold/20 flex h-full items-center justify-center">
                        <Tag className="h-12 w-12" />
                      </div>
                    )}

                    {/* Featured badge */}
                    {post.featured && (
                      <div className="absolute left-3 top-3">
                        <span className="bg-gold/90 text-night inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium">
                          <Star className="h-3 w-3" fill="currentColor" />
                          En avant
                        </span>
                      </div>
                    )}

                    {/* Quick menu */}
                    <div
                      className="absolute right-2 top-2"
                      ref={el => {
                        if (el) menuRefs.current.set(post.slug, el);
                      }}
                    >
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === post.slug ? null : post.slug);
                        }}
                        className="bg-night/80 text-ivory/70 hover:bg-night hover:text-ivory rounded-lg p-2 opacity-0 transition group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {activeMenu === post.slug && (
                        <div
                          className="border-gold/20 bg-night/95 absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border py-1 shadow-xl backdrop-blur-sm"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => router.push(`/admin/blog/edit/${post.slug}`)}
                            className="text-ivory/80 hover:bg-gold/10 hover:text-ivory flex w-full items-center gap-2 px-4 py-2 text-sm"
                          >
                            <Edit2 className="h-4 w-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            className="text-ivory/80 hover:bg-gold/10 hover:text-ivory flex w-full items-center gap-2 px-4 py-2 text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            Voir sur le site
                          </button>
                          <button
                            onClick={() => handleTogglePublished(post.slug, post.published)}
                            className="text-ivory/80 hover:bg-gold/10 hover:text-ivory flex w-full items-center gap-2 px-4 py-2 text-sm"
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
                            className="text-ivory/80 hover:bg-gold/10 hover:text-ivory flex w-full items-center gap-2 px-4 py-2 text-sm"
                          >
                            <Star className="h-4 w-4" />
                            {post.featured ? 'Retirer de la une' : 'Mettre en avant'}
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/admin/social/posts/new?blogSlug=${post.slug}`)
                            }
                            className="text-ivory/80 hover:bg-gold/10 hover:text-ivory flex w-full items-center gap-2 px-4 py-2 text-sm"
                          >
                            <Share2 className="h-4 w-4" />
                            Diffuser sur les réseaux
                          </button>
                          <hr className="border-gold/10 my-1" />
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
                    className="cursor-pointer p-4"
                    onClick={() => router.push(`/admin/blog/edit/${post.slug}`)}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {getStatusBadge(post)}
                      <span className="text-ivory/40 text-xs">{post.category}</span>
                    </div>

                    <h3 className="text-ivory group-hover:text-gold line-clamp-2 font-semibold transition">
                      {post.title}
                    </h3>

                    <p className="text-ivory/50 mt-2 line-clamp-2 text-sm">{post.description}</p>

                    <div className="text-ivory/40 mt-3 flex items-center justify-between text-xs">
                      <span>{new Date(post.date).toLocaleDateString('fr-FR')}</span>
                      {socialStatus && socialStatus.totalPosts > 0 && (
                        <span className="text-gold/70 flex items-center gap-1">
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
          <div className="border-gold/20 from-night/60 to-night/40 overflow-x-auto rounded-xl border bg-gradient-to-br">
            <table className="w-full">
              <thead>
                <tr className="border-gold/20 border-b">
                  <th className="text-ivory/50 hidden w-16 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider sm:table-cell">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('title')}
                      className="text-ivory/50 hover:text-ivory flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition"
                    >
                      Titre
                      {getSortIcon('title')}
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">
                    <button
                      onClick={() => handleSort('category')}
                      className="text-ivory/50 hover:text-ivory flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition"
                    >
                      Catégorie
                      {getSortIcon('category')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('published')}
                      className="text-ivory/50 hover:text-ivory flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition"
                    >
                      Statut
                      {getSortIcon('published')}
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">
                    <button
                      onClick={() => handleSort('date')}
                      className="text-ivory/50 hover:text-ivory flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition"
                    >
                      Date
                      {getSortIcon('date')}
                    </button>
                  </th>
                  <th className="text-ivory/50 w-12 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider sm:w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-gold/10 divide-y">
                {paginatedPosts.map((post, index) => {
                  const socialStatus = socialStatuses[post.slug];

                  return (
                    <motion.tr
                      key={post.slug}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gold/5 group cursor-pointer transition"
                      onClick={() => router.push(`/admin/blog/edit/${post.slug}`)}
                    >
                      {/* Image */}
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <div className="bg-night/60 relative h-10 w-14 overflow-hidden rounded">
                          {post.image ? (
                            <img
                              src={post.image}
                              alt={post.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="text-gold/20 flex h-full items-center justify-center">
                              <Tag className="h-4 w-4" />
                            </div>
                          )}
                          {post.featured && (
                            <div className="absolute -right-1 -top-1">
                              <Star className="text-gold h-3 w-3" fill="currentColor" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3">
                        <div className="max-w-[200px] sm:max-w-xs">
                          <p className="text-ivory group-hover:text-gold line-clamp-1 font-medium transition">
                            {post.title}
                          </p>
                          <p className="text-ivory/40 line-clamp-1 text-xs">{post.description}</p>
                          <span className="bg-gold/10 text-gold/80 mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium md:hidden">
                            {post.category}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="bg-gold/10 text-gold/80 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                          {post.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">{getStatusBadge(post)}</td>

                      {/* Date */}
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <div className="text-ivory/60 text-sm">
                          {new Date(post.date).toLocaleDateString('fr-FR')}
                        </div>
                        {socialStatus && socialStatus.totalPosts > 0 && (
                          <span className="text-gold/70 flex items-center gap-1 text-xs">
                            <Share2 className="h-3 w-3" />
                            {socialStatus.publishedPosts}/{socialStatus.totalPosts}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div
                          className="relative"
                          ref={el => {
                            if (el) menuRefs.current.set(`table-${post.slug}`, el);
                          }}
                        >
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setActiveMenu(
                                activeMenu === `table-${post.slug}` ? null : `table-${post.slug}`
                              );
                            }}
                            className="text-ivory/50 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {activeMenu === `table-${post.slug}` && (
                            <div
                              className="border-gold/20 bg-night/95 absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border py-1 shadow-xl backdrop-blur-sm"
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                onClick={() => router.push(`/admin/blog/edit/${post.slug}`)}
                                className="text-ivory/80 hover:bg-gold/10 hover:text-ivory flex w-full items-center gap-2 px-4 py-2 text-sm"
                              >
                                <Edit2 className="h-4 w-4" />
                                Modifier
                              </button>
                              <button
                                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                className="text-ivory/80 hover:bg-gold/10 hover:text-ivory flex w-full items-center gap-2 px-4 py-2 text-sm"
                              >
                                <Eye className="h-4 w-4" />
                                Voir sur le site
                              </button>
                              <button
                                onClick={() => handleTogglePublished(post.slug, post.published)}
                                className="text-ivory/80 hover:bg-gold/10 hover:text-ivory flex w-full items-center gap-2 px-4 py-2 text-sm"
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
                                onClick={() =>
                                  handleToggleFeatured(post.slug, post.featured || false)
                                }
                                className="text-ivory/80 hover:bg-gold/10 hover:text-ivory flex w-full items-center gap-2 px-4 py-2 text-sm"
                              >
                                <Star className="h-4 w-4" />
                                {post.featured ? 'Retirer de la une' : 'Mettre en avant'}
                              </button>
                              <button
                                onClick={() =>
                                  router.push(`/admin/social/posts/new?blogSlug=${post.slug}`)
                                }
                                className="text-ivory/80 hover:bg-gold/10 hover:text-ivory flex w-full items-center gap-2 px-4 py-2 text-sm"
                              >
                                <Share2 className="h-4 w-4" />
                                Diffuser sur les réseaux
                              </button>
                              <hr className="border-gold/10 my-1" />
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
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="text-ivory/70 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
            .map((page, idx, array) => (
              <div key={page} className="flex items-center">
                {idx > 0 && array[idx - 1] !== page - 1 && (
                  <span className="text-ivory/40 px-2">...</span>
                )}
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[2.5rem] rounded-lg px-3 py-2 text-sm font-medium transition ${
                    currentPage === page
                      ? 'bg-gold/20 text-gold'
                      : 'text-ivory/70 hover:bg-gold/10 hover:text-ivory'
                  }`}
                >
                  {page}
                </button>
              </div>
            ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="text-ivory/70 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={!!deleteConfirmation}
        title={deleteConfirmation?.title || ''}
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
