"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

/**
 * Transforme le markdown basique en HTML (sans sanitization)
 */
function transformMarkdownToHtml(answer: string): string {
  let html = answer;

  // Basic markdown transformations
  // **gras** → <strong>gras</strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // *italique* → <em>italique</em>
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // _italique_ → <em>italique</em>
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  // [lien](url) → <a href="url">lien</a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-gold hover:text-gold/80">$1</a>');
  // `code inline` → <code>code inline</code>
  html = html.replace(/`([^`]+)`/g, "<code class='bg-night/50 text-gold px-1.5 py-0.5 rounded text-sm'>$1</code>");
  // Numéros ou - en début de ligne → listes
  html = html.replace(/^\d+\.\s+/gm, "• ");
  html = html.replace(/^-\s+/gm, "• ");
  // Sauts de ligne doubles → paragraphes
  html = html.replace(/\n\n+/g, "</p><p>");
  // Envelopper dans des paragraphes si nécessaire
  if (html && !html.startsWith("<")) {
    html = "<p>" + html + "</p>";
  }

  return html;
}

/**
 * Composant pour afficher la réponse Markdown d'une FAQ
 */
function FAQAnswerContent({ answer }: { answer: string }) {
  // Transformer le markdown initialement sans sanitization
  const rawHtml = useMemo(() => transformMarkdownToHtml(answer), [answer]);
  const [htmlContent, setHtmlContent] = useState<string>(rawHtml);

  useEffect(() => {
    // SÉCURITÉ : Import dynamique côté client uniquement pour éviter
    // la dépendance à jsdom côté serveur (mode standalone)
    import('isomorphic-dompurify').then((DOMPurify) => {
      const sanitizedHtml = DOMPurify.default.sanitize(rawHtml, {
        ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'code', 'br', 'ul', 'li', 'ol'],
        ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
        ADD_ATTR: ['target', 'rel'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      });
      setHtmlContent(sanitizedHtml);
    });
  }, [rawHtml]);

  return (
    <div
      className="prose-content text-ivory/80 leading-relaxed space-y-3"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export function FAQ({ items }: FAQProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Ensure all items have IDs
  const itemsWithIds = useMemo(() =>
    items.map((item, index) => ({
      ...item,
      id: item.id || `faq-${index}`,
    })),
    [items]
  );

  const toggleFAQ = async (id: string) => {
    const isCurrentlyOpen = openId === id;
    const newOpenState = !isCurrentlyOpen;

    setOpenId(newOpenState ? id : null);

    // Track FAQ interaction
    try {
      await fetch("/api/blog/faq-clicks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faqId: id,
          action: newOpenState ? "open" : "close",
        }),
      });
    } catch (error) {
      console.error("Failed to track FAQ interaction:", error);
    }
  };

  if (itemsWithIds.length === 0) {
    return null;
  }

  return (
    <section className="my-12 rounded-lg border border-ivory/10 bg-night/50 p-8 backdrop-blur-sm">
      <h2 className="mb-8 text-3xl font-semibold text-ivory">Questions fréquentes</h2>
      <div className="space-y-4">
        {itemsWithIds.map((item) => {
          const isOpen = openId === item.id;
          return (
            <motion.div
              key={item.id}
              initial={false}
              className="border border-ivory/10 rounded-lg bg-night/30 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(item.id)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-gold/5"
              >
                <span className="text-lg font-semibold text-ivory">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-gold transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="border-t border-ivory/10 bg-night/50 px-6 py-4">
                      <FAQAnswerContent answer={item.answer} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
