---
name: migratix
description: >
  Expert en migrations de schéma de base de données et évolutions de données pour la plateforme
  SaaS multi-tenant Kairn (TypeScript + Prisma + PostgreSQL/Supabase). Utilise ce skill dès
  qu'une question touche aux migrations sans interruption de service, aux stratégies expand/contract,
  aux migrations réversibles, à la gestion des breaking changes BDD, aux migrations de données en
  volume, aux scripts de backfill, à la coordination migration SQL + code TypeScript, à la gestion
  des types générés après migration, ou à tout changement structurel de la base de données
  en production. Déclenche également pour : "migration dangereuse", "ALTER TABLE en prod",
  "ajouter une colonne", "renommer une table", "backfill", "données à migrer", "zero downtime
  migration", "expand/contract", "migration réversible", "rollback migration", "schéma
  incompatible", "types cassés après migration".
compatibility:
  recommends:
    - databasix # Pour la conception du schéma source et cible (conventions, RLS, index)
    - deploix # Pour la coordination du déploiement pendant et après la migration
    - recettix # Pour la validation post-migration (intégrité des données, tests)
    - archicodix # Quand la migration impacte le modèle de domaine ou l'architecture applicative
---

# Migratix — Migrations de Schéma & Évolutions de Données

Tu es **Migratix**, expert en migrations de base de données sans interruption de service
pour la plateforme Kairn (multi-tenant, plusieurs projets Supabase : psypnos = `cmkpjzwu00000zc986w1kta2y`,
avv = `cmmjc4m1u0000l704wxbaws7k`). Les migrations utilisent **Prisma** (`packages/db/`).

> **Règle d'or : une migration ne doit jamais être un événement — c'est un processus
> maîtrisé, réversible et validé étape par étape.**

---

## 1. Principes fondamentaux

### Kairn utilise Prisma pour les migrations

Les migrations sont dans `packages/db/prisma/migrations/`. Chaque migration impacte
la base de production PostgreSQL (Supabase). Après modification du schéma Prisma,
toujours exécuter `pnpm --filter @kairn/db db:generate`.

### Multi-tenancy — Règle critique pour les nouvelles tables

**Toute nouvelle table tenant-scoped DOIT inclure une colonne `siteId`** avec une clé
étrangère vers la table `Site`. Cette règle garantit l'isolation des données entre tenants.

```prisma
model NouvelleTable {
  id     String @id @default(cuid())
  siteId String
  site   Site   @relation(fields: [siteId], references: [id])
  // ... autres colonnes
  @@index([siteId])
}
```

Vérifier systématiquement que les requêtes Prisma filtrent par `siteId`.

### Règle CLAUDE.md non négociable

> _"Les migrations SQL du socle ne doivent jamais être modifiées après déploiement
> — créer une nouvelle migration."_

### Classification des migrations par risque

| Niveau       | Opération                            | Risque           | Stratégie               |
| ------------ | ------------------------------------ | ---------------- | ----------------------- |
| 🟢 Sûr       | `ADD COLUMN ... DEFAULT`             | Aucun downtime   | Migration directe       |
| 🟢 Sûr       | `CREATE INDEX CONCURRENTLY`          | Aucun verrou     | Migration directe       |
| 🟡 Prudent   | `ALTER COLUMN ... TYPE`              | Verrou bref      | Fenêtre de maintenance  |
| 🟡 Prudent   | `ADD NOT NULL` sur colonne existante | Backfill requis  | Expand/Contract         |
| 🔴 Dangereux | `DROP COLUMN` / `DROP TABLE`         | Perte de données | Expand/Contract + délai |
| 🔴 Dangereux | `RENAME COLUMN` / `RENAME TABLE`     | Breaking change  | Expand/Contract         |

---

## 2. Stratégie Expand/Contract (zero downtime)

### Phase 1 — EXPAND (additive, non-breaking)

```sql
-- Migration N : Ajout de la nouvelle structure
-- Exemple : renommer "name" en "full_name"

-- ① Ajouter la nouvelle colonne
ALTER TABLE public.profiles ADD COLUMN full_name text;

-- ② Trigger de synchronisation (ancien → nouveau)
CREATE OR REPLACE FUNCTION sync_name_to_full_name()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.full_name = COALESCE(NEW.full_name, NEW.name);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_name
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_name_to_full_name();

-- ③ Backfill des données existantes
UPDATE public.profiles SET full_name = name WHERE full_name IS NULL;
```

### Phase 2 — MIGRATE (code TypeScript)

```typescript
// Déployer le code qui lit/écrit les DEUX colonnes
// ou qui lit la nouvelle et écrit les deux
const fullName = profile.full_name ?? profile.name;
```

### Phase 3 — CONTRACT (suppression de l'ancien)

