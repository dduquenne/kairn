/**
 * Spécifications avancées pour la génération de posts sociaux pour les séminaires
 *
 * Ce fichier contient les formats, patterns et stratégies optimisés pour
 * la promotion d'événements/séminaires sur les réseaux sociaux.
 *
 * Objectifs principaux :
 * 1. Créer un sentiment d'urgence positive (places limitées)
 * 2. Mettre en valeur l'expérience transformationnelle
 * 3. Générer des inscriptions
 * 4. Respecter les contraintes déontologiques
 */

import type { ContentTone, SocialPlatform } from '../types';

// ===========================================
// Types spécifiques aux séminaires
// ===========================================

/**
 * Formats de posts Instagram pour la promotion de séminaires
 */
export type SeminarInstagramFormat =
  | 'compte_rebours' // Urgence avec décompte des jours/places
  | 'apercu_experience' // Prévisualisation de l'expérience
  | 'temoignage_passe' // Retour sur un séminaire précédent
  | 'question_reflexive' // Question qui fait réfléchir sur le besoin
  | 'liste_benefices' // Liste des bénéfices de participation
  | 'coulisses'; // Behind-the-scenes de la préparation

/**
 * Formats de posts LinkedIn pour la promotion de séminaires
 */
export type SeminarLinkedInFormat =
  | 'annonce_expert' // Annonce avec positionnement d'expertise
  | 'probleme_solution' // Problème courant + séminaire comme solution
  | 'observation_terrain' // Observation qui justifie le séminaire
  | 'invitation_reflexion' // Question pro + invitation au séminaire
  | 'programme_detaille' // Présentation structurée du programme
  | 'derniere_chance'; // Urgence professionnelle

/**
 * Formats de posts Facebook pour la promotion de séminaires
 */
export type SeminarFacebookFormat =
  | 'invitation_chaleureuse' // Ton conversationnel et accueillant
  | 'histoire_transformation' // Récit d'un participant passé
  | 'question_engagement' // Question + invitation
  | 'details_pratiques' // Infos concrètes avec CTA
  | 'derniers_jours' // Urgence bienveillante
  | 'partage_vision'; // Pourquoi ce séminaire existe

/**
 * Formats de posts Threads pour la promotion de séminaires
 */
export type SeminarThreadsFormat =
  | 'pensee_spontanee' // Réflexion naturelle sur le séminaire
  | 'micro_confession' // Partage personnel du praticien
  | 'question_ouverte' // Question sans réponse directe
  | 'fragment_anticipation' // Évocation poétique de l'expérience
  | 'rappel_humain'; // Rappel simple et authentique

/**
 * Niveau d'urgence pour les posts de séminaires
 * Plus le niveau est élevé, plus l'urgence est marquée
 */
export type SeminarUrgencyLevel = 1 | 2 | 3 | 4 | 5;

// ===========================================
// Formats Instagram pour séminaires
// ===========================================

export interface SeminarInstagramFormatSpec {
  id: SeminarInstagramFormat;
  name: string;
  description: string;
  structure: string[];
  example: string;
  bestFor: string[];
  tips: string[];
}

