/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { Share2, ArrowRight, Clock, CheckCircle, XCircle, Calendar, Eye, Heart, Facebook, Linkedin, Instagram } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SocialPostData {
  id: string;
  platform: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  blogSlug: string | null;
  impressions: number;
  engagements: number;
}

interface SocialAnalyticsData {
  recentPosts: SocialPostData[];
  stats: {
    totalPosts: number;
    publishedPosts: number;
    scheduledPosts: number;
    failedPosts: number;
    totalImpressions: number;
    totalEngagements: number;
  };
}

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4 text-blue-500" />,
  linkedin: <Linkedin className="h-4 w-4 text-blue-600" />,
  instagram: <Instagram className="h-4 w-4 text-pink-500" />,
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  PUBLISHED: {
    icon: <CheckCircle className="h-3 w-3" />,
    color: "text-green-400 bg-green-500/20",
    label: "Publié",
  },
  SCHEDULED: {
    icon: <Calendar className="h-3 w-3" />,
    color: "text-blue-400 bg-blue-500/20",
    label: "Programmé",
  },
  DRAFT: {
    icon: <Clock className="h-3 w-3" />,
    color: "text-ivory/60 bg-ivory/10",
    label: "Brouillon",
  },
  FAILED: {
    icon: <XCircle className="h-3 w-3" />,
    color: "text-red-400 bg-red-500/20",
    label: "Échec",
  },
};

export function SocialPostsWidget() {
  const [data, setData] = useState<SocialAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/social/analytics?days=7");
        if (response.ok) {
          const result = await response.json();
          setData({
            recentPosts: result.recentPosts || [],
            stats: result.stats || {
              totalPosts: 0,
              publishedPosts: 0,
              scheduledPosts: 0,
              failedPosts: 0,
              totalImpressions: 0,
              totalEngagements: 0,
            },
          });
        }
      } catch (error) {
        console.error("Error loading social analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gold/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const recentPosts = data.recentPosts.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Share2 className="h-6 w-6 text-gold" />
          <h2 className="text-lg font-semibold text-ivory">Publications Sociales</h2>
        </div>
        <Link
          href="/admin/social"
          className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition"
        >
          Voir plus
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-gold/5 p-4">
          <p className="text-xs font-medium text-ivory/60">Publiés</p>
          <p className="mt-2 text-xl font-bold text-green-400">
            {data.stats.publishedPosts.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-gold/5 p-4">
          <p className="text-xs font-medium text-ivory/60">Impressions</p>
          <p className="mt-2 text-xl font-bold text-gold">
            {data.stats.totalImpressions.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-gold/5 p-4">
          <p className="text-xs font-medium text-ivory/60">Engagements</p>
          <p className="mt-2 text-xl font-bold text-gold">
            {data.stats.totalEngagements.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent Posts */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-ivory">Dernières Publications</h3>
        {recentPosts.length === 0 ? (
          <div className="rounded-lg bg-gold/5 p-4 text-center">
            <p className="text-sm text-ivory/60">Aucune publication récente</p>
            <Link
              href="/admin/social/posts/new"
              className="mt-2 inline-flex items-center gap-2 text-sm text-gold hover:text-gold/80"
            >
              Créer une publication
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post, index) => {
              const status = statusConfig[post.status] || statusConfig.DRAFT;
              const displayDate = post.publishedAt || post.scheduledAt;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-lg bg-gold/5 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {platformIcons[post.platform] || <Share2 className="h-4 w-4 text-ivory/60" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-ivory">
                          {post.content.substring(0, 60)}
                          {post.content.length > 60 ? "..." : ""}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-ivory/50">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${status.color}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                          {displayDate && (
                            <span>
                              {new Date(displayDate).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {post.status === "PUBLISHED" && (
                      <div className="flex items-center gap-3 shrink-0 text-xs text-ivory/60">
                        <div className="flex items-center gap-1" title="Impressions">
                          <Eye className="h-3 w-3" />
                          <span>{post.impressions}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Engagements">
                          <Heart className="h-3 w-3" />
                          <span>{post.engagements}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-3">
        <Link
          href="/admin/social/posts/new"
          className="flex-1 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-center text-sm font-medium text-gold hover:bg-gold/20 transition"
        >
          Nouvelle publication
        </Link>
        <Link
          href="/admin/social/calendar"
          className="flex-1 rounded-lg border border-gold/30 px-4 py-2 text-center text-sm font-medium text-gold hover:bg-gold/10 transition"
        >
          Calendrier
        </Link>
      </div>
    </motion.div>
  );
}
