import type { Metadata } from 'next';

import AppointmentRequestForm from '../../components/AppointmentRequestForm';
import { BreadcrumbSchema } from '../../components/BreadcrumbSchema';
import { NavigationMenu } from '../../components/NavigationMenu';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Demande de Rendez-vous',
  description:
    'Prenez rendez-vous avec David Duquenne, hypnothérapeute certifié. Séances en cabinet (Yonne 89) ou visio.',
  openGraph: {
    title: 'Prendre Rendez-vous | Psypnos',
    description: 'Réservez votre séance d\'hypnose ericksonienne avec David Duquenne.',
    url: 'https://psypnos.fr/demande-rendez-vous',
    type: 'website',
  },
  alternates: {
    canonical: 'https://psypnos.fr/demande-rendez-vous',
  },
};

const breadcrumbs = [
  { name: 'Accueil', url: 'https://psypnos.fr' },
  { name: 'Demande de rendez-vous', url: 'https://psypnos.fr/demande-rendez-vous' },
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
