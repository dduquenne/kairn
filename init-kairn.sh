#!/bin/bash
# =============================================================================
# KAIRN PLATFORM - INITIALIZATION SCRIPT
# =============================================================================
# Ce script crée la structure complète du monorepo Kairn
# Usage: chmod +x init-kairn.sh && ./init-kairn.sh
# =============================================================================

set -e

echo "🪨 Initialisation de Kairn Platform..."

# Créer le dossier racine
mkdir -p kairn
cd kairn

# =============================================================================
# STRUCTURE DES DOSSIERS
# =============================================================================
echo "📁 Création de la structure..."

mkdir -p packages/{config/src,core,ui,analytics,blog,social,admin}
mkdir -p tooling/{typescript-config,tailwind-preset,eslint-config}
mkdir -p apps
mkdir -p .github/{workflows,ISSUE_TEMPLATE}
mkdir -p .husky

# =============================================================================
# FICHIERS RACINE
# =============================================================================
echo "📄 Création des fichiers racine..."

# package.json
cat > package.json << 'ENDOFFILE'
{
  "name": "kairn",
  "version": "0.0.1",
  "private": true,
  "description": "Plateforme mutualisée pour sites de praticiens",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint -- --fix",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules .turbo",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,css}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,css}\"",
    "audit": "pnpm audit --audit-level=moderate",
    "prepare": "husky || true",
    "preinstall": "npx only-allow pnpm"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "eslint": "^8.57.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0",
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css,yaml,yml}": [
      "prettier --write"
    ]
  },
  "packageManager": "pnpm@10.0.0",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=10.0.0"
  }
}
ENDOFFILE

# pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'ENDOFFILE'
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"
ENDOFFILE

# turbo.json
cat > turbo.json << 'ENDOFFILE'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "env": ["NODE_ENV"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
ENDOFFILE

# .gitignore
cat > .gitignore << 'ENDOFFILE'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
.next/
out/
build/

# Turbo
.turbo/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Test
coverage/
.nyc_output/

# Misc
*.tsbuildinfo
.vercel
ENDOFFILE

# .nvmrc
echo "22" > .nvmrc

# .npmrc
cat > .npmrc << 'ENDOFFILE'
auto-install-peers=true
strict-peer-dependencies=false
ENDOFFILE

# .editorconfig
cat > .editorconfig << 'ENDOFFILE'
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{yaml,yml}]
indent_size = 2

[Makefile]
indent_style = tab
ENDOFFILE

# .prettierrc
cat > .prettierrc << 'ENDOFFILE'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
ENDOFFILE

# .prettierignore
cat > .prettierignore << 'ENDOFFILE'
node_modules/
dist/
.next/
coverage/
.turbo/
pnpm-lock.yaml
ENDOFFILE

# .env.example
cat > .env.example << 'ENDOFFILE'
# =============================================================================
# KAIRN PLATFORM - ENVIRONMENT VARIABLES TEMPLATE
# =============================================================================
# Copy this file to .env.local and fill in the values
# NEVER commit .env.local to git
# =============================================================================

# DATABASE
DATABASE_URL="postgresql://user:password@localhost:5432/kairn_db"

# AUTHENTICATION (generate with: openssl rand -base64 32)
JWT_SECRET="your-jwt-secret-min-32-characters-here"
JWT_ACCESS_SECRET="your-access-token-secret-here"
JWT_REFRESH_SECRET="your-refresh-token-secret-here"

# EMAIL (Resend)
RESEND_API_KEY=""
EMAIL_FROM_ADDRESS="noreply@example.com"
EMAIL_FROM_NAME="Site Name"

# STORAGE (Supabase - optional)
SUPABASE_URL=""
SUPABASE_ANON_KEY=""

# AI SERVICES (optional)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# ENVIRONMENT
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENDOFFILE

# SECURITY.md
cat > SECURITY.md << 'ENDOFFILE'
# Security Policy

