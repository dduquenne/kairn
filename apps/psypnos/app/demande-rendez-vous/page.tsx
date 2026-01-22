import type { Metadata } from "next";
import AppointmentRequestForm from "../../components/AppointmentRequestForm";
import { GlobalHeader } from "../../components/GlobalHeader";
import { BreadcrumbSchema } from "../../components/BreadcrumbSchema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demande de Rendez-vous",
  description: "Prenez rendez-vous avec David Duquenne, psychothérapeute. Séances en cabinet (Yonne 89) ou visio.",
  openGraph: {
    title: "Prendre Rendez-vous | Psypnos",
    description: "Réservez votre séance de psychothérapie ou hypnose avec David Duquenne.",
    url: "https://psypnos.fr/demande-rendez-vous",
    type: "website",
  },
  alternates: {
    canonical: "https://psypnos.fr/demande-rendez-vous"
  }
};

const breadcrumbs = [
  { name: "Accueil", url: "https://psypnos.fr" },
  { name: "Demande de rendez-vous", url: "https://psypnos.fr/demande-rendez-vous" },
];

export default function AppointmentRequestPage() {
  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <GlobalHeader context="appointment" />
      <main className="min-h-screen bg-gradient-to-b from-night via-night/95 to-night px-6 py-24 sm:px-10 lg:px-16">
        <AppointmentRequestForm />
      </main>
    </>
  );
}
