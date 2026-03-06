# Rotation des clés JWT

## Vue d'ensemble

Kairn utilise un système de rotation automatique des clés de signature JWT via le `DatabaseSecretsManager` (`@kairn/core`). Les clés sont stockées dans la table `SecretKey` de PostgreSQL.

## Stratégie de rotation

| Paramètre            | Valeur            | Description                                          |
| -------------------- | ----------------- | ---------------------------------------------------- |
| Rotation automatique | Tous les 30 jours | CRON `rotate-secrets` (QStash, 2h00 quotidien)       |
| Grace period         | 7 jours           | Les anciennes clés restent valides pour vérification |
| Alerte préventive    | 25 jours          | Log warning si la clé approche de l'âge maximum      |
| Algorithme           | HS256             | HMAC-SHA256 (configurable HS384/HS512)               |
| Chiffrement au repos | Optionnel         | Via `SECRETS_ENCRYPTION_KEY` (envelope encryption)   |

## Flux de rotation

```
1. CRON rotate-secrets s'exécute quotidiennement à 2h00
   ↓
2. Vérifie l'âge de la clé courante via getKeyStats()
   ↓
3a. Clé < 25 jours → Rien à faire
3b. Clé 25-30 jours → Warning dans les logs
3c. Clé > 30 jours ou absente → Rotation
   ↓
4. rotateKey() :
   - Génère une nouvelle clé cryptographique (64 bytes)
   - Chiffre si SECRETS_ENCRYPTION_KEY est défini
   - Met l'ancienne clé en expiration (grace period = 7j)
   - Active la nouvelle clé comme clé courante
   ↓
5. Nettoyage des clés expirées (grace period dépassée)
   ↓
6. Les tokens existants signés avec l'ancienne clé
   restent valides pendant 7 jours (grace period)
```

## Procédure de rotation manuelle

### Rotation standard

```bash
# Via QStash (production)
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://votre-site.fr/api/cron/rotate-secrets

# Réponse attendue :
# {
#   "success": true,
#   "rotated": true,
#   "stats": { "currentKid": "key-xxx", "validKeyCount": 2 },
#   "actions": ["Rotated key: old key expired after 31 days. New key: key-yyy"]
# }
```

### Rotation d'urgence (compromission suspectée)

En cas de compromission d'une clé de signature :

1. **Rotation immédiate** — Forcer la rotation via l'endpoint CRON :

   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" \
     https://votre-site.fr/api/cron/rotate-secrets
   ```

2. **Invalidation des anciennes clés** — Si la clé compromise doit être invalidée immédiatement (sans grace period), exécuter directement en base :

   ```sql
   -- Invalider une clé spécifique
   UPDATE "SecretKey" SET "isValid" = false WHERE kid = 'key-compromis';

   -- Invalider TOUTES les anciennes clés (force re-login de tous les utilisateurs)
   UPDATE "SecretKey" SET "isValid" = false WHERE "isCurrent" = false;
   ```

3. **Vérification** — Consulter les statistiques :

   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" \
     https://votre-site.fr/api/cron/rotate-secrets
   ```

4. **Monitoring** — Vérifier les logs Serverless via Vercel pour s'assurer qu'aucune erreur d'authentification anormale ne persiste.

> **Impact** : L'invalidation sans grace period force la déconnexion des utilisateurs dont les tokens ont été signés avec la clé invalidée. Ils devront se reconnecter.

## Monitoring

### Statistiques des clés

Le CRON `rotate-secrets` retourne à chaque exécution :

- `currentKid` : ID de la clé courante
- `validKeyCount` : Nombre de clés valides (courante + grace period)
- `currentKeyAgeDays` : Âge de la clé courante en jours
- `maxKeyAgeDays` : Seuil de rotation (30 jours)

### Alertes

- **Warning** (logs) : Clé > 25 jours → `[Cron:rotate-secrets] Key age warning: X/30 days`
- **Rotation** (logs) : `[Cron:rotate-secrets] Rotated key: old key expired after X days`
- **Erreur** (logs) : `[Cron:rotate-secrets] Error: ...`

### Vérifier l'état via Prisma Studio

```bash
pnpm --filter @kairn/db prisma studio
# → Table SecretKey : vérifier isCurrent, isValid, activatedAt, expiresAt
```

## Configuration

### Variables d'environnement

| Variable                     | Obligatoire | Description                                            |
| ---------------------------- | ----------- | ------------------------------------------------------ |
| `CRON_SECRET`                | Oui         | Secret pour authentifier les appels CRON               |
| `SECRETS_ENCRYPTION_KEY`     | Recommandé  | Clé de chiffrement des secrets en base (hex, 32 bytes) |
| `QSTASH_TOKEN`               | Oui (prod)  | Token QStash pour les schedules                        |
| `QSTASH_CURRENT_SIGNING_KEY` | Oui (prod)  | Vérification des requêtes QStash                       |
| `QSTASH_NEXT_SIGNING_KEY`    | Oui (prod)  | Rotation des clés QStash                               |

### QStash Schedule

```bash
# Ajouter le schedule rotate-secrets
pnpm tsx scripts/setup-qstash-schedules.ts --site-url https://votre-site.fr --jobs rotate-secrets
```

## Table SecretKey (schéma Prisma)

```prisma
model SecretKey {
  kid         String    @id
  secret      String    // Clé de signature (possiblement chiffrée)
  algorithm   String    @default("HS256")
  isCurrent   Boolean   @default(false)
  isValid     Boolean   @default(true)
  activatedAt DateTime  @default(now())
  expiresAt   DateTime? // null = pas d'expiration (clé courante)
}
```
