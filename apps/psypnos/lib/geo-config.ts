/**
 * Psypnos geo page SEO configuration
 *
 * Defines all geographic locations, services, and page combinations
 * for local SEO landing pages. Used by sitemap, structured data,
 * and redirect generation.
 *
 * @see packages/config/src/geo.ts for types and helpers
 */

import { defineGeoConfig } from '@kairn/config';
import type { GeoConfig } from '@kairn/config';

export const geoConfig: GeoConfig = defineGeoConfig({
  baseUrl: 'https://psypnos.fr',

  locations: [
    {
      name: 'Yonne',
      slug: 'yonne',
      type: 'department',
      departmentCode: '89',
      wikiUrl: 'https://fr.wikipedia.org/wiki/Yonne_(d%C3%A9partement)',
    },
    {
      name: 'Auxerre',
      slug: 'auxerre',
      type: 'city',
      departmentCode: '89',
      wikiUrl: 'https://fr.wikipedia.org/wiki/Auxerre',
      distance: '40 km',
      duration: '40 min en voiture',
      directions: 'Via A6 sortie Joigny puis D943 direction Saint-Julien-du-Sault.',
    },
    {
      name: 'Sens',
      slug: 'sens',
      type: 'city',
      departmentCode: '89',
      wikiUrl: 'https://fr.wikipedia.org/wiki/Sens_(Yonne)',
      distance: '30 km',
      duration: '30 min en voiture',
      directions: 'Via D606 direction Saint-Julien-du-Sault.',
    },
    {
      name: 'Joigny',
      slug: 'joigny',
      type: 'city',
      departmentCode: '89',
      wikiUrl: 'https://fr.wikipedia.org/wiki/Joigny',
      distance: '15 km',
      duration: '15 min en voiture',
      directions: 'Via D20 direction Saint-Julien-du-Sault.',
    },
    {
      name: 'Migennes',
      slug: 'migennes',
      type: 'city',
      departmentCode: '89',
      wikiUrl: 'https://fr.wikipedia.org/wiki/Migennes',
      distance: '20 km',
      duration: '20 min en voiture',
      directions: 'Via D943 direction Saint-Julien-du-Sault.',
    },
    {
      name: 'Bourgogne',
      slug: 'bourgogne',
      type: 'region',
      wikiUrl: 'https://fr.wikipedia.org/wiki/Bourgogne-Franche-Comt%C3%A9',
    },
  ],

  services: [
    {
      id: 'psychotherapie',
      label: 'Psychothérapie',
      slugPrefix: 'psychotherapie',
      serviceHref: '/psychotherapie',
      schemaType: 'MedicalBusiness',
    },
    {
      id: 'hypnose',
      label: 'Hypnose ericksonienne',
      slugPrefix: 'hypnose',
      serviceHref: '/hypnose',
      schemaType: 'MedicalBusiness',
    },
    {
      id: 'respiration',
      label: 'Respiration holotropique',
      slugPrefix: 'respiration-holotropique',
      serviceHref: '/respiration-holotropique',
      schemaType: 'Event',
    },
  ],

  pages: [
    // Psychothérapie pages
    { serviceId: 'psychotherapie', locationSlug: 'yonne' },
    { serviceId: 'psychotherapie', locationSlug: 'auxerre' },
    { serviceId: 'psychotherapie', locationSlug: 'sens' },
    { serviceId: 'psychotherapie', locationSlug: 'joigny' },
    { serviceId: 'psychotherapie', locationSlug: 'migennes' },
    // Hypnose pages
    { serviceId: 'hypnose', locationSlug: 'yonne' },
    { serviceId: 'hypnose', locationSlug: 'auxerre' },
    { serviceId: 'hypnose', locationSlug: 'sens' },
    { serviceId: 'hypnose', locationSlug: 'joigny' },
    { serviceId: 'hypnose', locationSlug: 'migennes' },
    // Respiration pages
    { serviceId: 'respiration', locationSlug: 'yonne' },
    { serviceId: 'respiration', locationSlug: 'bourgogne' },
  ],

  hubPages: [
    { slug: 'yonne', priority: 0.95 },
    { slug: 'therapies', priority: 0.95 },
  ],

  redirects: [
    { source: 'psychotherapeute-yonne', destination: 'psychotherapie-yonne', permanent: true },
    { source: 'psychotherapeute-auxerre', destination: 'psychotherapie-auxerre', permanent: true },
    { source: 'psychotherapeute-sens', destination: 'psychotherapie-sens', permanent: true },
    { source: 'psychotherapeute-joigny', destination: 'psychotherapie-joigny', permanent: true },
    {
      source: 'psychotherapeute-migennes',
      destination: 'psychotherapie-migennes',
      permanent: true,
    },
  ],

  practiceLocation: {
    address: "Le Moulin d'en Bas",
    city: 'Saint-Julien-du-Sault',
    postalCode: '89330',
    country: 'FR',
    coordinates: { lat: 48.0324, lng: 3.2917 },
  },

  practitioner: {
    name: 'David Duquenne',
    jobTitle: 'Thérapeute',
  },
});
