# Kairn

Plateforme mutualisée pour sites de praticiens.

## Structure

```
kairn/
├── apps/                    # Sites individuels
│   └── psypnos/            # Site psypnos.fr (à migrer)
├── packages/
│   ├── @kairn/config       # Types et schémas de configuration
│   ├── @kairn/core         # Database, auth, middleware
│   ├── @kairn/ui           # Composants React réutilisables
│   ├── @kairn/analytics    # Module analytics
│   ├── @kairn/blog         # Module blog et génération IA
│   ├── @kairn/social       # Module réseaux sociaux
│   └── @kairn/admin        # Dashboard admin
└── tooling/
    ├── typescript-config   # Configurations TS partagées
    ├── tailwind-preset     # Design tokens Tailwind
    └── eslint-config       # Configuration ESLint
```

## Prérequis

- Node.js >= 22
- pnpm >= 10

## Installation

```bash
pnpm install
```

## Développement

```bash
# Lancer tous les packages en mode dev
pnpm dev

# Build
pnpm build

# Type check
pnpm type-check
```

## Créer un nouveau site

1. Créer un dossier dans `apps/`
2. Configurer `site.config.ts` avec les informations du praticien
3. Configurer `theme.config.ts` pour la charte graphique
4. Importer les packages nécessaires

---

*Kairn : Du cairn qui guide le chemin.*
