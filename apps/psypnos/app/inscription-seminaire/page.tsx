import type { Metadata } from "next";
import SeminarRegistrationForm from "../../components/SeminarRegistrationForm";
import { GlobalHeader } from "../../components/GlobalHeader";
import { BreadcrumbSchema } from "../../components/BreadcrumbSchema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscription au Séminaire de Respiration Holotropique",
  description: "Séminaires de respiration holotropique avec David Duquenne. Transformation personnelle dans l'Yonne (89).",
  openGraph: {
    title: "Séminaire de Respiration Holotropique | Psypnos",
    description: "Séminaires de respiration holotropique guidés par David Duquenne dans l'Yonne.",
    url: "https://psypnos.fr/inscription-seminaire",
    type: "website",
  },
  alternates: {
    canonical: "https://psypnos.fr/inscription-seminaire"
  }
};

const breadcrumbs = [
  { name: "Accueil", url: "https://psypnos.fr" },
  { name: "Inscription séminaire", url: "https://psypnos.fr/inscription-seminaire" },
];

export default function SeminarRegistrationPage() {
  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <GlobalHeader context="seminar" />
      <main className="min-h-screen bg-gradient-to-b from-night via-night/95 to-night px-6 py-24 sm:px-10 lg:px-16">
        <SeminarRegistrationForm />
      </main>
    </>
  );
}
