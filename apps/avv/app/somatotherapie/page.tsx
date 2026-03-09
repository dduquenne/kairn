import type { Metadata } from "next";

import { getAllPostsAsync } from "@/lib/blog";
import { filterHypnosisPosts } from "@/lib/therapy-articles";

import { SomatothérapieContent } from "./SomatotherapieContent";

// Rendu dynamique pour garantir que les articles sont toujours à jour
export const dynamic = 'force-dynamic';

/**
 * Métadonnées SEO optimisées pour la page somatothérapie
 */
export const metadata: Metadata = {
  title: "Somatothérapie - Libérez les mémoires de votre corps",
  description: "Découvrez la somatothérapie avec Nathalie Duquenne : une approche corporelle globale pour libérer les tensions, les blocages émotionnels inscrits dans le corps et retrouver votre vitalité. Séances individuelles à Saint-Julien-du-Sault.",
  keywords: [
    "somatothérapie",
    "thérapie corporelle",
    "mémoire du corps",
    "libération émotionnelle",
    "tensions musculaires",
    "approche psychocorporelle",
    "relaxation profonde",
    "bien-être corporel",
    "équilibre corps esprit",
    "toucher conscient",
    "Nathalie Duquenne",
    "Saint-Julien-du-Sault",
    "Yonne",
    "Bourgogne",
  ],
  openGraph: {
    title: "Somatothérapie - Libérez les mémoires de votre corps",
    description: "Une approche corporelle globale pour libérer les tensions et les blocages émotionnels inscrits dans le corps.",
    type: "website",
    url: "https://appreciezvotrevie.fr/somatotherapie",
    images: [
      {
        url: "https://appreciezvotrevie.fr/images/somatotherapie-hero.webp",
        width: 1200,
        height: 630,
        alt: "Somatothérapie - Appréciez Votre Vie - Nathalie Duquenne",
      },
    ],
    locale: "fr_FR",
    siteName: "Appréciez Votre Vie",
  },
  twitter: {
    card: "summary_large_image",
    title: "Somatothérapie - Libérez les mémoires de votre corps",
    description: "Découvrez une approche corporelle pour libérer les tensions et retrouver votre vitalité.",
    images: ["https://appreciezvotrevie.fr/images/somatotherapie-hero.webp"],
  },
  alternates: {
    canonical: "https://appreciezvotrevie.fr/somatotherapie",
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
 * Schema.org Service + WebPage pour la somatothérapie
 */
function getJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://appreciezvotrevie.fr/somatotherapie#webpage",
        url: "https://appreciezvotrevie.fr/somatotherapie",
        name: "Somatothérapie - Libérez les mémoires de votre corps",
        description:
          "Découvrez la somatothérapie avec Nathalie Duquenne : une approche corporelle globale pour libérer les tensions et les blocages émotionnels.",
        isPartOf: {
          "@id": "https://appreciezvotrevie.fr/#website",
        },
        about: {
          "@id": "https://appreciezvotrevie.fr/somatotherapie#service",
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
              name: "Somatothérapie",
              item: "https://appreciezvotrevie.fr/somatotherapie",
            },
          ],
        },
        datePublished: "2024-01-01",
        dateModified: new Date().toISOString(),
        inLanguage: "fr-FR",
      },
      {
        "@type": "Service",
        "@id": "https://appreciezvotrevie.fr/somatotherapie#service",
        name: "Somatothérapie",
        description:
          "Séances de somatothérapie pour libérer les tensions, les blocages émotionnels inscrits dans le corps et retrouver vitalité et équilibre.",
        provider: {
          "@type": "Person",
          "@id": "https://appreciezvotrevie.fr/a-propos#person",
          name: "Nathalie Duquenne",
        },
        serviceType: "Somatothérapie",
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
          name: "Services de somatothérapie",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Séance individuelle en cabinet",
                description:
                  "Séance de somatothérapie en présentiel à Saint-Julien-du-Sault",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Séance en visioconférence",
                description:
                  "Séance de somatothérapie à distance par visioconférence",
              },
            },
          ],
        },
      },
      {
        "@type": "FAQPage",
        "@id": "https://appreciezvotrevie.fr/somatotherapie#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Qu'est-ce que la somatothérapie ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La somatothérapie est une approche thérapeutique qui prend en compte le corps dans sa globalité. Elle part du principe que nos expériences émotionnelles, nos traumatismes et notre vécu se mémorisent dans le corps sous forme de tensions, de blocages ou de douleurs. En travaillant avec le corps, on peut libérer ces mémoires et retrouver l'équilibre.",
            },
          },
          {
            "@type": "Question",
            name: "Comment se déroule une séance de somatothérapie ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Une séance dure environ 1h à 1h30. Elle commence par un temps d'échange pour comprendre votre état du moment. Ensuite, le travail corporel commence : toucher conscient, mobilisations douces, exercices de respiration. La séance se termine par un temps d'intégration et d'échange sur les ressentis.",
            },
          },
          {
            "@type": "Question",
            name: "La somatothérapie est-elle faite pour moi ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La somatothérapie s'adresse à toute personne qui ressent des tensions chroniques, des blocages émotionnels, du stress ou qui souhaite reconnecter avec son corps. Elle est particulièrement indiquée après un traumatisme, un burn-out ou en complément d'un suivi psychologique.",
            },
          },
        ],
      },
    ],
  };
}

/**
 * Page de présentation de la somatothérapie
 * Server Component qui exporte les métadonnées et récupère les articles
 */
export default async function SomatotherapiePage() {
  const jsonLd = getJsonLd();

  console.warn("[page/somatotherapie] Chargement de la page");

  // Récupérer tous les articles et filtrer ceux pertinents
  const allPosts = await getAllPostsAsync();
  console.warn(`[page/somatotherapie] ${allPosts.length} articles récupérés du blog`);

  const relevantPosts = filterHypnosisPosts(allPosts, 50);
  console.warn(
    `[page/somatotherapie] ${relevantPosts.length} articles filtrés pour affichage`
  );

  if (relevantPosts.length === 0) {
    console.warn("[page/somatotherapie] ATTENTION: Aucun article à afficher!");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SomatothérapieContent posts={relevantPosts} />
    </>
  );
}
