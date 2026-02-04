import type { Metadata } from "next";

import { getAllPostsAsync } from "@/lib/blog";
import { filterHypnosisPosts } from "@/lib/therapy-articles";

import { HypnoseContent } from "./HypnoseContent";

// Rendu dynamique pour garantir que les articles sont toujours à jour
export const dynamic = 'force-dynamic';

/**
 * Métadonnées SEO optimisées pour la page hypnose
 */
export const metadata: Metadata = {
  title: "Hypnose thérapeutique - Un voyage vers vos ressources internes",
  description: "Découvrez l'hypnose thérapeutique avec David Duquenne : une approche douce et naturelle pour libérer vos blocages, réduire l'anxiété et activer vos ressources internes. Séances d'hypnose ericksonienne à Saint-Julien-du-Sault et en visioconférence.",
  keywords: [
    "hypnose",
    "hypnose thérapeutique",
    "hypnose ericksonienne",
    "hypnothérapie",
    "état modifié de conscience",
    "inconscient",
    "ressources internes",
    "anxiété",
    "stress",
    "phobies",
    "arrêt tabac",
    "confiance en soi",
    "David Duquenne",
    "Saint-Julien-du-Sault",
    "Yonne",
    "Bourgogne",
    "séance en ligne",
    "visioconférence",
  ],
  openGraph: {
    title: "Hypnose thérapeutique - Un voyage vers vos ressources internes",
    description: "Une approche douce et naturelle pour libérer vos blocages et activer le potentiel de transformation qui sommeille en vous.",
    type: "website",
    url: "https://psypnos.fr/hypnose",
    images: [
      {
        url: "https://psypnos.fr/images/hypnose-hero.webp",
        width: 1200,
        height: 630,
        alt: "Hypnose thérapeutique - Psypnos - David Duquenne",
      },
    ],
    locale: "fr_FR",
    siteName: "Psypnos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hypnose thérapeutique - Un voyage vers vos ressources internes",
    description: "Découvrez une approche thérapeutique douce pour libérer vos blocages et activer vos ressources internes.",
    images: ["https://psypnos.fr/images/hypnose-hero.webp"],
  },
  alternates: {
    canonical: "https://psypnos.fr/hypnose",
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
 * Schema.org Service + MedicalWebPage pour l'hypnose thérapeutique
 */
function getJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalWebPage",
        "@id": "https://psypnos.fr/hypnose#webpage",
        url: "https://psypnos.fr/hypnose",
        name: "Hypnose thérapeutique - Un voyage vers vos ressources internes",
        description:
          "Découvrez l'hypnose thérapeutique avec David Duquenne : une approche douce et naturelle pour libérer vos blocages et activer vos ressources internes.",
        isPartOf: {
          "@id": "https://psypnos.fr/#website",
        },
        about: {
          "@id": "https://psypnos.fr/hypnose#service",
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
              name: "Hypnose",
              item: "https://psypnos.fr/hypnose",
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
        "@id": "https://psypnos.fr/hypnose#service",
        name: "Hypnose thérapeutique",
        description:
          "Séances d'hypnose ericksonienne pour accompagner la gestion du stress, les phobies, les blocages émotionnels et activer les ressources internes.",
        provider: {
          "@type": "Person",
          "@id": "https://psypnos.fr/a-propos#person",
          name: "David Duquenne",
        },
        serviceType: "Hypnothérapie",
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
          name: "Services d'hypnose thérapeutique",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Séance d'hypnose en cabinet",
                description:
                  "Séance d'hypnose thérapeutique en présentiel à Saint-Julien-du-Sault",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Séance d'hypnose en visioconférence",
                description:
                  "Séance d'hypnose thérapeutique à distance par visioconférence",
              },
            },
          ],
        },
      },
      {
        "@type": "FAQPage",
        "@id": "https://psypnos.fr/hypnose#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Qu'est-ce que l'hypnose thérapeutique ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "L'hypnose thérapeutique est un état naturel de conscience modifiée qui permet d'accéder aux ressources de l'inconscient. Contrairement aux idées reçues, vous restez conscient et gardez le contrôle pendant toute la séance. C'est un outil puissant pour faciliter le changement et libérer les blocages.",
            },
          },
          {
            "@type": "Question",
            name: "Comment se déroule une séance d'hypnose ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La séance commence par un temps d'échange pour définir votre objectif. Puis, confortablement installé, je vous guide vers un état de relaxation profonde à travers ma voix. Dans cet état, nous travaillons sur votre problématique. La séance se termine par un retour progressif à l'état de veille ordinaire.",
            },
          },
          {
            "@type": "Question",
            name: "L'hypnose est-elle dangereuse ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Non, l'hypnose thérapeutique est parfaitement sûre. Vous ne dormez pas et restez conscient de ce qui se passe. Vous ne pouvez pas être contrôlé contre votre volonté. C'est un état naturel que nous expérimentons tous au quotidien, par exemple lorsque nous sommes absorbés par un livre ou un film.",
            },
          },
        ],
      },
    ],
  };
}

/**
 * Page de présentation de l'hypnose thérapeutique
 * Server Component qui exporte les métadonnées et récupère les articles
 *
 * ROBUSTESSE : Logging détaillé pour diagnostiquer les problèmes d'affichage
 */
export default async function HypnosePage() {
  const jsonLd = getJsonLd();

  console.log("[page/hypnose] Chargement de la page");

  // Récupérer tous les articles et filtrer ceux pertinents à l'hypnose
  const allPosts = await getAllPostsAsync();
  console.log(`[page/hypnose] ${allPosts.length} articles récupérés du blog`);

  const relevantPosts = filterHypnosisPosts(allPosts, 50);
  console.log(
    `[page/hypnose] ${relevantPosts.length} articles filtrés pour affichage`
  );

  // Log d'alerte si aucun article
  if (relevantPosts.length === 0) {
    console.warn("[page/hypnose] ATTENTION: Aucun article à afficher!");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HypnoseContent posts={relevantPosts} />
    </>
  );
}
