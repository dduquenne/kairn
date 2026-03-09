'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Edit2,
  Trash2,
  Send,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Hash,
  FileText,
  Link2,
  User,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

import type { SocialPlatform, PostStatus } from '@/lib/social/types';

import { SocialPlatformIcon } from '../accounts/_components/SocialPlatformIcon';

// ===========================================
// Types
// ===========================================

export interface DetailPost {
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
  linkUrl?: string | null;
  analytics?: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    engagements: number;
  } | null;
}

interface PostDetailPanelProps {
  post: DetailPost | null;
  onClose: () => void;
  onEdit: (post: DetailPost) => void;
  onDelete: (postId: string) => void;
  onPublishNow: (postId: string) => void;
  isPublishing?: boolean;
}

// ===========================================
// Helpers
// ===========================================

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
        bgColor: 'bg-green-500/5',
        icon: CheckCircle,
        label: 'Publié',
      };
    case 'SCHEDULED':
      return {
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        bgColor: 'bg-blue-500/5',
        icon: Clock,
        label: 'Programmé',
      };
    case 'DRAFT':
      return {
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        bgColor: 'bg-amber-500/5',
        icon: Edit2,
        label: 'Brouillon',
      };
    case 'FAILED':
      return {
        color: 'bg-red-500/10 text-red-400 border-red-500/30',
        bgColor: 'bg-red-500/5',
        icon: AlertCircle,
        label: 'Échec',
      };
    case 'PUBLISHING':
      return {
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        bgColor: 'bg-purple-500/5',
        icon: Send,
        label: 'Publication en cours...',
      };
    case 'CANCELLED':
      return {
        color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
        bgColor: 'bg-gray-500/5',
        icon: X,
        label: 'Annulé',
      };
    default:
      return {
        color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
        bgColor: 'bg-gray-500/5',
        icon: Clock,
        label: status,
      };
  }
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// ===========================================
// Main Component
// ===========================================

