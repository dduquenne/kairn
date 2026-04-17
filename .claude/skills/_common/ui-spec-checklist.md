# Checklist UI — Consultation obligatoire des specs et maquettes

Ce fichier est le point de référence commun pour les skills **ergonomix** et
**maquettix**. Avant toute création ou modification d'écran, les deux skills
DOIVENT suivre cette checklist.

---

## 1. Specs → Maquettes → Wireframes

| Specs fonctionnelles          | Maquettes SVG            | Wireframes                              |
| ----------------------------- | ------------------------ | --------------------------------------- |
| `docs/specs/` (si existantes) | `docs/mockups/MAQ-*.svg` | `docs/specs/wireframes/wireframe-*.png` |

### Inventaire des maquettes et wireframes

**Maquettes SVG :**
| Réf. | Écran | Fichier |
|---|---|---|
| MAQ-01 | Page d'accueil praticien (public) | `docs/mockups/MAQ-01-accueil-praticien.svg` |
| MAQ-02 | Page blog / liste d'articles | `docs/mockups/MAQ-02-blog-liste.svg` |
| MAQ-03 | Article de blog (détail) | `docs/mockups/MAQ-03-blog-article.svg` |
| MAQ-04 | Page services / prestations | `docs/mockups/MAQ-04-services.svg` |
| MAQ-05 | Page témoignages | `docs/mockups/MAQ-05-temoignages.svg` |
| MAQ-06 | Page séminaires | `docs/mockups/MAQ-06-seminaires.svg` |
| MAQ-07 | Dashboard admin — vue d'ensemble | `docs/mockups/MAQ-07-dashboard-admin.svg` |
| MAQ-08 | Dashboard admin — gestion blog / éditeur | `docs/mockups/MAQ-08-admin-blog-editeur.svg` |
| MAQ-09 | Dashboard admin — analytics | `docs/mockups/MAQ-09-admin-analytics.svg` |

**Wireframes :**
| Réf. | Écran | Fichier |
|---|---|---|
| WIR-01 | Page d'accueil praticien | `docs/specs/wireframes/wireframe-01-accueil-praticien.png` |
| WIR-02 | Page blog / liste d'articles | `docs/specs/wireframes/wireframe-02-blog-liste.png` |
| WIR-03 | Article de blog (détail) | `docs/specs/wireframes/wireframe-03-blog-article.png` |
| WIR-04 | Page services / prestations | `docs/specs/wireframes/wireframe-04-services.png` |
| WIR-05 | Page témoignages | `docs/specs/wireframes/wireframe-05-temoignages.png` |
| WIR-06 | Dashboard admin — vue d'ensemble | `docs/specs/wireframes/wireframe-06-dashboard-admin.png` |
| WIR-07 | Dashboard admin — gestion blog | `docs/specs/wireframes/wireframe-07-admin-blog.png` |

---

## 2. Palette de couleurs — multi-tenant via `site.config.ts`

Kairn est une plateforme multi-tenant. Chaque site praticien définit sa propre
palette de couleurs dans son fichier `apps/<site>/site.config.ts`. Les couleurs
sont injectées comme variables CSS Tailwind.

### Exemple : Psypnos (`apps/psypnos/site.config.ts`)

| Rôle                       | Variable Tailwind | Couleur   |
| -------------------------- | ----------------- | --------- |
| Primary                    | `primary`         | `#d4af37` |
| Secondary                  | `secondary`       | `#1a1a2e` |
| + accents définis par site |

### Conventions Tailwind

- Les composants partagés (`@kairn/ui`) utilisent les classes Tailwind génériques :
  `bg-primary`, `text-secondary`, `border-accent`, etc.
- Chaque site configure ses valeurs dans `site.config.ts` → `theme.colors`
- Les polices sont aussi par site : `theme.fonts.display` et `theme.fonts.body`
- Consulter le `site.config.ts` du site ciblé pour la palette exacte

---

## 3. Checklist obligatoire avant toute création/modification d'écran

Avant de coder un composant UI ou de produire une maquette SVG :

- [ ] **Consulter le `site.config.ts`** du site ciblé pour la palette et les
      polices
- [ ] **Consulter la maquette SVG** de l'écran cible (si existante) dans
      `docs/mockups/`
- [ ] **Consulter le wireframe** de l'écran cible (si existant) dans
      `docs/specs/wireframes/`
- [ ] **Vérifier la palette de couleurs** dans le `site.config.ts` du site ciblé
- [ ] **Identifier les composants existants réutilisables** dans
      `packages/ui/src/components/` et `packages/admin/src/components/`
- [ ] **Vérifier la cohérence** avec les écrans déjà implémentés

---

## 4. Règles d'utilisation

1. **Ergonomix** : doit consulter cette checklist AVANT toute création ou
   modification de composant UI. Les composants partagés vivent dans `@kairn/ui`
   et `@kairn/admin`. Les composants spécifiques au site vivent dans
   `apps/<site>/components/`.

2. **Maquettix** : doit consulter cette checklist AVANT toute génération de
   SVG. Les maquettes existantes définissent le style visuel de référence.

3. **Si aucune maquette n'existe** pour l'écran ciblé, le signaler
   explicitement et proposer de créer la maquette en se basant sur le
   `site.config.ts` du site ciblé et les conventions des écrans existants.
