'use client';

import { SeminarsSection as SeminarsSectionUI } from '@kairn/ui';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { siteConfig } from '@/config/site.config';

import { CTAButton } from '../../../components/CTAButton';
import { useSeminars } from '../../../lib/hooks';
import { BLUR_DATA_URL, IMAGE_DIMENSIONS } from '../../../lib/image-utils';
import type { SeminarData } from '../../../lib/server/data-fetchers';

/** Map seminar type slugs to human-readable labels from site config */
const SEMINAR_TYPE_LABELS = new Map(
  (siteConfig.seminars?.types ?? []).map(t => [t.value, t.label])
);

/**
 * Resolve seminarType slug to human-readable label.
 * Falls back to the raw value if not found in the config.
 */
function resolveSeminarTypeLabel(seminarType?: string): string | undefined {
  if (!seminarType) return undefined;
  return SEMINAR_TYPE_LABELS.get(seminarType) ?? seminarType;
}

interface SeminarsSectionProps {
  initialData?: SeminarData[];
}

/**
 * Psypnos seminars section wrapper.
 * Provides site-specific data fetching, image optimization, and CTA to the shared @kairn/ui component.
 */
export function SeminarsSection({ initialData }: SeminarsSectionProps) {
  const [hasMounted, setHasMounted] = useState(false);

  const { seminars: fetchedSeminars, isLoading } = useSeminars({
    upcoming: true,
    limit: 3,
    initialData,
  });

  const rawSeminars = initialData && initialData.length > 0 ? initialData : fetchedSeminars;

  // Resolve seminarType slugs to human-readable labels for display
  const upcomingSeminars = useMemo(
    () =>
      rawSeminars.map(s => ({
        ...s,
        seminarType: resolveSeminarTypeLabel(s.seminarType),
      })),
    [rawSeminars]
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const showLoading = !initialData && (!hasMounted || isLoading);

  return (
    <SeminarsSectionUI
      seminars={upcomingSeminars}
      isLoading={showLoading}
      title={{
        eyebrow: 'Séminaires à venir',
        title: 'Une exploration profonde au Cœur de Soi',
        description:
          'Nos séminaires sont limités en places pour préserver une attention personnalisée et un cercle intime.',
      }}
      emptyMessage="Aucun séminaire à venir pour le moment. Inscrivez-vous à la newsletter pour être informé des prochaines dates."
      ctaComponent={() => (
        <CTAButton className="" href="/inscription-seminaire">
          Réserver ma place
        </CTAButton>
      )}
      imageComponent={({ src, alt, width, height, className }) => (
        <Image
          src={src}
          alt={alt}
          width={width || IMAGE_DIMENSIONS.seminarCard.width}
          height={height || IMAGE_DIMENSIONS.seminarCard.height}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className={className}
        />
      )}
      trackingName="Séminaires"
    />
  );
}
