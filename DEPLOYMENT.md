# Déploiement Kairn sur Vercel

Ce guide décrit les étapes pour déployer un site Kairn sur Vercel avec QStash pour les tâches CRON.

## Architecture

- **Hébergement** : Vercel Pro (1 projet par site)
- **CRON/Scheduling** : Upstash QStash (contourne la limite de 40 CRON/jour de Vercel)
- **Base de données** : PostgreSQL (Supabase)
- **Cache** : Turborepo Remote Cache (Vercel natif)

## Prérequis

1. **Compte Vercel (Pro recommandé)** — le plan Hobby limite à 12 Serverless Functions par déploiement. Next.js regroupe les routes en ~10 fonctions, ce qui est proche de la limite. Le plan Pro supprime cette contrainte et offre des durées d'exécution plus longues.
2. Compte Upstash avec QStash activé
3. Base de données PostgreSQL (Supabase)
4. Node.js 22+ et pnpm 10+

## Variables d'environnement

### Vercel Project Settings

Configurez ces variables dans les settings du projet Vercel :

```bash
# Base de données
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="..."
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
JWT_PASSWORD_RESET_SECRET="..."

# Services externes
RESEND_API_KEY="..."
SUPABASE_URL="..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_KEY="..."

# AI (optionnel)
OPENAI_API_KEY="..."
ANTHROPIC_API_KEY="..."

# reCAPTCHA
RECAPTCHA_SITE_KEY="..."
RECAPTCHA_SECRET_KEY="..."

# Social Media
SOCIAL_ENCRYPTION_KEY="..."

# QStash (CRON)
CRON_SECRET="<générer avec: openssl rand -base64 32>"
QSTASH_TOKEN="<depuis Upstash Console>"
QSTASH_CURRENT_SIGNING_KEY="<depuis Upstash Console>"
QSTASH_NEXT_SIGNING_KEY="<depuis Upstash Console>"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://votre-site.fr"
```

## Étape 1 : Déployer sur Vercel

### Option A : Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Déployer (depuis le dossier de l'app)
cd apps/psypnos
vercel --prod
```

### Option B : Via GitHub Integration

1. Connectez votre repo GitHub à Vercel
2. Configurez le projet :
   - **Framework Preset** : Next.js
   - **Root Directory** : `apps/psypnos` (ou `apps/unanima`)
   - **Build Command** : `cd ../.. && pnpm turbo run build --filter=@kairn/psypnos`
   - **Output Directory** : `.next`
3. Ajoutez les variables d'environnement
4. Déployez

## Étape 2 : Configurer QStash

### 2.1 Récupérer les tokens QStash

1. Connectez-vous à [Upstash Console](https://console.upstash.com)
2. Créez un projet QStash ou utilisez un existant
3. Copiez les tokens depuis l'onglet "REST API" :
   - `QSTASH_TOKEN`
   - `QSTASH_CURRENT_SIGNING_KEY`
   - `QSTASH_NEXT_SIGNING_KEY`

### 2.2 Créer les schedules

Après le déploiement, exécutez le script de setup :

```bash
# Définir le token QStash
export QSTASH_TOKEN="your-token-here"

# Créer les schedules (dry run d'abord)
pnpm tsx scripts/setup-qstash-schedules.ts --site-url https://psypnos.fr --dry-run

