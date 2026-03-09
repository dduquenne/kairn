/**
 * Appréciez Votre Vie geo page SEO configuration
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
  baseUrl: 'https://appreciezvotrevie.fr',

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
      id: 'sophrologie',
      label: 'Sophrologie & Relaxation',
      slugPrefix: 'sophrologie',
      serviceHref: '/sophrologie',
      schemaType: 'MedicalBusiness',
    },
    {
      id: 'somatotherapie',
      label: 'Somatothérapie',
      slugPrefix: 'somatotherapie',
      serviceHref: '/somatotherapie',
      schemaType: 'MedicalBusiness',
    },
    {
      id: 'breathwork',
      label: 'Breathwork & Rebirth',
      slugPrefix: 'breathwork',
      serviceHref: '/breathwork',
      schemaType: 'Event',
    },
  ],

  pages: [
    // Sophrologie pages
    { serviceId: 'sophrologie', locationSlug: 'yonne' },
    { serviceId: 'sophrologie', locationSlug: 'auxerre' },
    { serviceId: 'sophrologie', locationSlug: 'sens' },
    { serviceId: 'sophrologie', locationSlug: 'joigny' },
    { serviceId: 'sophrologie', locationSlug: 'migennes' },
    // Somatothérapie pages
    { serviceId: 'somatotherapie', locationSlug: 'yonne' },
    { serviceId: 'somatotherapie', locationSlug: 'auxerre' },
    { serviceId: 'somatotherapie', locationSlug: 'sens' },
    { serviceId: 'somatotherapie', locationSlug: 'joigny' },
    { serviceId: 'somatotherapie', locationSlug: 'migennes' },
    // Breathwork pages
    { serviceId: 'breathwork', locationSlug: 'yonne' },
    { serviceId: 'breathwork', locationSlug: 'bourgogne' },
  ],

  hubPages: [
    { slug: 'yonne', priority: 0.95 },
    { slug: 'therapies', priority: 0.95 },
  ],

  redirects: [
    { source: 'relaxologue-yonne', destination: 'sophrologie-yonne', permanent: true },
    { source: 'relaxologue-auxerre', destination: 'sophrologie-auxerre', permanent: true },
    { source: 'relaxologue-sens', destination: 'sophrologie-sens', permanent: true },
    { source: 'relaxologue-joigny', destination: 'sophrologie-joigny', permanent: true },
    {
      source: 'relaxologue-migennes',
      destination: 'sophrologie-migennes',
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
    name: 'Nathalie Duquenne',
    jobTitle: 'Sophrologue, Relaxologue, Somatothérapeute',
  },
});
