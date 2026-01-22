"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { FileText, Eye, BookOpen, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

// Import dynamique pour éviter les problèmes SSR
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

/**
 * Compte le nombre de mots dans un texte
 * Ignore la syntaxe Markdown et compte uniquement les mots visibles
 */
function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  // Supprimer les éléments Markdown syntaxe
  // Remove markdown links [text](url)
  let cleaned = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Remove markdown images ![alt](url)
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  // Remove markdown headers
  cleaned = cleaned.replace(/^#+\s/gm, "");
  // Remove markdown bold/italic
  cleaned = cleaned.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1");
  // Remove inline code
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // Découper par espaces et compter les mots non vides
  const words = cleaned
    .split(/\s+/)
    .filter((word) => word.length > 0);

  return words.length;
}

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  onImproveSelection?: (selectedText: string) => void;
}

export function ContentEditor({ value, onChange, placeholder, error, onImproveSelection }: ContentEditorProps) {
  const [isMarkdownMode, setIsMarkdownMode] = useState(true);
  const [selectedText, setSelectedText] = useState("");
  const [showImproveButton, setShowImproveButton] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Calculer le nombre de mots (mémorisé pour éviter les recalculs)
  const wordCount = useMemo(() => countWords(value), [value]);

  // Détecter la sélection de texte
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || "";

      if (text && text.length > 0 && editorRef.current?.contains(selection?.anchorNode || null)) {
        setSelectedText(text);
        setShowImproveButton(true);
      } else {
        setShowImproveButton(false);
      }
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("keyup", handleSelection);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("keyup", handleSelection);
    };
  }, []);

  const handleImproveClick = () => {
    if (selectedText && onImproveSelection) {
      onImproveSelection(selectedText);
      setShowImproveButton(false);
      window.getSelection()?.removeAllRanges();
    }
  };

  return (
    <div className="space-y-3 relative">
      {/* Header avec Toggle Buttons et Compteur de mots */}
      <div className="flex items-center justify-between gap-2">
        {/* Toggle Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsMarkdownMode(true)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              isMarkdownMode
                ? "bg-gold/20 text-gold"
                : "bg-night/50 text-ivory/70 hover:bg-gold/10"
            }`}
          >
            <FileText className="h-4 w-4" />
            Markdown
          </button>
          <button
            type="button"
            onClick={() => setIsMarkdownMode(false)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              !isMarkdownMode
                ? "bg-gold/20 text-gold"
                : "bg-night/50 text-ivory/70 hover:bg-gold/10"
            }`}
          >
            <Eye className="h-4 w-4" />
            WYSIWYG
          </button>
        </div>

        {/* Word Count Display */}
        <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-4 py-2">
          <BookOpen className="h-4 w-4 text-gold" />
          <span className="text-sm font-medium text-gold">
            {wordCount.toLocaleString("fr-FR")} mot{wordCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div ref={editorRef} className={error ? "ring-2 ring-red-500/50 rounded-lg" : ""}>
        {isMarkdownMode ? (
          <div data-color-mode="dark">
            <MDEditor
              value={value}
              onChange={(val) => onChange(val || "")}
              preview="live"
              height={600}
              visibleDragbar={false}
            />
          </div>
        ) : (
          <div data-color-mode="dark">
            <MDEditor
              value={value}
              onChange={(val) => onChange(val || "")}
              preview="preview"
              height={600}
              hideToolbar={false}
              visibleDragbar={false}
            />
          </div>
        )}
      </div>

      {/* Bouton flottant pour améliorer la sélection */}
      {showImproveButton && onImproveSelection && (
        <div className="fixed bottom-8 right-8 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={handleImproveClick}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold/80 px-6 py-3 font-medium text-night shadow-lg transition hover:shadow-xl hover:scale-105"
          >
            <Sparkles className="h-5 w-5" />
            Améliorer la sélection
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Guide rapide pour le markdown */}
      {isMarkdownMode && (
        <details className="rounded-lg border border-gold/20 bg-night/30 p-4">
          <summary className="cursor-pointer text-sm font-medium text-gold">
            Guide Markdown rapide
          </summary>
          <div className="mt-3 space-y-2 text-xs text-ivory/70">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <code className="text-gold"># Titre 1</code>
              </div>
              <div>
                <code className="text-gold">**gras**</code>
              </div>
              <div>
                <code className="text-gold">## Titre 2</code>
              </div>
              <div>
                <code className="text-gold">*italique*</code>
              </div>
              <div>
                <code className="text-gold">### Titre 3</code>
              </div>
              <div>
                <code className="text-gold">[lien](url)</code>
              </div>
              <div>
                <code className="text-gold">- Liste</code>
              </div>
              <div>
                <code className="text-gold">![image](url)</code>
              </div>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
