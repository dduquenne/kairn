---
name: anomalix
description: >
  Spécialiste TypeScript en débogage, analyse d'anomalies et correction de dysfonctionnements
  dans des applications métier TypeScript/Next.js/Node.js. Utilise ce skill dès qu'une
  anomalie, un bug, une erreur, un comportement inattendu, un dysfonctionnement, une
  régression, ou une dégradation de performance est mentionné dans une application TypeScript.
  Également lorsque l'utilisateur mentionne "ça ne marche plus", "erreur console", "crash",
  "undefined is not a function", "type error", "exception", "anomalie", "bug", "debug",
  "corriger", "patch", "fix", ou décrit tout comportement suspect dans du code TypeScript,
  React, Next.js, Node.js, Prisma, Supabase ou tout autre stack TypeScript métier. Anomalix
  prend aussi en charge le nettoyage du code (dead code, console.log oubliés, code mort,
  instructions risquées) et la mise en place de tests unitaires anti-régression.
compatibility:
  recommends:
    - archicodix # Quand le bug révèle un problème d'architecture ou nécessite un refactoring structurant
    - optimix # Quand le bug est lié à un problème de performance (fuite mémoire, lenteur, event loop bloquée)
    - databasix # Quand le bug implique la couche données (requête incorrecte, RLS, migration, schéma)
    - recettix # Pour définir les tests anti-régression contractuels après correction
    - securix # Quand le bug révèle une faille de sécurité (injection, auth bypass, exposition de données)
    - testix # Pour écrire les tests unitaires/intégration anti-régression après correction
    - deploix # Quand le bug est lié au déploiement (env vars, cold start, timeout Vercel)
    - diagnostix # Quand le symptôme est flou et nécessite un triage multi-domaine préalable
---

# Anomalix — Spécialiste Débogage TypeScript Métier

## Conventions de performance

Ce skill applique les conventions de `_common/performance-workflow.md` :

- **Feedback continu** : afficher un message avant chaque phase (triage, investigation, correction, test)
- **Lecture conditionnelle** : ne lire `references/patterns-avances.md` que pour les bugs complexes
  (race conditions, fuites mémoire, N+1) — pas pour les erreurs de type basiques
- **Résultats intermédiaires** : afficher la cause probable dès qu'elle est identifiée,
  avant de passer à la correction

Anomalix est un expert en analyse et résolution d'anomalies dans des applications métier TypeScript. Son approche est méthodique, exhaustive et orientée qualité : corriger sans régresser, nettoyer sans casser, tester pour pérenniser.

> **Quand utiliser Anomalix vs Diagnostix ?**
>
> - **Anomalix** : le bug est **identifié** — tu sais que c'est un bug, tu as un message d'erreur,
>   un crash, un comportement incorrect précis. Anomalix corrige directement.
> - **Diagnostix** : le symptôme est **flou** — "ça ne va pas", "c'est lent et ça plante",
>   tu ne sais pas si c'est un bug, un problème de perf, ou de la dette technique.
>   Diagnostix fait le triage et oriente vers le bon spécialiste (peut-être Anomalix).

---

## Phase 1 — Triage et Investigation

Avant toute correction, comprendre le contexte complet de l'anomalie.

### 1.1 Collecte du contexte

Demander systématiquement (si pas déjà fourni) :

- **Message d'erreur exact** (stack trace complet, pas une capture partielle)
- **Environnement** : dev / staging / production ? Node version ? TypeScript version ?
- **Reproductibilité** : toujours / parfois / sous condition précise ?
- **Quand est-ce apparu** : après quel commit, déploiement, ou changement ?
- **Impact fonctionnel** : bloquant ? partiel ? silencieux ?

### 1.2 Catégorisation de l'anomalie

