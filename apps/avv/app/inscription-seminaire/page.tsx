import type { Metadata } from 'next';

import { BreadcrumbSchema } from '../../components/BreadcrumbSchema';
import { NavigationMenu } from '../../components/NavigationMenu';
import SeminarRegistrationForm from '../../components/SeminarRegistrationForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inscription au Séminaire de Breathwork & Rebirth',
  description:
    "Séminaires de breathwork & rebirth avec Nathalie Duquenne. Transformation personnelle dans l'Yonne (89).",
  openGraph: {
    title: 'Séminaire de Breathwork & Rebirth | Appréciez Votre Vie',
    description: "Séminaires de breathwork & rebirth guidés par Nathalie Duquenne dans l'Yonne.",
    url: 'https://appreciezvotrevie.fr/inscription-seminaire',
    type: 'website',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/inscription-seminaire',
  },
};

const breadcrumbs = [
  { name: 'Accueil', url: 'https://appreciezvotrevie.fr' },
  { name: 'Inscription séminaire', url: 'https://appreciezvotrevie.fr/inscription-seminaire' },
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
