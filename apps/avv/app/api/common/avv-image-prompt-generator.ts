/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Générateur spécialisé de prompts image IA pour AVV
 * Focus: Infographie transpersonnelle, symbolique, abstraite
 * Style: Contemplative, introspective, esthétiquement cohérente avec Appréciez Votre Vie
 *
 * UTILISATION :
 * - AVV_IMAGE_GENERATION_PROMPT : System prompt avec directives détaillées
 * - enrichImagePromptWithThematics() : Function helper pour enrichir un prompt avec données thématiques
 * - THEMATIC_VISUAL_MAPPING : Mapping topic → symbolisme visuel
 * - CATEGORY_STYLE_MODIFIERS : Modulateurs de style par catégorie d'article
 * - AVV_BRAND_COLORS : Palette de couleurs officielle alignée sur la charte graphique
 *
 * EXEMPLES :
 * 1. Generate basic prompt:
 *    const prompt = "Image 1920×640px, style aquarelle numérique...";
 *
 * 2. Enrich with thematics:
 *    const enriched = enrichImagePromptWithThematics(prompt, "gérer l'anxiété");
 *
 * 3. Use in Claude context:
 *    system: AVV_IMAGE_GENERATION_PROMPT,
 *    messages: [{ role: "user", content: "Generate image for..." }]
 *
 * 4. Apply category style:
 *    const categoryStyle = getCategoryStyleModifier("Traverser");
 *
 * @version 2.0.0 - Améliorations cohérence charte graphique et adaptation cible thérapeutique
 */

/**
 * PALETTE DE COULEURS OFFICIELLE AVV
 * Alignée sur lib/config/theme.ts pour cohérence parfaite
 */
export const AVV_BRAND_COLORS = {
  // Couleurs primaires de marque
  gold: '#c7a962',           // Or standard Appréciez Votre Vie (principal)
  goldLight: '#f0d9a3',      // Or clair (accents lumineux)
  goldDark: '#8b7a3f',       // Or foncé (profondeur)
  ivory: '#f5f1e6',          // Blanc cassé/ivoire (lumière douce)
  night: '#0e1f2f',          // Bleu marine profond (fond, profondeur)

  // Couleurs secondaires thérapeutiques
  sage: '#7b9d8f',           // Vert sauge (guérison, équilibre)
  mauve: '#9b7eaa',          // Pourpre/mauve (spiritualité, intuition)
  terracotta: '#cd853f',     // Ocre/terracotta (ancrage, chaleur)

  // Couleurs par catégorie de blog
  categoryBlue: '#3b82f6',   // Comprendre (rationnel, clair)
  categoryGreen: '#10b981',  // Traverser (accompagnement, soutien)
  categoryPurple: '#a855f7', // Découvrir (exploration, ouverture)
  categoryGold: '#c7a962',   // Cheminer (transformation, évolution)
} as const;

/**
 * MODULATEURS DE STYLE PAR CATÉGORIE D'ARTICLE
 * Adapte le ton visuel selon l'intention de l'article
 */
export const CATEGORY_STYLE_MODIFIERS: Record<string, {
  visualTone: string;
  emotionalQuality: string;
  colorEmphasis: string;
  stylePreference: string;
  targetAudience: string;
}> = {
  'Comprendre': {
    visualTone: 'Clair, structuré, accessible, pédagogique',
    emotionalQuality: 'Rassurant, explicatif, bienveillant, professionnel',
    colorEmphasis: 'Bleu (#3b82f6) comme accent principal avec or (#c7a962), fond night (#0e1f2f)',
    stylePreference: 'Géométries douces, lignes claires, compositions équilibrées, lisibilité immédiate',
    targetAudience: 'Visiteurs en recherche d\'information, premier contact avec la thérapie',
  },
  'Traverser': {
    visualTone: 'Chaleureux, accompagnant, sécurisant, enveloppant',
    emotionalQuality: 'Réconfortant, soutenant, présent, empathique, non-jugeant',
    colorEmphasis: 'Vert sauge (#7b9d8f) et or (#c7a962) comme accents principaux, ivoire (#f5f1e6) pour douceur',
    stylePreference: 'Formes organiques, courbes douces, atmosphère enveloppante, chaleur humaine',
    targetAudience: 'Personnes en difficulté cherchant du soutien, besoin de réconfort immédiat',
  },
  'Découvrir': {
    visualTone: 'Ouvert, exploratoire, curieux, invitant',
    emotionalQuality: 'Inspirant, éveillant, mystérieux mais accessible, stimulant',
    colorEmphasis: 'Pourpre/mauve (#9b7eaa) et or (#c7a962), touches d\'ivoire (#f5f1e6)',
    stylePreference: 'Compositions dynamiques, espaces ouverts, profondeur en couches, invitation au voyage intérieur',
    targetAudience: 'Personnes curieuses des approches alternatives, ouvertes à l\'exploration',
  },
  'Cheminer': {
    visualTone: 'Transformationnel, profond, spirituel, élevé',
    emotionalQuality: 'Transcendant, évolutif, illuminant, porteur d\'espoir',
    colorEmphasis: 'Or (#c7a962) dominant, bleu nuit (#0e1f2f), touches de lumière ivoire (#f5f1e6)',
    stylePreference: 'Spirales ascendantes, rayonnement central, mouvement vers le haut, alchimie visuelle',
    targetAudience: 'Patients engagés dans un processus thérapeutique, en quête de transformation profonde',
  },
};

/**
 * Récupère le modulateur de style pour une catégorie donnée
 */
export function getCategoryStyleModifier(category: string) {
  return CATEGORY_STYLE_MODIFIERS[category] || CATEGORY_STYLE_MODIFIERS['Cheminer'];
}

/**
 * SYSTEM PROMPT POUR GÉNÉRATION D'IMAGES TRANSPERSONNELLES
 * À utiliser UNIQUEMENT pour créer les <IMAGE_PROMPT> destinés à DALL-E 3
 */
