"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@kairn/ui";

/**
 * Navigation item configuration
 */
export interface NavItem {
  href: string;
  label: string;
  icon: string | LucideIcon;
}

export interface AdminSidebarProps {
  /** Site name displayed in the sidebar header */
  siteName: string;
  /** Navigation items to display */
  navigation: NavItem[];
  /** Custom class names */
  className?: string;
  /** Header subtitle (defaults to "Espace admin") */
  headerSubtitle?: string;
  /** Whether sidebar starts collapsed */
  defaultCollapsed?: boolean;
  /** Accent color for active state */
  accentColor?: string;
}

/**
 * AdminSidebar - Collapsible sidebar navigation for admin dashboard
 *
 * @example
 * ```tsx
 * const navigation = [
 *   { href: "/admin/analytics", label: "Analytics", icon: "📊" },
 *   { href: "/admin/blog", label: "Blog", icon: "📝" },
 * ];
 *
 * <AdminSidebar siteName="MyApp" navigation={navigation} />
 * ```
 */
export function AdminSidebar({
  siteName,
  navigation,
  className,
  headerSubtitle = "Espace admin",
  defaultCollapsed = false,
  accentColor = "gold",
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const renderIcon = (icon: string | LucideIcon) => {
    if (typeof icon === "string") {
      return <span className="flex-shrink-0 text-lg">{icon}</span>;
    }
    const IconComponent = icon;
    return <IconComponent className="h-5 w-5 flex-shrink-0" />;
  };

  return (
    <aside
      className={cn(
        "hidden flex-shrink-0 border-r border-night/40 bg-night/80 text-sm transition-all duration-300 lg:block",
        isCollapsed ? "w-20" : "w-64",
        "p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={isCollapsed ? "hidden" : ""}>
          <p className={cn("text-xs uppercase tracking-[0.3em]", `text-${accentColor}`)}>
            {siteName}
          </p>
          <p className="mt-1 text-lg font-semibold">{headerSubtitle}</p>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "rounded-md p-1 text-ivory/70 transition",
            "hover:bg-night/60 hover:text-ivory",
            `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${accentColor}/70`
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="mt-8 space-y-1" role="navigation" aria-label="Admin navigation">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-night",
                `focus-visible:ring-${accentColor}/70`,
                isActive
                  ? `bg-${accentColor}/20 text-${accentColor}`
                  : "text-ivory/70 hover:bg-night/60 hover:text-ivory"
              )}
              title={isCollapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              {renderIcon(item.icon)}
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
