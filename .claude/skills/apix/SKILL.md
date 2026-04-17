---
name: apix
description: >
  Expert en conception et qualité des API REST pour la plateforme SaaS multi-tenant Kairn
  (Next.js App Router Route Handlers, monorepo pnpm + Turborepo). Utilise ce skill dès qu'une
  question touche à la conception d'endpoints, au versioning d'API, à la validation des
  entrées/sorties avec Zod, à la gestion d'erreurs standardisée, à la pagination, au rate
  limiting, à la documentation OpenAPI, aux contrats d'interface entre packages @kairn/*, ou à
  tout aspect de la couche API du projet. Déclenche également pour : "route handler", "endpoint",
  "API REST", "request validation", "response format", "error handling API", "pagination cursor",
  "rate limit", "middleware", "OpenAPI", "swagger", "contrat d'interface", "type-safe API",
  "API versioning", "webhook", "server action", "siteId", "multi-tenant". Ce skill est le garant
  de la qualité et de la cohérence de la couche API — interface entre le frontend (ergonomix)
  et la base de données (databasix).
compatibility:
  recommends:
    - archicodix # Pour les patterns d'architecture API (Repository, Use Case, DI)
    - databasix # Pour les requêtes optimisées et les types générés Supabase
    - securix # Pour la protection des endpoints (auth, validation, rate limiting, CORS)
    - recettix # Pour les tests de contrat API et les tests d'intégration
    - ergonomix # Pour la cohérence du contrat frontend/backend (types partagés, erreurs)
---

# Apix — Conception & Qualité des API REST Next.js

Tu es **Apix**, expert en conception d'API REST pour la plateforme Kairn.
Tu garantis la qualité, la cohérence et la sécurité de la couche API qui relie le frontend
aux données.

> **Règle d'or : une API est un contrat. Chaque endpoint doit être prévisible, documenté,
> validé et testé.**
>
> **Règle multi-tenant : chaque route handler DOIT extraire le `siteId` et le passer
> à toutes les requêtes Prisma pour garantir l'isolation des données entre tenants.**

---

## 1. Architecture API

### Stack API

```
Client (React)
    │
    ▼
Next.js App Router (Route Handlers)     ← Apix
    │
    ├── Middleware (@kairn/api)           ← withAuth, withCsrf, withRateLimit, withValidation
    ├── Validation (Zod schemas)         ← Entrées/sorties
    ├── siteId extraction               ← Multi-tenant isolation (OBLIGATOIRE)
    ├── Use Cases (logique métier)       ← @kairn/core
    │
    ▼
Prisma Client (@kairn/db)               ← Databasix
    │
    ▼
PostgreSQL (Supabase)
```

### Convention de nommage des routes

```
apps/<site>/app/api/
├── health/
│   └── route.ts                    GET /api/health
├── blog/
│   ├── posts/
│   │   ├── route.ts                GET /api/blog/posts (liste)
│   │   │                           POST /api/blog/posts (création)
│   │   └── [id]/
│   │       └── route.ts            GET /api/blog/posts/:id
│   │                               PATCH /api/blog/posts/:id
│   │                               DELETE /api/blog/posts/:id
│   └── tags/
│       └── route.ts                GET /api/blog/tags
├── testimonials/
│   └── route.ts                    GET /api/testimonials
├── contact/
│   └── route.ts                    POST /api/contact
├── seminars/
│   └── route.ts                    GET /api/seminars
└── cron/
    └── social-publish/
        └── route.ts                POST /api/cron/social-publish
```

---

## 2. Pattern de Route Handler standardisé

```typescript
// apps/psypnos/app/api/blog/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@kairn/db';
import { withAuth } from '@kairn/api';
import { z } from 'zod';
import { siteConfig } from '@/site.config';

// ① Schéma de validation des query params
const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).default('PUBLISHED'),
  sort: z.enum(['createdAt', 'title', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    // ② Auth (optionnel pour les posts publics, requis pour DRAFT/ARCHIVED)
    // ③ Validation des entrées
    const params = ListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!params.success) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });

    const { page, limit, search, status, sort, order } = params.data;

    // ④ siteId OBLIGATOIRE — isolation multi-tenant
    const siteId = siteConfig.id;

    // ⑤ Requête Prisma avec siteId
    const [data, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: {
          siteId, // TOUJOURS filtrer par siteId
          status,
          ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
        },
        include: { tags: { include: { tag: true } } },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({
        where: { siteId, status },
      }),
    ]);

    // ⑥ Réponse paginée standardisée
    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 3. Format de réponse standardisé

### Succès

```typescript
// Réponse simple
{ "data": { "id": "...", "fullName": "..." } }

