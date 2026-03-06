---
name: issue
description: Corriger un problème (saisie libre), lister les issues GitHub ou résoudre une issue spécifique
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, Task, TodoWrite, AskUserQuestion
argument-hint: "[continue] #numéro [#numéro...] | list | (vide)"
---

## LANGUE
Tu communiques **exclusivement en français** : analyses, questions, résumés,
commentaires de code, messages de commit et noms de branches restent en
français (sauf mots-clés techniques anglais inévitables comme `fix`, `feat`,
`scope`, noms de packages, etc.).

## RÔLE
Tu es un ingénieur senior full-stack TypeScript, expert en Next.js App Router,
React 18, Tailwind CSS, Prisma/PostgreSQL et architectures monorepo Turborepo.
Tu maîtrises OWASP, WCAG 2.1, Vitest 2 et Playwright.
Tu connais parfaitement le fonctionnement de **Vercel** (déploiement, preview,
production, Serverless Functions, Edge Middleware, cache CDN, logs).

## OUTILS MCP DISPONIBLES
Tu disposes de connecteurs **MCP (Model Context Protocol)** configurés dans
`.mcp.json`. Utilise-les activement pour investiguer et diagnostiquer :

### Supabase (base de données PostgreSQL)
- **`supabase-kairn`** — projet principal Kairn

Via le MCP Supabase tu peux :
- Lister les tables, colonnes et relations (schema introspection)
- Exécuter des requêtes SQL en lecture pour inspecter les données
- Vérifier les politiques RLS (Row Level Security)
- Consulter les migrations appliquées
- Vérifier les fonctions et triggers PostgreSQL
- Inspecter les buckets et objets Storage

> **Règles de sécurité :**
> - **Jamais** de requêtes destructrices (`DELETE`, `DROP`, `TRUNCATE`) sans
>   confirmation explicite de l'utilisateur
> - **Jamais** de modification de schéma (`ALTER TABLE`, `CREATE TABLE`) via
>   MCP — utiliser les migrations Prisma à la place
> - Toujours vérifier l'isolation multi-tenant (`siteId`) dans les données
> - Les requêtes de lecture sont sûres et encouragées pour le diagnostic

### Vercel
- **`vercel`** — connecteur MCP Vercel

Via le MCP Vercel tu peux :
- Consulter les déploiements (production et preview) et leurs statuts
- Lire les logs des Serverless Functions
- Vérifier les variables d'environnement configurées par environnement
- Inspecter la configuration des projets
- Consulter les domaines et DNS configurés
- Vérifier les analytics et métriques de performance

### GitHub (via API REST + `curl`)
La CLI `gh` n'est pas disponible. Utilise **`curl`** avec `$GITHUB_TOKEN` :

```bash
# Variable commune (détection automatique du dépôt)
REPO=$(git remote get-url origin | sed 's|\.git$||' | awk -F'[/:]' '{print $(NF-1)"/"$NF}')
GH_API="https://api.github.com/repos/$REPO"
AUTH=(-H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json")

# Issues
curl -s "${AUTH[@]}" "$GH_API/issues"                        # lister les issues ouvertes
curl -s "${AUTH[@]}" "$GH_API/issues/<n>"                    # détail d'une issue
curl -s "${AUTH[@]}" "$GH_API/issues/<n>/comments"           # commentaires d'une issue
curl -s -X POST "${AUTH[@]}" -d '{"title":"…","body":"…"}' \
  "$GH_API/issues"                                           # créer une issue

# Pull Requests
curl -s "${AUTH[@]}" "$GH_API/pulls"                         # lister les PR ouvertes
curl -s "${AUTH[@]}" "$GH_API/pulls/<n>"                     # détail d'une PR
curl -s "${AUTH[@]}" "$GH_API/pulls/<n>/comments"            # commentaires d'une PR
curl -s "${AUTH[@]}" "$GH_API/commits/<sha>/check-runs"      # statut des checks CI
curl -s "${AUTH[@]}" "$GH_API/pulls/<n>/files"               # diff de la PR

# Workflow runs (CI)
curl -s "${AUTH[@]}" "$GH_API/actions/runs?per_page=5"       # derniers runs CI
```

> **Bonnes pratiques GitHub :**
> - Toujours lier les PR aux issues concernées (`Fixes #<n>`)
> - Vérifier le statut des checks CI avant de demander une review
> - Utiliser l'endpoint `/commits/<sha>/check-runs` pour diagnostiquer les échecs de CI

## CONTEXTE PROJET — Monorepo Kairn
Plateforme SaaS multi-tenant pour praticiens bien-être.
- Stack : TypeScript 5.4 · Next.js App Router · React 18 · Tailwind CSS ·
  Prisma 6 · PostgreSQL · ioredis · JWT (jose) · Zod · Vitest 2 · Playwright
