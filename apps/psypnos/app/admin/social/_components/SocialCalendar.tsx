'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
  LayoutGrid,
  List,
  CalendarDays,
} from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';

import type { SocialPlatform, PostStatus } from '@/lib/social/types';

import { SocialPlatformIcon } from '../accounts/_components/SocialPlatformIcon';

// ===========================================
// Types
// ===========================================

export interface CalendarPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  status: PostStatus;
  blogTitle: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  accountName?: string;
  hashtags?: string[];
  platformUrl?: string | null;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: CalendarPost[];
}

type CalendarView = 'month' | 'week' | 'day';

interface SocialCalendarProps {
  posts: CalendarPost[];
  onPostSelect: (post: CalendarPost) => void;
  onDateSelect: (date: Date) => void;
  onPublishNow: (postId: string) => void;
  onEditPost: (post: CalendarPost) => void;
  onDeletePost: (postId: string) => void;
  selectedPostId?: string | null;
}

// ===========================================
// Helpers
// ===========================================

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_OF_WEEK_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
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
        color: 'bg-green-500/20 border-green-500/40 text-green-400',
        icon: CheckCircle,
        label: 'Publié',
      };
    case 'SCHEDULED':
      return {
        color: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
        icon: Clock,
        label: 'Programmé',
      };
    case 'DRAFT':
      return {
        color: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
        icon: Edit2,
        label: 'Brouillon',
      };
    case 'FAILED':
      return {
        color: 'bg-red-500/20 border-red-500/40 text-red-400',
        icon: AlertCircle,
        label: 'Échec',
      };
    case 'PUBLISHING':
      return {
        color: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
        icon: Send,
        label: 'Publication...',
      };
    default:
      return {
        color: 'bg-gray-500/20 border-gray-500/40 text-gray-400',
        icon: Clock,
        label: status,
      };
  }
}

function generateCalendarDays(year: number, month: number, posts: CalendarPost[]): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const days: CalendarDay[] = [];

  // Previous month days
  const prevMonth = new Date(year, month, 0);
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(prevMonth);
    date.setDate(prevMonth.getDate() - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      posts: getPostsForDate(posts, date),
    });
  }

  // Current month days
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(year, month, day);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      posts: getPostsForDate(posts, date),
    });
  }

  // Next month days
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      posts: getPostsForDate(posts, date),
    });
  }

  return days;
}

function getPostsForDate(posts: CalendarPost[], date: Date): CalendarPost[] {
  return posts.filter(post => {
    const postDate = post.scheduledAt || post.publishedAt;
    if (!postDate) return false;
    const d = new Date(postDate);
    return (
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
    );
  });
}

function getWeekDays(date: Date, posts: CalendarPost[]): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      date: d,
      isCurrentMonth: d.getMonth() === date.getMonth(),
      isToday: d.getTime() === today.getTime(),
      posts: getPostsForDate(posts, d),
    });
  }
  return days;
}