export const SEMINAR_INSTAGRAM_FORMATS: Record<SeminarInstagramFormat, SeminarInstagramFormatSpec> =
  {
    compte_rebours: {
      id: 'compte_rebours',
      name: 'Compte à rebours',
      description: "Créer l'urgence avec le nombre de jours ou de places restantes",
      structure: [
        'Chiffre accrocheur (jours restants ou places)',
        'Saut de ligne',
        'Contexte émotionnel (ce qui se joue)',
        'Ce que le participant va vivre',
        'Dates et informations clés',
        "CTA d'inscription urgent mais bienveillant",
        'Hashtags événement',
      ],
      example: `Plus que 5 places.

5 personnes qui vont vivre quelque chose de rare.

Un week-end pour ralentir.
Pour respirer autrement.
Pour retrouver ce qui compte vraiment.

📅 17-18 janvier
📍 Moulin d'en bas, Bourgogne

→ Lien en bio pour réserver votre place

.
.
.
#seminaire #retraite #bienetre #ressourcement`,
      bestFor: ["Dernières semaines avant l'événement", 'Places limitées', 'Urgence positive'],
      tips: [
        'Utiliser des chiffres précis (pas "quelques places")',
        "L'urgence doit rester bienveillante, pas anxiogène",
        'Rappeler les dates de manière visuelle',
      ],
    },

    apercu_experience: {
      id: 'apercu_experience',
      name: "Aperçu de l'expérience",
      description: 'Faire vivre par anticipation ce qui attend les participants',
      structure: [
        'Visualisation immersive ("Imaginez...")',
        "Description sensorielle du lieu et de l'ambiance",
        'Ce qui va se passer (sans tout révéler)',
        'La transformation possible',
        'Informations pratiques',
        'CTA invitation',
      ],
      example: `Imaginez.

Un lieu hors du temps.
Le silence. La nature.
Un groupe de 18 personnes, pas plus.

Pendant deux jours, on va respirer ensemble.
Explorer ce qui se cache derrière le bruit quotidien.
Retrouver un espace de calme intérieur.

C'est ce que propose le séminaire "Retrouver l'Essentiel".

📅 17-18 janvier | Bourgogne
💫 Places limitées

→ Lien en bio

.
.
.
#seminaire #retraite #respiration #bourgogne`,
      bestFor: ['Annoncer un nouveau séminaire', "Créer l'envie", 'Posts visuels'],
      tips: [
        'Faire appel aux sens (vue, son, ressenti)',
        'Créer un contraste avec le quotidien',
        'Laisser une part de mystère',
      ],
    },

    temoignage_passe: {
      id: 'temoignage_passe',
      name: 'Témoignage passé',
      description: "Utiliser un retour d'expérience pour illustrer la valeur",
      structure: [
        "Citation ou ressenti d'un participant (anonymisé)",
        'Contexte du séminaire passé',
        'Ce que la personne a vécu/appris',
        'Lien avec le prochain séminaire',
        'Invitation à vivre la même chose',
      ],
      example: `"Je ne m'attendais pas à ça."

C'est ce qu'elle m'a dit à la fin du dernier séminaire.

Elle était venue avec des doutes.
Elle est repartie avec quelque chose qu'elle ne sait pas vraiment nommer.
Mais quelque chose avait changé.

Le prochain séminaire a lieu les 17-18 janvier.
18 places. Un lieu magique. Une expérience unique.

→ Lien en bio pour en savoir plus

.
.
.
#seminaire #temoignage #transformation #bienetre`,
      bestFor: ['Après un séminaire réussi', 'Crédibilité', 'Connexion émotionnelle'],
      tips: [
        'Toujours anonymiser complètement',
        'Privilégier le ressenti à la description technique',
        'Ne pas faire de promesses de résultats',
      ],
    },

    question_reflexive: {
      id: 'question_reflexive',
      name: 'Question réflexive',
      description: 'Poser une question qui fait réfléchir sur le besoin',
      structure: [
        'Question qui touche un besoin profond',
        'Pause (saut de ligne)',
        'Développement de la réflexion',
        'Lien avec ce que propose le séminaire',
        'Invitation sans pression',
      ],
      example: `À quand remonte la dernière fois où vous avez vraiment déconnecté ?

Pas juste "posé le téléphone".
Vraiment déconnecté.

De la to-do list mentale.
Des obligations.
Du bruit.

Si la réponse vous échappe...
Peut-être que c'est un signe.

Le séminaire "Retrouver l'Essentiel" est fait pour ça.
17-18 janvier | 18 places

→ Lien en bio

.
.
.
#deconnexion #ressourcement #seminaire #pause`,
      bestFor: ['Créer la prise de conscience', 'Cibler un besoin', 'Engagement'],
      tips: [
        'La question doit résonner avec une douleur réelle',
        'Ne pas culpabiliser le lecteur',
        'Proposer le séminaire comme une possibilité, pas une obligation',
      ],
    },

    liste_benefices: {
      id: 'liste_benefices',
      name: 'Liste des bénéfices',
      description: 'Présenter ce que le participant va retirer du séminaire',
      structure: [
        'Accroche sur le résultat',
        'Liste de 3-5 bénéfices avec émojis',
        'Ce qui rend ce séminaire unique',
        'Informations pratiques',
        'CTA',
      ],
      example: `Ce que vous allez vivre pendant ces 2 jours :

✨ Un cadre exceptionnel, loin du quotidien
🌬️ Des pratiques de respiration transformatrices
🤝 Un groupe limité à 18 personnes
🌿 Du temps pour vous, vraiment
💫 Des outils concrets à ramener chez vous

Le séminaire "Retrouver l'Essentiel"
📅 17-18 janvier | Bourgogne

→ Réservez votre place (lien en bio)

.
.
.
#seminaire #bienfaits #retraite #ressourcement`,
      bestFor: ['Présentation claire', 'Décision rationnelle', 'Posts informatifs'],
      tips: [
        'Bénéfices concrets et tangibles',
        'Pas de promesses thérapeutiques',
        'Équilibre entre émotionnel et pratique',
      ],
    },

    coulisses: {
      id: 'coulisses',
      name: 'Coulisses',
      description: "Montrer la préparation et l'envers du décor",
      structure: [
        'Ancrage temporel ("En ce moment...")',
        'Ce qui se passe en préparation',
        "Pourquoi c'est important",
        "Lien avec l'expérience des participants",
        'Invitation',
      ],
      example: `En ce moment, je prépare le prochain séminaire.

Je choisis les musiques.
Je pense à l'ambiance.
Je visualise le groupe.

Chaque détail compte.

Parce qu'un séminaire, ce n'est pas juste un programme.
C'est un espace qu'on crée ensemble.

Il reste quelques places pour janvier.
Peut-être que l'une d'elles vous attend.

→ Lien en bio

.
.
.
#coulisses #preparation #seminaire #soin`,
      bestFor: ['Humaniser le praticien', "Créer de l'anticipation", 'Authenticité'],
      tips: [
        "Montrer l'attention au détail",
        'Rester humble et authentique',
        'Créer un lien personnel',
      ],
    },
  };

// ===========================================
// Formats LinkedIn pour séminaires
// ===========================================

export interface SeminarLinkedInFormatSpec {
  id: SeminarLinkedInFormat;
  name: string;
  description: string;
  structure: string[];
  example: string;
  bestFor: string[];
  tips: string[];
  optimalLength: { min: number; max: number };
}