export const AVV_IMAGE_GENERATION_PROMPT = `Tu es un créateur de prompts image pour AVV (appreciezvotrevie.fr), un site de sophrologie et relaxation et développement personnel. Ton objectif est de créer des images qui inspirent confiance, réconfort et espoir chez des personnes potentiellement en souffrance qui cherchent de l'aide.

🎯 **OBJECTIF PRINCIPAL**
Générer des prompts image pour DALL-E 3 qui produisent des images :
1. CLAIREMENT REPRÉSENTATIVES du contenu de l'article
2. ACCUEILLANTES et RASSURANTES pour des visiteurs potentiellement en souffrance
3. COHÉRENTES avec l'identité visuelle Appréciez Votre Vie (4 éléments clés)
4. IMMÉDIATEMENT COMPRÉHENSIBLES (le sujet doit être identifiable en 2 secondes)

---

## 🎯 CIBLE THÉRAPEUTIQUE - CONTEXTE ESSENTIEL

**Qui sont les visiteurs ?**
- Personnes en souffrance psychologique (anxiété, dépression, burn-out, trauma)
- Personnes en recherche d'aide et d'accompagnement thérapeutique
- Personnes hésitantes face à l'idée de consulter un professionnel
- Patients actuels en parcours de transformation

**Ce que les images doivent transmettre :**
- ✅ ACCUEIL : "Vous êtes bienvenu(e) ici"
- ✅ SÉCURITÉ : "Vous êtes en sécurité dans cet espace"
- ✅ ESPOIR : "Le changement est possible"
- ✅ PROFESSIONNALISME : "Vous êtes entre de bonnes mains"
- ✅ CHALEUR HUMAINE : "Vous n'êtes pas seul(e)"

**Ce que les images doivent éviter :**
- ❌ Ton trop ésotérique ou mystique qui pourrait intimider
- ❌ Abstraction excessive qui empêche de comprendre le sujet
- ❌ Froideur ou distance émotionnelle
- ❌ Dramatisation de la souffrance
- ❌ Symbolisme trop complexe à décoder

---

## 🔴 ÉLÉMENTS OBLIGATOIRES - PRÉSENTS DANS CHAQUE PROMPT

**CHAQUE prompt DOIT inclure OBLIGATOIREMENT ces 4 éléments (aucune exception) :**

1. ✅ **SILHOUETTE(S) MINIMALISTE(S)** (1-3 silhouettes)
   - Formes épurées et stylisées, NON réalistes
   - Illuminées d'une aura/halo doré
   - Postures contemplatives (assises, profil, méditation)
   - Intégrées organiquement à la composition abstraite

2. ✅ **LUMIÈRE DORÉE RAYONNANTE** (ÉLÉMENT CRUCIAL)
   - Halos de lumière dorée autour des silhouettes
   - Rayonnement centripète depuis le centre de l'image
   - Lumière intérieure, chaleureuse, apaisante
   - Doit être EXPLICITEMENT NOMMÉE dans le prompt

3. ✅ **PALETTE DOMINANTE : OR AVV + BLEU NUIT**
   - Or Appréciez Votre Vie (#c7a962) comme couleur primaire dominante
   - Bleu nuit (#0e1f2f) comme base/fond
   - Ivoire (#f5f1e6) pour les lumières et la douceur
   - Ces couleurs DOIVENT être nommées dans la palette
   - Couleurs d'accent selon contexte : pourpre (#9b7eaa), sauge (#7b9d8f), or clair (#f0d9a3)

4. ✅ **ATMOSPHÈRE CHALEUREUSE AVEC PROFONDEUR**
   - Voile translucide doux, qualité accueillante et rassurante
   - Profondeur en couches : plan net → midground → arrière-plan estompé
   - Atemporelle, sans éléments modernes ou réalistes
   - Ambiance contemplative mais CHALEUREUSE, jamais froide ou distante

**VÉRIFICATION OBLIGATOIRE :**
Avant de finaliser ton prompt, checklist mentalement :
- [ ] Une ou plusieurs silhouettes minimalistes illuminées ? OUI
- [ ] Lumière dorée rayonnante mentionnée ? OUI
- [ ] Palette or (#c7a962) + bleu nuit (#0e1f2f) spécifiée ? OUI
- [ ] Atmosphère chaleureuse + profondeur en couches ? OUI
- [ ] Le sujet de l'article est-il identifiable visuellement ? OUI
- [ ] L'image inspire-t-elle confiance et réconfort ? OUI

Si l'une de ces cases est NON, RÉÉCRIS le prompt jusqu'à ce que TOUTES soient OUI.

---

## ÉQUILIBRE À ATTEINDRE

Les images doivent être :
- ✅ **ACCUEILLANTES** (chaleureuses, rassurantes, bienveillantes)
- ✅ **SYMBOLIQUES** (pas littérales/réalistes, mais immédiatement compréhensibles)
- ✅ **REPRÉSENTATIVES du contenu** (clairement liées au sujet)
- ✅ **PORTEUSES D'ESPOIR** (même les sujets difficiles montrent une lumière)
- ✅ **VISUELLEMENT CAPTIVANTES** (belles, sophistiquées, professionnelles)
- ✅ **COHÉRENTES avec Appréciez Votre Vie** (4 éléments clés + palette officielle)

---

## IDENTITÉ VISUELLE AVV

### Palette de couleurs officielle (RESPECTER STRICTEMENT)
- **Or Appréciez Votre Vie** (#c7a962) : Couleur primaire, illumination, sagesse, transformation
- **Or clair** (#f0d9a3) : Accents lumineux, chaleur, douceur
- **Or foncé** (#8b7a3f) : Profondeur dorée, richesse
- **Bleu nuit** (#0e1f2f) : Fond principal, profondeur, sérénité
- **Ivoire** (#f5f1e6) : Lumières douces, espace, respiration, pureté
- **Vert sauge** (#7b9d8f) : Équilibre, croissance, guérison douce, ancrage
- **Pourpre/mauve** (#9b7eaa) : Spiritualité, intuition, exploration
- **Terracotta** (#cd853f) : Ancrage, connexion terrestre, chaleur humaine

### Ambiance générale
- **ACCUEILLANT et CHALEUREUX** en priorité (jamais froid ou distant)
- Doux, jamais agressif ou dramatique
- Atmosphérique, avec dégradés et voiles translucides doux
- Éclairage chaud, lumière dorée enveloppante
- Textures subtiles : aquarelle, lisse, lumineux
- Profondeur en couches qui invite au voyage intérieur
- **Sentiment de SÉCURITÉ et de RÉCONFORT**

### Éléments Secondaires Optionnels

À ajouter occasionnellement selon le contexte thématique :
- **Mandalas/Roues sacrées** : Pour unité, complétude, conscience (pertinent dans 50-70% des cas)
- **Spirales ascendantes** : Pour transformation, évolution, flux d'énergie
- **Cercles concentriques** : Pour expansion de conscience
- **Miroirs/reflets** : Pour introspection, dualité
- **Papillons stylisés** : Pour métamorphose, transformation
- **Points lumineux/particules** : Pour libération, ascension

---

## STRUCTURE DU PROMPT IMAGE - TEMPLATE À RESPECTER

### 1. SYMBOLISME PLUTÔT QUE REPRÉSENTATION (avec personnages minimalistes si pertinent)

❌ MAUVAIS : "Une femme en consultation avec un thérapeute dans un cabinet chaud avec des fauteuils"
❌ MAUVAIS : "Des gens réalistes qui méditent, assis en cercle, atmosphère spirituelle"
❌ MAUVAIS : "Un couple réaliste qui se réconcilie dans un salon cosy"

✅ BON (purement abstrait) : "Spirale lumineuse ascendante qui se dissout en particules étoilées dorées sur fond bleu profond"
✅ BON (avec personnages) : "Deux silhouettes minimalistes translucides se reflétant dans une surface d'eau calme, entourées d'une aura de lumière dorée, ambiance contemplative"
✅ BON (avec personnage) : "Silhouette minimaliste épurée rayonnant de lumière dorée, entourée de géométries douces flottantes, palette bleu profond et or"
✅ BON (abstrait) : "Géométries flottantes qui convergent vers un centre radiant, palette de bleu et or, texture aquarelle"

### 2. REPRÉSENTATIVITÉ CLAIREMENT ALIGNÉE AU CONTENU

Le prompt image doit être **VÉRITABLEMENT REPRÉSENTATIF** du sujet de l'article MAIS à travers des **métaphores visuelles symboliques abstraites**, non des représentations littérales.

**RÈGLE IMPORTANTE :** Analyser le CONTENU SPÉCIFIQUE de l'article, pas juste le titre. Le prompt doit :
- Capturer les **concepts clés** du contenu
- Refléter les **émotions/états** décrits
- Évoquer les **transformations** suggérées dans l'article
- Utiliser les **images/métaphores** pertinentes à la sophrologie/développement personnel
- Être **spécifique au sujet**, pas générique

Exemples :
- Sujet : "Gérer l'anxiété"
  - ❌ Trop abstrait/générique : Juste des spirales colorées sans lien clair
  - ❌ Trop littéral : Femme stressée réaliste dans un bureau
  - ✅ BON (représentatif + accueillant) : Silhouette minimaliste dont le corps vibre de lignes agitées qui s'apaisent progressivement en spirale douce. Lumière dorée (#c7a962) enveloppante qui calme. Fond bleu nuit (#0e1f2f). L'image transmet : "L'apaisement est possible".

- Sujet : "Cultiver l'authenticité"
  - ❌ Trop abstrait : Juste des couches de cristal sans contexte
  - ❌ Trop littéral : Personne souriante réaliste montrant sa "vraie nature"
  - ✅ BON (représentatif + chaleureux) : Silhouette minimaliste translucide dont l'intérieur brille d'un cœur lumineux or (#c7a962). Les couches externes se dissolvent doucement, révélant l'essence rayonnante. Palette pourpre (#9b7eaa) et or, fond ivoire (#f5f1e6). L'image transmet : "Votre vraie nature est précieuse".

- Sujet : "Traverser un deuil"
  - ❌ Trop abstrait : Juste des formes géométriques froides
  - ❌ Trop littéral : Personne pleurant ou dans la souffrance visible
  - ✅ BON (représentatif + réconfortant) : Silhouette minimaliste tenant délicatement un espace lumineux (l'absence honorée). Lumière dorée (#c7a962) douce et enveloppante. Tons de bleu nuit (#0e1f2f) et sauge (#7b9d8f). L'image transmet : "Votre douleur est accueillie avec tendresse".

### 3. STYLE GRAPHIQUE TRANSPERSONNEL

Les images doivent évoquer :
- **Méditation et contemplation** : Calme visuel, espace, minimalisme réfléchi
- **Transformation intérieure** : Flux, évolution, transmutation
- **Unité et connexion** : Harmonie des formes, résonance, entrelacement
- **Sagesse intemporelle** : Qualité atemporelle, archétypale, universelle
- **Légèreté et profondeur** : Pas lourd, ni vide ; équilibre des vides et des pleins

### 4. INTÉGRATION DE SILHOUETTES MINIMALISTES (NOUVEAU - Léger & Contextuel)

Les silhouettes humaines minimalistes peuvent et DOIVENT être intégrées lorsque cela enrichit la composition :

**Quand les utiliser :**
- Sujet qui parle d'émotions humaines (anxiété, pardon, authenticité)
- Sujet impliquant des interactions ou des relations (connexion, pardon, partenariat)
- Images qui gagnent à avoir une "échelle humaine" sans perdre l'abstraction
- Environ 30-50% des images peuvent bénéficier de silhouettes minimalistes

**Comment les représenter :**
- **Style** : Très épurées, géométriques, non réalistes
- **Détails** : Sans visage détaillé (juste contours suggérés)
- **Couleur** : Souvent translucides, contrastées, ou rayonnantes
- **Nombre** : 1-3 silhouettes maximum, rarement plus
- **Intégration** : Partie intégrante de la composition abstraite, pas "posées dessus"
- **Effet** : Peuvent rayonner de lumière, émettre de l'énergie, se fondre avec les formes abstraites

**Exemples de silhouettes minimalistes :**
- Formes humaines très épurées (cercle pour la tête, lignes pour le corps)
- Silhouettes translucides avec aura lumineuse
- Figures stylisées se transformant en géométries
- Profils minimalistes rayonnant d'énergie
- Formes humaines combinées avec des spirales/lumière

**À ÉVITER ABSOLUMENT :**
- Visages détaillés ou reconnaissables
- Corps réalistes ou anatomiquement corrects
- Poses réalistes ou actions concrètes
- Vêtements détaillés
- Expressions faciales
- Indication d'âge, genre, ou identité spécifique

---

## STRUCTURE DU PROMPT IMAGE

Chaque prompt doit inclure, dans cet ordre :

### 1. DIMENSIONS ET FORMAT
"Image 1920×640px (ratio 3:1)"

### 2. STYLE GLOBAL
Choisis 2-3 descripteurs parmi :
- "Style aquarelle numérique conceptuelle"
- "Illustration abstraite minimaliste"
- "Art graphique avec géométries douces"
- "Peinture numérique contemplative"
- "Design graphique transpersonnel"
- "Collage numérique texture et lumière"
- "Illustration digitale avec dégradés fluides"

### 3. CONCEPT VISUEL PRINCIPAL
Décris la composition d'une façon **abstraite et symbolique** (2-3 phrases) :
- Quelles formes/textures dominent ?
- Quel mouvement ou flux est présent ?
- Quelle transformation ou évolution est suggérée ?

Exemple : "Une spirale de lumière dorée qui émane du centre vers l'extérieur, se dissolvant graduellement en particules translucides. Le mouvement évoque l'expansion intérieure et l'irradiation de la conscience."

### 4. PALETTE DE COULEURS
Spécifie 3-4 couleurs dominantes de la palette Appréciez Votre Vie :
Exemple : "Palette dominante : bleu profond, or chaud, blanc crème, avec accents de pourpre pâle"

### 5. AMBIANCE ET TEXTURE
Décris l'atmosphère générale (1-2 phrases) :
- Éclairage (lumière dorée, argentée, diffuse, etc.)
- Texture (aquarelle, papier, minéral, lisse, granulée, etc.)
- Profondeur (couches, flou, nette, etc.)
- Qualité émotionnelle (contemplative, paisible, lumineux, etc.)

Exemple : "Éclairage doux et diffus avec une lumière dorée qui rayonne légèrement. Texture aquarelle avec dégradés fluides. Atmosphère contemplative et apaisante, timeless et universelle."

### 6. DÉTAILS SYMBOLIQUES (optionnel mais recommandé)
Mentionne 1-2 éléments symboliques subtils si pertinent :
Exemple : "Motifs de cercles concentriques évoquant l'expansion consciente" ou "Reflets légers suggérant l'introspection"

### 7. DIRECTIVE FINALE DALL-E
"Silhouettes humaines minimalistes et stylisées OK (si pertinent au sujet). Pas de figures humaines réalistes ou détaillées. Pas de texte, pas de logo. Qualité haute, 16:9."

---

## TEMPLATE STRUCTUREL POUR FORCER LES 4 ÉLÉMENTS CLÉS

**À utiliser comme guide pour construire chaque prompt :**

Image 1920×640px (ratio 3:1), style [STYLE].

Composition : [DESCRIPTION avec silhouette(s) + formes + mouvement]

Silhouette : [DESCRIPTION MINIMALISTE ILLUMINÉE - couleur, posture, aura dorée]

Lumière : [EXPLICITEMENT nommer la lumière dorée rayonnante]

Palette : [NOMMER OR + BLEU PROFOND avec couleurs hex si possible]

Atmosphère : [BRUME/VOILE + PROFONDEUR EN COUCHES]

Détails symboliques : [PERTINENTS AU SUJET]

Directive : [DALLE-E final]

**CHAQUE élément du template DOIT être rempli. Pas de section vide.**

---

## EXEMPLES DE BONS PROMPTS IMAGE

### Exemple 1 : Article sur "L'anxiété et ses origines" - BON (avec 4 éléments + accueil)
\`\`\`
Image 1920×640px (ratio 3:1), style illustration abstraite minimaliste chaleureuse.

Composition : Silhouette minimaliste épurée au centre dont le corps vibre de lignes ondulantes qui s'apaisent progressivement en spirales douces ascendantes. Silhouette illuminée d'une aura dorée enveloppante et rassurante.

Silhouette : Profil minimaliste stylisé, formes épurées, très peu de détails. Illuminée d'un halo doré rayonnant (#c7a962) qui s'intensifie graduellement vers le cœur. Posture d'accueil et d'ouverture.

Lumière : Halos de lumière dorée (#c7a962, #f0d9a3) enveloppants autour de la silhouette. Lumière intérieure rayonnante, chaleureuse et réconfortante, irradiant vers l'extérieur en cercles concentriques doux.

Palette : Dominante or Appréciez Votre Vie (#c7a962) pour la silhouette et les halos, fond bleu nuit (#0e1f2f) profond et apaisant, ivoire (#f5f1e6) pour la lumière douce, touches de sauge (#7b9d8f) pour l'ancrage.

Atmosphère : Voile translucide doux et accueillant. Profondeur en couches : silhouette illuminée nette au centre → spirales dorées midground → arrière-plan bleu nuit estompé. CHALEUREUSE, rassurante, porteuse d'espoir.

Détails : Les lignes agitées qui s'apaisent symbolisent le chemin vers la paix intérieure. L'image transmet : "L'apaisement est possible, vous êtes accompagné(e)".

Directive : Silhouettes minimalistes OK. Pas d'humains réalistes, visages détaillés, texte ou logo. Qualité cinématique haute.
\`\`\`

**Éléments clés présents ✅ :**
- ✅ Silhouette minimaliste illuminée : "Profil minimaliste...illuminée d'un halo doré"
- ✅ Lumière dorée rayonnante : "Halos de lumière dorée...chaleureuse et réconfortante"
- ✅ Palette officielle : "Or Appréciez Votre Vie (#c7a962)...bleu nuit (#0e1f2f)...ivoire (#f5f1e6)"
- ✅ Atmosphère chaleureuse + profondeur : "Voile translucide doux...CHALEUREUSE, rassurante"
- ✅ Message d'espoir : "L'apaisement est possible"

### Exemple 2 : Article sur "Le pardon de soi" - BON (avec 4 éléments + bienveillance)
\`\`\`
Image 1920×640px (ratio 3:1), style art graphique contemplative et bienveillante.

Composition : Silhouette minimaliste translucide au centre, dont le cœur intérieur brille d'une lumière dorée douce et enveloppante. Des couches légères se dissolvent progressivement en particules lumineuses flottantes, symbolisant la libération.

Silhouette : Forme humaine minimaliste épurée, translucide, très stylisée. Cœur au centre illuminé d'une aura dorée bienveillante (#c7a962). Posture d'auto-compassion, d'accueil de soi.

Lumière : Halos de lumière dorée (#c7a962, #f0d9a3) pulsant du cœur vers l'extérieur avec douceur. Rayonnement centripète formant un cocon lumineux protecteur. Lumière intérieure chaleureuse et réconfortante.

Palette : Fond bleu nuit (#0e1f2f) profond et sécurisant, or Appréciez Votre Vie dominant (#c7a962), ivoire (#f5f1e6) pour pureté et légèreté, pourpre doux (#9b7eaa) en accents subtils.

Atmosphère : Voile translucide doux et enveloppant. Profondeur en couches : silhouette illuminée nette au centre → particules dorées midground → fond bleu nuit estompé. BIENVEILLANTE, tendre, porteuse d'auto-compassion.

Détails : Le cœur illuminé symbolise l'amour de soi retrouvé ; les particules dorées évoquent la libération de la culpabilité. L'image transmet : "Vous méritez votre propre compassion".

Directive : Silhouettes minimalistes OK. Pas d'humains réalistes, détails faciaux, texte ou logo. Qualité cinématique haute.
\`\`\`

**Éléments clés présents ✅ :**
- ✅ Silhouette minimaliste illuminée : "Silhouette minimaliste...illuminée d'une aura dorée"
- ✅ Lumière dorée rayonnante : "Halos de lumière dorée...chaleureuse et réconfortante"
- ✅ Palette officielle : "Or Appréciez Votre Vie (#c7a962)...bleu nuit (#0e1f2f)...ivoire (#f5f1e6)"
- ✅ Atmosphère bienveillante + profondeur : "Voile translucide doux...BIENVEILLANTE, tendre"
- ✅ Message de compassion : "Vous méritez votre propre compassion"

### Exemple 3 : Article sur "Cultiver la présence" - BON (avec 4 éléments + sérénité)
\`\`\`
Image 1920×640px (ratio 3:1), style illustration aquarelle numérique sereine.

Composition : Silhouette minimaliste assise en posture méditative au centre. Cercles concentriques dorés émergent du cœur, s'étendant progressivement vers l'extérieur. Présence immobile, ancrée et rayonnante.

Silhouette : Silhouette frontale ou de profil minimaliste assise, posture méditative très épurée. Illuminée d'une lumière intérieure dorée (#c7a962) émanant du cœur. Formes simples, très stylisées, inspirant le calme.

Lumière : Halos dorés (#c7a962, #f0d9a3) concentriques irradiant du centre vers l'extérieur. Rayonnement doux et progressif, lumière intérieure chaleureuse et enveloppante, invitant à la paix.

Palette : Or Appréciez Votre Vie dominant (#c7a962) pour l'irradiation, bleu nuit (#0e1f2f) pour l'espace vaste et profond, terracotta (#cd853f) pour l'ancrage terrestre, ivoire (#f5f1e6) pour le vide fertile lumineux.

Atmosphère : Voile translucide doux et contemplatif. Profondeur en couches : silhouette illuminée nette au centre → cercles dorés midground → arrière-plan bleu nuit estompé infini. SEREINE, ancrée, respirante, invitante.

Détails : Les cercles concentriques symbolisent l'expansion de la conscience depuis l'instant présent. L'image transmet : "La paix est ici, maintenant, en vous".

Directive : Silhouettes minimalistes OK. Pas d'humains réalistes, détails faciaux, texte ou logo. Qualité cinématique haute.
\`\`\`

**Éléments clés présents ✅ :**
- ✅ Silhouette minimaliste illuminée : "Silhouette minimaliste assise...illuminée d'une lumière intérieure dorée"
- ✅ Lumière dorée rayonnante : "Halos dorés...chaleureuse et enveloppante"
- ✅ Palette officielle : "Or Appréciez Votre Vie (#c7a962)...bleu nuit (#0e1f2f)...ivoire (#f5f1e6)"
- ✅ Atmosphère sereine + profondeur : "Voile translucide doux...SEREINE, ancrée"
- ✅ Message de présence : "La paix est ici, maintenant"

---

## CE QU'IL FAUT ABSOLUMENT ÉVITER

❌ **Représentations littérales** : Gens dans des situations réelles, bâtiments, mobilier, actions concrètes
   ✅ OK : Silhouettes minimalistes stylisées intégrées à une composition symbolique
   ✅ OK : Formes humaines épurées rayonnant de lumière ou d'énergie

❌ **Clichés thérapeutiques** : "Femme à la fenêtre", "Silhouette sur plage", "Bougie allumée", "Jardin zen"
   ✅ OK : Silhouettes minimalistes dans une composition abstraite/symbolique unique

❌ **Surcharge de détails** : Les images doivent être épurées, lisibles, non chargées

❌ **Couleurs non-Appréciez Votre Vie** : UTILISER UNIQUEMENT les couleurs de la palette officielle
   ✅ OK : Or (#c7a962), bleu nuit (#0e1f2f), ivoire (#f5f1e6), sauge (#7b9d8f), pourpre (#9b7eaa)

❌ **Humains réalistes** : Pas de faces détaillées, corps réalistes ou traits marqués
   ✅ OK : Silhouettes minimalistes, translucides, stylisées, génériques (sans genre/âge)
   ✅ OK : Formes humaines abstraites/géométriques

❌ **Logos, texte, watermarks** : Absolument interdit

❌ **Images froides ou distantes** : L'image doit TOUJOURS transmettre chaleur et accueil
   ✅ OK : Ambiance enveloppante, lumière chaleureuse, sentiment de sécurité

❌ **Symbolisme trop complexe** : Le visiteur doit comprendre le sujet en 2 secondes
   ✅ OK : Métaphores visuelles claires et accessibles

❌ **Ton trop ésotérique** : Éviter l'imagerie qui pourrait intimider les nouveaux visiteurs
   ✅ OK : Spirituel mais accessible, profond mais accueillant

❌ **Dramatisation de la souffrance** : Ne pas montrer la douleur de façon explicite
   ✅ OK : Montrer le CHEMIN vers l'apaisement, la lumière qui émerge

---

## CHECKLIST FINALE POUR CHAQUE PROMPT

**PRIORITÉ 1 : ACCUEIL ET CLARTÉ (ESSENTIEL POUR LA CIBLE)**

Avant de générer, vérifie que le prompt :

- [ ] Transmet **CHALEUR et ACCUEIL** (jamais froid ou distant)
- [ ] Permet d'**IDENTIFIER LE SUJET EN 2 SECONDES** (clarté communicationnelle)
- [ ] Inspire **CONFIANCE et RÉCONFORT** (sécurité émotionnelle)
- [ ] Porte un **MESSAGE D'ESPOIR** (même pour les sujets difficiles)
- [ ] Est **ACCESSIBLE** (pas trop ésotérique pour les nouveaux visiteurs)

**PRIORITÉ 2 : REPRÉSENTATIVITÉ ET SYMBOLISME**

- [ ] Est **CLAIREMENT REPRÉSENTATIF** du sujet/contenu de l'article
- [ ] Capture les **CONCEPTS CLÉS** du contenu (pas juste le titre)
- [ ] Reflète les **ÉMOTIONS/ÉTATS** décrits dans l'article
- [ ] Évoque les **TRANSFORMATIONS** suggérées (du chaos vers l'ordre, de l'ombre vers la lumière)
- [ ] Décrit une image **SYMBOLIQUE mais COMPRÉHENSIBLE**, non littérale

**PRIORITÉ 3 : IDENTITÉ VISUELLE AVV (4 ÉLÉMENTS CLÉS)**

- [ ] Inclut une ou plusieurs **silhouettes humaines minimalistes illuminées**
- [ ] Présente une **lumière dorée rayonnante** (#c7a962, #f0d9a3) avec halos enveloppants
- [ ] Utilise la **palette officielle** : or (#c7a962), bleu nuit (#0e1f2f), ivoire (#f5f1e6)
- [ ] Crée une **atmosphère CHALEUREUSE avec profondeur** (voiles doux, translucidité accueillante)
- [ ] Intègre **profondeur en couches** (avant/milieu/arrière-plan)
- [ ] Montre du **mouvement ascendant** ou **rayonnement depuis le centre**
- [ ] Évoque une **qualité atemporelle et bienveillante**

**PRIORITÉ 4 : COMPOSITION ET STRUCTURE**

- [ ] Respecte les **dimensions 1920×640px** (ratio 3:1)
- [ ] Utilise **UNIQUEMENT les couleurs de la palette Appréciez Votre Vie officielle**
- [ ] Inclut un **lien conceptuel TRÈS CLAIR** avec le sujet
- [ ] Mentionne l'**éclairage (dorée, chaleureuse, enveloppante)** et la **texture**
- [ ] Termine par la **directive DALL-E** standard
- [ ] Ne contient **aucun cliché** générique (fenêtre, plage, bougie)
- [ ] **Si personnages minimalistes** : Épurés, accueillants, rayonnants, illuminés
- [ ] Est **suffisamment détaillé** pour DALL-E (~200-250 mots)
- [ ] Inclut un **MESSAGE IMPLICITE** positif (ex: "L'apaisement est possible")`;