function getHoursOfDay(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

// ===========================================
// Sub-components
// ===========================================

function PostIndicator({
  post,
  onClick,
  isSelected,
}: {
  post: CalendarPost;
  onClick: () => void;
  isSelected: boolean;
}) {
  const statusConfig = getStatusConfig(post.status);
  const StatusIcon = statusConfig.icon;

  return (
    <button
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        group flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-all
        ${statusConfig.color}
        ${isSelected ? 'ring-gold ring-2' : ''}
        hover:scale-105 hover:shadow-md
      `}
      style={{ borderLeft: `3px solid ${PLATFORM_COLORS[post.platform]}` }}
    >
      <SocialPlatformIcon platform={post.platform} className="h-3 w-3" />
      <StatusIcon className="h-2.5 w-2.5" />
    </button>
  );
}

function DayCell({
  day,
  onPostSelect,
  onDateSelect,
  selectedPostId,
}: {
  day: CalendarDay;
  onPostSelect: (post: CalendarPost) => void;
  onDateSelect: (date: Date) => void;
  selectedPostId?: string | null;
}) {
  const hasMultiplePosts = day.posts.length > 3;
  const displayPosts = day.posts.slice(0, 3);

  return (
    <button
      onClick={() => onDateSelect(day.date)}
      className={`
        min-h-[100px] rounded-lg border p-2 text-left transition-all
        ${day.isCurrentMonth ? 'border-gold/10 bg-night/20' : 'bg-night/5 border-transparent'}
        ${day.isToday ? 'border-gold/40 ring-gold/30 ring-1' : ''}
        ${day.posts.length > 0 ? 'hover:border-gold/30 cursor-pointer' : 'hover:bg-night/30 cursor-default'}
      `}
    >
      <div className="flex items-start justify-between">
        <span
          className={`
            inline-flex h-7 w-7 items-center justify-center rounded-full text-sm
            ${day.isToday ? 'bg-gold text-night font-bold' : ''}
            ${day.isCurrentMonth ? 'text-ivory' : 'text-ivory/30'}
          `}
        >
          {day.date.getDate()}
        </span>
        {day.posts.length > 0 && <span className="text-gold/70 text-xs">{day.posts.length}</span>}
      </div>

      {displayPosts.length > 0 && (
        <div className="mt-1 space-y-1">
          {displayPosts.map(post => (
            <PostIndicator
              key={post.id}
              post={post}
              onClick={() => onPostSelect(post)}
              isSelected={selectedPostId === post.id}
            />
          ))}
          {hasMultiplePosts && (
            <span className="text-ivory/50 text-xs">+{day.posts.length - 3} autres</span>
          )}
        </div>
      )}
    </button>
  );
}

function WeekViewCell({
  day,
  onPostSelect,
  onDateSelect,
  selectedPostId,
}: {
  day: CalendarDay;
  onPostSelect: (post: CalendarPost) => void;
  onDateSelect: (date: Date) => void;
  selectedPostId?: string | null;
}) {
  return (
    <div
      className={`
        border-gold/10 min-h-[400px] flex-1 border-r p-2 last:border-r-0
        ${day.isToday ? 'bg-gold/5' : ''}
      `}
    >
      <button
        onClick={() => onDateSelect(day.date)}
        className={`
          mb-2 w-full rounded-lg p-2 text-center transition
          ${day.isToday ? 'bg-gold text-night font-bold' : 'text-ivory hover:bg-gold/10'}
        `}
      >
        <div className="text-xs opacity-70">
          {DAYS_OF_WEEK[day.date.getDay() === 0 ? 6 : day.date.getDay() - 1]}
        </div>
        <div className="text-lg font-semibold">{day.date.getDate()}</div>
      </button>

      <div className="space-y-2">
        {day.posts.map(post => {
          const statusConfig = getStatusConfig(post.status);
          const time = post.scheduledAt || post.publishedAt;

          return (
            <button
              key={post.id}
              onClick={() => onPostSelect(post)}
              className={`
                w-full rounded-lg border p-2 text-left transition-all
                ${statusConfig.color}
                ${selectedPostId === post.id ? 'ring-gold ring-2' : ''}
                hover:scale-[1.02]
              `}
              style={{ borderLeft: `3px solid ${PLATFORM_COLORS[post.platform]}` }}
            >
              <div className="mb-1 flex items-center gap-2">
                <SocialPlatformIcon platform={post.platform} className="h-4 w-4" />
                <span className="text-xs opacity-70">
                  {time
                    ? new Date(time).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--:--'}
                </span>
              </div>
              <p className="line-clamp-2 text-xs opacity-90">{post.content}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayViewTimeline({
  date,
  posts,
  onPostSelect,
  selectedPostId,
}: {
  date: Date;
  posts: CalendarPost[];
  onPostSelect: (post: CalendarPost) => void;
  selectedPostId?: string | null;
}) {
  const hours = getHoursOfDay();
  const postsWithHour = posts.map(post => {
    const time = post.scheduledAt || post.publishedAt;
    return {
      ...post,
      hour: time ? new Date(time).getHours() : 9,
    };
  });

  return (
    <div className="relative">
      {hours.map(hour => {
        const hourPosts = postsWithHour.filter(p => p.hour === hour);

        return (
          <div key={hour} className="border-gold/10 flex min-h-[60px] border-b">
            <div className="text-ivory/50 border-gold/10 w-16 flex-shrink-0 border-r p-2 text-sm">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex flex-1 flex-wrap gap-2 p-2">
              {hourPosts.map(post => {
                const statusConfig = getStatusConfig(post.status);

                return (
                  <button
                    key={post.id}
                    onClick={() => onPostSelect(post)}
                    className={`
                      min-w-[200px] max-w-md flex-1 rounded-lg border p-3 text-left transition-all
                      ${statusConfig.color}
                      ${selectedPostId === post.id ? 'ring-gold ring-2' : ''}
                      hover:scale-[1.02]
                    `}
                    style={{ borderLeft: `4px solid ${PLATFORM_COLORS[post.platform]}` }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <SocialPlatformIcon platform={post.platform} className="h-5 w-5" />
                      <span className="text-sm font-medium capitalize">
                        {post.platform.toLowerCase()}
                      </span>
                      <span className="ml-auto text-xs opacity-70">{statusConfig.label}</span>
                    </div>
                    {post.blogTitle && (
                      <p className="mb-1 text-xs opacity-70">Article: {post.blogTitle}</p>
                    )}
                    <p className="line-clamp-2 text-sm">{post.content}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===========================================
// Main Component
// ===========================================

export function SocialCalendar({
  posts,
  onPostSelect,
  onDateSelect,
  onPublishNow,
  onEditPost,
  onDeletePost,
  selectedPostId,
}: SocialCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [hoveredPost, setHoveredPost] = useState<CalendarPost | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(
    () => generateCalendarDays(year, month, posts),
    [year, month, posts]
  );

  const weekDays = useMemo(() => getWeekDays(currentDate, posts), [currentDate, posts]);

  const dayPosts = useMemo(() => getPostsForDate(posts, currentDate), [currentDate, posts]);

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        if (view === 'month') {
          newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
        } else if (view === 'week') {
          newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
        } else {
          newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
        }
        return newDate;
      });
    },
    [view]
  );

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const getTitle = () => {
    if (view === 'month') {
      return `${MONTHS[month]} ${year}`;
    } else if (view === 'week') {
      const weekStart = weekDays[0]?.date;
      const weekEnd = weekDays[6]?.date;
      if (weekStart && weekEnd) {
        return `${weekStart.getDate()} - ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${year}`;
      }
    } else {
      const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
      return `${DAYS_OF_WEEK_FULL[dayOfWeek]} ${currentDate.getDate()} ${MONTHS[month]} ${year}`;
    }
    return '';
  };

  // Stats for the current view
  const viewPosts =
    view === 'month'
      ? posts.filter(p => {
          const d = new Date(p.scheduledAt || p.publishedAt || '');
          return d.getMonth() === month && d.getFullYear() === year;
        })
      : view === 'week'
        ? weekDays.flatMap(d => d.posts)
        : dayPosts;

  const stats = {
    total: viewPosts.length,
    published: viewPosts.filter(p => p.status === 'PUBLISHED').length,
    scheduled: viewPosts.filter(p => p.status === 'SCHEDULED').length,
    draft: viewPosts.filter(p => p.status === 'DRAFT').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('prev')}
            className="text-ivory/60 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex min-w-[200px] items-center justify-center gap-2">
            <CalendarIcon className="text-gold h-5 w-5" />
            <span className="text-ivory text-lg font-semibold">{getTitle()}</span>
          </div>

          <button
            onClick={() => navigate('next')}
            className="text-ivory/60 hover:bg-gold/10 hover:text-ivory rounded-lg p-2 transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* View Switcher & Today */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="border-gold/20 bg-night/30 text-ivory/70 hover:border-gold/40 hover:text-ivory rounded-lg border px-3 py-1.5 text-sm transition"
          >
            Aujourd&apos;hui
          </button>

          <div className="border-gold/20 bg-night/30 flex rounded-lg border p-1">
            <button
              onClick={() => setView('month')}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${
                view === 'month' ? 'bg-gold/20 text-gold' : 'text-ivory/60 hover:text-ivory'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Mois
            </button>
            <button
              onClick={() => setView('week')}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${
                view === 'week' ? 'bg-gold/20 text-gold' : 'text-ivory/60 hover:text-ivory'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Semaine
            </button>
            <button
              onClick={() => setView('day')}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${
                view === 'day' ? 'bg-gold/20 text-gold' : 'text-ivory/60 hover:text-ivory'
              }`}
            >
              <List className="h-4 w-4" />
              Jour
            </button>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="bg-ivory/40 h-2 w-2 rounded-full" />
          <span className="text-ivory/60">{stats.total} total</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-ivory/60">{stats.published} publiés</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          <span className="text-ivory/60">{stats.scheduled} programmés</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-ivory/60">{stats.draft} brouillons</span>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="border-gold/20 from-night/60 to-night/40 overflow-hidden rounded-lg border bg-gradient-to-br">
        <AnimatePresence mode="wait">
          {view === 'month' && (
            <motion.div
              key="month"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4"
            >
              {/* Days header */}
              <div className="mb-2 grid grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="text-ivory/60 py-2 text-center text-sm font-medium">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <DayCell
                    key={index}
                    day={day}
                    onPostSelect={onPostSelect}
                    onDateSelect={onDateSelect}
                    selectedPostId={selectedPostId}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {view === 'week' && (
            <motion.div
              key="week"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex"
            >
              {weekDays.map((day, index) => (
                <WeekViewCell
                  key={index}
                  day={day}
                  onPostSelect={onPostSelect}
                  onDateSelect={onDateSelect}
                  selectedPostId={selectedPostId}
                />
              ))}
            </motion.div>
          )}

          {view === 'day' && (
            <motion.div
              key="day"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-h-[600px] overflow-y-auto"
            >
              <DayViewTimeline
                date={currentDate}
                posts={dayPosts}
                onPostSelect={onPostSelect}
                selectedPostId={selectedPostId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
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
      </div>
    </div>
  );
}