export const SEMINAR_LINKEDIN_FORMATS: Record<SeminarLinkedInFormat, SeminarLinkedInFormatSpec> = {
  annonce_expert: {
    id: 'annonce_expert',
    name: 'Annonce expert',
    description: "Annoncer le séminaire avec un positionnement d'expertise",
    structure: [
      'Accroche avec observation professionnelle',
      'Constat qui justifie le séminaire',
      'Présentation du séminaire comme réponse',
      'Détails clés (dates, lieu, capacité)',
      'Lien en commentaire',
      "Question d'engagement",
    ],
    example: `En 15 ans d'accompagnement, une chose m'a frappé :

Les personnes les plus épuisées ne manquent pas de ressources.
Elles ont oublié comment y accéder.

C'est pour ça que j'ai créé ce séminaire.

"Retrouver l'Essentiel" — 17-18 janvier 2026
→ Un week-end pour ralentir et se reconnecter
→ Respiration holotropique et pratiques douces
→ 18 places maximum pour un accompagnement de qualité
→ Cadre exceptionnel en Bourgogne

Ce n'est pas une formation.
C'est une expérience.

Le programme complet est en commentaire 👇

Ça vous parle ?

#seminaire #bienetre #respiration #burnout #ressourcement`,
    bestFor: ['Annonce officielle', "Positionnement d'expertise", 'Audience professionnelle'],
    tips: [
      "Commencer par l'observation, pas par la vente",
      "Justifier l'existence du séminaire par un besoin réel",
      'Rester professionnel mais accessible',
    ],
    optimalLength: { min: 100, max: 200 },
  },

  probleme_solution: {
    id: 'probleme_solution',
    name: 'Problème-Solution',
    description: 'Identifier un problème courant et présenter le séminaire comme solution',
    structure: [
      'Description du problème (vécu commun)',
      'Amplification (conséquences)',
      'Le séminaire comme espace de transformation',
      'Ce qui sera proposé',
      'Détails pratiques',
      'CTA',
    ],
    example: `Le stress chronique ne prévient pas.

Il s'installe.
Dans les nuits trop courtes.
Dans les week-ends qui ne rechargent plus.
Dans cette sensation de courir sans jamais arriver.

Et si on prenait 2 jours ?
2 jours pour faire une vraie pause.

Le séminaire "Retrouver l'Essentiel" propose :
→ Un cadre hors du temps
→ Des pratiques de respiration profonde
→ Un groupe limité (18 personnes)
→ L'accompagnement de praticiens expérimentés

📅 17-18 janvier 2026 | Bourgogne

Lien vers le programme en commentaire.

Vous sentez que vous auriez besoin de cette pause ?

#stress #burnout #seminaire #respiration #bienetre`,
    bestFor: ['Cibler une douleur spécifique', "Créer l'urgence", 'Audience stressée'],
    tips: [
      'Le problème doit être reconnaissable',
      'La solution doit être présentée avec humilité',
      'Pas de promesse de guérison',
    ],
    optimalLength: { min: 90, max: 180 },
  },

  observation_terrain: {
    id: 'observation_terrain',
    name: 'Observation terrain',
    description: 'Partager une observation professionnelle qui mène au séminaire',
    structure: [
      "Ancrage d'expérience",
      'Pattern observé',
      'Réflexion sur ce constat',
      'Lien avec le séminaire',
      'Invitation',
    ],
    example: `Ce que j'observe depuis 15 ans :

Les personnes qui viennent me voir ne manquent pas de volonté.
Elles manquent d'espace.

→ Espace pour respirer
→ Espace pour réfléchir
→ Espace pour se retrouver

C'est exactement ce que propose le séminaire de janvier.

Deux jours hors du temps.
Un lieu ressourçant.
Des pratiques qui ouvrent cet espace intérieur.

18 places. Pas plus.
Parce que cet espace se crée aussi dans l'intimité d'un petit groupe.

Programme complet en commentaire 👇

#observation #pratique #seminaire #espace #bienetre`,
    bestFor: ['Crédibilité', 'Authenticité', 'Positionnement unique'],
    tips: [
      "L'observation doit être universelle",
      'Le séminaire doit être une réponse logique',
      "Montrer l'intention derrière la conception",
    ],
    optimalLength: { min: 80, max: 160 },
  },

  invitation_reflexion: {
    id: 'invitation_reflexion',
    name: 'Invitation réflexion',
    description: "Question professionnelle qui ouvre sur l'invitation au séminaire",
    structure: [
      'Question qui fait réfléchir',
      'Développement de la réflexion',
      'Lien avec le séminaire',
      'Ce qui sera proposé',
      'CTA ouvert',
    ],
    example: `Quand avez-vous pris du temps pour vous la dernière fois ?

Pas "fait du sport" ou "vu des amis".
Du temps pour vous.
Sans objectif. Sans to-do list.

Si la réponse est floue, vous n'êtes pas seul(e).

Le séminaire "Retrouver l'Essentiel" est conçu pour ça.
→ 2 jours hors du quotidien
→ Un cadre exceptionnel en Bourgogne
→ Des pratiques de respiration et de recentrage
→ Un groupe limité à 18 personnes

📅 17-18 janvier 2026

Infos complètes en commentaire.

Ça résonne pour vous ?

#reflexion #tempspourvous #seminaire #ressourcement`,
    bestFor: ['Engagement', 'Prise de conscience', 'Soft sell'],
    tips: [
      'La question doit toucher un besoin profond',
      'Ne pas culpabiliser',
      "L'invitation doit rester ouverte",
    ],
    optimalLength: { min: 70, max: 150 },
  },

  programme_detaille: {
    id: 'programme_detaille',
    name: 'Programme détaillé',
    description: 'Présenter le programme de manière structurée',
    structure: [
      "Accroche sur l'expérience",
      'Déroulé jour par jour (synthétique)',
      'Ce qui rend ce programme unique',
      'Informations pratiques (lieu, dates, prix)',
      'CTA clair',
    ],
    example: `Voici ce qui vous attend pendant le séminaire "Retrouver l'Essentiel" :

𝗝𝗼𝘂𝗿 𝟭 — Ralentir
→ Arrivée et installation
→ Cercle d'ouverture
→ Première session de respiration
→ Dîner en conscience

𝗝𝗼𝘂𝗿 𝟮 — Se reconnecter
→ Pratique matinale douce
→ Session de respiration holotropique
→ Intégration et partage
→ Cercle de clôture

📍 Le Moulin d'en bas, Bourgogne
📅 17-18 janvier 2026
👥 18 places maximum
💰 250€ (acompte 125€)

Programme complet et inscription → lien en commentaire

Des questions ? Je réponds en commentaire 👇

#programme #seminaire #respiration #bourgogne`,
    bestFor: ['Informer clairement', 'Décision rationnelle', 'Transparence'],
    tips: [
      'Structure claire et scannable',
      'Équilibre entre concret et évocateur',
      'Tous les détails pratiques présents',
    ],
    optimalLength: { min: 120, max: 220 },
  },

  derniere_chance: {
    id: 'derniere_chance',
    name: 'Dernière chance',
    description: "Créer l'urgence pour les dernières places",
    structure: [
      "Chiffre d'urgence",
      'Rappel de ce qui se joue',
      'Pourquoi maintenant',
      'CTA direct',
    ],
    example: `Plus que 3 places.

Le séminaire "Retrouver l'Essentiel" est presque complet.

Si vous hésitez depuis quelques semaines...
Si vous sentez que vous avez besoin de cette pause...
C'est peut-être le moment de décider.

📅 17-18 janvier | Bourgogne
👥 18 places au total, 15 déjà réservées

Inscription → lien en commentaire

Prêt(e) à vous accorder ces 2 jours ?

#derniereplaces #seminaire #decision #janvier`,
    bestFor: ['Derniers jours avant clôture', 'Urgence positive', 'Conversion'],
    tips: [
      "L'urgence doit être réelle",
      'Rester bienveillant, pas pressant',
      'Faciliter la décision',
    ],
    optimalLength: { min: 60, max: 120 },
  },
};

