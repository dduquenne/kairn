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

## Créer un nouveau site

### 1. Copier le template

```bash
# Copier la structure de base depuis psypnos
cp -r apps/psypnos apps/nouveau-site

# Ou utiliser le CLI
kairn init nouveau-site
```

### 2. Configurer le site

Créer `apps/nouveau-site/site.config.ts`:

```typescript
import { defineSiteConfig } from '@kairn/config';

export const siteConfig = defineSiteConfig({
  id: 'nouveau-site',
  name: 'Nouveau Site',
  domain: 'nouveau-site.fr',
  locale: 'fr',

  practitioner: {
    name: 'Dr. Nom',
    title: 'Thérapeute',
    bio: '...',
    // ...
  },

  contact: {
    email: 'contact@nouveau-site.fr',
    phone: '01 23 45 67 89',
    // ...
  },

  services: [
    { id: 'therapy', name: 'Thérapie', slug: 'therapie', /* ... */ },
  ],

  features: {
    blog: true,
    seminars: false,
    analytics: true,
    // ...
  },

  theme: {
    colors: {
      primary: '#d4af37',
      secondary: '#1a1a2e',
      // ...
    },
    fonts: {
      display: 'Cormorant Garamond',
      body: 'Inter',
    },
  },
});
```

### 3. Personnaliser les composants

Créer des wrappers pour les composants partagés:

```typescript
// apps/nouveau-site/components/FloatingContactButtonWrapper.tsx
import { FloatingContactButton } from '@kairn/ui';
import { useCSRF } from '../hooks/useCSRF';
import { useToast } from '../lib/toast-context';

export function SiteFloatingContactButton() {
  const csrf = useCSRF();
  const { addToast } = useToast();

  return (
    <FloatingContactButton
      csrf={csrf}
      toast={{ addToast }}
      colors={{
        primary: 'bg-primary',
        // ...
      }}
      // ...
    />
  );
}
```

### 4. Configurer les couleurs de catégories (blog)

```typescript
// apps/nouveau-site/lib/categoryColors.ts
import { defineCategoryColors, COLOR_PRESETS } from '@kairn/config';

export const CATEGORY_COLORS = defineCategoryColors({
  'Catégorie A': COLOR_PRESETS.blue,
  'Catégorie B': COLOR_PRESETS.green,
  // ...
});
```

### 5. Configurer package.json

```json
{
  "name": "@kairn/nouveau-site",
  "dependencies": {
    "@kairn/ui": "workspace:*",
    "@kairn/config": "workspace:*",
    "@kairn/analytics": "workspace:*",
    "@kairn/db": "workspace:*"
  }
}
```

### 6. Ajouter au turbo.json

Le site sera automatiquement inclus s'il est dans `apps/`.

## Conventions de code

### Structure des fichiers

```
apps/site/
├── app/                    # Next.js App Router
│   ├── (public)/          # Routes publiques
│   ├── admin/             # Routes admin
│   ├── api/               # API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/            # Composants spécifiques au site
│   └── XxxWrapper.tsx     # Wrappers pour composants partagés
├── hooks/                 # Custom hooks
├── lib/                   # Utilitaires et configuration
│   ├── tracking/          # Re-exports @kairn/analytics
│   ├── theme-context.tsx  # Re-exports @kairn/ui ThemeProvider
│   └── categoryColors.ts  # Utilise @kairn/config
├── public/                # Assets statiques
└── site.config.ts         # Configuration du site
```

### Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Composants | PascalCase | `FloatingContactButton.tsx` |
| Hooks | camelCase avec `use` | `useAnalytics.ts` |
| Utilitaires | camelCase | `categoryColors.ts` |
| Types | PascalCase avec suffixe | `FloatingContactButtonProps` |
| Constantes | SCREAMING_SNAKE_CASE | `CATEGORY_COLORS` |
| Packages | kebab-case | `@kairn/category-colors` |

### Imports

Ordre des imports:
1. Modules externes (React, Next.js)
2. Packages @kairn
3. Imports relatifs (composants, hooks, lib)
4. Types

