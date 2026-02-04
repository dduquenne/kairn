import type { Metadata } from "next";

import { getAllPostsAsync } from "@/lib/blog";
import { filterHolotropicPosts } from "@/lib/therapy-articles";

import { RespirationHolotropiqueContent } from "./RespirationHolotropiqueContent";

// Rendu dynamique pour garantir que les articles sont toujours à jour
export const dynamic = 'force-dynamic';

/**
 * Métadonnées SEO optimisées pour la page respiration holotropique
 */
export const metadata: Metadata = {
  title: "Respiration Holotropique - Un voyage intérieur transformateur",
  description: "Découvrez la respiration holotropique avec David Duquenne : une technique de respiration profonde pour explorer votre monde intérieur, libérer vos blocages émotionnels et accéder à des états de conscience modifiée. Séminaires en Bourgogne au Moulin d'en Bas.",
  keywords: [
    "respiration holotropique",
    "breathwork",
    "Stanislav Grof",
    "états modifiés de conscience",
    "transformation personnelle",
    "travail sur soi",
    "libération émotionnelle",
    "développement personnel",
    "expérience transpersonnelle",
    "voyage intérieur",
    "séminaire respiration",
    "David Duquenne",
    "Moulin d'en bas",
    "Bourgogne",
    "Yonne",
    "retraite spirituelle",
    "guérison émotionnelle",
    "conscience élargie",
  ],
  openGraph: {
    title: "Respiration Holotropique - Un voyage intérieur transformateur",
    description: "Une technique puissante de respiration profonde pour explorer votre monde intérieur et libérer vos blocages émotionnels. Séminaires en Bourgogne.",
    type: "website",
    url: "https://psypnos.fr/respiration-holotropique",
    images: [
      {
        url: "https://psypnos.fr/images/Moulin_d_en_Bas.webp",
        width: 1200,
        height: 630,
        alt: "Respiration Holotropique - Séminaires au Moulin d'en Bas - Psypnos",
      },
    ],
    locale: "fr_FR",
    siteName: "Psypnos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Respiration Holotropique - Un voyage intérieur transformateur",
    description: "Découvrez la respiration holotropique : une technique de transformation personnelle puissante. Séminaires en Bourgogne.",
    images: ["https://psypnos.fr/images/Moulin_d_en_Bas.webp"],
  },
  alternates: {
    canonical: "https://psypnos.fr/respiration-holotropique",
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
 * Schema.org Service + MedicalWebPage pour la respiration holotropique
 */
function getJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://psypnos.fr/respiration-holotropique#webpage",
        url: "https://psypnos.fr/respiration-holotropique",
        name: "Respiration Holotropique - Un voyage intérieur transformateur",
        description:
          "Découvrez la respiration holotropique avec David Duquenne : une technique de respiration profonde pour explorer votre monde intérieur et libérer vos blocages émotionnels.",
        isPartOf: {
          "@id": "https://psypnos.fr/#website",
        },
        about: {
          "@id": "https://psypnos.fr/respiration-holotropique#service",
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
              name: "Respiration Holotropique",
              item: "https://psypnos.fr/respiration-holotropique",
            },
          ],
        },
        datePublished: "2024-01-01",
        dateModified: new Date().toISOString(),
        inLanguage: "fr-FR",
      },
      {
        "@type": "Service",
        "@id": "https://psypnos.fr/respiration-holotropique#service",
        name: "Respiration Holotropique",
        description:
          "Séminaires de respiration holotropique pour explorer les états modifiés de conscience, libérer les blocages émotionnels et favoriser la transformation personnelle.",
        provider: {
          "@type": "Person",
          "@id": "https://psypnos.fr/a-propos#person",
          name: "David Duquenne",
        },
        serviceType: "Séminaire de respiration holotropique",
        areaServed: [
          {
            "@type": "Place",
            name: "Moulin d'en Bas",
            address: {
              "@type": "PostalAddress",
              addressRegion: "Bourgogne-Franche-Comté",
            },
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
      },
      {
        "@type": "FAQPage",
        "@id": "https://psypnos.fr/respiration-holotropique#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Qu'est-ce que la respiration holotropique ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La respiration holotropique est une technique de respiration profonde et accélérée développée par le psychiatre Stanislav Grof. Elle permet d'accéder à des états modifiés de conscience pour explorer son monde intérieur, libérer des blocages émotionnels et favoriser la guérison et la transformation personnelle.",
            },
          },
          {
            "@type": "Question",
            name: "La respiration holotropique est-elle dangereuse ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Pratiquée dans un cadre sécurisé avec des facilitateurs formés, la respiration holotropique est une technique sûre. Certaines contre-indications existent (problèmes cardiaques, grossesse, épilepsie...). Un entretien préalable permet de vérifier que cette pratique vous convient.",
            },
          },
          {
            "@type": "Question",
            name: "Comment se déroule un séminaire de respiration holotropique ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Le séminaire comprend une préparation, une session de respiration accompagnée par une musique évocatrice, un travail corporel si nécessaire, puis un temps d'intégration avec dessin, écriture et partage en groupe. Chaque participant alterne entre le rôle de respirant et d'accompagnant.",
            },
          },
        ],
      },
    ],
  };
}

/**
 * Récupère les séminaires à venir depuis l'API
 */
async function getUpcomingSeminars() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://psypnos.fr";
    const response = await fetch(`${baseUrl}/api/seminars`, {
      next: { revalidate: 3600 }, // Revalidation toutes les heures
    });

    if (!response.ok) {
      return [];
    }

    const seminars = await response.json();
    const now = new Date();

    // Filtrer les séminaires à venir avec le tag "respiration"
    return seminars
      .filter((seminar: { startAt: string; tags: string[] }) => {
        const startDate = new Date(seminar.startAt);
        const hasRespirationTag = seminar.tags.some((tag: string) =>
          tag.toLowerCase().includes("respiration")
        );
        return startDate > now && hasRespirationTag;
      })
      .sort((a: { startAt: string }, b: { startAt: string }) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      )
      .slice(0, 5); // Limiter à 5 séminaires
  } catch {
    return [];
  }
}

/**
 * Page de présentation de la respiration holotropique
 * Server Component qui exporte les métadonnées et récupère les articles et séminaires
 *
 * ROBUSTESSE : Logging détaillé pour diagnostiquer les problèmes d'affichage
 */
export default async function RespirationHolotropiquePage() {
  const jsonLd = getJsonLd();

  console.log("[page/respiration-holotropique] Chargement de la page");

  // Récupérer tous les articles et filtrer ceux pertinents à la respiration holotropique
  const allPosts = await getAllPostsAsync();
  console.log(
    `[page/respiration-holotropique] ${allPosts.length} articles récupérés du blog`
  );

  const relevantPosts = filterHolotropicPosts(allPosts, 50);
  console.log(
    `[page/respiration-holotropique] ${relevantPosts.length} articles filtrés pour affichage`
  );

  // Log d'alerte si aucun article
  if (relevantPosts.length === 0) {
    console.warn(
      "[page/respiration-holotropique] ATTENTION: Aucun article à afficher!"
    );
  }

  // Récupérer les séminaires à venir
  const upcomingSeminars = await getUpcomingSeminars();
  console.log(
    `[page/respiration-holotropique] ${upcomingSeminars.length} séminaires à venir`
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RespirationHolotropiqueContent
        posts={relevantPosts}
        seminars={upcomingSeminars}
      />
    </>
  );
}
