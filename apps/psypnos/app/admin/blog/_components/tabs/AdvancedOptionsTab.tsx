"use client";

import { useState } from "react";
import { Tag, Link2, Search, Users, Palette, ChevronDown, X, RefreshCw } from "lucide-react";
import { AVAILABLE_TONES } from "../../_utils/toneDefinitions";
import { generateSlugFromTitleAndCategory } from "../../_utils/generateSlug";
import type { FAQItem } from "@/lib/blog";

interface FormData {
  slug?: string;
  title: string;
  description: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  published: boolean;
  featured: boolean;
  date: string;
  faq: FAQItem[];
  jsonLd?: Record<string, any>;
  imagePrompt?: string;
  seoIntent?: string;
  persona?: string;
  tones?: string[];
}

interface AdvancedOptionsTabProps {
  formData: FormData;
  errors: Record<string, string>;
  tagInput: string;
  isEditing: boolean;
  onFormDataChange: (update: Partial<FormData>) => void;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (index: number) => void;
  onClearError: (field: string) => void;
}

export function AdvancedOptionsTab({
  formData,
  errors,
  tagInput,
  isEditing,
  onFormDataChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onClearError,
}: AdvancedOptionsTabProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("tags");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const generateSlug = () => {
    const newSlug = generateSlugFromTitleAndCategory(formData.title, formData.category);
    onFormDataChange({ slug: newSlug });
    if (errors.slug) onClearError("slug");
  };

  // Group tones by category for compact display
  const tonesByCategory = AVAILABLE_TONES.reduce((acc, tone) => {
    if (!acc[tone.category]) acc[tone.category] = [];
    acc[tone.category]!.push(tone);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_TONES>);

  return (
    <div className="space-y-4">
      {/* Tags Section */}
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 backdrop-blur-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("tags")}
          className="flex w-full items-center justify-between px-6 py-4 hover:bg-gold/5 transition"
        >
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-gold" />
            <span className="font-semibold text-ivory">Tags</span>
            {formData.tags.length > 0 && (
              <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">
                {formData.tags.length}
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gold transition-transform ${
              expandedSection === "tags" ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSection === "tags" && (
          <div className="border-t border-gold/10 px-6 py-4 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => onTagInputChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddTag();
                  }
                }}
                className="flex-1 rounded-lg border border-gold/20 bg-night/50 px-4 py-2.5 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none"
                placeholder="Ajouter un tag..."
              />
              <button
                type="button"
                onClick={onAddTag}
                className="rounded-lg bg-gold/20 px-4 py-2.5 font-medium text-gold transition hover:bg-gold/30"
              >
                Ajouter
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5 text-sm text-gold"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => onRemoveTag(index)}
                      className="rounded-full p-0.5 hover:bg-gold/20 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slug Section */}
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 backdrop-blur-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("slug")}
          className="flex w-full items-center justify-between px-6 py-4 hover:bg-gold/5 transition"
        >
          <div className="flex items-center gap-3">
            <Link2 className="h-5 w-5 text-gold" />
            <span className="font-semibold text-ivory">URL (Slug)</span>
            {formData.slug && (
              <span className="text-sm text-ivory/50 truncate max-w-[200px]">
                /{formData.slug}
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gold transition-transform ${
              expandedSection === "slug" ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSection === "slug" && (
          <div className="border-t border-gold/10 px-6 py-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => {
                  onFormDataChange({ slug: e.target.value });
                  if (errors.slug) onClearError("slug");
                }}
                className={`flex-1 rounded-lg border bg-night/50 px-4 py-2.5 text-ivory placeholder-ivory/40 transition focus:outline-none ${
                  errors.slug
                    ? "border-red-500/50 focus:border-red-400"
                    : "border-gold/20 focus:border-gold"
                }`}
                placeholder="mon-article"
              />
              {!isEditing && (
                <button
                  type="button"
                  onClick={generateSlug}
                  disabled={!formData.title.trim() || !formData.category}
                  className="flex items-center gap-2 rounded-lg bg-gold/20 px-4 py-2.5 font-medium text-gold transition hover:bg-gold/30 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Auto
                </button>
              )}
            </div>
            {errors.slug && (
              <p className="text-xs text-red-400">{errors.slug}</p>
            )}
            <p className="text-xs text-ivory/40">
              URL finale : /blog/{formData.slug || "..."}
            </p>
          </div>
        )}
      </div>

      {/* SEO Section */}
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 backdrop-blur-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("seo")}
          className="flex w-full items-center justify-between px-6 py-4 hover:bg-gold/5 transition"
        >
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-gold" />
            <span className="font-semibold text-ivory">SEO & Référencement</span>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gold transition-transform ${
              expandedSection === "seo" ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSection === "seo" && (
          <div className="border-t border-gold/10 px-6 py-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gold">
                Intention de recherche
              </label>
              <input
                type="text"
                value={formData.seoIntent || ""}
                onChange={(e) => onFormDataChange({ seoIntent: e.target.value })}
                className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2.5 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none"
                placeholder="Ex: Comprendre comment gérer l'anxiété naturellement"
              />
              <p className="mt-1 text-xs text-ivory/40">
                Quelle question vos lecteurs se posent-ils ?
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gold">
                Persona cible
              </label>
              <textarea
                value={formData.persona || ""}
                onChange={(e) => onFormDataChange({ persona: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2.5 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none resize-none"
                placeholder="Ex: Personne anxieuse cherchant des solutions douces..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Writing Tones Section */}
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 backdrop-blur-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("tones")}
          className="flex w-full items-center justify-between px-6 py-4 hover:bg-gold/5 transition"
        >
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-gold" />
            <span className="font-semibold text-ivory">Tons de rédaction</span>
            {formData.tones && formData.tones.length > 0 && (
              <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">
                {formData.tones.length}
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gold transition-transform ${
              expandedSection === "tones" ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSection === "tones" && (
          <div className="border-t border-gold/10 px-6 py-4 space-y-4">
            {/* Selected Tones */}
            {formData.tones && formData.tones.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-3 border-b border-gold/10">
                {formData.tones.map((tone) => {
                  const toneInfo = AVAILABLE_TONES.find((t) => t.value === tone);
                  return (
                    <span
                      key={tone}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1.5 text-sm font-medium text-gold"
                    >
                      {toneInfo?.label || tone}
                      <button
                        type="button"
                        onClick={() =>
                          onFormDataChange({
                            tones: formData.tones?.filter((t) => t !== tone),
                          })
                        }
                        className="rounded-full p-0.5 hover:bg-gold/30 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Tone Categories */}
            <div className="space-y-3">
              {Object.entries(tonesByCategory).map(([category, tones]) => (
                <div key={category}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ivory/50">
                    {category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tones.map((tone) => {
                      const isSelected = formData.tones?.includes(tone.value);
                      return (
                        <button
                          key={tone.value}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              onFormDataChange({
                                tones: formData.tones?.filter((t) => t !== tone.value),
                              });
                            } else {
                              onFormDataChange({
                                tones: [...(formData.tones || []), tone.value],
                              });
                            }
                          }}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                            isSelected
                              ? "bg-gold text-night"
                              : "bg-night/60 text-ivory/70 hover:bg-gold/20 hover:text-gold"
                          }`}
                        >
                          {tone.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-ivory/40">
              Ces tons guident le style de rédaction pour la génération IA
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
