/**
 * Dynamically loaded sections with code splitting.
 * SSR is enabled so sections are visible even before JS hydration.
 */
import dynamic from 'next/dynamic';

import { RespirationSectionSkeleton, ContactSectionSkeleton } from './skeletons';

export const RespirationSection = dynamic(
  () => import('./respiration').then(mod => mod.RespirationSection),
  { loading: () => <RespirationSectionSkeleton /> }
);

export const ContactSection = dynamic(() => import('./contact').then(mod => mod.ContactSection), {
  loading: () => <ContactSectionSkeleton />,
});
