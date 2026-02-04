"use client";

import { useEffect, useState, type ElementType } from "react";

import { cn } from "../../utils/cn";

import type { TocHeading } from "./types";

export interface MobileTableOfContentsProps {
  /** Table of contents headings */
  headings: TocHeading[];
  /** Button label */
  buttonLabel?: string;
  /** Drawer title */
  drawerTitle?: string;
  /** Close button aria label */
  closeLabel?: string;
  /** Custom class name */
  className?: string;
  /** Motion component for animations */
  motionComponent?: ElementType;
  /** AnimatePresence component for exit animations */
  animatePresenceComponent?: ElementType;
}

/**
 * Mobile table of contents component
 * Displays a floating button that opens a drawer with the table of contents
 *
 * @example
 * ```tsx
 * <MobileTableOfContents
 *   headings={headings}
 *   motionComponent={motion.div}
 *   animatePresenceComponent={AnimatePresence}
 * />
 * ```
 */
export function MobileTableOfContents({
  headings,
  buttonLabel = "Table of Contents",
  drawerTitle = "Table of Contents",
  closeLabel = "Close table of contents",
  className,
  motionComponent: Motion,
  animatePresenceComponent: AnimatePresence,
}: MobileTableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");

  // Track active heading with intersection observer
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

  // Handle link click - scroll to heading and close drawer
  const handleLinkClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsOpen(false);
    }
  };

  // Block body scroll when drawer is open
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

  // Drawer content
  const drawerContent = (
    <>
      {/* Overlay */}
      {Motion ? (
        <Motion
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      {Motion ? (
        <Motion
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 top-0 z-50 flex w-80 max-w-[85vw] flex-col bg-gradient-to-br from-night/95 to-night/90 border-r border-gold/20 backdrop-blur-lg lg:hidden"
        >
          <DrawerContent
            headings={headings}
            activeId={activeId}
            drawerTitle={drawerTitle}
            closeLabel={closeLabel}
            onClose={() => setIsOpen(false)}
            onLinkClick={handleLinkClick}
          />
        </Motion>
      ) : (
        <div className="fixed bottom-0 left-0 top-0 z-50 flex w-80 max-w-[85vw] flex-col bg-gradient-to-br from-night/95 to-night/90 border-r border-gold/20 backdrop-blur-lg lg:hidden">
          <DrawerContent
            headings={headings}
            activeId={activeId}
            drawerTitle={drawerTitle}
            closeLabel={closeLabel}
            onClose={() => setIsOpen(false)}
            onLinkClick={handleLinkClick}
          />
        </div>
      )}
    </>
  );

  return (
    <div className={className}>
      {/* Floating button - visible only on mobile/tablet */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-gold px-4 py-3 font-medium text-night shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night lg:hidden"
        aria-label={buttonLabel}
      >
        {/* List icon */}
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        <span className="text-sm">{buttonLabel}</span>
      </button>

      {/* Drawer with optional AnimatePresence */}
      {AnimatePresence ? (
        <AnimatePresence>{isOpen && drawerContent}</AnimatePresence>
      ) : (
        isOpen && drawerContent
      )}
    </div>
  );
}

interface DrawerContentProps {
  headings: TocHeading[];
  activeId: string;
  drawerTitle: string;
  closeLabel: string;
  onClose: () => void;
  onLinkClick: (id: string) => void;
}

function DrawerContent({
  headings,
  activeId,
  drawerTitle,
  closeLabel,
  onClose,
  onLinkClick,
}: DrawerContentProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gold/20 px-6 py-4">
        <h2 className="text-lg font-semibold text-gold">{drawerTitle}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-ivory/70 transition hover:bg-gold/10 hover:text-ivory focus:outline-none focus:ring-2 focus:ring-gold"
          aria-label={closeLabel}
        >
          {/* X icon */}
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Table of Contents */}
      <nav
        className="flex-1 overflow-y-auto px-6 py-6"
        aria-label="Table of contents"
      >
        <ul className="space-y-1">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            const isLevel1 = heading.level === 1;
            const isLevel2 = heading.level === 2;

            return (
              <li key={heading.id}>
                <button
                  type="button"
                  onClick={() => onLinkClick(heading.id)}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                    isActive
                      ? "bg-gold/10 font-medium text-gold shadow-sm"
                      : "text-ivory/70 hover:bg-gold/5 hover:text-gold"
                  )}
                >
                  {/* Level indicator */}
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    {isLevel1 && (
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          isActive
                            ? "bg-gold"
                            : "bg-gold/40 group-hover:bg-gold/60"
                        )}
                      />
                    )}
                    {isLevel2 && (
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isActive
                            ? "bg-gold"
                            : "bg-gold/30 group-hover:bg-gold/50"
                        )}
                      />
                    )}
                    {!isLevel1 && !isLevel2 && (
                      <div
                        className={cn(
                          "h-1 w-1 rounded-full",
                          isActive
                            ? "bg-gold"
                            : "bg-gold/20 group-hover:bg-gold/40"
                        )}
                      />
                    )}
                  </div>

                  {/* Heading text */}
                  <span
                    className={cn(
                      "flex-1 leading-snug",
                      isLevel1 ? "text-base" : isLevel2 ? "text-sm" : "text-xs"
                    )}
                  >
                    {heading.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gold/20 px-6 py-4">
        <p className="text-center text-xs text-ivory/50">
          {headings.length} section{headings.length > 1 ? "s" : ""}
        </p>
      </div>
    </>
  );
}

