"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Edit2,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { SocialPlatformIcon } from "../accounts/_components/SocialPlatformIcon";
import type { SocialPlatform, PostStatus } from "@/lib/social/types";

// ===========================================
// Types
// ===========================================

interface SocialPostCalendar {
  id: string;
  platform: SocialPlatform;
  content: string;
  status: PostStatus;
  blogTitle: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: SocialPostCalendar[];
}

// ===========================================
// Helpers
// ===========================================

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function getStatusColor(status: PostStatus): string {
  switch (status) {
    case "PUBLISHED":
      return "bg-green-500/20 border-green-500/50 text-green-400";
    case "SCHEDULED":
      return "bg-blue-500/20 border-blue-500/50 text-blue-400";
    case "DRAFT":
      return "bg-amber-500/20 border-amber-500/50 text-amber-400";
    case "FAILED":
      return "bg-red-500/20 border-red-500/50 text-red-400";
    case "PUBLISHING":
      return "bg-purple-500/20 border-purple-500/50 text-purple-400";
    default:
      return "bg-gray-500/20 border-gray-500/50 text-gray-400";
  }
}

function getStatusIcon(status: PostStatus) {
  switch (status) {
    case "PUBLISHED":
      return <CheckCircle className="h-3 w-3" />;
    case "SCHEDULED":
      return <Clock className="h-3 w-3" />;
    case "FAILED":
      return <AlertCircle className="h-3 w-3" />;
    case "PUBLISHING":
      return <Send className="h-3 w-3 animate-pulse" />;
    default:
      return null;
  }
}

function generateCalendarDays(
  year: number,
  month: number,
  posts: SocialPostCalendar[]
): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const days: CalendarDay[] = [];

  // Add days from previous month
  const prevMonth = new Date(year, month, 0);
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(prevMonth);
    date.setDate(prevMonth.getDate() - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      posts: [],
    });
  }

  // Add days of current month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(year, month, day);
    const dayPosts = posts.filter((post) => {
      const postDate = post.scheduledAt || post.publishedAt;
      if (!postDate) return false;
      const d = new Date(postDate);
      return (
        d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
      );
    });

    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      posts: dayPosts,
    });
  }

  // Add days from next month to complete the grid (6 rows)
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      posts: [],
    });
  }

  return days;
}

// ===========================================
// Main Component
// ===========================================

