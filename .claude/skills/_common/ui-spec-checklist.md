# Checklist UI — Consultation obligatoire des specs et maquettes

Ce fichier est le point de référence commun pour les skills **ergonomix** et
**maquettix**. Avant toute création ou modification d'écran, les deux skills
DOIVENT suivre cette checklist.

---

## 1. Specs → Maquettes → Wireframes

| Specs fonctionnelles (SFD)                                        | Maquettes SVG            | Wireframes                              |
| ----------------------------------------------------------------- | ------------------------ | --------------------------------------- |
| `docs/specs/SPC-0003-specifications-fonctionnelles-links-v1.0.md` | `docs/mockups/MAQ-*.svg` | `docs/specs/wireframes/wireframe-*.png` |

### Inventaire des maquettes et wireframes

**Maquettes SVG :**
| Réf. | Écran | Fichier |
|---|---|---|
| MAQ-01 | Connexion | `docs/mockups/MAQ-01-login.svg` (+ v2) |
| MAQ-02 | Dashboard bénéficiaire | `docs/mockups/MAQ-02-dashboard-beneficiaire.svg` |
| MAQ-03 | Saisie de phase | `docs/mockups/MAQ-03-saisie-phase.svg` |
| MAQ-04 | Dashboard consultant | `docs/mockups/MAQ-04-dashboard-consultant.svg` |
| MAQ-05 | Fiche bénéficiaire (consultant) | `docs/mockups/MAQ-05-fiche-beneficiaire-consultant.svg` |
| MAQ-06 | Comptes rendus | `docs/mockups/MAQ-06-comptes-rendus.svg` |
| MAQ-07 | Dashboard admin | `docs/mockups/MAQ-07-dashboard-admin.svg` |
| MAQ-08 | Gestion utilisateurs | `docs/mockups/MAQ-08-gestion-utilisateurs.svg` |
| MAQ-09 | Planification | `docs/mockups/MAQ-09-planification.svg` |

**Wireframes :**
| Réf. | Écran | Fichier |
|---|---|---|
| WIR-01 | Connexion | `docs/specs/wireframes/wireframe-01-connexion.png` |
| WIR-02 | Dashboard bénéficiaire | `docs/specs/wireframes/wireframe-02-dashboard-beneficiaire.png` |
| WIR-03 | Saisie de phase | `docs/specs/wireframes/wireframe-03-saisie-phase.png` |
| WIR-04 | Dashboard consultant | `docs/specs/wireframes/wireframe-04-dashboard-consultant.png` |
| WIR-05 | Fiche bénéficiaire | `docs/specs/wireframes/wireframe-05-fiche-beneficiaire.png` |
| WIR-06 | Dashboard admin | `docs/specs/wireframes/wireframe-06-dashboard-admin.png` |
| WIR-07 | Comptes rendus | `docs/specs/wireframes/wireframe-07-comptes-rendus.png` |

---

## 2. Palette de couleurs (`src/styles/theme.css` — SPC-0003 RT-04)

| Rôle             | Variable CSS           | Couleur             |
| ---------------- | ---------------------- | ------------------- |
| Primary          | `--color-primary`      | `#1E6FC0`           |
| Primary dark     | `--color-primary-dark` | `#0D3B6E`           |
| Secondary        | `--color-secondary`    | `#0EA5E9`           |
| Accent / Warning | `--color-accent`       | `#FF6B35`           |
| Success          | `--color-success`      | `#28A745`           |
| Background       | `--color-background`   | `#F5F7FA`           |
| Text             | `--color-text`         | `#4A4A4A`           |
| Border           | `--color-border`       | `#DCE1EB`           |
| Font             | `--font-family`        | `Inter, sans-serif` |

---

## 3. Checklist obligatoire avant toute création/modification d'écran

Avant de coder un composant UI ou de produire une maquette SVG :

- [ ] **Lire la SFD** : trouver la User Story et les règles de
      gestion de l'écran dans la spécification fonctionnelle
- [ ] **Consulter la maquette SVG** de l'écran cible (si existante) dans
      `docs/mockups/`
- [ ] **Consulter le wireframe** de l'écran cible (si existant) dans
      `docs/specs/wireframes/`
- [ ] **Vérifier la palette de couleurs** dans
      `src/styles/theme.css`
- [ ] **Identifier les composants existants réutilisables** dans
      `src/components/`
- [ ] **Vérifier la cohérence** avec les écrans déjà implémentés

---

## 4. Règles d'utilisation

1. **Ergonomix** : doit consulter cette checklist AVANT toute création ou
   modification de composant UI. La SFD définit les données affichées, les
   actions disponibles, les règles de validation et les rôles autorisés.

2. **Maquettix** : doit consulter cette checklist AVANT toute génération de
   SVG. Les maquettes existantes définissent le style visuel de référence.

3. **Si aucune SFD ou maquette n'existe** pour l'écran ciblé, le signaler
   explicitement et proposer de créer la maquette en se basant sur la charte
   visuelle (theme.css) et les conventions des écrans existants.
