# Plan de Mutualisation Kairn - Psypnos vers Plateforme

## Contexte

Ce document décrit le plan d'implémentation pour mutualiser les fonctionnalités de l'application Psypnos dans la plateforme Kairn. L'objectif est de créer une plateforme réutilisable pour plusieurs sites de praticiens.

**État actuel :**

- Monorepo avec 2 apps (psypnos, unanima) et 9 packages
- Psypnos : app complète avec 77+ composants, 113+ routes API, 21 pages admin
- Packages existants : config, core, db, ui, analytics, blog, social, admin, cli
- Packages `admin`, `social`, `cli` sont des placeholders vides

---

## Phase 1 : Composants UI Publics

### Objectif

Enrichir `@kairn/ui` avec les composants réutilisables de Psypnos.

### Tâches

#### 1.1 Système de Formulaires

```
Fichiers source (Psypnos) :
- apps/psypnos/components/ContactForm.tsx
- apps/psypnos/components/AppointmentRequestForm.tsx
- apps/psypnos/components/SeminarRegistration/FormField.tsx
- apps/psypnos/components/SeminarRegistration/IdentitySection.tsx

Destination : packages/ui/src/components/forms/

À créer :
- FormField.tsx (wrapper label + input + erreur)
- FormSection.tsx (groupe de champs)
- ContactForm.tsx (formulaire générique configurable)
- useFormValidation.ts (hook validation Zod)
```

**Prompt Claude Code :**

```
Analyser les composants de formulaire dans apps/psypnos/components/ (ContactForm.tsx, AppointmentRequestForm.tsx, SeminarRegistration/) et créer des versions génériques mutualisées dans packages/ui/src/components/forms/.

Les composants doivent :
- Être configurables via props (champs, validation, labels)
- Utiliser Zod pour la validation
- Supporter la protection CSRF et honeypot
- Être stylés avec Tailwind et cn()
- Exporter les types TypeScript

Ne pas inclure de logique métier spécifique à Psypnos.
```

#### 1.2 Composants Blog Publics

```
Fichiers source (Psypnos) :
- apps/psypnos/app/blog/_components/BlogCard.tsx
- apps/psypnos/app/blog/_components/BlogListItem.tsx
- apps/psypnos/app/blog/_components/FeaturedCarousel.tsx
- apps/psypnos/app/blog/_components/ReadingProgress.tsx
- apps/psypnos/app/blog/_components/ShareButton.tsx
- apps/psypnos/app/blog/_components/SearchBar.tsx
- apps/psypnos/app/blog/_components/CategoryFilter.tsx
- apps/psypnos/app/blog/_components/Pagination.tsx
- apps/psypnos/app/blog/_components/Breadcrumb.tsx
- apps/psypnos/app/blog/_components/RelatedPosts.tsx
- apps/psypnos/app/blog/_components/MobileTableOfContents.tsx

Destination : packages/ui/src/components/blog/
```

**Prompt Claude Code :**

```
Migrer les composants blog publics de apps/psypnos/app/blog/_components/ vers packages/ui/src/components/blog/.

Composants à migrer : BlogCard, BlogListItem, FeaturedCarousel, ReadingProgress, ShareButton, SearchBar, CategoryFilter, Pagination, Breadcrumb, RelatedPosts, MobileTableOfContents.

Chaque composant doit :
- Être indépendant de Psypnos (pas d'imports depuis apps/psypnos)
- Accepter les données via props typées
- Utiliser @kairn/blog pour les types BlogPost
- Utiliser cn() de @kairn/ui pour les classes
- Supporter la personnalisation des couleurs via props

Mettre à jour packages/ui/src/index.ts pour exporter les nouveaux composants.
```

#### 1.3 Composants Témoignages

```
Fichiers source (Psypnos) :
- apps/psypnos/components/TestimonialCard.tsx
- apps/psypnos/components/TestimonialsCarousel.tsx

Destination : packages/ui/src/components/testimonials/
```

**Prompt Claude Code :**