export default function SocialCalendarPage() {
  const { addToast } = useToast();
  const [posts, setPosts] = useState<SocialPostCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  // Edit modal state
  const [editingPost, setEditingPost] = useState<SocialPostCalendar | null>(null);
  const [editScheduleDate, setEditScheduleDate] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirmation state
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load posts for current month + padding
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month + 2, 0);

      const params = new URLSearchParams({
        scheduledFrom: startDate.toISOString(),
        scheduledTo: endDate.toISOString(),
      });

      const response = await fetch(`/api/social/posts?${params}&t=${Date.now()}`, {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        setPosts([]);
      }
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const calendarDays = useMemo(
    () => generateCalendarDays(year, month, posts),
    [year, month, posts]
  );

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const handlePublishNow = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/publish`, {
        method: "POST",
      });

      if (response.ok) {
        addToast({
          title: "Publication réussie",
          variant: "success",
        });
        loadPosts();
      } else {
        const data = await response.json();
        addToast({
          title: "Erreur de publication",
          description: data.error || "Une erreur est survenue",
          variant: "error",
        });
      }
    } catch {
      addToast({
        title: "Erreur",
        description: "Impossible de publier le post",
        variant: "error",
      });
    }
  };

  // Helper to format date for datetime-local input
  const formatDateTimeLocal = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Open edit modal
  const handleOpenEdit = (post: SocialPostCalendar) => {
    setEditingPost(post);
    if (post.scheduledAt) {
      setEditScheduleDate(formatDateTimeLocal(new Date(post.scheduledAt)));
    } else {
      setEditScheduleDate("");
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingPost) return;

    setIsSavingEdit(true);
    try {
      const scheduledAt = editScheduleDate ? new Date(editScheduleDate).toISOString() : null;
      const status = scheduledAt ? "SCHEDULED" : "DRAFT";

      const response = await fetch(`/api/social/posts/${editingPost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt, status }),
      });

      if (response.ok) {
        addToast({
          title: "Post modifié",
          description: scheduledAt
            ? `Programmé pour le ${new Date(scheduledAt).toLocaleDateString("fr-FR")}`
            : "Converti en brouillon",
          variant: "success",
        });
        setEditingPost(null);
        loadPosts();
      } else {
        const data = await response.json();
        addToast({
          title: "Erreur de modification",
          description: data.error || "Une erreur est survenue",
          variant: "error",
        });
      }
    } catch {
      addToast({
        title: "Erreur",
        description: "Impossible de modifier le post",
        variant: "error",
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete post
  const handleDelete = async () => {
    if (!deletingPostId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/social/posts/${deletingPostId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        addToast({
          title: "Post supprimé",
          variant: "success",
        });
        setDeletingPostId(null);
        setSelectedDay(null);
        loadPosts();
      } else {
        const data = await response.json();
        addToast({
          title: "Erreur de suppression",
          description: data.error || "Une erreur est survenue",
          variant: "error",
        });
      }
    } catch {
      addToast({
        title: "Erreur",
        description: "Impossible de supprimer le post",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
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
              Calendrier de publication
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="rounded-lg border border-gold/20 bg-night/30 px-4 py-2 text-sm text-ivory/70 transition hover:border-gold/40 hover:text-ivory"
            >
              Aujourd&apos;hui
            </button>
            <a
              href="/admin/social/posts/new"
              className="inline-flex items-center gap-2 rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30"
            >
              <Plus className="h-4 w-4" />
              Nouveau post
            </a>
          </div>
        </div>
      </motion.div>

      {/* Calendar Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-between rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4"
      >
        <button
          onClick={goToPreviousMonth}
          className="rounded-lg p-2 text-ivory/60 transition hover:bg-gold/10 hover:text-ivory"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-gold" />
          <span className="text-lg font-semibold text-ivory">
            {MONTHS[month]} {year}
          </span>
        </div>

        <button
          onClick={goToNextMonth}
          className="rounded-lg p-2 text-ivory/60 transition hover:bg-gold/10 hover:text-ivory"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4"
      >
        {isLoading ? (
          <div className="h-96 animate-pulse rounded bg-gold/10" />
        ) : (
          <>
            {/* Days of week header */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-sm font-medium text-ivory/60"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDay(day.posts.length > 0 ? day : null)}
                  className={`
                    min-h-[100px] rounded-lg border p-2 text-left transition
                    ${
                      day.isCurrentMonth
                        ? "border-gold/10 bg-night/20"
                        : "border-transparent bg-night/10"
                    }
                    ${day.isToday ? "border-gold/40 ring-1 ring-gold/30" : ""}
                    ${day.posts.length > 0 ? "hover:border-gold/30 cursor-pointer" : "cursor-default"}
                    ${selectedDay?.date.getTime() === day.date.getTime() ? "border-gold/50 bg-gold/10" : ""}
                  `}
                >
                  <span
                    className={`
                      inline-flex h-7 w-7 items-center justify-center rounded-full text-sm
                      ${day.isToday ? "bg-gold text-night font-bold" : ""}
                      ${day.isCurrentMonth ? "text-ivory" : "text-ivory/30"}
                    `}
                  >
                    {day.date.getDate()}
                  </span>

                  {/* Posts indicators */}
                  {day.posts.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {day.posts.slice(0, 3).map((post) => (
                        <div
                          key={post.id}
                          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${getStatusColor(post.status)}`}
                        >
                          <SocialPlatformIcon
                            platform={post.platform}
                            className="h-3 w-3"
                          />
                          {getStatusIcon(post.status)}
                        </div>
                      ))}
                      {day.posts.length > 3 && (
                        <span className="text-xs text-ivory/50">
                          +{day.posts.length - 3} autres
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Selected Day Detail */}
      {selectedDay && selectedDay.posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ivory">
              {selectedDay.date.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-sm text-ivory/50 hover:text-ivory"
            >
              Fermer
            </button>
          </div>

          <div className="space-y-3">
            {selectedDay.posts.map((post) => (
              <div
                key={post.id}
                className={`rounded-lg border p-4 ${getStatusColor(post.status)}`}
              >
                <div className="flex items-start gap-3">
                  <SocialPlatformIcon
                    platform={post.platform}
                    className="h-8 w-8 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    {post.blogTitle && (
                      <p className="text-sm opacity-70">Article: {post.blogTitle}</p>
                    )}
                    <p className="mt-1 line-clamp-3 text-sm">{post.content}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                      <span className="capitalize">
                        {post.platform.toLowerCase()}
                      </span>
                      <span>•</span>
                      <span>
                        {post.scheduledAt
                          ? new Date(post.scheduledAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Non programmé"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {post.status === "SCHEDULED" && (
                      <button
                        onClick={() => handlePublishNow(post.id)}
                        className="rounded-lg bg-gold/20 px-3 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/30"
                      >
                        Publier
                      </button>
                    )}
                    {post.status !== "PUBLISHED" && post.status !== "PUBLISHING" && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(post)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-ivory/20 px-3 py-1.5 text-xs text-ivory/70 transition hover:border-ivory/40 hover:text-ivory"
                        >
                          <Edit2 className="h-3 w-3" />
                          Modifier
                        </button>
                        <button
                          onClick={() => setDeletingPostId(post.id)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setEditingPost(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl border border-gold/20 bg-gradient-to-br from-night to-night/95 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ivory">Modifier la programmation</h3>
                <button
                  onClick={() => setEditingPost(null)}
                  className="rounded-lg p-1 text-ivory/50 hover:bg-gold/10 hover:text-ivory"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-lg border border-gold/10 bg-night/30 p-3">
                <SocialPlatformIcon platform={editingPost.platform} className="h-8 w-8" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ivory">
                    {editingPost.platform.charAt(0) + editingPost.platform.slice(1).toLowerCase()}
                  </p>
                  <p className="truncate text-xs text-ivory/50">{editingPost.content.slice(0, 50)}...</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm text-ivory/70">Date et heure de publication</label>
                <input
                  type="datetime-local"
                  value={editScheduleDate}
                  onChange={(e) => setEditScheduleDate(e.target.value)}
                  min={formatDateTimeLocal(new Date())}
                  className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-3 text-ivory focus:border-gold focus:outline-none"
                />
                <p className="mt-2 text-xs text-ivory/50">
                  Laissez vide pour convertir en brouillon
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditingPost(null)}
                  className="flex-1 rounded-lg border border-gold/20 py-2 text-ivory/70 transition hover:border-gold/40 hover:text-ivory"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold/20 py-2 font-medium text-gold transition hover:bg-gold/30 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingPostId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setDeletingPostId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-xl border border-red-500/30 bg-gradient-to-br from-night to-night/95 p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-ivory">Supprimer ce post ?</h3>
              </div>

              <p className="mb-6 text-ivory/70">
                Cette action est irréversible. Le post sera définitivement supprimé.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingPostId(null)}
                  className="flex-1 rounded-lg border border-gold/20 py-2 text-ivory/70 transition hover:border-gold/40 hover:text-ivory"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/20 py-2 font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-wrap items-center gap-4 text-sm"
      >
        <span className="text-ivory/50">Légende :</span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-green-500/50" />
          <span className="text-ivory/70">Publié</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-blue-500/50" />
          <span className="text-ivory/70">Programmé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-500/50" />
          <span className="text-ivory/70">Brouillon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500/50" />
          <span className="text-ivory/70">Échec</span>
        </div>
      </motion.div>
    </div>
  );
}
