// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

/**
 * Plugin remark pour marquer les blockquotes contenant des alertes GitHub-style
 * Ajoute un attribut data pour la détection en rehype
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

          // Détecter le type d'alerte (case-insensitive)
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
            // Marquer le blockquote avec le type d'alerte
            node.data = node.data || {};
            node.data.hProperties = node.data.hProperties || {};
            node.data.hProperties['data-alert'] = alertType;

            // Nettoyer le texte du premier paragraphe pour enlever le marqueur [!...]
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

            // Si le premier paragraphe ne contient que le marqueur (maintenant vide),
            // le supprimer complètement pour éviter une boîte vide
            const allChildrenEmpty = firstChild.children.every((child: any) => {
              if (child.type === 'text') {
                return child.value.trim().length === 0;
              }
              return false;
            });

            if (allChildrenEmpty) {
              // Supprimer le premier paragraphe vide
              node.children = node.children.slice(1);
            }
          }
        }
      }
    });
  };
}

/**
 * Plugin rehype pour gérer les alertes de style GitHub (> [!note], > [!tip], > [!warning])
 * Détecte les alertes dans le premier paragraphe et ajoute des data-attributes
 * Masque aussi les marqueurs [!...] du texte affiché
 */
function rehypeGitHubAlerts() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'blockquote' && node.children && node.children.length > 0) {
        const firstChild = node.children[0];
        if (firstChild.tagName === 'p' && firstChild.children && firstChild.children.length > 0) {
          // Extraire le texte brut du premier enfant
          const textContent = firstChild.children
            .map((child: any) => (child.type === 'text' ? child.value : ''))
            .join('');

          // Détecter le type d'alerte (case-insensitive)
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
            // Ajouter l'attribut data-alert
            node.properties = node.properties || {};
            node.properties['data-alert'] = alertType;

            // Nettoyer le texte du premier paragraphe pour enlever le marqueur [!...]
            if (firstChild.children) {
              firstChild.children = firstChild.children.map((child: any) => {
                if (child.type === 'text') {
                  // Enlever le marqueur [!NOTE], [!TIP], ou [!WARNING]
                  const cleanedText = child.value
                    .replace(/^\s*\[!NOTE\]\s*/i, '')
                    .replace(/^\s*\[!TIP\]\s*/i, '')
                    .replace(/^\s*\[!WARNING\]\s*/i, '')
                    .trim();
                  return { ...child, value: cleanedText };
                }
                return child;
              });

              // Si le premier paragraphe ne contient que le marqueur (maintenant vide),
              // le supprimer
              const allChildrenEmpty = firstChild.children.every((child: any) => {
                if (child.type === 'text') {
                  return child.value.trim().length === 0;
                }
                return false;
              });

              if (allChildrenEmpty) {
                // Supprimer le paragraphe vide
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
 * Plugin rehype personnalisé qui ajoute les classes Tailwind aux éléments
 */
function rehypeAddTailwindClasses() {
  return (tree: any) => {
    visit(tree, (node: any, index: number | undefined, parent: any) => {
      // Headings
      if (node.tagName === 'h1') {
        node.properties = node.properties || {};
        node.properties.className = ['text-4xl', 'font-bold', 'text-ivory', 'mt-12', 'mb-6', 'scroll-mt-24', 'tracking-tight'];
      }
      if (node.tagName === 'h2') {
        node.properties = node.properties || {};
        node.properties.className = ['text-3xl', 'font-bold', 'text-ivory', 'mt-12', 'mb-5', 'scroll-mt-24', 'tracking-tight'];
      }
      if (node.tagName === 'h3') {
        node.properties = node.properties || {};
        node.properties.className = ['text-2xl', 'font-semibold', 'text-gold/95', 'mt-10', 'mb-4', 'scroll-mt-24'];
      }
      if (node.tagName === 'h4') {
        node.properties = node.properties || {};
        node.properties.className = ['text-xl', 'font-semibold', 'text-ivory', 'mt-8', 'mb-3', 'scroll-mt-24'];
      }

      // Paragraphes
      if (node.tagName === 'p') {
        node.properties = node.properties || {};

        // Vérifier si le parent est un blockquote avec data-alert
        const parentIsAlertBlockquote =
          parent?.tagName === 'blockquote' &&
          parent?.properties?.['data-alert'];

        // Ne pas appliquer les classes Tailwind aux paragraphes à l'intérieur des callouts
        if (!parentIsAlertBlockquote) {
          node.properties.className = ['text-ivory/85', 'leading-loose', 'mb-6', 'text-base', 'tracking-wide'];
        } else {
          // Pour les callouts, utiliser les classes CSS seulement
          node.properties.className = [];
        }
      }

      // Listes
      if (node.tagName === 'ul') {
        node.properties = node.properties || {};
        node.properties.className = ['list-disc', 'list-inside', 'text-ivory/85', 'mb-6', 'space-y-3', 'ml-4'];
      }
      if (node.tagName === 'ol') {
        node.properties = node.properties || {};
        node.properties.className = ['list-decimal', 'list-inside', 'text-ivory/85', 'mb-6', 'space-y-3', 'ml-4'];
      }
      // List items
      if (node.tagName === 'li') {
        node.properties = node.properties || {};
        node.properties.className = ['text-ivory/85', 'leading-relaxed'];
      }

      // Liens
      if (node.tagName === 'a') {
        node.properties = node.properties || {};
        node.properties.className = ['text-gold', 'underline', 'hover:text-gold/80', 'transition-colors', 'font-medium'];
      }

      // Code inline
      if (node.tagName === 'code' && node.parent?.tagName !== 'pre') {
        node.properties = node.properties || {};
        node.properties.className = ['bg-ivory/10', 'text-gold', 'px-1.5', 'py-0.5', 'rounded', 'text-sm'];
      }

      // Blocs de code
      if (node.tagName === 'pre') {
        node.properties = node.properties || {};
        node.properties.className = ['bg-night/80', 'border', 'border-ivory/10', 'rounded-lg', 'p-4', 'mb-4', 'overflow-x-auto'];
      }

      // Blockquotes
      if (node.tagName === 'blockquote') {
        node.properties = node.properties || {};
        const classNameArray = node.properties.className || [];

        // Skip blockquotes with data-alert (already styled by CSS)
        if (node.properties['data-alert']) {
          // Don't apply Tailwind classes to alert blockquotes
          node.properties.className = [];
          return;
        }

        // Vérifier si c'est une note-block
        if (classNameArray.includes('note-block')) {
          node.properties.className = [
            'rounded-lg',
            'border-l-4',
            'border-gold',
            'bg-gold/5',
            'px-6',
            'py-5',
            'my-6',
            'backdrop-blur-sm',
            'relative',
            'overflow-hidden',
            'not-italic',
            'text-ivory/85',
          ];
        } else {
          // Blockquote standard
          node.properties.className = ['border-l-4', 'border-gold', 'pl-4', 'italic', 'text-ivory/70', 'my-4'];
        }
      }

      // Tables
      if (node.tagName === 'table') {
        node.properties = node.properties || {};
        node.properties.className = ['w-full', 'border-collapse', 'mb-4'];
      }
      if (node.tagName === 'th') {
        node.properties = node.properties || {};
        node.properties.className = ['border', 'border-ivory/20', 'bg-ivory/5', 'px-4', 'py-2', 'text-left', 'text-ivory', 'font-semibold'];
      }
      if (node.tagName === 'td') {
        node.properties = node.properties || {};
        node.properties.className = ['border', 'border-ivory/20', 'px-4', 'py-2', 'text-ivory/80'];
      }

      // Images
      if (node.tagName === 'img') {
        node.properties = node.properties || {};
        node.properties.className = ['rounded-lg', 'my-6', 'w-full', 'h-auto', 'object-cover', 'max-h-96'];
      }

      // Séparateurs
      if (node.tagName === 'hr') {
        node.properties = node.properties || {};
        node.properties.className = ['border-ivory/10', 'my-8'];
      }

      // Notes (:::note ... :::)
      if (node.tagName === 'div' && node.properties?.className?.includes('note-block')) {
        node.properties = node.properties || {};
        node.properties.className = [
          'rounded-lg',
          'border-l-4',
          'border-gold',
          'bg-gold/5',
          'px-6',
          'py-5',
          'my-6',
          'backdrop-blur-sm',
          'relative',
          'overflow-hidden',
          'before:absolute',
          'before:inset-0',
          'before:bg-gradient-to-br',
          'before:from-gold/10',
          'before:to-transparent',
          'before:pointer-events-none',
          'before:-z-10'
        ];
      }

      // Enlever les liens des headings (rehypeAutolinkHeadings les enveloppe)
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)) {
        if (node.children && node.children[0]?.tagName === 'a') {
          // C'est un heading avec un lien (de rehypeAutolinkHeadings)
          // Garder juste le texte du lien
          const linkNode = node.children[0];
          if (linkNode.children) {
            node.children = linkNode.children;
          }
        }
      }
    });
  };
}

/**
 * Transforme le contenu Markdown en HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm) // Support pour GitHub Flavored Markdown (tables, strikethrough, etc.)
    .use(remarkMarkAlerts) // Marquer les alertes dans l'AST remark
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug) // Ajoute des IDs aux headings
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: {
        className: ['anchor-link'],
      },
    })
    .use(rehypeHighlight) // Coloration syntaxique du code
    .use(rehypeGitHubAlerts) // Gérer les alertes GitHub (data-alert attributes)
    .use(rehypeAddTailwindClasses) // Ajouter les classes Tailwind
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return result.toString();
}

/**
 * Extrait les headings du contenu pour générer une table des matières
 */
export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

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
