"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "../utils/cn";
import type { NavigationItem } from "./admin-sidebar";

export interface MobileNavProps {
  /** Navigation items */
  navigation: NavigationItem[];
  /** Site name */
  siteName?: string;
  /** Admin section title */
  title?: string;
  /** Custom class name */
  className?: string;
  /** Back to site link */
  backToSiteHref?: string;
  /** Back to site label */
  backToSiteLabel?: string;
  /** Custom colors */
  colors?: {
    primary?: string;
    background?: string;
    text?: string;
    border?: string;
  };
}

export function MobileNav({
  navigation,
  siteName = "Site",
  title = "Espace admin",
  className,
  backToSiteHref = "/",
  backToSiteLabel = "Retour au site",
  colors = {},
}: MobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const {
    primary = "gold",
    background = "night",
    text = "ivory",
    border = "night",
  } = colors;

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeMenu]);

  return (
    <div className={cn("lg:hidden", className)}>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`rounded-md p-2 text-${text}/70 transition hover:bg-${background}/60 hover:text-${text} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${primary}/70`}
        aria-label="Ouvrir le menu de navigation"
        aria-expanded={isOpen}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay backdrop */}
      <div
        className={cn(
          `fixed inset-0 z-[70] bg-${background}/80 backdrop-blur-sm transition-opacity duration-300`,
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          `fixed inset-y-0 left-0 z-[80] w-72 bg-${background}/95 shadow-xl transition-transform duration-300 ease-in-out`,
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Menu de navigation"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={`flex items-center justify-between border-b border-${border}/40 p-4`}>
            <div>
              <p className={`text-xs uppercase tracking-[0.3em] text-${primary}`}>
                {siteName}
              </p>
              <p className={`mt-1 text-lg font-semibold text-${text}`}>{title}</p>
            </div>
            <button
              onClick={closeMenu}
              className={`rounded-md p-2 text-${text}/70 transition hover:bg-${background}/60 hover:text-${text} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${primary}/70`}
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        `flex items-center gap-3 rounded-md px-4 py-3 text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${primary}/70 focus-visible:ring-offset-2 focus-visible:ring-offset-${background}`,
                        isActive
                          ? `bg-${primary}/20 text-${primary}`
                          : `text-${text}/70 hover:bg-${background}/60 hover:text-${text}`
                      )}
                      onClick={closeMenu}
                    >
                      <span className="flex-shrink-0 text-xl">
                        {typeof item.icon === "string" ? item.icon : item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className={`border-t border-${border}/40 p-4`}>
            <Link
              href={backToSiteHref}
              className={`flex w-full items-center justify-center gap-2 rounded-md border border-${primary}/60 px-4 py-3 text-sm font-medium text-${primary} transition hover:bg-${primary}/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${primary}/70`}
              onClick={closeMenu}
            >
              <span>{backToSiteLabel}</span>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
