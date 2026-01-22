"use client";

import { useState, useCallback } from "react";
import { Image, Calendar, Send, Wand2 } from "lucide-react";
import { cn } from "@kairn/ui";
import { PlatformSelector, Platform } from "./PlatformSelector";

export interface SocialPostData {
  content: string;
  platforms: Platform[];
  mediaUrls?: string[];
  scheduledAt?: Date;
}

export interface SocialPostEditorProps {
  /** Initial content */
  initialContent?: string;
  /** Available platforms */
  availablePlatforms: Platform[];
  /** Callback when post is submitted */
  onSubmit: (data: SocialPostData) => Promise<void>;
  /** Callback to generate content with AI */
  onGenerateContent?: (prompt: string) => Promise<string>;
  /** Whether submission is loading */
  isLoading?: boolean;
  /** Maximum character count (by platform) */
  maxCharacters?: Record<string, number>;
  /** Custom class names */
  className?: string;
  /** Labels */
  labels?: {
    placeholder?: string;
    publish?: string;
    schedule?: string;
    addMedia?: string;
    generateWithAI?: string;
    characters?: string;
  };
}

const DEFAULT_MAX_CHARS: Record<string, number> = {
  twitter: 280,
  threads: 500,
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
};

/**
 * SocialPostEditor - Editor for creating social media posts
 *
 * @example
 * ```tsx
 * <SocialPostEditor
 *   availablePlatforms={[
 *     { id: 'fb', name: 'facebook', label: 'Facebook', enabled: true },
 *     { id: 'ig', name: 'instagram', label: 'Instagram', enabled: true },
 *   ]}
 *   onSubmit={handlePublish}
 *   onGenerateContent={generateWithAI}
 * />
 * ```
 */
export function SocialPostEditor({
  initialContent = "",
  availablePlatforms,
  onSubmit,
  onGenerateContent,
  isLoading = false,
  maxCharacters = DEFAULT_MAX_CHARS,
  className,
  labels = {},
}: SocialPostEditorProps) {
  const {
    placeholder = "What's on your mind?",
    publish = "Publish Now",
    schedule = "Schedule",
    addMedia = "Add Media",
    generateWithAI = "Generate with AI",
    characters = "characters",
  } = labels;

  const [content, setContent] = useState(initialContent);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTogglePlatform = useCallback((platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.some((p) => p.id === platform.id)
        ? prev.filter((p) => p.id !== platform.id)
        : [...prev, platform]
    );
  }, []);

  const getCharacterCount = () => {
    // Get the most restrictive limit from selected platforms
    if (selectedPlatforms.length === 0) return null;

    const limits = selectedPlatforms.map(
      (p) => maxCharacters[p.name] || DEFAULT_MAX_CHARS[p.name] || 5000
    );
    const minLimit = Math.min(...limits);

    return {
      current: content.length,
      max: minLimit,
      isOver: content.length > minLimit,
    };
  };

  const charCount = getCharacterCount();

  const handleSubmit = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return;

    const data: SocialPostData = {
      content: content.trim(),
      platforms: selectedPlatforms,
    };

    if (showScheduler && scheduledDate && scheduledTime) {
      data.scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    }

    await onSubmit(data);
    setContent("");
    setSelectedPlatforms([]);
    setShowScheduler(false);
  };

  const handleGenerate = async () => {
    if (!onGenerateContent) return;
    setIsGenerating(true);
    try {
      const generated = await onGenerateContent(content || "Create an engaging post");
      setContent(generated);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn("rounded-xl border border-gold/20 bg-night/60 p-4", className)}>
      {/* Platform selector */}
      <div className="mb-4">
        <PlatformSelector
          platforms={availablePlatforms}
          selectedPlatforms={selectedPlatforms}
          onToggle={handleTogglePlatform}
        />
      </div>

      {/* Content textarea */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={6}
          className="w-full resize-none rounded-lg border border-gold/20 bg-night/40 p-4 text-ivory placeholder-ivory/40 focus:border-gold focus:outline-none"
        />

        {/* Character count */}
        {charCount && (
          <div
            className={cn(
              "absolute bottom-2 right-2 text-xs",
              charCount.isOver ? "text-red-400" : "text-ivory/40"
            )}
          >
            {charCount.current}/{charCount.max} {characters}
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-gold/20 px-3 py-2 text-sm text-ivory/70 transition hover:bg-gold/10 hover:text-ivory"
        >
          <Image size={16} />
          {addMedia}
        </button>

        {onGenerateContent && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm text-purple-400 transition hover:bg-purple-500/20 disabled:opacity-50"
          >
            <Wand2 size={16} className={isGenerating ? "animate-pulse" : ""} />
            {generateWithAI}
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowScheduler(!showScheduler)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition",
            showScheduler
              ? "border-gold/50 bg-gold/20 text-gold"
              : "border-gold/20 text-ivory/70 hover:bg-gold/10 hover:text-ivory"
          )}
        >
          <Calendar size={16} />
          {schedule}
        </button>

        <div className="ml-auto">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !content.trim() || selectedPlatforms.length === 0}
            className="flex items-center gap-2 rounded-lg bg-gold/20 border border-gold/50 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
            {showScheduler && scheduledDate ? schedule : publish}
          </button>
        </div>
      </div>

      {/* Scheduler */}
      {showScheduler && (
        <div className="mt-4 flex flex-wrap gap-3 border-t border-gold/20 pt-4">
          <div>
            <label className="mb-1 block text-xs text-ivory/50">Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="rounded-lg border border-gold/20 bg-night/40 px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ivory/50">Time</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="rounded-lg border border-gold/20 bg-night/40 px-3 py-2 text-sm text-ivory focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
