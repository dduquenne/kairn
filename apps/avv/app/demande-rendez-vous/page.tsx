import type { Metadata } from 'next';

import AppointmentRequestForm from '../../components/AppointmentRequestForm';
import { BreadcrumbSchema } from '../../components/BreadcrumbSchema';
import { NavigationMenu } from '../../components/NavigationMenu';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Demande de Rendez-vous',
  description:
    'Prenez rendez-vous avec Nathalie Duquenne, thérapeute. Séances en cabinet (Yonne 89) ou visio.',
  openGraph: {
    title: 'Prendre Rendez-vous | Appréciez Votre Vie',
    description: 'Réservez votre séance de sophrologie ou somatothérapie avec Nathalie Duquenne.',
    url: 'https://appreciezvotrevie.fr/demande-rendez-vous',
    type: 'website',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/demande-rendez-vous',
  },
};

const breadcrumbs = [
  { name: 'Accueil', url: 'https://appreciezvotrevie.fr' },
  { name: 'Demande de rendez-vous', url: 'https://appreciezvotrevie.fr/demande-rendez-vous' },
];

export default function AppointmentRequestPage() {
  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <NavigationMenu forceVisible />
      <main className="from-night via-night/95 to-night min-h-screen bg-gradient-to-b px-6 pb-12 pt-24 sm:px-10 lg:px-16">
        <AppointmentRequestForm />
      </main>
    </>
  );
}