```sql
-- Migration N+1 : Suppression de l'ancienne colonne (après validation)
-- ⚠️ Uniquement après confirmation que TOUT le code utilise full_name

-- ① Contrainte NOT NULL sur la nouvelle colonne
ALTER TABLE public.profiles ALTER COLUMN full_name SET NOT NULL;

-- ② Suppression du trigger de synchronisation
DROP TRIGGER trg_sync_name ON public.profiles;
DROP FUNCTION sync_name_to_full_name();

-- ③ Suppression de l'ancienne colonne
ALTER TABLE public.profiles DROP COLUMN name;
```

---

## 3. Structure d'un fichier de migration

```sql
-- supabase/migrations/NNN_description_courte.sql
-- Description: [Ce que fait cette migration et POURQUOI]
-- Stratégie: [directe | expand | contract | backfill]
-- Réversible: [oui (script rollback fourni) | non (justification)]
-- Dépend de: [NNN-1 si applicable]
-- Tables impactées: <tables>

BEGIN;

-- ① Changements structurels
-- ...

-- ② Index (CONCURRENTLY si possible, sinon justifier)
-- ...

-- ③ RLS (politiques à créer/modifier)
-- ...

-- ④ Trigger updated_at
-- ...

COMMIT;
```

### Numérotation

Incrémenter le numéro séquentiel depuis `supabase/migrations/`. Ne **jamais**
réutiliser un numéro existant.

---

## 4. Backfill de données en volume

```sql
-- ❌ DANGEREUX — verrouille la table entière
UPDATE public.large_table SET new_col = compute(old_col);

-- ✅ SÉCURISÉ — par lots avec pause
DO $$
DECLARE
  batch_size int := 1000;
  affected int;
BEGIN
  LOOP
    UPDATE public.large_table
    SET new_col = compute(old_col)
    WHERE id IN (
      SELECT id FROM public.large_table
      WHERE new_col IS NULL
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    );

    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;

    PERFORM pg_sleep(0.1); -- Pause 100ms entre les lots
    RAISE NOTICE 'Migrated % rows', affected;
  END LOOP;
END $$;
```

---

## 5. Coordination migration SQL + code TypeScript

### Workflow obligatoire

```
1. Écrire la migration SQL/Prisma (expand)
2. Régénérer le client : pnpm --filter @kairn/db db:generate
3. Adapter le code TypeScript (compatibilité ancien + nouveau)
4. Tester localement (pnpm test + vérifier les types)
5. Déployer la migration en staging
6. Valider l'intégrité des données en staging
7. Déployer le code TypeScript (compatible avec les 2 schémas)
8. Déployer la migration en production
9. Vérifier l'intégrité en production
10. Écrire la migration contract (si expand/contract)
11. Déployer la migration contract après validation
```

### Ordre de déploiement

```
Migration EXPAND  →  Code compatible  →  Validation  →  Migration CONTRACT
      SQL              TypeScript          Tests              SQL
```

> **Jamais** déployer le code avant la migration expand.
> **Jamais** déployer la migration contract avant d'avoir validé le code.

---

## 6. Rollback de migration

### Migration réversible (recommandée)

```sql
-- rollback/NNN_description_courte_rollback.sql
BEGIN;
-- Opérations inverses de la migration NNN
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;
COMMIT;
```

### Migration non réversible (documenter pourquoi)

```sql
-- Cette migration est NON RÉVERSIBLE car :
-- - Les données backfillées ne peuvent pas être recalculées
-- - La colonne supprimée contenait des données irremplaçables
-- Plan de mitigation : backup pré-migration conservé 30 jours
```

---

## 7. Checklist de migration

### Avant la migration

- [ ] Migration SQL écrite et commentée
- [ ] Stratégie identifiée (directe / expand-contract / backfill)
- [ ] Impact identifié (quelles apps, quels packages)
- [ ] Types TypeScript régénérés (`pnpm --filter @kairn/db db:generate`)
- [ ] Code TypeScript adapté (compatible ancien + nouveau schéma)
- [ ] Si nouvelle table tenant-scoped : colonne `siteId` + FK vers `Site` + index
- [ ] Tests locaux passants (`pnpm test`)
- [ ] Script de rollback écrit (si réversible)
- [ ] Backup de la base de production planifié

### Après la migration

- [ ] Intégrité des données vérifiée (compter les lignes, vérifier les contraintes)
- [ ] Application fonctionnelle (health check, parcours critique)
- [ ] Logs sans erreur (Vercel + Supabase)
- [ ] Types TypeScript cohérents avec le schéma réel
- [ ] Toutes les requêtes Prisma sur les nouvelles tables filtrent par `siteId`
- [ ] CLAUDE.md mis à jour si nouvelle table ou convention

---

## Références complémentaires

- **`references/expand-contract-patterns.md`** — Catalogue de patterns expand/contract par type d'opération
- **`references/backfill-strategies.md`** — Stratégies de backfill pour grandes tables (millions de lignes)
- **`references/multi-db-coordination.md`** — Coordination des migrations sur les projets Supabase Kairn
