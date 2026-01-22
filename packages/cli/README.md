# @kairn/cli

CLI pour la gestion de la plateforme Kairn.

## Installation

```bash
# Dans le monorepo
pnpm --filter @kairn/cli build

# Installation globale (optionnel)
npm link packages/cli
```

## Commandes

### Gestion des sites

```bash
# Créer un nouveau site
kairn init <site-name>
kairn init mon-site --template psychologist

# Options
--template, -t   Template à utiliser (psychologist, holistic, medical, minimal)
--force, -f      Écraser un site existant
```

### Développement

```bash
# Lancer le serveur de développement
kairn dev                         # Affiche les sites disponibles
kairn dev --site <name>           # Lance un site spécifique
kairn dev --turbo                 # Lance tous les sites avec Turbo
kairn dev --site mon-site -p 3001 # Port personnalisé
```

### Build

```bash
# Build pour production
kairn build                       # Build tous les sites avec Turbo
kairn build --site <name>         # Build un site spécifique
```

### Base de données

```bash
# Migrations
kairn db migrate                  # Migration interactive (dev)
kairn db migrate --name <name>    # Migration nommée
kairn db migrate --deploy         # Déployer en production

# Autres commandes
kairn db push                     # Push schema sans migration (dev)
kairn db seed                     # Seed la base de données
kairn db seed --reset             # Reset + seed
kairn db generate                 # Générer le client Prisma
kairn db studio                   # Ouvrir Prisma Studio
```

### Génération de code

```bash
# Pages
kairn generate page <name>                    # Génère une page
kairn generate page tarifs --site mon-site    # Site spécifique
kairn generate page about --route a-propos    # Route personnalisée

# Composants
kairn generate component <name>               # Server component
kairn generate component Button --type client # Client component
kairn generate component Card --site mon-site
```

### Configuration

```bash
# Créer une configuration (legacy)
kairn config create
kairn config create -o output.json -t holistic

# Valider une configuration
kairn config validate config.json

# Exporter
kairn config export config.json              # JSON
kairn config export config.json -f env       # .env
kairn config export config.json -f ts        # TypeScript
```

### Références

```bash
# Lister les templates disponibles
kairn templates

# Lister les palettes de couleurs
kairn palettes
```

## Exemples

### Workflow complet pour un nouveau site

```bash
# 1. Créer le site
kairn init cabinet-martin

# 2. Configurer l'environnement
cd apps/cabinet-martin
cp .env.local.example .env.local
# Éditer .env.local avec vos credentials

# 3. Personnaliser
# Éditer config/site.config.ts

# 4. Lancer en développement
kairn dev --site cabinet-martin

# 5. Ajouter des pages
kairn generate page tarifs --site cabinet-martin
kairn generate page contact --site cabinet-martin

# 6. Build pour production
kairn build --site cabinet-martin
```

### Gestion de la base de données

```bash
# Développement : itérer sur le schéma
kairn db push              # Rapide, sans migration
kairn db seed              # Données de test

# Production : migrations
kairn db migrate --name add-new-feature
kairn db migrate --deploy
```

## Configuration

Le CLI recherche automatiquement la racine du projet Kairn (fichier `package.json` avec `"name": "kairn"`).

### Variables d'environnement

Le CLI utilise les variables d'environnement définies dans :
- `.env` à la racine du projet
- `.env.local` dans le dossier du site

## Développement du CLI

```bash
cd packages/cli

# Développement
pnpm dev -- templates     # Tester une commande

# Build
pnpm build

# Type check
pnpm type-check
```

## API

Le CLI est construit avec :
- [Commander](https://github.com/tj/commander.js) - Parsing des commandes
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) - Prompts interactifs
- [Ora](https://github.com/sindresorhus/ora) - Spinners
- [Chalk](https://github.com/chalk/chalk) - Couleurs terminal

## Licence

MIT