// ===========================================
// Formats Facebook pour séminaires
// ===========================================

export interface SeminarFacebookFormatSpec {
  id: SeminarFacebookFormat;
  name: string;
  description: string;
  structure: string[];
  example: string;
  bestFor: string[];
  tips: string[];
  optimalLength: { min: number; max: number };
}

export const SEMINAR_FACEBOOK_FORMATS: Record<SeminarFacebookFormat, SeminarFacebookFormatSpec> = {
  invitation_chaleureuse: {
    id: 'invitation_chaleureuse',
    name: 'Invitation chaleureuse',
    description: 'Ton conversationnel et accueillant pour inviter',
    structure: [
      'Ouverture personnelle et chaleureuse',
      'Présentation du séminaire',
      'Ce qui vous y attend',
      'Détails pratiques',
      'Invitation à échanger',
    ],
    example: `J'ai le plaisir de vous annoncer la prochaine édition du séminaire "Retrouver l'Essentiel" !

Deux jours pour souffler.
Deux jours pour se retrouver.
Deux jours hors du temps.

Au programme :
✨ Pratiques de respiration
🌿 Temps de partage en petit groupe
💫 Un cadre magnifique en Bourgogne

📅 17-18 janvier 2026
📍 Le Moulin d'en bas
👥 18 places maximum

Je serais ravi de vous y accueillir.
N'hésitez pas à me poser vos questions en commentaire !

👉 Plus d'infos : [lien]

#seminaire #bienetre #bourgogne`,
    bestFor: ['Annonce générale', 'Communauté existante', 'Ton chaleureux'],
    tips: [
      'Ton personnel et accessible',
      'Inviter au dialogue',
      'Facebook aime les interactions : encourager les questions',
    ],
    optimalLength: { min: 60, max: 120 },
  },

  histoire_transformation: {
    id: 'histoire_transformation',
    name: 'Histoire de transformation',
    description: "Récit anonymisé d'un participant pour illustrer la valeur",
    structure: [
      'Début du récit (situation avant)',
      'Le séminaire vécu',
      'Ce qui a changé',
      'Lien avec le prochain séminaire',
      'Invitation',
    ],
    example: `Elle est arrivée en disant : "Je ne sais plus où j'en suis."

Deux jours plus tard, quelque chose avait changé.

Pas une révélation spectaculaire.
Plutôt un silence intérieur retrouvé.
Une respiration plus profonde.
Un peu plus de clarté.

C'est ça, l'expérience du séminaire.

Le prochain a lieu les 17-18 janvier.
18 places pour vivre ça ensemble.

📍 Bourgogne
💫 Infos et inscription : [lien]

Vous avez des questions ? Je réponds avec plaisir !

#temoignage #transformation #seminaire`,
    bestFor: ['Crédibilité', 'Émotion', 'Après un séminaire réussi'],
    tips: [
      'Anonymisation totale',
      'Focus sur le ressenti, pas les symptômes',
      'Pas de promesses de résultats',
    ],
    optimalLength: { min: 70, max: 130 },
  },

  question_engagement: {
    id: 'question_engagement',
    name: 'Question engagement',
    description: 'Poser une question pour engager puis inviter',
    structure: [
      'Question qui fait réfléchir',
      'Développement',
      'Le séminaire comme possibilité',
      'Invitation ouverte',
    ],
    example: `Vous aussi, vous avez parfois l'impression de courir sans jamais arriver ?

De cocher des cases sans vraiment savoir pourquoi ?

Si ça vous parle...

Le séminaire "Retrouver l'Essentiel" est fait pour ces moments-là.
2 jours pour faire une vraie pause.
Pour respirer autrement.
Pour retrouver ce qui compte.

📅 17-18 janvier | Bourgogne
👥 18 places

Ça vous tente ?
👉 [lien]

Dites-moi en commentaire : c'est quoi votre signe que vous avez besoin d'une pause ?

#pause #reflexion #seminaire`,
    bestFor: ['Engagement', 'Algorithme Facebook', 'Conversation'],
    tips: [
      'La question doit inviter à commenter',
      'Facebook favorise les posts avec commentaires',
      'Répondre à tous les commentaires',
    ],
    optimalLength: { min: 50, max: 100 },
  },

  details_pratiques: {
    id: 'details_pratiques',
    name: 'Détails pratiques',
    description: 'Présenter toutes les informations concrètes',
    structure: [
      'Présentation courte du séminaire',
      'Dates et lieu',
      'Programme synthétique',
      'Prix et modalités',
      "Comment s'inscrire",
    ],
    example: `📌 SÉMINAIRE "RETROUVER L'ESSENTIEL"

Un week-end pour ralentir, respirer et se reconnecter.

📅 Quand : 17-18 janvier 2026
📍 Où : Le Moulin d'en bas, Bourgogne
👥 Places : 18 maximum
💰 Prix : 250€ (acompte 125€)

Au programme :
• Pratiques de respiration holotropique
• Temps de partage en groupe
• Moments de calme et de nature

🍽️ Repas inclus, hébergement possible sur place

👉 Inscription et infos : [lien]

Des questions ? Écrivez-moi !

#seminaire #bourgogne #janvier2026`,
    bestFor: ['Information claire', 'Partage facile', 'Rappel'],
    tips: [
      'Format visuel clair',
      'Toutes les infos essentielles',
      'Faciliter la prise de décision',
    ],
    optimalLength: { min: 80, max: 140 },
  },

  derniers_jours: {
    id: 'derniers_jours',
    name: 'Derniers jours',
    description: 'Urgence bienveillante pour les dernières places',
    structure: [
      "Annonce de l'urgence",
      'Rappel de ce qui attend',
      'Pourquoi ne pas hésiter',
      'CTA clair',
    ],
    example: `⚡ Plus que 4 places pour le séminaire de janvier !

Si vous hésitez depuis quelques temps...
Si vous sentez que vous avez besoin de cette pause...

C'est le moment de décider.

📅 17-18 janvier
📍 Bourgogne
👥 18 places au total

On ferme les inscriptions dans quelques jours.

👉 Réservez maintenant : [lien]

À bientôt peut-être ?

#dernieresplaces #seminaire #janvier`,
    bestFor: ['Conversion', 'Fin des inscriptions', 'Urgence'],
    tips: ["L'urgence doit être réelle", 'Rester bienveillant', "Faciliter l'action immédiate"],
    optimalLength: { min: 40, max: 80 },
  },

  partage_vision: {
    id: 'partage_vision',
    name: 'Partage de vision',
    description: 'Expliquer pourquoi ce séminaire existe',
    structure: [
      "L'origine du séminaire",
      "Ce qui m'anime",
      'Ce que je souhaite offrir',
      'Invitation',
    ],
    example: `Pourquoi j'ai créé ce séminaire ?

Parce qu'en 15 ans de pratique, j'ai vu tellement de personnes épuisées.
Qui courent. Qui tiennent.
Qui ont oublié comment s'arrêter.

Le séminaire "Retrouver l'Essentiel", c'est l'espace que j'aurais aimé trouver moi-même.

Un lieu hors du temps.
Des pratiques qui reconnectent.
Un petit groupe bienveillant.

Si ça résonne pour vous...
Le prochain a lieu les 17-18 janvier.

👉 [lien]

Qu'est-ce qui vous fait dire "j'aurais besoin de ça" ?

#vision #seminaire #pourquoi #intention`,
    bestFor: ['Connexion personnelle', 'Authenticité', 'Positionnement'],
    tips: ['Être sincère sur la motivation', 'Créer un lien émotionnel', 'Inviter à partager'],
    optimalLength: { min: 60, max: 110 },
  },
};

