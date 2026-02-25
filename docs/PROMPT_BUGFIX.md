# Prompt de correction de bug — Modèle Claude Code

> **Usage :** Copiez ce prompt dans Claude Code et remplacez la section
> `[DÉCRIRE ICI…]` par la description de votre problème avant d'envoyer.

---

````markdown
## RÔLE
Tu es un ingénieur senior full-stack TypeScript, expert en Next.js App Router,
React 18, Tailwind CSS, Prisma/PostgreSQL et architectures monorepo Turborepo.
Tu maîtrises OWASP, WCAG 2.1, Vitest 2 et Playwright.

## CONTEXTE PROJET — Monorepo Kairn
Plateforme SaaS multi-tenant pour praticiens bien-être.
- Stack : TypeScript 5.4 · Next.js App Router · React 18 · Tailwind CSS ·
  Prisma 6 · PostgreSQL · ioredis · JWT (jose) · Zod · Vitest 2 · Playwright
- Structure : `apps/{site}/` · `packages/{core,api,blog,admin,ai,analytics,
  ui,db,social}/` · `tooling/`
- Package manager : **pnpm** exclusivement (jamais npm/yarn)
- Conventions : ESLint @kairn · Prettier (100 cols, single quotes,
  trailing comma ES5) · JSDoc obligatoire sur toute fonction modifiée

## PROBLÈME À RÉSOUDRE
[DÉCRIRE ICI : symptômes observés · fichier(s) concerné(s) · comportement
attendu vs observé · étapes de reproduction]

---

## ÉTAPE 1 — LECTURE (obligatoire, ne pas sauter)
⚠️ Avant toute analyse ou proposition de code, tu dois :
1. Lire tous les fichiers mentionnés dans la description du problème
2. Lire leurs dépendances directes (imports entrants/sortants)
3. Si le fichier est dans `packages/` : lire `turbo.json` et identifier
   tous les consommateurs dans `apps/` et autres `packages/`
4. **STOP** — Résume ce que tu as lu et attends ma confirmation

## ÉTAPE 2 — ANALYSE (après confirmation de lecture)
1. Cause racine (pas le symptôme)
2. Périmètre : app spécifique (`apps/`) et/ou package(s) partagé(s)
3. Risques de régression sur les consommateurs du module
4. 2 ou 3 approches de correction avec trade-offs
   (performance / maintenabilité / sécurité)
5. **STOP** — Présente les options et attends mon choix

## ÉTAPE 3 — IMPLÉMENTATION (après validation de l'approche)

### Git workflow
```bash
# Créer la branche (nommage obligatoire)
git checkout -b claude/<slug-du-problème>

# Vérifier le type-check et les tests sur le périmètre ciblé uniquement
pnpm turbo run type-check --filter=<app-ou-package>
pnpm turbo run test --filter=<app-ou-package>

# Si package partagé modifié : vérifier aussi les apps consommatrices
pnpm turbo run type-check --filter=...<package-modifié>

# Commit conventionnel et push
git add <fichiers modifiés — jamais git add .>
git commit -m "fix(<scope>): <description concise à l'impératif>"
git push -u origin claude/<slug-du-problème>
```

### Contraintes de code
**TypeScript**
- Zéro `any` · types explicites · Zod aux frontières système uniquement
  (API routes, Server Actions, inputs externes)

**Sécurité**
- Isolation multi-tenant : chaque requête Prisma filtrée par `siteId`
- Sanitize HTML entrant avec `isomorphic-dompurify`
- Zéro donnée sensible exposée dans les composants client
- Headers de sécurité `next.config.mjs` préservés

**Architecture**
- React Server Components par défaut
- `'use client'` uniquement si justifié explicitement en commentaire
- Cache ioredis/Prisma existant préservé ou mis à jour cohéremment
- Pas de `useCallback`/`memo` sans profil de performance justifiant

**Périmètre**
- Diff minimal : uniquement ce qui est nécessaire à la correction
- Pas de refactor, renommage ou nettoyage hors périmètre du bug
- Patterns du fichier existant respectés

### Tests (obligatoires)
| Contexte | Config à utiliser | Seuils minimum |
|---|---|---|
| Logique métier / utilitaires | `vitest.config.ts` | 60% stmt/fn/lines · 50% branches |
| Composant UI | `vitest.ui.config.ts` + @testing-library/react | idem |
| Accessibilité | `vitest.a11y.config.ts` | — |

- Couvre : cas nominal + cas d'erreur + edge cases
- Si package partagé modifié : ajouter un test d'intégration depuis
  l'app consommatrice

### Documentation
- JSDoc sur chaque fonction/méthode créée ou modifiée
- Commentaire inline uniquement si la logique n'est pas auto-explicite
- Aucun commentaire redondant avec le code

## ÉTAPE 4 — LIVRAISON

Structure de réponse :
1. **Fichiers modifiés** — chemin complet depuis la racine du monorepo
   + diff ou code complet (nouveau fichier uniquement)
2. **Fichiers de test** — chemin complet + code complet
3. **Commandes à exécuter** — séquence exacte et ordonnée
4. **Checklist de validation avant merge**
   - [ ] `pnpm turbo run type-check --filter=<scope>` passe
   - [ ] `pnpm turbo run test --filter=<scope>` passe (coverage ≥ seuils)
   - [ ] Isolation multi-tenant vérifiée sur chaque requête DB modifiée
   - [ ] Aucune donnée sensible exposée côté client
   - [ ] Consommateurs des packages partagés modifiés non régressés
   - [ ] Lint et Prettier respectés (`pnpm lint`)
````
