'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  ExternalLink,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  LayoutList,
  Grid3X3,
  SlidersHorizontal,
  ArrowUpDown,
  Hash,
  FileText,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';

import type { SocialPlatform, PostStatus } from '@/lib/social/types';
import { IMPLEMENTED_PLATFORMS } from '@/lib/social/types';

import { SocialPlatformIcon } from '../accounts/_components/SocialPlatformIcon';

// ===========================================
// Types
// ===========================================

export interface HistoryPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  status: PostStatus;
  blogTitle: string | null;
  blogSlug: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  accountName?: string;
  hashtags?: string[];
  platformUrl?: string | null;
  errorMessage?: string | null;
}

interface SearchFilters {
  query: string;
  platforms: SocialPlatform[];
  statuses: PostStatus[];
  dateFrom: string;
  dateTo: string;
  hasArticle: 'all' | 'yes' | 'no';
  sortBy: 'date' | 'platform' | 'status';
  sortOrder: 'asc' | 'desc';
}

type ViewMode = 'list' | 'grid';

interface PostsHistoryProps {
  posts: HistoryPost[];
  onPostSelect: (post: HistoryPost) => void;
  onEditPost: (post: HistoryPost) => void;
  onDeletePost: (postId: string) => void;
  onPublishNow: (postId: string) => void;
  selectedPostId?: string | null;
  isLoading?: boolean;
}

// ===========================================
// Helpers
// ===========================================

const STATUS_OPTIONS: { value: PostStatus; label: string; color: string }[] = [
  { value: 'PUBLISHED', label: 'Publié', color: 'text-green-400' },
  { value: 'SCHEDULED', label: 'Programmé', color: 'text-blue-400' },
  { value: 'DRAFT', label: 'Brouillon', color: 'text-amber-400' },
  { value: 'FAILED', label: 'Échec', color: 'text-red-400' },
  { value: 'PUBLISHING', label: 'Publication...', color: 'text-purple-400' },
  { value: 'CANCELLED', label: 'Annulé', color: 'text-gray-400' },
];

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  FACEBOOK: '#1877F2',
  LINKEDIN: '#0A66C2',
  INSTAGRAM: '#E4405F',
  TWITTER: '#1DA1F2',
  THREADS: '#000000',
};