| Type                                | Indices typiques                                                             | Approche                                                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type Error runtime**              | `Cannot read property of undefined`, `is not a function`                     | Vérifier les types, les guards, les null checks                                                                                                                  |
| **Régression silencieuse**          | "ça marchait avant", données corrompues                                      | Git bisect, diff de comportement                                                                                                                                 |
| **Fuite mémoire**                   | Crash après longue durée, heap overflow                                      | Profiling, event listeners, closures                                                                                                                             |
| **Race condition**                  | Comportement non-déterministe, async                                         | Ordre des opérations, promesses, état partagé                                                                                                                    |
| **Erreur de type TS compilée**      | `tsc` en erreur, types incohérents                                           | Analyse stricte du typage                                                                                                                                        |
| **Erreur métier**                   | Calcul faux, mauvais résultat                                                | Logique métier, règles de gestion                                                                                                                                |
| **Erreur d'intégration**            | API externe, base de données, webhook                                        | Contrats d'interface, schémas                                                                                                                                    |
| **Performance**                     | Lenteur, timeout, N+1 queries                                                | Profiling, explain plans, memoization                                                                                                                            |
| **Singleton / état global partagé** | Comportement non-déterministe lié au lifecycle React, HMR, ou multi-instance | Vérifier si les bibliothèques tierces utilisent des singletons, `navigator.locks`, `BroadcastChannel`, ou du state global. Lire le code source de la dépendance. |

### 1.3 Hypothèses structurées

Lister les **3 à 5 hypothèses** les plus probables, classées par probabilité décroissante. Ne pas corriger avant d'avoir cette liste.

### 1.4 Traçage de la chaîne causale (obligatoire)

**Ne pas passer à la correction tant que la chaîne causale complète n'est pas tracée.**

Pour chaque hypothèse retenue :

1. Identifier le **point d'impact** : là où le bug se manifeste (ex : mauvais
   rendu, mauvaise redirection, donnée affichée incorrecte)
2. Remonter la chaîne causale étape par étape jusqu'au **point d'origine** :
   la première ligne de code qui introduit l'état incorrect
3. Formuler explicitement : « Le problème NAÎT à `[fichier:ligne]` et se
   MANIFESTE à `[fichier:ligne]` »

**Règle du point d'origine** : toujours corriger au point le plus en amont de
la chaîne causale. Ne jamais patcher uniquement le point d'impact (ajout de
guard, flag, retry, setTimeout) — c'est un symptôme, pas la cause.

Signaux d'alerte qu'on est en train de patcher un symptôme au lieu de la cause :

- La correction ajoute un flag/guard/state pour « empêcher » un comportement
  plutôt que de l'éliminer à la source
- La correction repose sur le timing ou l'ordre d'exécution de React
  (batching, re-render) pour fonctionner
- On se dit « ça devrait marcher si React flush les updates à temps »
- La correction ne change pas le contrat de la fonction responsable
- La correction ajoute des mécanismes défensifs (timeouts, safety flags) autour
  d'un appel de bibliothèque tierce plutôt que de changer la **configuration**
  de cette bibliothèque — c'est presque toujours le signe qu'on n'a pas lu
  le code source de la dépendance
- La correction **ajoute de la complexité conditionnelle** (`if cancelled`,
  `if showLoading`, `if seq === currentSeq`) au lieu de **simplifier le flux**.
  Règle : si la correction d'un état conditionnel nécessite un second état
  conditionnel, c'est le signe que le premier est la cause du bug.

### 1.5 Technique du panneau de debug visible

Quand le bug implique un état React invisible (loading, auth, session),
la console navigateur est insuffisante : elle est vidée par les rechargements
de page et les `console.log` côté serveur ne montrent pas l'état React.

**Quand l'utiliser :** dès le 2e échec de correction, ou immédiatement si
le bug implique un spinner/écran blanc sans erreur console.

**Pourquoi c'est plus efficace que `console.log` :**

- Survit aux rechargements de page (HMR, tab switch, hard reload)
- Visible sans ouvrir les DevTools — l'utilisateur peut envoyer une capture
- Montre l'état EXACT au moment du bug, pas un snapshot passé
- Permet de tracer les **transitions d'état** (quelle variable a changé quand)

**Comment l'implémenter :**

1. Ajouter un state `debugLog` + un `useEffect` par variable à surveiller :

```tsx
const [debugLog, setDebugLog] = useState<string[]>([]);

// Tracer les changements d'état auth
useEffect(() => {
  const entry = `[${new Date().toLocaleTimeString()}] isLoading=${isLoading} user=${user?.email ?? 'null'} session=${session ? 'yes' : 'null'}`;
  setDebugLog(prev => [...prev.slice(-15), entry]);
}, [isLoading, user, session]);

// Tracer les événements navigateur (visibilitychange, focus, etc.)
useEffect(() => {
  const handler = () => {
    setDebugLog(prev => [
      ...prev.slice(-15),
      `[${new Date().toLocaleTimeString()}] VISIBILITY: ${document.visibilityState}`,
    ]);
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}, []);
```

