import type { Metadata } from "next";

import { getAllPostsAsync } from "@/lib/blog";
import { filterPsychotherapyPosts } from "@/lib/therapy-articles";

import { ReikiContent } from "./ReikiContent";

// Rendu dynamique pour garantir que les articles sont toujours à jour
export const dynamic = 'force-dynamic';

/**
 * Métadonnées SEO optimisées pour la page reiki
 */
export const metadata: Metadata = {
  title: "Reiki - Rééquilibrez vos énergies",
  description: "Découvrez le reiki avec Nathalie Duquenne : un soin énergétique par imposition des mains pour rééquilibrer les énergies du corps et favoriser l'auto-guérison. Séances individuelles à Saint-Julien-du-Sault.",
  keywords: [
    "reiki",
    "soin énergétique",
    "imposition des mains",
    "rééquilibrage énergétique",
    "auto-guérison",
    "bien-être",
    "détente profonde",
    "énergie vitale",
    "chakras",
    "relaxation",
    "Nathalie Duquenne",
    "Saint-Julien-du-Sault",
    "Yonne",
    "Bourgogne",
  ],
  openGraph: {
    title: "Reiki - Rééquilibrez vos énergies",
    description: "Un soin énergétique par imposition des mains pour rééquilibrer les énergies du corps et favoriser l'auto-guérison.",
    type: "website",
    url: "https://appreciezvotrevie.fr/reiki",
    images: [
      {
        url: "https://appreciezvotrevie.fr/images/reiki-hero.webp",
        width: 1200,
        height: 630,
        alt: "Reiki - Appréciez Votre Vie - Nathalie Duquenne",
      },
    ],
    locale: "fr_FR",
    siteName: "Appréciez Votre Vie",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reiki - Rééquilibrez vos énergies",
    description: "Découvrez le reiki : un soin énergétique doux pour rééquilibrer vos énergies et favoriser votre bien-être.",
    images: ["https://appreciezvotrevie.fr/images/reiki-hero.webp"],
  },
  alternates: {
    canonical: "https://appreciezvotrevie.fr/reiki",
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
 */
function getJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://appreciezvotrevie.fr/reiki#webpage",
        url: "https://appreciezvotrevie.fr/reiki",
        name: "Reiki - Rééquilibrez vos énergies",
        description:
          "Découvrez le reiki avec Nathalie Duquenne : un soin énergétique par imposition des mains pour rééquilibrer les énergies du corps.",
        isPartOf: {
          "@id": "https://appreciezvotrevie.fr/#website",
        },
        about: {
          "@id": "https://appreciezvotrevie.fr/reiki#service",
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
              name: "Reiki",
              item: "https://appreciezvotrevie.fr/reiki",
            },
          ],
        },
        datePublished: "2024-01-01",
        dateModified: new Date().toISOString(),
        inLanguage: "fr-FR",
      },
      {
        "@type": "Service",
        "@id": "https://appreciezvotrevie.fr/reiki#service",
        name: "Reiki",
        description:
          "Séances de reiki pour rééquilibrer les énergies, favoriser la détente profonde et soutenir l'auto-guérison naturelle du corps.",
        provider: {
          "@type": "Person",
          "@id": "https://appreciezvotrevie.fr/a-propos#person",
          name: "Nathalie Duquenne",
        },
        serviceType: "Reiki",
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
      },
      {
        "@type": "FAQPage",
        "@id": "https://appreciezvotrevie.fr/reiki#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Qu'est-ce que le reiki ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Le reiki est une méthode de soin énergétique d'origine japonaise qui consiste à canaliser l'énergie universelle par imposition des mains. Cette énergie favorise l'auto-guérison, rééquilibre les centres énergétiques du corps et procure une profonde détente physique et mentale.",
            },
          },
          {
            "@type": "Question",
            name: "Quels sont les bienfaits du reiki ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Le reiki procure une détente profonde, soulage les tensions physiques et émotionnelles, rééquilibre les énergies du corps et renforce le bien-être global. Il peut accompagner la gestion du stress, améliorer le sommeil et soutenir le processus de guérison naturelle.",
            },
          },
          {
            "@type": "Question",
            name: "Faut-il croire au reiki pour que ça fonctionne ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Non, le reiki agit indépendamment de vos croyances. Il suffit d'être ouvert et réceptif. Beaucoup de personnes sceptiques au départ sont surprises par la profondeur de la détente ressentie lors d'une séance.",
            },
          },
        ],
      },
    ],
  };
}

/**
 * Page de présentation du reiki
 * Server Component qui exporte les métadonnées et récupère les articles
 */
export default async function ReikiPage() {
  const jsonLd = getJsonLd();

  console.warn("[page/reiki] Chargement de la page");

  const allPosts = await getAllPostsAsync();
  console.warn(`[page/reiki] ${allPosts.length} articles récupérés du blog`);

  const relevantPosts = filterPsychotherapyPosts(allPosts, 50);
  console.warn(
    `[page/reiki] ${relevantPosts.length} articles filtrés pour affichage`
  );

  if (relevantPosts.length === 0) {
    console.warn("[page/reiki] ATTENTION: Aucun article à afficher!");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReikiContent posts={relevantPosts} />
    </>
  );
}