// ===========================================
// Formats Threads pour séminaires
// ===========================================

export interface SeminarThreadsFormatSpec {
  id: SeminarThreadsFormat;
  name: string;
  description: string;
  structure: string[];
  examples: string[];
  bestFor: string[];
  tips: string[];
  maxLength: number;
}

export const SEMINAR_THREADS_FORMATS: Record<SeminarThreadsFormat, SeminarThreadsFormatSpec> = {
  pensee_spontanee: {
    id: 'pensee_spontanee',
    name: 'Pensée spontanée',
    description: 'Réflexion naturelle comme si on pensait à voix haute',
    structure: ['Pensée en cours', 'Développement bref', 'Lien implicite avec le séminaire'],
    examples: [
      "je prépare le séminaire de janvier et je réalise à quel point on a tous besoin d'espace. pas d'espace physique. d'espace intérieur.",
      "dans 3 semaines, 18 personnes vont se retrouver dans un lieu hors du temps. j'ai hâte.",
      "parfois je me demande ce qui ferait vraiment du bien aux gens. et la réponse c'est souvent : s'arrêter. juste s'arrêter.",
    ],
    bestFor: ['Authenticité', 'Teasing léger', 'Connexion humaine'],
    tips: [
      'Pas de majuscules ni de ponctuation stricte',
      'Ton très naturel',
      'Ne pas vendre, partager',
    ],
    maxLength: 280,
  },

  micro_confession: {
    id: 'micro_confession',
    name: 'Micro confession',
    description: 'Partage personnel du praticien sur le séminaire',
    structure: ['Aveu personnel', 'Ce que ça signifie'],
    examples: [
      'je suis toujours un peu ému avant chaque séminaire. même après des années. parce que je sais ce qui peut se passer quand on crée un espace de confiance.',
      "confession : je prépare le prochain séminaire avec autant de soin que si c'était le premier.",
      'ce qui me touche le plus ? quand quelqu\'un repart en disant "je me suis retrouvé". ça n\'a pas de prix.',
    ],
    bestFor: ['Humaniser le praticien', 'Authenticité', 'Connexion'],
    tips: ['Vulnérabilité mesurée', 'Sincérité', 'Pas de fausse modestie'],
    maxLength: 250,
  },

  question_ouverte: {
    id: 'question_ouverte',
    name: 'Question ouverte',
    description: 'Question sans réponse directe qui fait réfléchir',
    structure: ['Question simple', 'Éventuellement une nuance'],
    examples: [
      'c\'est quoi pour vous "retrouver l\'essentiel" ?',
      'quand est-ce que vous vous êtes vraiment arrêté la dernière fois ?',
      "si vous pouviez prendre 2 jours pour vous, qu'est-ce que vous en feriez ?",
    ],
    bestFor: ['Engagement', 'Réflexion', 'Threads aime les conversations'],
    tips: [
      'Questions sincères',
      'Pas de questions rhétoriques marketing',
      'Inviter vraiment à la réponse',
    ],
    maxLength: 200,
  },

  fragment_anticipation: {
    id: 'fragment_anticipation',
    name: "Fragment d'anticipation",
    description: "Évocation poétique de l'expérience à venir",
    structure: ['Image ou sensation évoquée', 'Lien implicite avec le séminaire'],
    examples: [
      'un feu de cheminée. le silence. 18 personnes qui respirent ensemble. janvier arrive.',
      'imaginez : deux jours sans notification. sans urgence. juste être là.',
      'le moulin. la nature. le groupe. tout est prêt pour janvier.',
    ],
    bestFor: ["Créer l'envie", 'Posts visuels', 'Anticipation'],
    tips: ['Style quasi-poétique', "Sensations plutôt qu'informations", 'Laisser imaginer'],
    maxLength: 220,
  },

  rappel_humain: {
    id: 'rappel_humain',
    name: 'Rappel humain',
    description: 'Rappel simple et authentique sur le séminaire',
    structure: ['Information simple', 'Touche personnelle'],
    examples: [
      "petit rappel : il reste quelques places pour le séminaire de janvier. si ça vous parle, c'est le moment.",
      'séminaire dans 3 semaines. je commence à visualiser le groupe. vous serez peut-être dedans ?',
      'dernières places pour janvier. je dis ça, je dis rien.',
    ],
    bestFor: ['Rappels', 'Urgence douce', 'Dernières places'],
    tips: ['Ton décontracté', 'Pas de pression', 'Humour léger acceptable'],
    maxLength: 200,
  },
};

