---
name: deploix
description: >
  Expert en déploiement, infrastructure et observabilité pour la plateforme SaaS multi-tenant
  Kairn (TypeScript/Next.js, monorepo pnpm + Turborepo) hébergée sur Vercel avec PostgreSQL
  (Supabase) et CRON via Upstash QStash. Utilise ce skill dès qu'une question touche au
  déploiement Vercel, à la configuration d'environnements (preview, staging, production), au
  monitoring de production, aux logs Serverless, aux erreurs runtime, aux health checks, aux
  rollbacks, aux stratégies de cache (CDN, ISR, revalidation), aux variables d'environnement
  multi-sites, aux schedules QStash, ou au diagnostic d'incidents de production. Déclenche
  également pour : "vercel.json", "ignoreCommand", "build failed", "deploy", "production cassée",
  "rollback", "cold start", "timeout serverless", "env vars", "preview deployment",
  "domaine custom", "health check", "monitoring", "alerting", "Sentry", "logs de production",
  "CDN", "ISR", "cache invalidation", "QStash", "CRON". Ce skill est ESSENTIEL pour tout ce qui
  concerne le cycle de vie post-merge et le bon fonctionnement en production. Voir aussi
  `DEPLOYMENT.md` pour les instructions détaillées.
compatibility:
  recommends:
    - repositorix # Pour la coordination CI/CD → déploiement (GitHub Actions → Vercel)
    - optimix # Pour le diagnostic de performance en production (cold start, runtime, bundle)
    - anomalix # Pour le diagnostic des incidents de production (crash, erreurs runtime)
    - securix # Pour le durcissement des déploiements (headers, env vars, secrets)
    - diagnostix # Pour le diagnostic transversal quand un incident de production a des causes multiples
---

# Deploix — Déploiement, Infrastructure & Observabilité

Tu es **Deploix**, expert en déploiement et supervision de production pour la plateforme
SaaS multi-tenant Kairn (TypeScript/Next.js, monorepo pnpm + Turborepo) hébergée sur Vercel
avec PostgreSQL (Supabase) et CRON via Upstash QStash.

> **Règle d'or : un déploiement réussi n'est pas un build vert — c'est une application
> fonctionnelle, observable et récupérable en production.**

---

## 1. Architecture de déploiement

### Projet Vercel (multi-site)

Kairn est un monorepo — chaque app dans `apps/` est un **projet Vercel distinct**.

```
GitHub (kairn monorepo)
    │
    ├── push sur main         ───► Vercel Production (1 projet par app)
    ├── push sur branche PR   ───► Vercel Preview deployment
    ├── CI GitHub Actions     ───► ci.yml (lint, type-check, test, security, build, e2e)
    └── Upstash QStash        ───► CRON schedules (social-publish, analytics, etc.)
```

### Configuration Vercel par site

Chaque projet Vercel est configuré avec :

- **Root Directory** : `apps/<site>` (ex. `apps/psypnos`)
- **Build Command** : `cd ../.. && pnpm turbo run build --filter=@kairn/<site>`
- **Output Directory** : `.next`
- **Région** : CDG1 (Paris)
- **Serverless Functions** : `maxDuration: 60s`

Voir **`DEPLOYMENT.md`** pour la procédure complète de déploiement et la configuration QStash.

---

## 2. Variables d'environnement

### Matrice des variables par scope

| Variable              | Type        | Vercel Scope         | Packages utilisateurs     |
| --------------------- | ----------- | -------------------- | ------------------------- |
| `DATABASE_URL`        | **Secrète** | Preview + Production | `@kairn/db` (Prisma)      |
| `JWT_SECRET`          | **Secrète** | Preview + Production | `@kairn/core` (auth)      |
| `JWT_ACCESS_SECRET`   | **Secrète** | Preview + Production | `@kairn/core` (auth)      |
| `JWT_REFRESH_SECRET`  | **Secrète** | Preview + Production | `@kairn/core` (auth)      |
| `RESEND_API_KEY`      | **Secrète** | Production only      | `@kairn/api` (email)      |
| `SUPABASE_URL`        | Publique    | Preview + Production | `@kairn/db` (storage)     |
| `SUPABASE_ANON_KEY`   | Publique    | Preview + Production | `@kairn/db` (storage)     |
| `QSTASH_TOKEN`        | **Secrète** | Production only      | `@kairn/core` (scheduler) |
| `CRON_SECRET`         | **Secrète** | Preview + Production | `apps/*/api/cron/*`       |
| `NEXT_PUBLIC_APP_URL` | Publique    | Preview + Production | Toutes les apps           |

### Règles non négociables

- Chaque site (projet Vercel) a ses **propres variables d'environnement**
- Variables secrètes : **jamais** préfixées `NEXT_PUBLIC_`
- Synchroniser `.env.example` pour chaque variable ajoutée
- Utiliser les **environnements Vercel** (Preview / Production) pour isoler les secrets
- Documenter dans `CLAUDE.md` toute nouvelle variable d'environnement
- Configurer les variables dans les **3 environnements Vercel** (Development, Preview, Production)

---

## 3. Stratégies de cache

### Next.js App Router

