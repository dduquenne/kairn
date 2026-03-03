# Kairn — Plateforme SaaS multi-tenant pour praticiens bien-être

## Commandes essentielles

```bash
# Installation
pnpm install                    # JAMAIS npm/yarn

# Développement
pnpm dev                        # Tous les packages
pnpm --filter @kairn/psypnos dev  # Un seul site

# Lint & types
pnpm turbo run lint --filter='...[HEAD~1]'
pnpm turbo run type-check --filter='...[HEAD~1]'

# Tests
pnpm test:coverage              # Unitaires + couverture (seuil : 60%)
pnpm test:ui                    # Composants UI (jsdom)
pnpm test:a11y                  # Accessibilité (axe-core)

# Build
pnpm turbo run build --filter='...[HEAD~1]' --env-mode=loose
```

## Structure monorepo

```
apps/psypnos/          → App Next.js (App Router) — site praticien
packages/core/         → Auth JWT, rate limiting, logger, utils, scheduler QStash
packages/api/          → Handlers API réutilisables + middlewares (withAuth, withValidation, withCsrf, withRateLimit)
packages/db/           → Schéma Prisma + client PostgreSQL
packages/config/       → Types et schémas Zod de configuration site
packages/ui/           → Composants React partagés (Tailwind CSS)
packages/admin/        → Composants dashboard administration
packages/ai/           → Abstraction IA (Claude + OpenAI)
packages/blog/         → Processing Markdown, SEO, reading time
packages/analytics/    → Tracking visiteurs, rapports, dashboards
packages/social/       → Intégration réseaux sociaux (OAuth + posting)
packages/experiments/  → A/B testing + feature flags
packages/cli/          → CLI gestion plateforme
tooling/               → Configs partagées (eslint, typescript, tailwind-preset)
```

## Conventions TypeScript & code style

- **Prettier** : 100 cols, single quotes, trailing comma ES5, `arrowParens: avoid`
- **Imports** ordonnés : builtin → external → @kairn/\* → relatifs → types
- `import/no-cycle` et `import/no-duplicates` sont des erreurs
- Zéro `any` (warn ESLint) — types explicites
- Zod uniquement aux frontières système (API routes, Server Actions, inputs externes)
- `prefer-const`, `no-var` — pas de `console.log` (seuls `console.warn`/`error` autorisés)
- JSDoc obligatoire sur toute fonction créée ou modifiée
- Nommage : PascalCase composants/types, camelCase fonctions/variables, SCREAMING_SNAKE_CASE constantes

## Multi-tenancy — Règle critique

**Chaque requête Prisma DOIT filtrer par `siteId`** pour l'isolation des données.

```typescript
// TOUJOURS
const posts = await prisma.blogPost.findMany({ where: { siteId, status: 'PUBLISHED' } });
// JAMAIS de requête sans siteId sur une table tenant-scoped
```

## Architecture React & Next.js

- **React Server Components par défaut** — `'use client'` uniquement si justifié
- Pas de `useCallback`/`memo` sans profil de performance prouvé
- Composants partagés dans `packages/ui/` — configurables via props, injection de dépendances pour hooks
- Composants spécifiques site dans `apps/<site>/components/` — wrappers des composants partagés
- ISR via `revalidate` sur les layouts/pages publiques

## Tests

| Config                  | Commande             | Environnement    | Cible                                 |
| ----------------------- | -------------------- | ---------------- | ------------------------------------- |
| `vitest.config.ts`      | `pnpm test:coverage` | Node             | `packages/**`, `apps/**/__tests__/**` |
| `vitest.ui.config.ts`   | `pnpm test:ui`       | jsdom            | `packages/ui/src/**`                  |
| `vitest.a11y.config.ts` | `pnpm test:a11y`     | jsdom + axe-core | `**/*.a11y.test.*`                    |

- Seuils de couverture : 60% statements/functions/lines, 50% branches
- Couverture ciblée sur `packages/core/src` et `packages/api/src`
- Mocks avec `vi.mock()` — déclarer les mocks AVANT les imports
- Couvrir : cas nominal + cas d'erreur + edge cases

## Sécurité

- Auth JWT avec rotation de clés versionnées (jose) — tokens dans cookies httpOnly
- CSRF via signed tokens (HMAC-SHA256)
- Rate limiting hybride Redis/mémoire (graceful degradation)
- Sanitize HTML entrant avec `isomorphic-dompurify`
- Headers de sécurité dans `next.config.mjs` : CSP, HSTS, X-Frame-Options
- Jamais de donnée sensible exposée dans les composants client
- Variables d'environnement : documenter dans `.env.example`, configurer dans les 3 env Vercel

## Git & CI

- **Package manager** : pnpm exclusivement (Node ≥22, pnpm ≥10)
- **Commits** : `type(scope): description` — ex. `fix(api): corriger validation contact`
- **CI** (`.github/workflows/ci.yml`) : lint → type-check → test → security → build → e2e
- Turbo Remote Cache via Vercel (`TURBO_TOKEN` + `TURBO_TEAM`)
- Pre-commit hooks : lint-staged (ESLint --fix + Prettier)

## Déploiement Vercel

- Région : CDG1 (Paris)
- Serverless Functions : `maxDuration: 60s` — pas d'accès filesystem en écriture (sauf `/tmp`)
- CRON via **Upstash QStash** (pas les CRON natifs Vercel)
- Preview ≠ Production : URL différente (attention CORS/CSP/OAuth callbacks), cache CDN réduit
- Utiliser `waitUntil()` pour tâches post-réponse, pas `setTimeout`
- Headers Vercel disponibles : `x-vercel-ip-country`, `x-vercel-ip-city`, `x-vercel-ip-timezone`

## Gotchas fréquents

- Modifier un package dans `packages/` impacte tous ses consommateurs — vérifier avec `--filter='...[HEAD~1]'`
- Prisma : exécuter `pnpm --filter @kairn/db db:generate` après toute modification du schéma
- Redis optionnel : le cache et rate limiting fonctionnent en mémoire locale sans Redis (non partagé entre instances Serverless)
- Build Vercel ≠ CI : vérifier les deux après un push sur main
- Les tokens OAuth réseaux sociaux sont chiffrés en base (`SOCIAL_ENCRYPTION_KEY`)

## Documentation existante

@docs/ARCHITECTURE.md — Architecture détaillée, flux de données, packages
@DEPLOYMENT.md — Guide déploiement Vercel + QStash
@SECURITY.md — Politique de sécurité
@.env.example — Variables d'environnement requises
