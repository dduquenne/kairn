'use client';

import { useArticleReadingTracker } from '@/hooks/useArticleReadingTracker';

interface BlogPostTrackerProps {
  slug: string;
}

export function BlogPostTracker({ slug }: BlogPostTrackerProps) {
  // Hook pour tracker la visite, la durée de lecture et le pourcentage de scroll
  // Envoie également des événements à Microsoft Clarity
  useArticleReadingTracker(slug);

  // Ce composant n'affiche rien, il est juste responsable du tracking
  return null;
}
