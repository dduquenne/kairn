/**
 * Types for AI Services
 * @package @kairn/ai
 */

import { z } from 'zod';

// ============================================
// Content Generation Types
// ============================================

export type ArticleTone =
  | 'professional'
  | 'casual'
  | 'educational'
  | 'inspirational'
  | 'analytical'
  | 'poetic'
  | 'introspective'
  | 'narrative'
  | 'conversational'
  | 'provocative'
  | 'humorous'
  | 'scientific'
  | 'practical';

export type ArticleLength = 'short' | 'medium' | 'long';

export type ArticleCategory = string;

export interface ArticleGenerationOptions {
  /** Main topic of the article */
  topic: string;
  /** Article category (optional) */
  category?: ArticleCategory;
  /** Target length */
  length?: ArticleLength;
  /** Primary tone */
  tone?: ArticleTone;
  /** Multiple tones to blend */
  tones?: ArticleTone[];
  /** SEO keywords to include */
  keywords?: string[];
  /** Target audience description */
  targetAudience?: string;
  /** Target SEO query */
  seoQuery?: string;
  /** Search intent to address */
  searchIntent?: string;
  /** Content language */
  language?: 'fr' | 'en';
  /** Custom system prompt to override default */
  customSystemPrompt?: string;
}

export interface GeneratedArticle {
  /** Article title */
  title: string;
  /** Meta description for SEO */
  description: string;
  /** Full article content in Markdown */
  content: string;
  /** Article category */
  category?: string;
  /** SEO tags */
  tags: string[];
  /** FAQ items */
  faq: Array<{ question: string; answer: string }>;
  /** Prompt for image generation */
  imagePrompt?: string;
  /** Generation metadata */
  metadata: {
    tokensUsed: number;
    durationMs: number;
    model: string;
  };
}

export interface ArticleOutline {
  /** Proposed title */
  title: string;
  /** Introduction summary */
  introduction: string;
  /** Article sections */
  sections: Array<{
    heading: string;
    level: 2 | 3;
    keyPoints: string[];
    subsections?: Array<{
      heading: string;
      level: 3;
      keyPoints: string[];
    }>;
  }>;
  /** Conclusion summary */
  conclusion: string;
}

// ============================================
// Social Media Types
// ============================================

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'threads';

export type SocialTone =
  | 'informative'
  | 'inspirational'
  | 'promotional'
  | 'educational'
  | 'personal'
  | 'entertaining'
  | 'thought_provoking';

export type SocialAngle =
  | 'benefits'
  | 'problem'
  | 'story'
  | 'expert'
  | 'practical'
  | 'curiosity'
  | 'controversy'
  | 'social_proof';

export type SocialFormat =
  | 'hook_reveal'
  | 'visual_list'
  | 'micro_storytelling'
  | 'rhetorical_question'
  | 'quote_reflection'
  | 'myth_reality'
  | 'raw_thought'
  | 'observation'
  | 'open_question'
  | 'micro_confession'
  | 'poetic_fragment'
  | 'counter_intuitive'
  | 'observation_pro'
  | 'social_proof';

export interface SocialPostGenerationOptions {
  /** Source content to transform */
  sourceContent: string;
  /** Source content title (optional) */
  sourceTitle?: string;
  /** Target platform */
  platform: SocialPlatform;
  /** Tone of the post */
  tone?: SocialTone;
  /** Angle/approach */
  angle?: SocialAngle;
  /** Specific format (platform-dependent) */
  format?: SocialFormat;
  /** Include hashtags */
  includeHashtags?: boolean;
  /** Include emojis */
  includeEmojis?: boolean;
  /** Include call-to-action */
  includeCallToAction?: boolean;
  /** Maximum length override */
  maxLength?: number;
  /** Content language */
  language?: 'fr' | 'en';
  /** Link to include */
  link?: string;
  /** Authenticity level (1-5) */
  authenticityLevel?: 1 | 2 | 3 | 4 | 5;
  /** Expertise level (1-5) */
  expertiseLevel?: 1 | 2 | 3 | 4 | 5;
}

export interface GeneratedSocialPost {
  /** Post content */
  content: string;
  /** Target platform */
  platform: SocialPlatform;
  /** Character count */
  characterCount: number;
  /** Extracted hashtags */
  hashtags: string[];
  /** Generation metadata */
  metadata: {
    tokensUsed: number;
    durationMs: number;
    model: string;
  };
}

