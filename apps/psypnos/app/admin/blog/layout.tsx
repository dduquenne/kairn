'use client';

/**
 * Blog Admin Layout
 *
 * Wraps blog admin pages with BlogAdminProvider,
 * supplying Psypnos-specific configuration to all
 * shared blog editor components from @kairn/admin.
 */

import { BlogAdminProvider } from '@kairn/admin';
import { AVAILABLE_TONES } from '@kairn/config';
import type { ReactNode } from 'react';

import { useToast } from '@/lib/toast-context';

import { SocialDiffusionSection } from './_components/SocialDiffusionSection';

/**
 * Configuration Psypnos pour le blog admin
 */
const PSYPNOS_CATEGORIES = ['Comprendre', 'Traverser', 'Découvrir', 'Cheminer'];

const PSYPNOS_CATEGORY_SLUG_MAP: Record<string, string> = {
  Comprendre: 'comprendre',
  Traverser: 'traverser',
  Découvrir: 'decouvrir',
  Cheminer: 'cheminer',
};

const PSYPNOS_SUGGESTED_TOPICS = [
  "Les bienfaits de l'hypnose ericksonienne",
  'Comprendre la respiration holotropique',
  "Le rôle de l'inconscient dans la guérison",
  'La psychologie transpersonnelle',
  'Traverser un deuil avec la thérapie',
];

/**
 * Layout du blog admin Psypnos.
 * Fournit le BlogAdminProvider avec la configuration spécifique au site.
 */
export default function BlogAdminLayout({ children }: { children: ReactNode }) {
  const { addToast } = useToast();

  return (
    <BlogAdminProvider
      config={{
        categories: PSYPNOS_CATEGORIES,
        categorySlugMap: PSYPNOS_CATEGORY_SLUG_MAP,
        defaultAuthor: 'David Duquenne',
        defaultCategory: 'Comprendre',
        publisherName: 'Psypnos',
        publisherUrl: 'https://psypnos.fr/',
        siteStyleLabel: 'PSYPNOS',
        suggestedTopics: PSYPNOS_SUGGESTED_TOPICS,
        availableTones: AVAILABLE_TONES,
        toast: { addToast },
        renderSocialSection: ({ blogSlug, isNewPost }) => (
          <SocialDiffusionSection blogSlug={blogSlug} isNewPost={isNewPost} />
        ),
      }}
    >
      {children}
    </BlogAdminProvider>
  );
}
