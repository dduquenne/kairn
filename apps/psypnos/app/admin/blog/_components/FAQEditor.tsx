"use client";

import { Plus, Trash2, ChevronDown } from "lucide-react";
import { useState } from "react";

import { FAQItem } from "@/lib/blog";

interface FAQEditorProps {
  faqs: FAQItem[];
  onChange: (faqs: FAQItem[]) => void;
}

export function FAQEditor({ faqs, onChange }: FAQEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Ensure all FAQs have IDs
  const faqsWithIds = faqs.map((faq, index) => ({
    ...faq,
    id: faq.id || `faq-${Date.now()}-${index}`,
  }));

  const addFAQ = () => {
    const id = `faq-${Date.now()}`;
    const newFAQ: FAQItem = {
      id,
      question: "",
      answer: "",
    };
    onChange([...faqs, newFAQ]);
    setExpandedId(id);
  };

  const updateFAQ = (id: string, field: "question" | "answer", value: string) => {
    onChange(
      faqsWithIds.map((faq) =>
        faq.id === id ? { ...faq, [field]: value } : faq
      )
    );
  };

  const removeFAQ = (id: string) => {
    onChange(faqsWithIds.filter((faq) => faq.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ivory">Questions fréquentes</h3>
          <p className="text-sm text-ivory/60">
            Ajoutez des FAQ pour aider vos lecteurs
          </p>
        </div>
        <button
          type="button"
          onClick={addFAQ}
          className="flex items-center gap-2 rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30"
        >
          <Plus className="h-4 w-4" />
          Ajouter une FAQ
        </button>
      </div>

      {faqsWithIds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gold/20 bg-night/30 p-8 text-center">
          <p className="text-sm text-ivory/50">
            Aucune FAQ pour le moment. Cliquez sur &quot;Ajouter une FAQ&quot; pour commencer.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqsWithIds.map((faq, index) => (
            <div
              key={faq.id}
              className="rounded-lg border border-gold/20 bg-night/50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expandedId === faq.id ? null : faq.id)
                  }
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <ChevronDown
                    className={`h-5 w-5 text-gold transition-transform ${
                      expandedId === faq.id ? "rotate-180" : ""
                    }`}
                  />
                  <div className="flex-1">
                    {faq.question ? (
                      <p className="font-medium text-ivory">{faq.question}</p>
                    ) : (
                      <p className="text-ivory/40 italic">
                        Question {index + 1} (vide)
                      </p>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => removeFAQ(faq.id)}
                  className="rounded-lg p-2 text-ivory/70 transition hover:bg-red-500/10 hover:text-red-400"
                  title="Supprimer cette FAQ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Content (expanded) */}
              {expandedId === faq.id && (
                <div className="border-t border-gold/20 p-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gold">
                      Question
                    </label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) =>
                        updateFAQ(faq.id, "question", e.target.value)
                      }
                      className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none"
                      placeholder="Quelle est votre question ?"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gold">
                      Réponse (Markdown supporté)
                    </label>
                    <textarea
                      value={faq.answer}
                      onChange={(e) =>
                        updateFAQ(faq.id, "answer", e.target.value)
                      }
                      rows={6}
                      className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none font-mono text-sm"
                      placeholder="Votre réponse détaillée... Markdown supporté: **gras**, *italique*, [lien](url), `code`"
                    />
                    <div className="mt-2 rounded-lg bg-night/30 p-3 text-xs text-ivory/60">
                      <p className="mb-2 font-medium text-gold">Markdown supporté:</p>
                      <ul className="space-y-1 ml-2">
                        <li>• <code>**texte**</code> pour le gras</li>
                        <li>• <code>*texte*</code> ou <code>_texte_</code> pour l'italique</li>
                        <li>• <code>[texte](url)</code> pour les liens</li>
                        <li>• <code>`code`</code> pour le code inline</li>
                        <li>• <code>- item</code> ou <code>1. item</code> pour les listes</li>
                        <li>• Doubles sauts de ligne pour les paragraphes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