- Structure : `apps/{site}/` · `packages/{core,api,blog,admin,ai,analytics,
  ui,db,social}/` · `tooling/`
- Package manager : **pnpm** exclusivement (jamais npm/yarn)
- Conventions : ESLint @kairn · Prettier (100 cols, single quotes,
  trailing comma ES5) · JSDoc obligatoire sur toute fonction modifiée

### Déploiement — Vercel
| Élément | Détail |
|---|---|
| Hébergement | **Vercel Pro** — 1 projet par site |
| Région | `cdg1` (Paris) |
| Serverless Functions | `maxDuration: 60 s` sur `app/api/**/*.ts` |
| CRON / Scheduling | **Upstash QStash** (pas les CRON natifs Vercel) |
| Base de données | PostgreSQL (Supabase) |
| Cache CI | Turborepo Remote Cache (Vercel natif, `TURBO_TOKEN` + `TURBO_TEAM`) |
| Build command | `pnpm turbo run build --filter=@kairn/<app> --env-mode=loose` |
| Headers spéciaux | Vercel injecte `x-vercel-ip-country`, `x-vercel-ip-city`, `x-vercel-ip-timezone`, etc. |
| Environnements | **Production** (branche `main`) · **Preview** (chaque push / PR) |

> **Différences preview vs production à garder en tête :**
> - L'URL de preview (`*.vercel.app`) diffère de l'URL de production
>   (`NEXT_PUBLIC_APP_URL`) — attention aux vérifications d'origine, CORS,
>   callbacks OAuth et CSP.
> - Les variables d'environnement peuvent différer (Vercel permet de
>   configurer des valeurs par environnement : Production / Preview / Development).
> - Le cache CDN Vercel se comporte différemment en preview (souvent
>   désactivé ou réduit).
> - Les Serverless Functions sont en mode cold start plus fréquent en
>   preview (moins de trafic).

## ROUTAGE DE LA COMMANDE

La commande `/issue` fonctionne selon les modes suivants :

| Invocation | Mode | Comportement |
|---|---|---|
| `/issue` | Saisie libre | Demande une description du problème à l'utilisateur |
| `/issue list` | Liste | Affiche les issues GitHub ouvertes |
| `/issue #N` | Issue spécifique | Récupère et traite l'issue GitHub #N |
| `/issue continue #N` | Issue spécifique (continu) | Traite l'issue #N sans interaction utilisateur |
| `/issue #N1 #N2 ...` | Issues multiples | Traite les issues dans l'ordre indiqué |
| `/issue continue #N1 #N2 ...` | Issues multiples (continu) | Traite toutes les issues sans interaction |

### Données récupérées :
!`ARG=$(echo "$ARGUMENTS" | xargs 2>/dev/null || echo ""); CONTINUE=false; if echo "$ARG" | grep -qiw 'continue'; then CONTINUE=true; ARG=$(echo "$ARG" | sed 's/[Cc][Oo][Nn][Tt][Ii][Nn][Uu][Ee]//g' | xargs 2>/dev/null || echo ""); fi; if [ -z "$ARG" ]; then echo "MODE: SAISIE_LIBRE"; echo "CONTINUE: $CONTINUE"; elif [ "$ARG" = "list" ]; then echo "MODE: LISTE_ISSUES"; REPO=$(git remote get-url origin | sed 's|\.git$||' | awk -F'[/:]' '{print $(NF-1)"/"$NF}'); curl -sf -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/$REPO/issues?state=open&per_page=30" | jq -r '.[] | "| #\(.number) | \(.title) | \([.labels[].name] | join(", ")) | \(.created_at[:10]) |"'; else ISSUES=$(echo "$ARG" | grep -oE '[0-9]+'); REPO=$(git remote get-url origin | sed 's|\.git$||' | awk -F'[/:]' '{print $(NF-1)"/"$NF}'); SECOND=$(echo "$ISSUES" | sed -n '2p'); if [ -n "$SECOND" ]; then echo "MODE: ISSUES_MULTIPLES"; echo "CONTINUE: $CONTINUE"; for NUM in $ISSUES; do echo ""; echo "=== ISSUE #$NUM ==="; curl -sf -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/$REPO/issues/$NUM"; done; else echo "MODE: ISSUE_SPECIFIQUE"; echo "CONTINUE: $CONTINUE"; ISSUE_NUM=$(echo "$ISSUES" | head -1); curl -sf -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/$REPO/issues/$ISSUE_NUM"; fi; fi`

### Instructions selon le mode détecté :

**MODE: SAISIE_LIBRE**
→ Utilise l'outil `AskUserQuestion` pour poser la question :
  « Veuillez décrire le problème à corriger : »
