# Guide de démarrage

Ce guide vous accompagne dans l'installation de Kairn et la création de votre premier site.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** >= 22.0.0
- **pnpm** >= 10.0.0
- **PostgreSQL** >= 14 (ou un service managé comme Supabase, Neon, etc.)
- **Git**

### Installation de pnpm

```bash
# Via npm
npm install -g pnpm

# Ou via corepack (Node.js >= 16.13)
corepack enable
corepack prepare pnpm@latest --activate
```

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/your-org/kairn.git
cd kairn
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configurer la base de données

Créez une base de données PostgreSQL et configurez la connexion.

**Option A : PostgreSQL local**

```bash
# Créer la base
createdb kairn

# URL de connexion
DATABASE_URL="postgresql://user:password@localhost:5432/kairn?schema=public"
```

**Option B : Supabase (recommandé)**

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Récupérez l'URL de connexion dans Settings > Database

### 4. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Remplissez les variables obligatoires :

```env
# Database (obligatoire)
DATABASE_URL="postgresql://..."

# Auth (obligatoire)
JWT_SECRET="votre-secret-jwt-minimum-32-caracteres"
JWT_ACCESS_SECRET="secret-pour-access-tokens"
JWT_REFRESH_SECRET="secret-pour-refresh-tokens"

# Email (pour les formulaires de contact)
RESEND_API_KEY="re_xxxxxxxxxxxx"

# Storage (pour les images)
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_ANON_KEY="votre-anon-key"
SUPABASE_SERVICE_ROLE_KEY="votre-service-role-key"
```

### 5. Initialiser la base de données

```bash
# Générer le client Prisma
pnpm --filter @kairn/db db:generate

# Appliquer le schéma
pnpm --filter @kairn/db db:push

# Seed les données initiales
pnpm --filter @kairn/db db:seed
```

### 6. Vérifier l'installation

```bash
# Build tous les packages
pnpm build

# Lancer en développement
pnpm dev
```

Ouvrez http://localhost:3000 pour voir le site par défaut.

## Créer un nouveau site

### Avec le CLI (recommandé)

```bash
# Installer le CLI globalement (optionnel)
pnpm --filter @kairn/cli build
npm link packages/cli

# Créer un nouveau site
kairn init mon-cabinet
```

Le CLI vous guidera pour :
- Choisir un nom de site
- Sélectionner un template (psychologist, holistic, medical, minimal)
- Choisir une palette de couleurs

### Manuellement

1. Copiez un site existant :
   ```bash
   cp -r apps/unanima apps/mon-cabinet
   ```

2. Modifiez `apps/mon-cabinet/package.json` :
   ```json
   {
     "name": "@kairn/mon-cabinet",
     "version": "0.1.0"
   }
   ```

3. Configurez `apps/mon-cabinet/config/site.config.ts`

## Configuration du site

Le fichier `site.config.ts` contient toute la configuration de votre site.

### Structure de base

```typescript
import { defineSiteConfig } from '@kairn/config';

export const siteConfig = defineSiteConfig({
  // Identité
  id: 'mon-cabinet',
  name: 'Mon Cabinet',
  domain: 'mon-cabinet.fr',
  locale: 'fr',

  // Praticien
  practitioner: {
    name: 'Dr. Jean Dupont',
    title: 'Psychologue clinicien',
    bio: `Description de votre parcours...`,
    image: '/images/practitioner.webp',
    credentials: [
      { title: 'Doctorat en Psychologie', institution: 'Université de Paris' },
    ],
  },

  // Contact
  contact: {
    email: 'contact@mon-cabinet.fr',
    phone: '01 23 45 67 89',
    address: {
      street: '123 rue Example',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
    },
  },

  // Services
  services: [
    {
      id: 'consultation',
      name: 'Consultation individuelle',
      slug: 'consultation',
      shortDescription: 'Séances de 50 minutes...',
      icon: 'Heart',
      enabled: true,
      order: 1,
    },
  ],

  // Features
  features: {
    blog: true,
    testimonials: true,
    analytics: true,
    contactForm: true,
    appointmentBooking: true,
  },

  // SEO
  seo: {
    defaultTitle: 'Mon Cabinet | Psychologue Paris',
    description: 'Cabinet de psychologie...',
    keywords: ['psychologue', 'paris', 'consultation'],
  },

  // Theme
  theme: {
    colors: {
      primary: '#6366f1',
      secondary: '#1e293b',
      accent: '#a5b4fc',
      background: '#f8fafc',
    },
    fonts: {
      display: 'Playfair Display',
      body: 'Inter',
    },
  },
});
```

### Variables d'environnement par site

Chaque site peut avoir son propre fichier `.env.local` dans `apps/mon-cabinet/.env.local`.

## Développement

### Lancer un site spécifique

```bash
kairn dev --site mon-cabinet

# Ou avec Next.js directement
cd apps/mon-cabinet
pnpm dev
```

### Lancer tous les sites

```bash
pnpm dev

# Ou via le CLI
kairn dev --turbo
```

### Générer du code

```bash
# Nouvelle page
kairn generate page tarifs --site mon-cabinet

# Nouveau composant
kairn generate component PriceCard --site mon-cabinet
```

## Base de données

### Créer une migration

```bash
kairn db migrate --name add-appointment-table
```

### Appliquer les migrations en production

```bash
kairn db migrate --deploy
```

### Explorer les données

```bash
kairn db studio
```

Ouvre Prisma Studio sur http://localhost:5555

### Reset complet (développement uniquement)

```bash
kairn db seed --reset
```

## Build production

### Build tous les sites

```bash
pnpm build
```

### Build un site spécifique

```bash
kairn build --site mon-cabinet
```

## Déploiement

### Vercel (recommandé)

1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement
3. Sélectionnez le dossier racine du site (`apps/mon-cabinet`)

### Autres plateformes

Le build produit un site Next.js standard, déployable sur :
- Netlify
- AWS Amplify
- Railway
- Render
- Docker

## Dépannage

### Erreur Prisma Client

```bash
# Régénérer le client
pnpm --filter @kairn/db db:generate
```

### Erreur de build packages

```bash
# Nettoyer et rebuild
pnpm clean
pnpm install
pnpm build
```

### Erreur de connexion DB

1. Vérifiez DATABASE_URL dans `.env`
2. Assurez-vous que PostgreSQL est accessible
3. Testez avec `kairn db studio`

### Problèmes de cache

```bash
# Nettoyer les caches Turbo
rm -rf .turbo
pnpm build
```

## Ressources

- [Architecture](ARCHITECTURE.md) - Structure détaillée du projet
- [Personnalisation](CUSTOMIZATION.md) - Thèmes et extensions
- [API Prisma](https://www.prisma.io/docs) - Documentation Prisma
- [Next.js App Router](https://nextjs.org/docs/app) - Documentation Next.js
