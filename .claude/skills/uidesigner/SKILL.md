---
name: uidesigner
description: >
  Orchestrateur de conception et d'implémentation de pages fonctionnelles pour les sites de la plateforme Kairn (apps/psypnos, apps/avv, apps/unanima, etc.). Choisit la bonne source de design selon le besoin — `v0-designer` (génération React+Tailwind+shadcn from scratch via API v0), `vision-loop` (boucle de feedback visuel local pour itérer sur l'existant), MCP `shadcn` (assemblage depuis le registry officiel + @magic-ui + @aceternity), `maquettix` (wireframe basse-fi en amont) — puis pilote l'intégration de la logique applicative en s'appuyant sur les autres skills (apix, databasix, archicodix, accessibilix, ergonomix, securix, rgpdix, testix). Utilise ce skill dès qu'une demande touche à la création, la refonte, l'amélioration ou l'implémentation d'une page, d'un écran, d'un formulaire, d'un tableau de bord, d'une landing page ou d'une section UI dans un site Kairn — qu'elle soit publique (App Router) ou admin. Déclenche impérativement pour : "nouvelle page", "refaire la page", "refonte", "design la page", "créer un écran", "améliorer l'UI", "implémenter la maquette", "page produit", "landing page", "dashboard admin", "écran de contact", "formulaire d'inscription", "refonte visuelle", "redesign", "UI/UX", "génère la page X", "mets en place l'écran Y", "porter ce design", "intégrer la maquette dans psypnos/avv/unanima". Pose systématiquement les questions de cadrage AVANT de déclencher la source de design choisie.
compatibility:
  recommends:
    - v0-designer # Génération from scratch via API v0 (composants/pages neuves)
    - vision-loop # Boucle visuelle locale (refonte ciblée, polissage, validation)
    - shadcn # MCP officiel — assemblage de composants standards et modernes
    - maquettix # Wireframe basse-fi en amont si périmètre UX flou
    - ergonomix # Validation UX pour les écrans métier (admin, dashboards)
    - apix # Route Handlers Next.js, validation Zod, middlewares
    - databasix # Schéma Prisma + filtrage siteId obligatoire
    - archicodix # Découpage RSC vs client, packages/ui vs apps/<site>
    - accessibilix # Audit a11y avant sign-off
    - testix # Tests Vitest, Playwright, axe-core
    - securix # CSRF, rate limit, sanitization
    - rgpdix # Si données personnelles collectées
---

# UIDesigner — Orchestrateur multi-sources de pages Kairn

UIDesigner est le point d'entrée unique quand il faut **concevoir, refondre ou implémenter une page d'un site Kairn**. Il ne génère rien lui-même : il **route vers la bonne source** selon la nature de la tâche, puis pilote l'intégration de la logique applicative en délégant aux skills spécialisés.

La mission : livrer une page **intégrée dans le monorepo** (pas un artefact orphelin), **multi-tenant-safe**, **accessible**, **testée**, et **cohérente avec la charte du site cible**.

---

## 0. Quatre sources de design — Quand utiliser quoi

| Source            | Coût                                                   | Quand l'utiliser                                                                                                                                                                |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`v0-designer`** | API v0 (~0.05–0.20$/gen, plan Premium 20$/mois requis) | Création **from scratch** : page neuve complète, composant inédit, refonte majeure où la composition doit être ré-inventée. Sortie React+Tailwind+shadcn directement adoptable. |
| **`vision-loop`** | ~0 (tokens vision Claude uniquement)                   | **Refonte ciblée** d'un écran existant, polissage, correction visuelle, vérification responsive/dark mode. Boucle édit → screenshot → critique → revise.                        |
| **MCP `shadcn`**  | Gratuit                                                | Composants **standards** (form, dialog, table, command palette) ou **modernes** (animations via @magic-ui, @aceternity). Assemblage depuis registry, pas de génération.         |
| **`maquettix`**   | Gratuit (SVG local)                                    | **Wireframe basse-fi en amont** quand le périmètre UX est flou et qu'il faut s'aligner sur une structure avant de coder.                                                        |

**Règle de routing par défaut** :

- Doute entre v0 et vision-loop → vision-loop (coût 0, marche partout)
- Composant standard déjà couvert par shadcn → MCP shadcn (gratuit, stable)
- Page entière neuve avec V0_API_KEY actif → v0-designer
- UX à arbitrer avant code → maquettix

---

## 1. Questions préalables — À poser AVANT toute génération

Pose les questions manquantes de façon groupée (une seule fois, pas en ping-pong).

### 1.1 Cadrage obligatoire

