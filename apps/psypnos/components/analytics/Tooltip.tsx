// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { ReactNode, useState } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  maxWidth?: number;
}

export function Tooltip({ content, children, maxWidth = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg border border-gold/50 bg-night px-3 py-2 text-xs text-ivory shadow-lg"
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {content}
          {/* Arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2">
            <div className="h-2 w-2 rotate-45 border-b border-r border-gold/50 bg-night" />
          </div>
        </div>
      )}
    </div>
  );
}