function getStatusConfig(status: PostStatus) {
  switch (status) {
    case 'PUBLISHED':
      return {
        color: 'bg-green-500/10 text-green-400 border-green-500/30',
        icon: CheckCircle,
        label: 'Publié',
      };
    case 'SCHEDULED':
      return {
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        icon: Clock,
        label: 'Programmé',
      };
    case 'DRAFT':
      return {
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        icon: Edit2,
        label: 'Brouillon',
      };
    case 'FAILED':
      return {
        color: 'bg-red-500/10 text-red-400 border-red-500/30',
        icon: AlertCircle,
        label: 'Échec',
      };
    case 'PUBLISHING':
      return {
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        icon: Clock,
        label: 'Publication...',
      };
    case 'CANCELLED':
      return { color: 'bg-gray-500/10 text-gray-400 border-gray-500/30', icon: X, label: 'Annulé' };
    default:
      return {
        color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
        icon: Clock,
        label: status,
      };
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ===========================================
// Sub-components
// ===========================================

function FilterChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition
        ${
          active
            ? 'bg-gold/20 text-gold border-gold/40 border'
            : 'bg-night/30 text-ivory/60 border-gold/10 hover:border-gold/30 hover:text-ivory border'
        }
      `}
    >
      {label}
      {count !== undefined && (
        <span
          className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-gold/30' : 'bg-ivory/10'}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function PostCard({
  post,
  onSelect,
  onEdit,
  onDelete,
  onPublish,
  isSelected,
  viewMode,
}: {
  post: HistoryPost;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
  isSelected: boolean;
  viewMode: ViewMode;
}) {
  const statusConfig = getStatusConfig(post.status);
  const StatusIcon = statusConfig.icon;
  const displayDate = post.publishedAt || post.scheduledAt || post.createdAt;

  if (viewMode === 'grid') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={onSelect}
        className={`
          group cursor-pointer rounded-lg border p-4 transition-all
          ${isSelected ? 'border-gold bg-gold/10' : 'border-gold/10 bg-night/20 hover:border-gold/30'}
        `}
        style={{ borderLeft: `4px solid ${PLATFORM_COLORS[post.platform]}` }}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <SocialPlatformIcon platform={post.platform} className="h-5 w-5" />
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${statusConfig.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </span>
          </div>
          <span className="text-ivory/50 text-xs">{formatDate(displayDate)}</span>
        </div>

        {post.blogTitle && (
          <div className="text-ivory/60 mb-2 flex items-center gap-1.5 text-xs">
            <FileText className="h-3 w-3" />
            <span className="truncate">{post.blogTitle}</span>
          </div>
        )}

        <p className="text-ivory mb-3 line-clamp-3 text-sm">{post.content}</p>

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="text-gold/70 mb-3 flex items-center gap-1 text-xs">
            <Hash className="h-3 w-3" />
            <span className="truncate">{post.hashtags.slice(0, 3).join(' ')}</span>
            {post.hashtags.length > 3 && <span>+{post.hashtags.length - 3}</span>}
          </div>
        )}

        <div className="border-gold/10 flex items-center justify-between border-t pt-2 opacity-0 transition group-hover:opacity-100">
          <div className="flex items-center gap-1">
            {post.status === 'SCHEDULED' && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onPublish();
                }}
                className="rounded p-1.5 text-green-400 transition hover:bg-green-500/20"
                title="Publier maintenant"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
            {post.status !== 'PUBLISHED' && post.status !== 'PUBLISHING' && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="text-ivory/60 hover:bg-gold/20 hover:text-ivory rounded p-1.5 transition"
                title="Modifier"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {post.platformUrl && (
              <a
                href={post.platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-ivory/60 hover:bg-gold/20 hover:text-ivory rounded p-1.5 transition"
                title="Voir sur la plateforme"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <button
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1.5 text-red-400/60 transition hover:bg-red-500/20 hover:text-red-400"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onSelect}
      className={`
        group flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all
        ${isSelected ? 'border-gold bg-gold/10' : 'border-gold/10 bg-night/20 hover:border-gold/30'}
      `}
    >
      <div
        className="flex-shrink-0 rounded-lg p-2"
        style={{ backgroundColor: `${PLATFORM_COLORS[post.platform]}20` }}
      >
        <SocialPlatformIcon platform={post.platform} className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${statusConfig.color}`}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </span>
          <span className="text-ivory/50 text-xs">{formatDateTime(displayDate)}</span>
          {post.blogTitle && (
            <>
              <span className="text-ivory/30">•</span>
              <span className="text-ivory/60 max-w-[200px] truncate text-xs">{post.blogTitle}</span>
            </>
          )}
        </div>

        <p className="text-ivory mb-2 line-clamp-2 text-sm">{post.content}</p>

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="text-gold/70 flex items-center gap-1 text-xs">
            <Hash className="h-3 w-3" />
            <span>{post.hashtags.slice(0, 5).join(' ')}</span>
            {post.hashtags.length > 5 && (
              <span className="text-ivory/40">+{post.hashtags.length - 5}</span>
            )}
          </div>
        )}

        {post.status === 'FAILED' && post.errorMessage && (
          <p className="mt-2 text-xs text-red-400">Erreur: {post.errorMessage}</p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        {post.status === 'SCHEDULED' && (
          <button
            onClick={e => {
              e.stopPropagation();
              onPublish();
            }}
            className="rounded-lg p-2 text-green-400 transition hover:bg-green-500/20"
            title="Publier maintenant"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        )}
        {post.status !== 'PUBLISHED' && post.status !== 'PUBLISHING' && (
          <button
            onClick={e => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-ivory/60 hover:bg-gold/20 hover:text-ivory rounded-lg p-2 transition"
            title="Modifier"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        )}
        {post.platformUrl && (
          <a
            href={post.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-ivory/60 hover:bg-gold/20 hover:text-ivory rounded-lg p-2 transition"
            title="Voir sur la plateforme"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-lg p-2 text-red-400/60 transition hover:bg-red-500/20 hover:text-red-400"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ===========================================
// Main Component
// ===========================================

export function PostsHistory({
  posts,
  onPostSelect,
  onEditPost,
  onDeletePost,
  onPublishNow,
  selectedPostId,
  isLoading = false,
}: PostsHistoryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    platforms: [],
    statuses: [],
    dateFrom: '',
    dateTo: '',
    hasArticle: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const updateFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const togglePlatform = useCallback((platform: SocialPlatform) => {
    setFilters(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  }, []);

  const toggleStatus = useCallback((status: PostStatus) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      platforms: [],
      statuses: [],
      dateFrom: '',
      dateTo: '',
      hasArticle: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
    });
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.platforms.length) count++;
    if (filters.statuses.length) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.hasArticle !== 'all') count++;
    return count;
  }, [filters]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(
        post =>
          post.content.toLowerCase().includes(query) ||
          post.blogTitle?.toLowerCase().includes(query) ||
          post.hashtags?.some(h => h.toLowerCase().includes(query))
      );
    }

    // Platform filter
    if (filters.platforms.length > 0) {
      result = result.filter(post => filters.platforms.includes(post.platform));
    }

    // Status filter
    if (filters.statuses.length > 0) {
      result = result.filter(post => filters.statuses.includes(post.status));
    }

    // Date range filter
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      result = result.filter(post => {
        const date = new Date(post.publishedAt || post.scheduledAt || post.createdAt);
        return date >= from;
      });
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(post => {
        const date = new Date(post.publishedAt || post.scheduledAt || post.createdAt);
        return date <= to;
      });
    }

    // Article filter
    if (filters.hasArticle === 'yes') {
      result = result.filter(post => post.blogSlug);
    } else if (filters.hasArticle === 'no') {
      result = result.filter(post => !post.blogSlug);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'date':
          const dateA = new Date(a.publishedAt || a.scheduledAt || a.createdAt);
          const dateB = new Date(b.publishedAt || b.scheduledAt || b.createdAt);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'platform':
          comparison = a.platform.localeCompare(b.platform);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [posts, filters]);

  // Stats
  const stats = useMemo(() => {
    const platformCounts = IMPLEMENTED_PLATFORMS.reduce(
      (acc, p) => {
        acc[p] = posts.filter(post => post.platform === p).length;
        return acc;
      },
      {} as Record<SocialPlatform, number>
    );

    const statusCounts = STATUS_OPTIONS.reduce(
      (acc, s) => {
        acc[s.value] = posts.filter(post => post.status === s.value).length;
        return acc;
      },
      {} as Record<PostStatus, number>
    );

    return { platformCounts, statusCounts };
  }, [posts]);

  return (
    <div className="space-y-4">
      {/* Search & Filters Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative max-w-md flex-1">
          <Search className="text-ivory/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={filters.query}
            onChange={e => updateFilter('query', e.target.value)}
            placeholder="Rechercher dans les publications..."
            className="border-gold/20 bg-night/50 text-ivory placeholder:text-ivory/40 focus:border-gold w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm focus:outline-none"
          />
          {filters.query && (
            <button
              onClick={() => updateFilter('query', '')}
              className="text-ivory/40 hover:text-ivory absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition
              ${
                showFilters || activeFiltersCount > 0
                  ? 'border-gold/40 bg-gold/10 text-gold'
                  : 'border-gold/20 bg-night/30 text-ivory/70 hover:border-gold/40'
              }
            `}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="bg-gold/30 rounded-full px-1.5 py-0.5 text-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="border-gold/20 bg-night/30 flex rounded-lg border p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1.5 transition ${viewMode === 'list' ? 'bg-gold/20 text-gold' : 'text-ivory/60 hover:text-ivory'}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-1.5 transition ${viewMode === 'grid' ? 'bg-gold/20 text-gold' : 'text-ivory/60 hover:text-ivory'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-gold/20 bg-night/30 space-y-4 rounded-lg border p-4">
              {/* Platform Filters */}
              <div>
                <label className="text-ivory/60 mb-2 block text-xs font-medium">Plateformes</label>
                <div className="flex flex-wrap gap-2">
                  {IMPLEMENTED_PLATFORMS.map(platform => (
                    <FilterChip
                      key={platform}
                      label={platform.charAt(0) + platform.slice(1).toLowerCase()}
                      active={filters.platforms.includes(platform)}
                      onClick={() => togglePlatform(platform)}
                      count={stats.platformCounts[platform]}
                    />
                  ))}
                </div>
              </div>

              {/* Status Filters */}
              <div>
                <label className="text-ivory/60 mb-2 block text-xs font-medium">Statut</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(status => (
                    <FilterChip
                      key={status.value}
                      label={status.label}
                      active={filters.statuses.includes(status.value)}
                      onClick={() => toggleStatus(status.value)}
                      count={stats.statusCounts[status.value]}
                    />
                  ))}
                </div>
              </div>

              {/* Date Range & Article Filter */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-ivory/60 mb-2 block text-xs font-medium">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={e => updateFilter('dateFrom', e.target.value)}
                    className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-ivory/60 mb-2 block text-xs font-medium">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={e => updateFilter('dateTo', e.target.value)}
                    className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-ivory/60 mb-2 block text-xs font-medium">
                    Article lié
                  </label>
                  <select
                    value={filters.hasArticle}
                    onChange={e =>
                      updateFilter('hasArticle', e.target.value as 'all' | 'yes' | 'no')
                    }
                    className="border-gold/20 bg-night/50 text-ivory focus:border-gold w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="all">Tous</option>
                    <option value="yes">Avec article</option>
                    <option value="no">Sans article</option>
                  </select>
                </div>
              </div>

              {/* Sort & Clear */}
              <div className="border-gold/10 flex items-center justify-between border-t pt-2">
                <div className="flex items-center gap-3">
                  <label className="text-ivory/60 text-xs font-medium">Trier par:</label>
                  <select
                    value={filters.sortBy}
                    onChange={e =>
                      updateFilter('sortBy', e.target.value as 'date' | 'platform' | 'status')
                    }
                    className="border-gold/20 bg-night/50 text-ivory focus:border-gold rounded-lg border px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="date">Date</option>
                    <option value="platform">Plateforme</option>
                    <option value="status">Statut</option>
                  </select>
                  <button
                    onClick={() =>
                      updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
                    }
                    className="border-gold/20 bg-night/50 text-ivory/70 hover:text-ivory flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {filters.sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
                  </button>
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-400 transition hover:text-red-300"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-ivory/60">
          {filteredPosts.length} publication{filteredPosts.length !== 1 ? 's' : ''}
          {activeFiltersCount > 0 && ` (sur ${posts.length} au total)`}
        </span>
      </div>

      {/* Posts List/Grid */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gold/10 h-24 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-12 text-center">
          <Search className="text-gold/30 mx-auto h-12 w-12" />
          <p className="text-ivory/50 mt-4">
            {posts.length === 0
              ? 'Aucune publication pour le moment'
              : 'Aucune publication ne correspond à vos critères'}
          </p>
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="text-gold mt-4 text-sm hover:underline">
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-3'
          }
        >
          <AnimatePresence mode="popLayout">
            {filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onSelect={() => onPostSelect(post)}
                onEdit={() => onEditPost(post)}
                onDelete={() => onDeletePost(post.id)}
                onPublish={() => onPublishNow(post.id)}
                isSelected={selectedPostId === post.id}
                viewMode={viewMode}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
