import type { Metadata } from 'next';

import { AProposContent } from './AProposContent';

// SEO : ISR avec revalidation toutes les 24h pour un meilleur référencement
export const revalidate = 86400;

/**
 * Métadonnées SEO optimisées pour la page biographique
 */
export const metadata: Metadata = {
  title: 'À propos - Nathalie Duquenne, Sophrologie & Somatothérapie',
  description:
    'Découvrez le parcours de Nathalie Duquenne : sophrologue, relaxologue et somatothérapeute certifiée. Formée en breathwork, rebirth, cohérence cardiaque et reiki, elle vous accompagne à Saint-Julien-du-Sault dans l\'Yonne.',
  keywords: [
    'Nathalie Duquenne',
    'sophrologue Yonne',
    'relaxologue',
    'somatothérapeute',
    'breathwork rebirth',
    'cohérence cardiaque',
    'reiki',
    'sophrologie Yonne',
    'somatothérapie',
    'bien-être',
    'relaxation évolutive',
    'Appréciez Votre Vie',
    'Saint-Julien-du-Sault sophrologue',
  ],
  openGraph: {
    title: 'Nathalie Duquenne - Sophrologue, Relaxologue & Somatothérapeute',
    description:
      'Sophrologue et somatothérapeute certifiée, Nathalie Duquenne vous accompagne vers le bien-être et la reconnexion à soi. Découvrez son parcours et ses certifications.',
    type: 'profile',
    url: 'https://appreciezvotrevie.fr/a-propos',
    images: [
      {
        url: 'https://appreciezvotrevie.fr/images/Nathalie_Duquenne.webp',
        width: 1029,
        height: 973,
        alt: 'Nathalie Duquenne - Sophrologie & Somatothérapie',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nathalie Duquenne - Sophrologue & Somatothérapeute',
    description:
      'Découvrez le parcours de Nathalie Duquenne, sophrologue, relaxologue et somatothérapeute certifiée à Saint-Julien-du-Sault dans l\'Yonne.',
    images: ['https://appreciezvotrevie.fr/images/Nathalie_Duquenne.webp'],
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/a-propos',
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
 * Schema.org ProfilePage + Person pour Nathalie Duquenne
 */
function getJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': 'https://appreciezvotrevie.fr/a-propos#webpage',
        url: 'https://appreciezvotrevie.fr/a-propos',
        name: 'À propos - Nathalie Duquenne, Sophrologie & Somatothérapie',
        description:
          'Découvrez le parcours de Nathalie Duquenne : sophrologue, relaxologue et somatothérapeute certifiée.',
        isPartOf: {
          '@id': 'https://appreciezvotrevie.fr/#website',
        },
        mainEntity: {
          '@id': 'https://appreciezvotrevie.fr/a-propos#person',
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Accueil',
              item: 'https://appreciezvotrevie.fr',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'À propos',
              item: 'https://appreciezvotrevie.fr/a-propos',
            },
          ],
        },
        datePublished: '2024-01-01',
        dateModified: new Date().toISOString(),
        inLanguage: 'fr-FR',
      },
      {
        '@type': 'Person',
        '@id': 'https://appreciezvotrevie.fr/a-propos#person',
        name: 'Nathalie Duquenne',
        givenName: 'Nathalie',
        familyName: 'Duquenne',
        jobTitle: 'Sophrologue, Relaxologue, Somatothérapeute',
        description:
          'Sophrologue, relaxologue et somatothérapeute certifiée. Formée en breathwork & rebirth, cohérence cardiaque et reiki. Accompagnement vers le bien-être et la reconnexion à soi.',
        url: 'https://appreciezvotrevie.fr/a-propos',
        image: {
          '@type': 'ImageObject',
          url: 'https://appreciezvotrevie.fr/images/Nathalie_Duquenne.webp',
          width: 1029,
          height: 973,
          caption: 'Nathalie Duquenne - Sophrologie & Somatothérapie',
        },
        sameAs: ['https://appreciezvotrevie.fr'],
        worksFor: {
          '@type': 'MedicalBusiness',
          '@id': 'https://appreciezvotrevie.fr/#organization',
          name: 'Appréciez Votre Vie',
          url: 'https://appreciezvotrevie.fr',
        },
        knowsAbout: [
          'Sophrologie',
          'Relaxation évolutive',
          'Somatothérapie',
          'Techniques psycho-corporelles',
          'Breathwork & Rebirth',
          'Cohérence cardiaque',
          'Reiki',
        ],
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
            name: 'Isthme',
            description: 'Centre de formation en sophrologie, somatothérapie et breathwork',
          },
          {
            '@type': 'Organization',
            name: 'Cohérence Cardiaque France',
            description: 'Formation en cohérence cardiaque',
          },
          {
            '@type': 'Organization',
            name: 'Silva International Inc.',
            description: 'Formation La Méthode Silva',
          },
        ],
        hasCredential: [
          {
            '@type': 'EducationalOccupationalCredential',
            name: 'Formation Breathwork & Rebirth',
            credentialCategory: 'Certificate',
            dateCreated: '2023',
            recognizedBy: { '@type': 'Organization', name: 'Isthme' },
          },
          {
            '@type': 'EducationalOccupationalCredential',
            name: 'Certification en sophrologie',
            credentialCategory: 'Certificate',
            dateCreated: '2022',
            recognizedBy: { '@type': 'Organization', name: 'Isthme' },
          },
          {
            '@type': 'EducationalOccupationalCredential',
            name: 'Certification en somatothérapie et techniques psycho-corporelles',
            credentialCategory: 'Certificate',
            dateCreated: '2020',
            recognizedBy: { '@type': 'Organization', name: 'Isthme' },
          },
          {
            '@type': 'EducationalOccupationalCredential',
            name: 'Certification Pratique de relaxation évolutive - Sophrologie pratique',
            credentialCategory: 'Certificate',
            dateCreated: '2018',
            recognizedBy: { '@type': 'Organization', name: 'Isthme' },
          },
          {
            '@type': 'EducationalOccupationalCredential',
            name: 'Formation La Méthode Silva',
            credentialCategory: 'Certificate',
            dateCreated: '2017',
            recognizedBy: { '@type': 'Organization', name: 'Silva International Inc.' },
          },
          {
            '@type': 'EducationalOccupationalCredential',
            name: 'Certifiée Coach en Cohérence Cardiaque',
            credentialCategory: 'Certificate',
            dateCreated: '2016',
            recognizedBy: { '@type': 'Organization', name: 'Cohérence Cardiaque France' },
          },
          {
            '@type': 'EducationalOccupationalCredential',
            name: 'Praticienne Reiki (niveaux 1, 2 et 3)',
            credentialCategory: 'Certificate',
            dateCreated: '2015',
          },
        ],
      },
    ],
  };
}

/**
 * Page biographique de Nathalie Duquenne
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
