"use client";

import { Wand2, Plus, Trash2, ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

import type { FAQItem } from "@/lib/blog";

import { ContentEditor } from "../ContentEditor";


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
      question: "",
      answer: "",
    };
    onFAQChange([...faqs, newFAQ]);
    setExpandedFAQ(newFAQ.id || null);
  };

  const updateFAQ = (index: number, field: "question" | "answer", value: string) => {
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
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ivory">
            Contenu de l'article
          </h3>
          {content.trim() && (
            <button
              type="button"
              onClick={onImproveClick}
              className="flex items-center gap-2 rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30"
            >
              <Wand2 className="h-4 w-4" />
              Améliorer avec l'IA
            </button>
          )}
        </div>

        <ContentEditor
          value={content}
          onChange={(value) => {
            onContentChange(value);
            if (error) onClearError();
          }}
          error={error}
          onImproveSelection={onImproveSelection}
        />
      </div>

      {/* FAQ Section */}
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-gold" />
            <h3 className="text-lg font-semibold text-ivory">
              Questions fréquentes (FAQ)
            </h3>
            {faqs.length > 0 && (
              <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-medium text-gold">
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
              className="flex items-center gap-2 rounded-lg bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/20"
            >
              <Plus className="h-4 w-4" />
              Ajouter une FAQ
            </button>
          ) : (
            <button
              type="button"
              onClick={addFAQ}
              className="flex items-center gap-2 rounded-lg bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/20"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          )}
        </div>

        {showFAQ && faqs.length === 0 && (
          <p className="mt-4 text-sm text-ivory/50">
            Les FAQ améliorent le SEO et aident vos lecteurs. Cliquez sur "Ajouter" pour commencer.
          </p>
        )}

        {faqs.length > 0 && (
          <div className="mt-4 space-y-3">
            {faqs.map((faq, index) => {
              const isExpanded = expandedFAQ === faq.id;

              return (
                <div
                  key={faq.id || index}
                  className="rounded-lg border border-gold/10 bg-night/40 overflow-hidden"
                >
                  {/* FAQ Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedFAQ(isExpanded ? null : faq.id || null)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gold/5 transition"
                  >
                    <ChevronDown
                      className={`h-4 w-4 text-gold transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                    <span className="flex-1 font-medium text-ivory truncate">
                      {faq.question || `Question ${index + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFAQ(index);
                      }}
                      className="rounded p-1 text-ivory/40 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </button>

                  {/* FAQ Content */}
                  {isExpanded && (
                    <div className="border-t border-gold/10 p-4 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gold">
                          Question
                        </label>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => updateFAQ(index, "question", e.target.value)}
                          className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2.5 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none"
                          placeholder="Posez la question ici"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gold">
                          Réponse
                        </label>
                        <textarea
                          value={faq.answer}
                          onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2.5 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none resize-none"
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