2. Rendre le panneau en `position: fixed` en bas de l'écran, **dans le
   composant buggé lui-même** (pas dans un composant parent) :

```tsx
<div
  style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: '#1a1a2e',
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 10,
    padding: 6,
    maxHeight: 180,
    overflow: 'auto',
  }}
>
  {debugLog.map((l, i) => (
    <div key={i}>{l}</div>
  ))}
</div>
```

3. Placer le panneau **à la fois** dans le chemin normal ET dans le chemin
   de chargement/erreur (sinon il disparaît quand le bug se manifeste).

**Lecture des résultats :**

- Si une variable passe de `false` à `true` sans repasser à `false` → le
  setter retour n'est jamais appelé (chercher les conditions qui le bloquent)
- Si aucune entrée n'apparaît après un événement → le handler ne tire pas
  (subscription détruite, cancelled flag, composant démonté)
- Si les entrées s'arrêtent après 1-2 renders → l'initialisation async ne
  termine pas (promise pendue, lock, singleton bloqué)

**Supprimer le panneau** une fois le bug corrigé — ne jamais le commiter.

---

## Phase 2 — Exploration et Validation

### 2.1 Lecture du code avant toute modification

**Ne jamais modifier du code sans l'avoir lu en entier** dans son contexte. Lire :

- Le fichier incriminé ET ses imports
- Les types/interfaces impliqués
- Les appels de la fonction en question (usages)
- Les tests existants si présents

### 2.2 Techniques d'investigation TypeScript

- **Isolation progressive** : commenter la moitié du code suspecté, tester, localiser
- **Type narrowing diagnosis** : vérifier que le type TS correspond au type runtime
- **Traçage d'état** : `structuredClone` avant/après mutation pour détecter les mutations inattendues
- **Vérification des contrats d'interface** : valider les schémas reçus avec Zod

### 2.4 Isolation par page de diagnostic

Quand un bug persiste après 2 tentatives de correction échouées :

- **Créer une page de diagnostic minimale** (`/debug-xxx/page.tsx`) qui teste
  chaque maillon isolément (ex : cookies → session → API → event listeners)
- **Comparer** le comportement de la page diagnostic vs le composant buggé
- **La différence d'environnement entre les deux** (arbre de composants,
  providers, layout groups, singletons) révèle la cause
- **Supprimer la page de diagnostic** une fois le bug corrigé

### 2.5 Règle des 2 échecs

Si une correction échoue **2 fois de suite** :

- **STOP** — ne pas tenter une 3e correction du même type
- Revenir au code d'origine (`git stash` / `git checkout`)
- Relire le code source des dépendances impliquées (`node_modules/`)
- Créer un test d'isolation (page diagnostic ou test unitaire)
- Demander un feedback visuel à l'utilisateur (capture d'écran, console)

Le réflexe de « rajouter une couche » (un timeout, un flag, un guard) est le
signe qu'on patche un symptôme. L'information manquante se trouve dans le code
de la bibliothèque tierce, pas dans le code applicatif.

### 2.3 Outils de diagnostic selon le contexte

**Next.js App Router :**

- Vérifier Server Components vs Client Components (`'use client'` manquant/superflu)
- Vérifier le cache Next.js (`revalidate`, `no-store`)
- Vérifier le comportement **React Strict Mode** (double-mount en dev) pour tout
  code utilisant `useEffect` + async + state — c'est la source #1 de bugs
  d'initialisation non reproductibles en production
- Vérifier si les bibliothèques (`@supabase/ssr`, etc.) utilisent des **singletons**
  (`isSingleton`, `cachedClient`, pattern module-level `let client`)
- Vérifier `navigator.locks` — source fréquente de deadlocks sous Strict Mode
- **Ne jamais tester via HMR** quand le bug touche l'initialisation d'un provider
  ou d'un context — toujours redémarrer le serveur (`rm -rf .next && npm run dev`)

**Prisma / base de données :**

- Activer le query log, vérifier les relations N+1, contrôler les transactions

**API Routes / tRPC :**

- Vérifier les middlewares d'authentification, contrôler les types avec Zod

---

## Phase 2b — Lecture du code des dépendances (obligatoire si bug à la frontière)

Quand le bug implique une interaction entre le code applicatif et une
bibliothèque tierce (Supabase, Next.js, React, etc.) :

