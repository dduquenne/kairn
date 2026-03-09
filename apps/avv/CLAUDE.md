# Appréciez Votre Vie (AVV) — Site praticien (Next.js App Router)

## Commandes spécifiques

```bash
pnpm --filter @kairn/avv dev        # Dev local (port 3000)
pnpm --filter @kairn/avv build      # Build production
pnpm --filter @kairn/avv test:e2e   # E2E Playwright (chromium)
```

## Structure de l'app

```
app/
├── api/               → API routes (auth, admin, blog, analytics, cron, contact, seminars)
│   └── common/        → Middlewares partagés (csrf, rate-limiter, error-codes)
├── admin/             → Dashboard admin (protégé par withAdminAuth)
├── blog/              → Pages blog publiques
├── (pages)/           → Pages publiques (accueil, services, contact)
├── layout.tsx         → Root layout (ISR revalidate=86400, metadata, providers)
├── providers.tsx      → 'use client' — providers interactifs (analytics, version check)
components/            → Wrappers spécifiques au site des composants @kairn/ui
hooks/                 → useCSRF, useFormValidation, useAnalytics
lib/                   → Prisma singleton, cache Redis, site helpers, tracking
config/                → site.config.ts + configuration spécifique
middleware.ts          → Rate limiting par route, headers sécurité, détection IP client
```

## Patterns API routes

```typescript
// Pattern standard d'un endpoint admin protégé
export async function GET(request: Request) {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;
  const siteId = await getSiteId();
  // ... logique métier avec filtre siteId obligatoire
}
```

- Validation : Zod `safeParse()` → retourner 400 avec message français si invalide
- Erreurs : utiliser `ErrorCode` enum + `createApiError()` de `app/api/common/error-codes.ts`
- Pagination : `skip`/`take` avec validation (limit max 100)

## Vercel — Spécificités production

- **vercel.json** : build inclut `prisma generate` avant `next build`
- **Middleware** : rate limiting différencié (auth: 10/15min, contact: 5/h, admin: 200/15min, API: 100/15min)
- **IP client** : vérifier `x-forwarded-for`, `x-real-ip`, `x-vercel-forwarded-for`, `cf-connecting-ip`
- **Cache CDN** : assets statiques (1 an), API publiques (5min + SWR 30min), blog (10min), auth/admin (no-cache)
- **Images** : formats AVIF/WebP, domaines autorisés Supabase + Unsplash, cache 7 jours

## E2E (Playwright)

- Config : `playwright.config.ts`
- Navigateur : Chromium uniquement en CI
- Reports : `playwright-report/` (uploadé en artifact CI, rétention 7 jours)
