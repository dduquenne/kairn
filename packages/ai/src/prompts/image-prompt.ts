/**
 * Image generation prompt templates
 * @package @kairn/ai
 */

// ============================================
// Image Style Types
// ============================================

export type ImageStyle =
  | 'minimalist'
  | 'photorealistic'
  | 'illustration'
  | 'abstract'
  | 'watercolor'
  | 'digital_art'
  | 'vintage'
  | 'modern';

export type ImageMood =
  | 'serene'
  | 'energetic'
  | 'professional'
  | 'warm'
  | 'mysterious'
  | 'hopeful'
  | 'contemplative';

export type ImageSubject = 'person' | 'landscape' | 'abstract' | 'object' | 'concept' | 'scene';

// ============================================
// Configuration Types
// ============================================

export interface ImagePromptConfig {
  topic: string;
  style?: ImageStyle;
  mood?: ImageMood;
  subject?: ImageSubject;
  colors?: string[];
  avoidElements?: string[];
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  additionalInstructions?: string;
}

export interface BrandedImageConfig extends ImagePromptConfig {
  brandName: string;
  brandColors: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  visualIdentity?: string;
}

// ============================================
// Style Descriptions
// ============================================

export const STYLE_DESCRIPTIONS: Record<ImageStyle, string> = {
  minimalist:
    'Clean, simple composition with lots of negative space, subtle details, modern aesthetic',
  photorealistic: 'Highly detailed, realistic photography style, natural lighting, sharp focus',
  illustration: 'Hand-drawn illustration style, artistic linework, creative interpretation',
  abstract: 'Non-representational, shapes and colors, conceptual, artistic expression',
  watercolor: 'Soft watercolor painting style, gentle color bleeding, organic textures',
  digital_art: 'Modern digital artwork, vibrant colors, polished finish, contemporary',
  vintage: 'Retro aesthetic, muted colors, film grain, nostalgic feel',
  modern: 'Contemporary design, bold shapes, trendy aesthetic, clean lines',
};

export const MOOD_DESCRIPTIONS: Record<ImageMood, string> = {
  serene: 'Peaceful, calm, tranquil atmosphere with soft tones',
  energetic: 'Dynamic, vibrant, full of movement and energy',
  professional: 'Polished, business-appropriate, trustworthy',
  warm: 'Inviting, cozy, comfortable, welcoming tones',
  mysterious: 'Intriguing, shadowy, evocative, thought-provoking',
  hopeful: 'Optimistic, uplifting, bright, forward-looking',
  contemplative: 'Thoughtful, reflective, meditative quality',
};

// ============================================
// Prompt Builders
// ============================================

/**
 * Build a basic image generation prompt
 */
export function buildImagePrompt(config: ImagePromptConfig): string {
  const {
    topic,
    style = 'modern',
    mood = 'professional',
    subject = 'concept',
    colors,
    avoidElements,
    aspectRatio = 'landscape',
    additionalInstructions,
  } = config;

  const parts: string[] = [];

  // Main subject
  parts.push(`Create an image representing: "${topic}"`);
  parts.push('');

  // Style and mood
  parts.push(`Style: ${STYLE_DESCRIPTIONS[style]}`);
  parts.push(`Mood: ${MOOD_DESCRIPTIONS[mood]}`);
  parts.push('');

  // Subject treatment
  if (subject === 'person') {
    parts.push('Include a human figure or silhouette as the focal point');
  } else if (subject === 'landscape') {
    parts.push('Focus on environment and scenery');
  } else if (subject === 'abstract') {
    parts.push('Use abstract shapes and forms to represent the concept');
  } else if (subject === 'object') {
    parts.push('Feature a central object that symbolizes the topic');
  } else if (subject === 'scene') {
    parts.push('Depict a scene that illustrates the concept');
  }

  // Colors
  if (colors?.length) {
    parts.push(`\nColor palette: ${colors.join(', ')}`);
  }

  // Aspect ratio guidance
  parts.push(`\nComposition: Optimized for ${aspectRatio} format`);

  // Elements to avoid
  if (avoidElements?.length) {
    parts.push(`\nAvoid: ${avoidElements.join(', ')}`);
  }

  // Additional instructions
  if (additionalInstructions) {
    parts.push(`\n${additionalInstructions}`);
  }

  // Quality guidance
  parts.push('\nQuality: High resolution, professional quality, attention to detail');

  return parts.join('\n');
}