// ===========================================
// Niveaux d'urgence pour séminaires
// ===========================================

export interface SeminarUrgencySpec {
  level: SeminarUrgencyLevel;
  name: string;
  description: string;
  timing: string;
  characteristics: string[];
  examplePhrase: string;
}

export const SEMINAR_URGENCY_LEVELS: Record<SeminarUrgencyLevel, SeminarUrgencySpec> = {
  1: {
    level: 1,
    name: 'Annonce douce',
    description: "Première annonce, pas d'urgence, juste information",
    timing: "Plus de 6 semaines avant l'événement",
    characteristics: [
      'Ton informatif',
      'Pas de mention de places limitées',
      "Focus sur le contenu et l'expérience",
    ],
    examplePhrase: 'Je suis heureux de vous annoncer le prochain séminaire...',
  },
  2: {
    level: 2,
    name: 'Invitation ouverte',
    description: 'Invitation chaleureuse avec mention des places',
    timing: "4-6 semaines avant l'événement",
    characteristics: [
      'Mention du nombre de places total',
      'Invitation à s\'inscrire "quand vous êtes prêt"',
      'Pas de pression temporelle',
    ],
    examplePhrase: '18 places pour vivre cette expérience ensemble...',
  },
  3: {
    level: 3,
    name: 'Rappel engagé',
    description: 'Rappel avec mention du remplissage',
    timing: "2-4 semaines avant l'événement",
    characteristics: [
      'Mention du nombre de places restantes',
      'Suggestion de ne pas trop attendre',
      'Urgence modérée',
    ],
    examplePhrase: 'Il reste une dizaine de places pour le séminaire...',
  },
  4: {
    level: 4,
    name: 'Dernières places',
    description: 'Urgence marquée, dernières places disponibles',
    timing: '1-2 semaines avant ou quand il reste peu de places',
    characteristics: [
      'Chiffre précis des places restantes',
      'Invitation à décider',
      'Urgence bienveillante',
    ],
    examplePhrase: 'Plus que 4 places pour le séminaire de janvier...',
  },
  5: {
    level: 5,
    name: 'Dernière chance',
    description: 'Ultime appel avant clôture des inscriptions',
    timing: 'Derniers jours ou dernières places',
    characteristics: ['Urgence assumée', 'Deadline claire', 'CTA direct'],
    examplePhrase: "Inscriptions closes dans 48h. C'est maintenant ou jamais.",
  },
};

