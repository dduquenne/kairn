"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Menu, X, LucideIcon } from "lucide-react";
import { cn } from "@kairn/ui";
import type { NavItem } from "./AdminSidebar";

export interface AdminMobileNavProps {
  /** Site name displayed in the drawer header */
  siteName: string;
  /** Navigation items to display */
  navigation: NavItem[];
  /** Header subtitle (defaults to "Espace admin") */
  headerSubtitle?: string;
  /** Link to return to the main site */
  siteUrl?: string;
  /** Label for the site return link */
  siteReturnLabel?: string;
  /** Accent color */
  accentColor?: string;
  /** Custom class names */
  className?: string;
}

/**
 * AdminMobileNav - Mobile drawer navigation for admin dashboard
 *
 * Uses a React portal to render the overlay and drawer at document.body level,
 * escaping any parent stacking contexts (backdrop-blur, transform, etc.).
 */
export function AdminMobileNav({
  siteName,
  navigation,
  headerSubtitle = "Espace admin",
  siteUrl = "/",
  siteReturnLabel = "Retour au site",
  accentColor = "gold",
  className,
}: AdminMobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Ensure portal only renders on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  // Close menu on escape key and manage body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeMenu]);

  const renderIcon = (icon: string | LucideIcon) => {
    if (typeof icon === "string") {
      return <span className="flex-shrink-0 text-xl">{icon}</span>;
    }
    const IconComponent = icon;
    return <IconComponent className="h-5 w-5 flex-shrink-0" />;
  };

  // Render overlay + drawer via portal to escape any parent stacking context
  const drawerContent = mounted
    ? createPortal(
        <div
          className={cn("lg:hidden", isOpen ? "pointer-events-auto" : "pointer-events-none")}
          aria-hidden={!isOpen}
        >
          {/* Overlay backdrop */}
          <div
            className={cn(
              "fixed inset-0 z-[9998] bg-night/80 backdrop-blur-sm transition-opacity duration-300",
              isOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside
            id="mobile-nav-drawer"
            className={cn(
              "fixed inset-y-0 left-0 z-[9999] w-72 bg-night/95 shadow-2xl transition-transform duration-300 ease-in-out",
              isOpen ? "translate-x-0" : "-translate-x-full"
            )}
            aria-label="Mobile navigation menu"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-night/40 p-4">
                <div>
                  <p
                    className={cn(
                      "text-xs uppercase tracking-[0.3em]",
                      `text-${accentColor}`
                    )}
                  >
                    {siteName}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ivory">{headerSubtitle}</p>
                </div>
                <button
                  onClick={closeMenu}
                  className={cn(
                    "rounded-md p-2 text-ivory/70 transition",
                    "hover:bg-night/60 hover:text-ivory",
                    `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${accentColor}/70`
                  )}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4" role="navigation">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname?.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-4 py-3 text-base transition",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-night",
                            `focus-visible:ring-${accentColor}/70`,
                            isActive
                              ? `bg-${accentColor}/20 text-${accentColor}`
                              : "text-ivory/70 hover:bg-night/60 hover:text-ivory"
                          )}
                          onClick={closeMenu}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {renderIcon(item.icon)}
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
                  href={siteUrl}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition",
                    `border border-${accentColor}/60 text-${accentColor} hover:bg-${accentColor}/10`,
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-night",
                    `focus-visible:ring-${accentColor}/70`
                  )}
                  onClick={closeMenu}
                >
                  <span>{siteReturnLabel}</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>,
        document.body
      )
    : null;

  return (
    <div className={cn("lg:hidden", className)}>
      {/* Hamburger button - stays in the DOM flow */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
        className={cn(
          "rounded-md p-2 text-ivory/70 transition",
          "hover:bg-night/60 hover:text-ivory",
          `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${accentColor}/70`
        )}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay + Drawer rendered via portal at document.body level */}
      {drawerContent}
    </div>
  );
}