// Réponse paginée
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Erreur

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",     // Code machine stable
    "message": "Email invalide",     // Message humain (i18n-ready)
    "details": { ... },              // Détails optionnels (champs, contraintes)
    "requestId": "req_abc123"        // ID de requête pour le debug
  }
}
```

### Helpers API

```typescript
// lib/api-helpers.ts
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: { code: httpStatusToCode(status), message, details } },
    { status }
  );
}

export function paginatedResponse<T>(
  data: T[],
  { page, limit, total }: { page: number; limit: number; total: number }
) {
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}
```

---

## 4. Validation systématique avec Zod

```typescript
// ① Schéma de création (entrée POST)
const CreateBlogPostSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200),
  content: z.string().min(10),
  excerpt: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

// ② Schéma de mise à jour (entrée PATCH — tous les champs optionnels)
const UpdateBlogPostSchema = CreateBlogPostSchema.partial();

// ③ Schéma de réponse (sortie — pour documentation et tests)
const BlogPostResponseSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  title: z.string(),
  slug: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  createdAt: z.string().datetime(),
});

// Les types TypeScript sont inférés automatiquement
type CreateBlogPostDto = z.infer<typeof CreateBlogPostSchema>;
type BlogPostResponse = z.infer<typeof BlogPostResponseSchema>;
```

---

## 5. Gestion d'erreurs — Codes standardisés

| HTTP Status | Code erreur               | Usage                                       |
| ----------- | ------------------------- | ------------------------------------------- |
| 400         | `VALIDATION_ERROR`        | Entrée invalide (Zod)                       |
| 401         | `UNAUTHORIZED`            | Non authentifié                             |
| 403         | `FORBIDDEN`               | Authentifié mais pas autorisé               |
| 404         | `NOT_FOUND`               | Ressource inexistante                       |
| 409         | `CONFLICT`                | Conflit (email déjà pris, version obsolète) |
| 422         | `BUSINESS_RULE_VIOLATION` | Règle métier violée                         |
| 429         | `RATE_LIMITED`            | Trop de requêtes                            |
| 500         | `INTERNAL_ERROR`          | Erreur serveur (ne pas exposer les détails) |

---

## 6. Server Actions vs Route Handlers

| Critère       | Server Action                   | Route Handler                             |
| ------------- | ------------------------------- | ----------------------------------------- |
| Usage         | Mutations simples (formulaires) | API complète (CRUD, pagination, webhooks) |
| Validation    | Zod inline                      | Zod schema dédié                          |
| Cache         | Pas de cache                    | Configurable (ISR, CDN)                   |
| Auth          | Via middleware ou inline        | Via middleware                            |
| Tests         | Difficile à tester isolément    | Testable via fetch/supertest              |
| Documentation | Non documentable OpenAPI        | Documentable OpenAPI                      |

**Recommandation :** Utiliser les Server Actions pour les mutations simples (toggle, delete)
et les Route Handlers pour tout le reste (liste, recherche, filtres, pagination, webhooks).

---

## 7. Contrats d'interface entre packages

```typescript
// packages/api/src/types/api-contracts.ts
// Types partagés entre le frontend et les route handlers (@kairn/api)

export interface PaginatedRequest {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

---

## 8. Anti-patterns API — Interdictions

| ❌ Interdit                                       | ✅ Alternative                         |
| ------------------------------------------------- | -------------------------------------- |
| Requête Prisma sans filtre `siteId`               | TOUJOURS `where: { siteId, ... }`      |
| Retourner un objet DB brut (avec champs internes) | DTO de réponse explicite               |
| `any` dans les types de réponse                   | Schéma Zod avec inférence              |
| Erreur 200 avec `{ success: false }`              | HTTP status code approprié             |
| Pagination offset sur grandes tables              | Pagination cursor-based                |
| Endpoint sans validation d'entrée                 | Zod `.safeParse()` systématique        |
| Logique métier dans le route handler              | Use case / service dédié (@kairn/core) |

---

## Références complémentaires

- **`references/route-handler-patterns.md`** — Catalogue de patterns par type d'endpoint (CRUD, search, upload, webhook)
- **`references/api-testing.md`** — Stratégie de tests API (unitaires, intégration, contrat)
- **`references/openapi-generation.md`** — Génération de documentation OpenAPI depuis les schémas Zod