export function PostDetailPanel({
  post,
  onClose,
  onEdit,
  onDelete,
  onPublishNow,
  isPublishing = false,
}: PostDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopyContent = async () => {
    if (!post) return;
    try {
      await navigator.clipboard.writeText(post.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = () => {
    if (!post) return;
    onDelete(post.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {post && (
        <>
          {/* Backdrop - visible on all screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="bg-night/60 fixed inset-0 z-40 backdrop-blur-sm"
          />

          {/* Panel - Responsive: full width on mobile, max-w-md on larger screens */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="border-gold/20 from-night via-night/95 to-night/90 fixed bottom-0 right-0 top-0 z-50 w-full sm:max-w-md overflow-y-auto border-l bg-gradient-to-br shadow-2xl"
          >
            {/* Header */}
            <div className="border-gold/20 bg-night/95 sticky top-0 z-10 border-b p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-lg p-2"
                    style={{ backgroundColor: `${PLATFORM_COLORS[post.platform]}20` }}
                  >
                    <SocialPlatformIcon platform={post.platform} className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-ivory font-semibold capitalize">
                      {post.platform.toLowerCase()}
                    </h3>
                    {post.accountName && (
                      <p className="text-ivory/50 flex items-center gap-1 text-xs">
                        <User className="h-3 w-3" />
                        {post.accountName}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-ivory/50 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 p-4">
              {/* Status Badge */}
              {(() => {
                const statusConfig = getStatusConfig(post.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div
                    className={`rounded-lg border p-4 ${statusConfig.color} ${statusConfig.bgColor}`}
                  >
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-5 w-5" />
                      <span className="font-medium">{statusConfig.label}</span>
                    </div>
                    {post.status === 'FAILED' && post.errorMessage && (
                      <p className="mt-2 text-sm opacity-80">{post.errorMessage}</p>
                    )}
                  </div>
                );
              })()}

              {/* Dates */}
              <div className="space-y-2">
                {post.publishedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-ivory/60">Publié:</span>
                    <span className="text-ivory">{formatDateTime(post.publishedAt)}</span>
                  </div>
                )}
                {post.scheduledAt && post.status === 'SCHEDULED' && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span className="text-ivory/60">Programmé:</span>
                    <span className="text-ivory">{formatDateTime(post.scheduledAt)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-ivory/40 h-4 w-4" />
                  <span className="text-ivory/60">Créé:</span>
                  <span className="text-ivory/70">{formatDateTime(post.createdAt)}</span>
                </div>
              </div>

              {/* Article Link */}
              {post.blogTitle && (
                <div className="border-gold/10 bg-night/30 rounded-lg border p-3">
                  <div className="text-ivory/50 mb-1 flex items-center gap-2 text-xs">
                    <FileText className="h-3 w-3" />
                    Article lié
                  </div>
                  <p className="text-ivory text-sm">{post.blogTitle}</p>
                  {post.blogSlug && (
                    <a
                      href={`/blog/${post.blogSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold mt-2 inline-flex items-center gap-1 text-xs hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Voir l&apos;article
                    </a>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-ivory/60 text-xs font-medium">Contenu</span>
                  <button
                    onClick={handleCopyContent}
                    className="text-ivory/50 hover:text-gold flex items-center gap-1 text-xs transition"
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? 'Copié!' : 'Copier'}
                  </button>
                </div>
                <div className="border-gold/10 bg-night/30 rounded-lg border p-4">
                  <p className="text-ivory whitespace-pre-wrap text-sm leading-relaxed">
                    {post.content}
                  </p>
                </div>
              </div>

              {/* Hashtags */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-ivory/60 flex items-center gap-1 text-xs font-medium">
                    <Hash className="h-3 w-3" />
                    Hashtags ({post.hashtags.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {post.hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gold/10 text-gold rounded-full px-2.5 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Link URL */}
              {post.linkUrl && (
                <div className="space-y-2">
                  <span className="text-ivory/60 flex items-center gap-1 text-xs font-medium">
                    <Link2 className="h-3 w-3" />
                    Lien
                  </span>
                  <a
                    href={post.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-gold/10 bg-night/30 text-gold hover:border-gold/30 block truncate rounded-lg border p-3 text-sm transition"
                  >
                    {post.linkUrl}
                  </a>
                </div>
              )}

              {/* Analytics (if published) */}
              {post.analytics && post.status === 'PUBLISHED' && (
                <div className="space-y-3">
                  <span className="text-ivory/60 text-xs font-medium">Performance</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border-gold/10 bg-night/30 rounded-lg border p-3 text-center">
                      <Eye className="text-gold/70 mx-auto mb-1 h-4 w-4" />
                      <p className="text-ivory text-lg font-semibold">
                        {formatNumber(post.analytics.impressions)}
                      </p>
                      <p className="text-ivory/50 text-xs">Impressions</p>
                    </div>
                    <div className="border-gold/10 bg-night/30 rounded-lg border p-3 text-center">
                      <Heart className="mx-auto mb-1 h-4 w-4 text-pink-400/70" />
                      <p className="text-ivory text-lg font-semibold">
                        {formatNumber(post.analytics.likes)}
                      </p>
                      <p className="text-ivory/50 text-xs">Likes</p>
                    </div>
                    <div className="border-gold/10 bg-night/30 rounded-lg border p-3 text-center">
                      <MessageCircle className="mx-auto mb-1 h-4 w-4 text-blue-400/70" />
                      <p className="text-ivory text-lg font-semibold">
                        {formatNumber(post.analytics.comments)}
                      </p>
                      <p className="text-ivory/50 text-xs">Commentaires</p>
                    </div>
                    <div className="border-gold/10 bg-night/30 rounded-lg border p-3 text-center">
                      <Share2 className="mx-auto mb-1 h-4 w-4 text-green-400/70" />
                      <p className="text-ivory text-lg font-semibold">
                        {formatNumber(post.analytics.shares)}
                      </p>
                      <p className="text-ivory/50 text-xs">Partages</p>
                    </div>
                    <div className="border-gold/10 bg-night/30 col-span-2 rounded-lg border p-3 text-center">
                      <p className="text-ivory text-lg font-semibold">
                        {formatNumber(post.analytics.reach)}
                      </p>
                      <p className="text-ivory/50 text-xs">Portée</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Platform Link */}
              {post.platformUrl && (
                <a
                  href={post.platformUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-gold/20 bg-gold/10 text-gold hover:bg-gold/20 flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition"
                >
                  <ExternalLink className="h-4 w-4" />
                  Voir sur {post.platform.charAt(0) + post.platform.slice(1).toLowerCase()}
                </a>
              )}
            </div>

            {/* Actions Footer */}
            <div className="border-gold/20 bg-night/95 sticky bottom-0 border-t p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                {post.status === 'SCHEDULED' && (
                  <button
                    onClick={() => onPublishNow(post.id)}
                    disabled={isPublishing}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500/20 py-2.5 text-sm font-medium text-green-400 transition hover:bg-green-500/30 disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publication...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Publier maintenant
                      </>
                    )}
                  </button>
                )}
                {post.status !== 'PUBLISHED' && post.status !== 'PUBLISHING' && (
                  <button
                    onClick={() => onEdit(post)}
                    className="border-gold/20 text-ivory/80 hover:border-gold/40 hover:text-ivory flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition"
                  >
                    <Edit2 className="h-4 w-4" />
                    Modifier
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-red-500/20 px-4 py-2.5 text-sm text-red-400/80 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Delete Confirmation */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-night/80 absolute inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                    className="bg-night w-full max-w-sm rounded-xl border border-red-500/30 p-6"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <h3 className="text-ivory text-lg font-semibold">Supprimer ce post?</h3>
                    </div>
                    <p className="text-ivory/70 mb-6 text-sm">
                      Cette action est irréversible. Le post sera définitivement supprimé.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="border-gold/20 text-ivory/70 hover:border-gold/40 hover:text-ivory flex-1 rounded-lg border py-2 transition"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/20 py-2 font-medium text-red-400 transition hover:bg-red-500/30"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
