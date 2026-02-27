/**
 * Tests du composant GeoPage
 *
 * Vérifie que tous les libellés sont bien en français.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { GeoPage } from '../GeoPage';
import type { GeoPageProps } from '../types';

/** Props minimales pour rendre le composant */
function createDefaultProps(
  overrides: Partial<GeoPageProps> = {}
): GeoPageProps & { linkComponent?: undefined } {
  return {
    title: 'Psychothérapie à Auxerre',
    subtitle: 'Séances de psychothérapie près de chez vous',
    description: 'Trouvez un psychothérapeute qualifié.',
    service: {
      type: 'psychotherapie',
      label: 'Psychothérapie',
      href: '/psychotherapie',
    },
    location: { city: 'Auxerre', department: '89', region: 'Bourgogne' },
    breadcrumbItems: [{ name: 'Psychothérapie', href: '/psychotherapie' }],
    baseUrl: 'https://example.fr',
    mainContent: '<p>Contenu principal</p>',
    benefits: ['Réduction du stress', 'Meilleur sommeil'],
    practicalInfo: {
      distance: '30 km',
      duration: '25 min',
      directions: 'Prendre la N6 direction Sens.',
    },
    contactInfo: {
      address: '1 rue du Test',
      city: 'Saint-Julien-du-Sault',
      postalCode: '89330',
      hours: [
        { days: 'Lun-Ven', hours: '9h-19h' },
        { days: 'Sam', hours: '9h-17h' },
      ],
    },
    pricing: [{ label: 'Séance standard', price: '70 €' }],
    relatedLinks: [{ label: 'Hypnose à Auxerre', href: '/hypnose-auxerre' }],
    mapsEmbedUrl: 'https://www.google.com/maps/embed?pb=test',
    ...overrides,
  };
}

describe('GeoPage — libellés en français', () => {
  it('affiche "Localisation" comme titre de la section carte', () => {
    render(<GeoPage {...createDefaultProps()} />);

    expect(screen.getByRole('heading', { name: 'Localisation' })).toBeInTheDocument();
  });

  it('affiche "Informations pratiques"', () => {
    render(<GeoPage {...createDefaultProps()} />);

    expect(screen.getByRole('heading', { name: 'Informations pratiques' })).toBeInTheDocument();
  });

  it('affiche "Adresse"', () => {
    render(<GeoPage {...createDefaultProps()} />);

    expect(screen.getByText('Adresse')).toBeInTheDocument();
  });

  it('affiche "Horaires"', () => {
    render(<GeoPage {...createDefaultProps()} />);

    expect(screen.getByText('Horaires')).toBeInTheDocument();
  });

  it('affiche "Tarifs"', () => {
    render(<GeoPage {...createDefaultProps()} />);

    expect(screen.getByRole('heading', { name: 'Tarifs' })).toBeInTheDocument();
  });

  it('affiche "Voir aussi"', () => {
    render(<GeoPage {...createDefaultProps()} />);

    expect(screen.getByRole('heading', { name: 'Voir aussi' })).toBeInTheDocument();
  });

  it('affiche "Depuis {ville}" dans les informations pratiques', () => {
    render(<GeoPage {...createDefaultProps()} />);

    expect(screen.getByText('Depuis Auxerre')).toBeInTheDocument();
  });

  it('affiche "{service} à {ville}" comme titre de section h2', () => {
    render(<GeoPage {...createDefaultProps()} />);

    const h2 = screen.getByRole('heading', {
      name: 'Psychothérapie à Auxerre',
      level: 2,
    });
    expect(h2).toBeInTheDocument();
  });

  it('affiche "En savoir plus sur" dans les liens connexes', () => {
    render(<GeoPage {...createDefaultProps()} />);

    expect(screen.getByText(/en savoir plus sur psychothérapie/i)).toBeInTheDocument();
  });

  it('affiche "Accueil" dans le breadcrumb', () => {
    render(<GeoPage {...createDefaultProps()} />);

    expect(screen.getByText('Accueil')).toBeInTheDocument();
  });

  it('utilise "Prendre rendez-vous" comme CTA par défaut', () => {
    render(<GeoPage {...createDefaultProps()} />);

    expect(screen.getByRole('heading', { name: 'Prendre rendez-vous' })).toBeInTheDocument();
  });

  it('affiche "Témoignages de {ville}" quand des témoignages sont fournis', () => {
    render(
      <GeoPage
        {...createDefaultProps({
          testimonials: [
            {
              content: 'Très bonne expérience.',
              author: 'Marie D.',
              location: 'Auxerre',
            },
          ],
        })}
      />
    );

    expect(screen.getByRole('heading', { name: 'Témoignages de Auxerre' })).toBeInTheDocument();
  });

  it("n'affiche aucun texte anglais résiduel parmi les libellés traduits", () => {
    render(
      <GeoPage
        {...createDefaultProps({
          testimonials: [
            {
              content: 'Super.',
              author: 'Jean P.',
              location: 'Auxerre',
            },
          ],
        })}
      />
    );

    const englishLabels = [
      'Location',
      'Practical Information',
      'Address',
      'Hours',
      'Pricing',
      'See Also',
      'Testimonials from',
      'Learn more about',
      'Book Now',
    ];

    for (const label of englishLabels) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });
});
