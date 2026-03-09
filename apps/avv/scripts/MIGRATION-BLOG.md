# Migration des Articles Blog AVV → KAIRN

## Prérequis

1. **Accès à la base AVV** (source)
   - URL de la base de données PostgreSQL Supabase
   - Disponible dans le dashboard Supabase: https://supabase.com/dashboard/project/ukbbkoadbgifnxbcuxbr/settings/database

2. **Accès à la base KAIRN** (destination)
   - Déjà configuré via `DATABASE_URL` dans l'environnement

3. **Supabase Storage KAIRN** (pour les images)
   - `SUPABASE_URL` et `SUPABASE_SERVICE_KEY` configurés

## Scripts Disponibles

### 1. `migrate-blog-standalone.ts` (Recommandé)

Script autonome utilisant uniquement `pg` (pas de dépendance Prisma).

```bash
# Configuration
export AVV_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ukbbkoadbgifnxbcuxbr.supabase.co:5432/postgres"

# Exécution
tsx apps/avv/scripts/migrate-blog-standalone.ts
```

### 2. `migrate-blog-from-avv.ts`

Version avec Prisma (nécessite que le client Prisma soit généré).

```bash
# Configuration
export AVV_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ukbbkoadbgifnxbcuxbr.supabase.co:5432/postgres"
# OU via Supabase API
export AVV_SUPABASE_SERVICE_KEY="eyJ..."

# Exécution
tsx apps/avv/scripts/migrate-blog-from-avv.ts
```

### 3. `migrate-blog-from-json.ts`

Alternative utilisant un fichier JSON exporté depuis Supabase.

```bash
# Étape 1: Exporter les données depuis AVV Supabase
# Dashboard > Table Editor > BlogPostExtended > Export as JSON
# Sauvegarder dans: apps/avv/data/avv-blog-export.json

# Étape 2: Exécuter
tsx apps/avv/scripts/migrate-blog-from-json.ts
```

## Obtenir le mot de passe AVV

1. Accéder à https://supabase.com/dashboard/project/ukbbkoadbgifnxbcuxbr
2. Aller dans **Settings** > **Database**
3. Copier la **Connection string** (URI)
4. Le mot de passe est masqué - utiliser "Reveal" ou le réinitialiser si nécessaire

## Ce que fait la migration

1. **Analyse préalable**
   - Liste tous les articles de AVV
   - Identifie les articles avec images
   - Vérifie les doublons dans KAIRN (par slug)

2. **Migration des images**
   - Télécharge depuis AVV Supabase Storage
   - Convertit en WebP (qualité 90%)
   - Upload vers KAIRN Supabase Storage (bucket `blog-images`)
   - Convention: `{slug}.webp`

3. **Migration des articles**
   - Crée un nouvel ID (CUID) pour chaque article
   - Préserve toutes les données (slug, title, content, faq, jsonLd, etc.)
   - Met à jour l'URL de l'image si migrée
   - Préserve les dates originales (date, createdAt)
   - Met à jour `updatedAt` à maintenant

4. **Vérifications**
   - Compare le nombre d'articles source/destination
   - Vérifie l'accessibilité des images migrées
   - Signale les URLs AVV hardcodées dans le contenu

## Rapport de Migration

Le script génère un rapport incluant:

- Nombre total d'articles source
- Nombre d'articles migrés
- Nombre d'articles ignorés (doublons)
- Nombre d'images transférées/échouées
- Liste des erreurs
- URLs AVV hardcodées à corriger manuellement

## Points d'Attention

- **Non destructif**: Les données source ne sont pas modifiées
- **Idempotent**: Peut être exécuté plusieurs fois (ignore les doublons par slug)
- **URLs hardcodées**: Cherche les URLs contenant "avv" ou "ukbbkoadbgifnxbcuxbr" dans le contenu
- **UTF-8**: Vérifie l'encodage des caractères français

## Troubleshooting

### Erreur de connexion PostgreSQL

```
Error: connect ECONNREFUSED
```

Vérifier que l'URL de connexion est correcte et que l'IP est autorisée dans Supabase.

### Erreur d'upload d'image

```
Upload error: Bucket not found
```

Créer le bucket `blog-images` dans Supabase Storage KAIRN avec accès public.

### Erreur de module

```
Cannot find module 'pg'
```

Exécuter `pnpm install` à la racine du projet.