```
Migrer les composants témoignages de apps/psypnos/components/ (TestimonialCard.tsx, TestimonialsCarousel.tsx) vers packages/ui/src/components/testimonials/.

Les composants doivent :
- Utiliser un type Testimonial générique (id, name, content, rating, image?)
- Supporter l'animation via Framer Motion
- Être configurables (autoplay, interval, style)
- Exporter depuis packages/ui/src/index.ts
```

#### 1.4 Composants Navigation

```
Fichiers source (Psypnos) :
- apps/psypnos/app/blog/_components/Breadcrumb.tsx
- apps/psypnos/components/BackToPreviousButton.tsx
- apps/psypnos/components/BreadcrumbSchema.tsx

Destination : packages/ui/src/components/navigation/
```

**Prompt Claude Code :**

```
Créer des composants de navigation génériques dans packages/ui/src/components/navigation/ :

1. Breadcrumb.tsx - Fil d'Ariane avec :
   - Support schema.org JSON-LD
   - Configuration via tableau d'items {label, href}
   - Styling Tailwind configurable

2. BackButton.tsx - Bouton retour avec :
   - Texte configurable
   - Navigation programmatique ou lien
   - Icône optionnelle

Baser sur les implémentations de apps/psypnos/components/ et apps/psypnos/app/blog/_components/.
```

---

## Phase 2 : Package Admin

### Objectif

Migrer l'ensemble du dashboard admin de Psypnos vers `@kairn/admin`.

### Tâches

#### 2.1 Structure de Base Admin

```
Créer la structure dans packages/admin/src/ :
├── components/
│   ├── layout/
│   │   ├── AdminLayout.tsx
│   │   ├── AdminSidebar.tsx (migrer depuis ui)
│   │   └── AdminHeader.tsx
│   ├── common/
│   │   ├── StatCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── SortableTable.tsx
│   │   ├── VirtualTable.tsx
│   │   ├── DateRangePicker.tsx
│   │   ├── ExportButton.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── Drawer.tsx
│   └── charts/
│       ├── LineChart.tsx
│       ├── BarChart.tsx
│       ├── AreaChart.tsx
│       └── PieChart.tsx
├── hooks/
│   ├── useAdminAuth.ts
│   ├── usePagination.ts
│   ├── useTableSort.ts
│   └── useExport.ts
├── pages/
│   └── (structure pour les pages)
└── index.ts
```

**Prompt Claude Code :**

```
Créer la structure de base du package @kairn/admin dans packages/admin/.

1. Analyser les composants admin communs dans apps/psypnos/app/admin/ et apps/psypnos/components/admin/

2. Créer les composants de base :
   - packages/admin/src/components/layout/AdminLayout.tsx (layout avec sidebar)
   - packages/admin/src/components/common/StatCard.tsx (carte statistique)
   - packages/admin/src/components/common/DataTable.tsx (table générique)
   - packages/admin/src/components/common/DateRangePicker.tsx
   - packages/admin/src/components/common/ExportButton.tsx (export Excel/PDF)
   - packages/admin/src/components/common/ConfirmDialog.tsx
   - packages/admin/src/components/common/Drawer.tsx

3. Créer les hooks :
   - packages/admin/src/hooks/useAdminAuth.ts (vérification auth admin)
   - packages/admin/src/hooks/usePagination.ts
   - packages/admin/src/hooks/useTableSort.ts

4. Mettre à jour package.json avec les dépendances (recharts, xlsx, etc.)

5. Configurer les exports dans packages/admin/src/index.ts

Les composants doivent être indépendants de Psypnos et configurables via props.
```

#### 2.2 Composants Analytics Admin

```
Fichiers source (Psypnos) :
- apps/psypnos/components/analytics/*.tsx
- apps/psypnos/components/mobile/*.tsx (versions mobile)
- apps/psypnos/app/admin/analytics/

Destination : packages/admin/src/components/analytics/
```

**Prompt Claude Code :**