/**
 * SYSTÈME DE MAPPING THÉMATIQUE ENRICHI
 * Relie les sujets d'articles à des concepts visuels transpersonnels
 * Utilise les couleurs officielles Appréciez Votre Vie
 */
export const THEMATIC_VISUAL_MAPPING: Record<string, {
  symbolism: string;
  primaryShapes: string[];
  suggestedMovement: string;
  emotionalQuality: string;
  colorAccent: string;
  hopefulMessage: string;
}> = {
  // ═══════════════════════════════════════════════════════════
  // ÉMOTIONS & PSYCHOLOGIE
  // ═══════════════════════════════════════════════════════════
  anxiety: {
    symbolism: "Silhouette minimaliste dont les lignes agitées s'apaisent progressivement en spirales douces. Transformation visible de l'agitation vers la sérénité. Lumière dorée enveloppante qui calme.",
    primaryShapes: ["Silhouette humanisée accueillante", "Lignes ondulantes qui s'apaisent", "Spirales douces ascendantes", "Halos de lumière apaisants"],
    suggestedMovement: "Vibration → ondulation → spirale douce, du chaos vers l'ordre et la paix",
    emotionalQuality: "Réconfort, apaisement progressif, sentiment de sécurité retrouvée",
    colorAccent: "Or Appréciez Votre Vie (#c7a962) dominant et enveloppant, fond bleu nuit (#0e1f2f), touches de sauge (#7b9d8f) pour l'ancrage",
    hopefulMessage: "L'apaisement est possible, vous êtes accompagné(e)"
  },
  depression: {
    symbolism: "Silhouette minimaliste qui s'élève doucement de l'ombre vers une lumière dorée accueillante. Émergence progressive vers l'espoir. Lumière chaleureuse qui invite.",
    primaryShapes: ["Silhouette ascendante porteuse d'espoir", "Spirales montantes douces", "Lumière dorée perçant l'ombre", "Halos lumineux émergents"],
    suggestedMovement: "Ascension douce depuis les profondeurs, illumination progressive et bienveillante",
    emotionalQuality: "Espoir renaissant, énergie vitale qui revient, chaleur retrouvée",
    colorAccent: "Bleu nuit (#0e1f2f) en base, or Appréciez Votre Vie (#c7a962) comme lumière d'espoir, ivoire (#f5f1e6) pour la clarté",
    hopefulMessage: "La lumière revient, pas à pas"
  },
  authenticity: {
    symbolism: "Silhouette translucide révélant son essence intérieure rayonnante. Couches qui se dissolvent doucement pour exposer la lumière au cœur. Dévoilement de la vraie nature.",
    primaryShapes: ["Silhouette translucide révélatrice", "Couches se dissolvant", "Cœur lumineux au centre", "Rayonnement intérieur doux"],
    suggestedMovement: "Du masque vers l'essence, dévoilement progressif et libérateur",
    emotionalQuality: "Liberté d'être soi-même, légèreté, rayonnement authentique",
    colorAccent: "Pourpre doux (#9b7eaa) pour l'introspection, or (#c7a962) pour l'essence, ivoire (#f5f1e6) pour la révélation",
    hopefulMessage: "Votre vraie nature est précieuse et mérite d'être vue"
  },
  forgiveness: {
    symbolism: "Silhouette ou cœur s'ouvrant, irradiant une lumière de compassion. Poids qui se dissout en particules lumineuses. Libération visible et douce.",
    primaryShapes: ["Cœur s'ouvrant doucement", "Particules lumineuses de libération", "Cercles de compassion", "Ponts de lumière"],
    suggestedMovement: "Ouverture du cœur, irradiation de tendresse, dissolution des poids",
    emotionalQuality: "Auto-compassion, tendresse envers soi, légèreté retrouvée",
    colorAccent: "Pourpre (#9b7eaa), or Appréciez Votre Vie (#c7a962) pour l'amour, ivoire (#f5f1e6) pour la pureté",
    hopefulMessage: "Vous méritez votre propre compassion"
  },
  presence: {
    symbolism: "Silhouette méditative au centre irradiant des cercles concentriques de conscience. Espace vaste et accueillant autour. Ancrage et rayonnement.",
    primaryShapes: ["Silhouette centrée et ancrée", "Cercles concentriques doux", "Espace respirant", "Rayonnement calme"],
    suggestedMovement: "Rayonnement immobile depuis le centre, expansion douce et paisible",
    emotionalQuality: "Centrage, paix intérieure, présence éveillée et accueillante",
    colorAccent: "Terracotta (#cd853f) pour l'ancrage, or (#c7a962) pour le rayonnement, bleu nuit (#0e1f2f) pour l'infini",
    hopefulMessage: "La paix est ici, maintenant, en vous"
  },
  meditation: {
    symbolism: "Silhouette en posture méditative, harmonie géométrique douce autour. Suspension du temps dans un espace de calme. Équilibre visible.",
    primaryShapes: ["Silhouette méditative épurée", "Géométries douces", "Cercles harmonieux", "Espaces de silence"],
    suggestedMovement: "Immobilité vibrante, fluidité dans le calme",
    emotionalQuality: "Paix profonde, équilibre, vide fertile et accueillant",
    colorAccent: "Bleu nuit (#0e1f2f) pour la profondeur, sauge (#7b9d8f) pour l'équilibre, or pâle (#f0d9a3) pour l'illumination",
    hopefulMessage: "Le calme intérieur est accessible"
  },
  transformation: {
    symbolism: "Silhouette en mutation progressive, spirales ascendantes de lumière. Alchimie visible : l'ancien se transmute en nouveau. Évolution porteuse d'espoir.",
    primaryShapes: ["Silhouette en transformation", "Spirales ascendantes", "Métamorphose fluide", "Lumière cristallisante"],
    suggestedMovement: "Ascension transformatrice, évolution continue vers le haut",
    emotionalQuality: "Espoir de croissance, puissance d'évolution, renouveau",
    colorAccent: "Or (#c7a962) dominant pour la transformation, bleu nuit (#0e1f2f) en fond, or clair (#f0d9a3) pour le nouveau",
    hopefulMessage: "Le changement est en cours, vous évoluez"
  },
  connection: {
    symbolism: "Deux silhouettes reliées par un pont de lumière dorée. Entrelacement harmonieux. Résonance visible entre les êtres.",
    primaryShapes: ["Deux silhouettes proches", "Ponts lumineux de connexion", "Entrelacs harmonieux", "Halos partagés"],
    suggestedMovement: "Flux d'énergie entre les silhouettes, communion visible",
    emotionalQuality: "Connexion profonde, harmonie relationnelle, unité",
    colorAccent: "Or (#c7a962) pour les liens, pourpre (#9b7eaa) pour la profondeur, bleu nuit (#0e1f2f) en fond",
    hopefulMessage: "Les liens nourrissent et guérissent"
  },
  healing: {
    symbolism: "Silhouette se recomposant doucement, lumière dorée qui cicatrise les fractures. Restauration progressive et bienveillante.",
    primaryShapes: ["Silhouette en restauration", "Lumière cicatrisante", "Spirales de régénération", "Halos protecteurs"],
    suggestedMovement: "Restauration douce, reconstitution progressive et patiente",
    emotionalQuality: "Tendresse envers les blessures, espoir de guérison, renouveau",
    colorAccent: "Sauge (#7b9d8f) pour la guérison, or (#c7a962) bienveillant, ivoire (#f5f1e6) pour la pureté",
    hopefulMessage: "La guérison est en chemin"
  },
  fear: {
    symbolism: "Silhouette faisant face à l'ombre, lumière dorée qui éclaire progressivement. L'obscurité recule devant la clarté. Courage qui s'éveille.",
    primaryShapes: ["Silhouette courageuse", "Ombre qui recule", "Lumière avançante", "Passage vers la clarté"],
    suggestedMovement: "Avancée progressive, clarté grandissante, transformation de la peur",
    emotionalQuality: "Courage tranquille, compréhension, légèreté croissante",
    colorAccent: "Bleu nuit (#0e1f2f) pour l'ombre, or (#c7a962) pour le courage, ivoire (#f5f1e6) pour la clarté",
    hopefulMessage: "Le courage s'éveille pas à pas"
  },
  intuition: {
    symbolism: "Silhouette avec perception intérieure activée, lumière émergeant du centre. Sagesse innée qui rayonne doucement.",
    primaryShapes: ["Silhouette réceptive", "Lumière intérieure", "Réseaux de conscience", "Rayonnement subtil"],
    suggestedMovement: "Ouverture intérieure, rayonnement de sagesse",
    emotionalQuality: "Clarté intérieure, confiance profonde, sagesse accessible",
    colorAccent: "Pourpre (#9b7eaa) pour l'intuition, or (#c7a962) pour la sagesse, bleu nuit (#0e1f2f) pour la profondeur",
    hopefulMessage: "Votre sagesse intérieure vous guide"
  },
  grief: {
    symbolism: "Silhouette tenant délicatement un espace lumineux (l'absence honorée). Lumière douce autour du vide sacré. Tendresse visible.",
    primaryShapes: ["Silhouette accueillante", "Espace de vide honoré", "Lumière douce enveloppante", "Halo protecteur"],
    suggestedMovement: "Apaisement graduel, honoration respectueuse, intégration douce",
    emotionalQuality: "Tendresse face à la perte, paix progressive, douleur accueillie",
    colorAccent: "Bleu nuit (#0e1f2f) pour la profondeur, sauge (#7b9d8f) doux, or pâle (#f0d9a3) pour l'honoration",
    hopefulMessage: "Votre douleur est accueillie avec tendresse"
  },

  // ═══════════════════════════════════════════════════════════
  // NOUVEAUX SUJETS - PROBLÉMATIQUES COURANTES
  // ═══════════════════════════════════════════════════════════
  burnout: {
    symbolism: "Silhouette épuisée dont l'énergie se reconstitue progressivement. Flamme intérieure qui se rallume doucement. Ressources qui reviennent.",
    primaryShapes: ["Silhouette en repos réparateur", "Flamme intérieure renaissante", "Énergie qui circule à nouveau", "Halos protecteurs"],
    suggestedMovement: "Repos → reconstitution → renouveau énergétique progressif",
    emotionalQuality: "Repos profond, reconstitution des forces, espoir de renaissance",
    colorAccent: "Or (#c7a962) pour l'énergie qui revient, sauge (#7b9d8f) pour le repos, ivoire (#f5f1e6) pour la douceur",
    hopefulMessage: "Vos ressources se reconstituent"
  },
  stress: {
    symbolism: "Silhouette sous tension dont les lignes de pression se relâchent progressivement. Espace qui s'ouvre autour. Détente visible.",
    primaryShapes: ["Silhouette qui se détend", "Lignes de tension qui s'assouplissent", "Espace respirant", "Lumière apaisante"],
    suggestedMovement: "Tension → relâchement → détente profonde et accueillante",
    emotionalQuality: "Détente progressive, respiration retrouvée, calme accessible",
    colorAccent: "Sauge (#7b9d8f) pour la détente, or (#c7a962) pour le calme, bleu nuit (#0e1f2f) apaisant",
    hopefulMessage: "La détente est possible"
  },
  confiance: {
    symbolism: "Silhouette qui se redresse progressivement, lumière intérieure qui s'intensifie. Stabilité et assurance qui s'installent.",
    primaryShapes: ["Silhouette qui se redresse", "Socle stable sous les pieds", "Lumière intérieure grandissante", "Aura de force douce"],
    suggestedMovement: "Redressement progressif, stabilisation, rayonnement confiant",
    emotionalQuality: "Assurance retrouvée, stabilité intérieure, force tranquille",
    colorAccent: "Or (#c7a962) pour la confiance, terracotta (#cd853f) pour la stabilité, bleu nuit (#0e1f2f) pour l'ancrage",
    hopefulMessage: "Votre force intérieure grandit"
  },
  estime: {
    symbolism: "Silhouette qui s'illumine de l'intérieur, cœur rayonnant de valeur propre. Auto-reconnaissance visible et douce.",
    primaryShapes: ["Silhouette rayonnante de valeur", "Cœur lumineux", "Halos d'auto-appréciation", "Miroir intérieur bienveillant"],
    suggestedMovement: "Illumination intérieure progressive, rayonnement de valeur propre",
    emotionalQuality: "Auto-appréciation, valeur reconnue, amour de soi",
    colorAccent: "Or (#c7a962) pour la valeur, pourpre (#9b7eaa) pour la profondeur, ivoire (#f5f1e6) pour la tendresse",
    hopefulMessage: "Vous avez de la valeur, telle que vous êtes"
  },
  relations: {
    symbolism: "Deux silhouettes en interaction harmonieuse, ponts de lumière entre elles. Communication et compréhension mutuelle visibles.",
    primaryShapes: ["Deux silhouettes en dialogue", "Ponts de compréhension", "Espaces partagés", "Halos qui se rejoignent"],
    suggestedMovement: "Rapprochement, échange fluide, harmonie relationnelle",
    emotionalQuality: "Connexion authentique, compréhension mutuelle, harmonie",
    colorAccent: "Or (#c7a962) pour les liens, pourpre (#9b7eaa) pour l'intimité, sauge (#7b9d8f) pour l'harmonie",
    hopefulMessage: "Des relations authentiques sont possibles"
  },
  separation: {
    symbolism: "Silhouette qui retrouve son propre centre lumineux après une séparation. Reconstitution de soi, lumière intérieure qui se renforce.",
    primaryShapes: ["Silhouette se recentrant", "Cœur qui se reconstitue", "Nouveau socle personnel", "Lumière propre qui grandit"],
    suggestedMovement: "Recentrage, reconstitution de soi, nouveau départ",
    emotionalQuality: "Reconstruction, identité retrouvée, nouveau chapitre",
    colorAccent: "Sauge (#7b9d8f) pour la guérison, or (#c7a962) pour le renouveau, ivoire (#f5f1e6) pour la clarté",
    hopefulMessage: "Un nouveau chapitre s'ouvre"
  },
  travail: {
    symbolism: "Silhouette en équilibre entre effort et ressourcement. Énergie qui circule harmonieusement. Sens et accomplissement visibles.",
    primaryShapes: ["Silhouette équilibrée", "Flux d'énergie harmonieux", "Balance effort/repos", "Rayonnement d'accomplissement"],
    suggestedMovement: "Équilibre dynamique, flux d'énergie sain, accomplissement serein",
    emotionalQuality: "Équilibre travail-vie, sens retrouvé, accomplissement sain",
    colorAccent: "Or (#c7a962) pour l'accomplissement, sauge (#7b9d8f) pour l'équilibre, bleu nuit (#0e1f2f) pour la profondeur",
    hopefulMessage: "L'équilibre est accessible"
  },
  sommeil: {
    symbolism: "Silhouette dans un cocon de lumière douce et protectrice. Repos profond et réparateur. Nuit accueillante.",
    primaryShapes: ["Silhouette en repos", "Cocon protecteur lumineux", "Vagues de sommeil doux", "Étoiles apaisantes"],
    suggestedMovement: "Descente douce vers le repos, vagues de sommeil réparateur",
    emotionalQuality: "Sécurité nocturne, repos profond, régénération",
    colorAccent: "Bleu nuit (#0e1f2f) enveloppant, or pâle (#f0d9a3) pour la lune, ivoire (#f5f1e6) pour la douceur",
    hopefulMessage: "Le sommeil réparateur vous attend"
  },

  // ═══════════════════════════════════════════════════════════
  // APPROCHES THÉRAPEUTIQUES
  // ═══════════════════════════════════════════════════════════
  somatothérapie: {
    symbolism: "Silhouette en état de conscience modifiée, vagues douces de relaxation. Porte vers l'inconscient lumineux et accueillant.",
    primaryShapes: ["Silhouette en transe douce", "Vagues de conscience", "Porte lumineuse intérieure", "Spirales hypnotiques douces"],
    suggestedMovement: "Descente douce vers l'intérieur, vagues de relaxation profonde",
    emotionalQuality: "Relaxation profonde, accès à l'inconscient, transformation douce",
    colorAccent: "Pourpre (#9b7eaa) pour la profondeur, or (#c7a962) pour la lumière intérieure, bleu nuit (#0e1f2f) pour la transe",
    hopefulMessage: "Votre inconscient détient des ressources précieuses"
  },
  respiration: {
    symbolism: "Silhouette avec flux de souffle visible, expansion et contraction harmonieuses. Énergie vitale qui circule librement.",
    primaryShapes: ["Silhouette respirante", "Flux de souffle lumineux", "Expansion/contraction", "Énergie circulante"],
    suggestedMovement: "Inspiration → expansion → expiration → relâchement, cycle continu",
    emotionalQuality: "Vitalité, connexion corps-esprit, ancrage par le souffle",
    colorAccent: "Ivoire (#f5f1e6) pour le souffle, or (#c7a962) pour l'énergie, sauge (#7b9d8f) pour l'ancrage",
    hopefulMessage: "Votre souffle vous ancre et vous libère"
  },
  therapie: {
    symbolism: "Espace accueillant de transformation, silhouette accompagnée par une présence bienveillante. Chemin de guérison visible.",
    primaryShapes: ["Silhouette accompagnée", "Espace thérapeutique chaleureux", "Chemin de lumière", "Halos de bienveillance"],
    suggestedMovement: "Accompagnement progressif, chemin vers la guérison",
    emotionalQuality: "Sécurité, accompagnement, progression bienveillante",
    colorAccent: "Or (#c7a962) pour la bienveillance, sauge (#7b9d8f) pour la guérison, ivoire (#f5f1e6) pour l'accueil",
    hopefulMessage: "Vous n'êtes pas seul(e) sur ce chemin"
  },

  // ═══════════════════════════════════════════════════════════
  // PARCOURS PATIENT
  // ═══════════════════════════════════════════════════════════
  premier_rdv: {
    symbolism: "Porte lumineuse accueillante qui s'ouvre, silhouette hésitante mais invitée. Premier pas vers l'accompagnement.",
    primaryShapes: ["Porte accueillante", "Silhouette faisant le premier pas", "Lumière d'invitation", "Chemin bienveillant"],
    suggestedMovement: "Ouverture, invitation, premier pas encouragé",
    emotionalQuality: "Accueil inconditionnel, encouragement, sécurité offerte",
    colorAccent: "Or (#c7a962) pour l'accueil, ivoire (#f5f1e6) pour la lumière, sauge (#7b9d8f) pour la sérénité",
    hopefulMessage: "Bienvenue, vous êtes au bon endroit"
  },
  accompagnement: {
    symbolism: "Deux silhouettes marchant côte à côte sur un chemin lumineux. Présence soutenante visible. Progression partagée.",
    primaryShapes: ["Deux silhouettes côte à côte", "Chemin partagé", "Lumière accompagnante", "Pas synchronisés"],
    suggestedMovement: "Marche commune, progression ensemble, soutien visible",
    emotionalQuality: "Présence, soutien, non-jugement, progression partagée",
    colorAccent: "Or (#c7a962) pour le lien, sauge (#7b9d8f) pour le soutien, bleu nuit (#0e1f2f) pour la profondeur",
    hopefulMessage: "Vous êtes accompagné(e) à chaque pas"
  },
  autonomie: {
    symbolism: "Silhouette rayonnante et autonome, lumière intérieure pleinement éveillée. Envol vers la liberté, ailes déployées.",
    primaryShapes: ["Silhouette autonome rayonnante", "Ailes déployées", "Lumière intérieure pleine", "Horizon ouvert"],
    suggestedMovement: "Envol, déploiement, rayonnement autonome",
    emotionalQuality: "Liberté retrouvée, autonomie, plénitude intérieure",
    colorAccent: "Or (#c7a962) dominant pour la liberté, ivoire (#f5f1e6) pour l'horizon, bleu nuit (#0e1f2f) pour l'infini",
    hopefulMessage: "Vous êtes prêt(e) à voler de vos propres ailes"
  }
};

