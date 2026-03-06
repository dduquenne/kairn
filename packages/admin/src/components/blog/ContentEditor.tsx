'use client';

/**
 * Content Editor Component
 *
 * Markdown editor with word count, WYSIWYG toggle,
 * and inline text improvement button.
 */

import { FileText, Eye, BookOpen, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect, useRef } from 'react';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

/**
 * Compte le nombre de mots dans un texte.
 * Ignore la syntaxe Markdown et compte uniquement les mots visibles.
 *
 * @param text - Texte Markdown à analyser
 * @returns Nombre de mots
 */
function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  let cleaned = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/^#+\s/gm, '');
  cleaned = cleaned.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  const words = cleaned.split(/\s+/).filter(word => word.length > 0);

  return words.length;
}

interface ContentEditorProps {
  /** Contenu Markdown */
  value: string;
  /** Callback lors d'un changement de contenu */
  onChange: (value: string) => void;
  /** Texte placeholder */
  placeholder?: string;
  /** Message d'erreur */
  error?: string;
  /** Callback pour améliorer une sélection de texte */
  onImproveSelection?: (selectedText: string) => void;
}

/**
 * Éditeur de contenu Markdown avec compteur de mots,
 * toggle WYSIWYG et bouton d'amélioration de sélection.
 */
export function ContentEditor({
  value,
  onChange,
  placeholder: _placeholder,
  error,
  onImproveSelection,
}: ContentEditorProps) {
  const [isMarkdownMode, setIsMarkdownMode] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [showImproveButton, setShowImproveButton] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const wordCount = useMemo(() => countWords(value), [value]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      if (text && text.length > 0 && editorRef.current?.contains(selection?.anchorNode || null)) {
        setSelectedText(text);
        setShowImproveButton(true);
      } else {
        setShowImproveButton(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
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
    <div className="relative space-y-3">
      {/* Header avec Toggle Buttons et Compteur de mots */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsMarkdownMode(true)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              isMarkdownMode ? 'bg-gold/20 text-gold' : 'bg-night/50 text-ivory/70 hover:bg-gold/10'
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
                ? 'bg-gold/20 text-gold'
                : 'bg-night/50 text-ivory/70 hover:bg-gold/10'
            }`}
          >
            <Eye className="h-4 w-4" />
            WYSIWYG
          </button>
        </div>

        <div className="bg-gold/10 flex items-center gap-2 rounded-lg px-4 py-2">
          <BookOpen className="text-gold h-4 w-4" />
          <span className="text-gold text-sm font-medium">
            {wordCount.toLocaleString('fr-FR')} mot
            {wordCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div ref={editorRef} className={error ? 'rounded-lg ring-2 ring-red-500/50' : ''}>
        {isMarkdownMode ? (
          <div data-color-mode="dark">
            <MDEditor
              value={value}
              onChange={val => onChange(val || '')}
              preview="live"
              height={600}
              visibleDragbar={false}
            />
          </div>
        ) : (
          <div data-color-mode="dark">
            <MDEditor
              value={value}
              onChange={val => onChange(val || '')}
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
        <div className="animate-in fade-in slide-in-from-bottom-4 fixed bottom-8 right-8 z-40 duration-200">
          <button
            type="button"
            onClick={handleImproveClick}
            className="from-gold to-gold/80 text-night flex items-center gap-2 rounded-lg bg-gradient-to-r px-6 py-3 font-medium shadow-lg transition hover:scale-105 hover:shadow-xl"
          >
            <Sparkles className="h-5 w-5" />
            Améliorer la sélection
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Guide rapide pour le markdown */}
      {isMarkdownMode && (
        <details className="border-gold/20 bg-night/30 rounded-lg border p-4">
          <summary className="text-gold cursor-pointer text-sm font-medium">
            Guide Markdown rapide
          </summary>
          <div className="text-ivory/70 mt-3 space-y-2 text-xs">
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