```
Migrer les composants analytics de Psypnos vers @kairn/admin.

Source : apps/psypnos/components/analytics/ et apps/psypnos/components/mobile/
Destination : packages/admin/src/components/analytics/

Composants à migrer :
- StatCard, HeroStatCard
- LineChart, BarChart, AreaChart (wrappers Recharts)
- ConversionFunnel
- CohortAnalysis
- GoalsDashboard
- SectionHeatmap
- GeolocationMap
- ExecutiveSummary
- RealTimeIndicator, RealTimeVisitors
- ScheduledReportsManager

Chaque composant doit :
- Accepter les données via props (pas de fetch interne)
- Être responsive (desktop + mobile)
- Utiliser les types de @kairn/analytics
- Supporter le thème sombre/clair
```

#### 2.3 Composants Blog Admin

```
Fichiers source (Psypnos) :
- apps/psypnos/app/admin/blog/_components/*.tsx

Destination : packages/admin/src/components/blog/
```

**Prompt Claude Code :**

```
Migrer les composants d'administration blog de Psypnos vers @kairn/admin.

Source : apps/psypnos/app/admin/blog/_components/
Destination : packages/admin/src/components/blog/

Composants à migrer :
- BlogPostForm.tsx (formulaire principal)
- ContentEditor.tsx (éditeur contenu)
- MarkdownEditor.tsx (éditeur markdown avec preview)
- MediaTab.tsx (gestion images)
- EssentialsTab.tsx (titre, slug, status)
- AdvancedOptionsTab.tsx (SEO, JSON-LD)
- FAQEditor.tsx (éditeur FAQ)
- ImageSelectionModal.tsx
- ArticleGeneratorModal.tsx (génération IA)
- ArticleImportModal.tsx
- TextImprover.tsx

Les composants de génération IA doivent accepter le service IA via props/context (pas de dépendance directe à Anthropic/OpenAI).
```

#### 2.4 Composants Social Admin

```
Fichiers source (Psypnos) :
- apps/psypnos/app/admin/social/

Destination : packages/admin/src/components/social/
```

**Prompt Claude Code :**

```
Migrer les composants d'administration social media de Psypnos vers @kairn/admin.

Source : apps/psypnos/app/admin/social/
Destination : packages/admin/src/components/social/

Composants à créer :
- SocialAccountsList.tsx (liste comptes connectés)
- SocialAccountCard.tsx (carte compte avec status)
- SocialPostEditor.tsx (éditeur de post)
- SocialPostsList.tsx (liste posts planifiés/publiés)
- SocialCalendar.tsx (calendrier éditorial)
- PlatformSelector.tsx (sélection plateformes)
- PostPreview.tsx (prévisualisation par plateforme)

Les composants doivent être indépendants des implémentations OAuth spécifiques.
```

#### 2.5 Composants Témoignages & Séminaires Admin

```
Destination : packages/admin/src/components/testimonials/
Destination : packages/admin/src/components/seminars/
```

**Prompt Claude Code :**

```
Migrer les composants admin pour témoignages et séminaires.

1. Témoignages (depuis apps/psypnos/app/admin/testimonials/) :
   - TestimonialsTable.tsx
   - TestimonialForm.tsx
   - TestimonialDrawer.tsx
   → Destination : packages/admin/src/components/testimonials/

2. Séminaires (depuis apps/psypnos/app/admin/seminars/) :
   - SeminarsList.tsx
   - SeminarForm.tsx
   - SeminarDrawer.tsx
   - ParticipantsList.tsx
   → Destination : packages/admin/src/components/seminars/

Les composants doivent utiliser les types génériques et être configurables.
```

---

## Phase 3 : Package API (Nouveau)

### Objectif

Créer un nouveau package `@kairn/api` avec les handlers API réutilisables.

### Tâches

#### 3.1 Création du Package

