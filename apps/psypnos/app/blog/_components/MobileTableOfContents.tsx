"use client";

import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { TocHeading } from "@/lib/mdx";

interface MobileTableOfContentsProps {
  headings: TocHeading[];
}

export function MobileTableOfContents({ headings }: MobileTableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  // Fermer le drawer quand on clique sur un lien
  const handleLinkClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsOpen(false);
    }
  };

  // Bloquer le scroll quand le drawer est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bouton flottant - visible uniquement sur mobile et tablette */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-gold px-4 py-3 font-medium text-night shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night lg:hidden"
        aria-label="Ouvrir le plan de l'article"
      >
        <List className="h-5 w-5" />
        <span className="text-sm">Plan</span>
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-80 max-w-[85vw] flex-col bg-gradient-to-br from-night/95 to-night/90 border-r border-gold/20 backdrop-blur-lg lg:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gold/20 px-6 py-4">
                <h2 className="text-lg font-semibold text-gold">Plan de l'article</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory focus:outline-none focus:ring-2 focus:ring-gold"
                  aria-label="Fermer le plan"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Table of Contents */}
              <nav className="flex-1 overflow-y-auto px-6 py-6" aria-label="Table des matières mobile">
                <ul className="space-y-1">
                  {headings.map((heading) => {
                    const isActive = activeId === heading.id;
                    const isLevel1 = heading.level === 1;
                    const isLevel2 = heading.level === 2;

                    return (
                      <li key={heading.id}>
                        <button
                          onClick={() => handleLinkClick(heading.id)}
                          className={`group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                            isActive
                              ? "bg-gold/10 font-medium text-gold shadow-sm"
                              : "text-ivory/70 hover:bg-gold/5 hover:text-gold"
                          }`}
                        >
                          {/* Indicateur de niveau */}
                          <div className="flex flex-col items-center gap-1 pt-0.5">
                            {isLevel1 && (
                              <div className={`h-2 w-2 rounded-full ${isActive ? "bg-gold" : "bg-gold/40 group-hover:bg-gold/60"}`} />
                            )}
                            {isLevel2 && (
                              <div className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-gold" : "bg-gold/30 group-hover:bg-gold/50"}`} />
                            )}
                            {!isLevel1 && !isLevel2 && (
                              <div className={`h-1 w-1 rounded-full ${isActive ? "bg-gold" : "bg-gold/20 group-hover:bg-gold/40"}`} />
                            )}
                          </div>

                          {/* Texte du heading */}
                          <span className={`flex-1 leading-snug ${isLevel1 ? "text-base" : isLevel2 ? "text-sm" : "text-xs"}`}>
                            {heading.text}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Footer avec nombre de sections */}
              <div className="border-t border-gold/20 px-6 py-4">
                <p className="text-center text-xs text-ivory/50">
                  {headings.length} section{headings.length > 1 ? "s" : ""}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
