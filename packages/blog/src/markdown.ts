/**
 * Markdown Processing
 * Converts markdown to HTML with syntax highlighting and custom styling
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { TocHeading } from './types';

/**
 * Plugin to mark blockquotes containing GitHub-style alerts
 */
function remarkMarkAlerts() {
  return (tree: any) => {
    visit(tree, 'blockquote', (node) => {
      if (node.children && node.children.length > 0) {
        const firstChild = node.children[0];
        if (firstChild.type === 'paragraph' && firstChild.children && firstChild.children.length > 0) {
          const textContent = firstChild.children
            .map((child: any) => (child.type === 'text' ? child.value : ''))
            .join('');

          // Detect alert type (case-insensitive)
          const upperText = textContent.toUpperCase();
          let alertType: string | null = null;

          if (upperText.includes('[!NOTE]')) {
            alertType = 'note';
          } else if (upperText.includes('[!TIP]')) {
            alertType = 'tip';
          } else if (upperText.includes('[!WARNING]')) {
            alertType = 'warning';
          }

          if (alertType) {
            // Mark blockquote with alert type
            node.data = node.data || {};
            node.data.hProperties = node.data.hProperties || {};
            node.data.hProperties['data-alert'] = alertType;

            // Clean text to remove marker
            firstChild.children = firstChild.children.map((child: any) => {
              if (child.type === 'text') {
                const cleanedText = child.value
                  .replace(/^\s*\[!NOTE\]\s*/i, '')
                  .replace(/^\s*\[!TIP\]\s*/i, '')
                  .replace(/^\s*\[!WARNING\]\s*/i, '')
                  .trim();
                return { ...child, value: cleanedText };
              }
              return child;
            });

            // Remove empty first paragraph
            const allChildrenEmpty = firstChild.children.every((child: any) => {
              if (child.type === 'text') {
                return child.value.trim().length === 0;
              }
              return false;
            });

            if (allChildrenEmpty) {
              node.children = node.children.slice(1);
            }
          }
        }
      }
    });
  };
}

/**
 * Plugin to handle GitHub-style alerts in rehype
 */
function rehypeGitHubAlerts() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'blockquote' && node.children && node.children.length > 0) {
        const firstChild = node.children[0];
        if (firstChild.tagName === 'p' && firstChild.children && firstChild.children.length > 0) {
          const textContent = firstChild.children
            .map((child: any) => (child.type === 'text' ? child.value : ''))
            .join('');

          const upperText = textContent.toUpperCase();
          let alertType: string | null = null;

          if (upperText.includes('[!NOTE]')) {
            alertType = 'note';
          } else if (upperText.includes('[!TIP]')) {
            alertType = 'tip';
          } else if (upperText.includes('[!WARNING]')) {
            alertType = 'warning';
          }

          if (alertType) {
            node.properties = node.properties || {};
            node.properties['data-alert'] = alertType;

            if (firstChild.children) {
              firstChild.children = firstChild.children.map((child: any) => {
                if (child.type === 'text') {
                  const cleanedText = child.value
                    .replace(/^\s*\[!NOTE\]\s*/i, '')
                    .replace(/^\s*\[!TIP\]\s*/i, '')
                    .replace(/^\s*\[!WARNING\]\s*/i, '')
                    .trim();
                  return { ...child, value: cleanedText };
                }
                return child;
              });

              const allChildrenEmpty = firstChild.children.every((child: any) => {
                if (child.type === 'text') {
                  return child.value.trim().length === 0;
                }
                return false;
              });

              if (allChildrenEmpty) {
                node.children.splice(0, 1);
              }
            }
          }
        }
      }
    });
  };
}

/**
 * Plugin to add CSS classes to elements
 * Can be customized via options
 */
function rehypeAddClasses(options: {
  classMap?: Record<string, string[]>;
} = {}) {
  const defaultClassMap: Record<string, string[]> = {
    h1: ['text-4xl', 'font-bold', 'mt-12', 'mb-6', 'scroll-mt-24', 'tracking-tight'],
    h2: ['text-3xl', 'font-bold', 'mt-12', 'mb-5', 'scroll-mt-24', 'tracking-tight'],
    h3: ['text-2xl', 'font-semibold', 'mt-10', 'mb-4', 'scroll-mt-24'],
    h4: ['text-xl', 'font-semibold', 'mt-8', 'mb-3', 'scroll-mt-24'],
    p: ['leading-loose', 'mb-6', 'text-base', 'tracking-wide'],
    ul: ['list-disc', 'list-inside', 'mb-6', 'space-y-3', 'ml-4'],
    ol: ['list-decimal', 'list-inside', 'mb-6', 'space-y-3', 'ml-4'],
    li: ['leading-relaxed'],
    a: ['underline', 'hover:opacity-80', 'transition-colors', 'font-medium'],
    pre: ['rounded-lg', 'p-4', 'mb-4', 'overflow-x-auto'],
    table: ['w-full', 'border-collapse', 'mb-4'],
    th: ['border', 'px-4', 'py-2', 'text-left', 'font-semibold'],
    td: ['border', 'px-4', 'py-2'],
    img: ['rounded-lg', 'my-6', 'w-full', 'h-auto', 'object-cover', 'max-h-96'],
    hr: ['my-8'],
  };

  const classMap = { ...defaultClassMap, ...options.classMap };

  return (tree: any) => {
    visit(tree, 'element', (node, _index, parent) => {
      const classes = classMap[node.tagName];
      if (classes) {
        node.properties = node.properties || {};

        // Skip blockquotes with data-alert
        if (node.tagName === 'blockquote' && node.properties['data-alert']) {
          return;
        }

        // Skip paragraphs inside alert blockquotes
        if (
          node.tagName === 'p' &&
          parent?.tagName === 'blockquote' &&
          parent?.properties?.['data-alert']
        ) {
          return;
        }

        node.properties.className = [
          ...(node.properties.className || []),
          ...classes,
        ];
      }
    });
  };
}

export interface MarkdownOptions {
  /** Custom class map for elements */
  classMap?: Record<string, string[]>;
  /** Enable syntax highlighting */
  highlight?: boolean;
  /** Enable GitHub-style alerts */
  githubAlerts?: boolean;
}

/**
 * Converts markdown content to HTML
 */
export async function markdownToHtml(
  markdown: string,
  options: MarkdownOptions = {}
): Promise<string> {
  const { classMap, highlight = true, githubAlerts = true } = options;

  let processor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  if (githubAlerts) {
    processor = processor.use(remarkMarkAlerts);
  }

  processor = processor
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: {
        className: ['anchor-link'],
      },
    });

  if (highlight) {
    processor = processor.use(rehypeHighlight);
  }

  if (githubAlerts) {
    processor = processor.use(rehypeGitHubAlerts);
  }

  processor = processor
    .use(rehypeAddClasses, { classMap })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const result = await processor.process(markdown);
  return result.toString();
}

/**
 * Extracts headings from markdown for table of contents
 */
export function extractHeadings(markdown: string): TocHeading[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * Calculates estimated reading time
 */
export function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min de lecture`;
}

/**
 * Extracts a plain text excerpt from markdown
 */
export function extractExcerpt(markdown: string, maxLength: number = 200): string {
  // Remove markdown syntax
  const plainText = markdown
    .replace(/#{1,6}\s+/g, '') // Headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/`(.+?)`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/>\s+/g, '') // Blockquotes
    .replace(/!\[.*?\]\(.*?\)/g, '') // Images
    .replace(/\n+/g, ' ') // Newlines
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.slice(0, maxLength).trim() + '...';
}