```
Structure packages/api/src/ :
├── handlers/
│   ├── auth/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   └── refresh.ts
│   ├── blog/
│   │   ├── posts.ts
│   │   └── tags.ts
│   ├── analytics/
│   │   ├── track.ts
│   │   ├── dashboard.ts
│   │   └── export.ts
│   ├── contact/
│   │   └── submit.ts
│   ├── testimonials/
│   │   └── crud.ts
│   └── seminars/
│       └── crud.ts
├── middleware/
│   ├── withAuth.ts
│   ├── withAdmin.ts
│   ├── withRateLimit.ts
│   ├── withCsrf.ts
│   └── withValidation.ts
├── utils/
│   ├── response.ts
│   ├── pagination.ts
│   └── filters.ts
└── index.ts
```

**Prompt Claude Code :**

```
Créer un nouveau package @kairn/api pour les handlers API réutilisables.

1. Initialiser le package :
   - packages/api/package.json (dépendances : @kairn/core, @kairn/db, @kairn/config, zod)
   - packages/api/tsconfig.json (extends @kairn/typescript-config)
   - packages/api/src/index.ts

2. Créer les middlewares génériques :
   - withAuth.ts - Vérification JWT
   - withAdmin.ts - Vérification rôle admin
   - withRateLimit.ts - Rate limiting configurable
   - withCsrf.ts - Protection CSRF
   - withValidation.ts - Validation Zod du body/query

3. Créer les utilitaires :
   - response.ts - Helpers réponse JSON (success, error, paginated)
   - pagination.ts - Calcul pagination (offset, limit, total pages)
   - filters.ts - Parsing filtres depuis query params

4. Analyser apps/psypnos/app/api/ pour identifier les patterns communs.
```

#### 3.2 Handlers Auth

**Prompt Claude Code :**

```
Créer les handlers d'authentification dans packages/api/src/handlers/auth/.

Analyser apps/psypnos/app/api/auth/ et créer :

1. login.ts
   - Validation email/password avec Zod
   - Vérification credentials via @kairn/core/auth
   - Génération JWT access + refresh tokens
   - Rate limiting (max 5 tentatives/15min)

2. logout.ts
   - Invalidation session
   - Suppression cookies

3. refresh.ts
   - Validation refresh token
   - Rotation token family
   - Génération nouveaux tokens

4. forgot-password.ts
   - Génération token reset
   - (email envoyé par l'app, pas le handler)

Les handlers doivent être des fonctions pures acceptant Request et retournant Response.
Utiliser les utilitaires de @kairn/core (JWT, rate limiting, etc.).
```

#### 3.3 Handlers Blog

**Prompt Claude Code :**

```
Créer les handlers blog dans packages/api/src/handlers/blog/.

Analyser apps/psypnos/app/api/blog/ et créer :

1. posts.ts
   - GET : Liste posts avec pagination, filtres, recherche
   - POST : Création post (admin)
   - PUT : Mise à jour post (admin)
   - DELETE : Suppression post (admin)

2. posts/[slug].ts
   - GET : Détail post par slug

3. tags.ts
   - GET : Liste tags
   - POST/PUT/DELETE : CRUD tags (admin)

4. check-slug.ts
   - POST : Vérification disponibilité slug

Les handlers utilisent @kairn/db pour Prisma et @kairn/blog pour le processing.
Supporter le multi-tenant via siteId.
```

#### 3.4 Handlers Analytics

**Prompt Claude Code :**

```
Créer les handlers analytics dans packages/api/src/handlers/analytics/.

Analyser apps/psypnos/app/api/analytics/ et créer les handlers principaux :

1. track.ts
   - POST : Enregistrement événements (batch)
   - Validation types événements
   - Détection bots

2. dashboard.ts
   - GET : Données dashboard (période configurable)
   - Agrégations : visites, pages vues, conversions

3. realtime.ts
   - GET : Visiteurs en temps réel

4. export.ts
   - GET : Export données (format: xlsx, pdf, csv)

5. top-pages.ts, funnel.ts, cohorts.ts, etc.

Utiliser @kairn/analytics pour les types et @kairn/core pour le cache.
```

---

## Phase 4 : Package AI (Nouveau)

### Objectif

Créer un package `@kairn/ai` pour abstraire les services IA (Claude, OpenAI).

### Tâches

#### 4.1 Création du Package

