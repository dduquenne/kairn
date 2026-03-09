import type { Metadata } from "next";

import { getAllPostsAsync } from "@/lib/blog";
import { filterPsychotherapyPosts } from "@/lib/therapy-articles";

import { SophrologieContent } from "./SophrologieContent";

// Rendu dynamique pour garantir que les articles sont toujours à jour
export const dynamic = 'force-dynamic';

/**
 * Métadonnées SEO optimisées pour la page sophrologie
 */
export const metadata: Metadata = {
  title: "Sophrologie - Un accompagnement vers la transformation intérieure",
  description: "Découvrez la sophrologie avec Nathalie Duquenne : une approche bienveillante et personnalisée pour traverser les crises de vie, le burn-out, l'anxiété et retrouver du sens. Séances individuelles à Saint-Julien-du-Sault et en visioconférence.",
  keywords: [
    "sophrologie",
    "thérapie",
    "accompagnement psychologique",
    "crise existentielle",
    "burn-out",
    "anxiété",
    "dépression",
    "quête de sens",
    "développement personnel",
    "relaxation dynamique",
    "visualisation positive",
    "Nathalie Duquenne",
    "Saint-Julien-du-Sault",
    "Yonne",
    "Bourgogne",
    "séance en ligne",
    "visioconférence",
  ],
  openGraph: {
    title: "Sophrologie - Un accompagnement vers la transformation intérieure",
    description: "Une approche bienveillante et personnalisée pour traverser les moments difficiles de la vie et retrouver équilibre et sérénité.",
    type: "website",
    url: "https://appreciezvotrevie.fr/sophrologie",
    images: [
      {
        url: "https://appreciezvotrevie.fr/images/sophrologie-hero.webp",
        width: 1200,
        height: 630,
        alt: "Sophrologie - Appréciez Votre Vie - Nathalie Duquenne",
      },
    ],
    locale: "fr_FR",
    siteName: "Appréciez Votre Vie",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sophrologie - Un accompagnement vers la transformation intérieure",
    description: "Découvrez une approche thérapeutique bienveillante pour traverser les crises de vie et retrouver du sens.",
    images: ["https://appreciezvotrevie.fr/images/sophrologie-hero.webp"],
  },
  alternates: {
    canonical: "https://appreciezvotrevie.fr/sophrologie",
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
 * Schema.org Service + MedicalWebPage pour la sophrologie
 */
function getJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalWebPage",
        "@id": "https://appreciezvotrevie.fr/sophrologie#webpage",
        url: "https://appreciezvotrevie.fr/sophrologie",
        name: "Sophrologie - Un accompagnement vers la transformation intérieure",
        description:
          "Découvrez la sophrologie avec Nathalie Duquenne : une approche bienveillante et personnalisée pour traverser les crises de vie.",
        isPartOf: {
          "@id": "https://appreciezvotrevie.fr/#website",
        },
        about: {
          "@id": "https://appreciezvotrevie.fr/sophrologie#service",
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Accueil",
              item: "https://appreciezvotrevie.fr",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Sophrologie",
              item: "https://appreciezvotrevie.fr/sophrologie",
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
        "@id": "https://appreciezvotrevie.fr/sophrologie#service",
        name: "Sophrologie",
        description:
          "Séances de sophrologie individuelles pour accompagner les crises de vie, le burn-out, l'anxiété, la dépression et la quête de sens.",
        provider: {
          "@type": "Person",
          "@id": "https://appreciezvotrevie.fr/a-propos#person",
          name: "Nathalie Duquenne",
        },
        serviceType: "Sophrologie",
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
          name: "Services de sophrologie",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Séance individuelle en cabinet",
                description:
                  "Séance de sophrologie en présentiel à Saint-Julien-du-Sault",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Séance en visioconférence",
                description:
                  "Séance de sophrologie à distance par visioconférence",
              },
            },
          ],
        },
      },
      {
        "@type": "FAQPage",
        "@id": "https://appreciezvotrevie.fr/sophrologie#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Qu'est-ce que la sophrologie ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La sophrologie est un accompagnement professionnel qui aide à traverser les difficultés émotionnelles, les crises de vie et à développer une meilleure connaissance de soi. Elle offre un espace sécurisé pour explorer ses pensées, émotions et comportements.",
            },
          },
          {
            "@type": "Question",
            name: "Comment se déroule une séance de sophrologie ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Une séance dure généralement entre 50 minutes et 1 heure. Elle commence par un temps d'accueil et d'écoute de ce que vous traversez, suivi d'un travail adapté à vos besoins du moment : dialogue, exercices de respiration, relaxation dynamique et visualisation.",
            },
          },
          {
            "@type": "Question",
            name: "La sophrologie est-elle faite pour moi ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La sophrologie s'adresse à toute personne traversant une difficulté : anxiété, burn-out, deuil, crise existentielle, ou simplement une envie de mieux se connaître. Il n'y a pas de profil type.",
            },
          },
        ],
      },
    ],
  };
}

/**
 * Page de présentation de la sophrologie
 * Server Component qui exporte les métadonnées et récupère les articles
 *
 * ROBUSTESSE : Logging détaillé pour diagnostiquer les problèmes d'affichage
 */
export default async function SophrologiePage() {
  const jsonLd = getJsonLd();

  console.log("[page/sophrologie] Chargement de la page");

  // Récupérer tous les articles et filtrer ceux pertinents à la sophrologie
  const allPosts = await getAllPostsAsync();
  console.log(
    `[page/sophrologie] ${allPosts.length} articles récupérés du blog`
  );

  const relevantPosts = filterPsychotherapyPosts(allPosts, 50);
  console.log(
    `[page/sophrologie] ${relevantPosts.length} articles filtrés pour affichage`
  );

  // Log d'alerte si aucun article
  if (relevantPosts.length === 0) {
    console.warn(
      "[page/sophrologie] ATTENTION: Aucun article à afficher!"
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SophrologieContent posts={relevantPosts} />
    </>
  );
}