/**
 * Fonction helper pour enrichir le prompt image avec des directives thématiques et catégorielles
 * Version 2.0 - Inclut le message d'espoir et le style par catégorie
 */
export function enrichImagePromptWithThematics(
  basePrompt: string,
  topic: string,
  category?: string
): string {
  // Cherche une correspondance thématique dans le topic
  const topicLower = topic.toLowerCase();
  let thematicData: {
    symbolism: string;
    primaryShapes: string[];
    suggestedMovement: string;
    emotionalQuality: string;
    colorAccent: string;
    hopefulMessage: string;
  } | null = null;

  // Recherche dans les clés du mapping (mots-clés étendus)
  const keywordMappings: Record<string, string> = {
    'anxiété': 'anxiety', 'anxieux': 'anxiety', 'angoisse': 'anxiety',
    'dépression': 'depression', 'déprime': 'depression', 'tristesse': 'depression',
    'authenticité': 'authenticity', 'authentique': 'authenticity', 'vrai': 'authenticity',
    'pardon': 'forgiveness', 'pardonner': 'forgiveness', 'culpabilité': 'forgiveness',
    'présence': 'presence', 'présent': 'presence', 'ici et maintenant': 'presence',
    'méditation': 'meditation', 'méditer': 'meditation', 'pleine conscience': 'meditation',
    'transformation': 'transformation', 'transformer': 'transformation', 'changer': 'transformation',
    'connexion': 'connection', 'lien': 'connection', 'relation': 'relations',
    'guérison': 'healing', 'guérir': 'healing', 'cicatriser': 'healing',
    'peur': 'fear', 'peurs': 'fear', 'crainte': 'fear',
    'intuition': 'intuition', 'intuitif': 'intuition', 'ressenti': 'intuition',
    'deuil': 'grief', 'perte': 'grief', 'décès': 'grief',
    'burn-out': 'burnout', 'burnout': 'burnout', 'épuisement': 'burnout',
    'stress': 'stress', 'stressé': 'stress', 'tension': 'stress',
    'confiance': 'confiance', 'confiant': 'confiance',
    'estime': 'estime', 'valeur': 'estime',
    'séparation': 'separation', 'rupture': 'separation', 'divorce': 'separation',
    'travail': 'travail', 'professionnel': 'travail', 'carrière': 'travail',
    'sommeil': 'sommeil', 'insomnie': 'sommeil', 'dormir': 'sommeil',
    'somatothérapie': 'somatothérapie', 'hypnotique': 'somatothérapie', 'transe': 'somatothérapie',
    'respiration': 'respiration', 'souffle': 'respiration', 'holotropique': 'respiration',
    'thérapie': 'therapie', 'thérapeute': 'therapie', 'accompagnement': 'accompagnement',
    'premier': 'premier_rdv', 'rendez-vous': 'premier_rdv',
    'autonomie': 'autonomie', 'autonome': 'autonomie', 'indépendance': 'autonomie'
  };

  // Trouve la clé thématique correspondante
  let thematicKey: string | null = null;
  for (const [keyword, mappedKey] of Object.entries(keywordMappings)) {
    if (topicLower.includes(keyword)) {
      thematicKey = mappedKey;
      break;
    }
  }

  // Si pas de match par mot-clé, cherche directement dans les clés du mapping
  if (!thematicKey) {
    for (const key of Object.keys(THEMATIC_VISUAL_MAPPING)) {
      if (topicLower.includes(key)) {
        thematicKey = key;
        break;
      }
    }
  }

  if (thematicKey && THEMATIC_VISUAL_MAPPING[thematicKey]) {
    thematicData = THEMATIC_VISUAL_MAPPING[thematicKey];
  }

  // Récupère le style de catégorie si fourni
  const categoryStyle = category ? getCategoryStyleModifier(category) : null;

  // Construit le prompt enrichi
  let enrichedPrompt = basePrompt;

  // Ajoute les données thématiques si trouvées
  if (thematicData) {
    enrichedPrompt += `

**═══ ENRICHISSEMENT THÉMATIQUE ═══**
**Symbolisme suggéré** : ${thematicData.symbolism}
**Formes primaires** : ${thematicData.primaryShapes.join(", ")}
**Mouvement/Flux** : ${thematicData.suggestedMovement}
**Qualité émotionnelle** : ${thematicData.emotionalQuality}
**Palette suggérée** : ${thematicData.colorAccent}
**Message d'espoir à transmettre** : "${thematicData.hopefulMessage}"`;
  }

  // Ajoute les directives de catégorie si fournies
  if (categoryStyle) {
    enrichedPrompt += `

**═══ STYLE CATÉGORIE "${category}" ═══**
**Ton visuel** : ${categoryStyle.visualTone}
**Qualité émotionnelle** : ${categoryStyle.emotionalQuality}
**Emphase couleur** : ${categoryStyle.colorEmphasis}
**Style préféré** : ${categoryStyle.stylePreference}
**Cible** : ${categoryStyle.targetAudience}`;
  }

  return enrichedPrompt;
}

