# Architecture Kairn

Ce document décrit l'architecture technique de la plateforme Kairn.

## Vue d'ensemble

Kairn est une plateforme multi-tenant construite comme un monorepo. Chaque site de praticien est une application Next.js qui partage des packages communs.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Applications                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Psypnos    │  │   Unanima    │  │  Nouveau...  │          │
│  │  (Next.js)   │  │  (Next.js)   │  │  (Next.js)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Packages Partagés                           │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   UI     │ │  Admin   │ │   API    │ │    AI    │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                   │
│  ┌────┴────────────┴────────────┴────────────┴────┐             │
│  │              @kairn/core                        │             │
│  │   (Auth, Utils, Rate Limiting, Validation)      │             │
│  └─────────────────────┬──────────────────────────┘             │
│                        │                                         │
│  ┌─────────────────────┼──────────────────────────┐             │
│  │     @kairn/db       │      @kairn/config       │             │
│  │   (Prisma Schema)   │   (Types, Schemas)       │             │
│  └─────────────────────┴──────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Infrastructure                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │   Supabase   │  │    Resend    │          │
│  │  (Database)  │  │  (Storage)   │  │   (Email)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Packages

### @kairn/config

Définit les types et schémas de configuration pour les sites.

```typescript
// Types principaux
- SiteConfig      // Configuration complète d'un site
- PractitionerConfig  // Info praticien
- ServiceConfig   // Services proposés
- ThemeConfig     // Couleurs et polices
- FeaturesConfig  // Feature flags
```

### @kairn/core

Utilitaires partagés et logique métier commune.

```typescript
// Modules
- auth/           // JWT, session management
- crypto/         // Encryption, hashing
- rate-limit/     // Rate limiting
- validation/     // Schémas Zod
- templates/      // Templates de sites
- palettes/       // Palettes de couleurs
```

### @kairn/db

Schéma Prisma et client database.

```
// Modèles principaux
- Site            // Multi-tenant
- User            // Utilisateurs
- BlogPost        // Articles de blog
- Tag             // Tags d'articles
- Testimonial     // Témoignages
- Contact         // Demandes de contact
- Seminar         // Séminaires
- SeminarRegistration
- SocialAccount   // Comptes réseaux sociaux
- SocialPost      // Posts planifiés
- AnalyticsEvent  // Événements analytics
```

### @kairn/ui

Composants React réutilisables.

```
components/
├── blog/         // BlogCard, Pagination, SearchBar...
├── forms/        // FormField, ContactForm...
├── navigation/   // Breadcrumb, BackButton...
├── testimonials/ // TestimonialCard, Carousel...
└── layout/       // Container, Section, Grid...
```

### @kairn/admin

Composants du dashboard d'administration.

```
components/
├── layout/       // AdminLayout, Sidebar, Header
├── analytics/    // Charts, StatCards, Dashboard
├── blog/         // PostEditor, PostList, MediaManager
├── social/       // AccountsList, PostScheduler
├── testimonials/ // TestimonialsTable, Form
└── common/       // DataTable, Drawer, DatePicker
```

### @kairn/api

Handlers API réutilisables avec middlewares.

```
handlers/
├── auth/         // Login, logout, refresh
├── blog/         // CRUD posts, tags
├── analytics/    // Track, dashboard, export
├── contact/      // Submit contact form
└── testimonials/ // CRUD testimonials

middleware/
├── withAuth      // Authentification JWT
├── withAdmin     // Vérification rôle admin
├── withRateLimit // Rate limiting
├── withCsrf      // Protection CSRF
└── withValidation// Validation Zod
```

### @kairn/ai

Services d'intelligence artificielle.

```
providers/
├── anthropic.ts  // Claude
└── openai.ts     // GPT + DALL-E

services/
├── content-generator.ts  // Articles de blog
├── text-improver.ts      // Amélioration texte
├── image-generator.ts    // Images DALL-E
└── social-generator.ts   // Posts réseaux sociaux
```

### @kairn/social

Intégration réseaux sociaux.

```
oauth/
├── facebook.ts
├── instagram.ts
├── linkedin.ts
├── twitter.ts
└── threads.ts

posting/
├── publishers/   // Par plateforme
├── scheduler.ts  // Planification
└── multi-publisher.ts
```

### @kairn/analytics

Module analytics interne.

```
- Tracking visiteurs
- Métriques de conversion
- Rapports et exports
- Dashboard temps réel
```

### @kairn/blog

Module blog avec génération IA.

```
- Processing Markdown
- Extraction FAQ automatique
- Génération SEO
- Gestion images
```

### @kairn/cli

CLI de gestion de la plateforme.

```bash
kairn init <site>        # Nouveau site
kairn dev                # Développement
kairn build              # Production
kairn db migrate         # Migrations
kairn db seed            # Seed
kairn generate page      # Générer page
kairn generate component # Générer composant
```

## Flux de données

### Requête publique (visiteur)

```
Browser → Next.js App → @kairn/ui components
                     → @kairn/core (validation)
                     → @kairn/db (Prisma)
                     → PostgreSQL
```

### Requête admin

```
Browser → Next.js App → @kairn/admin components
                     → @kairn/api handlers
                     → withAuth middleware
                     → @kairn/db (Prisma)
                     → PostgreSQL
```

### Génération contenu IA

```
Admin Dashboard → @kairn/api
              → @kairn/ai (provider selection)
              → Claude API / OpenAI API
              → @kairn/blog (processing)
              → @kairn/db (save)
```

### Publication social

```
Admin → @kairn/api
     → @kairn/social (oauth check)
     → @kairn/ai (content generation)
     → Platform API (Facebook, LinkedIn...)
     → @kairn/db (log)
```

## Multi-tenancy

Chaque site est identifié par un `siteId` qui est utilisé pour :

1. **Filtrer les données** - Toutes les requêtes DB incluent un filtre `siteId`
2. **Configuration** - Chaque app a son `site.config.ts`
3. **Theming** - Les couleurs et polices sont configurées par site
4. **Features** - Les feature flags sont par site

```typescript
// Exemple de requête multi-tenant
const posts = await prisma.blogPost.findMany({
  where: {
    siteId: currentSiteId,
    status: 'PUBLISHED',
  },
});
```

## Sécurité

### Authentification

- JWT avec access + refresh tokens
- Rotation automatique des tokens
- Session invalidation
- Rate limiting sur login

### Protection des données

- Encryption des tokens OAuth
- Hashing des mots de passe (bcrypt)
- Protection CSRF
- Validation Zod sur toutes les entrées

### Headers de sécurité

- Content-Security-Policy
- X-Frame-Options
- Strict-Transport-Security
- X-Content-Type-Options

## Performance

### Caching

- ISR (Incremental Static Regeneration) pour les pages publiques
- Redis pour le rate limiting et sessions
- CDN caching avec stale-while-revalidate

### Optimisations

- Images optimisées (Next.js Image)
- Code splitting automatique
- Tree shaking des packages
- Lazy loading des composants lourds

## Déploiement

### Développement

```bash
pnpm dev        # Tous les packages
kairn dev --site psypnos  # Un site
```

### Production

```bash
pnpm build
kairn db migrate --deploy
```

### Variables d'environnement

```env
# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...

# Services
RESEND_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...

# AI (optionnel)
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
```