// ===========================================
// Patterns d'accroche pour séminaires
// ===========================================

export interface SeminarHookPattern {
  id: string;
  name: string;
  pattern: string;
  examples: string[];
  bestFor: ContentTone[];
  platforms: SocialPlatform[];
}

export const SEMINAR_HOOK_PATTERNS: SeminarHookPattern[] = [
  {
    id: 'compte_rebours',
    name: 'Compte à rebours',
    pattern: 'Plus que [X] [places/jours].',
    examples: ['Plus que 5 places.', 'Plus que 3 semaines.', 'J-14 avant le séminaire.'],
    bestFor: ['promotionnel', 'informatif'],
    platforms: ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN'],
  },
  {
    id: 'question_besoin',
    name: 'Question sur le besoin',
    pattern: 'Et si vous [besoin profond] ?',
    examples: [
      'Et si vous preniez 2 jours pour vous ?',
      'Et si vous faisiez une vraie pause ?',
      'Et si vous vous accordiez ce temps ?',
    ],
    bestFor: ['inspirant', 'personnel'],
    platforms: ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'THREADS'],
  },
  {
    id: 'visualisation',
    name: 'Visualisation',
    pattern: 'Imaginez. [scène évocatrice]',
    examples: [
      'Imaginez. Un lieu hors du temps.',
      'Imaginez. Deux jours sans urgence.',
      'Imaginez. Respirer vraiment.',
    ],
    bestFor: ['inspirant', 'promotionnel'],
    platforms: ['INSTAGRAM', 'FACEBOOK'],
  },
  {
    id: 'confession_preparation',
    name: 'Confession préparation',
    pattern: 'En ce moment, je [action de préparation].',
    examples: [
      'En ce moment, je prépare le prochain séminaire.',
      'Cette semaine, je finalise le programme de janvier.',
      'Je suis en train de choisir les musiques pour le séminaire.',
    ],
    bestFor: ['personnel', 'inspirant'],
    platforms: ['INSTAGRAM', 'FACEBOOK', 'THREADS'],
  },
  {
    id: 'observation_besoin',
    name: 'Observation sur le besoin',
    pattern: "Ce que j'observe depuis [X] ans : [constat].",
    examples: [
      "Ce que j'observe depuis 15 ans : on a tous besoin d'espace.",
      'Ce que je vois en cabinet : le manque de pause.',
      "Ce que je constate : le besoin de ralentir n'a jamais été aussi fort.",
    ],
    bestFor: ['informatif', 'educatif'],
    platforms: ['LINKEDIN', 'FACEBOOK'],
  },
  {
    id: 'temoignage_court',
    name: 'Témoignage court',
    pattern: '"[Citation courte participant]"',
    examples: [
      '"Je ne m\'attendais pas à ça."',
      '"Je me suis retrouvé."',
      '"Enfin une vraie pause."',
    ],
    bestFor: ['personnel', 'inspirant'],
    platforms: ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN'],
  },
];

// ===========================================
// CTA spécifiques aux séminaires
// ===========================================

export interface SeminarCTATemplate {
  id: string;
  category: 'inscription' | 'information' | 'urgence' | 'contact';
  templates: string[];
}

export const SEMINAR_CTA_TEMPLATES: SeminarCTATemplate[] = [
  {
    id: 'inscription',
    category: 'inscription',
    templates: [
      '→ Réservez votre place (lien en bio)',
      "→ Inscrivez-vous avant qu'il ne soit trop tard",
      '→ Votre place vous attend : lien en bio',
      '👉 Inscription : [lien]',
      '→ Réserver ma place',
    ],
  },
  {
    id: 'information',
    category: 'information',
    templates: [
      '→ Programme complet en commentaire',
      "→ Plus d'infos : lien en bio",
      '→ Toutes les infos en commentaire 👇',
      '→ Découvrez le programme complet',
      '→ Lien en bio pour en savoir plus',
    ],
  },
  {
    id: 'urgence',
    category: 'urgence',
    templates: [
      '→ Ne manquez pas votre place',
      '→ Inscriptions bientôt closes',
      "→ C'est le moment de décider",
      '→ Dernières places disponibles',
      '→ Plus que [X] places !',
    ],
  },
  {
    id: 'contact',
    category: 'contact',
    templates: [
      '→ Des questions ? Écrivez-moi !',
      '→ Je réponds à vos questions en commentaire',
      "→ N'hésitez pas à me contacter",
      '→ Dites-moi si ça vous parle en commentaire',
      '→ Curieux ? Posez vos questions !',
    ],
  },
];

// ===========================================
// Stratégie hashtags pour séminaires
// ===========================================

export const SEMINAR_HASHTAG_CATEGORIES = {
  event: ['seminaire', 'retraite', 'weekend', 'evenement', 'stage'],
  practice: ['respiration', 'respirationholotropique', 'hypnose', 'meditation', 'bienetre'],
  theme: ['ressourcement', 'pause', 'deconnexion', 'transformation', 'cheminement'],
  local: ['bourgogne', 'yonne', 'france', 'campagne', 'nature'],
  audience: ['developpementpersonnel', 'santementale', 'burnout', 'stress', 'equilibre'],
};

// ===========================================
// Fonctions utilitaires
// ===========================================

