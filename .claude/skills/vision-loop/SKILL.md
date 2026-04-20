---
name: vision-loop
description: >
  Donne à Claude des yeux sur sa propre sortie UI : skill de boucle de feedback visuel pour la plateforme Kairn (TypeScript/Next.js/Tailwind). Édit code → screenshot Playwright → Claude regarde le PNG via vision → critique → revise. Indispensable dès qu'on travaille sur de l'UI : composant, page, formulaire, layout, dark mode, responsive, état d'erreur, polissage visuel. Le coût marginal est nul (juste des tokens Claude), aucun fournisseur externe requis. Utilise ce skill dès qu'une tâche UI bénéficierait d'une vérification visuelle réelle plutôt qu'une compilation aveugle. Déclenche pour : "vérifier visuellement", "à quoi ça ressemble", "screenshot", "vision loop", "regarde le rendu", "boucle visuelle", "self-check UI", "valider visuellement", "l'alignement n'est pas bon", "le spacing semble off", "responsive cassé", "vérifie que ça tient sur mobile", "polish UI", "fignoler le rendu", "comparer avant/après", "boucler sur le visuel", "régression visuelle", "le hero est moche", "les cartes débordent", "ça déborde", "ça déborde sur mobile", "mauvais contraste à l'œil", "test visuel". À privilégier sur n'importe quelle génération aveugle de CSS/JSX.
compatibility:
  recommends:
    - uidesigner # Orchestrateur qui peut router vers vision-loop
    - ergonomix # Validation UX une fois le visuel stabilisé
    - accessibilix # Audit a11y sur le rendu observé (contraste réel, focus visible)
    - testix # Pour figer la non-régression visuelle en test E2E Playwright
---

# Vision Loop — Donner des yeux à Claude

Sans feedback visuel, n'importe quelle génération UI travaille en aveugle. Ce skill ferme la boucle : Claude écrit du JSX/CSS, **regarde** le rendu via screenshot, **critique** sa propre sortie, et itère. C'est le levier structurel le plus impactant pour l'UI dans Kairn — indépendant de tout fournisseur externe, coût marginal limité aux tokens vision.

---

## 0. Quand l'utiliser, quand ne pas

**Utiliser quand** :

- on construit/modifie une UI et le résultat visuel compte (composant, page, layout, formulaire)
- on suspecte un bug visuel (alignement, débordement, contraste, responsive cassé)
- on polit (espacements, hiérarchie, micro-interactions)
- on veut figer une référence visuelle pour un test de non-régression Playwright

**Ne pas utiliser quand** :

- la tâche est purement logique/données sans rendu (Route Handler, schéma Prisma, util pur)
- le coût des tokens vision n'est pas justifié (modif évidente d'1 ligne)
- la cible n'est pas démarrable localement (avant le port d'un design, pas d'URL à screenshot)

---

## 1. Pré-requis techniques

- `@playwright/test` ≥ 1.50 installé au workspace root (`pnpm add -D -w @playwright/test`)
- Au moins une fois : `pnpm exec playwright install chromium` pour télécharger le binaire
- Un dev server cible joignable (`pnpm --filter @kairn/<site> dev` typiquement)
- Le helper local : `.claude/tools/screenshot.ts`

Si Chromium n'est pas installé, le 1er screenshot échouera proprement avec un message clair. Lancer alors `pnpm exec playwright install chromium` et réessayer.

---

## 2. Boucle canonique

```
┌─────────────────────────────────────────────┐
│ 1. Claude édite le code (JSX, CSS, props)   │
│ 2. Hot reload du dev server                 │
│ 3. tsx .claude/tools/screenshot.ts <url>   │
│    .claude/tmp/screenshots/<iter>.png      │
│ 4. Claude lit le PNG via Read (vision)      │
│ 5. Claude critique : qu'est-ce qui cloche ? │
│ 6. Si OK → fin. Sinon → retour 1.           │
└─────────────────────────────────────────────┘
```

### Garde-fous

- **Plafond d'itérations** : 5 par défaut. Au-delà, demander un point d'étape humain — la boucle a probablement convergé sur un mauvais minimum local.
- **Checkpoint humain** : tous les 2 itérations, montrer le PNG et demander confirmation/réorientation. Ne pas burn 5 itérations en silence.
- **Limiter les viewports** : 1 viewport par cycle. Faire desktop d'abord, puis mobile en cycle séparé. Mélanger les deux dans un même appel disperse l'attention.
- **Pas de vision sur les modifs triviales** : si on a changé `text-sm` en `text-base`, on n'a pas besoin de screenshot.

---

## 3. Invocation pratique

### 3.1 Capture simple

```bash
# Desktop, viewport visible uniquement
pnpm exec tsx .claude/tools/screenshot.ts \
  http://localhost:3000/contact \
  .claude/tmp/screenshots/contact-desktop-01.png

# Mobile, page entière
pnpm exec tsx .claude/tools/screenshot.ts \
  http://localhost:3000/contact \
  .claude/tmp/screenshots/contact-mobile-01.png \
  --viewport=mobile --full-page
```

Le helper retourne un JSON sur stdout (`{"ok": true, "outPath": "..."}`) et écrit le PNG. Ensuite, lire le PNG avec l'outil `Read` — Claude voit l'image directement.

### 3.2 Convention de nommage

`.claude/tmp/screenshots/<route-slug>-<viewport>-<iter>.png` — facilite le diff visuel entre itérations et le nettoyage groupé. Le dossier `.claude/tmp/` est gitignoré (à ajouter au `.gitignore` si pas déjà fait).

