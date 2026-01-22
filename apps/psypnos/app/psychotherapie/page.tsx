import type { Metadata } from "next";
import { PsychotherapieContent } from "./PsychotherapieContent";
import { getAllPostsAsync } from "@/lib/blog";
import { filterPsychotherapyPosts } from "@/lib/therapy-articles";

// Rendu dynamique pour garantir que les articles sont toujours à jour
export const dynamic = 'force-dynamic';

/**
 * Métadonnées SEO optimisées pour la page psychothérapie
 */
export const metadata: Metadata = {
  title: "Psychothérapie - Un accompagnement vers la transformation intérieure",
  description: "Découvrez la psychothérapie avec David Duquenne : une approche bienveillante et personnalisée pour traverser les crises de vie, le burn-out, l'anxiété et retrouver du sens. Séances individuelles à Saint-Julien-du-Sault et en visioconférence.",
  keywords: [
    "psychothérapie",
    "thérapie",
    "accompagnement psychologique",
    "crise existentielle",
    "burn-out",
    "anxiété",
    "dépression",
    "quête de sens",
    "développement personnel",
    "psychothérapie transpersonnelle",
    "hypnose thérapeutique",
    "David Duquenne",
    "Saint-Julien-du-Sault",
    "Yonne",
    "Bourgogne",
    "séance en ligne",
    "visioconférence",
  ],
  openGraph: {
    title: "Psychothérapie - Un accompagnement vers la transformation intérieure",
    description: "Une approche bienveillante et personnalisée pour traverser les moments difficiles de la vie et retrouver équilibre et sérénité.",
    type: "website",
    url: "https://psypnos.fr/psychotherapie",
    images: [
      {
        url: "https://psypnos.fr/images/psychotherapie-hero.webp",
        width: 1200,
        height: 630,
        alt: "Psychothérapie - Psypnos - David Duquenne",
      },
    ],
    locale: "fr_FR",
    siteName: "Psypnos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Psychothérapie - Un accompagnement vers la transformation intérieure",
    description: "Découvrez une approche thérapeutique bienveillante pour traverser les crises de vie et retrouver du sens.",
    images: ["https://psypnos.fr/images/psychotherapie-hero.webp"],
  },
  alternates: {
    canonical: "https://psypnos.fr/psychotherapie",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/**
 * Données structurées JSON-LD pour le référencement
 * Schema.org Service + MedicalWebPage pour la psychothérapie
 */
function getJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalWebPage",
        "@id": "https://psypnos.fr/psychotherapie#webpage",
        url: "https://psypnos.fr/psychotherapie",
        name: "Psychothérapie - Un accompagnement vers la transformation intérieure",
        description:
          "Découvrez la psychothérapie avec David Duquenne : une approche bienveillante et personnalisée pour traverser les crises de vie.",
        isPartOf: {
          "@id": "https://psypnos.fr/#website",
        },
        about: {
          "@id": "https://psypnos.fr/psychotherapie#service",
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Accueil",
              item: "https://psypnos.fr",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Psychothérapie",
              item: "https://psypnos.fr/psychotherapie",
            },
          ],
        },
        datePublished: "2024-01-01",
        dateModified: new Date().toISOString(),
        inLanguage: "fr-FR",
        medicalAudience: {
          "@type": "MedicalAudience",
          audienceType: "Patient",
        },
      },
      {
        "@type": "Service",
        "@id": "https://psypnos.fr/psychotherapie#service",
        name: "Psychothérapie",
        description:
          "Séances de psychothérapie individuelles pour accompagner les crises de vie, le burn-out, l'anxiété, la dépression et la quête de sens.",
        provider: {
          "@type": "Person",
          "@id": "https://psypnos.fr/a-propos#person",
          name: "David Duquenne",
        },
        serviceType: "Psychothérapie",
        areaServed: [
          {
            "@type": "City",
            name: "Saint-Julien-du-Sault",
          },
          {
            "@type": "AdministrativeArea",
            name: "Yonne",
          },
          {
            "@type": "AdministrativeArea",
            name: "Bourgogne-Franche-Comté",
          },
        ],
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          priceSpecification: {
            "@type": "PriceSpecification",
            priceCurrency: "EUR",
          },
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Services de psychothérapie",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Séance individuelle en cabinet",
                description:
                  "Séance de psychothérapie en présentiel à Saint-Julien-du-Sault",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Séance en visioconférence",
                description:
                  "Séance de psychothérapie à distance par visioconférence",
              },
            },
          ],
        },
      },
      {
        "@type": "FAQPage",
        "@id": "https://psypnos.fr/psychotherapie#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Qu'est-ce que la psychothérapie ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La psychothérapie est un accompagnement professionnel qui aide à traverser les difficultés émotionnelles, les crises de vie et à développer une meilleure connaissance de soi. Elle offre un espace sécurisé pour explorer ses pensées, émotions et comportements.",
            },
          },
          {
            "@type": "Question",
            name: "Comment se déroule une séance de psychothérapie ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Une séance dure généralement entre 50 minutes et 1 heure. Elle commence par un temps d'accueil et d'écoute de ce que vous traversez, suivi d'un travail adapté à vos besoins du moment : dialogue, exercices de présence, hypnose si approprié.",
            },
          },
          {
            "@type": "Question",
            name: "La psychothérapie est-elle faite pour moi ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La psychothérapie s'adresse à toute personne traversant une difficulté : anxiété, burn-out, deuil, crise existentielle, ou simplement une envie de mieux se connaître. Il n'y a pas de profil type.",
            },
          },
        ],
      },
    ],
  };
}

/**
 * Page de présentation de la psychothérapie
 * Server Component qui exporte les métadonnées et récupère les articles
 *
 * ROBUSTESSE : Logging détaillé pour diagnostiquer les problèmes d'affichage
 */
export default async function PsychotherapiePage() {
  const jsonLd = getJsonLd();

  console.log("[page/psychotherapie] Chargement de la page");

  // Récupérer tous les articles et filtrer ceux pertinents à la psychothérapie
  const allPosts = await getAllPostsAsync();
  console.log(
    `[page/psychotherapie] ${allPosts.length} articles récupérés du blog`
  );

  const relevantPosts = filterPsychotherapyPosts(allPosts, 50);
  console.log(
    `[page/psychotherapie] ${relevantPosts.length} articles filtrés pour affichage`
  );

  // Log d'alerte si aucun article
  if (relevantPosts.length === 0) {
    console.warn(
      "[page/psychotherapie] ATTENTION: Aucun article à afficher!"
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PsychotherapieContent posts={relevantPosts} />
    </>
  );
}