## Private Repository

This is a private repository. Security is critical.

## Security Measures

- Dependencies audited via `pnpm audit`
- ESLint security plugin enabled
- No secrets in code (use environment variables)
- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM

## Reporting Vulnerabilities

Report security issues directly to the repository owner.
ENDOFFILE

# README.md
cat > README.md << 'ENDOFFILE'
# Kairn

Plateforme mutualisée pour sites de praticiens.

## Structure

```
kairn/
├── apps/                    # Sites individuels
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
pnpm dev      # Lancer en mode dev
pnpm build    # Build
pnpm lint     # Linter
```

---

*Kairn : Du cairn qui guide le chemin.*
ENDOFFILE

# =============================================================================
# GITHUB
# =============================================================================
echo "🐙 Configuration GitHub..."

# CI workflow
cat > .github/workflows/ci.yml << 'ENDOFFILE'
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=moderate
        continue-on-error: true
ENDOFFILE

# Dependabot
cat > .github/dependabot.yml << 'ENDOFFILE'
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
    commit-message:
      prefix: "chore(deps)"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "ci"
    commit-message:
      prefix: "chore(ci)"
ENDOFFILE

# PR template
cat > .github/pull_request_template.md << 'ENDOFFILE'
## Description

<!-- Décrivez les changements apportés -->

## Type de changement

- [ ] 🐛 Bug fix
- [ ] ✨ Nouvelle fonctionnalité
- [ ] 💥 Breaking change
- [ ] 📝 Documentation

## Checklist

- [ ] Mon code suit les conventions du projet
- [ ] J'ai testé mes changements localement
- [ ] Pas de secrets ou données sensibles
ENDOFFILE

# Husky pre-commit
cat > .husky/pre-commit << 'ENDOFFILE'
pnpm lint-staged
ENDOFFILE
chmod +x .husky/pre-commit

# =============================================================================
# TOOLING
# =============================================================================
echo "🔧 Configuration tooling..."

# TypeScript configs
cat > tooling/typescript-config/package.json << 'ENDOFFILE'
{
  "name": "@kairn/typescript-config",
  "version": "0.0.1",
  "private": true,
  "files": ["base.json", "nextjs.json", "react-library.json"]
}
ENDOFFILE

cat > tooling/typescript-config/base.json << 'ENDOFFILE'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "exclude": ["node_modules", "dist", ".turbo"]
}
ENDOFFILE

cat > tooling/typescript-config/nextjs.json << 'ENDOFFILE'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "allowJs": true,
    "noEmit": true,
    "incremental": true
  }
}
ENDOFFILE

cat > tooling/typescript-config/react-library.json << 'ENDOFFILE'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "react-jsx"
  }
}
ENDOFFILE

# Tailwind preset
cat > tooling/tailwind-preset/package.json << 'ENDOFFILE'
{
  "name": "@kairn/tailwind-preset",
  "version": "0.0.1",
  "private": true,
  "main": "./index.js",
  "types": "./index.d.ts",
  "peerDependencies": {
    "tailwindcss": "^3.4.0"
  }
}
ENDOFFILE

cat > tooling/tailwind-preset/index.js << 'ENDOFFILE'
/** @type {import('tailwindcss').Config} */
const preset = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          900: 'var(--color-primary-900)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
        },
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
};
module.exports = preset;
ENDOFFILE

cat > tooling/tailwind-preset/index.d.ts << 'ENDOFFILE'
import type { Config } from 'tailwindcss';
declare const preset: Partial<Config>;
export = preset;
ENDOFFILE

