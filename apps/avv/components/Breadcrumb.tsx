/**
 * Composant Breadcrumb avec données structurées
 * Affiche un fil d'Ariane visuel avec schema.org BreadcrumbList
 */
import Link from 'next/link';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  // Toujours inclure l'accueil en premier
  const fullItems: BreadcrumbItem[] = [
    { name: 'Accueil', href: '/' },
    ...items,
  ];

  // Génération du schema JSON-LD
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://appreciezvotrevie.fr${item.href}`,
    })),
  };

  return (
    <>
      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb visuel */}
      <nav
        aria-label="Fil d'Ariane"
        className={`text-sm ${className}`}
      >
        <ol className="flex flex-wrap items-center gap-1">
          {fullItems.map((item, index) => {
            const isLast = index === fullItems.length - 1;

            return (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <span className="text-gold mx-2 select-none" aria-hidden="true">
                    ›
                  </span>
                )}
                {isLast ? (
                  <span
                    className="text-ivory/70"
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-ivory/50 hover:text-gold transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/**
 * Composant pour générer uniquement les données structurées (sans affichage)
 * Utile pour les pages où le breadcrumb visuel n'est pas souhaité
 */
export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const fullItems: BreadcrumbItem[] = [
    { name: 'Accueil', href: '/' },
    ...items,
  ];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://appreciezvotrevie.fr${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}