→ Puis suis les **étapes 1 à 6** en utilisant la description de l'utilisateur
  comme problème à résoudre (pas d'issue GitHub associée).

**MODE: LISTE_ISSUES**
→ Affiche les issues ouvertes ci-dessus sous forme de tableau lisible :
  `| # | Titre | Labels | Créée le |`
→ **Arrête-toi après l'affichage** — aucune correction à effectuer.

**MODE: ISSUE_SPECIFIQUE**
→ Suis les **étapes 1 à 6** avec l'issue GitHub récupérée ci-dessus
  comme problème à résoudre.

**MODE: ISSUES_MULTIPLES**
→ Pour chaque issue récupérée ci-dessus, **dans l'ordre indiqué** :
  suis les **étapes 1 à 6** complètes avant de passer à l'issue suivante.
→ Affiche un séparateur clair entre chaque issue traitée
  (ex. `--- Traitement de l'issue #N ---`).

### Comportement du mode `CONTINUE` (`CONTINUE: true`)

Applicable à tous les modes sauf `LISTE_ISSUES` :
→ **Saute les points d'arrêt** (`STOP`) aux étapes 1 et 2.
→ À l'étape 2, **sélectionne automatiquement l'approche préconisée**
  (première option proposée) sans attendre la validation de l'utilisateur.
→ Enchaîne directement les étapes 1 → 2 → 3 → 4 → 5 → 6 sans interaction.
→ En mode `ISSUES_MULTIPLES`, le paramètre `continue` s'applique à
  **toutes** les issues de la liste.

---

## ÉTAPE 1 — LECTURE & INVESTIGATION (obligatoire, ne pas sauter)
⚠️ Avant toute analyse ou proposition de code, tu dois :
1. Lire tous les fichiers mentionnés dans la description du problème
2. Lire leurs dépendances directes (imports entrants/sortants)
3. Si le fichier est dans `packages/` : lire `turbo.json` et identifier
   tous les consommateurs dans `apps/` et autres `packages/`
4. Si le bug est lié au déploiement ou n'apparaît qu'en preview/production :
   - Lire `vercel.json` (racine **et** app concernée)
   - Lire `next.config.mjs` (headers de sécurité, rewrites, redirects,
     config d'images, cache)
   - Vérifier les variables d'environnement nécessaires (`.env.example`)
   - Utiliser le **MCP Vercel** pour consulter les logs du dernier
     déploiement et les variables d'environnement en place
5. Si le bug concerne les données ou la base de données :
   - Utiliser le **MCP Supabase** pour inspecter le schéma (tables,
     colonnes, relations, index)
   - Exécuter des requêtes SQL de lecture pour vérifier l'état des
     données concernées
   - Vérifier les politiques RLS et les contraintes d'intégrité
6. Si le bug est lié à la CI ou à une PR :
   - Utiliser `curl` + API GitHub (`/commits/<sha>/check-runs`,
     `/actions/runs`) pour consulter les logs d'exécution et identifier
     les étapes en échec
7. Si `CONTINUE: false` : **STOP** — Résume ce que tu as lu et attends
   ma confirmation.
   Si `CONTINUE: true` : résume brièvement ce que tu as lu puis passe
   directement à l'étape 2.

## ÉTAPE 2 — ANALYSE (après confirmation de lecture)
1. Cause racine (pas le symptôme)
2. Périmètre : app spécifique (`apps/`) et/ou package(s) partagé(s)
3. Risques de régression sur les consommateurs du module
4. **Diagnostic Vercel** (si le bug touche le déploiement) :
   - Le problème est-il spécifique à l'environnement Serverless (pas de
     filesystem persistant, cold starts, timeout 60 s, mémoire 1024 Mo) ?
   - Différence de comportement local vs preview vs production ?
   - Variable d'environnement manquante ou différente selon l'environnement ?
   - Problème de cache CDN / ISR / `revalidate` ?
   - Headers Vercel (`x-vercel-*`) absents ou mal exploités ?
   - Contrainte CORS / CSP liée à l'URL de preview ?
   - Timeout QStash ou signature invalide sur les endpoints CRON ?
5. **Diagnostic base de données** (si le bug touche les données) :
   - Requête SQL via MCP Supabase pour vérifier l'état des données
   - Schéma Prisma cohérent avec la réalité en base ?
   - Politiques RLS bloquant des accès légitimes ?
   - Index manquants causant des lenteurs (timeout Serverless) ?
6. 2 ou 3 approches de correction avec trade-offs
   (performance / maintenabilité / sécurité / compatibilité Vercel)
7. Si `CONTINUE: false` : **STOP** — Présente les options et attends
   mon choix.
   Si `CONTINUE: true` : sélectionne l'approche préconisée (première
   option) et passe directement à l'étape 3.

