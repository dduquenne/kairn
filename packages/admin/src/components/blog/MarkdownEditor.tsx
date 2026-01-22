"use client";

import { useState, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Quote,
  Eye,
  Edit,
} from "lucide-react";
import { cn } from "@kairn/ui";

export interface MarkdownEditorProps {
  /** Current content */
  value: string;
  /** Callback when content changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Editor height */
  height?: string;
  /** Whether to show preview by default */
  defaultPreview?: boolean;
  /** Custom class names */
  className?: string;
  /** Label for the editor */
  label?: string;
  /** Callback to upload images */
  onImageUpload?: (file: File) => Promise<string>;
}

interface ToolbarButton {
  icon: typeof Bold;
  label: string;
  action: () => void;
  shortcut?: string;
}

/**
 * MarkdownEditor - Simple markdown editor with toolbar and preview
 *
 * @example
 * ```tsx
 * <MarkdownEditor
 *   value={content}
 *   onChange={setContent}
 *   placeholder="Write your article..."
 *   height="400px"
 * />
 * ```
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write in markdown...",
  height = "400px",
  defaultPreview = false,
  className,
  label,
  onImageUpload,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(defaultPreview);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = useCallback(
    (before: string, after: string = "", placeholder: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || placeholder;

      const newValue =
        value.substring(0, start) +
        before +
        textToInsert +
        after +
        value.substring(end);

      onChange(newValue);

      // Restore focus and selection
      setTimeout(() => {
        textarea.focus();
        if (selectedText) {
          textarea.setSelectionRange(
            start + before.length,
            start + before.length + textToInsert.length
          );
        } else {
          const cursorPos = start + before.length + placeholder.length;
          textarea.setSelectionRange(cursorPos, cursorPos);
        }
      }, 0);
    },
    [value, onChange]
  );

  const toolbarButtons: ToolbarButton[] = [
    {
      icon: Bold,
      label: "Bold",
      action: () => insertText("**", "**", "bold text"),
      shortcut: "Ctrl+B",
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertText("_", "_", "italic text"),
      shortcut: "Ctrl+I",
    },
    {
      icon: Heading1,
      label: "Heading 1",
      action: () => insertText("# ", "", "Heading 1"),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      action: () => insertText("## ", "", "Heading 2"),
    },
    {
      icon: Heading3,
      label: "Heading 3",
      action: () => insertText("### ", "", "Heading 3"),
    },
    {
      icon: List,
      label: "Bullet List",
      action: () => insertText("- ", "", "list item"),
    },
    {
      icon: ListOrdered,
      label: "Numbered List",
      action: () => insertText("1. ", "", "list item"),
    },
    {
      icon: Link,
      label: "Link",
      action: () => insertText("[", "](url)", "link text"),
    },
    {
      icon: Image,
      label: "Image",
      action: () => insertText("![", "](url)", "alt text"),
    },
    {
      icon: Code,
      label: "Code",
      action: () => insertText("`", "`", "code"),
    },
    {
      icon: Quote,
      label: "Quote",
      action: () => insertText("> ", "", "quote"),
    },
  ];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "b") {
          e.preventDefault();
          insertText("**", "**", "bold text");
        } else if (e.key === "i") {
          e.preventDefault();
          insertText("_", "_", "italic text");
        }
      }
    },
    [insertText]
  );

  // Simple markdown to HTML conversion for preview
  const renderPreview = (text: string) => {
    let html = text
      // Headings
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-gold hover:underline">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4" />')
      // Code
      .replace(/`([^`]+)`/g, '<code class="bg-night/50 px-1 rounded text-sm">$1</code>')
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gold/50 pl-4 italic text-ivory/70">$1</blockquote>')
      // Lists
      .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal">$2</li>')
      // Paragraphs (simple)
      .replace(/\n\n/g, "</p><p class='my-2'>");

    return `<p class="my-2">${html}</p>`;
  };

  return (
    <div className={cn("rounded-lg border border-gold/30 bg-night/50", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gold/20 p-2">
        {toolbarButtons.map((button) => {
          const Icon = button.icon;
          return (
            <button
              key={button.label}
              type="button"
              onClick={button.action}
              title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ""}`}
              className="rounded p-1.5 text-ivory/60 transition hover:bg-gold/10 hover:text-gold"
            >
              <Icon size={16} />
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs transition",
              !isPreview ? "bg-gold/20 text-gold" : "text-ivory/60 hover:text-ivory"
            )}
          >
            <Edit size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs transition",
              isPreview ? "bg-gold/20 text-gold" : "text-ivory/60 hover:text-ivory"
            )}
          >
            <Eye size={14} />
            Preview
          </button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div style={{ height }}>
        {isPreview ? (
          <div
            className="prose prose-invert max-w-none overflow-auto p-4 text-ivory"
            style={{ height }}
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-full w-full resize-none bg-transparent p-4 text-ivory focus:outline-none"
            style={{ height }}
          />
        )}
      </div>
    </div>
  );
}
