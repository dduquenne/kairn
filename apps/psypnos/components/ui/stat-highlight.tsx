/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import type { HTMLAttributes } from "react";

interface StatHighlightProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  label: string;
  suffix?: string;
}

export function StatHighlight({ value, suffix, label, className = "", ...props }: StatHighlightProps) {
  return (
    <div
      className={`flex flex-col items-start justify-center rounded-2xl border border-ivory/15 bg-night/40 p-6 text-left shadow-lg shadow-night/40 ${className}`.trim()}
      {...props}
    >
      <p className="text-3xl font-semibold text-gold sm:text-4xl">
        {value}
        {suffix ? <span className="ml-1 text-lg font-medium text-ivory/70 sm:text-xl">{suffix}</span> : null}
      </p>
      <p className="mt-2 text-sm text-ivory/70 sm:text-base">{label}</p>
    </div>
  );
}