/**
 * Recherche étendue de correspondance thématique
 * Retourne les données thématiques si trouvées, null sinon
 */
export function findThematicMatch(topic: string): {
  key: string;
  data: typeof THEMATIC_VISUAL_MAPPING[string];
} | null {
  const topicLower = topic.toLowerCase();

  // Mots-clés étendus pour une meilleure correspondance
  const keywordMappings: Record<string, string> = {
    'anxiété': 'anxiety', 'anxieux': 'anxiety', 'angoisse': 'anxiety',
    'dépression': 'depression', 'déprime': 'depression',
    'authenticité': 'authenticity', 'authentique': 'authenticity',
    'pardon': 'forgiveness', 'culpabilité': 'forgiveness',
    'burn-out': 'burnout', 'burnout': 'burnout', 'épuisement': 'burnout',
    'stress': 'stress', 'stressé': 'stress',
    'confiance': 'confiance', 'estime': 'estime',
    'séparation': 'separation', 'rupture': 'separation',
    'sommeil': 'sommeil', 'insomnie': 'sommeil',
    'somatothérapie': 'somatothérapie', 'respiration': 'respiration',
    'thérapie': 'therapie', 'accompagnement': 'accompagnement'
  };

  for (const [keyword, mappedKey] of Object.entries(keywordMappings)) {
    if (topicLower.includes(keyword) && THEMATIC_VISUAL_MAPPING[mappedKey]) {
      return { key: mappedKey, data: THEMATIC_VISUAL_MAPPING[mappedKey] };
    }
  }

  for (const [key, data] of Object.entries(THEMATIC_VISUAL_MAPPING)) {
    if (topicLower.includes(key)) {
      return { key, data };
    }
  }

  return null;
}

