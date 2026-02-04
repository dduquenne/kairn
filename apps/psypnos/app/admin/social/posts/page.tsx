"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import {
  Plus,
  Sparkles,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { SocialPlatform, PostStatus } from "@/lib/social/types";
import { useToast } from "@/lib/toast-context";

import { SocialPlatformIcon } from "../accounts/_components/SocialPlatformIcon";

// ===========================================
// Types
// ===========================================

interface SocialPostSummary {
  id: string;
  platform: SocialPlatform;
  content: string;
  status: PostStatus;
  blogTitle: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  platformUrl: string | null;
  createdAt: string;
}

// ===========================================
// Helpers
// ===========================================

function getStatusBadge(status: PostStatus) {
  switch (status) {
    case "PUBLISHED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
          <CheckCircle className="h-3 w-3" />
          Publié
        </span>
      );
    case "SCHEDULED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
          <Calendar className="h-3 w-3" />
          Programmé
        </span>
      );
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
          <Clock className="h-3 w-3" />
          Brouillon
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
          <AlertCircle className="h-3 w-3" />
          Échec
        </span>
      );
    case "PUBLISHING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-400">
          <Clock className="h-3 w-3 animate-spin" />
          Publication...
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-400">
          {status}
        </span>
      );
  }
}

// ===========================================
// Main Component
// ===========================================

export default function SocialPostsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [posts, setPosts] = useState<SocialPostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/social/posts?t=" + Date.now(), {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        // API might not exist yet, show empty state
        setPosts([]);
      }
    } catch {
      // API might not exist yet
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold">
              Réseaux sociaux
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ivory">
              Publications
            </h1>
          </div>

          <button
            onClick={() => router.push("/admin/social/posts/new")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold/20 px-6 py-3 font-medium text-gold transition hover:bg-gold/30"
          >
            <Sparkles className="h-5 w-5" />
            Générer du contenu
          </button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4">
          <p className="text-sm text-ivory/60">Total</p>
          <p className="mt-1 text-2xl font-semibold text-ivory">
            {posts.length}
          </p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4">
          <p className="text-sm text-ivory/60">Publiés</p>
          <p className="mt-1 text-2xl font-semibold text-green-400">
            {posts.filter((p) => p.status === "PUBLISHED").length}
          </p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4">
          <p className="text-sm text-ivory/60">Programmés</p>
          <p className="mt-1 text-2xl font-semibold text-blue-400">
            {posts.filter((p) => p.status === "SCHEDULED").length}
          </p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4">
          <p className="text-sm text-ivory/60">Brouillons</p>
          <p className="mt-1 text-2xl font-semibold text-amber-400">
            {posts.filter((p) => p.status === "DRAFT").length}
          </p>
        </div>
      </motion.div>

      {/* Posts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm"
      >
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded bg-gold/10"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <Sparkles className="mx-auto h-16 w-16 text-gold/30" />
            <p className="mt-4 text-lg text-ivory/50">
              Aucune publication pour le moment
            </p>
            <p className="mt-2 text-sm text-ivory/30">
              Générez votre premier contenu pour les réseaux sociaux à partir
              de vos articles de blog
            </p>
            <button
              onClick={() => router.push("/admin/social/posts/new")}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold/20 px-6 py-3 font-medium text-gold transition hover:bg-gold/30"
            >
              <Plus className="h-5 w-5" />
              Créer ma première publication
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4 rounded-lg border border-gold/10 bg-night/30 p-4 transition hover:border-gold/20"
              >
                <SocialPlatformIcon
                  platform={post.platform}
                  className="h-10 w-10 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {post.blogTitle && (
                        <p className="text-sm text-ivory/60">
                          Article: {post.blogTitle}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-2 text-ivory">
                        {post.content}
                      </p>
                    </div>
                    {getStatusBadge(post.status)}
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm text-ivory/50">
                    <span className="capitalize">
                      {post.platform.toLowerCase()}
                    </span>
                    <span>•</span>
                    <span>
                      {post.scheduledAt
                        ? `Prévu le ${new Date(post.scheduledAt).toLocaleDateString("fr-FR")}`
                        : post.publishedAt
                          ? `Publié le ${new Date(post.publishedAt).toLocaleDateString("fr-FR")}`
                          : `Créé le ${new Date(post.createdAt).toLocaleDateString("fr-FR")}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {post.status === "PUBLISHED" && post.platformUrl && (
                    <a
                      href={post.platformUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-2 text-sm font-medium text-green-400 transition hover:bg-green-500/20"
                      title={`Voir sur ${post.platform.toLowerCase()}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Voir
                    </a>
                  )}
                  <button
                    className="rounded-lg p-2 text-ivory/50 transition hover:bg-gold/10 hover:text-ivory"
                    title="Voir les détails"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
