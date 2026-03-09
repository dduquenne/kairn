/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import type { HTMLAttributes, ReactNode } from "react";

interface IconHighlightProps extends HTMLAttributes<HTMLDivElement> {
  icon: ReactNode;
  title: string;
  description: string;
}

export function IconHighlight({ icon, title, description, className = "", ...props }: IconHighlightProps) {
  return (
    <div
      className={`flex gap-4 rounded-2xl border border-ivory/10 bg-night/30 p-5 shadow-lg shadow-night/30 backdrop-blur ${className}`.trim()}
      {...props}
    >
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gold/15 text-2xl">{icon}</span>
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-ivory sm:text-lg">{title}</h3>
        <p className="text-sm text-ivory/70 sm:text-base">{description}</p>
      </div>
    </div>
  );
}