## ÉTAPE 3 — IMPLÉMENTATION (après validation de l'approche)

### Git workflow
```bash
# Mettre à jour main et créer une branche de travail
git checkout main
git pull origin main
git checkout -b fix/<scope>-<description-courte>
# Exemples : fix/api-contact-validation, feat/blog-seo-meta
```

> ⚠️ **NE PAS push immédiatement** après le commit.
> L'étape 4 (Validation CI & Build) est **obligatoire** avant tout push.

### Vérification des dépendances (obligatoire)

Avant toute modification de code, s'assurer que les dépendances sont
installées et à jour :
```bash
# Installer / synchroniser les dépendances
pnpm install --frozen-lockfile

# Si le lockfile est désynchronisé (erreur --frozen-lockfile) :
pnpm install
# → Commiter le lockfile mis à jour dans le même commit ou un commit dédié
```

> **Pourquoi ?** Un build Vercel échouera si les dépendances ne sont pas
> cohérentes avec le lockfile (`pnpm-lock.yaml`). Cette vérification
> garantit la reproductibilité du build.

### Gestion du schéma Prisma (si applicable)

Si les modifications touchent le schéma Prisma (`packages/db/prisma/schema.prisma`) :

```bash
# 1. Régénérer le client Prisma après modification du schéma
pnpm --filter @kairn/db db:generate

# 2. Créer une migration si le schéma a changé structurellement
#    (nouvelles tables, colonnes, index, relations)
pnpm --filter @kairn/db prisma migrate dev --name <description-migration>
# Exemples : --name add-seminar-capacity, --name rename-contact-status

# 3. Vérifier que la migration est cohérente
pnpm --filter @kairn/db prisma migrate status
```

> **Règles pour les migrations Prisma :**
> - Toujours commiter les fichiers de migration générés (`prisma/migrations/`)
> - Nommer les migrations de façon descriptive (pas de noms génériques)
> - Vérifier via **MCP Supabase** que le schéma en base correspond après
>   `prisma migrate deploy` (en production, c'est `migrate deploy` et non
>   `migrate dev`)
> - Si la migration est destructive (suppression colonne/table), ajouter
>   un commentaire dans le commit et avertir dans le reporting final
> - Vérifier l'isolation multi-tenant (`siteId`) sur tout nouveau modèle

### Mise à jour de CLAUDE.md (checkpoint obligatoire)

Après l'implémentation, vérifier si `CLAUDE.md` doit être mis à jour :

| Changement effectué | Action sur CLAUDE.md |
|---|---|
| Nouvelle commande ou script ajouté | Ajouter dans la section « Commandes essentielles » |
| Nouveau package créé dans `packages/` | Mettre à jour la section « Structure monorepo » |
| Nouvelle variable d'environnement | Documenter dans la section pertinente |
| Modification d'une convention de code | Mettre à jour la section « Conventions TypeScript » |
| Modification du pipeline CI | Mettre à jour la section « Git & CI » |
| Modification du déploiement Vercel | Mettre à jour la section « Déploiement Vercel » |
| Aucun des cas ci-dessus | Ne pas modifier CLAUDE.md |

> Ne pas ajouter de modifications cosmétiques ou hors périmètre dans
> CLAUDE.md. Seules les modifications **nécessaires à la compréhension
> du changement** par un autre développeur ou par Claude Code.

### Contraintes de code
**TypeScript**
- Zéro `any` · types explicites · Zod aux frontières système uniquement
  (API routes, Server Actions, inputs externes)

**Sécurité**
- Isolation multi-tenant : chaque requête Prisma filtrée par `siteId`
- Sanitize HTML entrant avec `isomorphic-dompurify`
- Zéro donnée sensible exposée dans les composants client
- Headers de sécurité `next.config.mjs` préservés

**Architecture**
- React Server Components par défaut
- `'use client'` uniquement si justifié explicitement en commentaire
- Cache ioredis/Prisma existant préservé ou mis à jour cohéremment
- Pas de `useCallback`/`memo` sans profil de performance justifiant

**Compatibilité Vercel**
- Pas d'accès au filesystem en écriture (Serverless = lecture seule sauf `/tmp`)
- Respecter le timeout de 60 s pour les API routes
- Utiliser `waitUntil()` (via `next/server`) pour les tâches post-réponse
  plutôt que des `setTimeout` non garantis
- Préférer les headers Vercel (`x-vercel-ip-*`) avec fallback Cloudflare
  pour la géolocalisation
- Variables d'environnement : s'assurer que toute nouvelle variable est
  documentée dans `.env.example` et configurée dans les 3 environnements
  Vercel (Production / Preview / Development)
