import type { Metadata } from "next";

import { getAllPostsAsync } from "@/lib/blog";
import { filterHypnosisPosts } from "@/lib/therapy-articles";

import { SomatotherapieContent } from "./SomatotherapieContent";

// Rendu dynamique pour garantir que les articles sont toujours à jour
export const dynamic = 'force-dynamic';

/**
 * Metadonnees SEO optimisees pour la page somatotherapie
 */
export const metadata: Metadata = {
  title: "Somatotherapie - Liberez les memoires de votre corps",
  description: "Decouvrez la somatotherapie avec Nathalie Duquenne : une approche corporelle globale pour liberer les tensions, les blocages emotionnels inscrits dans le corps et retrouver votre vitalite. Seances individuelles a Saint-Julien-du-Sault et en visioconference.",
  keywords: [
    "somatotherapie",
    "therapie corporelle",
    "memoire du corps",
    "liberation emotionnelle",
    "tensions musculaires",
    "approche psychocorporelle",
    "relaxation profonde",
    "bien-etre corporel",
    "equilibre corps esprit",
    "massage therapeutique",
    "toucher conscient",
    "Nathalie Duquenne",
    "Saint-Julien-du-Sault",
    "Yonne",
    "Bourgogne",
    "seance en ligne",
    "visioconference",
  ],
  openGraph: {
    title: "Somatotherapie - Liberez les memoires de votre corps",
    description: "Une approche corporelle globale pour liberer les tensions et les blocages emotionnels inscrits dans le corps.",
    type: "website",
    url: "https://appreciezvotrevie.fr/somatotherapie",
    images: [
      {
        url: "https://appreciezvotrevie.fr/images/somatotherapie-hero.webp",
        width: 1200,
        height: 630,
        alt: "Somatotherapie - Appreciez Votre Vie - Nathalie Duquenne",
      },
    ],
    locale: "fr_FR",
    siteName: "Appreciez Votre Vie",
  },
  twitter: {
    card: "summary_large_image",
    title: "Somatotherapie - Liberez les memoires de votre corps",
    description: "Decouvrez une approche corporelle pour liberer les tensions et retrouver votre vitalite.",
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
 * Donnees structurees JSON-LD pour le referencement
 * Schema.org Service + WebPage pour la somatotherapie
 */
function getJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://appreciezvotrevie.fr/somatotherapie#webpage",
        url: "https://appreciezvotrevie.fr/somatotherapie",
        name: "Somatotherapie - Liberez les memoires de votre corps",
        description:
          "Decouvrez la somatotherapie avec Nathalie Duquenne : une approche corporelle globale pour liberer les tensions et les blocages emotionnels.",
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
              name: "Somatotherapie",
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
        name: "Somatotherapie",
        description:
          "Seances de somatotherapie pour liberer les tensions, les blocages emotionnels inscrits dans le corps et retrouver vitalite et equilibre.",
        provider: {
          "@type": "Person",
          "@id": "https://appreciezvotrevie.fr/a-propos#person",
          name: "Nathalie Duquenne",
        },
        serviceType: "Somatotherapie",
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
          name: "Services de somatotherapie",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Seance individuelle en cabinet",
                description:
                  "Seance de somatotherapie en presentiel a Saint-Julien-du-Sault",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Seance en visioconference",
                description:
                  "Seance de somatotherapie a distance par visioconference",
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
            name: "Qu'est-ce que la somatotherapie ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La somatotherapie est une approche therapeutique qui prend en compte le corps dans sa globalite. Elle part du principe que nos experiences emotionnelles, nos traumatismes et notre vecu se memorisent dans le corps sous forme de tensions, de blocages ou de douleurs. En travaillant avec le corps, on peut liberer ces memoires et retrouver l'equilibre.",
            },
          },
          {
            "@type": "Question",
            name: "Comment se deroule une seance de somatotherapie ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Une seance dure environ 1h a 1h30. Elle commence par un temps d'echange pour comprendre votre etat du moment. Ensuite, le travail corporel commence : toucher conscient, mobilisations douces, exercices de respiration. La seance se termine par un temps d'integration et d'echange sur les ressentis.",
            },
          },
          {
            "@type": "Question",
            name: "La somatotherapie est-elle faite pour moi ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La somatotherapie s'adresse a toute personne qui ressent des tensions chroniques, des blocages emotionnels, du stress ou qui souhaite reconnecter avec son corps. Elle est particulierement indiquee apres un traumatisme, un burn-out ou en complement d'un suivi psychologique.",
            },
          },
        ],
      },
    ],
  };
}

/**
 * Page de presentation de la somatotherapie
 * Server Component qui exporte les metadonnees et recupere les articles
 */
export default async function SomatotherapiePage() {
  const jsonLd = getJsonLd();

  console.warn("[page/somatotherapie] Chargement de la page");

  // Recuperer tous les articles et filtrer ceux pertinents
  const allPosts = await getAllPostsAsync();
  console.warn(`[page/somatotherapie] ${allPosts.length} articles recuperes du blog`);

  const relevantPosts = filterHypnosisPosts(allPosts, 50);
  console.warn(
    `[page/somatotherapie] ${relevantPosts.length} articles filtres pour affichage`
  );

  if (relevantPosts.length === 0) {
    console.warn("[page/somatotherapie] ATTENTION: Aucun article a afficher!");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SomatotherapieContent posts={relevantPosts} />
    </>
  );
}
