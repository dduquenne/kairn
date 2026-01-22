/**
 * Content Generation Service
 * @package @kairn/ai
 */

import {
  buildArticlePrompt,
  buildOutlinePrompt,
  buildSectionPrompt,
  buildFaqPrompt,
  buildMetaDescriptionPrompt,
  buildTagsPrompt,
  DEFAULT_SYSTEM_PROMPT,
  LENGTH_CONFIG,
} from '../prompts/blog-article.js';
import type { AIProvider, RetryOptions } from '../providers/types.js';
import {
  extractXmlBlock,
  parseJsonSafe,
  parseList,
  parseFaq,
  cleanMarkdown,
  validateXmlTags,
} from '../utils/parsing.js';
import { withRetry } from '../utils/retry.js';

import type { ArticleGenerationOptions, GeneratedArticle, ArticleOutline } from './types.js';

// ============================================
// Content Generator Service
// ============================================

export class ContentGenerator {
  private provider: AIProvider;
  private defaultSystemPrompt: string;
  private retryOptions: RetryOptions;

  constructor(
    provider: AIProvider,
    options: {
      systemPrompt?: string;
      retryOptions?: RetryOptions;
    } = {}
  ) {
    this.provider = provider;
    this.defaultSystemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    this.retryOptions = options.retryOptions || {
      maxRetries: 2,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
    };
  }

  /**
   * Generate a complete article in a single call
   */
  async generateFullArticle(options: ArticleGenerationOptions): Promise<GeneratedArticle> {
    const { length = 'medium', customSystemPrompt } = options;
    const lengthConfig = LENGTH_CONFIG[length];

    const prompt = buildArticlePrompt(options);
    const systemPrompt = customSystemPrompt || this.defaultSystemPrompt;

    const result = await withRetry(
      () =>
        this.provider.generateText(prompt, {
          systemPrompt,
          maxTokens: lengthConfig.maxTokens,
          temperature: 0.7,
        }),
      this.retryOptions
    );

    return this.parseArticleResponse(result.content, result);
  }

  /**
   * Generate article outline first, then content
   */
  async generateOutline(options: ArticleGenerationOptions): Promise<ArticleOutline> {
    const prompt = buildOutlinePrompt(options);

    const result = await withRetry(
      () =>
        this.provider.generateText(prompt, {
          maxTokens: 2000,
          temperature: 0.7,
        }),
      this.retryOptions
    );

    const outline = parseJsonSafe<ArticleOutline>(result.content);

    if (!outline) {
      throw new Error('Failed to parse article outline');
    }

    return outline;
  }

  /**
   * Generate article from existing outline, section by section
   */
  async generateFromOutline(
    outline: ArticleOutline,
    options: Omit<ArticleGenerationOptions, 'topic'> & { topic?: string }
  ): Promise<GeneratedArticle> {
    const topic = options.topic || outline.title;
    const { tone = 'professional', customSystemPrompt } = options;
    const systemPrompt = customSystemPrompt || this.defaultSystemPrompt;

    const sections: string[] = [];
    let totalTokens = 0;
    const startTime = Date.now();

    // Generate introduction
    const introResult = await withRetry(
      () =>
        this.provider.generateText(
          `Rédige l'introduction de l'article "${outline.title}".\n\nRésumé attendu : ${outline.introduction}\n\nTon : ${tone}\n\nL'introduction doit :\n- Accrocher le lecteur\n- Présenter le sujet\n- Annoncer ce qui sera couvert\n- Faire 100-150 mots`,
          {
            systemPrompt,
            maxTokens: 1000,
            temperature: 0.7,
          }
        ),
      this.retryOptions
    );
    sections.push(introResult.content);
    totalTokens += introResult.totalTokens;

    // Generate each section
    for (const section of outline.sections) {
      const sectionResult = await withRetry(
        () =>
          this.provider.generateText(
            buildSectionPrompt(section.heading, section.keyPoints, {
              articleTopic: topic,
              previousSections: sections.slice(-2), // Last 2 sections for context
              tone,
            }),
            {
              systemPrompt,
              maxTokens: 2000,
              temperature: 0.7,
            }
          ),
        this.retryOptions
      );

      sections.push(`## ${section.heading}\n\n${sectionResult.content}`);
      totalTokens += sectionResult.totalTokens;

      // Generate subsections if any
      if (section.subsections) {
        for (const subsection of section.subsections) {
          const subResult = await withRetry(
            () =>
              this.provider.generateText(
                buildSectionPrompt(subsection.heading, subsection.keyPoints, {
                  articleTopic: topic,
                  previousSections: sections.slice(-1),
                  tone,
                }),
                {
                  systemPrompt,
                  maxTokens: 1500,
                  temperature: 0.7,
                }
              ),
            this.retryOptions
          );

          sections.push(`### ${subsection.heading}\n\n${subResult.content}`);
          totalTokens += subResult.totalTokens;
        }
      }
    }

    // Generate conclusion
    const conclusionResult = await withRetry(
      () =>
        this.provider.generateText(
          `Rédige la conclusion de l'article "${outline.title}".\n\nRésumé attendu : ${outline.conclusion}\n\nLa conclusion doit :\n- Récapituler les points clés\n- Apporter une réflexion finale\n- Inviter à l'action ou à la réflexion\n- Faire 100-150 mots`,
          {
            systemPrompt,
            maxTokens: 1000,
            temperature: 0.7,
          }
        ),
      this.retryOptions
    );
    sections.push(`## Conclusion\n\n${conclusionResult.content}`);
    totalTokens += conclusionResult.totalTokens;

    // Assemble content
    const fullContent = sections.join('\n\n');

    // Generate metadata
    const [description, tags, faqItems] = await Promise.all([
      this.generateMetaDescription(outline.title, fullContent, options.seoQuery),
      this.generateTags(fullContent),
      this.generateFaq(fullContent, topic),
    ]);

    totalTokens += description.tokens + tags.tokens + faqItems.tokens;

    return {
      title: outline.title,
      description: description.content,
      content: cleanMarkdown(`# ${outline.title}\n\n${fullContent}`),
      category: options.category,
      tags: tags.content,
      faq: faqItems.content,
      metadata: {
        tokensUsed: totalTokens,
        durationMs: Date.now() - startTime,
        model: this.provider.defaultTextModel,
      },
    };
  }

