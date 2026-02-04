# Rapport d'Analyse Architecturale - Kairn & Psypnos

**Version**: 1.0
**Date**: 4 février 2026
**Auteur**: Analyse automatisée Claude Code

---

## Table des matières

1. [Synthèse Exécutive](#1-synthèse-exécutive)
2. [Architecture Actuelle](#2-architecture-actuelle)
3. [Analyse Détaillée par Domaine](#3-analyse-détaillée-par-domaine)
4. [Plan de Développement en Phases](#4-plan-de-développement-en-phases)
5. [Annexes](#5-annexes)

---

## 1. Synthèse Exécutive

### 1.1 Points Forts de l'Architecture Actuelle

| Domaine | Score | Commentaire |
|---------|-------|-------------|
| **Mutualisation** | 8/10 | Architecture monorepo bien structurée avec packages partagés |
| **Sécurité** | 7/10 | CSP, rate-limiting, JWT rotation présents mais améliorables |
| **SEO** | 8/10 | Structured data riche, pages géolocalisées, sitemap dynamique |
| **Performance** | 6/10 | ISR configuré mais optimisations manquantes |
| **Ergonomie** | 7/10 | Interface admin fonctionnelle, UX améliorable |
| **Robustesse** | 7/10 | Gestion d'erreurs présente mais tests limités |
| **Innovation** | 7/10 | IA intégrée, analytics maison, mais PWA basique |

### 1.2 Stack Technologique

```
Frontend:     Next.js 14 (App Router) + React 18 + TypeScript 5.4
Styling:      Tailwind CSS 3.4 + Framer Motion 11
Backend:      Next.js API Routes + Prisma 6 + PostgreSQL
Auth:         JWT custom (jose) avec rotation des secrets
Build:        Turborepo + pnpm 10
AI:           Anthropic Claude + OpenAI GPT
Analytics:    Solution maison avec tracking complet
Social:       Intégration multi-plateforme (Facebook, Instagram, LinkedIn, Threads)
```

### 1.3 Priorités Identifiées

1. **Critique** : Optimisation des performances (Core Web Vitals)
2. **Haute** : Renforcement de la sécurité (CSRF, validation)
3. **Haute** : Amélioration de l'accessibilité (WCAG 2.1 AA)
4. **Moyenne** : Mutualisation des composants Psypnos vers @kairn/ui
5. **Moyenne** : Couverture de tests
6. **Basse** : Innovations (PWA avancée, optimisations IA)

---

## 2. Architecture Actuelle

### 2.1 Structure du Monorepo

```
kairn/
├── apps/
│   ├── psypnos/           # Site principal (production)
│   └── unanima/           # À supprimer et recréer
├── packages/
│   ├── admin/             # Composants admin partagés
│   ├── ai/                # Services IA (Anthropic, OpenAI)
│   ├── analytics/         # Tracking client-side
│   ├── api/               # Handlers et middlewares API
│   ├── blog/              # Système de blog
│   ├── config/            # Schémas de configuration (Zod)
│   ├── core/              # Utilitaires fondamentaux
│   ├── db/                # Prisma client et migrations
│   ├── social/            # OAuth et posting réseaux sociaux
│   └── ui/                # Composants React partagés
└── tooling/
    ├── eslint-config/     # Configuration ESLint partagée
    ├── tailwind-preset/   # Preset Tailwind Kairn
    └── typescript-config/ # Configurations TS partagées
```

### 2.2 Modèle de Données (Simplifié)

```prisma
// Multi-tenancy
Site ─┬─> User
      ├─> BlogPost ──> Tag
      ├─> Testimonial
      ├─> Contact
      ├─> Seminar
      └─> AnalyticsEvent ──> AnalyticsGoal, Alert, Anomaly

// Social Media
SocialAccount ──> SocialPost ──> SocialPostAnalytics

// Blog Extended
BlogPostExtended ──> BlogAnalytics, BlogFaqClick, BlogCtaClick
BlogGenerationJob (génération IA async)

// Déploiement
Deployment, MaintenanceMode
```

### 2.3 Architecture des Packages

#### @kairn/core (packages/core/src/)
- **auth/jwt.ts** : Gestion JWT avec rotation des secrets
- **auth/secrets-manager.ts** : Stockage sécurisé des clés
- **middleware/rate-limit.ts** : Protection contre les attaques brute-force
- **middleware/api-cache.ts** : Cache API avec stale-while-revalidate
- **cache/index.ts** : Cache mémoire avec TTL
- **config/site-config.ts** : Chargement de configuration multi-source
- **errors/index.ts** : Classes d'erreurs typées

#### @kairn/api (packages/api/src/)
- **handlers/** : Auth, Blog, Analytics, Contact, Seminars, Testimonials
- **middleware/** : withAuth, withAdmin, withRateLimit, withCSRF, withValidation
- **utils/** : Pagination, filtres, réponses formatées

#### @kairn/ui (packages/ui/src/)
- **components/blog/** : BlogCard, FeaturedCarousel, ReadingProgress, etc.
- **components/forms/** : ContactForm, FormField, validation
- **components/navigation/** : Breadcrumb, BackButton, StickyNavigation
- **components/testimonials/** : TestimonialCard, TestimonialsCarousel

---

## 3. Analyse Détaillée par Domaine

### 3.1 Mutualisation dans le Socle Kairn

#### Forces Actuelles
- Architecture monorepo avec dépendances workspace (`workspace:*`)
- Configuration TypeScript et ESLint partagées
- Schémas Zod dans @kairn/config pour la validation
- Composants UI exportés proprement avec types

#### Points d'Amélioration

| Composant Psypnos | Action Recommandée | Priorité |
|-------------------|-------------------|----------|
| `FloatingContactButton` | Migrer vers @kairn/ui | Moyenne |
| `GeoPage` | Existe déjà dans @kairn/ui, supprimer le doublon | Haute |
| `ThemeContext` | Créer @kairn/ui/contexts | Moyenne |
| `ToastContext` | Utiliser ToastProvider de @kairn/ui | Haute |
| Tracking (lib/tracking/) | Migrer vers @kairn/analytics | Moyenne |
| Social prompts (lib/social/prompts/) | Migrer vers @kairn/ai | Basse |

#### Configuration Non Mutualisée
```
apps/psypnos/config/site.config.ts    # OK - spécifique au site
apps/psypnos/config/theme.config.ts   # À évaluer pour mutualisation partielle
apps/psypnos/lib/categoryColors.ts    # Migrer vers @kairn/config
```

### 3.2 Ergonomie & Expérience Utilisateur

#### Interface Publique (Psypnos)

**Points Forts:**
- Design cohérent avec thème sombre élégant
- Navigation principale claire
- Bouton flottant de contact
- Pages géolocalisées pour le SEO local

**Améliorations Recommandées:**

| Problème | Solution | Impact |
|----------|----------|--------|
| Pas de retour visuel sur le scroll | Ajouter indicateur de progression | UX |
| Navigation mobile non sticky | Implémenter StickyNavigation de @kairn/ui | UX |
| Formulaires sans feedback immédiat | Ajouter validation temps réel | UX |
| Pas de recherche sur le blog | Implémenter SearchBar avec debounce | UX |
| Chargement initial lent | Skeleton screens systématiques | Perf |

#### Interface Admin

**Points Forts:**
- Sidebar avec navigation claire
- Dashboard analytics complet
- Éditeur Markdown intégré
- Calendrier social media

**Améliorations Recommandées:**

| Problème | Solution | Impact |
|----------|----------|--------|
| Pas de dark/light toggle admin | Ajouter ThemeToggle | UX |
| Tables sans export direct | Utiliser ExportButton de @kairn/admin | UX |
| Pas de raccourcis clavier | Implémenter keyboard navigation | UX |
| Loading states inconsistants | Standardiser avec Skeleton | UX |
| Mobile admin limité | Améliorer responsive admin | UX |

### 3.3 Infographie & Design System

#### Analyse du Thème Actuel

```typescript
// theme.config.ts - Palette Psypnos
colors: {
  primary: '#c7a962',    // Gold - CTA, accents
  secondary: '#0e1f2f',  // Night - Background principal
  accent: '#f0d9a3',     // Gold light - Hovers
  background: '#0e1f2f', // Night
  foreground: '#f5f1e6', // Ivory - Texte principal
}

fonts: {
  display: 'Playfair Display', // Titres élégants
  body: 'Inter',               // Lisibilité optimale
}
```

**Recommandations Design:**

| Aspect | État Actuel | Amélioration |
|--------|-------------|--------------|
| Contraste | 4.5:1 minimum | Vérifier WCAG AAA (7:1) pour texte petit |
| Espacement | Inconsistant | Créer échelle de spacing dans Tailwind preset |
| Icônes | Lucide React | Cohérent, OK |
| Illustrations | Manquantes | Ajouter illustrations SVG thématiques |
| Micro-animations | Framer Motion utilisé | Standardiser les transitions |

### 3.4 Performance

#### Métriques Actuelles (Estimées)

| Métrique | Cible | Estimation Actuelle |
|----------|-------|---------------------|
| LCP | < 2.5s | ~3.2s |
| FID | < 100ms | ~80ms |
| CLS | < 0.1 | ~0.15 |
| TTI | < 3.8s | ~4.5s |
| Bundle Size | < 200KB | ~280KB |

#### Problèmes Identifiés

1. **Images non optimisées**
   - Certaines images en .webp mais pas toutes
   - Pas de `blur placeholder` systématique
   - Dimensions non définies causant CLS

2. **JavaScript trop lourd**
   - @uiw/react-md-editor (admin) chargé globalement
   - recharts inclus même sur pages sans graphiques
   - Framer Motion non tree-shakeable

3. **Fonts**
   - Google Fonts avec `display: swap` (OK)
   - Mais pas de preload des fonts critiques

4. **Cache**
   - ISR configuré (revalidate: 86400)
   - Mais pas de SWR pour données dynamiques

#### Optimisations Recommandées

```javascript
// next.config.mjs - Ajouts recommandés
experimental: {
  optimizePackageImports: ['lucide-react', 'recharts'],
  // Bundle analyzer en dev
  // bundleAnalyzer: { enabled: process.env.ANALYZE === 'true' },
}
```

### 3.5 Robustesse

#### Tests Existants

```
packages/core/src/__tests__/
├── api-cache.test.ts
├── cache.test.ts
├── cookies.test.ts
├── env.test.ts
├── errors.test.ts
├── jwt.test.ts
├── rate-limit.test.ts
├── secrets-manager.test.ts
└── site-config.test.ts

apps/psypnos/app/api/auth/__tests__/
└── rate-limiter.test.ts
```

**Couverture Estimée:** ~25%

#### Améliorations Requises

| Type de Test | État | Priorité |
|--------------|------|----------|
| Unit tests @kairn/core | Bon | - |
| Unit tests @kairn/api | Manquant | Haute |
| Unit tests @kairn/ui | Manquant | Haute |
| Integration tests API | Manquant | Moyenne |
| E2E tests (Playwright) | Manquant | Moyenne |
| Visual regression | Manquant | Basse |

#### Gestion d'Erreurs

**Points Forts:**
- Classes d'erreurs typées (`AppError`, `ValidationError`, etc.)
- Pages error.tsx et global-error.tsx présentes
- Logging structuré avec niveaux

**Améliorations:**
- Ajouter error boundary par section
- Implémenter retry automatique sur erreurs réseau
- Alerting sur erreurs critiques (intégration Sentry/LogSnag)

### 3.6 Sécurité

#### Mesures Actuelles

| Mesure | Implémentée | Fichier |
|--------|-------------|---------|
| Content Security Policy | ✅ | `next.config.mjs:7-22` |
| HSTS | ✅ | `next.config.mjs:52-55` |
| X-Frame-Options | ✅ | `next.config.mjs:32-35` |
| X-Content-Type-Options | ✅ | `next.config.mjs:37-40` |
| Rate Limiting | ✅ | `@kairn/core/middleware/rate-limit.ts` |
| JWT avec expiration | ✅ | `@kairn/core/auth/jwt.ts` |
| JWT Key Rotation | ✅ | `@kairn/core/auth/secrets-manager.ts` |
| Input Validation (Zod) | ✅ | `@kairn/api/middleware/with-validation.ts` |
| Password Hashing (bcrypt) | ✅ | `@kairn/db` |
| CSRF Protection | ⚠️ Partiel | `@kairn/api/middleware/with-csrf.ts` |
| reCAPTCHA | ✅ | Formulaires publics |

#### Vulnérabilités Potentielles

| Risque | Sévérité | Mitigation |
|--------|----------|------------|
| CSP avec 'unsafe-inline' | Moyenne | Migrer vers nonces |
| Pas de rate-limit sur toutes les routes | Moyenne | Appliquer middleware globalement |
| Tokens sociaux en DB | Moyenne | Chiffrement at-rest |
| Logs potentiellement sensibles | Basse | Audit des logs |
| Dépendances outdated | Variable | Audit régulier (`pnpm audit`) |

### 3.7 Référencement (SEO)

#### Points Forts Actuels

1. **Structured Data riche** (`layout.tsx:142-468`)
   - LocalBusiness, MedicalBusiness, ProfessionalService
   - WebSite avec SearchAction
   - OfferCatalog avec prix

2. **Pages géolocalisées** (12 pages)
   - psychotherapie-{ville}
   - hypnose-{ville}
   - respiration-holotropique-{region}

3. **Sitemap dynamique** (`sitemap.ts`)
   - Pages statiques avec priorités
   - Articles de blog avec dates

4. **Meta tags complets**
   - Open Graph
   - Twitter Cards
   - Canonical URLs

#### Améliorations SEO

| Aspect | État | Action |
|--------|------|--------|
| robots.txt | Basique | Ajouter directives spécifiques |
| Hreflang | Absent | Ajouter si multilingue prévu |
| FAQ Schema | Présent sur articles | Étendre aux pages services |
| Video Schema | Absent | Ajouter si vidéos intégrées |
| Breadcrumbs | Présent | Vérifier sur toutes les pages |
| Internal linking | Partiel | Améliorer maillage interne |
| Page Speed | À optimiser | Voir section Performance |

### 3.8 Innovation

#### Fonctionnalités Innovantes Actuelles

1. **Génération IA de contenu**
   - Articles de blog (`@kairn/ai`)
   - Posts réseaux sociaux
   - Prompts optimisés par plateforme

2. **Analytics maison**
   - Tracking sans cookies tiers
   - Scroll depth, section time
   - Conversion funnels
   - Anomaly detection

3. **Social Media Management**
   - Multi-plateforme (5 réseaux)
   - Scheduling
   - Analytics cross-platform

#### Opportunités d'Innovation

| Fonctionnalité | Impact | Complexité |
|----------------|--------|------------|
| PWA offline complète | Haut | Moyenne |
| Chatbot IA intégré | Haut | Haute |
| Prise de RDV en ligne (Calendly-like) | Haut | Haute |
| A/B Testing natif | Moyen | Moyenne |
| Voice search optimization | Moyen | Basse |
| Web Vitals monitoring | Moyen | Basse |

---

## 4. Plan de Développement en Phases

### Phase 1 : Performance & Sécurité Critiques
**Durée estimée : 2-3 semaines**
**Priorité : CRITIQUE**

#### Objectifs
- Atteindre les Core Web Vitals "Good"
- Éliminer les vulnérabilités de sécurité

#### Tâches

| # | Tâche | Fichiers concernés |
|---|-------|-------------------|
| 1.1 | Optimiser les images (blur placeholders, sizes) | `apps/psypnos/**/*.tsx` |
| 1.2 | Implémenter lazy loading pour composants lourds | `apps/psypnos/app/admin/**` |
| 1.3 | Code splitting pour MD editor et recharts | `apps/psypnos/app/admin/blog/**` |
| 1.4 | Preload fonts critiques | `apps/psypnos/app/layout.tsx` |
| 1.5 | Migrer CSP vers nonces | `apps/psypnos/next.config.mjs` |
| 1.6 | Appliquer rate-limit global | `apps/psypnos/middleware.ts` |
| 1.7 | Chiffrer tokens sociaux | `packages/social/src/oauth/` |

#### Prompt Claude Code - Phase 1

```
Optimiser les performances et la sécurité du projet Kairn/Psypnos :

## Performance
1. Analyser le bundle avec `ANALYZE=true pnpm build` dans apps/psypnos
2. Identifier les composants > 50KB et implémenter dynamic imports
3. Ajouter blur placeholders à toutes les images Next.js
4. Configurer preload pour les fonts Inter et Playfair Display
5. Implémenter SWR pour les données dynamiques (testimonials, seminars)
6. Vérifier et fixer les problèmes de CLS (ajouter width/height aux images)

## Sécurité
1. Créer un middleware global apps/psypnos/middleware.ts avec rate-limiting
2. Migrer le CSP vers un système de nonces :
   - Générer un nonce par requête
   - L'injecter dans les scripts inline
   - Mettre à jour le header CSP
3. Implémenter le chiffrement AES-256-GCM pour les tokens OAuth dans @kairn/social
4. Auditer et mettre à jour les dépendances : `pnpm audit --fix`

Exécuter les tests après chaque modification. Committer régulièrement.
```

---

### Phase 2 : Mutualisation & Architecture
**Durée estimée : 2-3 semaines**
**Priorité : HAUTE**

#### Objectifs
- Éliminer les doublons de code
- Préparer le socle pour Unanima v2

#### Tâches

| # | Tâche | Source → Destination |
|---|-------|---------------------|
| 2.1 | Migrer FloatingContactButton | `psypnos/components/` → `@kairn/ui` |
| 2.2 | Unifier ThemeContext | `psypnos/lib/` → `@kairn/ui/contexts` |
| 2.3 | Supprimer doublon GeoPage | `psypnos/components/GeoPage.tsx` (supprimer) |
| 2.4 | Migrer tracking | `psypnos/lib/tracking/` → `@kairn/analytics` |
| 2.5 | Migrer categoryColors | `psypnos/lib/` → `@kairn/config` |
| 2.6 | Créer template site | Générer CLI scaffold |
| 2.7 | Documenter l'architecture | `docs/ARCHITECTURE.md` |

#### Prompt Claude Code - Phase 2

```
Mutualiser le code du projet Kairn pour préparer la création d'Unanima v2 :

## Migrations de Composants
1. Migrer `apps/psypnos/components/FloatingContactButton.tsx` vers `packages/ui/src/components/`
   - Rendre le composant configurable (couleurs, texte, icône)
   - Exporter depuis `packages/ui/src/index.ts`
   - Mettre à jour les imports dans psypnos

2. Créer `packages/ui/src/contexts/theme-context.tsx` basé sur `psypnos/lib/theme-context.tsx`
   - Supporter dark/light/system
   - Persister en localStorage
   - Exporter depuis index

3. Supprimer le doublon `psypnos/components/GeoPage.tsx`
   - Vérifier que @kairn/ui/GeoPage est utilisé partout
   - Mettre à jour les imports

## Migrations de Logique
4. Migrer `psypnos/lib/tracking/` vers `packages/analytics/src/client/`
   - Fusionner avec le code existant
   - Éviter les doublons de fonctionnalité

5. Migrer `psypnos/lib/categoryColors.ts` vers `packages/config/src/`
   - Créer un schéma Zod pour les couleurs de catégorie
   - Permettre l'extension par site

## Documentation
6. Créer `docs/ARCHITECTURE.md` documentant :
   - Structure des packages
   - Comment créer un nouveau site
   - Conventions de code
   - Flow de données

Committer chaque migration séparément avec un message descriptif.
```

---

### Phase 3 : Accessibilité & Ergonomie
**Durée estimée : 2 semaines**
**Priorité : HAUTE**

#### Objectifs
- Conformité WCAG 2.1 niveau AA
- Amélioration significative de l'UX

#### Tâches

| # | Tâche | Critère WCAG |
|---|-------|--------------|
| 3.1 | Focus visible sur tous les éléments interactifs | 2.4.7 |
| 3.2 | Skip links pour navigation | 2.4.1 |
| 3.3 | Labels ARIA sur formulaires | 1.3.1, 4.1.2 |
| 3.4 | Contraste texte/background | 1.4.3 |
| 3.5 | Alternatives textuelles images | 1.1.1 |
| 3.6 | Navigation clavier complète | 2.1.1 |
| 3.7 | Messages d'erreur explicites | 3.3.1 |
| 3.8 | Responsive tables (admin) | 1.3.1 |

#### Prompt Claude Code - Phase 3

```
Améliorer l'accessibilité du projet Kairn/Psypnos pour atteindre WCAG 2.1 AA :

## Focus & Navigation
1. Ajouter des styles focus-visible à tous les éléments interactifs
   - Créer une classe utilitaire Tailwind dans `tooling/tailwind-preset/`
   - Appliquer sur boutons, liens, inputs
   - Tester avec navigation clavier

2. Implémenter skip links dans `packages/ui/src/components/header.tsx`
   - "Aller au contenu principal"
   - "Aller à la navigation"
   - Visible uniquement au focus

## Formulaires
3. Auditer tous les formulaires pour les labels ARIA
   - `apps/psypnos/app/contact/page.tsx`
   - `apps/psypnos/app/demande-rendez-vous/page.tsx`
   - `apps/psypnos/app/inscription-seminaire/page.tsx`
   - Ajouter aria-describedby pour les erreurs
   - Ajouter aria-required

4. Améliorer les messages d'erreur
   - Rendre les erreurs plus descriptives
   - Ajouter des suggestions de correction
   - Annoncer les erreurs avec aria-live

## Contraste & Lisibilité
5. Vérifier les ratios de contraste avec l'outil axe-core
   - Installer `@axe-core/react` en dev
   - Corriger les problèmes identifiés

## Tests
6. Ajouter des tests d'accessibilité
   - Installer `jest-axe`
   - Créer tests pour les composants UI principaux

Tester avec VoiceOver/NVDA après chaque modification significative.
```

---

### Phase 4 : Tests & Qualité
**Durée estimée : 2-3 semaines**
**Priorité : MOYENNE**

#### Objectifs
- Couverture de tests > 60%
- CI/CD renforcé

#### Tâches

| # | Tâche | Package |
|---|-------|---------|
| 4.1 | Tests unitaires @kairn/api handlers | `packages/api/` |
| 4.2 | Tests unitaires @kairn/ui composants | `packages/ui/` |
| 4.3 | Tests d'intégration API | `apps/psypnos/app/api/` |
| 4.4 | Tests E2E Playwright | `apps/psypnos/e2e/` |
| 4.5 | Configurer coverage report | `vitest.config.ts` |
| 4.6 | Ajouter checks CI | `.github/workflows/` |

#### Prompt Claude Code - Phase 4

```
Améliorer la couverture de tests du projet Kairn :

## Tests Unitaires API
1. Créer des tests pour `packages/api/src/handlers/`
   - `auth/login.test.ts` - success, invalid credentials, rate limit
   - `blog/posts.test.ts` - CRUD, pagination, filtering
   - `contact/index.test.ts` - validation, spam detection
   - Mocker Prisma avec `vitest-mock-extended`

## Tests Unitaires UI
2. Créer des tests pour `packages/ui/src/components/`
   - `BlogCard.test.tsx` - rendering, props, click handlers
   - `ContactForm.test.tsx` - validation, submission, errors
   - `TestimonialsCarousel.test.tsx` - navigation, autoplay
   - Utiliser React Testing Library

## Tests d'Intégration
3. Créer des tests d'intégration API dans `apps/psypnos/`
   - Tester le flow complet auth (login → protected route)
   - Tester le flow blog (create → publish → view)
   - Utiliser une base de données de test

## Tests E2E
4. Configurer Playwright dans `apps/psypnos/`
   - Créer `playwright.config.ts`
   - Tests critiques :
     - Navigation principale
     - Formulaire de contact
     - Blog listing et lecture
     - Admin login

## CI/CD
5. Créer/mettre à jour `.github/workflows/ci.yml`
   - Lint + Type check
   - Tests avec coverage
   - Build
   - Seuil de coverage minimum (60%)

Exécuter `pnpm test:coverage` et viser > 60% de couverture.
```

---

### Phase 5 : SEO Avancé
**Durée estimée : 1-2 semaines**
**Priorité : MOYENNE**

#### Objectifs
- Top 10 sur les requêtes locales cibles
- Core Web Vitals "Good" sur toutes les pages

#### Tâches

| # | Tâche | Impact SEO |
|---|-------|------------|
| 5.1 | Enrichir robots.txt | Haut |
| 5.2 | Ajouter FAQ Schema aux pages services | Moyen |
| 5.3 | Améliorer maillage interne | Haut |
| 5.4 | Optimiser images (alt, title, lazy) | Moyen |
| 5.5 | Ajouter monitoring Web Vitals | Moyen |
| 5.6 | Créer pages piliers (hub & spoke) | Haut |

#### Prompt Claude Code - Phase 5

```
Optimiser le SEO du site Psypnos :

## Technical SEO
1. Enrichir `apps/psypnos/public/robots.txt`
   - Bloquer /admin/, /api/, /login
   - Autoriser les crawlers majeurs
   - Référencer le sitemap

2. Ajouter FAQ Schema aux pages services
   - `psychotherapie/page.tsx`
   - `hypnose/page.tsx`
   - `respiration-holotropique/page.tsx`
   - Extraire les FAQ existantes du contenu

## Maillage Interne
3. Analyser et améliorer les liens internes
   - Ajouter des liens contextuels dans les articles de blog
   - Créer un composant RelatedServices
   - Lier les pages géo entre elles

## Performance SEO
4. Implémenter le monitoring Web Vitals
   - Utiliser `web-vitals` (déjà installé)
   - Envoyer les métriques à l'analytics maison
   - Créer un dashboard dans l'admin

## Contenu
5. Créer des pages piliers (si pertinent)
   - Hub "Thérapies" liant toutes les thérapies
   - Hub "Yonne" liant toutes les villes

Vérifier les résultats avec Google Search Console et Lighthouse.
```

---

### Phase 6 : Innovation & Fonctionnalités Avancées
**Durée estimée : 3-4 semaines**
**Priorité : BASSE**

#### Objectifs
- PWA fonctionnelle offline
- Expérience utilisateur différenciante

#### Tâches

| # | Tâche | Valeur Ajoutée |
|---|-------|----------------|
| 6.1 | PWA offline complète | Fidélisation |
| 6.2 | Pré-remplissage IA formulaires | Conversion |
| 6.3 | A/B Testing natif | Optimisation |
| 6.4 | Chatbot FAQ | Support |
| 6.5 | Notifications push | Engagement |
| 6.6 | Mode sombre public | UX |

#### Prompt Claude Code - Phase 6

```
Implémenter des fonctionnalités innovantes pour Psypnos :

## PWA Avancée
1. Améliorer le Service Worker existant
   - Cache des pages critiques (home, services, contact)
   - Offline fallback amélioré
   - Background sync pour formulaires
   - Configurer dans `apps/psypnos/public/sw.js`

2. Implémenter les notifications push
   - Créer endpoint `/api/push/subscribe`
   - Stocker les subscriptions en DB
   - Notifier sur nouveaux articles/séminaires

## Intelligence Artificielle
3. Créer un chatbot FAQ avec Claude
   - Component `ChatWidget` dans @kairn/ui
   - API route `/api/chat` avec contexte du site
   - Limiter aux questions sur les services
   - Suggérer la prise de RDV

4. Pré-remplissage intelligent des formulaires
   - Analyser l'historique de navigation (consentement)
   - Suggérer le service le plus pertinent
   - Personnaliser le message d'introduction

## Expérimentation
5. Implémenter un système A/B Testing
   - Créer `packages/experiments/`
   - Stocker les variantes et résultats
   - Intégrer avec l'analytics

Prioriser les fonctionnalités par impact utilisateur.
```

---

## 5. Annexes

### 5.1 Fichiers Clés de l'Architecture

```
Configuration & Build:
├── turbo.json                         # Configuration Turborepo
├── pnpm-workspace.yaml                # Définition du monorepo
├── package.json                       # Scripts root
└── apps/psypnos/
    ├── next.config.mjs               # Config Next.js + sécurité
    ├── tailwind.config.ts            # Tailwind personnalisé
    └── config/site.config.ts         # Configuration site

Packages Principaux:
├── packages/core/src/
│   ├── auth/jwt.ts                   # Auth JWT
│   ├── middleware/rate-limit.ts      # Rate limiting
│   └── config/site-config.ts         # Config loader
├── packages/api/src/
│   ├── handlers/                     # API handlers
│   └── middleware/                   # Middlewares API
├── packages/ui/src/
│   ├── components/                   # Composants React
│   └── index.ts                      # Exports publics
└── packages/db/prisma/
    └── schema.prisma                 # Modèle de données

Site Psypnos:
├── apps/psypnos/app/
│   ├── layout.tsx                    # Layout + SEO global
│   ├── page.tsx                      # Homepage
│   ├── sitemap.ts                    # Sitemap dynamique
│   ├── admin/                        # Interface admin
│   ├── blog/                         # Section blog
│   └── api/                          # Routes API
└── apps/psypnos/lib/
    ├── tracking/                     # Analytics client
    └── social/                       # Social media
```

### 5.2 Métriques de Succès

| Phase | Métrique | Cible |
|-------|----------|-------|
| 1 | LCP | < 2.5s |
| 1 | CLS | < 0.1 |
| 2 | Code dupliqué | < 5% |
| 3 | Score accessibilité Lighthouse | > 90 |
| 4 | Couverture tests | > 60% |
| 5 | Position Google (requêtes locales) | Top 10 |
| 6 | PWA score | > 90 |

### 5.3 Dépendances à Mettre à Jour

```bash
# Audit actuel
pnpm audit

# Mises à jour recommandées
pnpm update --interactive --latest
```

### 5.4 Commandes Utiles

```bash
# Développement
pnpm dev                    # Démarrer tous les projets
pnpm -F @kairn/psypnos dev # Démarrer uniquement Psypnos

# Build & Test
pnpm build                  # Build complet
pnpm test                   # Tests unitaires
pnpm test:coverage          # Avec couverture
pnpm lint                   # Lint tous les projets
pnpm type-check            # Vérification TypeScript

# Base de données
pnpm -F @kairn/db db:studio    # Prisma Studio
pnpm -F @kairn/db db:migrate   # Migrations
pnpm -F @kairn/db db:seed      # Seed data

# Analyse
ANALYZE=true pnpm -F @kairn/psypnos build  # Bundle analyzer
```

---

## Conclusion

Le projet Kairn présente une architecture solide et bien pensée pour un monorepo multi-sites. Les fondations sont excellentes avec une bonne séparation des concerns via les packages partagés.

**Les priorités immédiates** sont :
1. L'optimisation des performances (impact direct sur SEO et UX)
2. Le renforcement de la sécurité (CSP, rate-limiting global)
3. L'accessibilité (conformité légale et inclusive)

**À moyen terme**, la mutualisation complète du code et l'amélioration de la couverture de tests permettront une maintenance plus aisée et la création rapide du nouveau site Unanima.

**À long terme**, les fonctionnalités innovantes (PWA, IA, A/B testing) différencieront la plateforme de ses concurrents.

---

*Document généré automatiquement par Claude Code - Analyse du 4 février 2026*
