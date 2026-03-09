'use client';

/**
 * Client Component wrapper for dynamically loaded sections
 * These sections use ssr: false to avoid hydration mismatches
 */
import dynamic from 'next/dynamic';

import { BreathworkSectionSkeleton, ContactSectionSkeleton } from './skeletons';

// Sections avec interactions lourdes - chargement côté client pour éviter les problèmes d'hydratation
// Dynamic import from ./respiration (breathwork & rebirth section)
export const BreathworkSection = dynamic(
  () => import('./respiration').then(mod => mod.RespirationSection),
  { loading: () => <BreathworkSectionSkeleton />, ssr: false }
);

export const ContactSection = dynamic(() => import('./contact').then(mod => mod.ContactSection), {
  loading: () => <ContactSectionSkeleton />,
  ssr: false,
});