/**
 * Suggère un format Instagram approprié selon le ton et le timing
 */
export function suggestSeminarInstagramFormat(
  tone: ContentTone,
  daysUntilEvent: number
): SeminarInstagramFormat {
  // Urgence : derniers jours
  if (daysUntilEvent <= 7) {
    return 'compte_rebours';
  }

  // Selon le ton
  const suggestions: Record<ContentTone, SeminarInstagramFormat[]> = {
    informatif: ['liste_benefices', 'apercu_experience'],
    inspirant: ['apercu_experience', 'question_reflexive'],
    promotionnel: ['compte_rebours', 'liste_benefices'],
    educatif: ['liste_benefices', 'apercu_experience'],
    personnel: ['coulisses', 'temoignage_passe'],
  };

  return suggestions[tone]?.[0] || 'apercu_experience';
}

/**
 * Suggère un format LinkedIn approprié selon le ton et le timing
 */
export function suggestSeminarLinkedInFormat(
  tone: ContentTone,
  daysUntilEvent: number
): SeminarLinkedInFormat {
  if (daysUntilEvent <= 7) {
    return 'derniere_chance';
  }

  const suggestions: Record<ContentTone, SeminarLinkedInFormat[]> = {
    informatif: ['programme_detaille', 'annonce_expert'],
    inspirant: ['invitation_reflexion', 'probleme_solution'],
    promotionnel: ['annonce_expert', 'derniere_chance'],
    educatif: ['observation_terrain', 'probleme_solution'],
    personnel: ['observation_terrain', 'invitation_reflexion'],
  };

  return suggestions[tone]?.[0] || 'annonce_expert';
}

/**
 * Suggère un format Facebook approprié selon le ton et le timing
 */
export function suggestSeminarFacebookFormat(
  tone: ContentTone,
  daysUntilEvent: number
): SeminarFacebookFormat {
  if (daysUntilEvent <= 7) {
    return 'derniers_jours';
  }

  const suggestions: Record<ContentTone, SeminarFacebookFormat[]> = {
    informatif: ['details_pratiques', 'invitation_chaleureuse'],
    inspirant: ['histoire_transformation', 'partage_vision'],
    promotionnel: ['derniers_jours', 'details_pratiques'],
    educatif: ['partage_vision', 'question_engagement'],
    personnel: ['partage_vision', 'histoire_transformation'],
  };

  return suggestions[tone]?.[0] || 'invitation_chaleureuse';
}

/**
 * Suggère un format Threads approprié selon le ton
 */
export function suggestSeminarThreadsFormat(tone: ContentTone): SeminarThreadsFormat {
  const suggestions: Record<ContentTone, SeminarThreadsFormat[]> = {
    informatif: ['rappel_humain', 'pensee_spontanee'],
    inspirant: ['fragment_anticipation', 'question_ouverte'],
    promotionnel: ['rappel_humain', 'pensee_spontanee'],
    educatif: ['question_ouverte', 'pensee_spontanee'],
    personnel: ['micro_confession', 'pensee_spontanee'],
  };

  return suggestions[tone]?.[0] || 'pensee_spontanee';
}

/**
 * Calcule le niveau d'urgence approprié
 */
export function calculateUrgencyLevel(
  daysUntilEvent: number,
  placesRemaining: number,
  totalCapacity: number
): SeminarUrgencyLevel {
  const fillRate = (totalCapacity - placesRemaining) / totalCapacity;

  // Presque complet = urgence maximale
  if (placesRemaining <= 3 || fillRate >= 0.85) {
    return 5;
  }

  // Peu de places
  if (placesRemaining <= 6 || fillRate >= 0.7) {
    return 4;
  }

  // Se remplit bien
  if (fillRate >= 0.5 || daysUntilEvent <= 14) {
    return 3;
  }

  // Encore du temps
  if (daysUntilEvent <= 42) {
    return 2;
  }

  // Annonce initiale
  return 1;
}

/**
 * Obtient les patterns d'accroche appropriés pour une plateforme et un ton
 */
export function getSeminarHookPatternsForPlatform(
  platform: SocialPlatform,
  tone: ContentTone
): SeminarHookPattern[] {
  return SEMINAR_HOOK_PATTERNS.filter(
    hook => hook.platforms.includes(platform) && hook.bestFor.includes(tone)
  );
}

/**
 * Génère les hashtags appropriés pour un séminaire
 */
export function generateSeminarHashtags(
  platform: SocialPlatform,
  tags: string[],
  count: number = 5
): string[] {
  const result: string[] = [];

  // Toujours inclure "seminaire"
  result.push('seminaire');

  // Ajouter les tags du séminaire s'ils correspondent aux catégories
  const allHashtags = Object.values(SEMINAR_HASHTAG_CATEGORIES).flat();
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (allHashtags.includes(normalizedTag) && !result.includes(normalizedTag)) {
      result.push(normalizedTag);
    }
  }

  // Compléter avec les hashtags par défaut
  const defaults = ['bienetre', 'ressourcement', 'bourgogne', 'retraite', 'pause'];
  for (const tag of defaults) {
    if (!result.includes(tag) && result.length < count) {
      result.push(tag);
    }
  }

  // Adapter au nombre selon la plateforme
  const maxHashtags: Record<SocialPlatform, number> = {
    INSTAGRAM: 10,
    FACEBOOK: 3,
    LINKEDIN: 5,
    TWITTER: 3,
    THREADS: 1,
  };

  return result.slice(0, Math.min(count, maxHashtags[platform]));
}
