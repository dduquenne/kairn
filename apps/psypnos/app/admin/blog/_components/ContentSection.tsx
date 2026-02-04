"use client";

import { Wand2 } from "lucide-react";

import { ContentEditor } from "./ContentEditor";

interface ContentSectionProps {
  content: string;
  error?: string;
  onContentChange: (value: string) => void;
  onImproveClick: () => void;
  onImproveSelection: (selectedText: string) => void;
  onClearError: () => void;
}

/**
 * ContentSection Component
 *
 * Displays the "Contenu de l'article" accordion section with the content editor
 * and improvement buttons.
 */
export function ContentSection({
  content,
  error,
  onContentChange,
  onImproveClick,
  onImproveSelection,
  onClearError,
}: ContentSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center gap-2">
        {content.trim() && (
          <button
            type="button"
            onClick={onImproveClick}
            className="flex items-center gap-2 rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30"
          >
            <Wand2 className="h-4 w-4" />
            Améliorer avec Claude
          </button>
        )}
      </div>
      <ContentEditor
        value={content}
        onChange={(value) => {
          onContentChange(value);
          if (error) onClearError();
        }}
        error={error}
        onImproveSelection={onImproveSelection}
      />
    </div>
  );
}
