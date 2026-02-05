'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { CTAButton } from '../../../components/CTAButton';
import { SectionTitle } from '../../../components/SectionTitle';
import { useSeminars } from '../../../lib/hooks';
import { BLUR_DATA_URL, IMAGE_DIMENSIONS } from '../../../lib/image-utils';
import type { SeminarData } from '../../../lib/server/data-fetchers';

interface SeminarsSectionProps {
  initialData?: SeminarData[];
}

function formatSeminarDate(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  };

  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('fr-FR', options);
  }

  const startStr = start.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  });
  const endStr = end.toLocaleDateString('fr-FR', options);
  return `${startStr} - ${endStr}`;
}

export function SeminarsSection({ initialData }: SeminarsSectionProps) {
  const [hasMounted, setHasMounted] = useState(false);

  // Use SWR for optimized data fetching with caching
  // If initialData is provided, SWR will use it immediately and skip initial fetch
  const { seminars: fetchedSeminars, isLoading } = useSeminars({
    upcoming: true,
    limit: 3,
    initialData,
  });

  // Use initialData if available, otherwise use fetched data
  const upcomingSeminars = initialData && initialData.length > 0 ? initialData : fetchedSeminars;

  // Track mounting to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Show loading only if no initialData AND still loading from SWR
  const showLoading = !initialData && !hasMounted;

  // During SSR and initial client render, show skeleton to prevent hydration mismatch
  if (showLoading || (!initialData && isLoading)) {
    return (
      <section id="seminaires" className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-12">
          <SectionTitle
            eyebrow="Séminaires à venir"
            title="Une exploration profonde au Cœur de Soi"
            description="Nos séminaires sont limités en places pour préserver une attention personnalisée et un cercle intime."
          />
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

  return (
    <section id="seminaires" className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionTitle
          eyebrow="Séminaires à venir"
          title="Une exploration profonde au Cœur de Soi"
          description="Nos séminaires sont limités en places pour préserver une attention personnalisée et un cercle intime."
        />
        <div className="grid gap-10 md:grid-cols-3">
          {upcomingSeminars.length > 0 ? (
            upcomingSeminars.map(
              (
                { id, title, description, startAt, endAt, seminarType, capacity, thumbnail },
                index
              ) => (
                <motion.article
                  key={id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
                  className="border-ivory/10 bg-night/50 shadow-night/60 group flex h-full flex-col overflow-hidden rounded-3xl border shadow-xl"
                >
                  <div className="from-night/80 to-night/40 relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={title}
                        width={IMAGE_DIMENSIONS.seminarCard.width}
                        height={IMAGE_DIMENSIONS.seminarCard.height}
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
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
                    {seminarType && (
                      <span className="bg-gold/90 text-night absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                        {seminarType}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <h3 className="text-ivory text-xl font-semibold">{title}</h3>
                      <p className="text-ivory/70 mt-3 line-clamp-3 text-sm">{description}</p>
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
                        <span>{formatSeminarDate(startAt, endAt)}</span>
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
                        <span>{capacity} places</span>
                      </div>
                    </dl>
                    <div className="mt-6 flex justify-center">
                      <CTAButton className="" href="/inscription-seminaire">
                        Réserver ma place
                      </CTAButton>
                    </div>
                  </div>
                </motion.article>
              )
            )
          ) : (
            <div className="border-ivory/10 bg-night/40 text-ivory/60 rounded-3xl border p-8 text-center text-sm md:col-span-3">
              Aucun séminaire à venir pour le moment. Inscrivez-vous à la newsletter pour être
              informé des prochaines dates.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
