'use client';

/**
 * Client Component wrapper for dynamically loaded sections
 * These sections use ssr: false to avoid hydration mismatches
 */
import dynamic from 'next/dynamic';

import { RespirationSectionSkeleton, ContactSectionSkeleton } from './skeletons';

// Sections avec interactions lourdes - chargement côté client pour éviter les problèmes d'hydratation
export const RespirationSection = dynamic(
  () => import('./respiration').then(mod => mod.RespirationSection),
  { loading: () => <RespirationSectionSkeleton />, ssr: false }
);

export const ContactSection = dynamic(() => import('./contact').then(mod => mod.ContactSection), {
  loading: () => <ContactSectionSkeleton />,
  ssr: false,
});
