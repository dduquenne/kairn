"use client";

import { cn } from "@kairn/ui";

export interface Platform {
  id: string;
  name: "facebook" | "instagram" | "twitter" | "linkedin" | "threads";
  label: string;
  enabled: boolean;
  icon?: string;
}

export interface PlatformSelectorProps {
  /** Available platforms */
  platforms: Platform[];
  /** Currently selected platforms */
  selectedPlatforms: Platform[];
  /** Callback when a platform is toggled */
  onToggle: (platform: Platform) => void;
  /** Whether multi-select is allowed */
  multiSelect?: boolean;
  /** Custom class names */
  className?: string;
}

const PLATFORM_STYLES: Record<
  Platform["name"],
  { bg: string; bgActive: string; text: string; border: string }
> = {
  facebook: {
    bg: "bg-blue-600/10",
    bgActive: "bg-blue-600/30",
    text: "text-blue-400",
    border: "border-blue-500/50",
  },
  instagram: {
    bg: "bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10",
    bgActive: "bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-orange-500/30",
    text: "text-pink-400",
    border: "border-pink-500/50",
  },
  twitter: {
    bg: "bg-sky-500/10",
    bgActive: "bg-sky-500/30",
    text: "text-sky-400",
    border: "border-sky-500/50",
  },
  linkedin: {
    bg: "bg-blue-700/10",
    bgActive: "bg-blue-700/30",
    text: "text-blue-300",
    border: "border-blue-400/50",
  },
  threads: {
    bg: "bg-gray-500/10",
    bgActive: "bg-gray-500/30",
    text: "text-gray-300",
    border: "border-gray-400/50",
  },
};

const PLATFORM_ICONS: Record<Platform["name"], string> = {
  facebook: "f",
  instagram: "",
  twitter: "X",
  linkedin: "in",
  threads: "@",
};

/**
 * PlatformSelector - Select social media platforms for posting
 *
 * @example
 * ```tsx
 * <PlatformSelector
 *   platforms={availablePlatforms}
 *   selectedPlatforms={selected}
 *   onToggle={handleToggle}
 * />
 * ```
 */
export function PlatformSelector({
  platforms,
  selectedPlatforms,
  onToggle,
  multiSelect = true,
  className,
}: PlatformSelectorProps) {
  const isSelected = (platform: Platform) =>
    selectedPlatforms.some((p) => p.id === platform.id);

  const handleClick = (platform: Platform) => {
    if (!platform.enabled) return;

    if (!multiSelect && !isSelected(platform)) {
      // If single select and clicking a new platform, deselect others first
      selectedPlatforms.forEach((p) => {
        if (p.id !== platform.id) onToggle(p);
      });
    }

    onToggle(platform);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {platforms.map((platform) => {
        const styles = PLATFORM_STYLES[platform.name];
        const selected = isSelected(platform);
        const icon = platform.icon || PLATFORM_ICONS[platform.name];

        return (
          <button
            key={platform.id}
            type="button"
            onClick={() => handleClick(platform)}
            disabled={!platform.enabled}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
              selected ? styles.bgActive : styles.bg,
              selected ? styles.border : "border-transparent",
              styles.text,
              !platform.enabled && "cursor-not-allowed opacity-40"
            )}
            title={platform.enabled ? platform.label : `${platform.label} (not connected)`}
          >
            {icon && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current/20 text-xs">
                {icon}
              </span>
            )}
            <span>{platform.label}</span>
            {selected && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current text-[10px] text-night">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
