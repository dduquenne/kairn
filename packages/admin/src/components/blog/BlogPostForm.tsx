"use client";

import { useState, useCallback, ReactNode } from "react";
import { cn } from "@kairn/ui";

export interface BlogPostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: "draft" | "published" | "scheduled";
  publishedAt?: Date;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  [key: string]: unknown;
}

export interface BlogPostFormProps {
  /** Initial form data */
  initialData?: Partial<BlogPostFormData>;
  /** Callback when form is submitted */
  onSubmit: (data: BlogPostFormData) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Whether form is in loading state */
  isLoading?: boolean;
  /** Custom class names */
  className?: string;
  /** Custom tabs/sections to render */
  customTabs?: Array<{
    id: string;
    label: string;
    content: ReactNode;
  }>;
  /** Labels configuration */
  labels?: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    status?: string;
    draft?: string;
    published?: string;
    scheduled?: string;
    save?: string;
    cancel?: string;
    essentials?: string;
    media?: string;
    seo?: string;
  };
}

/**
 * BlogPostForm - Form for creating/editing blog posts
 *
 * @example
 * ```tsx
 * <BlogPostForm
 *   initialData={{ title: "My Post", status: "draft" }}
 *   onSubmit={async (data) => {
 *     await saveBlogPost(data);
 *   }}
 *   onCancel={() => router.back()}
 * />
 * ```
 */
export function BlogPostForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
  customTabs = [],
  labels = {},
}: BlogPostFormProps) {
  const {
    title: titleLabel = "Titre",
    slug: slugLabel = "Slug",
    content: contentLabel = "Contenu",
    excerpt: excerptLabel = "Extrait",
    status: statusLabel = "Statut",
    draft = "Brouillon",
    published = "Publie",
    scheduled = "Planifie",
    save = "Enregistrer",
    cancel = "Annuler",
    essentials = "Essentiel",
    media = "Media",
    seo = "SEO",
  } = labels;

  const [formData, setFormData] = useState<Partial<BlogPostFormData>>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    status: "draft",
    ...initialData,
  });

  const [activeTab, setActiveTab] = useState("essentials");
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (field: keyof BlogPostFormData, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, []);

  const handleTitleChange = useCallback(
    (title: string) => {
      handleChange("title", title);
      if (!initialData?.slug) {
        handleChange("slug", generateSlug(title));
      }
    },
    [handleChange, generateSlug, initialData?.slug]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title?.trim()) {
      setError("Title is required");
      return;
    }

    try {
      await onSubmit(formData as BlogPostFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const tabs = [
    { id: "essentials", label: essentials },
    { id: "media", label: media },
    { id: "seo", label: seo },
    ...customTabs,
  ];

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-gold/20 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-t-md px-4 py-2 text-sm font-medium transition",
              activeTab === tab.id
                ? "bg-gold/20 text-gold"
                : "text-ivory/60 hover:text-ivory"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Tab content */}
      <div className="space-y-4">
        {activeTab === "essentials" && (
          <>
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ivory/70">
                {titleLabel}
              </label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                placeholder="Enter post title"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ivory/70">
                {slugLabel}
              </label>
              <input
                type="text"
                value={formData.slug || ""}
                onChange={(e) => handleChange("slug", e.target.value)}
                className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                placeholder="post-url-slug"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ivory/70">
                {statusLabel}
              </label>
              <select
                value={formData.status || "draft"}
                onChange={(e) =>
                  handleChange("status", e.target.value as BlogPostFormData["status"])
                }
                className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
              >
                <option value="draft">{draft}</option>
                <option value="published">{published}</option>
                <option value="scheduled">{scheduled}</option>
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ivory/70">
                {contentLabel}
              </label>
              <textarea
                value={formData.content || ""}
                onChange={(e) => handleChange("content", e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                placeholder="Write your content..."
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ivory/70">
                {excerptLabel}
              </label>
              <textarea
                value={formData.excerpt || ""}
                onChange={(e) => handleChange("excerpt", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                placeholder="Brief description..."
              />
            </div>
          </>
        )}

        {activeTab === "media" && (
          <div className="text-center text-ivory/50 py-8">
            <p>Media management section</p>
            <p className="text-xs mt-2">Configure with ImageSelectionModal component</p>
          </div>
        )}

        {activeTab === "seo" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ivory/70">
                Meta Title
              </label>
              <input
                type="text"
                value={(formData.metaTitle as string) || ""}
                onChange={(e) => handleChange("metaTitle", e.target.value)}
                className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                placeholder="SEO title"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ivory/70">
                Meta Description
              </label>
              <textarea
                value={(formData.metaDescription as string) || ""}
                onChange={(e) => handleChange("metaDescription", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gold/30 bg-night/50 px-4 py-2 text-ivory focus:border-gold focus:outline-none"
                placeholder="SEO description"
              />
            </div>
          </div>
        )}

        {/* Custom tabs content */}
        {customTabs.map(
          (tab) => activeTab === tab.id && <div key={tab.id}>{tab.content}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gold/20 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-gold/30 px-4 py-2 text-sm text-ivory/70 transition hover:bg-gold/10 disabled:opacity-50"
          >
            {cancel}
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-gold/20 border border-gold/50 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30 disabled:opacity-50"
        >
          {isLoading ? "..." : save}
        </button>
      </div>
    </form>
  );
}
