'use client';

import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { SectionTitle, type SectionTitleProps } from '../section-title';

/**
 * Seminar data for the section
 */
export interface SeminarSectionItem {
  /** Unique identifier */
  id: string;
  /** Seminar title */
  title: string;
  /** Seminar description */
  description: string;
  /** Start date ISO string */
  startAt: string;
  /** End date ISO string */
  endAt: string;
  /** Seminar type label */
  seminarType?: string;
  /** Number of available places */
  capacity: number;
  /** Price in euros */
  price?: number;
  /** Deposit amount in euros */
  deposit?: number;
  /** Optional thumbnail image URL */
  thumbnail?: string | null;
}

/**
 * Props for the SeminarsSection component
 */
export interface SeminarsSectionProps {
  /** Seminar data to display */
  seminars: SeminarSectionItem[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Section title configuration */
  title?: SectionTitleProps;
  /** Empty state message */
  emptyMessage?: string;
  /** CTA label for registration button */
  ctaLabel?: string;
  /** CTA href for registration */
  ctaHref?: string;
  /** Custom CTA button component */
  ctaComponent?: (seminar: SeminarSectionItem) => ReactNode;
  /** Locale for date formatting */
  locale?: string;
  /** Timezone for date formatting */
  timezone?: string;
  /** "places" label */
  placesLabel?: string;
  /** Currency symbol for price display */
  currencySymbol?: string;
  /** Label for deposit (e.g. "acompte") */
  depositLabel?: string;
  /** Custom image component */
  imageComponent?: React.ComponentType<{
    src: string;
    alt: string;
    width: number;
    height: number;
    placeholder?: string;
    blurDataURL?: string;
    className?: string;
  }>;
  /** Analytics tracking section name */
  trackingName?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format seminar date range
 */
function formatSeminarDate(
  startAt: string,
  endAt: string,
  locale: string,
  timezone: string
): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  };

  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString(locale, options);
  }

  const startStr = start.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: timezone,
  });
  const endStr = end.toLocaleDateString(locale, options);
  return `${startStr} - ${endStr}`;
}

/**
 * Loading skeleton for seminars section
 */
function SeminarsSkeleton({ title }: { title: SectionTitleProps }) {
  return (
    <section className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionTitle {...title} />
        <div className="grid gap-10 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="border-ivory/10 bg-night/50 shadow-night/60 flex h-full animate-pulse flex-col overflow-hidden rounded-3xl border shadow-xl"
            >
              <div className="bg-night/80 aspect-[16/9] w-full" />
              <div className="flex flex-1 flex-col justify-between space-y-4 p-6">
                <div className="bg-ivory/10 h-6 w-3/4 rounded" />
                <div className="space-y-2">
                  <div className="bg-ivory/10 h-4 rounded" />
                  <div className="bg-ivory/10 h-4 w-5/6 rounded" />
                </div>
                <div className="bg-ivory/10 mx-auto h-10 w-1/2 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Seminars section displaying upcoming seminars in a responsive grid.
 * Supports custom image and CTA components for framework flexibility.
 *
 * @example
 * ```tsx
 * <SeminarsSection
 *   seminars={upcomingSeminars}
 *   title={{
 *     eyebrow: "Séminaires",
 *     title: "Nos prochains événements",
 *   }}
 *   ctaLabel="Réserver"
 *   ctaHref="/inscription"
 * />
 * ```
 */
export function SeminarsSection({
  seminars,
  isLoading = false,
  title = { eyebrow: 'Séminaires', title: 'Nos prochains événements' },
  emptyMessage = 'Aucun séminaire à venir pour le moment.',
  ctaLabel = 'Réserver ma place',
  ctaHref = '/inscription-seminaire',
  ctaComponent,
  locale = 'fr-FR',
  timezone = 'Europe/Paris',
  placesLabel = 'places',
  currencySymbol = '€',
  depositLabel = 'acompte',
  imageComponent: ImageComp,
  trackingName = 'Séminaires',
  className,
}: SeminarsSectionProps) {
  if (isLoading) {
    return <SeminarsSkeleton title={title} />;
  }

  return (
    <section
      id="seminaires"
      className={cn('bg-night/60 px-6 py-20 sm:px-10 lg:px-16', className)}
      data-track-section={trackingName.toLowerCase().replace(/\s+/g, '-')}
      data-track-section-name={trackingName}
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionTitle {...title} />
        <div className="grid gap-10 md:grid-cols-3">
          {seminars.length > 0 ? (
            seminars.map(seminar => (
              <article
                key={seminar.id}
                className="border-ivory/10 bg-night/50 shadow-night/60 group flex h-full flex-col overflow-hidden rounded-3xl border shadow-xl"
              >
                <div className="from-night/80 to-night/40 relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br">
                  {seminar.thumbnail && ImageComp ? (
                    <ImageComp
                      src={seminar.thumbnail}
                      alt={seminar.title}
                      width={640}
                      height={360}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : seminar.thumbnail ? (
                    <img
                      src={seminar.thumbnail}
                      alt={seminar.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="text-ivory/10 h-16 w-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </div>
                  )}
                  {seminar.seminarType && (
                    <span className="bg-gold/90 text-night absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                      {seminar.seminarType}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="text-ivory text-xl font-semibold">{seminar.title}</h3>
                    <p className="text-ivory/70 mt-3 line-clamp-3 text-sm">{seminar.description}</p>
                  </div>

                  <dl className="text-ivory/60 mt-5 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <svg
                        className="text-gold h-4 w-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {formatSeminarDate(seminar.startAt, seminar.endAt, locale, timezone)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="text-gold h-4 w-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span>
                        {seminar.capacity} {placesLabel}
                      </span>
                    </div>
                  </dl>

                  {/* Price display */}
                  {seminar.price != null && seminar.price > 0 && (
                    <div className="border-gold/20 from-gold/5 mt-5 rounded-xl border bg-gradient-to-r to-transparent px-4 py-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-gold text-2xl font-bold">
                          {seminar.price} {currencySymbol}
                        </span>
                        {seminar.deposit != null && seminar.deposit > 0 && (
                          <span className="text-ivory/50 text-xs">
                            {depositLabel} : {seminar.deposit} {currencySymbol}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-center">
                    {ctaComponent ? (
                      ctaComponent(seminar)
                    ) : (
                      <a
                        href={ctaHref}
                        className="bg-gold text-night hover:shadow-gold/25 inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-medium tracking-wide shadow-md transition-all duration-300 hover:shadow-lg"
                      >
                        {ctaLabel}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="border-ivory/10 bg-night/40 text-ivory/60 rounded-3xl border p-8 text-center text-sm md:col-span-3">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
