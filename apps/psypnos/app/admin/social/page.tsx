'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Calendar, History, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, useMemo } from 'react';

import type { SocialPlatform, PostStatus } from '@/lib/social/types';
import { useToast } from '@/lib/toast-context';

import { EditPostModal } from './_components/EditPostModal';
import { PostDetailPanel, type DetailPost } from './_components/PostDetailPanel';
import { PostsHistory, type HistoryPost } from './_components/PostsHistory';
import { SocialCalendar, type CalendarPost } from './_components/SocialCalendar';
import { SocialInsights } from './_components/SocialInsights';

// ===========================================
// Types
// ===========================================

interface DashboardAnalytics {
  impressions: number;
  engagements: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

interface SocialPostData {
  id: string;
  platform: SocialPlatform;
  content: string;
  status: PostStatus;
  blogTitle: string | null;
  blogSlug: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  accountName: string;
  hashtags: string[];
  platformUrl: string | null;
  errorMessage: string | null;
  linkUrl: string | null;
}

type ViewMode = 'calendar' | 'history' | 'insights';

// ===========================================
// Main Page Component
// ===========================================

export default function SocialPage() {
  const { addToast } = useToast();

  // Data states
  const [posts, setPosts] = useState<SocialPostData[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI states
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedPost, setSelectedPost] = useState<SocialPostData | null>(null);
  const [editingPost, setEditingPost] = useState<SocialPostData | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // ===========================================
  // Data Loading
  // ===========================================

  const loadData = useCallback(async () => {
    try {
      // Load posts
      const postsRes = await fetch('/api/social/posts?t=' + Date.now(), {
        cache: 'no-store',
      });
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      }

      // Load analytics
      const analyticsRes = await fetch('/api/social/analytics?days=30&t=' + Date.now(), {
        cache: 'no-store',
      });
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        if (analyticsData.stats) {
          setAnalytics({
            impressions: analyticsData.stats.totalImpressions || 0,
            engagements: analyticsData.stats.totalEngagements || 0,
            reach: analyticsData.stats.totalReach || 0,
            likes: analyticsData.stats.totalLikes || 0,
            comments: analyticsData.stats.totalComments || 0,
            shares: analyticsData.stats.totalShares || 0,
            engagementRate: analyticsData.stats.averageEngagementRate || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh analytics from platforms
      const response = await fetch('/api/social/analytics/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoursBack: 48 }),
      });

      if (response.ok) {
        addToast({
          title: 'Données rafraîchies',
          description: 'Les analytics ont été mis à jour',
          variant: 'success',
        });
        await loadData();
      } else {
        throw new Error('Failed to refresh');
      }
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de rafraîchir les données',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ===========================================
  // Post Actions
  // ===========================================

  const handlePublishNow = async (postId: string) => {
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/social/posts/${postId}/publish`, {
        method: 'POST',
      });

      if (response.ok) {
        addToast({
          title: 'Publication réussie',
          variant: 'success',
        });
        await loadData();
        setSelectedPost(null);
      } else {
        const data = await response.json();
        addToast({
          title: 'Erreur de publication',
          description: data.error || 'Une erreur est survenue',
          variant: 'error',
        });
      }
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de publier',
        variant: 'error',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSavePost = async (
    postId: string,
    data: { scheduledAt: string | null; content?: string }
  ) => {
    const status = data.scheduledAt ? 'SCHEDULED' : 'DRAFT';

    const response = await fetch(`/api/social/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, status }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la modification');
    }

    addToast({
      title: 'Post modifié',
      description: data.scheduledAt
        ? `Programmé pour le ${new Date(data.scheduledAt).toLocaleDateString('fr-FR')}`
        : 'Converti en brouillon',
      variant: 'success',
    });

    await loadData();
    setEditingPost(null);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        addToast({
          title: 'Post supprimé',
          variant: 'success',
        });
        await loadData();
        setSelectedPost(null);
      } else {
        const data = await response.json();
        addToast({
          title: 'Erreur',
          description: data.error || 'Impossible de supprimer',
          variant: 'error',
        });
      }
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de supprimer le post',
        variant: 'error',
      });
    }
  };

  // ===========================================
  // Computed Data
  // ===========================================

  const calendarPosts: CalendarPost[] = useMemo(
    () =>
      posts.map(p => ({
        id: p.id,
        platform: p.platform,
        content: p.content,
        status: p.status,
        blogTitle: p.blogTitle,
        scheduledAt: p.scheduledAt,
        publishedAt: p.publishedAt,
        accountName: p.accountName,
        hashtags: p.hashtags,
        platformUrl: p.platformUrl,
      })),
    [posts]
  );

  const historyPosts: HistoryPost[] = useMemo(
    () =>
      posts.map(p => ({
        id: p.id,
        platform: p.platform,
        content: p.content,
        status: p.status,
        blogTitle: p.blogTitle,
        blogSlug: p.blogSlug,
        scheduledAt: p.scheduledAt,
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
        accountName: p.accountName,
        hashtags: p.hashtags,
        platformUrl: p.platformUrl,
        errorMessage: p.errorMessage,
      })),
    [posts]
  );

  const insightPosts = useMemo(
    () =>
      posts.map(p => ({
        id: p.id,
        platform: p.platform,
        status: p.status,
        publishedAt: p.publishedAt,
        scheduledAt: p.scheduledAt,
      })),
    [posts]
  );

  const detailPost: DetailPost | null = useMemo(() => {
    if (!selectedPost) return null;
    return {
      ...selectedPost,
      analytics: null, // TODO: Load individual post analytics
    };
  }, [selectedPost]);

  // Stats for quick overview
  const quickStats = useMemo(() => {
    const published = posts.filter(p => p.status === 'PUBLISHED').length;
    const scheduled = posts.filter(p => p.status === 'SCHEDULED').length;
    const drafts = posts.filter(p => p.status === 'DRAFT').length;
    return { total: posts.length, published, scheduled, drafts };
  }, [posts]);

  // ===========================================
  // Render
  // ===========================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gold/20 h-10 w-64 animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gold/20 h-24 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="bg-gold/20 h-96 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-gold text-sm uppercase tracking-[0.3em]">Réseaux sociaux</p>
          <h1 className="text-ivory mt-2 text-3xl font-semibold">Centre de publication</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-gold/20 bg-night/30 text-ivory/70 hover:border-gold/40 hover:text-ivory inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <Link
            href="/admin/social/posts/new"
            className="bg-gold/20 text-gold hover:bg-gold/30 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
          >
            <Sparkles className="h-4 w-4" />
            Générer du contenu
          </Link>
        </div>
      </motion.div>

      {/* Quick Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border-gold/20 from-night/60 to-night/40 flex flex-wrap items-center gap-6 rounded-lg border bg-gradient-to-r px-6 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 rounded-lg p-2">
            <BarChart3 className="text-gold h-5 w-5" />
          </div>
          <div>
            <p className="text-ivory text-2xl font-semibold">{quickStats.total}</p>
            <p className="text-ivory/50 text-xs">Publications</p>
          </div>
        </div>
        <div className="bg-gold/20 h-8 w-px" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-ivory/70 text-sm">{quickStats.published} publiés</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-ivory/70 text-sm">{quickStats.scheduled} programmés</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-ivory/70 text-sm">{quickStats.drafts} brouillons</span>
          </div>
        </div>
        {analytics && (
          <>
            <div className="bg-gold/20 hidden h-8 w-px sm:block" />
            <div className="flex hidden items-center gap-2 sm:flex">
              <span className="text-ivory/50 text-sm">Engagements:</span>
              <span className="text-gold text-sm font-medium">
                {analytics.engagements.toLocaleString()}
              </span>
              <span className="text-ivory/40 text-xs">
                ({analytics.engagementRate.toFixed(2)}%)
              </span>
            </div>
          </>
        )}
      </motion.div>

      {/* View Mode Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2"
      >
        <button
          onClick={() => setViewMode('calendar')}
          className={`
            inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition
            ${
              viewMode === 'calendar'
                ? 'bg-gold/20 text-gold'
                : 'text-ivory/60 hover:bg-gold/10 hover:text-ivory'
            }
          `}
        >
          <Calendar className="h-4 w-4" />
          Calendrier
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`
            inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition
            ${
              viewMode === 'history'
                ? 'bg-gold/20 text-gold'
                : 'text-ivory/60 hover:bg-gold/10 hover:text-ivory'
            }
          `}
        >
          <History className="h-4 w-4" />
          Historique
        </button>
        <button
          onClick={() => setViewMode('insights')}
          className={`
            inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition
            ${
              viewMode === 'insights'
                ? 'bg-gold/20 text-gold'
                : 'text-ivory/60 hover:bg-gold/10 hover:text-ivory'
            }
          `}
        >
          <BarChart3 className="h-4 w-4" />
          Insights
        </button>
      </motion.div>

      {/* Main Content Area */}
      <div className="relative">
        {/* Main Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="min-w-0"
        >
          <AnimatePresence mode="wait">
            {viewMode === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <SocialCalendar
                  posts={calendarPosts}
                  onPostSelect={post => setSelectedPost(posts.find(p => p.id === post.id) || null)}
                  onDateSelect={date => {
                    // Could open a create modal for this date
                    console.log('Selected date:', date);
                  }}
                  onPublishNow={handlePublishNow}
                  onEditPost={post => setEditingPost(posts.find(p => p.id === post.id) || null)}
                  onDeletePost={handleDeletePost}
                  selectedPostId={selectedPost?.id}
                />
              </motion.div>
            )}

            {viewMode === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <PostsHistory
                  posts={historyPosts}
                  onPostSelect={post => setSelectedPost(posts.find(p => p.id === post.id) || null)}
                  onEditPost={post => setEditingPost(posts.find(p => p.id === post.id) || null)}
                  onDeletePost={handleDeletePost}
                  onPublishNow={handlePublishNow}
                  selectedPostId={selectedPost?.id}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {viewMode === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <SocialInsights posts={insightPosts} analytics={analytics} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Detail Panel - Renders as overlay on all screen sizes */}
        <PostDetailPanel
          post={detailPost}
          onClose={() => setSelectedPost(null)}
          onEdit={post => setEditingPost(posts.find(p => p.id === post.id) || null)}
          onDelete={handleDeletePost}
          onPublishNow={handlePublishNow}
          isPublishing={isPublishing}
        />
      </div>

      {/* Edit Modal */}
      <EditPostModal
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleSavePost}
      />
    </div>
  );
}
