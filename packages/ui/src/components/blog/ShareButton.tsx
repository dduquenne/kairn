"use client";

import { useCallback } from "react";

import { cn } from "../../utils/cn";

export interface ShareButtonProps {
  /** Title to share */
  title: string;
  /** Description/text to share */
  description?: string;
  /** URL to share (defaults to current page) */
  url?: string;
  /** Button label */
  label?: string;
  /** Show label on mobile */
  showLabelOnMobile?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback after sharing */
  onShare?: () => void;
  /** Fallback message when URL is copied */
  copyMessage?: string;
}

/**
 * Share button component using Web Share API with clipboard fallback
 *
 * @example
 * ```tsx
 * <ShareButton
 *   title="My Blog Post"
 *   description="Check out this article!"
 *   onShare={() => console.log("Shared!")}
 * />
 * ```
 */
export function ShareButton({
  title,
  description,
  url,
  label = "Share",
  showLabelOnMobile = false,
  className,
  onShare,
  copyMessage = "Link copied to clipboard!",
}: ShareButtonProps) {
  const handleShare = useCallback(async () => {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
        onShare?.();
      } catch (error) {
        // User cancelled or error (not an abort)
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert(copyMessage);
        onShare?.();
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
  }, [title, description, url, onShare, copyMessage]);

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "inline-flex items-center gap-2 text-sm text-ivory/70",
        "transition-colors hover:text-gold",
        className
      )}
      aria-label={`${label} ${title}`}
    >
      {/* Share icon */}
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      <span className={cn(showLabelOnMobile ? "" : "hidden sm:inline")}>
        {label}
      </span>
    </button>
  );
}