export interface MultiPlatformPosts {
  /** Posts keyed by platform */
  posts: Partial<Record<SocialPlatform, string>>;
  /** Generation metadata */
  metadata: {
    tokensUsed: number;
    durationMs: number;
    model: string;
  };
}

// ============================================
// Image Generation Types
// ============================================

export interface ImageGenerationOptions {
  /** Image prompt */
  prompt: string;
  /** Number of images to generate */
  count?: number;
  /** Image size */
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  /** Quality level */
  quality?: 'standard' | 'hd';
  /** Style */
  style?: 'vivid' | 'natural';
}

export interface GeneratedImage {
  /** Image URL or base64 data */
  url?: string;
  base64?: string;
  /** Revised prompt (if modified by the model) */
  revisedPrompt?: string;
  /** Generation metadata */
  metadata: {
    durationMs: number;
    model: string;
  };
}

// ============================================
// Text Improvement Types
// ============================================

export type ImprovementType =
  | 'clarity'
  | 'conciseness'
  | 'engagement'
  | 'seo'
  | 'tone'
  | 'grammar'
  | 'structure'
  | 'readability';

export interface TextImprovementOptions {
  /** Text to improve */
  text: string;
  /** Type of improvement */
  type?: ImprovementType;
  /** Custom improvement instructions */
  instructions?: string;
  /** Target tone (optional) */
  targetTone?: ArticleTone;
  /** Preserve markdown formatting */
  preserveMarkdown?: boolean;
  /** Content language */
  language?: 'fr' | 'en';
}

export interface ImprovedText {
  /** Improved text */
  content: string;
  /** List of changes made */
  changes?: string[];
  /** Generation metadata */
  metadata: {
    tokensUsed: number;
    durationMs: number;
    model: string;
  };
}

// ============================================
// Zod Schemas
// ============================================

export const ArticleGenerationOptionsSchema = z.object({
  topic: z.string().min(1),
  category: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  tone: z
    .enum([
      'professional',
      'casual',
      'educational',
      'inspirational',
      'analytical',
      'poetic',
      'introspective',
      'narrative',
      'conversational',
      'provocative',
      'humorous',
      'scientific',
      'practical',
    ])
    .optional(),
  tones: z
    .array(
      z.enum([
        'professional',
        'casual',
        'educational',
        'inspirational',
        'analytical',
        'poetic',
        'introspective',
        'narrative',
        'conversational',
        'provocative',
        'humorous',
        'scientific',
        'practical',
      ])
    )
    .optional(),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  seoQuery: z.string().optional(),
  searchIntent: z.string().optional(),
  language: z.enum(['fr', 'en']).optional(),
  customSystemPrompt: z.string().optional(),
});

export const SocialPostGenerationOptionsSchema = z.object({
  sourceContent: z.string().min(1),
  sourceTitle: z.string().optional(),
  platform: z.enum(['facebook', 'instagram', 'linkedin', 'twitter', 'threads']),
  tone: z
    .enum([
      'informative',
      'inspirational',
      'promotional',
      'educational',
      'personal',
      'entertaining',
      'thought_provoking',
    ])
    .optional(),
  angle: z
    .enum([
      'benefits',
      'problem',
      'story',
      'expert',
      'practical',
      'curiosity',
      'controversy',
      'social_proof',
    ])
    .optional(),
  format: z.string().optional(),
  includeHashtags: z.boolean().optional(),
  includeEmojis: z.boolean().optional(),
  includeCallToAction: z.boolean().optional(),
  maxLength: z.number().positive().optional(),
  language: z.enum(['fr', 'en']).optional(),
  link: z.string().url().optional(),
  authenticityLevel: z.number().min(1).max(5).optional(),
  expertiseLevel: z.number().min(1).max(5).optional(),
});

export const TextImprovementOptionsSchema = z.object({
  text: z.string().min(1),
  type: z
    .enum([
      'clarity',
      'conciseness',
      'engagement',
      'seo',
      'tone',
      'grammar',
      'structure',
      'readability',
    ])
    .optional(),
  instructions: z.string().optional(),
  targetTone: z
    .enum([
      'professional',
      'casual',
      'educational',
      'inspirational',
      'analytical',
      'poetic',
      'introspective',
      'narrative',
      'conversational',
      'provocative',
      'humorous',
      'scientific',
      'practical',
    ])
    .optional(),
  preserveMarkdown: z.boolean().optional(),
  language: z.enum(['fr', 'en']).optional(),
});
