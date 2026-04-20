---
name: v0-designer
description: >
  Génère des composants et pages React + Tailwind + shadcn/ui pour la plateforme Kairn via l'API REST de v0.app (Vercel). Spécialisé dans la création initiale de surfaces UI complètes : landing pages, dashboards, formulaires complexes, sections marketing, écrans admin. Sortie directe en JSX (pas de HTML à porter), nativement aligné sur la stack Kairn (Next.js App Router + Tailwind + shadcn). Utilise ce skill pour les générations from scratch ou refontes majeures où le coût d'un crédit v0 (≈ 0.05 à 0.20$) est justifié par le gain de temps. Déclenche pour : "génère un composant v0", "v0", "appelle v0", "génération v0", "page neuve avec v0", "composant à partir de zéro", "shadcn page", "skeleton de page". Nécessite un plan v0 Premium (20$/mois, 20$ de crédits API inclus) et la variable d'environnement V0_API_KEY. Si V0_API_KEY est absent, le skill explique comment l'activer puis cède la main à `vision-loop` ou au MCP `shadcn` pour assembler depuis l'existant. Pour une simple itération visuelle sur un écran existant, préférer `vision-loop`. Pour assembler un composant standard depuis le registry, préférer le MCP `shadcn`.
compatibility:
  recommends:
    - uidesigner # Orchestrateur qui peut router vers v0-designer
    - vision-loop # Itération visuelle après génération
    - shadcn (MCP) # Pour les briques shadcn isolées (form, dialog, table)
    - archicodix # Découpage RSC vs client après adoption
    - apix # Câblage des Route Handlers en aval
    - databasix # Câblage Prisma en aval
    - testix # Tests sur le code adopté
---

# v0 Designer — Génération React+Tailwind+shadcn via v0.app

v0 (par Vercel) génère du code prêt-à-coller dans une stack Next.js + Tailwind + shadcn — exactement la stack Kairn. Contrairement à un générateur HTML, le coût de port est faible : on récupère du JSX qu'on intègre directement dans `packages/ui/` ou `apps/<site>/components/`.

---

## 0. Pré-flight obligatoire

Avant tout appel à l'API v0 :

1. **Vérifier `V0_API_KEY`** dans l'env. Si absent → afficher les instructions d'activation (§5) et stopper. Ne pas tenter d'appel à l'aveugle.
2. **Vérifier les crédits** (optionnel mais utile) : tenter un endpoint léger de v0 pour confirmer la validité de la clé avant la vraie génération coûteuse.
3. **Confirmer le périmètre** avec l'utilisateur : composant unitaire ou page complète ? Quelle route cible ?

> Coût indicatif d'une génération : 0.05$–0.20$ selon la taille. Le plan Premium inclut 20$/mois → ~100 à 400 générations. Bien plus généreux qu'aidesigner.

---

## 1. Quand l'utiliser, quand ne pas

**Utiliser quand** :

- création d'un composant ou d'une page **from scratch** dans une direction visuelle nouvelle
- refonte majeure d'une surface où la composition doit être ré-inventée
- besoin d'une intégration native shadcn (formulaires, dialogs, command palette, data tables)
- génération multi-variants à comparer rapidement

**Ne pas utiliser quand** :

- modif ciblée sur un écran existant → préférer `vision-loop`
- composant standard déjà couvert par shadcn registry → utiliser le MCP `shadcn` pour cloner
- wireframe basse-fi en amont → `maquettix`
- on veut juste "voir à quoi ça pourrait ressembler" → mood board, pas v0 (coût inutile)

---

## 2. Cadrage avant génération

Comme `uidesigner`, poser ces questions une seule fois (groupées) si non répondues :

1. **Site cible** : `psypnos`, `avv`, `unanima`, … (charge la charte)
2. **Route ou composant cible** : chemin App Router ou nom de composant `packages/ui/<famille>/`
3. **Nature** : composant isolé, section, page entière ?
4. **Données / formulaire** : la sortie aura-t-elle des champs, soumissions, état ? (v0 sait générer des formulaires shadcn complets)
5. **Référence visuelle** : URL d'inspiration ? capture d'écran ? Sinon prompt-only.

Pour la collecte du contexte repo (charte, composants partagés, polices, ton), suivre **§2 du skill `uidesigner`** — ne pas dupliquer.

---

## 3. Construction du prompt v0

v0 attend un prompt en langage naturel, anglais ou français. Bonnes pratiques :

- **Court et art-dirigé** sur la composition / le ressenti
- **Précis** sur les contraintes hard : palette de marque, polices officielles, mode sombre par défaut, langue de l'UI (français)
- **Spécifique** sur l'usage de shadcn primitives si pertinent (« use shadcn `<Form>` and `<Dialog>` »)
- **Liste** des données affichées si la sortie est data-driven (sans inventer de fausses données métier)
- **Pas de listes exhaustives** de sections ni de microcopies — laisser v0 inventer, on adapte au port

**Exemple de prompt compact** :

```
Build a contact section for a French psychotherapist site (Psypnos).
Stack: Next.js App Router, Tailwind, shadcn/ui.
Brand: dark mode default, gold (#c7a962) + deep night (#0e1f2f) + ivory (#f5f1e6).
Fonts: Playfair Display (display) + Inter (body).
Tone: serene, trustworthy, no New Age tropes.
Primary action: trigger an appointment request — CTA "Demander un rendez-vous".
Include: a calm hero paragraph, a shadcn Form (name, email, phone, message), GDPR consent checkbox, success/error states, business hours sidebar.
Use server action skeleton, mark client boundary explicitly. French copy.
```