1. **Site cible** : `psypnos`, `avv`, `unanima`, ou autre ? (conditionne la charte à charger)
2. **Route ou composant cible** : chemin App Router exact (ex. `app/(pages)/services/page.tsx`) ou nom de composant (`packages/ui/<famille>/`)
3. **Nature** : nouvelle page, refonte complète, amélioration ciblée, ou composant isolé ?
4. **Surface** : page publique (SSR + ISR), route admin (`withAdminAuth`), ou composant indépendant ?
5. **Objectif produit** : action prioritaire que l'utilisateur doit accomplir sur cet écran ?

### 1.2 Cadrage logique applicative (si pertinent)

6. **Données** : quelles entités Prisma sont impliquées ? lecture, écriture, ou les deux ?
7. **Formulaire(s)** : soumission ? vers quelle API ? schéma Zod attendu ?
8. **Authentification** : page publique, protégée admin, ou mixte ?
9. **État** : ISR/statique, données dynamiques, ou interactif (client-side state) ?

### 1.3 Cadrage design

10. **Source choisie** : v0-designer / vision-loop / shadcn MCP / maquettix ? (Si l'utilisateur ne sait pas, proposer en se basant sur la table §0.)
11. **Référence visuelle** : URL d'inspiration, screenshot, ou prompt-only ?
12. **Contraintes non-négociables** : composants partagés à préserver (`GlobalHeader`, `Footer`, `FloatingContactButton`), routes existantes à ne pas casser, ISR à conserver ?

> Si l'utilisateur dit "fais simple, tu gères", adopte des valeurs par défaut raisonnables et annonce-les. La question **site cible** reste toujours obligatoire — elle détermine la charte.

---

## 2. Collecte du contexte repo — Avant de déclencher la source

Quel que soit le routing choisi, **toujours** charger la charte du site cible :

1. **`apps/<site>/config/theme.config.ts`** → `accessibleColors`, `brandColors`, `fonts`, ratios WCAG.
2. **`apps/<site>/config/site.config.ts`** → `practitioner`, `services`, `features`, `domain` (ton et contenu illustratif).
3. **`apps/<site>/tailwind.config.ts`** + `app/globals.css` → tokens exposés, CSS variables.
4. **Composants partagés** : `packages/ui/` et `apps/<site>/components/`. Toute nouvelle UI doit **réutiliser** ces primitives avant d'en inventer.
5. **Route existante ou voisine** : pour une refonte, lire la page actuelle ; pour une création, lire les pages sœurs pour inférer le rythme visuel.
6. **`DESIGN.md`** ou **`.aidesigner/DESIGN.md`** s'ils existent → priment sur le reste.

Compiler un brief interne compact qui couvre : palette officielle, polices, ton (extrait de `siteConfig.practitioner.bio`), patterns réutilisables, contraintes hard.

---

## 3. Routing détaillé

### 3.1 → `v0-designer` (génération from scratch)

**Conditions** : `V0_API_KEY` présent dans l'env + page/composant à créer ex nihilo.

Suivre §3 et §4 du skill `v0-designer` pour construire le prompt et appeler l'API. Adopter le code généré directement dans `packages/ui/` ou `apps/<site>/components/`.

### 3.2 → `vision-loop` (refonte ciblée, polissage)

**Conditions** : page/composant **existant**, modification visuelle à valider, ou suspicion de bug visuel (alignement, responsive, dark mode).

Suivre §2 et §3 du skill `vision-loop` : démarrer le dev server, capturer baseline, itérer édit → screenshot → critique. Plafonner à 5 itérations avec checkpoint humain tous les 2 cycles.

### 3.3 → MCP `shadcn`

**Conditions** : besoin d'un composant standard (Form, Dialog, Table, Command, Sheet, etc.) ou d'une brique moderne du registry étendu.

Utiliser les outils du MCP `shadcn` (déjà configuré dans `.mcp.json`) :

- Recherche : `search` ou `view` pour trouver le composant
- Installation : `add` pour cloner dans le repo
- Registries supportés : officiel + `@magic-ui` + `@aceternity`

Vérifier que le composant cloné s'aligne sur la charte du site (couleurs, polices) avant adoption. Adapter si besoin via les CSS variables du site.

### 3.4 → `maquettix`

**Conditions** : périmètre UX flou, besoin de s'aligner sur une structure avant de coder, ou production d'une maquette pour validation hors-code.

Suivre le skill `maquettix` pour produire un SVG, valider, **puis** revenir vers UIDesigner pour le routing vers v0-designer ou vision-loop.

---

## 4. Adoption et port — Là où UIDesigner orchestre

Une fois le code/design produit par la source, UIDesigner pilote l'intégration. Procéder par couches.

### 4.1 Tokens du repo

- Comparer les tokens introduits par la source avec `theme.config.ts` et `tailwind.config.ts`.
- Si une nouvelle valeur est cohérente et justifiée, **l'ajouter** au `theme.config.ts` (respecter le pattern `accessibleColors` / `brandColors`) plutôt qu'en hardcoder dans le composant.
- Ne jamais introduire de Tailwind arbitraire (`text-[64px]`) quand un token existe.

### 4.2 Découpage composants — déléguer à `archicodix` si non-trivial

- Section/composant : RSC (défaut) ou `'use client'` (uniquement si interactivité réelle) ?
- Mutualisable → `packages/ui/src/components/<famille>/` (configurable via props, injection de hooks).
- Spécifique au site → `apps/<site>/components/` (wrapper qui injecte le contexte local — `useCSRF`, `useToast`, `siteConfig`).
- Pas de `useCallback`/`useMemo` sans preuve de perf.

### 4.3 Câblage logique — déléguer dans l'ordre

1. **`databasix`** : vérifier/étendre Prisma, confirmer `siteId`, `pnpm --filter @kairn/db db:generate`.
2. **`apix`** : Route Handler sous `app/api/…`, Zod `safeParse`, middlewares (`withAuth`, `withCsrf`, `withRateLimit`, `withValidation`), réponse via `createApiError`.
3. **`securix`** : CSRF token (`useCSRF`), honeypot, sanitization (`isomorphic-dompurify`), rate limit dédié.
4. **`rgpdix`** : si données personnelles, base légale, mention d'information, consentement, durée de conservation.
5. **Câblage page** : Server Components pour SSR Prisma, Client Components pour formulaires/state, Server Actions ou `fetch` selon le pattern du site.

### 4.4 Validation finale — déléguer à

- **`ergonomix`** pour les écrans admin / dashboards (charge cognitive, états vides/erreur/chargement, affordances, progressive disclosure).
- **`accessibilix`** pour l'audit a11y (ARIA, contraste, ordre tab, focus visible, alt text).
- **`vision-loop`** pour valider visuellement le rendu réel post-port (souvent utile même si la source était déjà v0).
- **`testix`** pour les tests : composants jsdom (`vitest.ui.config.ts`), a11y (`vitest.a11y.config.ts`), Route Handlers (Vitest Node), parcours critique (Playwright). Seuils : 60 % statements/functions/lines, 50 % branches.

---

## 5. Cas particuliers

### 5.1 Refonte d'une page existante

- Lire la page actuelle **en entier** avant de générer/itérer.
- Préserver les routes API existantes sauf si la refonte le nécessite (confirmer).
- Préserver l'ISR (`revalidate`) sauf raison documentée.
- Modif sur `packages/ui` impacte tous les sites : `pnpm turbo run build --filter='...[HEAD~1]'`.

### 5.2 Dashboard admin

- Filtrage `siteId` partout via `databasix`.
- `withAdminAuth` obligatoire sur les routes API.
- Composition des écrans data-dense (tables, charts) → `ergonomix` en priorité.
- Privilégier `packages/admin/` existant.

### 5.3 Nouveau site (Unanima ou futur)

Si l'app n'existe pas (ex. `apps/unanima/` actuellement vide), **stopper et signaler** : UIDesigner exige a minima un `site.config.ts` et un `theme.config.ts`. Bootstrapper le site d'abord (cf. §"Créer un nouveau site" dans `docs/ARCHITECTURE.md`).

---

## 6. Livrables en fin de mission

- **Source utilisée** : v0-designer (run id + coût) / vision-loop (nb itérations + PNGs clés) / shadcn (composants ajoutés) / maquettix (SVG)
- **Fichiers modifiés ou créés** : pages, composants (partagés vs spécifiques), API routes, migrations Prisma, tests
- **Tokens ajoutés/modifiés** dans `theme.config.ts` ou `tailwind.config.ts`
- **Checklist de validation** : a11y OK ?, tests passent ?, `pnpm turbo run type-check --filter='...[HEAD~1]'` OK ?, E2E critique OK ?
- **Variables d'env** nouvellement requises (documentées dans `.env.example` + 3 envs Vercel)
- **Prochaines étapes** si suivi requis (migration à déployer, schedule QStash, texte RGPD, etc.)

---

## 7. Règles opérationnelles

- **Toujours demander le site cible** avant de commencer — c'est la seule info dont UIDesigner a absolument besoin pour ne pas livrer hors-marque.
- **Choisir la source la plus économe** qui fait le job. Doute → vision-loop (coût 0).
- **Ne jamais coller du code généré brut** dans une page Next.js sans audit (imports, tokens, libs).
- **Ne jamais court-circuiter `siteId`** en multi-tenant, même pour un prototype.
- **Toujours boucler avec `vision-loop`** après un port v0 ou shadcn pour valider le rendu réel.
- **Suivre les conventions du repo** (Prettier 100 cols, imports ordonnés, JSDoc, zéro `any`, pas de `console.log`).
- **Commits** au format `type(scope): description`, workflow `/issue` du repo (branche → PR → squash).
