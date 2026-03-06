'use client';

/**
 * Content Tab
 *
 * Content editor and FAQ editor in tab format.
 */

import type { FAQItem } from '@kairn/blog';
import { Wand2, Plus, Trash2, ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';

import { ContentEditor } from '../ContentEditor';

interface ContentTabProps {
  content: string;
  faqs: FAQItem[];
  error?: string;
  onContentChange: (content: string) => void;
  onFAQChange: (faqs: FAQItem[]) => void;
  onImproveClick: () => void;
  onImproveSelection: (selectedText: string) => void;
  onClearError: () => void;
}

/**
 * Onglet de contenu avec éditeur Markdown et FAQ
 */
export function ContentTab({
  content,
  faqs,
  error,
  onContentChange,
  onFAQChange,
  onImproveClick,
  onImproveSelection,
  onClearError,
}: ContentTabProps) {
  const [showFAQ, setShowFAQ] = useState(faqs.length > 0);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const addFAQ = () => {
    const newFAQ: FAQItem = {
      id: `faq-${Date.now()}`,
      question: '',
      answer: '',
    };
    onFAQChange([...faqs, newFAQ]);
    setExpandedFAQ(newFAQ.id || null);
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const newFAQs = [...faqs];
    const existingFAQ = newFAQs[index];
    if (existingFAQ) {
      newFAQs[index] = { ...existingFAQ, [field]: value };
      onFAQChange(newFAQs);
    }
  };

  const removeFAQ = (index: number) => {
    onFAQChange(faqs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Content Editor */}
      <div className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-ivory text-lg font-semibold">Contenu de l&apos;article</h3>
          {content.trim() && (
            <button
              type="button"
              onClick={onImproveClick}
              className="bg-gold/20 text-gold hover:bg-gold/30 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              <Wand2 className="h-4 w-4" />
              Améliorer avec l&apos;IA
            </button>
          )}
        </div>

        <ContentEditor
          value={content}
          onChange={value => {
            onContentChange(value);
            if (error) onClearError();
          }}
          error={error}
          onImproveSelection={onImproveSelection}
        />
      </div>

      {/* FAQ Section */}
      <div className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="text-gold h-5 w-5" />
            <h3 className="text-ivory text-lg font-semibold">Questions fréquentes (FAQ)</h3>
            {faqs.length > 0 && (
              <span className="bg-gold/20 text-gold rounded-full px-2.5 py-0.5 text-xs font-medium">
                {faqs.length}
              </span>
            )}
          </div>

          {!showFAQ && faqs.length === 0 ? (
            <button
              type="button"
              onClick={() => {
                setShowFAQ(true);
                addFAQ();
              }}
              className="bg-gold/10 text-gold hover:bg-gold/20 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              <Plus className="h-4 w-4" />
              Ajouter une FAQ
            </button>
          ) : (
            <button
              type="button"
              onClick={addFAQ}
              className="bg-gold/10 text-gold hover:bg-gold/20 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          )}
        </div>

        {showFAQ && faqs.length === 0 && (
          <p className="text-ivory/50 mt-4 text-sm">
            Les FAQ améliorent le SEO et aident vos lecteurs. Cliquez sur &quot;Ajouter&quot; pour
            commencer.
          </p>
        )}

        {faqs.length > 0 && (
          <div className="mt-4 space-y-3">
            {faqs.map((faq, index) => {
              const isExpanded = expandedFAQ === faq.id;

              return (
                <div
                  key={faq.id || index}
                  className="border-gold/10 bg-night/40 overflow-hidden rounded-lg border"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFAQ(isExpanded ? null : faq.id || null)}
                    className="hover:bg-gold/5 flex w-full items-center gap-3 px-4 py-3 text-left transition"
                  >
                    <ChevronDown
                      className={`text-gold h-4 w-4 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                    <span className="text-ivory flex-1 truncate font-medium">
                      {faq.question || `Question ${index + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        removeFAQ(index);
                      }}
                      className="text-ivory/40 rounded p-1 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </button>

                  {isExpanded && (
                    <div className="border-gold/10 space-y-4 border-t p-4">
                      <div>
                        <label className="text-gold mb-2 block text-sm font-medium">Question</label>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={e => updateFAQ(index, 'question', e.target.value)}
                          className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full rounded-lg border px-4 py-2.5 transition focus:outline-none"
                          placeholder="Posez la question ici"
                        />
                      </div>
                      <div>
                        <label className="text-gold mb-2 block text-sm font-medium">Réponse</label>
                        <textarea
                          value={faq.answer}
                          onChange={e => updateFAQ(index, 'answer', e.target.value)}
                          rows={3}
                          className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full resize-none rounded-lg border px-4 py-2.5 transition focus:outline-none"
                          placeholder="Rédigez la réponse"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