### 3.3 Comparaison avant/après

Pour un polissage : capturer une baseline (`-baseline.png`) avant les modifs, puis chaque itération. Lire les deux dans le même tour pour comparer mentalement.

---

## 4. Critique structurée — Ce que Claude regarde

Quand Claude reçoit le PNG, il doit verbaliser son observation **avant** de proposer une modif. Grille de lecture :

| Axe             | Question                                                                            |
| --------------- | ----------------------------------------------------------------------------------- |
| **Hiérarchie**  | Le titre principal est-il dominant ? Le CTA primaire saute-t-il aux yeux ?          |
| **Alignement**  | Les éléments d'une même rangée sont-ils alignés ? Les marges latérales cohérentes ? |
| **Espacement**  | Le rythme vertical est-il respiré ou compressé ? Trop d'air ? Pas assez ?           |
| **Contraste**   | Le texte est-il lisible sur son fond ? Les CTA contrastent-ils suffisamment ?       |
| **Débordement** | Quelque chose sort de son conteneur ? Scroll horizontal involontaire ?              |
| **Cohérence**   | Couleurs/polices alignées avec la charte du site (`config/theme.config.ts`) ?       |
| **États**       | États vides/erreur/chargement présents et identifiables ?                           |
| **Responsive**  | Sur mobile, les blocs s'empilent-ils correctement ? Le tap target est-il ≥ 44px ?   |

Si une critique fait apparaître **plus de 3 problèmes simultanés**, ne pas tout corriger d'un coup. Choisir le plus structurant, corriger, recapturer. Les corrections en lot dégradent l'observation.

---

## 5. Cas d'usage courants

### 5.1 Polissage d'un composant existant

1. Démarrer le dev server du site cible
2. Capturer baseline
3. Itérer : modif → screenshot → critique → modif → ...
4. Quand satisfait : proposer un test Playwright `toHaveScreenshot()` pour figer la non-régression (déléguer à `testix`)

### 5.2 Vérification responsive

- Toujours après une modif desktop : recapturer en `--viewport=mobile`
- Si rupture : corriger (Tailwind breakpoints, pas de `min-w-` rigide), recapturer les deux viewports
- Ne JAMAIS livrer une refonte sans avoir vu mobile + desktop au moins une fois

### 5.3 Vérification dark mode / light mode

Kairn supporte les deux modes (cf. `theme.config.ts`). Si un changement touche les couleurs :

1. Capturer en mode sombre (défaut)
2. Toggle via la classe sur `<html>` (ou via un sélecteur d'URL si présent)
3. Capturer en mode clair
4. Vérifier les deux ratios de contraste

### 5.4 Comparaison directionnelle (refonte)

Avant un gros changement : capturer la version actuelle. Après : capturer la nouvelle. Lire les deux dans la même critique pour évaluer le delta visuel.

### 5.5 Audit a11y visuel

Délégation à `accessibilix` pour le clavier/ARIA, mais la **lecture du PNG** révèle déjà : focus visible absent, contraste insuffisant à l'œil, tap targets trop petits, ordre visuel incohérent avec le DOM. Inclure ces constats dans la critique.

---

## 6. Limites assumées

- **Coût des tokens vision** : un PNG = ~1-2k tokens. À 5 itérations, on parle de ~10k tokens vision pour la session. Reste raisonnable, mais éviter les screenshots fullpage massifs en série.
- **Pas de simulation d'interaction** : ce skill capture un état statique. Pour tester un parcours (clic → modal → soumission), passer par `testix` et un vrai test Playwright.
- **Pas de QA pixel-perfect** : c'est un outil d'observation et de critique, pas un outil de mesure pixel. Pour les diffs au pixel près (régression visuelle), `toHaveScreenshot()` Playwright est l'outil prévu.
- **Single-page only par défaut** : pour un parcours multi-pages, scripter chaque navigation séparément.

---

## 7. Anti-patterns à éviter

- **Boucler en silence** sans montrer le PNG à l'humain — perte de temps si on diverge
- **Critiquer sans regarder** : si Claude propose une modif sans avoir lu le PNG, le skill n'a servi à rien
- **Multiplier les viewports en parallèle** : disperse l'attention, dégrade la qualité
- **Capturer sans dev server à jour** : un hot reload manqué = on regarde la version d'avant
- **Confondre vision-loop et test E2E** : ce skill aide à concevoir, pas à valider en CI. Une fois stabilisé, demander à `testix` un test de non-régression visuelle.

---

## 8. Intégration avec les autres skills

- **`uidesigner`** route vers ce skill pour la phase « refonte ciblée d'une page existante » ou « polissage visuel post-port »
- **`ergonomix`** intervient sur la critique (lois IHM, charge cognitive) — peut consulter les PNG produits ici
- **`accessibilix`** approfondit l'audit a11y au-delà de l'observation visuelle (ARIA, clavier)
- **`testix`** fige la stabilité visuelle obtenue en test Playwright `toHaveScreenshot()` ou en assertions DOM

---

## 9. Règles opérationnelles

- **Toujours montrer le PNG à l'humain** avant la 3e itération sur un même problème
- **Toujours capturer mobile** au moins une fois par cycle de polissage
- **Ne jamais lancer la boucle** sans dev server confirmé démarré (perte de temps + faux positif)
- **Nettoyer `.claude/tmp/screenshots/`** régulièrement (pas en CI, mais quand le repo grossit)
- **Documenter dans le PR** le nombre d'itérations et les PNGs clés si la modif est visuelle