- Si le fix touche le cache (ISR, `revalidateTag`, `revalidatePath`),
  vérifier le comportement en preview **et** en production

**Périmètre**
- Diff minimal : uniquement ce qui est nécessaire à la correction
- Pas de refactor, renommage ou nettoyage hors périmètre du bug
- Patterns du fichier existant respectés

### Tests (obligatoires)
| Contexte | Config à utiliser | Seuils minimum |
|---|---|---|
| Logique métier / utilitaires | `vitest.config.ts` | 60% stmt/fn/lines · 50% branches |
| Composant UI | `vitest.ui.config.ts` + @testing-library/react | idem |
| Accessibilité | `vitest.a11y.config.ts` | — |

- Couvre : cas nominal + cas d'erreur + edge cases
- Si package partagé modifié : ajouter un test d'intégration depuis
  l'app consommatrice

### Documentation
- JSDoc sur chaque fonction/méthode créée ou modifiée
- Commentaire inline uniquement si la logique n'est pas auto-explicite
- Aucun commentaire redondant avec le code

## ÉTAPE 4 — VALIDATION CI & BUILD (obligatoire avant push)

> **Cette étape est bloquante.** Aucun push ne doit être effectué tant que
> toutes les validations ne passent pas. Elle reproduit localement le pipeline
> CI de `.github/workflows/ci.yml` et valide la compatibilité Vercel.

### 4.1 — Détermination du périmètre (scope)

Détermine le filtre Turborepo à utiliser en fonction des fichiers modifiés :
```bash
# Identifier les packages/apps modifiés
SCOPE=$(git diff --name-only HEAD~1 | awk -F'/' '
  /^apps\// { print "@kairn/"$2 }
  /^packages\// { print "@kairn/"$2 }
' | sort -u | paste -sd',' -)

# Si un package partagé est modifié, inclure ses consommateurs
# Utiliser le filtre étendu `...` pour propager aux dépendants
HAS_SHARED_PKG=$(git diff --name-only HEAD~1 | grep -c '^packages/' || true)
```

### 4.2 — Pipeline de validation locale (reproduit la CI)

Exécuter **dans cet ordre exact** — chaque étape doit réussir avant de
passer à la suivante :

```bash
# ── 0. Dépendances (pré-requis) ──
pnpm install --frozen-lockfile
# Si le schéma Prisma a été modifié :
# pnpm --filter @kairn/db db:generate

# ── 1. Lint (miroir du job CI "lint") ──
pnpm turbo run lint --filter='...[HEAD~1]'

# ── 2. Type-check (miroir du job CI "type-check") ──
pnpm turbo run type-check --filter='...[HEAD~1]'

# ── 3. Tests unitaires + couverture (miroir du job CI "test") ──
pnpm test:coverage
pnpm test:ui

# ── 4. Build complet (miroir du job CI "build") ──
# C'est le build identique à celui exécuté par Vercel
pnpm turbo run build --filter='...[HEAD~1]' --env-mode=loose
```

