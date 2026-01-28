import type { Metadata } from 'next';

import { BreadcrumbSchema } from '../../components/BreadcrumbSchema';
import { NavigationMenu } from '../../components/NavigationMenu';
import SeminarRegistrationForm from '../../components/SeminarRegistrationForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inscription au Séminaire de Respiration Holotropique',
  description:
    "Séminaires de respiration holotropique avec David Duquenne. Transformation personnelle dans l'Yonne (89).",
  openGraph: {
    title: 'Séminaire de Respiration Holotropique | Psypnos',
    description: "Séminaires de respiration holotropique guidés par David Duquenne dans l'Yonne.",
    url: 'https://psypnos.fr/inscription-seminaire',
    type: 'website',
  },
  alternates: {
    canonical: 'https://psypnos.fr/inscription-seminaire',
  },
};

const breadcrumbs = [
  { name: 'Accueil', url: 'https://psypnos.fr' },
  { name: 'Inscription séminaire', url: 'https://psypnos.fr/inscription-seminaire' },
];

export default function SeminarRegistrationPage() {
  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <NavigationMenu forceVisible />
      <main className="from-night via-night/95 to-night min-h-screen bg-gradient-to-b px-6 pb-12 pt-24 sm:px-10 lg:px-16">
        <SeminarRegistrationForm />
      </main>
    </>
  );
}
