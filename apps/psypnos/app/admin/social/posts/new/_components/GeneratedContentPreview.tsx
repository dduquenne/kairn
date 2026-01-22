"use client";

import { useState } from "react";
import { Copy, Edit2, Check, X } from "lucide-react";
import { SocialPlatformIcon } from "../../../accounts/_components/SocialPlatformIcon";
import type { GeneratedContent, SocialPlatform } from "@/lib/social/types";
import { PLATFORM_SPECS } from "@/lib/social/types";

interface GeneratedContentPreviewProps {
  generation: GeneratedContent;
  articleImage?: string;
  onContentChange: (content: string) => void;
  onCopy: () => void;
}

// Platform-specific styling for previews
const PLATFORM_PREVIEW_STYLES: Record<
  SocialPlatform,
  {
    containerClass: string;
    contentClass: string;
    hashtagClass: string;
    bgColor: string;
    textColor: string;
  }
> = {
  FACEBOOK: {
    containerClass: "bg-white rounded-xl shadow-lg",
    contentClass: "text-gray-900 leading-relaxed",
    hashtagClass: "text-blue-600",
    bgColor: "bg-[#F0F2F5]",
    textColor: "text-gray-900",
  },
  LINKEDIN: {
    containerClass: "bg-white rounded-xl shadow-lg",
    contentClass: "text-gray-800 leading-relaxed whitespace-pre-wrap",
    hashtagClass: "text-blue-700",
    bgColor: "bg-[#F3F2EF]",
    textColor: "text-gray-800",
  },
  INSTAGRAM: {
    containerClass: "bg-white rounded-xl shadow-lg",
    contentClass: "text-gray-900 leading-relaxed whitespace-pre-wrap",
    hashtagClass: "text-blue-500",
    bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
    textColor: "text-gray-900",
  },
  TWITTER: {
    containerClass: "bg-white rounded-xl shadow-lg",
    contentClass: "text-gray-900 leading-relaxed",
    hashtagClass: "text-blue-500",
    bgColor: "bg-gray-50",
    textColor: "text-gray-900",
  },
  THREADS: {
    containerClass: "bg-white rounded-xl shadow-lg",
    contentClass: "text-gray-900 leading-relaxed whitespace-pre-wrap",
    hashtagClass: "text-gray-600",
    bgColor: "bg-gray-50",
    textColor: "text-gray-900",
  },
};

