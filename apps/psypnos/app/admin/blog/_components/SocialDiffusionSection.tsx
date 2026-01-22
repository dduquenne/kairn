"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Share2,
  Sparkles,
  Loader2,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { SocialPlatformIcon } from "../../social/accounts/_components/SocialPlatformIcon";
import type { SocialPlatform, ContentTone, ContentAngle } from "@/lib/social/types";
import { CONTENT_TONES, CONTENT_ANGLES } from "@/lib/social/prompts";

interface GeneratedContent {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  characterCount: number;
}

interface SocialDiffusionSectionProps {
  blogSlug?: string;
  blogTitle: string;
  blogImage?: string;
  isNewPost: boolean;
}

const PLATFORMS: Array<{ id: SocialPlatform; name: string }> = [
  { id: "FACEBOOK", name: "Facebook" },
  { id: "LINKEDIN", name: "LinkedIn" },
  { id: "INSTAGRAM", name: "Instagram" },
  { id: "TWITTER", name: "Twitter/X" },
  { id: "THREADS", name: "Threads" },
];

export function SocialDiffusionSection({
  blogSlug,
  blogTitle,
  blogImage,
  isNewPost,
}: SocialDiffusionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    "FACEBOOK",
    "LINKEDIN",
    "INSTAGRAM",
  ]);
  const [selectedTone, setSelectedTone] = useState<ContentTone>("inspirant");
  const [selectedAngle, setSelectedAngle] = useState<ContentAngle>("benefices");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generations, setGenerations] = useState<GeneratedContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<SocialPlatform | null>(null);

  const togglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!blogSlug || selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogSlug,
          platforms: selectedPlatforms,
          tone: selectedTone,
          angle: selectedAngle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la génération");
      }

      setGenerations(data.generations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsGenerating(false);
    }
  }, [blogSlug, selectedPlatforms, selectedTone, selectedAngle]);

  const handleCopy = async (content: string, hashtags: string[], platform: SocialPlatform) => {
    const fullContent = `${content}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`;
    await navigator.clipboard.writeText(fullContent);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  // If new post without slug, show disabled state
  if (isNewPost && !blogSlug) {
    return (
      <div className="rounded-xl border border-gold/10 bg-night/30 p-4">
        <div className="flex items-center gap-3 text-ivory/40">
          <Share2 className="h-5 w-5" />
          <span>Sauvegardez l'article pour activer la diffusion sociale</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-6 py-4 hover:bg-gold/5 transition"
      >
        <div className="flex items-center gap-3">
          <Share2 className="h-5 w-5 text-gold" />
          <span className="font-semibold text-ivory">Diffusion réseaux sociaux</span>
          {generations.length > 0 && (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
              {generations.length} posts générés
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gold transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gold/10 px-6 py-4 space-y-5">
          {/* Platform Selection */}
          <div>
            <p className="mb-3 text-sm font-medium text-ivory">Plateformes</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? "bg-gold/20 text-gold ring-1 ring-gold/30"
                        : "bg-night/60 text-ivory/60 hover:bg-gold/10 hover:text-ivory"
                    }`}
                  >
                    <SocialPlatformIcon platform={platform.id} className="h-4 w-4" />
                    {platform.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone & Angle */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-ivory">Ton</label>
              <select
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value as ContentTone)}
                className="w-full rounded-lg border border-gold/20 bg-night/50 px-3 py-2 text-sm text-ivory transition focus:border-gold focus:outline-none"
              >
                {Object.values(CONTENT_TONES).map((tone) => (
                  <option key={tone.id} value={tone.id}>
                    {tone.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ivory">Angle</label>
              <select
                value={selectedAngle}
                onChange={(e) => setSelectedAngle(e.target.value as ContentAngle)}
                className="w-full rounded-lg border border-gold/20 bg-night/50 px-3 py-2 text-sm text-ivory transition focus:border-gold focus:outline-none"
              >
                {Object.values(CONTENT_ANGLES).map((angle) => (
                  <option key={angle.id} value={angle.id}>
                    {angle.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || selectedPlatforms.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold/20 px-4 py-3 font-medium text-gold transition hover:bg-gold/30 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Générer les posts
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Generated Content */}
          {generations.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-ivory">Contenu généré</p>

              {generations.map((gen) => (
                <div
                  key={gen.platform}
                  className="rounded-lg border border-gold/10 bg-night/40 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-gold/10 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <SocialPlatformIcon platform={gen.platform} className="h-4 w-4" />
                      <span className="font-medium text-ivory">
                        {PLATFORMS.find((p) => p.id === gen.platform)?.name}
                      </span>
                      <span className="text-xs text-ivory/40">
                        {gen.characterCount} caractères
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(gen.content, gen.hashtags, gen.platform)}
                      className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-gold hover:bg-gold/10 transition"
                    >
                      {copiedPlatform === gen.platform ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copier
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="whitespace-pre-wrap text-sm text-ivory/80">{gen.content}</p>
                    {gen.hashtags.length > 0 && (
                      <p className="mt-3 text-sm text-gold/70">
                        {gen.hashtags.map((h) => `#${h}`).join(" ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Link to full social page */}
              <a
                href={`/admin/social/posts/new?blogSlug=${blogSlug}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-gold/20 px-4 py-2.5 text-sm text-ivory/70 transition hover:border-gold/40 hover:text-ivory"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir dans l'éditeur complet
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
