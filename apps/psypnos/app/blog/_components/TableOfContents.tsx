"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import type { TocHeading } from "@/lib/mdx";

interface TableOfContentsProps {
  headings: TocHeading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -80% 0%" }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <motion.nav
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
      aria-label="Table des matières"
    >
      {/* Table of Contents - Optimisée pour colonne droite */}
      <div className="rounded-lg border border-ivory/10 bg-night/60 p-4 backdrop-blur-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gold">
          Plan de l'article
        </h3>
        <ul className="max-h-96 space-y-1 overflow-y-auto text-xs">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            const isLevel1 = heading.level === 1;
            const isLevel2 = heading.level === 2;

            return (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className={`group flex items-start gap-2 rounded px-2 py-1 transition-colors ${
                    isActive
                      ? "bg-gold/10 font-medium text-gold"
                      : "text-ivory/60 hover:text-gold hover:bg-gold/5"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(heading.id);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                >
                  {isLevel2 && (
                    <span className="text-gold/40 group-hover:text-gold/60">—</span>
                  )}
                  {!isLevel1 && !isLevel2 && (
                    <span className="text-gold/30 group-hover:text-gold/50">•</span>
                  )}
                  <span className="flex-1 leading-tight">{heading.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.nav>
  );
}