```
Structure packages/ai/src/ :
├── providers/
│   ├── types.ts
│   ├── anthropic.ts
│   ├── openai.ts
│   └── index.ts
├── services/
│   ├── content-generator.ts
│   ├── text-improver.ts
│   ├── image-generator.ts
│   └── social-generator.ts
├── prompts/
│   ├── blog-article.ts
│   ├── social-post.ts
│   └── image-prompt.ts
└── index.ts
```

**Prompt Claude Code :**

````
Créer un nouveau package @kairn/ai pour abstraire les services IA.

1. Initialiser le package :
   - packages/ai/package.json
   - Dépendances : @anthropic-ai/sdk, openai, zod
   - Peer deps optionnelles pour les SDKs

2. Créer l'abstraction des providers (packages/ai/src/providers/) :

   types.ts :
   ```typescript
   interface AIProvider {
     generateText(prompt: string, options?: GenerateOptions): Promise<string>
     generateImage?(prompt: string, options?: ImageOptions): Promise<string>
   }

   interface GenerateOptions {
     maxTokens?: number
     temperature?: number
     systemPrompt?: string
   }
````

anthropic.ts - Implémentation Claude
openai.ts - Implémentation GPT + DALL-E

3. Créer les services de haut niveau :
   - content-generator.ts : Génération articles (multi-stratégies)
   - text-improver.ts : Amélioration texte
   - image-generator.ts : Génération images via DALL-E
   - social-generator.ts : Posts sociaux par plateforme

Analyser apps/psypnos/app/api/blog/generate/ et apps/psypnos/app/api/social/generate/ pour les prompts.

```

#### 4.2 Service Génération Contenu
**Prompt Claude Code :**
```

Créer le service de génération de contenu dans packages/ai/src/services/content-generator.ts.

Analyser les implémentations dans :

- apps/psypnos/app/api/blog/generate/route.ts
- apps/psypnos/app/api/blog/generate-multi-step/route.ts
- apps/psypnos/app/api/blog/generate-sectional/route.ts

Créer un service ContentGenerator avec :

1. Méthodes de génération :
   - generateFullArticle(topic, options) - Article complet
   - generateOutline(topic) - Plan d'article
   - generateSection(outline, sectionIndex) - Section par section
   - generateFromOutline(outline) - Article depuis plan

2. Options configurables :
   - tone (professional, casual, educational)
   - length (short, medium, long)
   - language (fr, en)
   - keywords[]
   - targetAudience

3. Extraction automatique :
   - FAQ depuis contenu
   - Meta description
   - Suggestions tags

Le service accepte un AIProvider en paramètre (injection de dépendance).

```

#### 4.3 Service Génération Social
**Prompt Claude Code :**
```

Créer le service de génération posts sociaux dans packages/ai/src/services/social-generator.ts.

Analyser apps/psypnos/app/api/social/generate/route.ts pour les prompts par plateforme.

Créer un service SocialGenerator avec :

1. Méthodes par plateforme :
   - generateForFacebook(content, options)
   - generateForInstagram(content, options)
   - generateForLinkedIn(content, options)
   - generateForTwitter(content, options)
   - generateForThreads(content, options)

2. Méthode unifiée :
   - generateForPlatforms(content, platforms[], options)

3. Options :
   - tone (inspirational, educational, promotional)
   - includeHashtags: boolean
   - includeEmojis: boolean
   - includeCallToAction: boolean
   - maxLength (par plateforme)

4. Formats Instagram spéciaux :
   - hook_reveal, lista_visuale, carousel, etc.

Exporter les prompts templates pour personnalisation.

```

---

## Phase 5 : Compléter Package Social

### Objectif
Implémenter les fonctionnalités OAuth et publication dans `@kairn/social`.

### Tâches

