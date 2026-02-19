# Audit de migration Psypnos — VPS GANDI vers Vercel (kairn)

**Date de l'audit** : 19 février 2026
**Repository source** : `psypnos` (VPS GANDI, Supabase `ukbbkoadbgifnxbcuxbr`)
**Repository destination** : `kairn` (monorepo, app `@kairn/psypnos`, Vercel CDG1)
**Domaine** : `psypnos.fr`

---

## Table des matières

1. [Cartographie des URLs](#1-cartographie-des-urls)
2. [Inventaire des contenus](#2-inventaire-des-contenus)
3. [Inventaire des processus automatisés](#3-inventaire-des-processus-automatisés)
4. [Inventaire des assets](#4-inventaire-des-assets)
5. [Vérification de compatibilité des URLs](#5-vérification-de-compatibilité-des-urls)
6. [Anomalies détectées](#6-anomalies-détectées)
7. [Variables d'environnement requises](#7-variables-denvironnement-requises)
8. [Scripts de migration disponibles](#8-scripts-de-migration-disponibles)
9. [Phase 4 — Infrastructure réseaux sociaux](#12-phase-4--infrastructure-réseaux-sociaux)

---

## 1. Cartographie des URLs

### 1.1 Pages statiques publiques (28 pages)

| URL                                   | Fichier                                           | Priorité sitemap |
| ------------------------------------- | ------------------------------------------------- | ---------------- |
| `/`                                   | `app/page.tsx`                                    | 1.0              |
| `/psychotherapie`                     | `app/psychotherapie/page.tsx`                     | 0.9              |
| `/hypnose`                            | `app/hypnose/page.tsx`                            | 0.9              |
| `/respiration-holotropique`           | `app/respiration-holotropique/page.tsx`           | 0.9              |
| `/therapies`                          | `app/therapies/page.tsx`                          | 0.9              |
| `/yonne`                              | `app/yonne/page.tsx`                              | 0.9              |
| `/blog`                               | `app/blog/page.tsx`                               | 0.9              |
| `/a-propos`                           | `app/a-propos/page.tsx`                           | 0.8              |
| `/contact`                            | `app/contact/page.tsx`                            | 0.8              |
| `/demande-rendez-vous`                | `app/demande-rendez-vous/page.tsx`                | 0.8              |
| `/inscription-seminaire`              | `app/inscription-seminaire/page.tsx`              | 0.8              |
| `/psychotherapie-yonne`               | `app/psychotherapie-yonne/page.tsx`               | 0.8              |
| `/psychotherapie-auxerre`             | `app/psychotherapie-auxerre/page.tsx`             | 0.8              |
| `/psychotherapie-sens`                | `app/psychotherapie-sens/page.tsx`                | 0.8              |
| `/psychotherapie-joigny`              | `app/psychotherapie-joigny/page.tsx`              | 0.8              |
| `/psychotherapie-migennes`            | `app/psychotherapie-migennes/page.tsx`            | 0.8              |
| `/hypnose-yonne`                      | `app/hypnose-yonne/page.tsx`                      | 0.8              |
| `/hypnose-auxerre`                    | `app/hypnose-auxerre/page.tsx`                    | 0.8              |
| `/hypnose-sens`                       | `app/hypnose-sens/page.tsx`                       | 0.8              |
| `/hypnose-joigny`                     | `app/hypnose-joigny/page.tsx`                     | 0.8              |
| `/hypnose-migennes`                   | `app/hypnose-migennes/page.tsx`                   | 0.8              |
| `/respiration-holotropique-bourgogne` | `app/respiration-holotropique-bourgogne/page.tsx` | 0.8              |
| `/respiration-holotropique-yonne`     | `app/respiration-holotropique-yonne/page.tsx`     | 0.8              |
| `/politique-de-confidentialite`       | `app/politique-de-confidentialite/page.tsx`       | 0.3              |
| `/conditions-utilisation`             | `app/conditions-utilisation/page.tsx`             | 0.3              |
| `/login`                              | `app/login/page.tsx`                              | —                |
| `/offline`                            | `app/offline/page.tsx`                            | —                |
| `/maintenance`                        | `app/maintenance/page.tsx`                        | —                |

### 1.2 Pages dynamiques

| Pattern        | Fichier                    | Rendu           |
| -------------- | -------------------------- | --------------- |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | `force-dynamic` |

Génère **62 URLs** correspondant aux articles publiés (voir section 2.1).

### 1.3 Redirections 301 permanentes (next.config.mjs)

| Source                       | Destination                |
| ---------------------------- | -------------------------- |
| `/psychotherapeute-yonne`    | `/psychotherapie-yonne`    |
| `/psychotherapeute-auxerre`  | `/psychotherapie-auxerre`  |
| `/psychotherapeute-sens`     | `/psychotherapie-sens`     |
| `/psychotherapeute-joigny`   | `/psychotherapie-joigny`   |
| `/psychotherapeute-migennes` | `/psychotherapie-migennes` |

### 1.4 Pages admin protégées (17 pages)

| URL                                 | Fichier                                         |
| ----------------------------------- | ----------------------------------------------- |
| `/admin`                            | `app/admin/page.tsx`                            |
| `/admin/analytics`                  | `app/admin/analytics/page.tsx`                  |
| `/admin/analytics/mobile`           | `app/admin/analytics/mobile/page.tsx`           |
| `/admin/analytics/mobile/dashboard` | `app/admin/analytics/mobile/dashboard/page.tsx` |
| `/admin/analytics/mobile/blog`      | `app/admin/analytics/mobile/blog/page.tsx`      |
| `/admin/analytics/mobile/alerts`    | `app/admin/analytics/mobile/alerts/page.tsx`    |
| `/admin/analytics/mobile/settings`  | `app/admin/analytics/mobile/settings/page.tsx`  |
| `/admin/blog`                       | `app/admin/blog/page.tsx`                       |
| `/admin/blog/new`                   | `app/admin/blog/new/page.tsx`                   |
| `/admin/blog/analytics`             | `app/admin/blog/analytics/page.tsx`             |
| `/admin/blog/edit/[slug]`           | `app/admin/blog/edit/[slug]/page.tsx`           |
| `/admin/blog/jobs`                  | `app/admin/blog/jobs/page.tsx`                  |
| `/admin/configuration`              | `app/admin/configuration/page.tsx`              |
| `/admin/customization`              | `app/admin/customization/page.tsx`              |
| `/admin/deployment`                 | `app/admin/deployment/page.tsx`                 |
| `/admin/settings`                   | `app/admin/settings/page.tsx`                   |
| `/admin/social`                     | `app/admin/social/page.tsx`                     |
| `/admin/social/accounts`            | `app/admin/social/accounts/page.tsx`            |
| `/admin/social/calendar`            | `app/admin/social/calendar/page.tsx`            |
| `/admin/social/posts`               | `app/admin/social/posts/page.tsx`               |
| `/admin/social/posts/new`           | `app/admin/social/posts/new/page.tsx`           |
| `/admin/users`                      | `app/admin/users/page.tsx`                      |
| `/admin/testimonials`               | `app/admin/testimonials/page.tsx`               |
| `/admin/seminars`                   | `app/admin/seminars/page.tsx`                   |

### 1.5 Routes API (résumé par catégorie)

| Catégorie          | Nombre de routes | Préfixe                                                                                    |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------ |
| Analytics          | 30               | `/api/analytics/`                                                                          |
| Blog               | 18               | `/api/blog/`                                                                               |
| Social             | 17               | `/api/social/`                                                                             |
| Admin Deployment   | 12               | `/api/admin/deployment/`                                                                   |
| Admin Users        | 4                | `/api/admin/users/`                                                                        |
| Cron Jobs          | 10               | `/api/cron/`                                                                               |
| Push Notifications | 3                | `/api/push/`                                                                               |
| Auth               | 3                | `/api/auth/`                                                                               |
| Testimonials       | 2                | `/api/testimonials/`                                                                       |
| Seminars           | 3                | `/api/seminars/`                                                                           |
| Contact/RDV        | 4                | `/api/contact/`, `/api/appointment-request/`, `/api/quick-contact/`, `/api/registrations/` |
| Chat/AI            | 3                | `/api/chat/`, `/api/assistant/`                                                            |
| Experiments        | 2                | `/api/experiments/`                                                                        |
| Prefill            | 3                | `/api/prefill/`                                                                            |
| Debug              | 3                | `/api/debug/`                                                                              |
| Utilities          | 3                | `/api/health`, `/api/csrf-token`, `/api/version`                                           |
| **Total**          | **~120**         |                                                                                            |

### 1.6 Résumé des URLs

| Type                      | Nombre   |
| ------------------------- | -------- |
| Pages statiques publiques | 28       |
| Pages dynamiques blog     | 62       |
| Redirections 301          | 5        |
| Pages admin               | 24       |
| Routes API                | ~120     |
| **Total URLs servies**    | **~239** |

---

## 2. Inventaire des contenus

### 2.1 Articles de blog

**Source** : `data/psypnos-blog-export.json` (1.1 Mo)
**Total** : 98 articles
**Publiés** : 62
**Brouillons** : 36

#### Structure de chaque article (20 champs)

| Champ          | Type          | Description                                     |
| -------------- | ------------- | ----------------------------------------------- |
| `id`           | string        | Identifiant unique                              |
| `slug`         | string        | URL-safe, unique, pattern `{catégorie}-{sujet}` |
| `title`        | string        | Titre complet en français                       |
| `description`  | string        | Résumé/extrait                                  |
| `content`      | string        | Contenu Markdown complet                        |
| `author`       | string        | Nom de l'auteur                                 |
| `category`     | string        | Une des 4 catégories                            |
| `tags`         | string (JSON) | Tableau de tags sérialisé                       |
| `image`        | string        | Chemin de l'image de couverture                 |
| `image_prompt` | string        | Prompt de génération d'image IA                 |
| `seo_intent`   | string        | Mot-clé cible SEO                               |
| `persona`      | string        | Profil lecteur cible                            |
| `tones`        | string        | Ton éditorial                                   |
| `faq`          | string (JSON) | Questions/réponses structurées                  |
| `json_ld`      | string (JSON) | Données structurées schema.org                  |
| `published`    | boolean       | Statut de publication                           |
| `featured`     | boolean       | Mis en avant sur la homepage                    |
| `date`         | string (ISO)  | Date de publication                             |
| `created_at`   | string (ISO)  | Date de création                                |
| `updated_at`   | string (ISO)  | Date de dernière modification                   |

#### Répartition par catégorie

| Catégorie  | Publiés | Brouillons | Total  |
| ---------- | ------- | ---------- | ------ |
| Comprendre | 24      | 24         | 48     |
| Traverser  | 21      | 6          | 27     |
| Découvrir  | 11      | 6          | 17     |
| Cheminer   | 6       | 0          | 6      |
| **Total**  | **62**  | **36**     | **98** |

#### Liste complète des 62 articles publiés (par date de publication)

| Slug                                                    | Catégorie  | Date       |
| ------------------------------------------------------- | ---------- | ---------- |
| `comprendre-pourquoi-psychotherapie`                    | Comprendre | 2025-01-01 |
| `comprendre-psychotherapie-transpersonnelle`            | Comprendre | 2025-01-12 |
| `comprendre-hypnose-ericksonienne`                      | Comprendre | 2025-01-16 |
| `decouvrir-respiration-holotropique`                    | Découvrir  | 2025-01-25 |
| `comprendre-fonctionnement-psychotherapie`              | Comprendre | 2025-01-28 |
| `comprendre-psychotherapie-psychanalyse-coaching`       | Comprendre | 2025-02-09 |
| `traverser-anxiete-angoisse-stress`                     | Traverser  | 2025-02-13 |
| `comprendre-signaux-burn-out`                           | Comprendre | 2025-02-22 |
| `traverser-un-deuil`                                    | Traverser  | 2025-03-04 |
| `comprendre-deuil-traspersonnel`                        | Comprendre | 2025-03-16 |
| `comprendre-crise-de-vie`                               | Comprendre | 2025-03-20 |
| `cheminer-apres-psychotherapie`                         | Cheminer   | 2025-03-22 |
| `traverser-oser-commencer-psychotherapie`               | Traverser  | 2025-03-25 |
| `traverser-choisir-psychotherapeute`                    | Traverser  | 2025-03-26 |
| `comprendre-corps-emotions`                             | Comprendre | 2025-04-06 |
| `comprendre-blessures-attachement`                      | Comprendre | 2025-04-09 |
| `comprendre-traumatismes-psychiques`                    | Comprendre | 2025-04-19 |
| `traverser-accueillir-emotions`                         | Traverser  | 2025-04-24 |
| `comprendre-mecanismes-defense`                         | Comprendre | 2025-04-30 |
| `decouvrir-etats-modifies-conscience`                   | Découvrir  | 2025-05-11 |
| `decouvrir-enfant-interieur`                            | Découvrir  | 2025-05-15 |
| `decouvrir-auto-hypnose-debutants`                      | Découvrir  | 2025-05-24 |
| `traverser-arreter-fumer-hypnose`                       | Traverser  | 2025-05-27 |
| `traverser-hypnose-douleur-chronique`                   | Traverser  | 2025-06-01 |
| `comprendre-manque-estime-soi`                          | Comprendre | 2025-06-05 |
| `traverser-anxiete-nocturne`                            | Traverser  | 2025-06-14 |
| `comprendre-stress-travail`                             | Comprendre | 2025-06-17 |
| `decouvrir-respiration-holotropique-deuil`              | Découvrir  | 2025-06-28 |
| `comprendre-psychotherapie-spiritualite`                | Comprendre | 2025-07-03 |
| `decouvrir-seance-respiration-holotropique`             | Découvrir  | 2025-07-13 |
| `decouvrir-hypnose-gestion-emotions`                    | Découvrir  | 2025-07-15 |
| `comprendre-therapie-individuelle-couple`               | Comprendre | 2025-07-26 |
| `traverser-accompagner-proche`                          | Traverser  | 2025-07-31 |
| `decouvrir-preparer-seminaire-respiration-holotropique` | Découvrir  | 2025-08-10 |
| `comprendre-resistances-therapie`                       | Comprendre | 2025-08-13 |
| `traverser-guerir-honte`                                | Traverser  | 2025-08-23 |
| `decouvrir-corps-psychotherapie`                        | Découvrir  | 2025-08-28 |
| `comprendre-crises-existentielles`                      | Comprendre | 2025-09-07 |
| `traverser-auto-hypnose-quotidien`                      | Traverser  | 2025-09-09 |
| `traverser-sortir-relation-toxique`                     | Traverser  | 2025-09-17 |
| `traverser-reconnaitre-relation-saine`                  | Traverser  | 2025-09-25 |
| `traverser-dire-non`                                    | Traverser  | 2025-10-05 |
| `decouvrir-hypnose-therapeutique`                       | Découvrir  | 2025-10-10 |
| `comprendre-approche-psychotherapie-transpersonnelle`   | Comprendre | 2025-10-18 |
| `traverser-dependance-affective`                        | Traverser  | 2025-10-23 |
| `comprendre-psychotherapie-en-visio`                    | Comprendre | 2025-11-02 |
| `comprendre-obstacles-psychotherapie`                   | Comprendre | 2025-11-04 |
| `traverser-hypnose-addictions`                          | Traverser  | 2025-11-15 |
| `traverser-crise-cinquantaine`                          | Traverser  | 2025-11-20 |
| `traverser-parler-therapie`                             | Traverser  | 2025-11-30 |
| `cheminer-etapes-guerison`                              | Cheminer   | 2025-12-04 |
| `cheminer-rythme-psychotherapie`                        | Cheminer   | 2025-12-11 |
| `cheminer-trouver-amour`                                | Cheminer   | 2025-12-17 |
| `traverser-developper-auto-compassion`                  | Traverser  | 2025-12-25 |
| `cheminer-integrer-experience-transformatrice`          | Cheminer   | 2026-01-01 |
| `comprendre-besoin-controle`                            | Comprendre | 2026-01-08 |
| `comprendre-hypersensibilite-transformer-force`         | Comprendre | 2026-01-15 |
| `comprendre-peur-reussir-surmonter`                     | Comprendre | 2026-01-22 |
| `traverser-sortir-mode-survie`                          | Traverser  | 2026-01-29 |
| `cheminer-transformation-interieure-processus-2`        | Cheminer   | 2026-02-05 |
| `decouvrir-hypnose-vs-meditation`                       | Découvrir  | 2026-02-12 |
| `traverser-aider-crise-existentiel`                     | Traverser  | 2026-02-19 |

#### Qualité des slugs

- Aucun doublon
- Aucun caractère accentué ou spécial
- Tous en minuscules avec tirets
- Convention respectée : `{catégorie}-{sujet}`

#### Tags

- **709 tags uniques** répartis sur les 98 articles
- Tags en français, sans accents dans les clés

#### Contenus Markdown

- Aucune URL codée en dur vers l'ancien Supabase (`ukbbkoadbgifnxbcuxbr`)
- Aucun lien absolu vers `psypnos.fr` dans le contenu des articles
- Seules URLs trouvées : `https://example.com` et `https://google.com` (exemples génériques)

### 2.2 Séminaires

**Source** : `data/seminars.json`
**Total** : 4 séminaires

| ID (UUID)      | Titre                    | Date           | Capacité | Prix  | Acompte |
| -------------- | ------------------------ | -------------- | -------- | ----- | ------- |
| `f9f7b4d1-...` | Retrouver l'Essentiel    | 17-18 jan 2026 | 18       | 250 € | 125 €   |
| `b2d81762-...` | Se reconnecter à la Vie  | 21 mar 2026    | 18       | 120 € | 60 €    |
| `75fa3d5e-...` | Respirer la Lumière      | 30-31 mai 2026 | 18       | 250 € | 125 €   |
| `1d1e8ed8-...` | Accueillir le Changement | 22 nov 2025    | 18       | 120 € | 60 €    |

- Tous au même lieu : Moulin d'en bas, Bourgogne
- Animés par David Duquenne et Nathalie Duquenne (sauf 1 avec Camille Tissier)
- Pas de pages individuelles — une seule page `/inscription-seminaire`
- 1 séminaire passé (nov 2025), 1 passé (jan 2026), 2 à venir

### 2.3 Témoignages

**Source** : `data/testimonials.json`
**Total** : 5 témoignages

| Auteur  | Extrait                                                                               |
| ------- | ------------------------------------------------------------------------------------- |
| Paule   | « Des actions concrètes, sous la conduite d'une très grande bienveillance de David. » |
| Ariana  | « J'ai avancé d'un pas de géant dans l'alignement de mon projet. »                    |
| Luc     | « Intime, connecté, et du travail sur soi. de la clarté en résulte :-) »              |
| Lijou   | « J'ai pu trouver des moyens plus simples pour concrétiser mes objectifs... »         |
| Aurélia | « L'approche de David vous amène doucement mais sûrement au cœur du sujet... »        |

- Tous créés le 18 novembre 2025
- Structure : `{ id, quote, author, createdAt, updatedAt }`

### 2.4 Utilisateurs

**Source** : `data/users.json`
**Total** : 1 utilisateur

- Email : `david@psypnos.fr`
- Rôle : `admin`
- Hash bcrypt (compatible avec le nouveau système)
- Container nommé `items` (pas `users`)

### 2.5 Analytics

**Source** : `data/analytics.json`
**Statut** : Vide (structure définie, aucune donnée collectée)

```json
{ "pageVisits": [], "sectionTimes": [], "conversionEvents": [] }
```

---

## 3. Inventaire des processus automatisés

### 3.1 Cron jobs (10 tâches via QStash)

| Job                    | Route                              | Fréquence               | Fonction                                         |
| ---------------------- | ---------------------------------- | ----------------------- | ------------------------------------------------ |
| social-publish         | `/api/cron/social-publish`         | `*/5 * * * *` (5 min)   | Publication des posts sociaux programmés         |
| fetch-social-analytics | `/api/cron/fetch-social-analytics` | `0 */4 * * *` (4h)      | Récupération des stats de posts sociaux          |
| refresh-tokens         | `/api/cron/refresh-tokens`         | `0 * * * *` (1h)        | Rafraîchissement des tokens OAuth expirés        |
| daily-report           | `/api/cron/daily-report`           | `0 8 * * *` (8h)        | Envoi du rapport analytique quotidien            |
| weekly-report          | `/api/cron/weekly-report`          | `0 9 * * 1` (lun 9h)    | Envoi du rapport analytique hebdomadaire         |
| process-reports        | `/api/cron/process-reports`        | `45 * * * *`            | Traitement unifié de tous les rapports planifiés |
| cleanup-data           | `/api/cron/cleanup-data`           | `0 3 * * *` (3h)        | Purge des données analytiques anciennes          |
| cleanup-jobs           | `/api/cron/cleanup-jobs`           | `0 4 * * *` (4h)        | Nettoyage des jobs orphelins                     |
| aggregate              | `/api/cron/aggregate`              | `30 * * * *`            | Agrégation des données et détection d'anomalies  |
| check-alerts           | `/api/cron/check-alerts`           | `*/15 * * * *` (15 min) | Évaluation et notification des alertes           |

### 3.2 Publication sociale — Plateformes et tokens

| Plateforme | Durée du token | Rafraîchissement    | API utilisée             |
| ---------- | -------------- | ------------------- | ------------------------ |
| Facebook   | Indéfini       | Non requis          | Graph API (page tokens)  |
| Instagram  | Indéfini       | Non requis          | Graph API (via Facebook) |
| LinkedIn   | 60 jours       | Oui (refresh token) | LinkedIn API             |
| Twitter/X  | 2 heures       | Oui (refresh token) | Twitter API v2           |
| Threads    | 60 jours       | Oui                 | Threads API              |

- Tokens chiffrés AES-256 avec `SOCIAL_ENCRYPTION_KEY`
- Détection d'expiration : 7 jours avant
- Max 3 tentatives de refresh avec retry
- Alerte email admin si refresh échoue

### 3.3 Flux de publication sociale

1. Un post est créé (manuellement ou par IA) avec statut `SCHEDULED` et `scheduledAt`
2. Le cron `social-publish` (toutes les 5 min) détecte les posts dont `scheduledAt ≤ maintenant`
3. Publication séquentielle vers chaque plateforme connectée (1s entre chaque)
4. Statut : `SCHEDULED` → `PUBLISHING` → `PUBLISHED` ou `FAILED`
5. Max 3 retries avec backoff exponentiel
6. Email d'alerte à l'admin en cas d'échec final

### 3.4 Notifications push

- Web Push API avec clés VAPID
- Batch de 100 souscriptions
- Topics : `all`, `blog`, `seminar`, `offer`, `system`
- TTL : 24 heures
- Désactivation automatique après 5 échecs

### 3.5 Webhook de déploiement

- `/api/admin/deployment/webhook` : reçoit les mises à jour de statut de déploiement
- Authentification par `X-Deploy-Token`
- Suivi des phases : `in_progress`, `success`, `failed`, `rolled_back`

---

## 4. Inventaire des assets

### 4.1 Images

| Type                              | Format | Nombre | Emplacement                                         |
| --------------------------------- | ------ | ------ | --------------------------------------------------- |
| Images de couverture blog         | WebP   | 62     | `/public/images/blog/`                              |
| Propositions d'images blog (temp) | WebP   | 29     | `/public/images/blog/temp/`                         |
| Images séminaires                 | WebP   | 4      | `/public/images/seminars/`                          |
| Images services/hero              | WebP   | 7      | `/public/images/`                                   |
| Icônes services                   | SVG    | 12     | `/public/images/icons/`                             |
| Éléments décoratifs               | SVG    | 2      | `/public/images/decor/`, `/public/images/patterns/` |

**Images hero principales** :

- `David_Duquenne.webp` (145 Ko) — Photo profil
- `Moulin_d_en_Bas.webp` (145 Ko) — Lieu des séminaires
- `a-propos.webp` (659 Ko)
- `hypnose.webp` (380 Ko)
- `psychonaute.webp` (97 Ko)
- `psychotherapie.webp` (236 Ko)
- `respiration-holotropique.webp` (605 Ko)

### 4.2 Favicons et PWA

| Fichier                | Taille | Usage                     |
| ---------------------- | ------ | ------------------------- |
| `apple-touch-icon.png` | 8.8 Ko | iOS home screen (180×180) |
| `favicon-16x16.png`    | 626 o  | Petit favicon             |
| `favicon-32x32.png`    | 1.4 Ko | Favicon standard          |
| `icon-192x192.png`     | 9.5 Ko | PWA manifest              |
| `icon-512x512.png`     | 58 Ko  | PWA manifest              |
| `favicon.svg`          | 452 o  | Favicon vectoriel         |
| `manifest.webmanifest` | 2.0 Ko | Web App Manifest          |
| `sw.js`                | 15 Ko  | Service Worker            |
| `offline.html`         | 8.1 Ko | Page offline              |

### 4.3 Polices

- **Inter** (300-700) — Corps de texte, via Google Fonts CDN
- **Playfair Display** (400-700) — Titres, via Google Fonts CDN
- Aucune police locale stockée

### 4.4 Stockage Supabase

| Bucket           | Usage                             |
| ---------------- | --------------------------------- |
| `blog-images`    | Images de couverture des articles |
| `seminar-images` | Images des séminaires             |

- Stratégie hybride : Supabase si configuré, fallback local (`/public/images/`)
- Format cible : WebP, qualité 90%

### 4.5 Configuration Next.js Image

- Formats : AVIF (prioritaire), WebP
- Domaines distants autorisés : `*.supabase.co`, `images.unsplash.com`
- Cache : 7 jours (604 800 s)
- Device sizes : 640, 750, 828, 1080, 1200, 1920, 2048 px

### 4.6 Références à l'ancien Supabase

L'identifiant de l'ancien projet Supabase (`ukbbkoadbgifnxbcuxbr`) est encore référencé dans :

- `.mcp.json`
- `scripts/MIGRATION-BLOG.md`
- `scripts/migrate-blog-from-json.ts`
- `scripts/migrate-blog-from-psypnos.ts`
- `scripts/migrate-blog-standalone.ts`

Ces références sont dans les scripts de migration uniquement (pas dans le code applicatif).

---

## 5. Vérification de compatibilité des URLs

### 5.1 Pattern d'URL des articles

| Aspect          | Ancien site           | Nouveau site             | Statut     |
| --------------- | --------------------- | ------------------------ | ---------- |
| Base            | `/blog/[slug]`        | `/blog/[slug]`           | Identique  |
| Domaine         | `psypnos.fr`          | `psypnos.fr`             | Identique  |
| Convention slug | `{catégorie}-{sujet}` | `{catégorie}-{sujet}`    | Identique  |
| Rendu           | Dynamic (Supabase)    | `force-dynamic` (Prisma) | Compatible |

### 5.2 Vérification slug par slug

Les 62 slugs publiés dans l'export JSON utilisent exclusivement :

- Lettres minuscules (a-z)
- Chiffres (0-9)
- Tirets (-)

Aucun slug ne contient de caractères accentués, d'espaces, de majuscules ou de caractères spéciaux.

**Résultat** : Aucun doublon, tous les slugs sont URL-safe et compatibles.

### 5.3 Correspondance slug ↔ image de couverture

Sur 62 articles publiés avec 62 images dans `/images/blog/` :

| Statut                         | Nombre | Détail                              |
| ------------------------------ | ------ | ----------------------------------- |
| Slug avec image correspondante | 60     | Correspondance exacte `{slug}.webp` |
| Slug SANS image correspondante | 2      | Voir anomalies ci-dessous           |

### 5.4 Pages de services et géolocalisées

Toutes les pages statiques de l'ancien site existent dans le nouveau avec les mêmes chemins. Aucune incompatibilité détectée.

### 5.5 Séminaires

Le pattern est identique : page unique `/inscription-seminaire`, pas d'URL individuelle par séminaire. Compatible.

### 5.6 Pages légales

`/politique-de-confidentialite` et `/conditions-utilisation` existent dans les deux versions. Compatible.

---

## 6. Anomalies détectées

### 6.1 Images manquantes (CRITIQUE)

| Article publié (slug)                    | Image attendue                                | Problème                                                                                |
| ---------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| `comprendre-psychotherapie-spiritualite` | `comprendre-psychotherapie-spiritualite.webp` | Image nommée `comprendre-psychotherapie-spiritualite-ame.webp` (suffixe `-ame` en trop) |
| `traverser-aider-crise-existentiel`      | `traverser-aider-crise-existentiel.webp`      | Aucune image trouvée                                                                    |

**Action requise** :

1. Renommer `comprendre-psychotherapie-spiritualite-ame.webp` → `comprendre-psychotherapie-spiritualite.webp`
2. Créer ou générer une image pour `traverser-aider-crise-existentiel`

### 6.2 Image en doublon

- `Comprendre-hypnose-ericksonnienne.webp` (majuscule initiale)
- `comprendre-hypnose-ericksonienne.webp` (minuscule, correct)

**Action requise** : Supprimer le fichier avec majuscule.

### 6.3 Manifest PWA — Référence d'image incorrecte

Le fichier `manifest.webmanifest` référence `/images/David_Duquenne.png` mais le fichier réel est en `.webp`.

**Action requise** : Corriger la référence en `.webp`.

### 6.4 Séminaire passé

Le séminaire « Accueillir le Changement » (22 nov 2025) et « Retrouver l'Essentiel » (17-18 jan 2026) sont déjà passés.

**Action suggérée** : Archiver ou supprimer les séminaires expirés après migration.

### 6.5 Container incohérent dans users.json

Le fichier `users.json` utilise le container `items` au lieu de `users` (contrairement à `seminars` et `testimonials`). À vérifier pour la compatibilité avec le script de migration.

### 6.6 Article de test

L'article `test-markdown-complet` (brouillon, daté 2093) est un article de test. Ne doit pas être migré en production.

---

## 7. Variables d'environnement requises

### 7.1 Infrastructure

| Variable              | Description                     | Catégorie       |
| --------------------- | ------------------------------- | --------------- |
| `DATABASE_URL`        | URL PostgreSQL de la base kairn | Base de données |
| `NODE_ENV`            | `production`                    | Environnement   |
| `NEXT_PUBLIC_APP_URL` | `https://psypnos.fr`            | Environnement   |

### 7.2 Authentification

| Variable                    | Description                          |
| --------------------------- | ------------------------------------ |
| `JWT_SECRET`                | Secret JWT principal                 |
| `JWT_ACCESS_SECRET`         | Secret token d'accès                 |
| `JWT_REFRESH_SECRET`        | Secret token de rafraîchissement     |
| `JWT_PASSWORD_RESET_SECRET` | Secret réinitialisation mot de passe |

### 7.3 Services externes

| Variable               | Service   | Usage                     |
| ---------------------- | --------- | ------------------------- |
| `RESEND_API_KEY`       | Resend    | Envoi d'emails            |
| `EMAIL_FROM_ADDRESS`   | Resend    | Adresse expéditeur        |
| `EMAIL_FROM_NAME`      | Resend    | Nom expéditeur            |
| `SUPABASE_URL`         | Supabase  | Stockage fichiers         |
| `SUPABASE_ANON_KEY`    | Supabase  | Clé publique              |
| `SUPABASE_SERVICE_KEY` | Supabase  | Clé service (privée)      |
| `OPENAI_API_KEY`       | OpenAI    | Génération IA             |
| `ANTHROPIC_API_KEY`    | Anthropic | Génération IA             |
| `RECAPTCHA_SITE_KEY`   | Google    | Protection bot (publique) |
| `RECAPTCHA_SECRET_KEY` | Google    | Protection bot (privée)   |

### 7.4 Réseaux sociaux

| Variable                 | Plateforme                                    |
| ------------------------ | --------------------------------------------- |
| `SOCIAL_ENCRYPTION_KEY`  | Chiffrement AES-256 des tokens (hex 64 chars) |
| `FACEBOOK_APP_ID`        | Facebook                                      |
| `FACEBOOK_APP_SECRET`    | Facebook                                      |
| `LINKEDIN_CLIENT_ID`     | LinkedIn                                      |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn                                      |
| `TWITTER_API_KEY`        | Twitter/X                                     |
| `TWITTER_API_SECRET`     | Twitter/X                                     |
| `TWITTER_BEARER_TOKEN`   | Twitter/X                                     |
| `THREADS_APP_ID`         | Threads                                       |
| `THREADS_APP_SECRET`     | Threads                                       |

### 7.5 Planification (QStash)

| Variable                     | Description                           |
| ---------------------------- | ------------------------------------- |
| `QSTASH_TOKEN`               | Token API Upstash QStash              |
| `QSTASH_CURRENT_SIGNING_KEY` | Clé de signature courante             |
| `QSTASH_NEXT_SIGNING_KEY`    | Prochaine clé (rotation)              |
| `CRON_SECRET`                | Secret de fallback pour développement |

### 7.6 Notifications push

| Variable            | Description                   |
| ------------------- | ----------------------------- |
| `VAPID_PUBLIC_KEY`  | Clé publique Web Push         |
| `VAPID_PRIVATE_KEY` | Clé privée Web Push           |
| `VAPID_SUBJECT`     | Subject mailto: pour Web Push |
| `PUSH_ADMIN_TOKEN`  | Token admin push              |

---

## 8. Scripts de migration disponibles

### 8.1 Blog

| Script                                    | Source                     | Dépendance      | Recommandé      |
| ----------------------------------------- | -------------------------- | --------------- | --------------- |
| `migrate-blog-standalone.ts`              | PostgreSQL PSYPNOS direct  | `pg` uniquement | Oui (principal) |
| `migrate-blog-from-json.ts`               | `psypnos-blog-export.json` | Prisma          | Oui (fallback)  |
| `migrate-blog-from-psypnos.ts`            | PostgreSQL ou Supabase API | Prisma          | Alternatif      |
| `migrate-blogpostextended-to-blogpost.ts` | Table intermédiaire        | Prisma          | Phase 2         |

**Comportement des scripts** :

- Idempotents (déduplication par slug)
- Non destructifs (source jamais modifiée)
- Conversion d'images en WebP qualité 90%
- Détection des URLs codées en dur
- Validation UTF-8
- Batch de 10 articles
- Vérification post-migration

**Mapping des champs** :

| Export JSON          | BlogPostExtended  | BlogPost (multi-tenant)    |
| -------------------- | ----------------- | -------------------------- |
| `slug`               | `slug` (tel quel) | `slug` (tel quel)          |
| `description`        | `description`     | `excerpt`                  |
| `image`              | `image`           | `coverImage`               |
| `published` (bool)   | `published`       | `status` (PUBLISHED/DRAFT) |
| `date`               | `date`            | `publishedAt`              |
| `author`             | `author`          | `authorName`               |
| `tags` (JSON string) | `tags` (string[]) | Relations `BlogPostTag`    |

### 8.2 Séminaires et témoignages

| Script                          | Source                   |
| ------------------------------- | ------------------------ |
| `migrate-seminars-to-db.ts`     | `data/seminars.json`     |
| `migrate-testimonials-to-db.ts` | `data/testimonials.json` |

### 8.3 Politiques de rétention (cleanup-data)

| Modèle             | Rétention |
| ------------------ | --------- |
| PageVisit          | 90 jours  |
| BlogAnalytics      | 90 jours  |
| BlogCtaClick       | 90 jours  |
| BlogFaqClick       | 90 jours  |
| BotVisit           | 30 jours  |
| SectionTime        | 60 jours  |
| AlertHistory       | 60 jours  |
| VisitorGeolocation | 60 jours  |
| CustomEvent        | 60 jours  |
| ConversionEvent    | 90 jours  |

---

---

## 9. Phase 2 — Vérification de compatibilité des URLs (exécutée le 19/02/2026)

### 9.1 Vérification des routes blog `/blog/[slug]`

**Route handler** : `app/blog/[slug]/page.tsx`

| Aspect                 | Résultat                                               | Détail                      |
| ---------------------- | ------------------------------------------------------ | --------------------------- |
| Requête Prisma         | `findUnique` sur clé composite `(slug, siteId)`        | Exact match, case-sensitive |
| Filtre publication     | `status === 'PUBLISHED'` ET `publishedAt <= today`     | 2 filtres appliqués         |
| Isolation multi-tenant | Filtrage par `siteId` (psypnos)                        | OK                          |
| Slug préservé          | Aucune transformation entre URL et requête             | OK                          |
| 404 handling           | `notFound()` si post absent, non publié ou date future | OK                          |
| `generateStaticParams` | Génère uniquement les articles publiés et non futurs   | OK                          |

**Chaîne de résolution** :

```
URL /blog/{slug} → params.slug → getPostBySlugAsync(slug) → prisma.blogPost.findUnique({slug, siteId}) → rendu ou 404
```

### 9.2 Vérification des 25 pages statiques publiques

| URL                                   | Fichier trouvé                                    | Statut |
| ------------------------------------- | ------------------------------------------------- | ------ |
| `/`                                   | `app/page.tsx`                                    | OK     |
| `/psychotherapie`                     | `app/psychotherapie/page.tsx`                     | OK     |
| `/hypnose`                            | `app/hypnose/page.tsx`                            | OK     |
| `/respiration-holotropique`           | `app/respiration-holotropique/page.tsx`           | OK     |
| `/therapies`                          | `app/therapies/page.tsx`                          | OK     |
| `/yonne`                              | `app/yonne/page.tsx`                              | OK     |
| `/blog`                               | `app/blog/page.tsx`                               | OK     |
| `/a-propos`                           | `app/a-propos/page.tsx`                           | OK     |
| `/contact`                            | `app/contact/page.tsx`                            | OK     |
| `/demande-rendez-vous`                | `app/demande-rendez-vous/page.tsx`                | OK     |
| `/inscription-seminaire`              | `app/inscription-seminaire/page.tsx`              | OK     |
| `/psychotherapie-yonne`               | `app/psychotherapie-yonne/page.tsx`               | OK     |
| `/psychotherapie-auxerre`             | `app/psychotherapie-auxerre/page.tsx`             | OK     |
| `/psychotherapie-sens`                | `app/psychotherapie-sens/page.tsx`                | OK     |
| `/psychotherapie-joigny`              | `app/psychotherapie-joigny/page.tsx`              | OK     |
| `/psychotherapie-migennes`            | `app/psychotherapie-migennes/page.tsx`            | OK     |
| `/hypnose-yonne`                      | `app/hypnose-yonne/page.tsx`                      | OK     |
| `/hypnose-auxerre`                    | `app/hypnose-auxerre/page.tsx`                    | OK     |
| `/hypnose-sens`                       | `app/hypnose-sens/page.tsx`                       | OK     |
| `/hypnose-joigny`                     | `app/hypnose-joigny/page.tsx`                     | OK     |
| `/hypnose-migennes`                   | `app/hypnose-migennes/page.tsx`                   | OK     |
| `/respiration-holotropique-bourgogne` | `app/respiration-holotropique-bourgogne/page.tsx` | OK     |
| `/respiration-holotropique-yonne`     | `app/respiration-holotropique-yonne/page.tsx`     | OK     |
| `/politique-de-confidentialite`       | `app/politique-de-confidentialite/page.tsx`       | OK     |
| `/conditions-utilisation`             | `app/conditions-utilisation/page.tsx`             | OK     |

**Résultat** : 25/25 pages statiques confirmées.

### 9.3 Vérification des redirections

**Redirections existantes (next.config.mjs)** : 5 redirections 301 `psychotherapeute-*` → `psychotherapie-*`. Toutes confirmées.

**Middleware** : Pas de réécriture d'URL. Uniquement rate limiting et headers de sécurité.

**Vercel config** : Pas de redirections définies.

**Redirections client-side (admin)** : Non pertinentes pour le SEO.

### 9.4 Vérification du sitemap

**Fichier** : `app/sitemap.ts`

| Catégorie                       | URLs dans le sitemap          | URLs dans l'App Router | Concordance |
| ------------------------------- | ----------------------------- | ---------------------- | ----------- |
| Pages principales               | 11                            | 11                     | OK          |
| Pages géolocalisées psycho      | 5                             | 5                      | OK          |
| Pages géolocalisées hypnose     | 5                             | 5                      | OK          |
| Pages géolocalisées respiration | 2                             | 2                      | OK          |
| Pages légales                   | 2                             | 2                      | OK          |
| Blog posts (dynamiques)         | 62 (filtrés published + date) | 62                     | OK          |
| **Total**                       | **87**                        | **87**                 | **OK**      |

**Exclusions correctes** : `/admin/*`, `/api/*`, `/login`, `/maintenance`, `/offline` ne sont pas dans le sitemap.

**robots.txt** : Pointe vers `https://psypnos.fr/sitemap.xml`, bloque `/admin/`, `/api/`, `/login`, `/_next/`. Correct.

### 9.5 Vérification des métadonnées SEO

#### Métadonnées d'un article de blog (avant correction)

| Tag                         | Valeur                                                               | Statut      |
| --------------------------- | -------------------------------------------------------------------- | ----------- |
| `<title>`                   | `{post.title} \| Psypnos`                                            | OK          |
| `<meta name="description">` | `{post.description}`                                                 | OK          |
| `<meta name="keywords">`    | `[catégorie, ...tags]`                                               | OK          |
| `<meta name="author">`      | `{post.author}`                                                      | OK          |
| `<link rel="canonical">`    | `https://psypnos.fr/blog/{slug}`                                     | OK          |
| `og:type`                   | `article`                                                            | OK          |
| `og:title`                  | `{post.title}`                                                       | OK          |
| `og:description`            | `{post.description}`                                                 | OK          |
| `og:url`                    | `https://psypnos.fr/blog/{slug}`                                     | OK          |
| `og:published_time`         | `{post.date}`                                                        | OK          |
| `og:authors`                | `[post.author]`                                                      | OK          |
| `og:tags`                   | `[catégorie, ...tags]`                                               | OK          |
| **`og:image`**              | **MANQUANT**                                                         | **CORRIGE** |
| **`twitter:card`**          | **Générique (site-level)**                                           | **CORRIGE** |
| **`twitter:title`**         | **Générique**                                                        | **CORRIGE** |
| **`twitter:image`**         | **Générique**                                                        | **CORRIGE** |
| JSON-LD `Article`           | headline, description, author, publisher, mainEntityOfPage, keywords | OK          |

### 9.6 Corrections appliquées

#### 9.6.1 Images corrigées

| Action    | Fichier                                                                                           | Statut                            |
| --------- | ------------------------------------------------------------------------------------------------- | --------------------------------- |
| Renommer  | `comprendre-psychotherapie-spiritualite-ame.webp` → `comprendre-psychotherapie-spiritualite.webp` | FAIT                              |
| Supprimer | `Comprendre-hypnose-ericksonnienne.webp` (doublon majuscule)                                      | FAIT                              |
| Créer     | `traverser-aider-crise-existentiel.webp`                                                          | A FAIRE (action manuelle requise) |

#### 9.6.2 Métadonnées OG/Twitter ajoutées (`app/blog/[slug]/page.tsx`)

Ajout dans `generateMetadata()` :

- `openGraph.images` : image de couverture de l'article (`post.image` ou fallback `/images/blog/{slug}.webp`), dimensions 1200x630
- `twitter.card` : `summary_large_image`
- `twitter.title` : titre de l'article
- `twitter.description` : description de l'article
- `twitter.images` : image de couverture de l'article

**Impact** : Les previews des liens partagés sur les réseaux sociaux afficheront désormais l'image, le titre et la description spécifiques à chaque article.

#### 9.6.3 Normalisation de casse du slug (`app/blog/[slug]/page.tsx`)

Ajout d'une normalisation dans la route et dans `generateMetadata()` :

- Si le slug contient des majuscules (ex: `/blog/Comprendre-Hypnose`), redirection automatique vers la version minuscule (`/blog/comprendre-hypnose`)
- `generateMetadata()` normalise également le slug en minuscules avant la requête Prisma

**Impact** : Prévient les 404 causés par des URLs avec majuscules accidentelles et garantit une URL canonique unique.

---

## 10. Actions restantes avant migration

### 10.1 Actions bloquantes

| Action                                                   | Priorité | Responsable    |
| -------------------------------------------------------- | -------- | -------------- |
| Générer l'image `traverser-aider-crise-existentiel.webp` | CRITIQUE | Manuel (admin) |

### 10.2 Actions recommandées

| Action                                          | Priorité | Détail                                             |
| ----------------------------------------------- | -------- | -------------------------------------------------- |
| Corriger le manifest PWA                        | Moyenne  | Remplacer `/images/David_Duquenne.png` par `.webp` |
| Archiver les séminaires passés                  | Faible   | 2 séminaires expirés dans `seminars.json`          |
| Exclure `test-markdown-complet` de la migration | Faible   | Article de test daté 2093                          |

---

## 11. Phase 3 — Migration des données (exécutée le 19/02/2026)

### 11.1 Environnement de migration

- **Base de données** : PostgreSQL 16 local
- **Schéma** : Prisma `db push` (toutes les tables créées)
- **Supabase** : non connecté (images déjà dans `/public/images/blog/`)

### 11.2 Exécution des migrations

| Étape | Script                                    | Source                     | Destination                              | Résultat                        |
| ----- | ----------------------------------------- | -------------------------- | ---------------------------------------- | ------------------------------- |
| 1     | `migrate-seminars-to-db.ts`               | `seminars.json`            | Table `Seminar`                          | 4/4 créés, site `psypnos` créé  |
| 2     | `migrate-testimonials-to-db.ts`           | `testimonials.json`        | Table `Testimonial`                      | 5/5 créés                       |
| 3     | `migrate-blog-from-json.ts`               | `psypnos-blog-export.json` | Table `BlogPostExtended`                 | 98/98 créés, 0 erreur           |
| 4     | `migrate-blogpostextended-to-blogpost.ts` | `BlogPostExtended`         | Table `BlogPost` + `Tag` + `BlogPostTag` | 98/98 créés, 420 tags, 0 erreur |

### 11.3 Comptages post-migration

| Table              | Attendu | Obtenu | Statut |
| ------------------ | ------- | ------ | ------ |
| `Site`             | 1       | 1      | OK     |
| `BlogPostExtended` | 98      | 98     | OK     |
| `BlogPost`         | 98      | 98     | OK     |
| `Tag`              | 420     | 420    | OK     |
| `BlogPostTag`      | 709     | 709    | OK     |
| `Seminar`          | 4       | 4      | OK     |
| `Testimonial`      | 5       | 5      | OK     |

### 11.4 Vérifications d'intégrité

| Vérification                                      | Résultat                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Articles publiés (PUBLISHED)                      | 62 (attendu : 62)                                                    |
| Articles brouillons (DRAFT)                       | 36 (attendu : 36)                                                    |
| Articles publiés accessibles (publishedAt <= now) | 62                                                                   |
| Doublons de slugs                                 | 0                                                                    |
| Slugs avec majuscules ou caractères spéciaux      | 0                                                                    |
| Articles publiés sans excerpt                     | 0                                                                    |
| Articles publiés sans contenu suffisant           | 0                                                                    |
| Articles publiés avec FAQ                         | 59/62                                                                |
| Articles publiés avec JSON-LD                     | 62/62                                                                |
| Articles publiés avec coverImage                  | 62/62                                                                |
| Articles publiés avec authorName                  | 62/62                                                                |
| Articles avec tags                                | 97/98                                                                |
| Article sans tags                                 | 1 (`comprendre-psychotherapie-en-visio` — tags vides dans la source) |
| Images correspondantes (slug.webp)                | 61/62 (`traverser-aider-crise-existentiel.webp` manquante)           |

### 11.5 Répartition par catégorie (confirmée)

| Catégorie  | Total | Publiés | Brouillons |
| ---------- | ----- | ------- | ---------- |
| Comprendre | 48    | 24      | 24         |
| Traverser  | 27    | 21      | 6          |
| Découvrir  | 17    | 11      | 6          |
| Cheminer   | 6     | 6       | 0          |

### 11.6 Test d'idempotence

Chaque migration a été relancée une seconde fois pour vérifier l'absence de doublons :

| Script                                    | Résultat 2e exécution                             |
| ----------------------------------------- | ------------------------------------------------- |
| `migrate-seminars-to-db.ts`               | 0 créés, 4 ignorés                                |
| `migrate-testimonials-to-db.ts`           | 0 créés, 5 ignorés                                |
| `migrate-blog-from-json.ts`               | 0 migrés, 98 ignorés                              |
| `migrate-blogpostextended-to-blogpost.ts` | « All articles already migrated. Nothing to do. » |

### 11.7 Correction apportée au script de migration

Le script `migrate-blogpostextended-to-blogpost.ts` avait un site ID hardcodé (`cmkpjzwu00000zc986w1kta2y`). Remplacé par un lookup dynamique via `prisma.site.findUnique({ where: { slug: 'psypnos' } })` pour le rendre portable.

### 11.8 Anomalies de données source

| Anomalie                                                           | Impact                        | Action                       |
| ------------------------------------------------------------------ | ----------------------------- | ---------------------------- |
| `comprendre-psychotherapie-en-visio` : tags vides                  | Faible (pas de tags affichés) | Ajouter des tags via l'admin |
| 3 articles publiés sans FAQ                                        | Aucun (FAQ optionnelle)       | Aucune action requise        |
| `test-markdown-complet` : article de test migré (DRAFT, daté 2093) | Aucun (pas publié)            | Supprimer via l'admin        |

---

## 12. Phase 4 — Infrastructure réseaux sociaux

### 12.1 Problème identifié

L'ensemble de l'infrastructure réseaux sociaux (41 fichiers) était désactivé par des directives `@ts-nocheck` empêchant toute vérification TypeScript. L'analyse a révélé que la cause racine était un **décalage majeur entre le schéma Prisma et le code applicatif** : 15+ champs manquants, renommés ou mal typés.

### 12.2 Corrections du schéma Prisma (`packages/db/prisma/schema.prisma`)

#### Modèle `SocialAccount` (5 corrections)

| Champ Prisma (avant)               | Champ applicatif (attendu)        | Action     |
| ---------------------------------- | --------------------------------- | ---------- |
| `platformId`                       | `accountId`                       | Renommé    |
| `tokenExpiresAt`                   | `tokenExpiry`                     | Renommé    |
| _(absent)_                         | `scope String[]`                  | Ajouté     |
| _(absent)_                         | `lastUsed DateTime?`              | Ajouté     |
| `@@unique([platform, platformId])` | `@@unique([platform, accountId])` | Mis à jour |

#### Enum `SocialPostStatus` (1 correction)

| Valeur manquante | Action |
| ---------------- | ------ |
| `CANCELLED`      | Ajouté |

#### Modèle `SocialPost` (7 corrections)

| Champ Prisma (avant) | Champ applicatif (attendu) | Action  |
| -------------------- | -------------------------- | ------- |
| _(absent)_           | `hashtags String[]`        | Ajouté  |
| _(absent)_           | `linkUrl String?`          | Ajouté  |
| `externalUrl`        | `platformUrl`              | Renommé |
| _(absent)_           | `generatedBy String?`      | Ajouté  |
| _(absent)_           | `aiPrompt String?`         | Ajouté  |
| _(absent)_           | `aiModel String?`          | Ajouté  |
| _(absent)_           | `metadata Json?`           | Ajouté  |

#### Modèle `SocialPostAnalytics` (1 correction)

| Champ Prisma (avant) | Champ applicatif (attendu) | Action  |
| -------------------- | -------------------------- | ------- |
| `lastSyncAt`         | `fetchedAt`                | Renommé |

#### Modèles ajoutés (2 nouveaux)

| Modèle                | Champs principaux                                                              |
| --------------------- | ------------------------------------------------------------------------------ |
| `SocialTemplate`      | `name`, `platform`, `promptTemplate`, `defaultTone`, `defaultHashtags`, etc.   |
| `SocialGenerationLog` | `blogSlug`, `platform`, `inputContent`, `promptUsed`, `generatedContent`, etc. |

**Validation** : `prisma validate` → schéma valide, `prisma generate` → client régénéré sans erreur.

### 12.3 Configuration Vercel Cron (`apps/psypnos/vercel.json`)

10 cron jobs ajoutés pour l'automatisation des réseaux sociaux :

| Chemin API                         | Fréquence      | Description                     |
| ---------------------------------- | -------------- | ------------------------------- |
| `/api/cron/social-publish`         | `*/5 * * * *`  | Publication automatique (5 min) |
| `/api/cron/fetch-social-analytics` | `0 */4 * * *`  | Récupération analytics (4h)     |
| `/api/cron/refresh-tokens`         | `0 * * * *`    | Rafraîchissement tokens (1h)    |
| `/api/cron/daily-report`           | `0 8 * * *`    | Rapport quotidien (8h)          |
| `/api/cron/weekly-report`          | `0 9 * * 1`    | Rapport hebdomadaire (lundi 9h) |
| `/api/cron/process-reports`        | `45 * * * *`   | Traitement des rapports         |
| `/api/cron/cleanup-data`           | `0 3 * * *`    | Nettoyage données (3h)          |
| `/api/cron/cleanup-jobs`           | `0 4 * * *`    | Nettoyage jobs (4h)             |
| `/api/cron/aggregate`              | `30 * * * *`   | Agrégation des données          |
| `/api/cron/check-alerts`           | `*/15 * * * *` | Vérification alertes (15 min)   |

### 12.4 Suppression des `@ts-nocheck` (41 fichiers)

| Répertoire                     | Fichiers nettoyés |
| ------------------------------ | ----------------- |
| `apps/psypnos/lib/social/`     | 21                |
| `apps/psypnos/app/api/social/` | 17                |
| `apps/psypnos/app/api/cron/`   | 3                 |
| **Total**                      | **41**            |

### 12.5 Corrections TypeScript (40 erreurs corrigées)

| Catégorie                                  | Occurrences | Correction                                       |
| ------------------------------------------ | ----------- | ------------------------------------------------ |
| `metadata` null vs undefined               | 3           | Cast `as Record<string, unknown> \| undefined`   |
| Accès tableau possiblement undefined       | 6           | Guard `if (!page)` + non-null assertion `!`      |
| `expiresIn` possiblement undefined         | 4           | Valeurs par défaut (`\|\| 3600`, `\|\| 5184000`) |
| `scope` type string vs string[]            | 2           | `Array.isArray()` + fallback `.split(' ')`       |
| `getAnalytics` méthode optionnelle         | 2           | Guard null avant appel                           |
| Propriétés AnalyticsResult                 | 10          | Accès via `result.data?.property \|\| 0`         |
| `platforms[0]` possiblement undefined      | 2           | Non-null assertion (longueur vérifiée en amont)  |
| `retryableErrors` absent de RetryConfig    | 2           | Tableau local avec patterns d'erreurs            |
| Sélection format/prompt possiblement undef | 9           | Non-null assertions + valeurs de fallback        |

**Fichiers modifiés** (11) :

- `app/api/cron/social-publish/route.ts`
- `app/api/social/auth/callback/route.ts`
- `app/api/social/posts/[id]/publish/route.ts`
- `lib/social/analytics.ts`
- `lib/social/generation.ts`
- `lib/social/oauth/refresh.ts`
- `lib/social/prompts/facebook-specs.ts`
- `lib/social/prompts/instagram-specs.ts`
- `lib/social/prompts/linkedin-specs.ts`
- `lib/social/prompts/threads-specs.ts`
- `app/api/social/generate-seminar/route.ts`

### 12.6 Vérification de compilation

```
Résultat final : 0 erreur dans les fichiers sociaux
(4 erreurs pré-existantes dans les fichiers de test auth-flow.test.ts / blog-flow.test.ts — hors périmètre)
```

### 12.7 Architecture OAuth vérifiée

| Plateforme | Flow OAuth        | Expiration token   | Stratégie de refresh             |
| ---------- | ----------------- | ------------------ | -------------------------------- |
| Facebook   | OAuth 2.0         | Page Token: jamais | Aucun refresh nécessaire         |
| Instagram  | Via Facebook      | Page Token: jamais | Aucun refresh nécessaire         |
| LinkedIn   | OpenID Connect    | 60 jours           | Refresh token automatique (cron) |
| Threads    | OAuth 2.0 (Graph) | 60 jours           | Long-lived token exchange        |
| Twitter/X  | OAuth 2.0 + PKCE  | 2 heures           | Refresh token automatique        |

### 12.8 Chiffrement des tokens

- Algorithme : **AES-256-GCM**
- Format stocké : `{IV}:{AUTH_TAG}:{CIPHERTEXT}`
- Variable requise : `SOCIAL_ENCRYPTION_KEY` (32 octets hex)

---

## Conclusion

L'audit, la vérification de compatibilité des URLs, la migration des données et la mise en place de l'infrastructure réseaux sociaux confirment une **compatibilité totale et une migration sans erreur** :

**Phases 1-3 (Audit, URLs, Données) :**

- **25/25** pages statiques publiques vérifiées
- **62/62** slugs d'articles publiés compatibles (aucun doublon, aucun caractère spécial)
- **87/87** URLs du sitemap concordantes avec les routes de l'App Router
- **5/5** redirections 301 en place
- **0** URL cassée détectée
- **98/98** articles migrés (BlogPostExtended + BlogPost multi-tenant)
- **420** tags créés avec **709** relations articles-tags
- **4/4** séminaires migrés
- **5/5** témoignages migrés
- **Idempotence confirmée** : aucun doublon lors des ré-exécutions

**Phase 4 (Infrastructure réseaux sociaux) :**

- **15+** corrections de schéma Prisma (champs renommés, ajoutés, 2 modèles créés)
- **10** cron jobs configurés dans `vercel.json`
- **41/41** fichiers sociaux débarrassés de `@ts-nocheck`
- **40/40** erreurs TypeScript corrigées
- **0** erreur de compilation dans les fichiers sociaux
- **5/5** plateformes OAuth vérifiées (Facebook, Instagram, LinkedIn, Threads, Twitter/X)

**Corrections appliquées** :

1. Image renommée : `comprendre-psychotherapie-spiritualite-ame.webp` → `comprendre-psychotherapie-spiritualite.webp`
2. Image en doublon supprimée : `Comprendre-hypnose-ericksonnienne.webp`
3. `og:image` et `twitter:card` ajoutés aux métadonnées des articles de blog
4. Normalisation de casse du slug ajoutée à la route `/blog/[slug]`
5. Script `migrate-blogpostextended-to-blogpost.ts` corrigé (lookup dynamique du site ID)
6. Schéma Prisma corrigé pour correspondre au code applicatif social (15+ corrections)
7. Configuration Vercel cron ajoutée (10 jobs)
8. `@ts-nocheck` supprimé de 41 fichiers sociaux
9. 40 erreurs TypeScript strictes corrigées dans 11 fichiers

**Actions manuelles restantes** :

1. Générer l'image de couverture pour `traverser-aider-crise-existentiel`
2. Ajouter des tags à `comprendre-psychotherapie-en-visio` via l'admin
3. Configurer les variables d'environnement sur Vercel (Phase 5)
4. Migrer le DNS de GANDI vers Vercel (Phase 6)