```typescript
// 1. External
import { useState, useEffect } from 'react';
import Link from 'next/link';

// 2. @kairn packages
import { FloatingContactButton } from '@kairn/ui';
import { defineCategoryColors } from '@kairn/config';

// 3. Relative
import { useCSRF } from '../hooks/useCSRF';
import { siteConfig } from '../site.config';

// 4. Types
import type { FC } from 'react';
```

### Composants partagés vs spécifiques

**Partagés** (`packages/ui/`):
- Configurables via props
- Pas de dépendances vers les apps
- Utilisent l'injection de dépendances pour les hooks

**Spécifiques** (`apps/site/components/`):
- Wrappers qui configurent les composants partagés
- Peuvent utiliser les hooks locaux
- Import depuis `@kairn/ui`

### Gestion des types

```typescript
// Dans packages/ui/src/components/xxx/types.ts
export interface XxxProps {
  // Props configurables
}

// Dans packages/ui/src/index.ts
export { Xxx, type XxxProps } from './components/xxx';

// Dans apps/site/
import { Xxx, type XxxProps } from '@kairn/ui';
```

## Flow de données détaillé

### Page publique (Blog)

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser Request: GET /blog/article-slug                          │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Next.js App Router                                               │
│ - app/blog/[slug]/page.tsx                                       │
│ - generateStaticParams() for ISR                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ @kairn/db (Prisma)                                               │
│ - prisma.blogPost.findUnique({ where: { slug, siteId } })       │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ @kairn/ui Components                                             │
│ - BlogCard, ReadingProgress, RelatedPosts                        │
│ - CategoryColors from @kairn/config                              │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ @kairn/analytics (client-side)                                   │
│ - Page view tracking                                             │
│ - Scroll depth tracking                                          │
│ - Section time tracking                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Formulaire de contact (FAB)

```
┌─────────────────────────────────────────────────────────────────┐
│ User clicks FloatingContactButton                                │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ @kairn/ui FloatingContactButton                                  │
│ - Opens modal                                                    │
│ - Validates form with onBlur                                     │
│ - Tracks fab_click conversion                                    │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Form Submit → POST /api/quick-contact                            │
│ - CSRF token validation                                          │
│ - Honeypot check                                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ @kairn/api handlers                                              │
│ - withCsrf middleware                                            │
│ - withValidation (Zod)                                           │
│ - withRateLimit                                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ @kairn/db + Email Service                                        │
│ - Save to Contact table                                          │
│ - Send email via Resend                                          │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Response + Analytics                                             │
│ - Show success toast                                             │
│ - Track quick_contact_form conversion                            │
└─────────────────────────────────────────────────────────────────┘
```

### Theme switching

```
┌─────────────────────────────────────────────────────────────────┐
│ User toggles theme                                               │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ @kairn/ui ThemeProvider                                          │
│ - Updates state                                                  │
│ - Persists to localStorage                                       │
│ - Applies class to document                                      │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Tailwind CSS                                                     │
│ - .dark/.light class triggers styles                             │
│ - color-scheme property for native elements                      │
└─────────────────────────────────────────────────────────────────┘
```

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

## Migration vers les packages partagés

Lors de l'ajout de fonctionnalités à un nouveau site, vérifier:

1. **Le composant existe-t-il dans @kairn/ui?**
   - Si oui: créer un wrapper avec la config spécifique
   - Si non: évaluer si le composant doit être mutualisé

2. **Le type existe-t-il dans @kairn/config?**
   - Si oui: importer et étendre si nécessaire
   - Si non: créer un schéma Zod réutilisable

3. **La logique existe-t-elle dans un package?**
   - Si oui: re-exporter depuis le package
   - Si non: évaluer la mutualisation

### Checklist de migration

- [ ] Identifier les doublons de code entre sites
- [ ] Extraire les composants configurables vers @kairn/ui
- [ ] Créer les types/schémas dans @kairn/config
- [ ] Mettre à jour les imports dans les apps
- [ ] Supprimer le code dupliqué
- [ ] Tester sur tous les sites impactés
