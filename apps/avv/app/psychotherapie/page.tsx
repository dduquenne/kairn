import type { Metadata } from "next";

import { getAllPostsAsync } from "@/lib/blog";
import { filterPsychotherapyPosts } from "@/lib/therapy-articles";

import { SophrologieContent } from "./SophrologieContent";

// Rendu dynamique pour garantir que les articles sont toujours à jour
export const dynamic = 'force-dynamic';

/**
 * Metadonnees SEO optimisees pour la page sophrologie
 */
export const metadata: Metadata = {
  title: "Sophrologie - Harmonisez votre corps et votre esprit",
  description: "Decouvrez la sophrologie avec Nathalie Duquenne : une methode douce et naturelle pour gerer le stress, ameliorer le sommeil et retrouver l'equilibre interieur. Seances individuelles a Saint-Julien-du-Sault et en visioconference.",
  keywords: [
    "sophrologie",
    "relaxation",
    "gestion du stress",
    "bien-etre",
    "relaxation dynamique",
    "respiration",
    "visualisation",
    "equilibre corps esprit",
    "developpement personnel",
    "sommeil",
    "confiance en soi",
    "Nathalie Duquenne",
    "Saint-Julien-du-Sault",
    "Yonne",
    "Bourgogne",
    "seance en ligne",
    "visioconference",
  ],
  openGraph: {
    title: "Sophrologie - Harmonisez votre corps et votre esprit",
    description: "Une methode douce et naturelle pour gerer le stress, ameliorer le sommeil et retrouver harmonie et serenite.",
    type: "website",
    url: "https://appreciezvotrevie.fr/sophrologie",
    images: [
      {
        url: "https://appreciezvotrevie.fr/images/sophrologie-hero.webp",
        width: 1200,
        height: 630,
        alt: "Sophrologie - Appreciez Votre Vie - Nathalie Duquenne",
      },
    ],
    locale: "fr_FR",
    siteName: "Appreciez Votre Vie",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sophrologie - Harmonisez votre corps et votre esprit",
    description: "Decouvrez une approche douce pour gerer le stress et retrouver harmonie et serenite.",
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
 * Donnees structurees JSON-LD pour le referencement
 * Schema.org Service + WebPage pour la sophrologie
 */
function getJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://appreciezvotrevie.fr/sophrologie#webpage",
        url: "https://appreciezvotrevie.fr/sophrologie",
        name: "Sophrologie - Harmonisez votre corps et votre esprit",
        description:
          "Decouvrez la sophrologie avec Nathalie Duquenne : une methode douce et naturelle pour gerer le stress et retrouver l'equilibre interieur.",
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
      },
      {
        "@type": "Service",
        "@id": "https://appreciezvotrevie.fr/sophrologie#service",
        name: "Sophrologie",
        description:
          "Seances de sophrologie individuelles pour gerer le stress, ameliorer le sommeil, renforcer la confiance en soi et retrouver l'equilibre interieur.",
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
            name: "Bourgogne-Franche-Comte",
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
                name: "Seance individuelle en cabinet",
                description:
                  "Seance de sophrologie en presentiel a Saint-Julien-du-Sault",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Seance en visioconference",
                description:
                  "Seance de sophrologie a distance par visioconference",
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
              text: "La sophrologie est une methode psychocorporelle qui combine des exercices de respiration, de decontraction musculaire et de visualisation positive. Elle permet de retrouver un etat de bien-etre, de gerer le stress et de developper ses capacites personnelles.",
            },
          },
          {
            "@type": "Question",
            name: "Comment se deroule une seance de sophrologie ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Une seance dure environ 1 heure. Elle commence par un temps d'echange, suivi d'exercices de relaxation dynamique (mouvements doux associes a la respiration) puis d'une sophronisation (visualisation guidee en position assise ou allongee). La seance se termine par un temps de partage.",
            },
          },
          {
            "@type": "Question",
            name: "La sophrologie est-elle faite pour moi ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La sophrologie s'adresse a tous, sans condition d'age ni de condition physique. Elle est particulierement indiquee pour la gestion du stress, les troubles du sommeil, la preparation aux examens, l'amelioration de la confiance en soi et l'accompagnement de la grossesse.",
            },
          },
        ],
      },
    ],
  };
}

/**
 * Page de presentation de la sophrologie
 * Server Component qui exporte les metadonnees et recupere les articles
 *
 * ROBUSTESSE : Logging detaille pour diagnostiquer les problemes d'affichage
 */
export default async function SophrologiePage() {
  const jsonLd = getJsonLd();

  console.warn("[page/sophrologie] Chargement de la page");

  // Recuperer tous les articles et filtrer ceux pertinents a la sophrologie
  const allPosts = await getAllPostsAsync();
  console.warn(
    `[page/sophrologie] ${allPosts.length} articles recuperes du blog`
  );

  const relevantPosts = filterPsychotherapyPosts(allPosts, 50);
  console.warn(
    `[page/sophrologie] ${relevantPosts.length} articles filtres pour affichage`
  );

  // Log d'alerte si aucun article
  if (relevantPosts.length === 0) {
    console.warn(
      "[page/sophrologie] ATTENTION: Aucun article a afficher!"
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