#### 5.1 OAuth Flows
**Prompt Claude Code :**
```

Implémenter les flows OAuth dans packages/social/src/oauth/.

Analyser apps/psypnos/app/api/social/auth/ pour chaque plateforme.

Créer :

1. types.ts - Types communs OAuth

   ```typescript
   interface OAuthProvider {
     name: string;
     getAuthUrl(state: string, scopes: string[]): string;
     exchangeCode(code: string): Promise<OAuthTokens>;
     refreshToken(refreshToken: string): Promise<OAuthTokens>;
   }

   interface OAuthTokens {
     accessToken: string;
     refreshToken?: string;
     expiresAt: Date;
     scope: string[];
   }
   ```

2. Providers :
   - facebook.ts (Graph API)
   - instagram.ts (via Facebook)
   - linkedin.ts
   - twitter.ts (OAuth 2.0)
   - threads.ts

3. token-manager.ts
   - Encryption/decryption tokens (via @kairn/core)
   - Stockage sécurisé
   - Refresh automatique

Les credentials (client_id, client_secret) sont passés via config, pas hardcodés.

```

#### 5.2 Publication Posts
**Prompt Claude Code :**
```

Implémenter la publication de posts dans packages/social/src/posting/.

Créer :

1. types.ts

   ```typescript
   interface SocialPost {
     content: string;
     mediaUrls?: string[];
     link?: string;
     scheduledAt?: Date;
   }

   interface PostResult {
     success: boolean;
     platformPostId?: string;
     error?: string;
   }
   ```

2. Publishers par plateforme :
   - facebook-publisher.ts
   - instagram-publisher.ts
   - linkedin-publisher.ts
   - twitter-publisher.ts
   - threads-publisher.ts

3. scheduler.ts
   - Planification posts
   - File d'attente
   - Retry logic

4. multi-publisher.ts
   - Publication simultanée multi-plateformes
   - Adaptation contenu par plateforme

```

---

## Phase 6 : Refactoring Psypnos

### Objectif
Mettre à jour Psypnos pour utiliser les packages mutualisés.

### Tâches

#### 6.1 Migration Imports
**Prompt Claude Code :**
```

Refactorer apps/psypnos pour utiliser les packages mutualisés.

1. Mettre à jour package.json :
   - Ajouter @kairn/admin, @kairn/api, @kairn/ai
   - Supprimer dépendances dupliquées

2. Remplacer les imports de composants locaux par @kairn/ui :
   - Composants formulaires → @kairn/ui/forms
   - Composants blog → @kairn/ui/blog
   - Composants témoignages → @kairn/ui/testimonials

3. Remplacer les imports admin locaux par @kairn/admin :
   - Composants analytics
   - Composants blog admin
   - Composants social admin

4. Remplacer les handlers API par @kairn/api :
   - Wrapper les handlers avec configuration spécifique Psypnos

5. Remplacer les appels IA directs par @kairn/ai :
   - Injecter le provider configuré

Faire par étapes, vérifier build après chaque migration majeure.

```

#### 6.2 Nettoyage Code Dupliqué
**Prompt Claude Code :**
```

Nettoyer le code dupliqué dans apps/psypnos après migration.

1. Supprimer les fichiers de composants migrés :
   - components/ (ceux migrés vers @kairn/ui)
   - app/admin/\*/\_components/ (ceux migrés vers @kairn/admin)

2. Supprimer les utilitaires dupliqués :
   - Fonctions présentes dans @kairn/core
   - Types présents dans @kairn/config

3. Garder uniquement :
   - Configuration spécifique (site.config.ts)
   - Pages avec layout spécifique
   - Composants vraiment spécifiques à Psypnos
   - Contenu statique (textes, images)

4. Vérifier que le build et les tests passent.

```

---

## Phase 7 : CLI et Documentation

### Objectif
Finaliser le CLI et documenter la plateforme.

### Tâches

#### 7.1 CLI Kairn
**Prompt Claude Code :**
```

Implémenter le CLI @kairn/cli pour la gestion de la plateforme.

Commandes à créer :

1. kairn init <site-name>
   - Scaffold nouveau site depuis template
   - Génération site.config.ts
   - Setup base de données

2. kairn dev
   - Lance le serveur de développement
   - Hot reload

3. kairn build
   - Build production

4. kairn db:migrate
   - Exécute migrations Prisma

5. kairn db:seed
   - Seed données initiales

6. kairn generate:page <name>
   - Génère une nouvelle page

7. kairn generate:component <name>
   - Génère un composant

Utiliser commander pour le parsing, inquirer pour les prompts interactifs, ora pour les spinners.

```

