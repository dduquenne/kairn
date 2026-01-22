// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Seminar Registration Constants
 */

import type { FormField, SeminarRegistrationFormState } from "./types";

export const COUNTRY_LIST = [
  "France",
  "Belgique",
  "Suisse",
  "Luxembourg",
  "Espagne",
  "Italie",
  "Allemagne",
  "Angleterre",
  "Pays-Bas",
  "Portugal",
  "Canada",
] as const;

export const REASSURANCE_MESSAGES: Record<FormField, string> = {
  firstName: "Merci, ce prénom nous aidera à mieux vous accueillir.",
  lastName: "Parfait, votre nom est bien noté en toute confidentialité.",
  email: "Génial, nous pourrons vous envoyer toutes les informations utiles.",
  phone: "Nous contacterons uniquement pour des précisions liées au séminaire.",
  seminarId: "Parfait, nous notons votre choix de séminaire.",
  firstTime: "Nous sommes impatients de faire votre connaissance.",
  precisions: "Vos précisions nous aideront à mieux vous accueillir.",
  newsletterOptIn:
    "Merci, nous vous tiendrons informé·e des prochains séminaires via notre newsletter.",
  consent: "Merci d'avoir accepté ces conditions d'inscription.",
  birthYear: "Parfait, c'est bien noté.",
  sex: "Information notée, merci.",
  sexOther: "Merci pour cette précision.",
  addressStreet: "Adresse notée.",
  addressZip: "Merci, c'est bien noté.",
  addressCity: "Parfait.",
  addressCountry: "Pays enregistré.",
  emergencyLastName: "Nom de la personne de confiance noté.",
  emergencyFirstName: "Prénom de la personne de confiance noté.",
  emergencyPhone: "Numéro noté — uniquement utilisé en cas de besoin.",
  hasPriorWork: "Merci, nous adapterons l'accueil à votre expérience.",
  priorWorkDetails: "Parfait, ces précisions nous sont utiles.",
  consent_RGPD: "Merci pour votre confiance, vos données sont protégées conformément au RGPD.",
};

export const INITIAL_FORM_STATE: SeminarRegistrationFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  seminarId: "",
  firstTime: false,
  precisions: "",
  newsletterOptIn: false,
  consent: false,
  birthYear: "",
  sex: "",
  sexOther: "",
  addressStreet: "",
  addressZip: "",
  addressCity: "",
  addressCountry: "France",
  emergencyLastName: "",
  emergencyFirstName: "",
  emergencyPhone: "",
  hasPriorWork: false,
  priorWorkDetails: "",
  consent_RGPD: false,
};

export const ALL_FIELDS_TOUCHED: Record<FormField, boolean> = {
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  seminarId: true,
  firstTime: false,
  precisions: true,
  newsletterOptIn: false,
  consent: true,
  birthYear: true,
  sex: true,
  sexOther: true,
  addressStreet: true,
  addressZip: true,
  addressCity: true,
  addressCountry: true,
  emergencyLastName: true,
  emergencyFirstName: true,
  emergencyPhone: true,
  hasPriorWork: true,
  priorWorkDetails: true,
  consent_RGPD: true,
};

export const STORAGE_KEY = "psypnos-seminar-registration-form";

export const FORM_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const FIELD_MOTION = {
  whileFocus: { scale: 1.01 },
  whileHover: { scale: 1.005 },
};
