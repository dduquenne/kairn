"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Sun, Moon } from "lucide-react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "./markdown-editor.css";
import { ArticleThemeLight } from "@/app/blog/_components/ArticleThemeLight";
import { ArticleThemeDark } from "@/app/blog/_components/ArticleThemeDark";

// Charger l'éditeur uniquement côté client pour éviter les problèmes SSR
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-lg border border-ivory/20 bg-night/50 text-ivory/60">
      <div className="text-center">
        <div className="mb-2 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
        <p className="text-sm">Chargement de l'éditeur...</p>
      </div>
    </div>
  ),
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  preview?: "live" | "edit" | "preview";
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Écrivez votre contenu en Markdown...",
  height = 500,
  preview = "live",
}: MarkdownEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Générer un aperçu du contenu rendu
  useEffect(() => {
    if (!mounted || !value) {
      setHtmlContent("");
      return;
    }

    const generatePreview = async () => {
      setIsLoadingPreview(true);
      try {
        const { markdownToHtml } = await import("@/lib/mdx");
        const html = await markdownToHtml(value);
        setHtmlContent(html);
      } catch (error) {
        console.error("Erreur lors de la génération de l'aperçu:", error);
        setHtmlContent("");
      } finally {
        setIsLoadingPreview(false);
      }
    };

    const timer = setTimeout(generatePreview, 500); // Debounce de 500ms

    return () => clearTimeout(timer);
  }, [value, mounted]);

  if (!mounted) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-ivory/20 bg-night/50 text-ivory/60">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
          <p className="text-sm">Chargement de l'éditeur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="markdown-editor-wrapper" data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={height}
        preview={preview}
        textareaProps={{
          placeholder,
        }}
        style={{
          backgroundColor: "transparent",
        }}
        previewOptions={{
          className: "blog-content",
        }}
      />

      {/* Aide Markdown */}
      <details className="mt-4 rounded-lg border border-ivory/10 bg-night/30 p-4">
        <summary className="cursor-pointer text-sm font-medium text-ivory/80 hover:text-gold transition-colors">
          Guide Markdown rapide
        </summary>
        <div className="mt-4 grid gap-3 text-sm text-ivory/60 sm:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium text-ivory/80">Formatage de base</h4>
            <ul className="space-y-1 text-xs">
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">**gras**</code> → <strong>gras</strong></li>
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">*italique*</code> → <em>italique</em></li>
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">~~barré~~</code> → <del>barré</del></li>
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">`code`</code> → <code>code</code></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-medium text-ivory/80">Structure</h4>
            <ul className="space-y-1 text-xs">
              <li><code className="rounded bg-ivory/10 px-1 py-0.5"># Titre 1</code></li>
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">## Titre 2</code></li>
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">- Liste à puces</code></li>
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">1. Liste numérotée</code></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-medium text-ivory/80">Liens et images</h4>
            <ul className="space-y-1 text-xs">
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">[texte](url)</code> → lien</li>
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">![alt](url)</code> → image</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-medium text-ivory/80">Autres</h4>
            <ul className="space-y-1 text-xs">
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">&gt; Citation</code> → citation</li>
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">---</code> → ligne horizontale</li>
              <li><code className="rounded bg-ivory/10 px-1 py-0.5">```code```</code> → bloc de code</li>
            </ul>
          </div>
        </div>
      </details>

      {/* Aperçu WYSIWYG avec toggle jour/nuit */}
      {value && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ivory">Aperçu</h3>
            <div className="flex items-center gap-3">
              {isLoadingPreview && (
                <div className="flex items-center gap-2 text-sm text-ivory/50">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
                  Génération en cours...
                </div>
              )}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2 text-sm font-medium text-gold hover:bg-gold/20 transition-colors"
                title={isDarkMode ? "Passer au mode jour" : "Passer au mode nuit"}
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-4 w-4" />
                    <span>Jour</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    <span>Nuit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {htmlContent && (
            isDarkMode ? (
              <div className="rounded-lg overflow-hidden border border-gold/20">
                <ArticleThemeDark content={htmlContent} />
              </div>
            ) : (
              <div className="bg-gradient-to-b from-ivory via-ivory/95 to-ivory rounded-lg p-8">
                <ArticleThemeLight content={htmlContent} />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