#### 7.2 Documentation
**Prompt Claude Code :**
```

Créer la documentation de la plateforme Kairn.

1. README.md principal (racine) :
   - Description plateforme
   - Quick start
   - Architecture monorepo
   - Liste packages

2. docs/ARCHITECTURE.md :
   - Diagramme architecture
   - Relations packages
   - Flux de données

3. docs/GETTING_STARTED.md :
   - Installation
   - Configuration
   - Premier site

4. docs/CUSTOMIZATION.md :
   - Personnalisation thème
   - Ajout pages
   - Feature flags

5. README.md par package :
   - API documentation
   - Exemples d'usage
   - Types exportés

Ne pas créer de documentation tant que les phases 1-6 ne sont pas terminées.

```

---

## Ordre d'Exécution Recommandé

```

Phase 1 (UI Publics) ████████░░ 2-3 sessions
Phase 2 (Admin) ████████████░░░░ 4-5 sessions
Phase 3 (API) ████████░░ 2-3 sessions
Phase 4 (AI) ██████░░ 2 sessions
Phase 5 (Social) ██████░░ 2 sessions
Phase 6 (Refactoring) ████░░ 1-2 sessions
Phase 7 (CLI/Docs) ████░░ 1-2 sessions

Total estimé : 15-20 sessions Claude Code

```

---

## Validation par Phase

### Checklist Phase 1
- [ ] FormField, FormSection créés et exportés
- [ ] ContactForm générique fonctionnel
- [ ] Composants blog migrés (10+ composants)
- [ ] Composants témoignages migrés
- [ ] Breadcrumb avec schema.org
- [ ] Build @kairn/ui réussi
- [ ] Unanima utilise les nouveaux composants

### Checklist Phase 2
- [ ] Structure admin créée
- [ ] Composants layout admin
- [ ] Composants analytics (15+ composants)
- [ ] Composants blog admin (12+ composants)
- [ ] Composants social admin
- [ ] Build @kairn/admin réussi

### Checklist Phase 3
- [ ] Package @kairn/api initialisé
- [ ] Middlewares génériques
- [ ] Handlers auth complets
- [ ] Handlers blog complets
- [ ] Handlers analytics principaux
- [ ] Build réussi

### Checklist Phase 4
- [ ] Package @kairn/ai initialisé
- [ ] Abstraction providers (Anthropic, OpenAI)
- [ ] Service génération contenu
- [ ] Service génération social
- [ ] Service génération images
- [ ] Build réussi

### Checklist Phase 5
- [ ] OAuth flows 5 plateformes
- [ ] Token manager sécurisé
- [ ] Publishers 5 plateformes
- [ ] Scheduler fonctionnel
- [ ] Build réussi

### Checklist Phase 6
- [ ] Psypnos utilise @kairn/ui
- [ ] Psypnos utilise @kairn/admin
- [ ] Psypnos utilise @kairn/api
- [ ] Psypnos utilise @kairn/ai
- [ ] Code dupliqué supprimé
- [ ] Build Psypnos réussi
- [ ] Tests passent

### Checklist Phase 7
- [ ] CLI commandes de base
- [ ] Documentation architecture
- [ ] README packages
- [ ] Getting started guide

---

## Notes Importantes

1. **Toujours vérifier le build après chaque migration** : `pnpm build`

2. **Tester sur Unanima** : Utiliser Unanima comme cobaye pour valider les packages mutualisés

3. **Garder la rétrocompatibilité** : Ne pas casser Psypnos pendant la migration

4. **Commits atomiques** : Un commit par fonctionnalité migrée

5. **Types d'abord** : Créer les interfaces TypeScript avant l'implémentation

6. **Pas de sur-engineering** : Mutualiser ce qui est réellement réutilisé, pas tout
```