# ESLint config
cat > tooling/eslint-config/package.json << 'ENDOFFILE'
{
  "name": "@kairn/eslint-config",
  "version": "0.0.1",
  "private": true,
  "main": "./index.js",
  "files": ["index.js", "next.js", "react.js"],
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-security": "^2.1.0",
    "eslint-plugin-jsx-a11y": "^6.8.0"
  },
  "peerDependencies": {
    "eslint": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
ENDOFFILE

cat > tooling/eslint-config/index.js << 'ENDOFFILE'
/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'security'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:security/recommended-legacy',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': ['error', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: ['node_modules/', 'dist/', '.next/', '.turbo/'],
};
ENDOFFILE

cat > tooling/eslint-config/react.js << 'ENDOFFILE'
/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./index.js', 'plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:jsx-a11y/recommended'],
  plugins: ['react', 'react-hooks', 'jsx-a11y'],
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: { react: { version: 'detect' } },
};
ENDOFFILE

cat > tooling/eslint-config/next.js << 'ENDOFFILE'
/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./react.js', 'next/core-web-vitals'],
};
ENDOFFILE

# =============================================================================
# PACKAGES
# =============================================================================
echo "📦 Création des packages..."

# @kairn/config
cat > packages/config/package.json << 'ENDOFFILE'
{
  "name": "@kairn/config",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@kairn/typescript-config": "workspace:*",
    "typescript": "^5.4.0"
  }
}
ENDOFFILE

cat > packages/config/tsconfig.json << 'ENDOFFILE'
{
  "extends": "@kairn/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
ENDOFFILE

cat > packages/config/src/index.ts << 'ENDOFFILE'
import { z } from 'zod';

// Schemas
export const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string().default('France'),
});

export const practitionerSchema = z.object({
  name: z.string().min(2),
  title: z.string(),
  bio: z.string().min(100),
  image: z.string(),
  credentials: z.array(z.object({
    title: z.string(),
    institution: z.string().optional(),
    year: z.number().optional(),
  })),
});

export const contactSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  address: addressSchema,
});

export const featuresSchema = z.object({
  blog: z.boolean().default(true),
  seminars: z.boolean().default(false),
  analytics: z.boolean().default(true),
  socialMedia: z.boolean().default(false),
  appointmentBooking: z.boolean().default(true),
  testimonials: z.boolean().default(true),
});

export const themeSchema = z.object({
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    foreground: z.string(),
  }),
  fonts: z.object({
    display: z.string(),
    body: z.string(),
  }),
});

export const siteConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  locale: z.enum(['fr', 'en']).default('fr'),
  practitioner: practitionerSchema,
  contact: contactSchema,
  features: featuresSchema,
  theme: themeSchema,
});

// Types
export type Address = z.infer<typeof addressSchema>;
export type Practitioner = z.infer<typeof practitionerSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Features = z.infer<typeof featuresSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type SiteConfig = z.infer<typeof siteConfigSchema>;

// Helper
export function defineSiteConfig(config: SiteConfig): SiteConfig {
  return siteConfigSchema.parse(config);
}
ENDOFFILE

# Autres packages (placeholders)
for pkg in core ui analytics blog social admin; do
  cat > packages/$pkg/package.json << ENDOFFILE
{
  "name": "@kairn/$pkg",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@kairn/config": "workspace:*"
  },
  "devDependencies": {
    "@kairn/typescript-config": "workspace:*",
    "typescript": "^5.4.0"
  }
}
ENDOFFILE
done

# =============================================================================
# GIT
# =============================================================================
echo "🔀 Initialisation Git..."

git init
git add -A
git commit -m "chore: initial Kairn platform setup

- Monorepo structure with Turborepo + pnpm workspaces
- Packages: @kairn/config, core, ui, analytics, blog, social, admin
- Tooling: typescript-config, tailwind-preset, eslint-config
- CI/CD: GitHub Actions, Dependabot
- Security: ESLint security plugin, audit, pre-commit hooks"

echo ""
echo "✅ Kairn Platform initialisé avec succès!"
echo ""
echo "Prochaines étapes:"
echo "  cd kairn"
echo "  git remote add origin git@github.com:dduquenne/kairn.git"
echo "  git push -u origin main"
echo "  pnpm install"
echo ""
