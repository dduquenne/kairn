"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Save, Loader } from "lucide-react";
import { BlogPost, BlogPostMetadata } from "@/lib/blog";
import { useToast } from "../../../../components/ui/toast";
import { MarkdownEditor } from "./MarkdownEditor";

interface BlogPostDrawerProps {
  post?: BlogPost;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

type FormData = {
  slug?: string;
  title: string;
  description: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  published: boolean;
};

const defaultFormData: FormData = {
  slug: "",
  title: "",
  description: "",
  content: "",
  author: "David Duquenne",
  category: "Comprendre",
  tags: [],
  image: "",
  published: true,
};

export function BlogPostDrawer({ post, isOpen, onClose, onSave }: BlogPostDrawerProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const isEditing = !!post;

  useEffect(() => {
    if (post) {
      setFormData({
        slug: post.slug,
        title: post.title,
        description: post.description,
        content: post.content,
        author: post.author,
        category: post.category,
        tags: post.tags,
        image: post.image,
        published: post.published,
      });
    } else {
      setFormData(defaultFormData);
    }
    setTagInput("");
    setErrors({});
  }, [post, isOpen]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Le titre est obligatoire";
    if (!formData.slug?.trim()) newErrors.slug = "Le slug est obligatoire";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(formData.slug || "")) {
      newErrors.slug = "Le slug doit contenir uniquement des lettres minuscules, des chiffres et des traits d'union";
    }
    if (!formData.author.trim()) newErrors.author = "L'auteur est obligatoire";
    if (!formData.category.trim()) newErrors.category = "La catégorie est obligatoire";
    if (!formData.content.trim()) newErrors.content = "Le contenu est obligatoire";
    if (!formData.description.trim()) newErrors.description = "La description est obligatoire";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      addToast({
        title: "Veuillez corriger les erreurs ci-dessous",
        variant: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const url = isEditing
        ? `/api/blog/posts/${post?.slug}`
        : "/api/blog/posts";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Échec lors de la ${isEditing ? "modification" : "création"} de l'article`);
      }

      addToast({
        title: isEditing ? "Article modifié avec succès" : "Article créé avec succès",
        variant: "success",
      });
      onClose();
      onSave();
    } catch (error) {
      console.error("Error saving post:", error);
      addToast({
        title: error instanceof Error ? error.message : "Échec de l'enregistrement de l'article",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditing, post, validateForm, addToast, onClose, onSave]);

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput("");
    }
  }, [tagInput, formData.tags]);

  const handleRemoveTag = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        onClick={(e) => e.stopPropagation()}
        className="h-screen max-h-screen w-full max-w-2xl flex flex-col bg-gradient-to-br from-night/90 to-night/70 border-l border-gold/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold/20 px-6 py-4">
          <h2 className="text-xl font-semibold text-ivory">
            {isEditing ? "Modifier l'article" : "Nouvel article"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gold">
                Titre *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }));
                  if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                }}
                className={`w-full rounded-lg border bg-night/50 px-4 py-2 text-ivory placeholder-ivory/40 transition focus:outline-none ${
                  errors.title
                    ? "border-red-500/50 focus:border-red-400"
                    : "border-gold/20 focus:border-gold"
                }`}
                placeholder="Titre de l'article"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-400">{errors.title}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gold">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, slug: e.target.value }));
                  if (errors.slug) setErrors(prev => ({ ...prev, slug: "" }));
                }}
                disabled={isEditing}
                className={`w-full rounded-lg border bg-night/50 px-4 py-2 text-ivory placeholder-ivory/40 transition focus:outline-none disabled:opacity-50 ${
                  errors.slug
                    ? "border-red-500/50 focus:border-red-400"
                    : "border-gold/20 focus:border-gold"
                }`}
                placeholder="article-slug"
              />
              {errors.slug && (
                <p className="mt-1 text-xs text-red-400">{errors.slug}</p>
              )}
              <p className="mt-1 text-xs text-ivory/40">Uniquement des lettres minuscules, chiffres et traits d'union</p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gold">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
                }}
                rows={2}
                className={`w-full rounded-lg border bg-night/50 px-4 py-2 text-ivory placeholder-ivory/40 transition focus:outline-none ${
                  errors.description
                    ? "border-red-500/50 focus:border-red-400"
                    : "border-gold/20 focus:border-gold"
                }`}
                placeholder="Courte description"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Author and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gold">
                  Auteur *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, author: e.target.value }));
                    if (errors.author) setErrors(prev => ({ ...prev, author: "" }));
                  }}
                  className={`w-full rounded-lg border bg-night/50 px-4 py-2 text-ivory placeholder-ivory/40 transition focus:outline-none ${
                    errors.author
                      ? "border-red-500/50 focus:border-red-400"
                      : "border-gold/20 focus:border-gold"
                  }`}
                  placeholder="David Duquenne"
                />
                {errors.author && (
                  <p className="mt-1 text-xs text-red-400">{errors.author}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gold">
                  Catégorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, category: e.target.value }));
                    if (errors.category) setErrors(prev => ({ ...prev, category: "" }));
                  }}
                  className={`w-full rounded-lg border bg-night/50 px-4 py-2 text-ivory transition focus:outline-none ${
                    errors.category
                      ? "border-red-500/50 focus:border-red-400"
                      : "border-gold/20 focus:border-gold"
                  }`}
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="Comprendre">Comprendre</option>
                  <option value="Traverser">Traverser</option>
                  <option value="Découvrir">Découvrir</option>
                  <option value="Cheminer">Cheminer</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-red-400">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gold">
                Tags
              </label>
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none"
                  placeholder="Ajouter un tag et appuyer sur Entrée"
                />
                <button
                  onClick={handleAddTag}
                  className="rounded-lg bg-gold/20 px-4 py-2 font-medium text-gold transition hover:bg-gold/30"
                >
                  Ajouter
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1 text-sm text-gold"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(index)}
                        className="hover:text-gold/70"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Image URL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gold">
                URL image (optionnel)
              </label>
              <input
                type="text"
                value={formData.image || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                className="w-full rounded-lg border border-gold/20 bg-night/50 px-4 py-2 text-ivory placeholder-ivory/40 transition focus:border-gold focus:outline-none"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Content */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gold">
                Contenu (Markdown) *
              </label>
              <div className={errors.content ? "ring-2 ring-red-500/50 rounded-lg" : ""}>
                <MarkdownEditor
                  value={formData.content}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, content: value }));
                    if (errors.content) setErrors(prev => ({ ...prev, content: "" }));
                  }}
                  placeholder="Écrivez le contenu de votre article en Markdown..."
                  height={400}
                />
              </div>
              {errors.content && (
                <p className="mt-1 text-xs text-red-400">{errors.content}</p>
              )}
            </div>

            {/* Published toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                className="h-4 w-4 rounded border-gold/20 text-gold focus:ring-gold"
              />
              <label htmlFor="published" className="text-sm font-medium text-ivory">
                Publié
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gold/20 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gold/30 px-6 py-2 font-medium text-gold transition hover:bg-gold/10"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-gold/20 px-6 py-2 font-medium text-gold transition hover:bg-gold/30 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