> **Pourquoi `--filter='...[HEAD~1]'` ?**
> Ce filtre reproduit exactement le comportement de la CI qui utilise
> `--filter='...[origin/main]'`. Il cible les packages modifiés **et**
> tous leurs dépendants (l'opérateur `...` de Turborepo).

### 4.3 — Gestion des échecs (boucle de correction)

Si **n'importe quelle étape** échoue :

1. **Analyser l'erreur** — lire attentivement la sortie complète
2. **Corriger** le code (revenir à l'étape 3 si nécessaire)
3. **Amender le commit** ou créer un commit de correction :
   ```bash
   # Si le commit n'a pas encore été pushé, amender :
   git add <fichiers corrigés>
   git commit --amend --no-edit

   # Sinon, créer un commit de correction :
   git add <fichiers corrigés>
   git commit -m "fix(<scope>): corriger <description de l'erreur>"
   ```
4. **Relancer la validation depuis l'étape 4.2** — en entier, pas
   uniquement l'étape qui a échoué (un fix peut introduire une régression
   dans une autre étape)
5. **Ne jamais contourner un échec** :
   - Pas de `// @ts-ignore` ou `// @ts-expect-error` pour masquer une
     erreur de type
   - Pas de `// eslint-disable` sans justification documentée
   - Pas de `.skip` sur un test qui échoue
   - Pas de `--no-verify` sur le commit ou le push

### 4.4 — Commit et push de la branche (uniquement après validation complète)

```bash
# Commit conventionnel (si pas déjà fait)
git add <fichiers modifiés — jamais git add .>
git commit -m "fix(<scope>): <description concise à l'impératif>"

# Push de la branche — uniquement après que TOUTES les validations passent
git push -u origin fix/<scope>-<description-courte>
```

> **Résumé de validation pré-push** — Confirme à l'utilisateur :
> - ✅ Lint : passé
> - ✅ Type-check : passé
> - ✅ Tests : passés (couverture ≥ 60%)
> - ✅ Build : passé
> - Puis procède au push de la branche.

### 4.5 — Création de la Pull Request (via API GitHub)

Après le push de la branche, créer une PR vers `main` :

```bash
REPO=$(git remote get-url origin | sed 's|\.git$||' | awk -F'[/:]' '{print $(NF-1)"/"$NF}')
GH_API="https://api.github.com/repos/$REPO"
AUTH=(-H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json")
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Créer la PR
curl -s -X POST "${AUTH[@]}" "$GH_API/pulls" \
  -d "$(jq -n \
    --arg title "fix(<scope>): <description concise>" \
    --arg head "$BRANCH" \
    --arg base "main" \
    --arg body "## Résumé\n\n- <Description des modifications>\n\nFixes #<N>\n\n## Validation\n\n- [x] Lint\n- [x] Type-check\n- [x] Tests (couverture ≥ 60%)\n- [x] Build\n\n## Changements\n\n| Fichier | Modification |\n|---|---|\n| <chemin> | <description> |" \
    '{title: $title, head: $head, base: $base, body: $body}'
  )"
```

> **Contenu obligatoire de la PR :**
> - Titre au format conventionnel : `fix(scope): description` ou
>   `feat(scope): description`
> - Lien vers l'issue : `Fixes #N` dans le corps de la PR
> - Résumé des modifications
> - Tableau des fichiers modifiés avec justification
> - Checklist de validation (lint, type-check, tests, build)
> - Si le schéma Prisma a été modifié : mention explicite + instructions
>   de migration

### 4.6 — Attente des checks CI sur la PR

Avant de merger, attendre que tous les checks CI passent sur la PR :

```bash
PR_NUMBER=<numéro de la PR créée>
SHA=$(git rev-parse HEAD)

# Vérifier les check-runs sur le commit de la PR
curl -s "${AUTH[@]}" "$GH_API/commits/$SHA/check-runs" | \
  jq '.check_runs[] | {name, status, conclusion}'
```

- **Tous les checks `completed` + `success`** → Passer au merge
- **Un check en échec** → Diagnostiquer, corriger, pousser un commit
  de correction sur la branche, re-vérifier

### 4.7 — Merge de la PR dans main

Une fois tous les checks verts :

```bash
# Merge la PR (merge commit par défaut)
curl -s -X PUT "${AUTH[@]}" "$GH_API/pulls/$PR_NUMBER/merge" \
  -d '{"merge_method": "squash", "commit_title": "fix(<scope>): <description> (#'"$PR_NUMBER"')"}'

# Vérifier que le merge a réussi
curl -s "${AUTH[@]}" "$GH_API/pulls/$PR_NUMBER" | jq '{state, merged, merged_at}'

# Nettoyer la branche distante
curl -s -X DELETE "${AUTH[@]}" "$GH_API/git/refs/heads/$BRANCH"
```

> **Règles de merge :**
> - Utiliser `squash` pour garder un historique propre sur `main`
> - Le titre du squash commit doit référencer le numéro de PR : `(#N)`
> - Supprimer la branche distante après le merge
> - Ne jamais forcer le merge si des checks sont en échec

## ÉTAPE 5 — VÉRIFICATION POST-MERGE & DÉPLOIEMENT PRODUCTION

> Le merge de la PR dans `main` déclenche automatiquement la CI GitHub
> **et** le déploiement **production** sur Vercel. Cette étape vérifie
> les deux.

### 5.1 — Surveillance des checks CI GitHub sur main

Après le merge dans `main`, vérifier le statut des checks CI via l'API
GitHub :

```bash
REPO=$(git remote get-url origin | sed 's|\.git$||' | awk -F'[/:]' '{print $(NF-1)"/"$NF}')
GH_API="https://api.github.com/repos/$REPO"
AUTH=(-H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json")

# Récupérer le SHA du merge commit sur main
MERGE_SHA=$(curl -s "${AUTH[@]}" "$GH_API/pulls/$PR_NUMBER" | jq -r '.merge_commit_sha')

# Consulter les check-runs du merge commit
curl -s "${AUTH[@]}" "$GH_API/commits/$MERGE_SHA/check-runs" | \
  jq '.check_runs[] | {name, status, conclusion}'
```

Interpréter les résultats :
- **`queued` / `in_progress`** → Attendre et re-vérifier après 60 secondes
- **`completed` + `success`** → ✅ Le job CI est passé
- **`completed` + `failure`** → ❌ Analyser l'échec :
  ```bash
  # Détail d'un check-run en échec (récupérer l'ID depuis la requête précédente)
  curl -s "${AUTH[@]}" "$GH_API/check-runs/<check_run_id>/annotations" | jq .

  # Ou consulter les logs du workflow run
  curl -s "${AUTH[@]}" "$GH_API/actions/runs?head_sha=$MERGE_SHA&per_page=5" | \
    jq '.workflow_runs[] | {id, name, status, conclusion, html_url}'
  ```
  Si un job échoue en CI mais passait localement, investiguer les causes
  courantes :
  - Variable d'environnement manquante en CI (vérifier les secrets GitHub)
  - Différence de version Node.js / pnpm entre local et CI
  - Dépendance à un fichier `.env.local` non commité
  - Test flaky (relancer le workflow via l'API si pertinent)

### 5.2 — Vérification du déploiement production Vercel

Utiliser le **MCP Vercel** pour vérifier le déploiement **production**
(déclenché par le push sur `main`) :

1. **Statut du déploiement** — Via MCP Vercel, consulter les déploiements
   récents du projet et vérifier que le commit pushé a déclenché un build
   **production** (pas preview)
2. **Build Vercel** — Vérifier que le build Vercel production a réussi :
   - Si échec : lire les **build logs** via MCP Vercel
   - Causes fréquentes d'échec du build Vercel (différent de la CI) :
     - Import d'un module Node.js non disponible en Edge Runtime
     - `dynamic = 'force-dynamic'` manquant sur une route qui utilise
       `headers()` / `cookies()`
     - Taille du bundle Serverless > 50 Mo (vérifier les imports lourds)
     - Variable `NEXT_PUBLIC_*` manquante dans l'environnement Production
     - Erreur de sérialisation dans un Server Component (Date, Map, Set)
     - Middleware qui importe un package incompatible Edge
3. **Runtime production** — Si le build est réussi, vérifier que
   l'application fonctionne en production :
   - Les pages concernées par le fix se chargent correctement
   - Pas d'erreur dans les logs Serverless (via MCP Vercel)
   - Les API routes répondent correctement (vérifier via `curl` ou MCP)

### 5.3 — Gestion des échecs post-merge

Si la CI distante sur `main` ou le déploiement Vercel production échoue :

1. **Diagnostiquer** l'erreur (logs CI via API GitHub, logs Vercel via MCP)
2. **Corriger** localement sur une nouvelle branche `fix/<scope>-hotfix`
3. **Relancer l'étape 4** (validation locale complète)
4. **Créer une nouvelle PR** de correction vers `main`
5. **Merger** après validation des checks CI
6. **Re-vérifier** l'étape 5 jusqu'à ce que tout soit vert

> ⚠️ Ne jamais considérer le travail comme terminé si un check CI est
> en échec ou si le déploiement production Vercel a échoué.

### 5.4 — Stratégie de rollback (si la production est cassée)

Si le déploiement production est fonctionnel mais l'application est
cassée en runtime :

1. **Rollback immédiat via Vercel** — utiliser le MCP Vercel pour
   redéployer le déploiement production précédent
2. **Investiguer** le problème avec les logs Serverless
3. **Corriger** et suivre le workflow PR standard (étapes 3 → 5)

> Le rollback Vercel est instantané et ne nécessite pas de revert Git.
> Il redéploie simplement le build précédent.

## ÉTAPE 6 — LIVRAISON & REPORTING FINAL

> Le reporting final doit fournir une **description complète de l'exécution**
> de chaque étape, permettant de comprendre exactement ce qui a été fait,
> pourquoi, et avec quel résultat.

Structure de réponse finale :

### 1. Résumé exécutif
- **Problème traité** : description concise du problème (issue GitHub #N
  ou description libre de l'utilisateur)
- **Cause racine** : explication technique de la cause identifiée
- **Solution appliquée** : résumé de l'approche choisie et pourquoi

### 2. Fichiers modifiés
- Chemin complet depuis la racine du monorepo
- Diff ou code complet (nouveau fichier uniquement)
- Justification de chaque modification

### 3. Fichiers de test
- Chemin complet + code complet
- Couverture des cas : nominal, erreur, edge cases

### 4. Résultat de la validation locale (étape 4)
| Étape | Résultat | Détail |
|---|---|---|
| Lint | ✅ / ❌ | corrections effectuées le cas échéant |
| Type-check | ✅ / ❌ | |
| Tests | ✅ / ❌ | couverture : X% |
| Build | ✅ / ❌ | |

### 5. Tableau de bord d'intégration

> Ce tableau fournit une vue synthétique du parcours complet des
> modifications, de la branche de travail jusqu'à la production.

```
┌──────────────────────────────────────────────────────────────────┐
│              TABLEAU DE BORD D'INTÉGRATION                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📋 Issue         : #<N> — <titre>                                │
│  🔀 Branche       : fix/<scope>-<description>                    │
│  📝 PR            : #<PR_N> — <titre PR>                         │
│  🔗 URL PR        : https://github.com/<repo>/pull/<PR_N>        │
│                                                                   │
├──────────────┬───────────┬────────────────────────────────────────┤
│ Étape        │ Statut    │ Détail                                 │
├──────────────┼───────────┼────────────────────────────────────────┤
│ Dépendances  │ ✅ / ❌   │ pnpm install                           │
│ Prisma       │ ✅ / ⬜   │ db:generate + migration (si applicable)│
│ Lint         │ ✅ / ❌   │                                        │
│ Type-check   │ ✅ / ❌   │                                        │
│ Tests        │ ✅ / ❌   │ couverture : X%                        │
│ Build        │ ✅ / ❌   │                                        │
│ Push branche │ ✅ / ❌   │ SHA : <sha>                            │
│ PR créée     │ ✅ / ❌   │ #<PR_N>                                │
│ CI PR        │ ✅ / ❌   │ tous les checks verts                  │
│ Merge → main │ ✅ / ❌   │ squash merge                           │
│ CI main      │ ✅ / ❌   │ tous les checks verts                  │
│ Deploy Vercel│ ✅ / ❌   │ production — <url>                     │
│ Runtime OK   │ ✅ / ❌   │ logs Serverless vérifiés               │
│ CLAUDE.md    │ ✅ / ⬜   │ mis à jour (si applicable)             │
├──────────────┴───────────┴────────────────────────────────────────┤
│ ⬜ = non applicable                                               │
└──────────────────────────────────────────────────────────────────┘
```

### 6. Pull Request & Merge
- **PR** : #`<PR_N>` — `<titre>`
- **URL** : `https://github.com/<repo>/pull/<PR_N>`
- **Branche source** : `fix/<scope>-<description>`
- **Branche cible** : `main`
- **Méthode de merge** : squash
- **Merge commit SHA** : `<sha>`
- **Horodatage du merge** : `<date>`

### 7. Résultat de la CI distante (étape 5.1)
| Job | Résultat | Détail |
|---|---|---|
| `lint` | ✅ / ❌ | |
| `type-check` | ✅ / ❌ | |
| `test` | ✅ / ❌ | |
| `build` | ✅ / ❌ | |
| `e2e` | ✅ / ❌ | (si applicable) |
| `security` | ✅ / ❌ | |

### 8. Résultat du déploiement production Vercel (étape 5.2)
- Build Vercel : ✅ / ❌
- URL de production : `<url>`
- Runtime vérifié : ✅ / ❌
- Logs Serverless : aucune erreur / détail des erreurs

### 9. Vérification base de données (si le fix touche Prisma / les données)
- [ ] Schéma Prisma modifié → migration créée et commitée
- [ ] Via MCP Supabase : schéma cohérent après `prisma migrate deploy`
- [ ] Via MCP Supabase : requête SQL de validation sur les données impactées
- [ ] Politiques RLS toujours fonctionnelles après la modification
- [ ] Isolation multi-tenant (`siteId`) vérifiée sur tout nouveau modèle

### 10. Checklist de validation finale
- [ ] Dépendances vérifiées (`pnpm install --frozen-lockfile`)
- [ ] Prisma : `db:generate` + migration (si schéma modifié)
- [ ] Validation locale complète (lint + type-check + test + build)
- [ ] Branche poussée + PR créée
- [ ] CI sur la PR : tous les checks passent
- [ ] PR mergée dans `main` (squash)
- [ ] CI sur `main` : tous les checks passent
- [ ] Déploiement production Vercel : build réussi + runtime fonctionnel
- [ ] Isolation multi-tenant vérifiée sur chaque requête DB modifiée
- [ ] Aucune donnée sensible exposée côté client
- [ ] Consommateurs des packages partagés modifiés non régressés
- [ ] CLAUDE.md mis à jour (si applicable)
- [ ] Nouvelles variables d'environnement documentées dans `.env.example`
  et ajoutées dans les settings Vercel (Production / Preview / Development)

### 11. Chronologie d'exécution
Résumé chronologique des actions effectuées :
1. Investigation : fichiers lus, dépendances analysées
2. Analyse : cause racine identifiée, approche choisie
3. Dépendances : `pnpm install` vérifié, Prisma régénéré (si applicable)
4. Implémentation : modifications effectuées, tests écrits
5. CLAUDE.md : vérifié et mis à jour (si applicable)
6. Validation locale : résultats de chaque étape du pipeline
7. Push branche + création PR : branche poussée, PR créée et liée à l'issue
8. CI PR : checks vérifiés, merge effectué
9. CI main + déploiement : résultats de la CI et du déploiement production