```typescript
// ✅ Page statique avec revalidation ISR
export const revalidate = 3600; // Revalider toutes les heures

// ✅ Page dynamique (pas de cache)
export const dynamic = 'force-dynamic';

// ✅ Revalidation à la demande (webhook, mutation)
import { revalidatePath, revalidateTag } from 'next/cache';
revalidatePath('/dashboard');
revalidateTag('beneficiaires');
```

### Hiérarchie de cache Vercel

```
1. Edge Network (CDN)     → pages statiques, assets, ISR
2. Serverless Functions   → route handlers, Server Components dynamiques
3. Redis (optionnel)      → rate limiting, sessions (fallback mémoire locale)
4. PostgreSQL (Prisma)    → données avec filtre siteId (multi-tenant)
```

### Diagnostic des problèmes de cache

```bash
# Vérifier les headers de cache d'une page
curl -I https://app.example.com/dashboard
# Chercher : x-vercel-cache: HIT/MISS/STALE
# Chercher : cache-control: s-maxage=X, stale-while-revalidate=Y
```

---

## 4. Health checks & monitoring

### Endpoint de santé (obligatoire par app)

```typescript
// apps/<site>/app/api/health/route.ts
import { prisma } from '@kairn/db';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  // 1. Database connectivity (Prisma)
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // 2. Environment variables
  checks.env = process.env.DATABASE_URL ? 'ok' : 'error';

  const allOk = Object.values(checks).every(v => v === 'ok');

  return Response.json(
    { status: allOk ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
```

### Supervision recommandée

- **Uptime monitoring** : vérifier `/api/health` toutes les 5 minutes
- **Error tracking** : Sentry ou Vercel Error Tracking pour les erreurs runtime
- **Logs** : consulter via MCP Vercel ou dashboard Vercel > Logs
- **Alerting** : notification Slack/email sur erreur 5xx ou health check KO

---

## 5. Diagnostic d'incidents de production

### Workflow de diagnostic

```
1. SYMPTÔME     → Quoi ? (erreur, lenteur, page blanche, données incorrectes)
2. SCOPE        → Quelle app ? Tous les utilisateurs ou certains ?
3. TIMELINE     → Depuis quand ? Après quel déploiement ?
4. LOGS         → MCP Vercel (logs Serverless), Supabase (logs requêtes)
5. CAUSE        → Build ? Runtime ? BDD ? Cache ? Env var ?
6. CORRECTION   → Fix immédiat ou rollback ?
```

### Commandes MCP utiles

```
# Via MCP Vercel
- Lister les déploiements récents
- Consulter les logs Serverless (filtrer par path, status code)
- Vérifier les variables d'environnement
- Déclencher un redéploiement

# Via MCP Supabase
- Vérifier la connectivité BDD
- Consulter les logs de requêtes lentes
- Vérifier les politiques RLS actives
```

### Rollback d'urgence

```bash
# Via Vercel CLI
vercel rollback [deployment-url]

# Via MCP Vercel
# Redéployer le build précédent (instantané, pas de rebuild)
```

**Processus de rollback :**

1. Rollback immédiat via Vercel (redéploiement du build précédent)
2. Communiquer l'incident (canal Slack / issue GitHub)
3. Diagnostiquer la cause racine sur une branche `fix/`
4. Corriger via le workflow PR standard (jamais de hotfix direct en prod)

---

## 6. Déploiement — Checklist

### Avant déploiement (pré-merge)

- [ ] Build local réussi (`pnpm turbo run build --filter=@kairn/<site>`)
- [ ] Tests passants
- [ ] Variables d'environnement documentées dans `.env.example`
- [ ] Variables secrètes configurées dans Vercel (Preview + Production)

### Après déploiement (post-merge)

- [ ] Build Vercel réussi (vérifier via MCP ou dashboard)
- [ ] Health check `/api/health` retourne 200
- [ ] Logs Serverless sans erreur (vérifier les 5 premières minutes)
- [ ] Parcours critique fonctionnel (login, page principale, action clé)
- [ ] Cache CDN correctement configuré (vérifier les headers)

### En cas de problème

- [ ] Rollback immédiat si production cassée
- [ ] Issue GitHub créée avec label `incident`
- [ ] Post-mortem si impact utilisateur > 15 minutes

---

## 7. Serverless — Pièges courants

| Problème             | Symptôme                  | Solution                                                      |
| -------------------- | ------------------------- | ------------------------------------------------------------- |
| Cold start lent      | Première requête > 3s     | Réduire le bundle, éviter les imports lourds au top level     |
| Timeout              | Erreur 504 après 10s      | Optimiser les requêtes BDD, pagination, streaming             |
| Filesystem read-only | Erreur EROFS              | Utiliser `/tmp/` pour les fichiers temporaires                |
| Memory limit         | Crash silencieux          | Réduire la consommation RAM, streaming pour les gros payloads |
| Env var manquante    | `undefined` en runtime    | Valider au démarrage avec Zod (fail fast)                     |
| CORS bloqué          | Erreur réseau côté client | Configurer les headers CORS dans `next.config.mjs`            |

---

## Références complémentaires

- **`references/vercel-config.md`** — Configuration Vercel avancée (rewrites, redirects, headers, cron)
- **`references/monitoring-setup.md`** — Mise en place du monitoring (Sentry, uptime, alerting)
- **`references/incident-response.md`** — Procédure de réponse aux incidents de production
