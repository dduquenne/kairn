'use client';

/**
 * Advanced Options Tab
 *
 * Tags, slug, SEO settings, and writing tones.
 * Tones and slug generation sourced from @kairn/config and @kairn/blog.
 */

import { generateSlugFromTitleAndCategory } from '@kairn/blog';
import type { FAQItem } from '@kairn/blog';
import { Tag, Link2, Search, Palette, ChevronDown, X, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { useBlogAdminConfig } from '../context';

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
  jsonLd?: Record<string, unknown>;
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

/**
 * Onglet des options avancées (tags, slug, SEO, tons)
 */
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
  const { categorySlugMap, availableTones } = useBlogAdminConfig();
  const [expandedSection, setExpandedSection] = useState<string | null>('tags');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const generateSlug = () => {
    const newSlug = generateSlugFromTitleAndCategory(
      formData.title,
      formData.category,
      categorySlugMap
    );
    onFormDataChange({ slug: newSlug });
    if (errors.slug) onClearError('slug');
  };

  const tonesByCategory = availableTones.reduce(
    (acc, tone) => {
      if (!acc[tone.category]) acc[tone.category] = [];
      acc[tone.category]!.push(tone);
      return acc;
    },
    {} as Record<string, typeof availableTones>
  );

  return (
    <div className="space-y-4">
      {/* Tags Section */}
      <div className="border-gold/20 from-night/60 to-night/40 overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-sm">
        <button
          type="button"
          onClick={() => toggleSection('tags')}
          className="hover:bg-gold/5 flex w-full items-center justify-between px-6 py-4 transition"
        >
          <div className="flex items-center gap-3">
            <Tag className="text-gold h-5 w-5" />
            <span className="text-ivory font-semibold">Tags</span>
            {formData.tags.length > 0 && (
              <span className="bg-gold/20 text-gold rounded-full px-2 py-0.5 text-xs">
                {formData.tags.length}
              </span>
            )}
          </div>
          <ChevronDown
            className={`text-gold h-5 w-5 transition-transform ${
              expandedSection === 'tags' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSection === 'tags' && (
          <div className="border-gold/10 space-y-4 border-t px-6 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => onTagInputChange(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddTag();
                  }
                }}
                className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold flex-1 rounded-lg border px-4 py-2.5 transition focus:outline-none"
                placeholder="Ajouter un tag..."
              />
              <button
                type="button"
                onClick={onAddTag}
                className="bg-gold/20 text-gold hover:bg-gold/30 rounded-lg px-4 py-2.5 font-medium transition"
              >
                Ajouter
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gold/10 text-gold inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => onRemoveTag(index)}
                      className="hover:bg-gold/20 rounded-full p-0.5 transition"
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
      <div className="border-gold/20 from-night/60 to-night/40 overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-sm">
        <button
          type="button"
          onClick={() => toggleSection('slug')}
          className="hover:bg-gold/5 flex w-full items-center justify-between px-6 py-4 transition"
        >
          <div className="flex items-center gap-3">
            <Link2 className="text-gold h-5 w-5" />
            <span className="text-ivory font-semibold">URL (Slug)</span>
            {formData.slug && (
              <span className="text-ivory/50 max-w-[200px] truncate text-sm">/{formData.slug}</span>
            )}
          </div>
          <ChevronDown
            className={`text-gold h-5 w-5 transition-transform ${
              expandedSection === 'slug' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSection === 'slug' && (
          <div className="border-gold/10 space-y-3 border-t px-6 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.slug}
                onChange={e => {
                  onFormDataChange({ slug: e.target.value });
                  if (errors.slug) onClearError('slug');
                }}
                className={`bg-night/50 text-ivory placeholder-ivory/40 flex-1 rounded-lg border px-4 py-2.5 transition focus:outline-none ${
                  errors.slug
                    ? 'border-red-500/50 focus:border-red-400'
                    : 'border-gold/20 focus:border-gold'
                }`}
                placeholder="mon-article"
              />
              {!isEditing && (
                <button
                  type="button"
                  onClick={generateSlug}
                  disabled={!formData.title.trim() || !formData.category}
                  className="bg-gold/20 text-gold hover:bg-gold/30 flex items-center gap-2 rounded-lg px-4 py-2.5 font-medium transition disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Auto
                </button>
              )}
            </div>
            {errors.slug && <p className="text-xs text-red-400">{errors.slug}</p>}
            <p className="text-ivory/40 text-xs">URL finale : /blog/{formData.slug || '...'}</p>
          </div>
        )}
      </div>

      {/* SEO Section */}
      <div className="border-gold/20 from-night/60 to-night/40 overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-sm">
        <button
          type="button"
          onClick={() => toggleSection('seo')}
          className="hover:bg-gold/5 flex w-full items-center justify-between px-6 py-4 transition"
        >
          <div className="flex items-center gap-3">
            <Search className="text-gold h-5 w-5" />
            <span className="text-ivory font-semibold">SEO & Référencement</span>
          </div>
          <ChevronDown
            className={`text-gold h-5 w-5 transition-transform ${
              expandedSection === 'seo' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSection === 'seo' && (
          <div className="border-gold/10 space-y-4 border-t px-6 py-4">
            <div>
              <label className="text-gold mb-2 block text-sm font-medium">
                Intention de recherche
              </label>
              <input
                type="text"
                value={formData.seoIntent || ''}
                onChange={e => onFormDataChange({ seoIntent: e.target.value })}
                className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full rounded-lg border px-4 py-2.5 transition focus:outline-none"
                placeholder="Ex: Comprendre comment gérer l'anxiété naturellement"
              />
              <p className="text-ivory/40 mt-1 text-xs">
                Quelle question vos lecteurs se posent-ils ?
              </p>
            </div>

            <div>
              <label className="text-gold mb-2 block text-sm font-medium">Persona cible</label>
              <textarea
                value={formData.persona || ''}
                onChange={e => onFormDataChange({ persona: e.target.value })}
                rows={2}
                className="border-gold/20 bg-night/50 text-ivory placeholder-ivory/40 focus:border-gold w-full resize-none rounded-lg border px-4 py-2.5 transition focus:outline-none"
                placeholder="Ex: Personne anxieuse cherchant des solutions douces..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Writing Tones Section */}
      <div className="border-gold/20 from-night/60 to-night/40 overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-sm">
        <button
          type="button"
          onClick={() => toggleSection('tones')}
          className="hover:bg-gold/5 flex w-full items-center justify-between px-6 py-4 transition"
        >
          <div className="flex items-center gap-3">
            <Palette className="text-gold h-5 w-5" />
            <span className="text-ivory font-semibold">Tons de rédaction</span>
            {formData.tones && formData.tones.length > 0 && (
              <span className="bg-gold/20 text-gold rounded-full px-2 py-0.5 text-xs">
                {formData.tones.length}
              </span>
            )}
          </div>
          <ChevronDown
            className={`text-gold h-5 w-5 transition-transform ${
              expandedSection === 'tones' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSection === 'tones' && (
          <div className="border-gold/10 space-y-4 border-t px-6 py-4">
            {formData.tones && formData.tones.length > 0 && (
              <div className="border-gold/10 flex flex-wrap gap-2 border-b pb-3">
                {formData.tones.map(tone => {
                  const toneInfo = availableTones.find(t => t.value === tone);
                  return (
                    <span
                      key={tone}
                      className="bg-gold/20 text-gold inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                    >
                      {toneInfo?.label || tone}
                      <button
                        type="button"
                        onClick={() =>
                          onFormDataChange({
                            tones: formData.tones?.filter(t => t !== tone),
                          })
                        }
                        className="hover:bg-gold/30 rounded-full p-0.5 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="space-y-3">
              {Object.entries(tonesByCategory).map(([category, tones]) => (
                <div key={category}>
                  <p className="text-ivory/50 mb-2 text-xs font-semibold uppercase tracking-wider">
                    {category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tones.map(tone => {
                      const isSelected = formData.tones?.includes(tone.value);
                      return (
                        <button
                          key={tone.value}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              onFormDataChange({
                                tones: formData.tones?.filter(t => t !== tone.value),
                              });
                            } else {
                              onFormDataChange({
                                tones: [...(formData.tones || []), tone.value],
                              });
                            }
                          }}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                            isSelected
                              ? 'bg-gold text-night'
                              : 'bg-night/60 text-ivory/70 hover:bg-gold/20 hover:text-gold'
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

            <p className="text-ivory/40 text-xs">
              Ces tons guident le style de rédaction pour la génération IA
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
