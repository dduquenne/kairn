# Kairn

Plateforme mutualisée pour sites de praticiens du bien-être.

Kairn permet de créer et gérer facilement des sites web professionnels pour psychologues, thérapeutes, praticiens holistiques et autres professionnels de la santé et du bien-être.

## Fonctionnalités

- **Multi-sites** - Gérez plusieurs sites depuis un seul monorepo
- **Blog intégré** - Système de blog avec génération IA et SEO optimisé
- **Admin complet** - Dashboard d'administration avec analytics
- **Réseaux sociaux** - Publication automatisée sur plusieurs plateformes
- **Témoignages** - Gestion et affichage des avis clients
- **Formulaires** - Contact, rendez-vous, inscriptions aux séminaires
- **Thèmes personnalisables** - Templates et palettes de couleurs configurables

## Architecture

```
kairn/
├── apps/                       # Sites individuels
│   ├── psypnos/               # Site psypnos.fr
│   └── unanima/               # Site unanima.fr
│
├── packages/                   # Packages partagés
│   ├── @kairn/config          # Types et schémas de configuration
│   ├── @kairn/core            # Utilitaires, auth, rate limiting
│   ├── @kairn/db              # Schéma Prisma et client database
│   ├── @kairn/ui              # Composants React réutilisables
│   ├── @kairn/admin           # Composants admin dashboard
│   ├── @kairn/api             # Handlers API réutilisables
│   ├── @kairn/ai              # Services IA (génération contenu)
│   ├── @kairn/analytics       # Module analytics
│   ├── @kairn/blog            # Module blog
│   ├── @kairn/social          # Module réseaux sociaux
│   └── @kairn/cli             # CLI de gestion
│
└── tooling/                    # Configuration partagée
    ├── typescript-config      # Configurations TypeScript
    ├── tailwind-preset        # Design tokens Tailwind
    └── eslint-config          # Configuration ESLint
```

## Prérequis

- Node.js >= 22
- pnpm >= 10
- PostgreSQL (pour la base de données)

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/your-org/kairn.git
cd kairn

# Installer les dépendances
pnpm install

# Générer le client Prisma
pnpm --filter @kairn/db db:generate
```

## CLI Kairn

Le CLI `@kairn/cli` facilite la gestion de la plateforme.

### Commandes principales

```bash
# Créer un nouveau site
kairn init <site-name>

# Lancer le serveur de développement
kairn dev --site <name>          # Un site spécifique
kairn dev --turbo                # Tous les sites

# Build pour production
kairn build                      # Tous les sites
kairn build --site <name>        # Un site spécifique

# Base de données
kairn db migrate --name <name>   # Créer une migration
kairn db migrate --deploy        # Déployer les migrations
kairn db push                    # Push schema (dev)
kairn db seed                    # Seed la base
kairn db studio                  # Ouvrir Prisma Studio

# Générer du code
kairn generate page <name>       # Nouvelle page
kairn generate component <name>  # Nouveau composant

# Utilitaires
kairn templates                  # Lister les templates
kairn palettes                   # Lister les palettes de couleurs
kairn config validate <file>     # Valider une configuration
```

## Développement

```bash
# Développement (tous les packages)
pnpm dev

# Build
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint

# Tests
pnpm test
```

## Créer un nouveau site

1. **Initialiser le site**
   ```bash
   kairn init mon-site
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cd apps/mon-site
   cp .env.local.example .env.local
   # Éditer .env.local avec vos credentials
   ```

3. **Personnaliser la configuration**
   ```bash
   # Éditer apps/mon-site/config/site.config.ts
   ```

4. **Lancer en développement**
   ```bash
   kairn dev --site mon-site
   ```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Structure du projet et flux de données
- [Guide de démarrage](docs/GETTING_STARTED.md) - Installation et premier site
- [Personnalisation](docs/CUSTOMIZATION.md) - Thèmes, composants et extensions

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Style** : Tailwind CSS
- **Database** : PostgreSQL + Prisma ORM
- **Monorepo** : Turborepo + pnpm workspaces
- **Auth** : JWT avec rotation de tokens
- **Email** : Resend
- **Storage** : Supabase
- **AI** : Claude (Anthropic) / OpenAI

## Licence

MIT

---

*Kairn : Du cairn qui guide le chemin.*
