'use client';

/**
 * Blog Admin Layout
 *
 * Wraps blog admin pages with BlogAdminProvider,
 * supplying Appréciez Votre Vie-specific configuration to all
 * shared blog editor components from @kairn/admin.
 */

import { BlogAdminProvider } from '@kairn/admin';
import { AVAILABLE_TONES } from '@kairn/config';
import type { ReactNode } from 'react';

import { useToast } from '@/lib/toast-context';

import { SocialDiffusionSection } from './_components/SocialDiffusionSection';

/**
 * Configuration Appréciez Votre Vie pour le blog admin
 */
const AVV_CATEGORIES = ['Comprendre', 'Traverser', 'Découvrir', 'Cheminer'];

const AVV_CATEGORY_SLUG_MAP: Record<string, string> = {
  Comprendre: 'comprendre',
  Traverser: 'traverser',
  Découvrir: 'decouvrir',
  Cheminer: 'cheminer',
};

const AVV_SUGGESTED_TOPICS = [
  "Les bienfaits de l'somatothérapie",
  'Comprendre la breathwork & rebirth',
  "Le rôle de l'inconscient dans la guérison",
  'La psychologie transpersonnelle',
  'Traverser un deuil avec la thérapie',
];

/**
 * Layout du blog admin Appréciez Votre Vie.
 * Fournit le BlogAdminProvider avec la configuration spécifique au site.
 */
export default function BlogAdminLayout({ children }: { children: ReactNode }) {
  const { addToast } = useToast();

  return (
    <BlogAdminProvider
      config={{
        categories: AVV_CATEGORIES,
        categorySlugMap: AVV_CATEGORY_SLUG_MAP,
        defaultAuthor: 'Nathalie Duquenne',
        defaultCategory: 'Comprendre',
        publisherName: 'Appréciez Votre Vie',
        publisherUrl: 'https://appreciezvotrevie.fr/',
        siteStyleLabel: 'AVV',
        suggestedTopics: AVV_SUGGESTED_TOPICS,
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
