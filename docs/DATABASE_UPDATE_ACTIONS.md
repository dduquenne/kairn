# Plan d'actions pour la mise à jour de la base de données

> Analyse effectuée le 26/02/2026 — basée sur les modifications récentes du schema Prisma et du code applicatif.

---

## Résumé exécutif

L'analyse du code révèle **5 catégories d'actions** nécessaires pour mettre la base de données en cohérence avec le projet :

1. **Création du système de migrations** (aucune migration n'existe actuellement)
2. **Corrections critiques** de divergences schema/code sur `SocialAccount`
3. **Ajout de modèles manquants** (`SocialTemplate`, `SocialGenerationLog`)
4. **Application des modifications récentes** (nouveaux champs `SocialPost`, `ChatConversation.siteId`)
5. **Nettoyage du code legacy** (anciennes tables analytics non migrées)

---

## 1. CRITIQUE — Initialiser le système de migrations Prisma

**Constat** : Le répertoire `packages/db/prisma/migrations/` n'existe pas. Aucune migration n'a jamais été créée formellement.

**Action** :
```bash
cd packages/db
npx prisma migrate dev --name init
```

**Risque** : Si la base de données de production existe déjà avec un schéma différent, il faudra d'abord faire un `prisma migrate diff` ou utiliser `prisma db pull` pour capturer l'état actuel avant de créer la baseline.

**Recommandation** :
```bash
# Si la base existe déjà en production :
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url $DATABASE_URL --script > diff.sql
# Puis créer une migration baseline :
npx prisma migrate resolve --applied "0001_init"
```

---

## 2. CRITIQUE — Divergences `SocialAccount` entre schema et code

Le modèle `SocialAccount` dans le schema Prisma ne correspond pas aux champs utilisés dans le code applicatif (`apps/psypnos/lib/social/store.ts`).

### Champs divergents

| Champ dans le code | Champ dans le schema | Action requise |
|---|---|---|
| `accountId` | `platformId` | Renommer `platformId` → `accountId` dans le schema |
| `tokenExpiry` (DateTime?) | `tokenExpiresAt` (DateTime?) | Renommer `tokenExpiresAt` → `tokenExpiry` dans le schema |
| `scope` (String[]) | *(absent)* | Ajouter `scope String[]` au schema |
| `lastUsed` (DateTime?) | *(absent)* | Ajouter `lastUsed DateTime?` au schema |
| *(non utilisé)* | `profileImage` (String?) | Conserver ou supprimer selon besoin |
| `@@unique([platform, accountId])` | `@@unique([platform, platformId])` | Aligner avec le renommage |

### Fichiers impactés
- `apps/psypnos/lib/social/store.ts` (lignes 50-174) — CRUD comptes sociaux
- `apps/psypnos/lib/social/types.ts` — Types TypeScript `SocialAccountPublic`, `CreateSocialAccountInput`
- `packages/social/src/posting/scheduler.ts` — Publication programmée

### Migration SQL estimée
```sql
ALTER TABLE "SocialAccount" RENAME COLUMN "platformId" TO "accountId";
ALTER TABLE "SocialAccount" RENAME COLUMN "tokenExpiresAt" TO "tokenExpiry";
ALTER TABLE "SocialAccount" ADD COLUMN "scope" TEXT[] DEFAULT '{}';
ALTER TABLE "SocialAccount" ADD COLUMN "lastUsed" TIMESTAMP;
```

---

## 3. CRITIQUE — Modèles manquants dans le schema

### 3.1 `SocialTemplate` (manquant)

**Utilisé dans** : `apps/psypnos/lib/social/store.ts` (lignes 538-659)

Le code effectue des opérations CRUD complètes (`findMany`, `findFirst`, `findUnique`, `create`, `update`, `updateMany`, `delete`) sur ce modèle.

**Modèle à ajouter** :
```prisma
model SocialTemplate {
  id              String         @id @default(cuid())
  name            String
  platform        SocialPlatform
  description     String?
  promptTemplate  String         @db.Text
  defaultTone     String?
  defaultHashtags String[]       @default([])
  isDefault       Boolean        @default(false)
  usageCount      Int            @default(0)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([platform])
}
```

### 3.2 `SocialGenerationLog` (manquant)

**Utilisé dans** :
- `apps/psypnos/lib/social/store.ts` (lignes 668-723)
- `apps/psypnos/app/api/cron/cleanup-jobs/route.ts` (ligne 88)

**Modèle à ajouter** :
```prisma
model SocialGenerationLog {
  id               String         @id @default(cuid())
  blogSlug         String
  platform         SocialPlatform
  inputContent     String         @db.Text
  promptUsed       String         @db.Text
  generatedContent String         @db.Text
  tokensUsed       Int?
  wasAccepted      Boolean        @default(false)
  wasModified      Boolean        @default(false)
  createdAt        DateTime       @default(now())

  @@index([blogSlug])
  @@index([createdAt])
}
```

---

## 4. IMPORTANT — Enum `SocialPostStatus` incomplet

**Constat** : Le code utilise le statut `CANCELLED` (dans `store.ts:466-478`) mais l'enum `SocialPostStatus` ne contient que : `DRAFT`, `SCHEDULED`, `PUBLISHING`, `PUBLISHED`, `FAILED`.

**Action** : Ajouter `CANCELLED` à l'enum.

```prisma
enum SocialPostStatus {
  DRAFT
  SCHEDULED
  PUBLISHING
  PUBLISHED
  FAILED
  CANCELLED   // <-- à ajouter
}
```

**Migration** :
```sql
ALTER TYPE "SocialPostStatus" ADD VALUE 'CANCELLED';
```

---

## 5. IMPORTANT — Modifications récentes à appliquer

Ces changements ont été intégrés dans le schema Prisma (git diff) mais la migration n'a pas été créée/appliquée.

### 5.1 `SocialPost` — Nouveaux champs

Champs ajoutés récemment dans le schema (PR #138) :

| Champ | Type | Description |
|---|---|---|
| `hashtags` | `Json?` | Hashtags en tableau JSON |
| `linkUrl` | `String?` | URL de lien inclus dans le post |
| `platformUrl` | `String?` | Lien direct vers le post publié (remplace `externalUrl`) |
| `generatedBy` | `String?` | Source de génération ('ai' ou 'manual') |
| `aiPrompt` | `String? @db.Text` | Prompt IA utilisé |
| `aiModel` | `String?` | Modèle IA utilisé |
| `metadata` | `Json?` | Métadonnées spécifiques par plateforme |

**Migration** :
```sql
ALTER TABLE "SocialPost" ADD COLUMN "hashtags" JSONB;
ALTER TABLE "SocialPost" ADD COLUMN "linkUrl" TEXT;
ALTER TABLE "SocialPost" RENAME COLUMN "externalUrl" TO "platformUrl";
ALTER TABLE "SocialPost" ADD COLUMN "generatedBy" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN "aiPrompt" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN "aiModel" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN "metadata" JSONB;
```

### 5.2 `ChatConversation` — Ajout multi-tenant (`siteId`)

Le champ `siteId` a été ajouté au modèle `ChatConversation` pour l'isolation multi-tenant (PR #138).

**Action** :
1. Ajouter la colonne `siteId` (NOT NULL avec une valeur par défaut temporaire)
2. Backfiller les conversations existantes avec le `siteId` correct
3. Ajouter la contrainte de clé étrangère
4. Ajouter l'index

**Migration** :
```sql
-- Étape 1 : Ajouter la colonne nullable d'abord
ALTER TABLE "ChatConversation" ADD COLUMN "siteId" TEXT;

-- Étape 2 : Backfill avec le site par défaut
UPDATE "ChatConversation" SET "siteId" = (SELECT id FROM "Site" WHERE slug = 'psypnos' LIMIT 1);

-- Étape 3 : Rendre NOT NULL
ALTER TABLE "ChatConversation" ALTER COLUMN "siteId" SET NOT NULL;

-- Étape 4 : Ajouter la FK et l'index
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE;
CREATE INDEX "ChatConversation_siteId_idx" ON "ChatConversation"("siteId");
```

---

## 6. NETTOYAGE — Code legacy avec modèles inexistants

Plusieurs fichiers référencent des modèles Prisma qui **n'existent pas** dans le schema actuel. Ces fichiers sont marqués `@ts-nocheck` et sont des vestiges d'un ancien système analytics.

### Modèles référencés mais absents du schema

| Modèle inexistant | Fichiers qui l'utilisent |
|---|---|
| `PageVisit` | `analytics/purge/route.ts`, `analytics/aggregation.ts` |
| `SectionTime` | `analytics/purge/route.ts` |
| `ConversionEvent` | `analytics/purge/route.ts`, `analytics/aggregation.ts` |
| `CustomEvent` | `analytics/purge/route.ts` |
| `GoalCompletion` | `analytics/purge/route.ts` |
| `FunnelStep` | `analytics/purge/route.ts` |
| `AlertHistory` | `analytics/purge/route.ts` |
| `Anomaly` | `analytics/purge/route.ts` |
| `DailySummary` | `analytics/purge/route.ts`, `analytics/aggregation.ts` |
| `TrafficSourceSummary` | `analytics/purge/route.ts`, `analytics/aggregation.ts` |
| `SectionSummary` | `analytics/purge/route.ts` |

### Actions possibles

**Option A (recommandée)** : Réécrire ces fichiers pour utiliser le modèle unifié `AnalyticsEvent` + `AnalyticsDailySummary` qui existent dans le schema actuel.

**Option B** : Supprimer ces fichiers s'ils ne sont plus utilisés (l'analytics a été refondu via le store-postgres).

### Fichiers concernés
- `apps/psypnos/app/api/analytics/purge/route.ts` — Route de purge à réécrire
- `apps/psypnos/lib/analytics/aggregation.ts` — Agrégation à réécrire

---

## 7. MINEUR — Fichiers `@ts-nocheck` à auditer

27+ fichiers contiennent `@ts-nocheck` avec des commentaires `TODO: Migration`. La plupart sont des problèmes de types TypeScript (non liés à la DB), mais certains masquent des accès Prisma invalides :

| Fichier | Problème DB |
|---|---|
| `app/api/cron/cleanup-jobs/route.ts` | Utilise `prisma.socialGenerationLog` (modèle manquant) |
| `app/api/cron/fetch-social-analytics/route.ts` | Utilise des champs SocialPost potentiellement manquants |
| `app/api/analytics/purge/route.ts` | 11 modèles Prisma inexistants |
| `lib/analytics/aggregation.ts` | 4 modèles Prisma inexistants |
| `lib/social/store.ts` | Utilise `prisma.socialTemplate` et `prisma.socialGenerationLog` (manquants) |

---

## 8. IMPORTANT — Fichier `schema.sql` obsolète

**Constat** : Le fichier `packages/db/schema.sql` est un export SQL statique qui n'est **plus synchronisé** avec le schema Prisma.

### Divergences identifiées
- L'enum `EventType` dans le SQL ne contient que : `PAGE_VIEW, CLICK, FORM_SUBMIT, DOWNLOAD, CUSTOM`
- Le schema Prisma contient en plus : `PAGE_EXIT, SCROLL_DEPTH, SECTION_VIEW, SECTION_TIME, CONVERSION, FUNNEL_STEP, SESSION_START, SESSION_END`
- Plusieurs modèles récents (SocialPost amélioré, ChatConversation avec siteId, etc.) ne sont pas reflétés

**Action** : Régénérer le fichier SQL depuis le schema Prisma ou le supprimer s'il n'est pas utilisé en production.

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql
```

---

## 9. MINEUR — Champ `metaTitle` absent du schema `BlogPost`

**Constat** : Le code API (`packages/api/src/handlers/blog/types.ts:30`) et le formulaire admin (`packages/admin/src/components/blog/BlogPostForm.tsx`) référencent un champ `metaTitle` qui n'existe pas dans le modèle `BlogPost` du schema Prisma. Seul `metaDescription` est présent.

**Action** : Ajouter `metaTitle` au modèle `BlogPost` dans le schema.

```prisma
model BlogPost {
  // ... champs existants ...
  metaTitle       String?   /// SEO meta title
  metaDescription String?   /// SEO meta description
}
```

---

## 10. MINEUR — Modèles définis dans le schema mais non utilisés

Ces modèles existent dans le schema mais n'ont **aucune implémentation fonctionnelle** côté API :

| Modèle | Statut | Recommandation |
|---|---|---|
| `Appointment` | Schema OK, mais la route `/api/appointment-request` n'enregistre pas en DB (envoie uniquement un email) | Implémenter la persistance ou documenter le choix |
| `PushSubscription` | Schema OK, aucun code CRUD trouvé | Implémenter ou supprimer du schema |
| `PushNotificationLog` | Schema OK, aucun code CRUD trouvé | Implémenter ou supprimer du schema |

---

## 11. MINEUR — Duplication `BlogPost` / `BlogPostExtended`

Le schema contient deux modèles de blog avec des champs qui se chevauchent. `BlogPost` a été enrichi avec des champs SEO/IA initialement propres à `BlogPostExtended` (`imagePrompt`, `seoIntent`, `persona`, `tones`, `faq`, `jsonLd`).

**Recommandation** : Vérifier que la migration des données de `BlogPostExtended` vers `BlogPost` est terminée (script existant : `scripts/migrate-blogpostextended-to-blogpost.ts`), puis supprimer le modèle `BlogPostExtended` du schema.

---

## Plan d'exécution recommandé

### Phase 1 — Pré-requis (avant toute migration)
1. Faire un backup complet de la base de données
2. Vérifier l'état actuel de la DB vs le schema avec `prisma db pull`

### Phase 2 — Migration structurelle (une seule migration)
1. Corriger les champs `SocialAccount` (renommages + ajouts)
2. Ajouter `CANCELLED` à l'enum `SocialPostStatus`
3. Ajouter les modèles `SocialTemplate` et `SocialGenerationLog`
4. Appliquer les nouveaux champs `SocialPost` (déjà dans le schema)
5. Appliquer `ChatConversation.siteId` avec backfill

```bash
npx prisma migrate dev --name "align-schema-with-code"
```

### Phase 3 — Backfill des données
1. Backfiller `ChatConversation.siteId` pour les conversations existantes
2. Vérifier les données `SocialPost` existantes (champs `platformUrl` vs ancien `externalUrl`)

### Phase 4 — Nettoyage du code
1. Réécrire ou supprimer `analytics/purge/route.ts`
2. Réécrire ou supprimer `analytics/aggregation.ts`
3. Retirer les `@ts-nocheck` des fichiers corrigés
4. Régénérer le client Prisma : `npx prisma generate`

### Phase 5 — Validation
1. Lancer `npx prisma validate` pour vérifier le schema
2. Lancer le build : `pnpm build`
3. Lancer les tests : `pnpm test`
4. Vérifier les routes API social et chatbot en staging

---

## Annexe — Commandes utiles

```bash
# Valider le schema
npx prisma validate

# Vérifier les différences schema <-> DB
npx prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel prisma/schema.prisma

# Appliquer le schema sans migration (dev only)
npx prisma db push

# Créer une migration
npx prisma migrate dev --name "description"

# Déployer en production
npx prisma migrate deploy

# Régénérer le client
npx prisma generate

# Ouvrir Prisma Studio pour inspecter les données
npx prisma studio
```
