import { LogoutButton } from "@kairn/admin";
import { AdminSidebar, MobileNav, type NavigationItem } from "@kairn/ui";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { verifyAdminToken } from "../api/auth/middleware";

// Navigation configuration for Psypnos admin
const psypnosAdminNavigation: NavigationItem[] = [
  { href: "/admin/analytics", label: "Analytiques", icon: "📊" },
  { href: "/admin/customization", label: "Personnalisation", icon: "🎨" },
  { href: "/admin/configuration", label: "Configuration", icon: "⚙️" },
  { href: "/admin/blog", label: "Blog", icon: "📝" },
  { href: "/admin/social", label: "Réseaux sociaux", icon: "📱" },
  { href: "/admin/seminars", label: "Séminaires", icon: "🎓" },
  { href: "/admin/testimonials", label: "Témoignages", icon: "⭐" },
  { href: "/admin/deployment", label: "Déploiement", icon: "🚀" },
];

export const dynamic = 'force-dynamic';

// Prevent admin pages from being indexed by search engines
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const token = await verifyAdminToken();

  if (!token || token.role !== "admin") {
    // Get the current path to redirect back after login
    const headersList = await headers();
    const pathname = headersList.get("x-invoke-path") || headersList.get("x-pathname") || "/admin/seminars";
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <div className="flex min-h-screen bg-night/95 text-ivory">
      <AdminSidebar navigation={psypnosAdminNavigation} siteName="Psypnos" />
      <div className="flex flex-1 flex-col">
        <header className="border-b border-night/50 bg-night/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MobileNav navigation={psypnosAdminNavigation} siteName="Psypnos" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold sm:tracking-[0.3em]">Tableau de bord</p>
                <h1 className="text-lg font-semibold sm:text-2xl">Administration Psypnos</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="hidden rounded-md border border-gold/60 px-3 py-2 text-sm font-medium text-gold transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-night lg:block"
              >
                Retour au site
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
