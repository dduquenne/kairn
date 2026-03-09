"use client";

import { Sparkles, Calendar, Eye, EyeOff, Star } from "lucide-react";

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

interface EssentialsTabProps {
  formData: FormData;
  errors: Record<string, string>;
  onFormDataChange: (update: Partial<FormData>) => void;
  onClearError: (field: string) => void;
  onOpenGenerator: () => void;
}

export function EssentialsTab({
  formData,
  errors,
  onFormDataChange,
  onClearError,
  onOpenGenerator,
}: EssentialsTabProps) {
  return (
    <div className="space-y-6">
      {/* AI Generation CTA */}
      <div className="rounded-xl border-2 border-dashed border-gold/30 bg-gradient-to-br from-gold/5 to-gold/10 p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20">
            <Sparkles className="h-7 w-7 text-gold" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-ivory">
              Besoin d'aide pour rédiger ?
            </h3>
            <p className="mt-1 text-sm text-ivory/60">
              L'IA peut générer un article complet à partir d'un sujet, avec image et FAQ inclus.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenGenerator}
            className="flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-medium text-night transition hover:bg-gold/90"
          >
            <Sparkles className="h-5 w-5" />
            Générer avec l'IA
          </button>
        </div>
      </div>

      {/* Main Fields */}
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <h3 className="mb-6 text-lg font-semibold text-ivory">
          Informations essentielles
        </h3>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gold">
              Titre de l'article *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                onFormDataChange({ title: e.target.value });
                if (errors.title) onClearError("title");
              }}
              className={`w-full rounded-lg border bg-night/50 px-4 py-3 text-ivory placeholder-ivory/40 transition focus:outline-none ${
                errors.title
                  ? "border-red-500/50 focus:border-red-400"
                  : "border-gold/20 focus:border-gold"
              }`}
              placeholder="Un titre accrocheur pour votre article"
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gold">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                onFormDataChange({ description: e.target.value });
                if (errors.description) onClearError("description");
              }}
              rows={3}
              className={`w-full rounded-lg border bg-night/50 px-4 py-3 text-ivory placeholder-ivory/40 transition focus:outline-none resize-none ${
                errors.description
                  ? "border-red-500/50 focus:border-red-400"
                  : "border-gold/20 focus:border-gold"
              }`}
              placeholder="Une description courte qui donne envie de lire l'article (utilisée pour le SEO)"
            />
            {errors.description && (
              <p className="mt-1.5 text-xs text-red-400">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-ivory/40">
              {formData.description.length}/160 caractères recommandés pour le SEO
            </p>
          </div>

          {/* Category + Date Row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gold">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  onFormDataChange({ category: e.target.value });
                  if (errors.category) onClearError("category");
                }}
                className={`w-full rounded-lg border bg-night/50 px-4 py-3 text-ivory transition focus:outline-none ${
                  errors.category
                    ? "border-red-500/50 focus:border-red-400"
                    : "border-gold/20 focus:border-gold"
                }`}
              >
                <option value="">Choisir une catégorie</option>
                <option value="Comprendre">Comprendre</option>
                <option value="Traverser">Traverser</option>
                <option value="Découvrir">Découvrir</option>
                <option value="Cheminer">Cheminer</option>
              </select>
              {errors.category && (
                <p className="mt-1.5 text-xs text-red-400">{errors.category}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gold">
                Date de publication *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ivory/40" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    onFormDataChange({ date: e.target.value });
                    if (errors.date) onClearError("date");
                  }}
                  className={`w-full rounded-lg border bg-night/50 py-3 pl-11 pr-4 text-ivory transition focus:outline-none ${
                    errors.date
                      ? "border-red-500/50 focus:border-red-400"
                      : "border-gold/20 focus:border-gold"
                  }`}
                />
              </div>
              {errors.date && (
                <p className="mt-1.5 text-xs text-red-400">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gold">
              Auteur *
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => {
                onFormDataChange({ author: e.target.value });
                if (errors.author) onClearError("author");
              }}
              className={`w-full rounded-lg border bg-night/50 px-4 py-3 text-ivory placeholder-ivory/40 transition focus:outline-none ${
                errors.author
                  ? "border-red-500/50 focus:border-red-400"
                  : "border-gold/20 focus:border-gold"
              }`}
              placeholder="Nathalie Duquenne"
            />
            {errors.author && (
              <p className="mt-1.5 text-xs text-red-400">{errors.author}</p>
            )}
          </div>
        </div>
      </div>

      {/* Publication Status */}
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold text-ivory">
          Statut de publication
        </h3>

        <div className="space-y-4">
          {/* Published Toggle */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onFormDataChange({ published: !formData.published })}
              className={`relative flex h-12 w-24 items-center rounded-full p-1 transition-colors ${
                formData.published ? "bg-green-500/20" : "bg-night/80"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br shadow-lg transition-all ${
                  formData.published
                    ? "translate-x-12 from-green-400 to-green-500"
                    : "translate-x-0 from-ivory/20 to-ivory/30"
                }`}
              >
                {formData.published ? (
                  <Eye className="h-5 w-5 text-night" />
                ) : (
                  <EyeOff className="h-5 w-5 text-ivory/60" />
                )}
              </span>
            </button>

            <div>
              <p className="font-medium text-ivory">
                {formData.published ? "Article publié" : "Brouillon"}
              </p>
              <p className="text-sm text-ivory/60">
                {formData.published
                  ? new Date(formData.date) > new Date()
                    ? "Sera visible le " +
                      new Date(formData.date).toLocaleDateString("fr-FR")
                    : "Visible sur le site"
                  : "Non visible sur le site"}
              </p>
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-4 pt-4 border-t border-gold/10">
            <button
              type="button"
              onClick={() => onFormDataChange({ featured: !formData.featured })}
              className={`relative flex h-12 w-24 items-center rounded-full p-1 transition-colors ${
                formData.featured ? "bg-gold/20" : "bg-night/80"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br shadow-lg transition-all ${
                  formData.featured
                    ? "translate-x-12 from-gold to-amber-500"
                    : "translate-x-0 from-ivory/20 to-ivory/30"
                }`}
              >
                <Star
                  className={`h-5 w-5 ${
                    formData.featured ? "text-night fill-night" : "text-ivory/60"
                  }`}
                />
              </span>
            </button>

            <div>
              <p className="font-medium text-ivory">
                {formData.featured ? "Mis en avant" : "Standard"}
              </p>
              <p className="text-sm text-ivory/60">
                {formData.featured
                  ? "Affiché dans le carrousel de la page blog"
                  : "Affiché dans la liste normale"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
