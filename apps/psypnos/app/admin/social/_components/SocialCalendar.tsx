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
  X,
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
const DAYS_OF_WEEK_MOBILE = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
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
  isSelectedDay,
}: {
  day: CalendarDay;
  onPostSelect: (post: CalendarPost) => void;
  onDateSelect: (date: Date) => void;
  selectedPostId?: string | null;
  isSelectedDay?: boolean;
}) {
  const hasMultiplePosts = day.posts.length > 2;
  const displayPosts = day.posts.slice(0, 2);

  return (
    <button
      onClick={() => onDateSelect(day.date)}
      className={`
        min-h-[60px] sm:min-h-[100px] rounded-lg border p-1 sm:p-2 text-left transition-all
        ${day.isCurrentMonth ? 'border-gold/10 bg-night/20' : 'bg-night/5 border-transparent'}
        ${day.isToday ? 'border-gold/40 ring-gold/30 ring-1' : ''}
        ${isSelectedDay ? 'border-gold ring-gold/50 ring-2 bg-gold/10' : ''}
        ${day.posts.length > 0 ? 'hover:border-gold/30 cursor-pointer' : 'hover:bg-night/30 cursor-pointer'}
      `}
    >
      <div className="flex items-start justify-between">
        <span
          className={`
            inline-flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm
            ${day.isToday ? 'bg-gold text-night font-bold' : ''}
            ${day.isCurrentMonth ? 'text-ivory' : 'text-ivory/30'}
          `}
        >
          {day.date.getDate()}
        </span>
        {day.posts.length > 0 && (
          <span className="text-gold/70 text-[10px] sm:text-xs font-medium">{day.posts.length}</span>
        )}
      </div>

      {/* Desktop: Show post indicators */}
      <div className="hidden sm:block">
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
              <span className="text-ivory/50 text-xs">+{day.posts.length - 2} autres</span>
            )}
          </div>
        )}
      </div>

      {/* Mobile: Show colored dots */}
      {day.posts.length > 0 && (
        <div className="sm:hidden flex flex-wrap gap-0.5 mt-1 justify-center">
          {day.posts.slice(0, 4).map(post => {
            const statusConfig = getStatusConfig(post.status);
            const bgClass = statusConfig.color.split(' ')[0];
            return (
              <span
                key={post.id}
                className={`w-1.5 h-1.5 rounded-full ${bgClass}`}
                style={{ borderLeft: `2px solid ${PLATFORM_COLORS[post.platform]}` }}
              />
            );
          })}
          {day.posts.length > 4 && (
            <span className="text-ivory/50 text-[8px]">+</span>
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
  isMobileView = false,
}: {
  day: CalendarDay;
  onPostSelect: (post: CalendarPost) => void;
  onDateSelect: (date: Date) => void;
  selectedPostId?: string | null;
  isMobileView?: boolean;
}) {
  if (isMobileView) {
    // Mobile: Horizontal card layout
    return (
      <div
        className={`
          border-gold/10 border-b p-3 last:border-b-0
          ${day.isToday ? 'bg-gold/5' : ''}
        `}
      >
        <button
          onClick={() => onDateSelect(day.date)}
          className={`
            mb-2 flex items-center gap-3 rounded-lg p-2 transition w-full text-left
            ${day.isToday ? 'bg-gold text-night font-bold' : 'text-ivory hover:bg-gold/10'}
          `}
        >
          <div className={`
            text-lg font-semibold min-w-[2rem] text-center
            ${day.isToday ? '' : 'text-gold'}
          `}>
            {day.date.getDate()}
          </div>
          <div className={`text-sm ${day.isToday ? 'opacity-80' : 'text-ivory/70'}`}>
            {DAYS_OF_WEEK_FULL[day.date.getDay() === 0 ? 6 : day.date.getDay() - 1]}
          </div>
          {day.posts.length > 0 && (
            <span className={`ml-auto text-xs ${day.isToday ? 'opacity-80' : 'text-gold/70'}`}>
              {day.posts.length} post{day.posts.length > 1 ? 's' : ''}
            </span>
          )}
        </button>

        {day.posts.length > 0 && (
          <div className="space-y-2 pl-2">
            {day.posts.map(post => {
              const statusConfig = getStatusConfig(post.status);
              const time = post.scheduledAt || post.publishedAt;

              return (
                <button
                  key={post.id}
                  onClick={() => onPostSelect(post)}
                  className={`
                    w-full rounded-lg border p-3 text-left transition-all
                    ${statusConfig.color}
                    ${selectedPostId === post.id ? 'ring-gold ring-2' : ''}
                    active:scale-[0.98]
                  `}
                  style={{ borderLeft: `3px solid ${PLATFORM_COLORS[post.platform]}` }}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <SocialPlatformIcon platform={post.platform} className="h-4 w-4" />
                    <span className="text-xs font-medium capitalize">
                      {post.platform.toLowerCase()}
                    </span>
                    <span className="text-xs opacity-70 ml-auto">
                      {time
                        ? new Date(time).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '--:--'}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm opacity-90">{post.content}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Column layout
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

  // Get only hours that have posts to reduce empty space on mobile
  const hoursWithPosts = hours.filter(hour => postsWithHour.some(p => p.hour === hour));
  const displayHours = hoursWithPosts.length > 0 ? hours : hours.filter(h => h >= 8 && h <= 20);

  return (
    <div className="relative">
      {displayHours.map(hour => {
        const hourPosts = postsWithHour.filter(p => p.hour === hour);
        const hasContent = hourPosts.length > 0;

        return (
          <div
            key={hour}
            className={`
              border-gold/10 flex border-b
              ${hasContent ? 'min-h-[80px]' : 'min-h-[40px] sm:min-h-[60px]'}
            `}
          >
            <div className="text-ivory/50 border-gold/10 w-12 sm:w-16 flex-shrink-0 border-r p-1 sm:p-2 text-xs sm:text-sm">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex flex-1 flex-col sm:flex-row sm:flex-wrap gap-2 p-2">
              {hourPosts.map(post => {
                const statusConfig = getStatusConfig(post.status);

                return (
                  <button
                    key={post.id}
                    onClick={() => onPostSelect(post)}
                    className={`
                      w-full sm:min-w-[200px] sm:max-w-md sm:flex-1 rounded-lg border p-2 sm:p-3 text-left transition-all
                      ${statusConfig.color}
                      ${selectedPostId === post.id ? 'ring-gold ring-2' : ''}
                      active:scale-[0.98] sm:hover:scale-[1.02]
                    `}
                    style={{ borderLeft: `4px solid ${PLATFORM_COLORS[post.platform]}` }}
                  >
                    <div className="mb-1 sm:mb-2 flex items-center gap-2">
                      <SocialPlatformIcon platform={post.platform} className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm font-medium capitalize">
                        {post.platform.toLowerCase()}
                      </span>
                      <span className="ml-auto text-[10px] sm:text-xs opacity-70">{statusConfig.label}</span>
                    </div>
                    {post.blogTitle && (
                      <p className="mb-1 text-[10px] sm:text-xs opacity-70 truncate">Article: {post.blogTitle}</p>
                    )}
                    <p className="line-clamp-2 text-xs sm:text-sm">{post.content}</p>
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
// Selected Day Posts Component (for month view)
// ===========================================

function SelectedDayPosts({
  date,
  posts,
  onPostSelect,
  onClose,
  selectedPostId,
}: {
  date: Date;
  posts: CalendarPost[];
  onPostSelect: (post: CalendarPost) => void;
  onClose: () => void;
  selectedPostId?: string | null;
}) {
  const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const formattedDate = `${DAYS_OF_WEEK_FULL[dayOfWeek]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-gold/20 from-night/60 to-night/40 overflow-hidden rounded-lg border bg-gradient-to-br"
    >
      <div className="border-gold/10 flex items-center justify-between border-b p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-gold h-4 w-4 sm:h-5 sm:w-5" />
          <h3 className="text-ivory text-sm sm:text-base font-medium">{formattedDate}</h3>
          <span className="text-gold/70 text-xs sm:text-sm">
            ({posts.length} post{posts.length > 1 ? 's' : ''})
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-ivory/50 hover:bg-gold/10 hover:text-ivory rounded-lg p-1.5 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 sm:p-4">
        {posts.length === 0 ? (
          <p className="text-ivory/50 py-4 text-center text-sm">Aucun post pour cette journée</p>
        ) : (
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => {
              const statusConfig = getStatusConfig(post.status);
              const StatusIcon = statusConfig.icon;
              const time = post.scheduledAt || post.publishedAt;

              return (
                <button
                  key={post.id}
                  onClick={() => onPostSelect(post)}
                  className={`
                    w-full rounded-lg border p-3 text-left transition-all
                    ${statusConfig.color}
                    ${selectedPostId === post.id ? 'ring-gold ring-2' : ''}
                    active:scale-[0.98] sm:hover:scale-[1.02]
                  `}
                  style={{ borderLeft: `4px solid ${PLATFORM_COLORS[post.platform]}` }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <SocialPlatformIcon platform={post.platform} className="h-4 w-4" />
                    <span className="text-xs font-medium capitalize">
                      {post.platform.toLowerCase()}
                    </span>
                    <StatusIcon className="h-3 w-3 ml-auto" />
                  </div>
                  <div className="mb-1 flex items-center gap-2 text-[10px] sm:text-xs opacity-70">
                    <Clock className="h-3 w-3" />
                    {time
                      ? new Date(time).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--'}
                    <span className="ml-auto">{statusConfig.label}</span>
                  </div>
                  {post.blogTitle && (
                    <p className="mb-1 text-[10px] sm:text-xs opacity-60 truncate">
                      {post.blogTitle}
                    </p>
                  )}
                  <p className="line-clamp-2 text-xs sm:text-sm">{post.content}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(
    () => generateCalendarDays(year, month, posts),
    [year, month, posts]
  );

  const weekDays = useMemo(() => getWeekDays(currentDate, posts), [currentDate, posts]);

  const dayPosts = useMemo(() => getPostsForDate(posts, currentDate), [currentDate, posts]);

  // Posts for the selected day in month view
  const selectedDayPosts = useMemo(() => {
    if (!selectedDay) return [];
    return getPostsForDate(posts, selectedDay);
  }, [selectedDay, posts]);

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      setSelectedDay(null); // Clear selection when navigating
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
    setSelectedDay(null);
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    if (view === 'month') {
      // In month view, toggle the selected day to show posts below
      setSelectedDay(prev => {
        if (prev && prev.getTime() === date.getTime()) {
          return null; // Deselect if clicking the same day
        }
        return date;
      });
    }
    onDateSelect(date);
  }, [view, onDateSelect]);

  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
    setSelectedDay(null); // Clear selection when changing views
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

  // Shorter title for mobile
  const getMobileTitle = () => {
    if (view === 'month') {
      return `${MONTHS[month].substring(0, 3)}. ${year}`;
    } else if (view === 'week') {
      const weekStart = weekDays[0]?.date;
      const weekEnd = weekDays[6]?.date;
      if (weekStart && weekEnd) {
        return `${weekStart.getDate()}-${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()].substring(0, 3)}.`;
      }
    } else {
      return `${currentDate.getDate()} ${MONTHS[month].substring(0, 3)}.`;
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

  // Check if a day is the selected day
  const isSelectedDay = useCallback((date: Date) => {
    if (!selectedDay) return false;
    return (
      date.getDate() === selectedDay.getDate() &&
      date.getMonth() === selectedDay.getMonth() &&
      date.getFullYear() === selectedDay.getFullYear()
    );
  }, [selectedDay]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Top row: Navigation + View Switcher */}
        <div className="flex items-center justify-between gap-2">
          {/* Navigation */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => navigate('prev')}
              className="text-ivory/60 hover:bg-gold/10 hover:text-ivory rounded-lg p-1.5 sm:p-2 transition"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <CalendarIcon className="text-gold h-4 w-4 sm:h-5 sm:w-5" />
              {/* Mobile title */}
              <span className="text-ivory text-sm font-semibold sm:hidden">{getMobileTitle()}</span>
              {/* Desktop title */}
              <span className="text-ivory text-lg font-semibold hidden sm:inline">{getTitle()}</span>
            </div>

            <button
              onClick={() => navigate('next')}
              className="text-ivory/60 hover:bg-gold/10 hover:text-ivory rounded-lg p-1.5 sm:p-2 transition"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* View Switcher & Today */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={goToToday}
              className="border-gold/20 bg-night/30 text-ivory/70 hover:border-gold/40 hover:text-ivory rounded-lg border px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm transition"
            >
              <span className="hidden sm:inline">Aujourd&apos;hui</span>
              <span className="sm:hidden">Ajd</span>
            </button>

            {/* Desktop: Full view switcher */}
            <div className="border-gold/20 bg-night/30 hidden sm:flex rounded-lg border p-1">
              <button
                onClick={() => handleViewChange('month')}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${
                  view === 'month' ? 'bg-gold/20 text-gold' : 'text-ivory/60 hover:text-ivory'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Mois
              </button>
              <button
                onClick={() => handleViewChange('week')}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${
                  view === 'week' ? 'bg-gold/20 text-gold' : 'text-ivory/60 hover:text-ivory'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Semaine
              </button>
              <button
                onClick={() => handleViewChange('day')}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${
                  view === 'day' ? 'bg-gold/20 text-gold' : 'text-ivory/60 hover:text-ivory'
                }`}
              >
                <List className="h-4 w-4" />
                Jour
              </button>
            </div>

            {/* Mobile: Compact icon-only view switcher */}
            <div className="border-gold/20 bg-night/30 flex sm:hidden rounded-lg border p-0.5">
              <button
                onClick={() => handleViewChange('month')}
                className={`rounded p-1.5 transition ${
                  view === 'month' ? 'bg-gold/20 text-gold' : 'text-ivory/60'
                }`}
                title="Vue mois"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewChange('week')}
                className={`rounded p-1.5 transition ${
                  view === 'week' ? 'bg-gold/20 text-gold' : 'text-ivory/60'
                }`}
                title="Vue semaine"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewChange('day')}
                className={`rounded p-1.5 transition ${
                  view === 'day' ? 'bg-gold/20 text-gold' : 'text-ivory/60'
                }`}
                title="Vue jour"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Stats - More compact on mobile */}
      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="bg-ivory/40 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full" />
          <span className="text-ivory/60">{stats.total}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-400" />
          <span className="text-ivory/60">{stats.published} <span className="hidden sm:inline">publiés</span></span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-400" />
          <span className="text-ivory/60">{stats.scheduled} <span className="hidden sm:inline">programmés</span></span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-400" />
          <span className="text-ivory/60">{stats.draft} <span className="hidden sm:inline">brouillons</span></span>
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
              className="p-2 sm:p-4"
            >
              {/* Days header - Mobile: Single letter, Desktop: Abbreviated */}
              <div className="mb-1 sm:mb-2 grid grid-cols-7 gap-0.5 sm:gap-1">
                {DAYS_OF_WEEK.map((day, index) => (
                  <div key={day} className="text-ivory/60 py-1 sm:py-2 text-center text-[10px] sm:text-sm font-medium">
                    <span className="sm:hidden">{DAYS_OF_WEEK_MOBILE[index]}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {calendarDays.map((day, index) => (
                  <DayCell
                    key={index}
                    day={day}
                    onPostSelect={onPostSelect}
                    onDateSelect={handleDateSelect}
                    selectedPostId={selectedPostId}
                    isSelectedDay={isSelectedDay(day.date)}
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
            >
              {/* Desktop: Horizontal columns */}
              <div className="hidden sm:flex">
                {weekDays.map((day, index) => (
                  <WeekViewCell
                    key={index}
                    day={day}
                    onPostSelect={onPostSelect}
                    onDateSelect={handleDateSelect}
                    selectedPostId={selectedPostId}
                  />
                ))}
              </div>
              {/* Mobile: Vertical list */}
              <div className="sm:hidden max-h-[500px] overflow-y-auto">
                {weekDays.map((day, index) => (
                  <WeekViewCell
                    key={index}
                    day={day}
                    onPostSelect={onPostSelect}
                    onDateSelect={handleDateSelect}
                    selectedPostId={selectedPostId}
                    isMobileView={true}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {view === 'day' && (
            <motion.div
              key="day"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-h-[400px] sm:max-h-[600px] overflow-y-auto"
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

      {/* Selected Day Posts (Month view only) */}
      <AnimatePresence>
        {view === 'month' && selectedDay && (
          <SelectedDayPosts
            date={selectedDay}
            posts={selectedDayPosts}
            onPostSelect={onPostSelect}
            onClose={() => setSelectedDay(null)}
            selectedPostId={selectedPostId}
          />
        )}
      </AnimatePresence>

      {/* Legend - More compact on mobile */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
        <span className="text-ivory/50 hidden sm:inline">Légende :</span>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500/50" />
          <span className="text-ivory/70">Publié</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-blue-500/50" />
          <span className="text-ivory/70">Programmé</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-amber-500/50" />
          <span className="text-ivory/70">Brouillon</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500/50" />
          <span className="text-ivory/70">Échec</span>
        </div>
      </div>
    </div>
  );
}
