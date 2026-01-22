// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import type { HTMLAttributes } from "react";

interface NumberedStepProps extends HTMLAttributes<HTMLDivElement> {
  number: number;
  title: string;
  description: string;
}

export function NumberedStep({ number, title, description, className = "", ...props }: NumberedStepProps) {
  return (
    <div
      className={`flex gap-4 rounded-2xl border border-ivory/15 bg-night/35 p-5 shadow-md shadow-night/30 backdrop-blur ${className}`.trim()}
      {...props}
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gold/20 text-lg font-semibold text-gold">
        {number}
      </span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-ivory sm:text-lg">{title}</h3>
        <p className="text-sm text-ivory/70 sm:text-base">{description}</p>
      </div>
    </div>
  );
}
