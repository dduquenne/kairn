# Audit de la plateforme Kairn — Synthèse des préconisations

**Date :** 5 mars 2026
**Périmètre :** Architecture, code, sécurité, performance, robustesse, ergonomie
**Cibles :** Plateforme Kairn (tous packages) + site Psypnos

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Préconisations par catégorie](#préconisations-par-catégorie)
   - [Centralisation & Architecture](#1-centralisation--architecture)
   - [Sécurité](#2-sécurité)
   - [Performance](#3-performance)
   - [Robustesse & Qualité](#4-robustesse--qualité)
   - [Ergonomie & Accessibilité](#5-ergonomie--accessibilité)
3. [Matrice de priorité](#matrice-de-priorité)
4. [Graphe des dépendances](#graphe-des-dépendances)
5. [Ordre d'implémentation recommandé](#ordre-dimplémentation-recommandé)

---

## Vue d'ensemble

L'audit a identifié **50 préconisations** réparties en 5 catégories :

| Catégorie | Nombre | Critiques | Hautes | Moyennes | Faibles |
|-----------|--------|-----------|--------|----------|---------|
| Centralisation & Architecture | 22 | 2 | 8 | 10 | 2 |
| Sécurité | 12 | 2 | 6 | 4 | 0 |
| Performance | 6 | 0 | 3 | 2 | 1 |
| Robustesse & Qualité | 7 | 0 | 4 | 3 | 0 |
| Ergonomie & Accessibilité | 3 | 0 | 1 | 2 | 0 |
| **Total** | **50** | **4** | **22** | **21** | **3** |

### Points forts identifiés

- Architecture monorepo bien structurée avec Turborepo
- Séparation claire en packages (@kairn/core, @kairn/api, @kairn/ui, etc.)
- Système JWT avec rotation de clés (SecretsManager) bien conçu
- Protection CSRF avec signed tokens (timing-safe comparison)
- Schéma Prisma multi-tenant avec siteId sur les modèles principaux
- Headers de sécurité complets (CSP, HSTS, X-Frame-Options, Permissions-Policy)
- Système de cache à deux niveaux (mémoire + API cache)
- Error classes hiérarchiques dans @kairn/core

### Points critiques identifiés

- **Fonctionnalités métier massivement dans l'app** au lieu des packages partagés (analytics, social, admin)
- **Failles multi-tenancy** : plusieurs modèles sans siteId (Tag, BlogAnalytics, Appointment, etc.)
- **Secrets JWT en clair** en base de données
- **CSP affaiblie** par `'unsafe-inline'` et `'unsafe-eval'`
- **Rate limiting non partagé** entre instances Serverless

---

## Préconisations par catégorie

### 1. Centralisation & Architecture

Ces préconisations visent à rendre les fonctionnalités réutilisables pour tout nouveau site de la plateforme.

| # | Issue | Titre | Priorité | Effort |
|---|-------|-------|----------|--------|
| 1 | [#286](https://github.com/dduquenne/kairn/issues/286) | Centraliser le module analytics dans @kairn/analytics | Critique | Élevé |
| 2 | [#287](https://github.com/dduquenne/kairn/issues/287) | Centraliser le module social media dans @kairn/social | Critique | Élevé |
| 3 | [#288](https://github.com/dduquenne/kairn/issues/288) | Centraliser les composants admin blog dans @kairn/admin | Haute | Moyen |
| 4 | [#294](https://github.com/dduquenne/kairn/issues/294) | Centraliser les hooks réutilisables dans les packages partagés | Moyenne | Faible |
| 5 | [#295](https://github.com/dduquenne/kairn/issues/295) | Centraliser la gestion des séminaires | Moyenne | Moyen |
| 6 | [#300](https://github.com/dduquenne/kairn/issues/300) | Centraliser la gestion du déploiement | Moyenne | Moyen |
| 7 | [#301](https://github.com/dduquenne/kairn/issues/301) | Centraliser le chatbot/assistant IA | Moyenne | Moyen |
| 8 | [#302](https://github.com/dduquenne/kairn/issues/302) | Centraliser les composants admin (configuration, customization, settings) | Haute | Élevé |
| 9 | [#306](https://github.com/dduquenne/kairn/issues/306) | Centraliser la gestion des images et du stockage Supabase | Moyenne | Moyen |
| 10 | [#307](https://github.com/dduquenne/kairn/issues/307) | Centraliser la gestion des emails (templates, envoi) | Moyenne | Moyen |
| 11 | [#308](https://github.com/dduquenne/kairn/issues/308) | Extraire les sections de page réutilisables vers @kairn/ui | Moyenne | Moyen |
| 12 | [#314](https://github.com/dduquenne/kairn/issues/314) | Centraliser le middleware Next.js dans un package partagé | Haute | Moyen |
| 13 | [#316](https://github.com/dduquenne/kairn/issues/316) | Centraliser la logique de cache Redis dans @kairn/core | Moyenne | Moyen |
| 14 | [#318](https://github.com/dduquenne/kairn/issues/318) | Centraliser ErrorBoundary avec reporting dans @kairn/ui | Moyenne | Faible |
| 15 | [#319](https://github.com/dduquenne/kairn/issues/319) | Centraliser CookieConsentBanner et conformité RGPD | Haute | Moyen |
| 16 | [#320](https://github.com/dduquenne/kairn/issues/320) | Centraliser la configuration PWA et les fonctionnalités mobile | Moyenne | Moyen |
| 17 | [#326](https://github.com/dduquenne/kairn/issues/326) | Centraliser VersionChecker et WebVitalsReporter | Faible | Faible |
| 18 | [#327](https://github.com/dduquenne/kairn/issues/327) | Centraliser les CRON jobs et withAdminAuth dans @kairn/api | Haute | Moyen |
| 19 | [#323](https://github.com/dduquenne/kairn/issues/323) | Système de migration et seeding centralisé pour nouveaux sites | Haute | Moyen |
| 20 | [#331](https://github.com/dduquenne/kairn/issues/331) | Standardiser la gestion des erreurs API | Moyenne | Moyen |
| 21 | [#335](https://github.com/dduquenne/kairn/issues/335) | Centraliser les pages SEO géographiques | Moyenne | Moyen |
| 22 | [#289](https://github.com/dduquenne/kairn/issues/289) | Unifier BlogPost et BlogPostExtended | Haute | Moyen |

### 2. Sécurité

| # | Issue | Titre | Priorité | Effort |
|---|-------|-------|----------|--------|
| 23 | [#290](https://github.com/dduquenne/kairn/issues/290) | Modèles analytics sans siteId obligatoire — faille multi-tenancy | Critique | Moyen |
| 24 | [#291](https://github.com/dduquenne/kairn/issues/291) | Tag model non scopé par siteId | Haute | Moyen |
| 25 | [#292](https://github.com/dduquenne/kairn/issues/292) | CSP avec 'unsafe-inline' et 'unsafe-eval' | Haute | Moyen |
| 26 | [#293](https://github.com/dduquenne/kairn/issues/293) | Double rate limiting redondant et non partagé entre instances | Haute | Moyen |
| 27 | [#296](https://github.com/dduquenne/kairn/issues/296) | Absence de refresh token dans le flux d'authentification | Haute | Moyen |
| 28 | [#297](https://github.com/dduquenne/kairn/issues/297) | Secret JWT stocké en clair en base de données | Critique | Moyen |
| 29 | [#298](https://github.com/dduquenne/kairn/issues/298) | CSRF secret fallback sur JWT_SECRET | Moyenne | Faible |
| 30 | [#303](https://github.com/dduquenne/kairn/issues/303) | Validation siteId dans handler blog — siteId via query string | Haute | Faible |
| 31 | [#305](https://github.com/dduquenne/kairn/issues/305) | Vérification de rôle incomplète dans withAuth/withAdmin | Haute | Faible |
| 32 | [#321](https://github.com/dduquenne/kairn/issues/321) | Ajouter Appointment au scope multi-tenant | Haute | Moyen |
| 33 | [#322](https://github.com/dduquenne/kairn/issues/322) | Rate limiting par siteId pour isolation multi-tenant | Moyenne | Faible |
| 34 | [#330](https://github.com/dduquenne/kairn/issues/330) | Protection contre l'énumération d'utilisateurs | Moyenne | Faible |

### 3. Performance

| # | Issue | Titre | Priorité | Effort |
|---|-------|-------|----------|--------|
| 35 | [#299](https://github.com/dduquenne/kairn/issues/299) | Headers de sécurité dupliqués entre next.config.mjs et middleware.ts | Faible | Faible |
| 36 | [#312](https://github.com/dduquenne/kairn/issues/312) | Optimiser le schéma Prisma — index manquants et requêtes N+1 | Moyenne | Moyen |
| 37 | [#313](https://github.com/dduquenne/kairn/issues/313) | Homepage désactive le cache ISR — impact performance | Haute | Faible |
| 38 | [#325](https://github.com/dduquenne/kairn/issues/325) | Optimiser le bundle client — lazy loading des composants lourds | Haute | Faible |
| 39 | [#332](https://github.com/dduquenne/kairn/issues/332) | Pagination côté serveur pour les listes admin volumineuses | Haute | Moyen |
| 40 | [#333](https://github.com/dduquenne/kairn/issues/333) | Politique de rétention des données analytics | Moyenne | Moyen |

### 4. Robustesse & Qualité

| # | Issue | Titre | Priorité | Effort |
|---|-------|-------|----------|--------|
| 41 | [#304](https://github.com/dduquenne/kairn/issues/304) | Catch vides dans les modules d'authentification | Moyenne | Faible |
| 42 | [#309](https://github.com/dduquenne/kairn/issues/309) | Monitoring et alerting d'erreurs en production (Sentry) | Haute | Moyen |
| 43 | [#310](https://github.com/dduquenne/kairn/issues/310) | Tests E2E automatisés — Playwright configuré mais non exécuté | Haute | Élevé |
| 44 | [#311](https://github.com/dduquenne/kairn/issues/311) | Couverture de tests unitaires sur core et api | Haute | Moyen |
| 45 | [#315](https://github.com/dduquenne/kairn/issues/315) | Validation d'environnement au démarrage de l'application | Haute | Faible |
| 46 | [#324](https://github.com/dduquenne/kairn/issues/324) | Gestion des erreurs Prisma avec messages utilisateur appropriés | Moyenne | Faible |
| 47 | [#328](https://github.com/dduquenne/kairn/issues/328) | Documenter la rotation des secrets JWT | Moyenne | Faible |
| 48 | [#329](https://github.com/dduquenne/kairn/issues/329) | Rationaliser le pipeline CI | Moyenne | Faible |
| 49 | [#334](https://github.com/dduquenne/kairn/issues/334) | Health check endpoint centralisé | Haute | Faible |

### 5. Ergonomie & Accessibilité

| # | Issue | Titre | Priorité | Effort |
|---|-------|-------|----------|--------|
| 50 | [#317](https://github.com/dduquenne/kairn/issues/317) | Auditer et améliorer l'accessibilité des composants UI | Haute | Moyen |

---

## Matrice de priorité

```
                    Effort faible          Effort moyen           Effort élevé
                ┌────────────────────┬────────────────────┬────────────────────┐
  Priorité      │ #303 siteId blog   │ #290 siteId analytics │ #286 Analytics  │
  CRITIQUE      │ #298 CSRF secret   │ #297 JWT en clair  │ #287 Social       │
                │                    │                    │                    │
                ├────────────────────┼────────────────────┼────────────────────┤
  Priorité      │ #305 withAdmin     │ #291 Tag siteId    │ #302 Admin comps  │
  HAUTE         │ #315 Env validation│ #292 CSP           │ #310 Tests E2E    │
                │ #313 Homepage cache│ #293 Rate limit    │                    │
                │ #325 Bundle optim  │ #296 Refresh token │                    │
                │ #330 Enum users    │ #288 Blog admin    │                    │
                │ #334 Health check  │ #311 Tests unitaires│                   │
                │ #299 Headers dup   │ #309 Monitoring    │                    │
                │                    │ #314 Middleware     │                    │
                │                    │ #319 RGPD          │                    │
                │                    │ #327 CRON/AdminAuth│                    │
                │                    │ #323 Seeding       │                    │
                │                    │ #289 BlogPost unif │                    │
                │                    │ #321 Appointment   │                    │
                │                    │ #332 Pagination    │                    │
                │                    │ #317 Accessibilité │                    │
                ├────────────────────┼────────────────────┼────────────────────┤
  Priorité      │ #294 Hooks         │ #295 Séminaires    │                    │
  MOYENNE       │ #304 Catch vides   │ #300 Déploiement   │                    │
                │ #322 Rate/siteId   │ #301 Chatbot       │                    │
                │ #324 Prisma errors │ #306 Stockage      │                    │
                │ #326 Version/Vitals│ #307 Emails        │                    │
                │ #328 Rotation docs │ #308 Sections UI   │                    │
                │ #329 CI pipeline   │ #312 Index Prisma  │                    │
                │                    │ #316 Redis cache   │                    │
                │                    │ #318 ErrorBoundary  │                    │
                │                    │ #320 PWA/Mobile    │                    │
                │                    │ #331 Erreurs API   │                    │
                │                    │ #333 Rétention data│                    │
                │                    │ #335 Pages SEO geo │                    │
                └────────────────────┴────────────────────┴────────────────────┘
```

---

## Graphe des dépendances

Les issues sont interconnectées. Voici les dépendances principales :

### Cluster 1 : Multi-tenancy & Sécurité (fondation)

```
#290 (siteId analytics) ──┐
#291 (Tag siteId)     ────┤
#321 (Appointment siteId) ┤──→ #322 (Rate limit par siteId)
#303 (siteId blog query)  │
#289 (BlogPost unif)  ────┘
```

### Cluster 2 : Authentification & Secrets

```
#297 (JWT en clair) ──→ #328 (Rotation docs)
#296 (Refresh token) ─→ #305 (withAdmin rôle) ──→ #327 (CRON/AdminAuth)
#298 (CSRF secret)
#330 (Enum users)
```

### Cluster 3 : Centralisation des packages

```
#286 (Analytics)  ────┐
#287 (Social)     ────┤
#288 (Blog admin) ────┤──→ #302 (Admin composants) ──→ #323 (Seeding)
#295 (Séminaires) ────┤
#301 (Chatbot)    ────┘
                       ↓
#294 (Hooks) ─────────→ #308 (Sections UI)
#307 (Emails)          #319 (RGPD/Consent)
#306 (Stockage)        #320 (PWA/Mobile)
```

### Cluster 4 : Infrastructure & Monitoring

```
#293 (Rate limiting) ──→ #316 (Redis cache)
#309 (Monitoring)   ──→ #315 (Env validation) ──→ #334 (Health check)
#314 (Middleware)   ──→ #299 (Headers dupliqués)
#329 (CI pipeline)  ──→ #310 (Tests E2E) + #311 (Tests unitaires)
```

### Cluster 5 : Performance

```
#313 (Homepage cache) ──→ #325 (Bundle optim) ──→ #312 (Index Prisma)
#332 (Pagination)    ──→ #333 (Rétention data)
```

---

## Ordre d'implémentation recommandé

### Phase 1 — Corrections critiques (semaines 1-2)

**Objectif** : Corriger les failles de sécurité et les violations multi-tenancy

1. **#297** — Chiffrer les secrets JWT en base
2. **#290** — Rendre siteId obligatoire sur les modèles analytics
3. **#291** — Ajouter siteId au modèle Tag
4. **#303** — Supprimer siteId du query string dans le handler blog
5. **#305** — Implémenter la vérification de rôle dans withAuth
6. **#298** — Séparer CSRF_SECRET de JWT_SECRET
7. **#315** — Ajouter la validation d'environnement au démarrage
8. **#321** — Ajouter siteId au modèle Appointment

### Phase 2 — Sécurité & Robustesse (semaines 3-4)

**Objectif** : Renforcer la sécurité et la fiabilité

9. **#292** — Implémenter CSP nonce-based
10. **#296** — Implémenter le flux refresh token
11. **#293** — Unifier le rate limiting avec store partagé
12. **#334** — Créer le health check endpoint
13. **#309** — Intégrer Sentry pour le monitoring
14. **#304** — Éliminer les catch vides
15. **#330** — Protection anti-énumération
16. **#324** — Handler d'erreurs Prisma centralisé

### Phase 3 — Performance (semaines 5-6)

**Objectif** : Optimiser les performances du site

17. **#313** — Activer ISR sur la homepage
18. **#325** — Lazy loading des composants lourds
19. **#299** — Supprimer les headers dupliqués
20. **#312** — Ajouter les index Prisma manquants
21. **#332** — Pagination serveur systématique
22. **#289** — Unifier les modèles BlogPost

### Phase 4 — Centralisation fondamentale (semaines 7-10)

**Objectif** : Créer le socle pour les nouveaux sites

23. **#314** — Centraliser le middleware Next.js
24. **#327** — Centraliser withAdminAuth et CRON handlers
25. **#294** — Migrer les hooks réutilisables
26. **#331** — Standardiser la gestion des erreurs API
27. **#316** — Centraliser le cache Redis
28. **#307** — Centraliser la gestion des emails
29. **#319** — Centraliser le CookieConsentBanner/RGPD
30. **#323** — Système de seeding pour nouveaux sites
31. **#328** — Documenter la rotation des secrets

### Phase 5 — Centralisation métier (semaines 11-16)

**Objectif** : Migrer les fonctionnalités métier vers les packages partagés

32. **#288** — Centraliser les composants blog admin
33. **#286** — Centraliser le module analytics
34. **#287** — Centraliser le module social media
35. **#302** — Centraliser les composants admin
36. **#295** — Centraliser la gestion des séminaires
37. **#301** — Centraliser le chatbot IA
38. **#300** — Centraliser la gestion du déploiement
39. **#306** — Centraliser le stockage Supabase

### Phase 6 — Qualité & Ergonomie (semaines 17-20)

**Objectif** : Améliorer la qualité globale et l'expérience utilisateur

40. **#311** — Améliorer la couverture de tests unitaires
41. **#310** — Implémenter les tests E2E
42. **#317** — Audit d'accessibilité des composants UI
43. **#329** — Optimiser le pipeline CI
44. **#308** — Extraire les sections de page réutilisables
45. **#318** — ErrorBoundary centralisé
46. **#320** — Centraliser PWA/mobile
47. **#326** — Centraliser VersionChecker/WebVitals
48. **#335** — Système de pages SEO géographiques
49. **#322** — Rate limiting par siteId
50. **#333** — Politique de rétention des données

---

## Récapitulatif des issues créées

| Issue | Titre |
|-------|-------|
| [#286](https://github.com/dduquenne/kairn/issues/286) | [AUDIT] Centraliser le module analytics dans @kairn/analytics |
| [#287](https://github.com/dduquenne/kairn/issues/287) | [AUDIT] Centraliser le module social media dans @kairn/social |
| [#288](https://github.com/dduquenne/kairn/issues/288) | [AUDIT] Centraliser les composants admin blog dans @kairn/admin |
| [#289](https://github.com/dduquenne/kairn/issues/289) | [AUDIT] Dupliquer BlogPost et BlogPostExtended — unifier le modèle |
| [#290](https://github.com/dduquenne/kairn/issues/290) | [AUDIT] Modèles analytics sans siteId obligatoire — faille multi-tenancy |
| [#291](https://github.com/dduquenne/kairn/issues/291) | [AUDIT] Tag model non scopé par siteId |
| [#292](https://github.com/dduquenne/kairn/issues/292) | [AUDIT] CSP avec 'unsafe-inline' et 'unsafe-eval' |
| [#293](https://github.com/dduquenne/kairn/issues/293) | [AUDIT] Double rate limiting redondant |
| [#294](https://github.com/dduquenne/kairn/issues/294) | [AUDIT] Centraliser les hooks réutilisables |
| [#295](https://github.com/dduquenne/kairn/issues/295) | [AUDIT] Centraliser la gestion des séminaires |
| [#296](https://github.com/dduquenne/kairn/issues/296) | [AUDIT] Absence de refresh token dans l'authentification |
| [#297](https://github.com/dduquenne/kairn/issues/297) | [AUDIT] Secret JWT stocké en clair en base de données |
| [#298](https://github.com/dduquenne/kairn/issues/298) | [AUDIT] CSRF secret fallback sur JWT_SECRET |
| [#299](https://github.com/dduquenne/kairn/issues/299) | [AUDIT] Headers de sécurité dupliqués |
| [#300](https://github.com/dduquenne/kairn/issues/300) | [AUDIT] Centraliser la gestion du déploiement |
| [#301](https://github.com/dduquenne/kairn/issues/301) | [AUDIT] Centraliser le chatbot/assistant IA |
| [#302](https://github.com/dduquenne/kairn/issues/302) | [AUDIT] Centraliser les composants admin (config, custom, settings) |
| [#303](https://github.com/dduquenne/kairn/issues/303) | [AUDIT] Validation siteId dans handler blog |
| [#304](https://github.com/dduquenne/kairn/issues/304) | [AUDIT] Catch vides dans les modules d'authentification |
| [#305](https://github.com/dduquenne/kairn/issues/305) | [AUDIT] Vérification de rôle incomplète dans withAuth |
| [#306](https://github.com/dduquenne/kairn/issues/306) | [AUDIT] Centraliser la gestion des images et stockage Supabase |
| [#307](https://github.com/dduquenne/kairn/issues/307) | [AUDIT] Centraliser la gestion des emails |
| [#308](https://github.com/dduquenne/kairn/issues/308) | [AUDIT] Extraire les sections de page réutilisables |
| [#309](https://github.com/dduquenne/kairn/issues/309) | [AUDIT] Monitoring et alerting d'erreurs en production |
| [#310](https://github.com/dduquenne/kairn/issues/310) | [AUDIT] Tests E2E automatisés |
| [#311](https://github.com/dduquenne/kairn/issues/311) | [AUDIT] Couverture de tests unitaires |
| [#312](https://github.com/dduquenne/kairn/issues/312) | [AUDIT] Optimiser le schéma Prisma — index manquants |
| [#313](https://github.com/dduquenne/kairn/issues/313) | [AUDIT] Homepage désactive le cache ISR |
| [#314](https://github.com/dduquenne/kairn/issues/314) | [AUDIT] Centraliser le middleware Next.js |
| [#315](https://github.com/dduquenne/kairn/issues/315) | [AUDIT] Validation d'environnement au démarrage |
| [#316](https://github.com/dduquenne/kairn/issues/316) | [AUDIT] Centraliser la logique de cache Redis |
| [#317](https://github.com/dduquenne/kairn/issues/317) | [AUDIT] Améliorer l'accessibilité des composants UI |
| [#318](https://github.com/dduquenne/kairn/issues/318) | [AUDIT] ErrorBoundary centralisé avec reporting |
| [#319](https://github.com/dduquenne/kairn/issues/319) | [AUDIT] Centraliser CookieConsentBanner et conformité RGPD |
| [#320](https://github.com/dduquenne/kairn/issues/320) | [AUDIT] Centraliser configuration PWA et mobile |
| [#321](https://github.com/dduquenne/kairn/issues/321) | [AUDIT] Ajouter Appointment au scope multi-tenant |
| [#322](https://github.com/dduquenne/kairn/issues/322) | [AUDIT] Rate limiting par siteId |
| [#323](https://github.com/dduquenne/kairn/issues/323) | [AUDIT] Système de migration et seeding centralisé |
| [#324](https://github.com/dduquenne/kairn/issues/324) | [AUDIT] Gestion des erreurs Prisma |
| [#325](https://github.com/dduquenne/kairn/issues/325) | [AUDIT] Optimiser le bundle client — lazy loading |
| [#326](https://github.com/dduquenne/kairn/issues/326) | [AUDIT] Centraliser VersionChecker et WebVitalsReporter |
| [#327](https://github.com/dduquenne/kairn/issues/327) | [AUDIT] Centraliser CRON jobs et withAdminAuth |
| [#328](https://github.com/dduquenne/kairn/issues/328) | [AUDIT] Documenter la rotation des secrets JWT |
| [#329](https://github.com/dduquenne/kairn/issues/329) | [AUDIT] Rationaliser le pipeline CI |
| [#330](https://github.com/dduquenne/kairn/issues/330) | [AUDIT] Protection contre l'énumération d'utilisateurs |
| [#331](https://github.com/dduquenne/kairn/issues/331) | [AUDIT] Standardiser la gestion des erreurs API |
| [#332](https://github.com/dduquenne/kairn/issues/332) | [AUDIT] Pagination côté serveur pour listes admin |
| [#333](https://github.com/dduquenne/kairn/issues/333) | [AUDIT] Politique de rétention des données analytics |
| [#334](https://github.com/dduquenne/kairn/issues/334) | [AUDIT] Health check endpoint centralisé |
| [#335](https://github.com/dduquenne/kairn/issues/335) | [AUDIT] Centraliser les pages SEO géographiques |