# Créer les schedules
pnpm tsx scripts/setup-qstash-schedules.ts --site-url https://psypnos.fr
```

### 2.3 Vérifier les schedules

```bash
# Vérifier que tous les schedules sont configurés
pnpm tsx scripts/verify-qstash-schedules.ts --site-url https://psypnos.fr
```

## Schedules CRON configurés

| Job                      | CRON           | Description                                       |
| ------------------------ | -------------- | ------------------------------------------------- |
| `social-publish`         | `*/5 * * * *`  | Publication des posts sociaux (toutes les 5 min)  |
| `fetch-social-analytics` | `0 */4 * * *`  | Récupération analytics (toutes les 4h)            |
| `refresh-tokens`         | `0 * * * *`    | Rafraîchissement tokens OAuth (toutes les heures) |
| `daily-report`           | `0 8 * * *`    | Rapport quotidien (8h00)                          |
| `weekly-report`          | `0 9 * * 1`    | Rapport hebdomadaire (Lundi 9h00)                 |
| `cleanup-data`           | `0 3 * * *`    | Nettoyage données (3h00)                          |
| `cleanup-jobs`           | `0 4 * * *`    | Nettoyage jobs (4h00)                             |
| `aggregate`              | `30 * * * *`   | Agrégation analytics (toutes les heures à :30)    |
| `check-alerts`           | `*/15 * * * *` | Vérification alertes (toutes les 15 min)          |
| `process-reports`        | `45 * * * *`   | Traitement rapports (toutes les heures à :45)     |

## Étape 3 : Tester les endpoints CRON

En local ou après déploiement, testez les endpoints :

```bash
# Test local
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/social-publish

# Test production
curl -H "Authorization: Bearer $CRON_SECRET" https://psypnos.fr/api/cron/social-publish
```

## Turborepo Remote Cache (CI)

Pour activer le cache distant dans GitHub Actions :

1. Générez un token Turbo :

   ```bash
   npx turbo login
   npx turbo link
   ```

2. Ajoutez les secrets dans GitHub :
   - `TURBO_TOKEN` : Token généré
   - `TURBO_TEAM` (variable) : Nom de l'équipe Vercel

Le workflow CI utilise automatiquement ces variables.

## Déploiement d'un nouveau site

Pour déployer un nouveau site (ex: unanima) :

1. **Créer le projet Vercel** avec le Root Directory approprié
2. **Configurer les variables** d'environnement
3. **Créer les schedules QStash** :
   ```bash
   pnpm tsx scripts/setup-qstash-schedules.ts --site-url https://unanima.fr
   ```

## Troubleshooting

### Les CRON ne s'exécutent pas

1. Vérifiez les schedules QStash :

   ```bash
   pnpm tsx scripts/verify-qstash-schedules.ts
   ```

2. Vérifiez les logs dans Upstash Console

3. Testez manuellement l'endpoint :
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://votre-site.fr/api/cron/social-publish
   ```

### Erreur de signature QStash

1. Vérifiez que `QSTASH_CURRENT_SIGNING_KEY` et `QSTASH_NEXT_SIGNING_KEY` sont définis
2. Vérifiez que l'URL de destination est accessible publiquement
3. Consultez les logs de l'application

### Build échoue sur Vercel

1. Vérifiez que toutes les variables d'environnement sont définies
2. Assurez-vous que la base de données est accessible
3. Vérifiez les logs de build dans Vercel

### Erreur "No more than 12 Serverless Functions"

```
Error: No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

Cette erreur peut apparaître de manière **transitoire** sur le plan Hobby. Next.js regroupe les routes de l'application en ~10 Serverless Functions (visible via `lambdaRuntimeStats` dans les métadonnées du déploiement), ce qui est en dessous de la limite de 12.

**Si l'erreur apparaît** :

1. **Relancer le déploiement** — l'erreur peut être transitoire (bug de comptage côté Vercel)
2. Si l'erreur persiste, passer au **plan Pro** (Vercel Dashboard → Settings → Billing)

**Vérification locale** : Le script `check:vercel` compte les fichiers de fonctions du build local (qui diffère du regroupement Vercel) :

```bash
pnpm check:vercel -- --app psypnos --plan hobby
pnpm check:vercel -- --app psypnos --plan pro
```

## Maintenance

### Rotation des clés QStash

Upstash gère automatiquement la rotation des clés. Les deux clés (`current` et `next`) permettent une transition sans interruption.

### Mise à jour des schedules

Pour modifier un schedule, supprimez-le et recréez-le :

```bash
# Dans Upstash Console, supprimez le schedule
# Puis recréez avec le script
pnpm tsx scripts/setup-qstash-schedules.ts --site-url https://psypnos.fr --jobs social-publish
```

### Monitoring

- **Vercel** : Analytics et logs dans le dashboard
- **QStash** : Logs des exécutions dans Upstash Console
- **Application** : Logs dans les endpoints `/api/cron/*`