/**
 * Build an image prompt with brand guidelines
 */
export function buildBrandedImagePrompt(config: BrandedImageConfig): string {
  const {
    topic,
    brandName,
    brandColors,
    visualIdentity,
    style = 'modern',
    mood = 'professional',
    subject = 'concept',
    avoidElements = [],
    additionalInstructions,
  } = config;

  const parts: string[] = [];

  // Main subject with brand context
  parts.push(`Create a brand-consistent image for ${brandName}`);
  parts.push(`Topic/concept: "${topic}"`);
  parts.push('');

  // Brand colors (MANDATORY)
  parts.push('MANDATORY COLOR PALETTE:');
  parts.push(`- Primary color: ${brandColors.primary}`);
  if (brandColors.secondary) {
    parts.push(`- Secondary color: ${brandColors.secondary}`);
  }
  if (brandColors.accent) {
    parts.push(`- Accent color: ${brandColors.accent}`);
  }
  parts.push('These colors MUST be prominently featured in the image.');
  parts.push('');

  // Visual identity
  if (visualIdentity) {
    parts.push(`Brand visual identity: ${visualIdentity}`);
    parts.push('');
  }

  // Style and mood
  parts.push(`Style: ${STYLE_DESCRIPTIONS[style]}`);
  parts.push(`Mood: ${MOOD_DESCRIPTIONS[mood]}`);

  // Subject
  if (subject === 'person') {
    parts.push('\nInclude stylized human figure(s) or silhouette(s)');
  }

  // Standard avoidances for brand images
  const standardAvoidances = ['text', 'logos', 'watermarks', 'stock photo feel', ...avoidElements];
  parts.push(`\nAvoid: ${standardAvoidances.join(', ')}`);

  // Additional instructions
  if (additionalInstructions) {
    parts.push(`\n${additionalInstructions}`);
  }

  // Quality
  parts.push('\nQuality: High resolution, professional, suitable for web and print');

  return parts.join('\n');
}

/**
 * Build a prompt to generate image description from article content
 */
export function buildImageDescriptionPrompt(
  articleTitle: string,
  articleContent: string,
  brandConfig?: {
    name: string;
    colors: string[];
    style?: string;
  }
): string {
  const parts: string[] = [
    "Analyse cet article et génère un prompt détaillé pour créer une image d'illustration.",
    '',
    `Titre: ${articleTitle}`,
    '',
    'Contenu (extrait):',
    articleContent.slice(0, 1500),
    '',
  ];

  if (brandConfig) {
    parts.push('Identité visuelle de la marque:');
    parts.push(`- Nom: ${brandConfig.name}`);
    parts.push(`- Couleurs: ${brandConfig.colors.join(', ')}`);
    if (brandConfig.style) {
      parts.push(`- Style: ${brandConfig.style}`);
    }
    parts.push('');
  }

  parts.push(`Génère un prompt en anglais pour DALL-E 3 qui:
1. Capture l'essence du sujet de l'article
2. Utilise un style visuel cohérent${brandConfig ? ' avec la marque' : ''}
3. Évite tout texte ou logo
4. Est adapté au format 16:9 (landscape)
5. A une qualité professionnelle

Format attendu: Un seul paragraphe descriptif, sans markdown ni formatage spécial.`);

  return parts.join('\n');
}

/**
 * Build prompt for generating multiple image variations
 */
export function buildImageVariationsPrompt(
  basePrompt: string,
  variationCount: number = 3
): string[] {
  const variations = [
    // Original
    basePrompt,
    // More abstract
    `${basePrompt}\n\nVariation: More abstract and conceptual interpretation, focus on shapes and symbolic elements.`,
    // Warmer tones
    `${basePrompt}\n\nVariation: Warmer color temperature, more inviting and human-centered composition.`,
    // Minimalist
    `${basePrompt}\n\nVariation: Ultra-minimalist approach, maximum negative space, essential elements only.`,
  ];

  return variations.slice(0, variationCount);
}