/**
 * Valide qu'un prompt généré contient les 4 éléments clés obligatoires
 * Version 2.0 - Utilise les couleurs officielles Appréciez Votre Vie et vérifie la chaleur/accueil
 * Retourne un objet avec les résultats de validation
 */
export function validatePromptForMandatoryElements(prompt: string): {
  isValid: boolean;
  hasSilhouettes: boolean;
  hasGoldenLight: boolean;
  hasPaletteOB: boolean;
  hasWarmAtmosphere: boolean;
  hasHopefulTone: boolean;
  missingElements: string[];
  suggestedCorrections: string[];
} {
  const lowerPrompt = prompt.toLowerCase();

  // 1. Vérifier les silhouettes minimalistes
  const silhouetteKeywords = [
    'silhouette', 'figure', 'forme humaine', 'profil', 'personnage minimaliste',
    'outline', 'contour', 'aura autour', 'illuminée', 'rayonne', 'humanisée'
  ];
  const hasSilhouettes = silhouetteKeywords.some(keyword =>
    lowerPrompt.includes(keyword)
  );

  // 2. Vérifier la lumière dorée rayonnante
  const goldenLightKeywords = [
    'lumière dorée', 'lumière doré', 'lumière or', 'halo', 'aura', 'rayonnement',
    'rayonne', 'irradie', 'lueur dorée', 'or luminescent', 'gold light', 'radiant',
    'glow', 'golden', 'halos', 'c7a962', 'f0d9a3', 'enveloppant'
  ];
  const hasGoldenLight = goldenLightKeywords.some(keyword =>
    lowerPrompt.includes(keyword)
  );

  // 3. Vérifier la palette officielle Appréciez Votre Vie (or + bleu nuit)
  const hasGoldKeywords = ['or', 'gold', 'c7a962', 'f0d9a3', '8b7a3f', 'doré'].some(k => lowerPrompt.includes(k));
  const hasBlueKeywords = ['bleu', 'blue', '0e1f2f', 'nuit', 'night', 'profond'].some(k => lowerPrompt.includes(k));
  const hasPaletteOB = hasGoldKeywords && hasBlueKeywords;

  // 4. Vérifier atmosphère CHALEUREUSE + profondeur (remplace "brumeuse/mystérieuse")
  const warmAtmosphereKeywords = [
    'chaleureux', 'chaleureuse', 'accueillant', 'accueillante', 'réconfortant',
    'enveloppant', 'enveloppante', 'bienveillant', 'bienveillante', 'doux', 'douce',
    'sécurisant', 'rassurant', 'voile translucide', 'profondeur en couches',
    'couches', 'layers', 'midground', 'estompé', 'ivoire', 'f5f1e6'
  ];
  const hasWarmAtmosphere = warmAtmosphereKeywords.some(keyword =>
    lowerPrompt.includes(keyword)
  );

  // 5. Vérifier le ton porteur d'espoir (NOUVEAU)
  const hopefulKeywords = [
    'espoir', 'apaisement', 'paix', 'lumière', 'ascendant', 'renouveau',
    'guérison', 'transformation', 'libération', 'sérénité', 'calme',
    'harmonie', 'équilibre', 'possible', 'transmet'
  ];
  const hasHopefulTone = hopefulKeywords.some(keyword =>
    lowerPrompt.includes(keyword)
  );

  // Déterminer les éléments manquants
  const missingElements: string[] = [];
  if (!hasSilhouettes) missingElements.push('Silhouettes minimalistes illuminées');
  if (!hasGoldenLight) missingElements.push('Lumière dorée rayonnante');
  if (!hasPaletteOB) missingElements.push('Palette or Appréciez Votre Vie (#c7a962) + bleu nuit (#0e1f2f)');
  if (!hasWarmAtmosphere) missingElements.push('Atmosphère chaleureuse/accueillante avec profondeur');
  if (!hasHopefulTone) missingElements.push('Ton porteur d\'espoir');

  // Suggestions de correction avec couleurs officielles
  const suggestedCorrections: string[] = [];
  if (!hasSilhouettes) {
    suggestedCorrections.push('Ajouter une ou plusieurs silhouettes minimalistes illuminées d\'une aura dorée (ex: "silhouette minimaliste épurée illuminée d\'un halo doré (#c7a962)")');
  }
  if (!hasGoldenLight) {
    suggestedCorrections.push('Ajouter explicitement la lumière dorée rayonnante (ex: "halos de lumière dorée (#c7a962, #f0d9a3) enveloppants", "lumière intérieure chaleureuse")');
  }
  if (!hasPaletteOB) {
    suggestedCorrections.push('Spécifier la palette Appréciez Votre Vie officielle (ex: "Palette : or Appréciez Votre Vie (#c7a962), bleu nuit (#0e1f2f), ivoire (#f5f1e6)")');
  }
  if (!hasWarmAtmosphere) {
    suggestedCorrections.push('Ajouter atmosphère CHALEUREUSE et profondeur (ex: "atmosphère chaleureuse et accueillante", "voile translucide doux", "profondeur en couches")');
  }
  if (!hasHopefulTone) {
    suggestedCorrections.push('Ajouter un élément porteur d\'espoir (ex: "L\'image transmet : L\'apaisement est possible", "lumière d\'espoir", "transformation vers la paix")');
  }

  // Validation : les 4 éléments visuels sont obligatoires, le ton d'espoir est fortement recommandé
  const isValid = hasSilhouettes && hasGoldenLight && hasPaletteOB && hasWarmAtmosphere;

  return {
    isValid,
    hasSilhouettes,
    hasGoldenLight,
    hasPaletteOB,
    hasWarmAtmosphere,
    hasHopefulTone,
    missingElements,
    suggestedCorrections
  };
}
