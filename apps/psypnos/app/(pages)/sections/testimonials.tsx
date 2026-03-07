'use client';

import { TestimonialsSection as TestimonialsSectionUI } from '@kairn/ui';
import { useEffect, useState } from 'react';

import { useTestimonials } from '../../../lib/hooks';
import type { TestimonialData } from '../../../lib/server/data-fetchers';

interface TestimonialsSectionProps {
  initialData?: TestimonialData[];
}

/**
 * Psypnos testimonials section wrapper.
 * Provides site-specific data fetching and configuration to the shared @kairn/ui component.
 */
export function TestimonialsSection({ initialData }: TestimonialsSectionProps) {
  const [hasMounted, setHasMounted] = useState(false);

  const { testimonials: fetchedTestimonials, isLoading } = useTestimonials({ limit: 10 });

  const testimonials = initialData && initialData.length > 0 ? initialData : fetchedTestimonials;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const showLoading = !initialData && (!hasMounted || isLoading);

  return (
    <TestimonialsSectionUI
      testimonials={testimonials}
      isLoading={showLoading}
      title={{
        eyebrow: 'Témoignages',
        title: 'Ils et elles témoignent de leur métamorphose',
      }}
      trackingName="Témoignages"
      emptyMessage="Aucun témoignage pour le moment."
      hoverHint="Survolez pour mettre en pause"
    />
  );
}