export function GeneratedContentPreview({
  generation,
  articleImage,
  onContentChange,
  onCopy,
}: GeneratedContentPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(generation.content);
  const [copied, setCopied] = useState(false);

  const styles = PLATFORM_PREVIEW_STYLES[generation.platform];
  const specs = PLATFORM_SPECS[generation.platform];

  const handleSave = () => {
    onContentChange(editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(generation.content);
    setIsEditing(false);
  };

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate content stats
  const wordCount = generation.content.split(/\s+/).filter(Boolean).length;
  const charCount = generation.content.length;

  return (
    <div className="rounded-lg border border-gold/10 bg-night/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gold/10 bg-night/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <SocialPlatformIcon platform={generation.platform} className="h-6 w-6" />
          <span className="font-medium text-ivory">{specs.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          <span className="text-xs text-ivory/50">
            {wordCount} mots • {charCount} car.
          </span>

          {/* Actions */}
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="rounded p-1.5 text-ivory/50 transition hover:bg-gold/10 hover:text-ivory"
                title="Modifier"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleCopy}
                className="rounded p-1.5 text-ivory/50 transition hover:bg-gold/10 hover:text-ivory"
                title="Copier"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="rounded p-1.5 text-green-400 transition hover:bg-green-500/10"
                title="Sauvegarder"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancel}
                className="rounded p-1.5 text-red-400 transition hover:bg-red-500/10"
                title="Annuler"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className={`p-4 ${styles.bgColor}`}>
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={10}
            className="w-full resize-none rounded-lg border border-gray-300 bg-white p-4 text-gray-900 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
        ) : (
          <div className={styles.containerClass}>
            {/* Platform-specific preview */}
            <PlatformPreview
              platform={generation.platform}
              content={generation.content}
              hashtags={generation.hashtags}
              image={articleImage}
              styles={styles}
            />
          </div>
        )}
      </div>

      {/* Hashtags */}
      {generation.hashtags.length > 0 && !isEditing && (
        <div className="border-t border-gold/10 bg-night/30 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ivory/50">
            Hashtags ({generation.hashtags.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {generation.hashtags.map((hashtag) => (
              <span
                key={hashtag}
                className="rounded-full bg-gold/10 px-2.5 py-1 text-sm text-gold"
              >
                #{hashtag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// Platform-Specific Preview Components
// ===========================================

interface PlatformPreviewProps {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  image?: string;
  styles: (typeof PLATFORM_PREVIEW_STYLES)[SocialPlatform];
}

function PlatformPreview({
  platform,
  content,
  hashtags,
  image,
  styles,
}: PlatformPreviewProps) {
  switch (platform) {
    case "FACEBOOK":
      return <FacebookPreview content={content} hashtags={hashtags} image={image} styles={styles} />;
    case "LINKEDIN":
      return <LinkedInPreview content={content} hashtags={hashtags} styles={styles} />;
    case "INSTAGRAM":
      return <InstagramPreview content={content} hashtags={hashtags} image={image} styles={styles} />;
    case "TWITTER":
      return <TwitterPreview content={content} hashtags={hashtags} styles={styles} />;
    case "THREADS":
      return <ThreadsPreview content={content} hashtags={hashtags} styles={styles} />;
    default:
      return <DefaultPreview content={content} hashtags={hashtags} styles={styles} />;
  }
}

// Facebook Preview
function FacebookPreview({
  content,
  hashtags,
  image,
  styles,
}: Omit<PlatformPreviewProps, "platform">) {
  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
        <div>
          <p className="font-semibold text-gray-900">Psypnos</p>
          <p className="text-xs text-gray-500">Juste maintenant</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className={styles.contentClass}>{content}</p>
        {hashtags.length > 0 && (
          <p className={`mt-2 ${styles.hashtagClass}`}>
            {hashtags.map((h) => `#${h}`).join(" ")}
          </p>
        )}
      </div>

      {/* Image */}
      {image && (
        <div className="aspect-[1.91/1] overflow-hidden">
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex border-t border-gray-200 px-4 py-2">
        <button className="flex flex-1 items-center justify-center gap-2 py-2 text-gray-500">
          <span className="text-sm font-medium">J'aime</span>
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-2 text-gray-500">
          <span className="text-sm font-medium">Commenter</span>
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-2 text-gray-500">
          <span className="text-sm font-medium">Partager</span>
        </button>
      </div>
    </div>
  );
}

// LinkedIn Preview
function LinkedInPreview({
  content,
  hashtags,
  styles,
}: Omit<PlatformPreviewProps, "platform" | "image">) {
  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
        <div>
          <p className="font-semibold text-gray-900">David Duquenne</p>
          <p className="text-sm text-gray-500">
            Psychopraticien • Hypnose Ericksonienne
          </p>
          <p className="text-xs text-gray-400">Maintenant</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className={styles.contentClass}>{content}</p>
        {hashtags.length > 0 && (
          <p className={`mt-3 ${styles.hashtagClass}`}>
            {hashtags.map((h) => `#${h}`).join(" ")}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex border-t border-gray-200 px-2 py-1">
        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-gray-500 hover:bg-gray-100">
          <span className="text-sm font-medium">J'aime</span>
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-gray-500 hover:bg-gray-100">
          <span className="text-sm font-medium">Commenter</span>
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-gray-500 hover:bg-gray-100">
          <span className="text-sm font-medium">Republier</span>
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-gray-500 hover:bg-gray-100">
          <span className="text-sm font-medium">Envoyer</span>
        </button>
      </div>
    </div>
  );
}

// Instagram Preview
function InstagramPreview({
  content,
  hashtags,
  image,
  styles,
}: Omit<PlatformPreviewProps, "platform">) {
  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
        <p className="font-semibold text-gray-900">psypnos</p>
      </div>

      {/* Image */}
      {image && (
        <div className="aspect-square overflow-hidden">
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 p-3 pb-2">
        <button className="text-gray-900">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
        <button className="text-gray-900">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
        <button className="text-gray-900">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
        <button className="ml-auto text-gray-900">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </div>

      {/* Caption */}
      <div className="px-3 pb-4">
        <p className={styles.contentClass}>
          <span className="font-semibold">psypnos</span> {content}
        </p>
        {hashtags.length > 0 && (
          <p className={`mt-1 ${styles.hashtagClass}`}>
            {hashtags.map((h) => `#${h}`).join(" ")}
          </p>
        )}
      </div>
    </div>
  );
}

// Twitter Preview
function TwitterPreview({
  content,
  hashtags,
  styles,
}: Omit<PlatformPreviewProps, "platform" | "image">) {
  return (
    <div className="p-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="font-bold text-gray-900">Psypnos</span>
            <span className="text-gray-500">@psypnos</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500">Maintenant</span>
          </div>
          <p className={`mt-1 ${styles.contentClass}`}>
            {content}
            {hashtags.length > 0 && (
              <span className={` ${styles.hashtagClass}`}>
                {" "}
                {hashtags.map((h) => `#${h}`).join(" ")}
              </span>
            )}
          </p>

          {/* Actions */}
          <div className="mt-3 flex justify-between max-w-xs text-gray-500">
            <button className="flex items-center gap-1 hover:text-blue-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
            <button className="flex items-center gap-1 hover:text-green-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button className="flex items-center gap-1 hover:text-red-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <button className="flex items-center gap-1 hover:text-blue-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Threads Preview
function ThreadsPreview({
  content,
  hashtags,
  styles,
}: Omit<PlatformPreviewProps, "platform" | "image">) {
  return (
    <div className="p-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">psypnos</span>
            <span className="text-gray-500">• Maintenant</span>
          </div>
          <p className={`mt-2 ${styles.contentClass}`}>
            {content}
            {hashtags.length > 0 && (
              <span className={` ${styles.hashtagClass}`}>
                {" "}
                {hashtags.map((h) => `#${h}`).join(" ")}
              </span>
            )}
          </p>

          {/* Actions */}
          <div className="mt-3 flex gap-4 text-gray-400">
            <button className="hover:text-gray-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <button className="hover:text-gray-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
            <button className="hover:text-gray-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button className="hover:text-gray-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default Preview
function DefaultPreview({
  content,
  hashtags,
  styles,
}: Omit<PlatformPreviewProps, "platform" | "image">) {
  return (
    <div className="p-4">
      <p className={styles.contentClass}>{content}</p>
      {hashtags.length > 0 && (
        <p className={`mt-2 ${styles.hashtagClass}`}>
          {hashtags.map((h) => `#${h}`).join(" ")}
        </p>
      )}
    </div>
  );
}
