# Déploiement AVV (Appréciez Votre Vie) sur Vercel

## Prérequis

- Compte Vercel (Pro recommandé)
- Compte Upstash avec QStash activé
- Base de données PostgreSQL (Supabase)
- Node.js 22+ et pnpm 10+

## Étape 1 : Créer le projet Vercel

### Option A : Via le script automatisé

```bash
# Définir le token Vercel
export VERCEL_TOKEN="votre-token-vercel"

# Dry run (prévisualisation)
pnpm tsx scripts/setup-vercel-project.ts --app avv --project-name kairn-avv --dry-run

# Création du projet
pnpm tsx scripts/setup-vercel-project.ts --app avv --project-name kairn-avv
```

### Option B : Via le Dashboard Vercel

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. Importer le repository GitHub `kairn`
3. Configurer :
   - **Project Name** : `kairn-avv`
   - **Framework Preset** : Next.js
   - **Root Directory** : `apps/avv`
   - **Build Command** : `cd ../.. && pnpm --filter @kairn/db exec prisma generate && pnpm turbo run build --filter=@kairn/avv --env-mode=loose`
   - **Install Command** : `pnpm install`
   - **Output Directory** : `.next`
4. Région : CDG1 (Paris)

### Option C : Via Vercel CLI

```bash
cd apps/avv
vercel link  # Sélectionner "Create a new project" → kairn-avv
vercel --prod
```

## Étape 2 : Variables d'environnement

Configurer dans Vercel Dashboard → Settings → Environment Variables.

### Variables requises (Production + Preview)

| Variable | Description | Génération |
|----------|-------------|------------|
| `DATABASE_URL` | URL PostgreSQL Supabase | Depuis Supabase Dashboard |
| `JWT_SECRET` | Secret JWT principal | `openssl rand -base64 32` |
| `JWT_ACCESS_SECRET` | Secret access token | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secret refresh token | `openssl rand -base64 32` |
| `JWT_PASSWORD_RESET_SECRET` | Secret reset password | `openssl rand -base64 32` |
| `CSRF_SECRET` | Secret CSRF (distinct de JWT) | `openssl rand -base64 32` |
| `SECRETS_ENCRYPTION_KEY` | Clé chiffrement secrets DB | `openssl rand -hex 32` |
| `RESEND_API_KEY` | Clé API email Resend | Depuis Resend Dashboard |
| `IP_HASH_SECRET` | Secret hachage IP analytics | `openssl rand -base64 32` |
| `CRON_SECRET` | Secret endpoints CRON | `openssl rand -base64 32` |
| `QSTASH_TOKEN` | Token QStash scheduling | Depuis Upstash Console |
| `QSTASH_CURRENT_SIGNING_KEY` | Clé signature QStash | Depuis Upstash Console |
| `QSTASH_NEXT_SIGNING_KEY` | Clé signature QStash next | Depuis Upstash Console |
| `NEXT_PUBLIC_APP_URL` | URL publique du site | `https://appreciezvotrevie.fr` |
| `NODE_ENV` | Environnement | `production` |

### Variables optionnelles

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL Supabase (storage images) |
| `SUPABASE_ANON_KEY` | Clé anonyme Supabase |
| `SUPABASE_SERVICE_KEY` | Clé service Supabase |
| `OPENAI_API_KEY` | Clé API OpenAI (génération IA) |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (génération IA) |
| `SOCIAL_ENCRYPTION_KEY` | Chiffrement tokens réseaux sociaux |
| `REDIS_URL` | URL Redis (cache/rate limiting) |
| `VAPID_PUBLIC_KEY` | Clé publique push notifications |
| `VAPID_PRIVATE_KEY` | Clé privée push notifications |

### Variables spécifiques Preview

Pour les déploiements Preview, configurer séparément :

- `NEXT_PUBLIC_APP_URL` → URL de preview Vercel (ex: `https://kairn-avv-*.vercel.app`)
- `NODE_ENV` → `preview`

## Étape 3 : Configurer le domaine

1. Vercel Dashboard → Settings → Domains
2. Ajouter `appreciezvotrevie.fr`
3. Ajouter `www.appreciezvotrevie.fr` (redirect vers apex)
4. Configurer les DNS chez le registrar :
   - `A` record : `76.76.21.21` (Vercel)
   - `CNAME` pour `www` : `cname.vercel-dns.com`

## Étape 4 : Configurer QStash (CRON)

```bash
# Définir le token QStash
export QSTASH_TOKEN="votre-token-qstash"

# Dry run
pnpm tsx scripts/setup-qstash-schedules.ts --site-url https://appreciezvotrevie.fr --dry-run

# Créer les schedules
pnpm tsx scripts/setup-qstash-schedules.ts --site-url https://appreciezvotrevie.fr

# Vérifier
pnpm tsx scripts/verify-qstash-schedules.ts --site-url https://appreciezvotrevie.fr
```

## Étape 5 : Premier déploiement

```bash
# Via CLI
cd apps/avv && vercel --prod

# Ou via git push (si GitHub integration configurée)
git push origin main
```

## Étape 6 : Vérification post-déploiement

```bash
# Tester les endpoints CRON
curl -H "Authorization: Bearer $CRON_SECRET" https://appreciezvotrevie.fr/api/cron/social-publish

# Vérifier les limites Vercel
pnpm tsx scripts/check-vercel-limits.ts --app avv --plan pro
```

## Configuration spécifique AVV

- **Site ID** : `avv`
- **Package** : `@kairn/avv`
- **Domaine** : `appreciezvotrevie.fr`
- **Région** : CDG1 (Paris)
- **Email from** : `dduquenne@appreciezvotrevie.fr`
- **Services** : Sophrologie, Somatothérapie, Breathwork, Cohérence Cardiaque, Reiki
- **Features** : Blog, Séminaires, Analytics, Social Media, Témoignages, Contact, RDV

## Troubleshooting

Voir le guide principal : [DEPLOYMENT.md](../../../DEPLOYMENT.md#troubleshooting)