---

## 4. Appel API v0

L'API v0 expose un endpoint compatible OpenAI Chat Completions. Endpoint actuel à confirmer dans la doc à jour : https://v0.app/docs/api

Pattern d'appel via `fetch` (à exécuter via Bash/tsx ou un petit helper) :

```bash
curl -X POST "https://api.v0.dev/v1/chat/completions" \
  -H "Authorization: Bearer $V0_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "v0-1.5-md",
    "messages": [{ "role": "user", "content": "<prompt>" }]
  }'
```

> **Important** : le nom de modèle (`v0-1.5-md`, `v0-1.5-lg`, …) et l'URL exacte évoluent. Consulter la doc à l'activation. Si l'endpoint ci-dessus retourne 404, lire https://v0.app/docs/api avant de coder un wrapper en dur.

La réponse contient le code généré sous forme de blocs markdown (`tsx ...`). Extraire chaque bloc et l'écrire dans le bon fichier cible.

---

## 5. Activation V0_API_KEY (si absent)

Si `V0_API_KEY` n'est pas dans l'env, afficher exactement ce qui suit à l'utilisateur et stopper :

> **v0-designer requiert une clé API v0 active.**
>
> 1. Souscrire au plan Premium : https://v0.app/pricing (20$/mois, inclut 20$ de crédits API)
> 2. Générer une clé : https://v0.app/settings/api
> 3. Ajouter dans `.env.local` à la racine du repo : `V0_API_KEY="..."` (déjà documenté dans `.env.example`)
> 4. Relancer la commande
>
> En attendant, deux alternatives gratuites :
>
> - **`vision-loop`** : itération visuelle locale sans génération externe
> - **MCP `shadcn`** : assembler depuis le registry officiel (`npx shadcn@latest mcp` déjà configuré)

---

## 6. Adoption du code généré

v0 produit déjà du JSX/TSX exploitable, mais **ne pas coller à l'aveugle** :

### 6.1 Repérage des libs introduites

v0 importe parfois des libs qui ne sont pas dans Kairn (framer-motion, lucide-react, certaines primitives shadcn manquantes). Avant adoption :

1. `grep` les imports du code généré
2. Vérifier dans `package.json` du package/app cible
3. Soit installer la lib (avec accord utilisateur si nouvelle dépendance non triviale), soit remplacer par l'équivalent déjà présent (Kairn utilise déjà `lucide-react` côté icônes — vérifier)

### 6.2 Découpage RSC vs Client

Comme pour toute UI Kairn :

- Server Component par défaut
- `'use client'` uniquement si réelle interactivité (state, hooks, événements)
- Déléguer à `archicodix` si arbitrage non trivial

### 6.3 Mutualisation

Décider :

- **Composant mutualisable** → `packages/ui/src/components/<famille>/` (configurable via props, injection de hooks)
- **Spécifique au site** → `apps/<site>/components/` (wrapper qui consomme le partagé et injecte le contexte local)

### 6.4 Tokens du repo

Remplacer toute valeur Tailwind arbitraire (`text-[64px]`, `#c7a962` hardcodé) par les tokens du repo (`text-5xl`, `text-gold`). Charte dans `apps/<site>/config/theme.config.ts`.

### 6.5 Microcopies & contenu

Le contenu généré est illustratif. Réécrire :

- en français correct si v0 a glissé de l'anglais
- en cohérence avec le ton du praticien (`siteConfig.practitioner.bio`)
- avec les vrais services, adresse, coordonnées (jamais de placeholder en prod)

---

## 7. Boucler avec vision-loop après adoption

Une fois le code adopté et le dev server démarré :

- Capturer le rendu réel via `vision-loop`
- Comparer au mental model du prompt v0
- Itérer si besoin sans reconsommer de crédit v0 (via vision-loop, coût quasi nul)

C'est le combo gagnant : **v0 pour l'invention, vision-loop pour le polish**.

---

## 8. Câbler la logique applicative

Identique à `uidesigner` §5.3 — déléguer dans l'ordre :

1. **`databasix`** pour le schéma Prisma + `siteId`
2. **`apix`** pour les Route Handlers + Zod + middlewares
3. **`securix`** pour CSRF / rate limit / sanitization
4. **`rgpdix`** si données personnelles
5. **`testix`** pour les tests
6. **`accessibilix`** pour l'audit a11y final

---

## 9. Limites assumées

- **Coût** : non nul. Privilégier `vision-loop` ou `shadcn` MCP pour les modifs incrémentales.
- **Stack-locked** : v0 produit du React+Tailwind+shadcn. Pour autre chose, ne pas l'utiliser.
- **Variabilité** : la qualité oscille entre runs. Ne pas hésiter à relancer 2 fois plutôt que d'itérer 5 fois sur un mauvais output.
- **Microcopies anglophones** récurrentes : à systématiquement réécrire en français pour Kairn.
- **Photos / illustrations** : v0 utilise des placeholders (souvent images Unsplash). À remplacer par les assets réels du site.

---

## 10. Règles opérationnelles

- **Vérifier V0_API_KEY** avant tout appel — ne pas générer une 404 à l'aveugle
- **Annoncer le coût estimé** avant l'appel (≈ 0.05 à 0.20$)
- **Ne jamais coller le code v0 brut** dans une page Next.js sans audit des imports et tokens
- **Toujours boucler avec `vision-loop`** après adoption pour valider le rendu réel
- **Suivre les conventions du repo** (Prettier 100 cols, imports ordonnés, JSDoc, zéro `any`)
- **Commits** au format `type(scope): description`, workflow `/issue` du repo
