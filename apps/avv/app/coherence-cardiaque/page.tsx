import type { Metadata } from "next";

import { getAllPostsAsync } from "@/lib/blog";
import { filterPsychotherapyPosts } from "@/lib/therapy-articles";

import { CoherenceCardiaqueContent } from "./CoherenceCardiaqueContent";

// Rendu dynamique pour garantir que les articles sont toujours à jour
export const dynamic = 'force-dynamic';

/**
 * Métadonnées SEO optimisées pour la page cohérence cardiaque
 */
export const metadata: Metadata = {
  title: "Cohérence Cardiaque - Harmonisez votre corps et votre esprit",
  description: "Découvrez la cohérence cardiaque avec Nathalie Duquenne : des exercices de respiration rythmée pour réguler le stress, améliorer la concentration et renforcer le système immunitaire. Séances individuelles à Saint-Julien-du-Sault.",
  keywords: [
    "cohérence cardiaque",
    "respiration rythmée",
    "gestion du stress",
    "variabilité cardiaque",
    "bien-être",
    "régulation émotionnelle",
    "système nerveux autonome",
    "relaxation",
    "concentration",
    "système immunitaire",
    "sommeil",
    "Nathalie Duquenne",
    "Saint-Julien-du-Sault",
    "Yonne",
    "Bourgogne",
  ],
  openGraph: {
    title: "Cohérence Cardiaque - Harmonisez votre corps et votre esprit",
    description: "Des exercices de respiration rythmée pour réguler le stress, améliorer la concentration et renforcer le système immunitaire.",
    type: "website",
    url: "https://appreciezvotrevie.fr/coherence-cardiaque",
    images: [
      {
        url: "https://appreciezvotrevie.fr/images/coherence-cardiaque-hero.webp",
        width: 1200,
        height: 630,
        alt: "Cohérence Cardiaque - Appréciez Votre Vie - Nathalie Duquenne",
      },
    ],
    locale: "fr_FR",
    siteName: "Appréciez Votre Vie",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cohérence Cardiaque - Harmonisez votre corps et votre esprit",
    description: "Des exercices de respiration rythmée pour réguler le stress et renforcer votre bien-être.",
    images: ["https://appreciezvotrevie.fr/images/coherence-cardiaque-hero.webp"],
  },
  alternates: {
    canonical: "https://appreciezvotrevie.fr/coherence-cardiaque",
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
        "@id": "https://appreciezvotrevie.fr/coherence-cardiaque#webpage",
        url: "https://appreciezvotrevie.fr/coherence-cardiaque",
        name: "Cohérence Cardiaque - Harmonisez votre corps et votre esprit",
        description:
          "Découvrez la cohérence cardiaque avec Nathalie Duquenne : des exercices de respiration rythmée pour réguler le stress et améliorer votre bien-être.",
        isPartOf: {
          "@id": "https://appreciezvotrevie.fr/#website",
        },
        about: {
          "@id": "https://appreciezvotrevie.fr/coherence-cardiaque#service",
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
              name: "Cohérence Cardiaque",
              item: "https://appreciezvotrevie.fr/coherence-cardiaque",
            },
          ],
        },
        datePublished: "2024-01-01",
        dateModified: new Date().toISOString(),
        inLanguage: "fr-FR",
      },
      {
        "@type": "Service",
        "@id": "https://appreciezvotrevie.fr/coherence-cardiaque#service",
        name: "Cohérence Cardiaque",
        description:
          "Séances de cohérence cardiaque pour réguler le stress, améliorer le sommeil, renforcer la gestion émotionnelle et le système immunitaire.",
        provider: {
          "@type": "Person",
          "@id": "https://appreciezvotrevie.fr/a-propos#person",
          name: "Nathalie Duquenne",
        },
        serviceType: "Cohérence Cardiaque",
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
        "@id": "https://appreciezvotrevie.fr/coherence-cardiaque#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Qu'est-ce que la cohérence cardiaque ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La cohérence cardiaque est une technique de respiration rythmée qui permet de synchroniser le rythme cardiaque avec la respiration. Cette synchronisation active le système nerveux parasympathique, favorisant un état de calme, de clarté mentale et de bien-être global.",
            },
          },
          {
            "@type": "Question",
            name: "Quels sont les bienfaits de la cohérence cardiaque ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Les bienfaits sont nombreux et scientifiquement prouvés : réduction du stress et de l'anxiété, amélioration du sommeil, meilleure gestion émotionnelle, renforcement du système immunitaire, baisse de la tension artérielle et amélioration de la concentration.",
            },
          },
          {
            "@type": "Question",
            name: "Combien de temps faut-il pratiquer ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "La pratique recommandée est de 3 fois 5 minutes par jour (matin, midi et soir) à raison de 6 respirations par minute. C'est la fameuse règle du 365 : 3 fois par jour, 6 respirations par minute, pendant 5 minutes. Les effets se font sentir dès les premières séances.",
            },
          },
        ],
      },
    ],
  };
}

/**
 * Page de présentation de la cohérence cardiaque
 * Server Component qui exporte les métadonnées et récupère les articles
 */
export default async function CoherenceCardiaquePage() {
  const jsonLd = getJsonLd();

  console.warn("[page/coherence-cardiaque] Chargement de la page");

  const allPosts = await getAllPostsAsync();
  console.warn(
    `[page/coherence-cardiaque] ${allPosts.length} articles récupérés du blog`
  );

  const relevantPosts = filterPsychotherapyPosts(allPosts, 50);
  console.warn(
    `[page/coherence-cardiaque] ${relevantPosts.length} articles filtrés pour affichage`
  );

  if (relevantPosts.length === 0) {
    console.warn(
      "[page/coherence-cardiaque] ATTENTION: Aucun article à afficher!"
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CoherenceCardiaqueContent posts={relevantPosts} />
    </>
  );
}
