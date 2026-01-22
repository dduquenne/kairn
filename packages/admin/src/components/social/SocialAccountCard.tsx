"use client";

import { useState } from "react";
import { RefreshCw, Trash2, ExternalLink, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@kairn/ui";

export interface SocialAccount {
  id: string;
  platform: "facebook" | "instagram" | "twitter" | "linkedin" | "threads";
  accountName: string;
  accountId?: string;
  profileUrl?: string;
  profileImage?: string;
  status: "connected" | "expired" | "error";
  lastSync?: Date;
  followersCount?: number;
}

export interface SocialAccountCardProps {
  /** Account data */
  account: SocialAccount;
  /** Callback to reconnect the account */
  onReconnect?: () => void;
  /** Callback to remove the account */
  onRemove?: () => void;
  /** Whether actions are loading */
  isLoading?: boolean;
  /** Custom class names */
  className?: string;
}

const PLATFORM_COLORS: Record<SocialAccount["platform"], { bg: string; text: string }> = {
  facebook: { bg: "bg-blue-600/20", text: "text-blue-400" },
  instagram: { bg: "bg-pink-500/20", text: "text-pink-400" },
  twitter: { bg: "bg-sky-500/20", text: "text-sky-400" },
  linkedin: { bg: "bg-blue-700/20", text: "text-blue-300" },
  threads: { bg: "bg-gray-500/20", text: "text-gray-300" },
};

const PLATFORM_NAMES: Record<SocialAccount["platform"], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  threads: "Threads",
};

/**
 * SocialAccountCard - Display a connected social media account
 *
 * @example
 * ```tsx
 * <SocialAccountCard
 *   account={{
 *     id: "1",
 *     platform: "instagram",
 *     accountName: "@myaccount",
 *     status: "connected",
 *   }}
 *   onReconnect={handleReconnect}
 *   onRemove={handleRemove}
 * />
 * ```
 */
export function SocialAccountCard({
  account,
  onReconnect,
  onRemove,
  isLoading = false,
  className,
}: SocialAccountCardProps) {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const colors = PLATFORM_COLORS[account.platform];
  const platformName = PLATFORM_NAMES[account.platform];

  const getStatusIcon = () => {
    switch (account.status) {
      case "connected":
        return <CheckCircle2 size={16} className="text-green-400" />;
      case "expired":
        return <Clock size={16} className="text-yellow-400" />;
      case "error":
        return <AlertCircle size={16} className="text-red-400" />;
    }
  };

  const getStatusLabel = () => {
    switch (account.status) {
      case "connected":
        return "Connected";
      case "expired":
        return "Token expired";
      case "error":
        return "Connection error";
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-gold/20 bg-night/60 p-4 transition hover:border-gold/40",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Platform icon / Profile image */}
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            colors.bg
          )}
        >
          {account.profileImage ? (
            <img
              src={account.profileImage}
              alt={account.accountName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className={cn("text-lg font-bold", colors.text)}>
              {platformName[0]}
            </span>
          )}
        </div>

        {/* Account info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold uppercase tracking-wider", colors.text)}>
              {platformName}
            </span>
            {getStatusIcon()}
            <span
              className={cn(
                "text-xs",
                account.status === "connected"
                  ? "text-green-400"
                  : account.status === "expired"
                    ? "text-yellow-400"
                    : "text-red-400"
              )}
            >
              {getStatusLabel()}
            </span>
          </div>

          <p className="mt-1 truncate font-medium text-ivory">{account.accountName}</p>

          {account.followersCount !== undefined && (
            <p className="mt-0.5 text-xs text-ivory/50">
              {account.followersCount.toLocaleString()} followers
            </p>
          )}

          {account.lastSync && (
            <p className="mt-1 text-xs text-ivory/40">
              Last synced: {new Date(account.lastSync).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {account.profileUrl && (
            <a
              href={account.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-2 text-ivory/50 transition hover:bg-gold/10 hover:text-ivory"
              title="View profile"
            >
              <ExternalLink size={16} />
            </a>
          )}

          {(account.status === "expired" || account.status === "error") && onReconnect && (
            <button
              onClick={onReconnect}
              disabled={isLoading}
              className="rounded-md p-2 text-gold/70 transition hover:bg-gold/10 hover:text-gold disabled:opacity-50"
              title="Reconnect"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          )}

          {onRemove && (
            <>
              {showConfirmRemove ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onRemove();
                      setShowConfirmRemove(false);
                    }}
                    className="rounded-md bg-red-500/20 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/30"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowConfirmRemove(false)}
                    className="rounded-md px-2 py-1 text-xs text-ivory/50 transition hover:text-ivory"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmRemove(true)}
                  className="rounded-md p-2 text-red-400/70 transition hover:bg-red-500/10 hover:text-red-400"
                  title="Remove account"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
