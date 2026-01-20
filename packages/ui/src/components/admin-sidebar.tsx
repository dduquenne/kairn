"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../utils/cn";

export interface NavigationItem {
  href: string;
  label: string;
  icon: string | React.ReactNode;
}

export interface AdminSidebarProps {
  /** Navigation items */
  navigation: NavigationItem[];
  /** Site name */
  siteName?: string;
  /** Admin section title */
  title?: string;
  /** Custom class name */
  className?: string;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Custom colors */
  colors?: {
    primary?: string;
    background?: string;
    text?: string;
    border?: string;
  };
}

export function AdminSidebar({
  navigation,
  siteName = "Site",
  title = "Espace admin",
  className,
  defaultCollapsed = false,
  colors = {},
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const {
    primary = "gold",
    background = "night",
    text = "ivory",
    border = "night",
  } = colors;

  return (
    <aside
      className={cn(
        `hidden flex-shrink-0 border-r border-${border}/40 bg-${background}/80 text-sm transition-all duration-300 lg:block`,
        isCollapsed ? "w-20" : "w-64",
        "p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={isCollapsed ? "hidden" : ""}>
          <p className={`text-xs uppercase tracking-[0.3em] text-${primary}`}>
            {siteName}
          </p>
          <p className="mt-1 text-lg font-semibold">{title}</p>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`rounded-md p-1 text-${text}/70 transition hover:bg-${background}/60 hover:text-${text} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${primary}/70`}
          title={isCollapsed ? "Déplier la sidebar" : "Replier la sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
      <nav className="mt-8 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                `flex items-center gap-3 rounded-md px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${primary}/70 focus-visible:ring-offset-2 focus-visible:ring-offset-${background}`,
                isActive
                  ? `bg-${primary}/20 text-${primary}`
                  : `text-${text}/70 hover:bg-${background}/60 hover:text-${text}`
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0 text-lg">
                {typeof item.icon === "string" ? item.icon : item.icon}
              </span>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// Default navigation items for convenience
export const defaultAdminNavigation: NavigationItem[] = [
  { href: "/admin/analytics", label: "Analytiques", icon: "📊" },
  { href: "/admin/blog", label: "Blog", icon: "📝" },
  { href: "/admin/social", label: "Réseaux sociaux", icon: "📱" },
  { href: "/admin/seminars", label: "Séminaires", icon: "🎓" },
  { href: "/admin/testimonials", label: "Témoignages", icon: "⭐" },
  { href: "/admin/users", label: "Utilisateurs", icon: "👥" },
  { href: "/admin/deployment", label: "Déploiement", icon: "🚀" },
];
