// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { adminNavigation } from "./AdminSidebar";

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="lg:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md p-2 text-ivory/70 transition hover:bg-night/60 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
        aria-label="Ouvrir le menu de navigation"
        aria-expanded={isOpen}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay backdrop */}
      <div
        className={`fixed inset-0 z-[70] bg-night/80 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[80] w-72 bg-night/95 shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Menu de navigation"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-night/40 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Psypnos</p>
              <p className="mt-1 text-lg font-semibold text-ivory">Espace admin</p>
            </div>
            <button
              onClick={closeMenu}
              className="rounded-md p-2 text-ivory/70 transition hover:bg-night/60 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-4 py-3 text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-night ${
                        isActive
                          ? "bg-gold/20 text-gold"
                          : "text-ivory/70 hover:bg-night/60 hover:text-ivory"
                      }`}
                      onClick={closeMenu}
                    >
                      <span className="flex-shrink-0 text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-night/40 p-4">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-gold/60 px-4 py-3 text-sm font-medium text-gold transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
              onClick={closeMenu}
            >
              <span>Retour au site</span>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
