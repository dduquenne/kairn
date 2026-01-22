// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const adminNavigation = [
  { href: "/admin/analytics", label: "Analytiques", icon: "📊" },
  { href: "/admin/blog", label: "Blog", icon: "📝" },
  { href: "/admin/social", label: "Réseaux sociaux", icon: "📱" },
  { href: "/admin/seminars", label: "Séminaires", icon: "🎓" },
  { href: "/admin/testimonials", label: "Témoignages", icon: "⭐" },
  { href: "/admin/users", label: "Utilisateurs", icon: "👥" },
  { href: "/admin/deployment", label: "Déploiement", icon: "🚀" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`hidden flex-shrink-0 border-r border-night/40 bg-night/80 text-sm transition-all duration-300 lg:block ${
      isCollapsed ? "w-20" : "w-64"
    } p-6`}>
      <div className="flex items-start justify-between">
        <div className={isCollapsed ? "hidden" : ""}>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Psypnos</p>
          <p className="mt-1 text-lg font-semibold">Espace admin</p>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-md p-1 text-ivory/70 transition hover:bg-night/60 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
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
        {adminNavigation.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-night ${
                isActive
                  ? "bg-gold/20 text-gold"
                  : "text-ivory/70 hover:bg-night/60 hover:text-ivory"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0 text-lg">{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
