# Scripts d'installation — Onboarding développeur

## Procédure d'installation complète

```bash
# 1. Cloner le dépôt
git clone git@github.com:<org>/links-app.git
cd links-app

# 2. Vérifier la version Node (lit .nvmrc si présent)
nvm use || nvm install

# 3. Installer les dépendances
pnpm install

# 4. Copier le fichier d'environnement
cp .env.local.example .env.local

# 5. Vérifier le build
npm run build

# 6. Lancer les tests
npm run test

# 7. Démarrer en mode développement
npm run dev
```

## Configuration des variables d'environnement

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://vtycrvrogvfvvdnknyem.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...     # Secret ! Ne jamais committer
RESEND_API_KEY=re_xxxx                   # Secret !
NEXT_PUBLIC_SIMULATION_MODE=false        # Mode démo (optionnel)
```

### Comment obtenir les clés

| Clé                         | Où la trouver                       | Qui peut la fournir           |
| --------------------------- | ----------------------------------- | ----------------------------- |
| `SUPABASE_URL`              | Supabase Dashboard > Settings > API | Admin Supabase                |
| `SUPABASE_ANON_KEY`         | Supabase Dashboard > Settings > API | Admin Supabase                |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API | Admin Supabase (confidentiel) |
| `RESEND_API_KEY`            | Resend Dashboard > API Keys         | Admin Resend                  |

## Vérification post-installation

```bash
# Vérification rapide que tout fonctionne
npm run build && npm run test && echo "Installation réussie !"

# Si un build échoue, vérifier :
# 1. Les variables d'environnement sont présentes dans .env.local
# 2. Pas de conflit de versions : pnpm why <package>
```

## Arbre de décision — Diagnostic de setup

```
Problème de setup ?
├── Installation échoue ?
│   ├── pnpm install échoue → Vérifier Node version (.nvmrc), corepack
│   └── Dépendance manquante → pnpm install
├── Build échoue ?
│   ├── Type error → npm run type-check, vérifier les types
│   ├── Module not found → Vérifier les imports @/*
│   └── Env var manquante → Vérifier .env.local, copier depuis .env.local.example
├── Dev server ne démarre pas ?
│   ├── Port occupé → Changer le port ou tuer le process
│   ├── Erreur Supabase → Vérifier les clés dans .env.local
│   └── Erreur hot reload → Supprimer .next/ et relancer
└── Tests échouent ?
    ├── Timeout → Augmenter le timeout, vérifier les connexions réseau
    ├── Fixture manquante → Seed la base de données
    └── Browser non installé → npx playwright install
```

## Reset complet

```bash
# En dernier recours : reset complet de l'environnement
rm -rf node_modules .next
pnpm install
npm run build
```

## Premier commit — Workflow

```bash
# 1. Créer une branche
git checkout -b feat/mon-premier-changement

# 2. Faire les modifications...

# 3. Vérifier avant de committer
npm run lint && npm run type-check && npm run test && npm run build

# 4. Committer (format conventionnel)
git add <fichiers>
git commit -m "feat: add beneficiaire search filter"

# 5. Pousser et créer une PR
git push -u origin feat/mon-premier-changement
gh pr create --fill
```

## Conventions de commit

```
<type>(<scope>): <description>

Types : feat, fix, docs, style, refactor, test, chore
Scopes : auth, db, api, ui, email, rgpd, config, ci
```

## Checklist avant PR

- [ ] Le code compile (`npm run build`)
- [ ] Les tests passent (`npm run test`)
- [ ] Le lint est propre (`npm run lint`)
- [ ] Les types sont stricts (pas de `any`)
- [ ] Les imports utilisent l'alias `@/*`
- [ ] Les composants sont fonctionnels (pas de classes)
- [ ] Les variables d'environnement sont documentées dans `.env.local.example`
