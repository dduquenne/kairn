import type { Metadata } from "next";
import { AProposContent } from "./AProposContent";

// SEO : ISR avec revalidation toutes les 24h pour un meilleur référencement
export const revalidate = 86400;

/**
 * Métadonnées SEO optimisées pour la page biographique
 */
export const metadata: Metadata = {
  title: "À propos - David Duquenne, Hypnothérapeute certifié",
  description: "Découvrez le parcours de David Duquenne : de l'angoisse existentielle au burn-out jusqu'à l'accompagnement thérapeutique. Une histoire de transformation profonde au service de ceux qui traversent des crises de vie et recherchent du sens.",
  keywords: [
    "David Duquenne",
    "parcours hypnothérapeute",
    "hypnothérapeute certifié",
    "burn-out transformation",
    "hypnose ericksonienne",
    "respiration holotropique",
    "accompagnement fin de vie",
    "JALMAV",
    "crise existentielle",
    "quête de sens",
    "hypnose ericksonienne formation",
    "Psypnos histoire",
    "Saint-Julien-du-Sault hypnothérapeute"
  ],
  openGraph: {
    title: "Un chemin vers l'essentiel - L'histoire de David Duquenne",
    description: "De l'effondrement à la renaissance : le parcours inspirant d'un hypnothérapeute qui a transformé ses blessures en outils d'accompagnement. Découvrez une histoire humaine au service du sens.",
    type: "profile",
    url: "https://psypnos.fr/a-propos",
    images: [
      {
        url: "https://psypnos.fr/images/David_Duquenne.webp",
        width: 1029,
        height: 973,
        alt: "David Duquenne - Hypnothérapeute certifié",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Un chemin vers l'essentiel - David Duquenne",
    description: "Découvrez le parcours inspirant d'un hypnothérapeute qui a transformé ses épreuves en accompagnement thérapeutique au service du sens.",
    images: ["https://psypnos.fr/images/David_Duquenne.webp"],
  },
  alternates: {
    canonical: "https://psypnos.fr/a-propos",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

/**
 * Données structurées JSON-LD pour le référencement
 * Schema.org ProfilePage + Person pour David Duquenne
 */
function getJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': 'https://psypnos.fr/a-propos#webpage',
        url: 'https://psypnos.fr/a-propos',
        name: 'À propos - David Duquenne, Hypnothérapeute certifié',
        description: 'Découvrez le parcours de David Duquenne : de l\'angoisse existentielle au burn-out jusqu\'à l\'accompagnement thérapeutique.',
        isPartOf: {
          '@id': 'https://psypnos.fr/#website',
        },
        mainEntity: {
          '@id': 'https://psypnos.fr/a-propos#person',
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Accueil',
              item: 'https://psypnos.fr',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'À propos',
              item: 'https://psypnos.fr/a-propos',
            },
          ],
        },
        datePublished: '2024-01-01',
        dateModified: new Date().toISOString(),
        inLanguage: 'fr-FR',
      },
      {
        '@type': 'Person',
        '@id': 'https://psypnos.fr/a-propos#person',
        name: 'David Duquenne',
        givenName: 'David',
        familyName: 'Duquenne',
        jobTitle: 'Hypnothérapeute certifié',
        description: 'Hypnothérapeute certifié en hypnose ericksonienne et facilitateur en respiration holotropique. Accompagnement des crises de vie, burn-out, deuil et quête de sens.',
        url: 'https://psypnos.fr/a-propos',
        image: {
          '@type': 'ImageObject',
          url: 'https://psypnos.fr/images/David_Duquenne.webp',
          width: 1029,
          height: 973,
          caption: 'David Duquenne - Hypnothérapeute certifié',
        },
        sameAs: [
          'https://psypnos.fr',
        ],
        worksFor: {
          '@type': 'MedicalBusiness',
          '@id': 'https://psypnos.fr/#organization',
          name: 'Psypnos',
          url: 'https://psypnos.fr',
        },
        knowsAbout: [
          'Hypnose ericksonienne',
          'Accompagnement thérapeutique',
          'Respiration holotropique',
          'Accompagnement fin de vie',
          'Gestion du burn-out',
          'Crises existentielles',
        ],
        birthDate: '1967',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Saint-Julien-du-Sault',
          addressRegion: 'Yonne',
          postalCode: '89330',
          addressCountry: 'FR',
        },
        alumniOf: [
          {
            '@type': 'Organization',
            name: 'JALMAV',
            description: 'Association d\'accompagnement en soins palliatifs',
          },
        ],
      },
    ],
  };
}

/**
 * Page biographique de David Duquenne
 * Server Component qui exporte les métadonnées et rend le composant client
 */
export default function AProposPage() {
  const jsonLd = getJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AProposContent />
    </>
  );
}
