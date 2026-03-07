'use client';

import { SeminarsSection as SeminarsSectionUI } from '@kairn/ui';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { CTAButton } from '../../../components/CTAButton';
import { useSeminars } from '../../../lib/hooks';
import { BLUR_DATA_URL, IMAGE_DIMENSIONS } from '../../../lib/image-utils';
import type { SeminarData } from '../../../lib/server/data-fetchers';

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

  const upcomingSeminars = initialData && initialData.length > 0 ? initialData : fetchedSeminars;

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
