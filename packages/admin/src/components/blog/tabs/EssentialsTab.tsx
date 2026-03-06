'use client';

/**
 * Essentials Tab
 *
 * Main form fields: title, description, category, date, author,
 * publication status, featured toggle. Categories are sourced
 * from BlogAdminContext.
 */

import type { FAQItem } from '@kairn/blog';
import { Sparkles, Calendar, Eye, EyeOff, Star } from 'lucide-react';

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

interface EssentialsTabProps {
  formData: FormData;
  errors: Record<string, string>;
  onFormDataChange: (update: Partial<FormData>) => void;
  onClearError: (field: string) => void;
  onOpenGenerator: () => void;
}

/**
 * Onglet des informations essentielles de l'article
 */
export function EssentialsTab({
  formData,
  errors,
  onFormDataChange,
  onClearError,
  onOpenGenerator,
}: EssentialsTabProps) {
  const { categories } = useBlogAdminConfig();

  return (
    <div className="space-y-6">
      {/* AI Generation CTA */}
      <div className="border-gold/30 from-gold/5 to-gold/10 rounded-xl border-2 border-dashed bg-gradient-to-br p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="bg-gold/20 flex h-14 w-14 items-center justify-center rounded-full">
            <Sparkles className="text-gold h-7 w-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-ivory text-lg font-semibold">Besoin d&apos;aide pour rédiger ?</h3>
            <p className="text-ivory/60 mt-1 text-sm">
              L&apos;IA peut générer un article complet à partir d&apos;un sujet, avec image et FAQ
              inclus.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenGenerator}
            className="bg-gold text-night hover:bg-gold/90 flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition"
          >
            <Sparkles className="h-5 w-5" />
            Générer avec l&apos;IA
          </button>
        </div>
      </div>

      {/* Main Fields */}
      <div className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-6 backdrop-blur-sm">
        <h3 className="text-ivory mb-6 text-lg font-semibold">Informations essentielles</h3>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="text-gold mb-2 block text-sm font-medium">
              Titre de l&apos;article *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => {
                onFormDataChange({ title: e.target.value });
                if (errors.title) onClearError('title');
              }}
              className={`bg-night/50 text-ivory placeholder-ivory/40 w-full rounded-lg border px-4 py-3 transition focus:outline-none ${
                errors.title
                  ? 'border-red-500/50 focus:border-red-400'
                  : 'border-gold/20 focus:border-gold'
              }`}
              placeholder="Un titre accrocheur pour votre article"
            />
            {errors.title && <p className="mt-1.5 text-xs text-red-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="text-gold mb-2 block text-sm font-medium">Description *</label>
            <textarea
              value={formData.description}
              onChange={e => {
                onFormDataChange({ description: e.target.value });
                if (errors.description) onClearError('description');
              }}
              rows={3}
              className={`bg-night/50 text-ivory placeholder-ivory/40 w-full resize-none rounded-lg border px-4 py-3 transition focus:outline-none ${
                errors.description
                  ? 'border-red-500/50 focus:border-red-400'
                  : 'border-gold/20 focus:border-gold'
              }`}
              placeholder="Une description courte qui donne envie de lire l'article (utilisée pour le SEO)"
            />
            {errors.description && (
              <p className="mt-1.5 text-xs text-red-400">{errors.description}</p>
            )}
            <p className="text-ivory/40 mt-1 text-xs">
              {formData.description.length}/160 caractères recommandés pour le SEO
            </p>
          </div>

          {/* Category + Date Row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="text-gold mb-2 block text-sm font-medium">Catégorie *</label>
              <select
                value={formData.category}
                onChange={e => {
                  onFormDataChange({ category: e.target.value });
                  if (errors.category) onClearError('category');
                }}
                className={`bg-night/50 text-ivory w-full rounded-lg border px-4 py-3 transition focus:outline-none ${
                  errors.category
                    ? 'border-red-500/50 focus:border-red-400'
                    : 'border-gold/20 focus:border-gold'
                }`}
              >
                <option value="">Choisir une catégorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1.5 text-xs text-red-400">{errors.category}</p>}
            </div>

            <div>
              <label className="text-gold mb-2 block text-sm font-medium">
                Date de publication *
              </label>
              <div className="relative">
                <Calendar className="text-ivory/40 absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => {
                    onFormDataChange({ date: e.target.value });
                    if (errors.date) onClearError('date');
                  }}
                  className={`bg-night/50 text-ivory w-full rounded-lg border py-3 pl-11 pr-4 transition focus:outline-none ${
                    errors.date
                      ? 'border-red-500/50 focus:border-red-400'
                      : 'border-gold/20 focus:border-gold'
                  }`}
                />
              </div>
              {errors.date && <p className="mt-1.5 text-xs text-red-400">{errors.date}</p>}
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="text-gold mb-2 block text-sm font-medium">Auteur *</label>
            <input
              type="text"
              value={formData.author}
              onChange={e => {
                onFormDataChange({ author: e.target.value });
                if (errors.author) onClearError('author');
              }}
              className={`bg-night/50 text-ivory placeholder-ivory/40 w-full rounded-lg border px-4 py-3 transition focus:outline-none ${
                errors.author
                  ? 'border-red-500/50 focus:border-red-400'
                  : 'border-gold/20 focus:border-gold'
              }`}
              placeholder={formData.author || "Nom de l'auteur"}
            />
            {errors.author && <p className="mt-1.5 text-xs text-red-400">{errors.author}</p>}
          </div>
        </div>
      </div>

      {/* Publication Status */}
      <div className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-6 backdrop-blur-sm">
        <h3 className="text-ivory mb-4 text-lg font-semibold">Statut de publication</h3>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onFormDataChange({ published: !formData.published })}
              className={`relative flex h-12 w-24 items-center rounded-full p-1 transition-colors ${
                formData.published ? 'bg-green-500/20' : 'bg-night/80'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br shadow-lg transition-all ${
                  formData.published
                    ? 'translate-x-12 from-green-400 to-green-500'
                    : 'from-ivory/20 to-ivory/30 translate-x-0'
                }`}
              >
                {formData.published ? (
                  <Eye className="text-night h-5 w-5" />
                ) : (
                  <EyeOff className="text-ivory/60 h-5 w-5" />
                )}
              </span>
            </button>

            <div>
              <p className="text-ivory font-medium">
                {formData.published ? 'Article publié' : 'Brouillon'}
              </p>
              <p className="text-ivory/60 text-sm">
                {formData.published
                  ? new Date(formData.date) > new Date()
                    ? 'Sera visible le ' + new Date(formData.date).toLocaleDateString('fr-FR')
                    : 'Visible sur le site'
                  : 'Non visible sur le site'}
              </p>
            </div>
          </div>

          <div className="border-gold/10 flex items-center gap-4 border-t pt-4">
            <button
              type="button"
              onClick={() => onFormDataChange({ featured: !formData.featured })}
              className={`relative flex h-12 w-24 items-center rounded-full p-1 transition-colors ${
                formData.featured ? 'bg-gold/20' : 'bg-night/80'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br shadow-lg transition-all ${
                  formData.featured
                    ? 'from-gold translate-x-12 to-amber-500'
                    : 'from-ivory/20 to-ivory/30 translate-x-0'
                }`}
              >
                <Star
                  className={`h-5 w-5 ${
                    formData.featured ? 'fill-night text-night' : 'text-ivory/60'
                  }`}
                />
              </span>
            </button>

            <div>
              <p className="text-ivory font-medium">
                {formData.featured ? 'Mis en avant' : 'Standard'}
              </p>
              <p className="text-ivory/60 text-sm">
                {formData.featured
                  ? 'Affiché dans le carrousel de la page blog'
                  : 'Affiché dans la liste normale'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