  /**
   * Generate FAQ from article content
   */
  async generateFaq(
    articleContent: string,
    topic: string,
    count: number = 5
  ): Promise<{ content: Array<{ question: string; answer: string }>; tokens: number }> {
    const prompt = buildFaqPrompt(articleContent, topic, count);

    const result = await withRetry(
      () =>
        this.provider.generateText(prompt, {
          maxTokens: 2000,
          temperature: 0.5,
        }),
      this.retryOptions
    );

    const faq = parseFaq(result.content);

    return {
      content: faq.length > 0 ? faq : [],
      tokens: result.totalTokens,
    };
  }

  /**
   * Generate meta description from article
   */
  async generateMetaDescription(
    title: string,
    content: string,
    seoQuery?: string
  ): Promise<{ content: string; tokens: number }> {
    const prompt = buildMetaDescriptionPrompt(title, content, seoQuery);

    const result = await withRetry(
      () =>
        this.provider.generateText(prompt, {
          maxTokens: 200,
          temperature: 0.3,
        }),
      this.retryOptions
    );

    // Clean up the description
    let description = result.content.replace(/^["']|["']$/g, '').trim();

    // Ensure it's within limits
    if (description.length > 160) {
      description = description.slice(0, 157) + '...';
    }

    return {
      content: description,
      tokens: result.totalTokens,
    };
  }

  /**
   * Generate tags from article content
   */
  async generateTags(
    content: string,
    existingTags?: string[]
  ): Promise<{ content: string[]; tokens: number }> {
    const prompt = buildTagsPrompt(content, existingTags);

    const result = await withRetry(
      () =>
        this.provider.generateText(prompt, {
          maxTokens: 200,
          temperature: 0.3,
        }),
      this.retryOptions
    );

    const tags = parseList(result.content)
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .slice(0, 10);

    return {
      content: tags,
      tokens: result.totalTokens,
    };
  }

  /**
   * Parse article response from XML-formatted AI output
   */
  private parseArticleResponse(
    response: string,
    rawResult: { totalTokens: number; durationMs: number; model: string }
  ): GeneratedArticle {
    // Validate required tags
    const validation = validateXmlTags(response, ['TITLE', 'DESCRIPTION', 'CONTENT']);

    if (!validation.valid) {
      throw new Error(`Missing required XML tags in response: ${validation.missing.join(', ')}`);
    }

    // Extract fields
    const title = extractXmlBlock(response, 'TITLE') || '';
    const description = extractXmlBlock(response, 'DESCRIPTION') || '';
    const content = extractXmlBlock(response, 'CONTENT') || '';
    const tagsRaw = extractXmlBlock(response, 'TAGS') || '';
    const faqRaw = extractXmlBlock(response, 'FAQ') || '';
    const imagePrompt = extractXmlBlock(response, 'IMAGE_PROMPT') || undefined;
    const category = extractXmlBlock(response, 'CATEGORY') || undefined;

    // Parse tags
    const tags = parseList(tagsRaw);

    // Parse FAQ
    const faq = parseFaq(faqRaw);

    return {
      title: title.trim(),
      description: description.trim(),
      content: cleanMarkdown(content),
      category,
      tags,
      faq,
      imagePrompt,
      metadata: {
        tokensUsed: rawResult.totalTokens,
        durationMs: rawResult.durationMs,
        model: rawResult.model,
      },
    };
  }
}

/**
 * Create a content generator with the given provider
 */
export function createContentGenerator(
  provider: AIProvider,
  options?: {
    systemPrompt?: string;
    retryOptions?: RetryOptions;
  }
): ContentGenerator {
  return new ContentGenerator(provider, options);
}
