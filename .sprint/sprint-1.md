# Sprint 1 — Intégration image séminaire dans posts sociaux IA

**Période :** 2026-04-20 → 2026-04-27
**Issues :** 7 au total (2 fondations, 3 extensions, 2 finalisation/tests)
**Branche :** `claude/add-seminar-image-posts-YutTV`
**Source :** Plan Pilotix validé le 2026-04-20
**Feature parente :** Lors de la génération assistée par IA de posts de publication des séminaires sur les réseaux sociaux, intégrer l'image du séminaire concerné dans le post.

---

## Contexte métier

L'administrateur d'un site Kairn (psypnos / avv) utilise le modal `SeminarSocialModal` pour générer par IA des posts Facebook/Instagram/LinkedIn/Threads/Twitter pour un séminaire donné. Aujourd'hui :

- `seminar.thumbnail` est bien lu côté backend et propagé dans `suggestedMediaUrl` → `SocialPost.mediaUrls[0]` (chaîne déjà câblée).
- **MAIS** aucun preview image n'est affiché à l'admin avant création du post, aucune validation ne bloque si `thumbnail` est absent, et aucun override image n'est possible.
- Le composant est dupliqué entre `apps/psypnos` et `apps/avv`.

## Décisions produit actées

| Question | Décision |
|----------|----------|
| Périmètre | Pipeline + UI existante (pas de nouveau flow) |
| Sites cibles | psypnos **et** avv — mutualisation dans `packages/admin` |
| Fallback si thumbnail absent | Bloquer avec 422 explicite |
| Override image | Oui, upload Supabase Storage uniquement (pas d'URL externe) |

---

## Checklist exhaustive

| Ordre | Issue | Titre                                                 | Priorité | Phase | Skill principal | Dépend de        | Statut |
| ----- | ----- | ----------------------------------------------------- | -------- | ----- | --------------- | ---------------- | ------ |
| 1     | #456  | Validation backend (422 si thumbnail absent)          | 🟠 Haute | 1     | `apix`          | —                | ⬜     |
| 2     | #457  | Mutualiser `SeminarSocialModal` dans `@kairn/admin`   | 🟠 Haute | 1     | `archicodix`    | —                | ⬜     |
| 3     | #459  | Ajuster prompts séminaire (image garantie)            | 🟢 Feat  | 2     | `archicodix`    | #456             | ⬜     |
| 4     | #458  | Preview image dans le modal                           | 🟢 Feat  | 2     | `ergonomix`     | #457             | ⬜     |
| 5     | #460  | Override image via upload Supabase                    | 🟢 Feat  | 2     | `ergonomix`     | #458             | ⬜     |
| 6     | #461  | Wrappers apps + suppression duplication               | 🟢 Feat  | 3     | `archicodix`    | #457, #458, #460 | ⬜     |
| 7     | #462  | Tests bout-en-bout (unit + UI + intégration)          | 🟠 Haute | 3     | `testix`        | #456–#460        | ⬜     |

**Effort total estimé :** M — ~4,5 jours homme (2×0,5 + 3×0,5 + 1 + 1 + 1)

---

## Phase 1 — Fondations (parallélisable)

Les issues #456 et #457 n'ont aucune dépendance entre elles et peuvent être traitées en parallèle.

| Ordre | Issue | Titre                                        | Skills                | Dépend de | Review |
| ----- | ----- | -------------------------------------------- | --------------------- | --------- | ------ |
| 1     | #456  | Validation backend 422 si thumbnail absent   | `apix`, `securix`     | —         | —      |
| 2     | #457  | Mutualiser SeminarSocialModal                | `archicodix`, `ergonomix` | —     | —      |

**Point de contrôle Phase 1 :**

- [ ] `pnpm turbo run build --filter='...[HEAD~1]'` passe
- [ ] `pnpm test:coverage` passe (seuils 60%)
- [ ] `pnpm turbo run lint --filter='...[HEAD~1]'` passe
- [ ] `git status --porcelain` vide
- [ ] Les 2 commits ferment #456 et #457 (`closes #N`)

---

## Phase 2 — Extension (séquentielle : #459 parallélisable avec #458 → #460)

| Ordre | Issue | Titre                          | Skills                              | Dépend de | Review |
| ----- | ----- | ------------------------------ | ----------------------------------- | --------- | ------ |
| 3     | #459  | Ajustement prompts séminaire   | `archicodix`                        | #456      | —      |
| 4     | #458  | Preview image dans le modal    | `ergonomix`, `accessibilix`         | #457      | —      |
| 5     | #460  | Override image via upload      | `ergonomix`, `apix`, `securix`      | #458      | ⚠️ REVIEW (sécurité upload) |

> **Note #460 — REVIEW sécurité :** l'ajout d'upload nécessite validation MIME stricte, limite de taille, et audit `securix` avant merge (SSRF, types de fichiers acceptés, CSRF). Sprintix doit mettre en pause à la fin de cette issue et demander validation humaine.

**Point de contrôle Phase 2 :**

- [ ] `pnpm turbo run build` passe
- [ ] `pnpm test:coverage && pnpm test:ui` passent
- [ ] `pnpm test:a11y` passe pour les composants modifiés
- [ ] Review `securix` de #460 faite et résolue
- [ ] Les 3 commits ferment #459, #458, #460

---

## Phase 3 — Finalisation & validation (séquentielle)

| Ordre | Issue | Titre                                    | Skills       | Dépend de        | Review |
| ----- | ----- | ---------------------------------------- | ------------ | ---------------- | ------ |
| 6     | #461  | Wrappers apps + suppression duplication  | `archicodix` | #457, #458, #460 | —      |
| 7     | #462  | Tests bout-en-bout                       | `testix`     | #456–#460        | —      |

**Point de contrôle Phase 3 :**

- [ ] Pipeline full monorepo vert (`pnpm turbo run build && pnpm test:coverage && pnpm turbo run lint`)
- [ ] Aucune duplication `SeminarSocialModal` restante (`grep -r "SeminarSocialModal" apps/ | grep -v Wrapper` doit être vide)
- [ ] Couverture ≥ 60% sur fichiers touchés
- [ ] Test manuel OK sur psypnos **et** avv (ouvrir modal → generate → preview image → override → créer post)
- [ ] Les 2 commits ferment #461 et #462

---

## Vérification d'exhaustivité

- [x] Toutes les issues du sprint sont listées ci-dessus (7/7)
- [x] Aucune issue n'a été omise ou reportée sans justification
- [x] L'ordre respecte : prérequis bloquants → extensions → tests finaux
- [x] Les dépendances sont cohérentes avec les bodies GitHub des issues
- [x] Une review sécurité est explicitement planifiée pour #460 (upload)

---

## Lancement

Pour démarrer l'exécution :

```
/sprintix run 1
```

Sprintix traitera les 7 issues dans l'ordre, avec points de contrôle inter-phase et pause review sur #460.
