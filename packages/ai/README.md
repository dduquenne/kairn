# @kairn/ai

Services d'intelligence artificielle pour la plateforme Kairn.

## Installation

```bash
pnpm add @kairn/ai
```

## Providers

### Configuration

```typescript
import { createAnthropicProvider, createOpenAIProvider } from '@kairn/ai';

// Claude (Anthropic)
const claude = createAnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-sonnet-20240229', // optionnel
});

// GPT (OpenAI)
const openai = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview', // optionnel
});
```

### Interface commune

```typescript
interface AIProvider {
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  generateImage?(prompt: string, options?: ImageOptions): Promise<string>;
}

interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}
```

## Services

### ContentGenerator

Génération d'articles de blog.

```typescript
import { ContentGenerator } from '@kairn/ai';

const generator = new ContentGenerator(claude);

// Article complet
const article = await generator.generateFullArticle('Les bienfaits de la méditation', {
  tone: 'professional',
  length: 'medium',
  language: 'fr',
  keywords: ['méditation', 'stress', 'bien-être'],
  targetAudience: 'adultes stressés',
});

// Plan d'article
const outline = await generator.generateOutline('La gestion du stress');

// Section par section
const section = await generator.generateSection(outline, 0);

// Article depuis plan
const fromOutline = await generator.generateFromOutline(outline);

// Extraction FAQ
const faq = await generator.extractFAQ(articleContent);

// Meta description
const meta = await generator.generateMetaDescription(articleContent);

// Suggestions de tags
const tags = await generator.suggestTags(articleContent);
```

### TextImprover

Amélioration et réécriture de texte.

```typescript
import { TextImprover } from '@kairn/ai';

const improver = new TextImprover(claude);

// Améliorer le style
const improved = await improver.improve(text, {
  style: 'professional', // casual, academic, engaging
  preserveLength: true,
});

// Résumer
const summary = await improver.summarize(text, {
  maxLength: 200,
});

// Reformuler
const rewritten = await improver.rewrite(text, {
  tone: 'more engaging',
});

// Corriger
const corrected = await improver.correct(text);
```

### ImageGenerator

Génération d'images via DALL-E.

```typescript
import { ImageGenerator } from '@kairn/ai';

const imageGen = new ImageGenerator(openai);

// Générer une image
const imageUrl = await imageGen.generate('A serene meditation space', {
  size: '1024x1024',
  style: 'natural',
  quality: 'hd',
});

// Image pour article de blog
const blogImage = await imageGen.generateForBlogPost({
  title: 'Les bienfaits de la méditation',
  excerpt: 'Découvrez comment la méditation...',
  style: 'minimalist',
});
```

### SocialGenerator

Génération de posts pour réseaux sociaux.

```typescript
import { SocialGenerator } from '@kairn/ai';

const socialGen = new SocialGenerator(claude);

// Post par plateforme
const fbPost = await socialGen.generateForFacebook(articleContent, {
  tone: 'engaging',
  includeEmojis: true,
  includeCallToAction: true,
});

const igPost = await socialGen.generateForInstagram(articleContent, {
  format: 'carousel', // hook_reveal, lista_visuale, carousel
  includeHashtags: true,
});

const linkedInPost = await socialGen.generateForLinkedIn(articleContent, {
  tone: 'professional',
});

// Multi-plateformes
const posts = await socialGen.generateForPlatforms(articleContent,
  ['facebook', 'instagram', 'linkedin'],
  {
    tone: 'engaging',
    includeHashtags: true,
  }
);
```

## Prompts

Les templates de prompts sont exportés pour personnalisation.

```typescript
import { prompts } from '@kairn/ai';

// Modifier un prompt
const customPrompt = prompts.blogArticle({
  topic: 'La méditation',
  tone: 'professional',
  customInstructions: 'Ajouter des exemples concrets',
});

// Prompts disponibles
prompts.blogArticle(options);
prompts.blogOutline(options);
prompts.socialPost(options);
prompts.imagePrompt(options);
prompts.textImprovement(options);
```

## Streaming

Support du streaming pour les longues générations.

```typescript
import { ContentGenerator } from '@kairn/ai';

const generator = new ContentGenerator(claude);

// Avec callback pour le streaming
await generator.generateFullArticle('Sujet', {
  onToken: (token) => {
    process.stdout.write(token);
  },
});

// Pour API routes
export async function POST(request: Request) {
  const stream = generator.streamArticle('Sujet');

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
    },
  });
}
```

## Gestion des erreurs

```typescript
import { AIError, RateLimitError, TokenLimitError } from '@kairn/ai';

try {
  const result = await generator.generateFullArticle(topic);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Attendre et réessayer
    await delay(error.retryAfter);
  } else if (error instanceof TokenLimitError) {
    // Contenu trop long
    // Utiliser generateSection() à la place
  } else if (error instanceof AIError) {
    // Erreur générique IA
    console.error(error.message);
  }
}
```

## Types

```typescript
import type {
  AIProvider,
  GenerateOptions,
  ImageOptions,
  ArticleOptions,
  SocialPostOptions,
  ImproveOptions,
} from '@kairn/ai';
```

## Configuration avancée

```typescript
const claude = createAnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-opus-20240229',
  defaultOptions: {
    maxTokens: 4000,
    temperature: 0.7,
  },
  rateLimiting: {
    maxRequestsPerMinute: 50,
  },
});
```

## Dépendances

- `@anthropic-ai/sdk` - SDK Claude
- `openai` - SDK OpenAI
- `zod` - Validation

## Variables d'environnement

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

## Licence

MIT