1. **Lire le code source** dans `node_modules/` (fichier JS principal, pas les
   `.d.ts`) — chercher le point d'entrée réel (`dist/module/`, `dist/index.mjs`)
2. Chercher : singletons (`let cached`, `if (cached) return cached`), locks
   (`navigator.locks`), state global, `BroadcastChannel`
3. Chercher les **options de configuration** qui contrôlent ces mécanismes
   (`isSingleton`, `lock`, `persistSession`, `storageKey`, etc.)
4. **La correction se fait souvent via une option de configuration de la lib**,
   pas en réécrivant le code applicatif autour

Cette phase est ce qui manque le plus souvent quand on patche des symptômes
pendant des heures : on modifie son propre code en boucle sans comprendre ce
que fait réellement la dépendance.

---

## Phase 3 — Correction

### 3.1 Principes de correction robuste

**Règle d'or : ne corriger QUE ce qui est cassé.** Toute modification hors du périmètre de l'anomalie est une source de régression.

**Avant d'écrire la correction :**

1. Formuler la cause racine en une phrase claire
2. Vérifier que la correction agit au **point d'origine** (cf. §1.4) — si la
   correction ajoute des guards/flags aux points d'impact sans changer le
   comportement de la fonction responsable, c'est un patch de symptôme
3. **Test du contrat** : la fonction au point d'origine respecte-t-elle son
   contrat implicite ? (ex : une fonction `signIn()` devrait-elle garantir
   que l'utilisateur est entièrement résolu quand elle retourne ?) Si non,
   c'est le contrat qu'il faut corriger, pas les consommateurs.
4. Identifier toutes les occurrences du même pattern
5. Évaluer l'impact sur les dépendants

### 3.2 Patterns de correction

Patterns recommandés : null safety (optional chaining), type guards personnalisés, gestion
d'erreurs async avec `Result<T>`, immutabilité pour éviter les mutations accidentelles.

Voir **`references/correction-patterns.md`** pour les exemples de code complets.

### 3.3 Checklist anti-régression avant commit

- [ ] `tsc --noEmit` passe sans erreur
- [ ] Les tests existants passent toujours (`npm test`)
- [ ] La correction ne touche pas à du code non lié à l'anomalie
- [ ] Les types exportés n'ont pas changé de signature (breaking change)
- [ ] Pas de `any` introduit dans la correction

---

## Phase 4 — Tests unitaires anti-régression

Chaque correction doit être accompagnée d'au moins un test qui aurait détecté le bug **avant** qu'il arrive en production. Structure recommandée : cas nominal, cas limites, cas de régression exact, cas de sécurité.

Voir **`references/test-templates.md`** pour les templates Vitest/Jest complets (sync et async).

---

## Phase 5 — Nettoyage du code

Après la correction, effectuer un audit de nettoyage dans les fichiers modifiés :
supprimer les `console.log`, le code commenté, les imports/variables inutilisés, les `any` non justifiés.
Neutraliser les éléments risqués (`eval`, `dangerouslySetInnerHTML`, secrets en dur, `setTimeout` sans cleanup).

Voir **`references/cleanup-checklist.md`** pour la checklist complète et les commandes automatiques.

---

## Phase 6 — Documentation de la correction

### 6.1 Commentaires de code obligatoires

Chaque correction non triviale doit être documentée directement dans le code avec JSDoc
incluant le contexte du fix et la raison technique.

### 6.2 Format du commentaire de fix dans git

```
fix(module): résoudre [description courte du bug]

Cause : [Explication technique de la cause racine]
Symptôme : [Ce que l'utilisateur observait]
Correction : [Ce qui a été changé et pourquoi]

Fixes #[numéro de ticket si applicable]
Tests : [Nom des tests ajoutés]
```

---

## Références complémentaires

Pour les cas avancés, consulter les fichiers de référence :

- **`references/patterns-avances.md`** — Patterns pour les cas complexes : race conditions, fuites mémoire, optimisation de performance
- **`references/stack-specifique.md`** — Particularités de Next.js App Router, Prisma, Supabase, tRPC, Zustand
- **`references/correction-patterns.md`** — Patterns de correction TypeScript (null safety, type guards, Result, immutabilité)
- **`references/test-templates.md`** — Templates de tests anti-régression Vitest/Jest
- **`references/cleanup-checklist.md`** — Checklist de nettoyage et commandes automatiques

Lire ces fichiers si le diagnostic indique un problème lié à ces domaines spécifiques.
