import { LogoutButton } from '@kairn/admin';
import { AdminSidebar, MobileNav, type NavigationItem } from '@kairn/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { verifyAdminToken } from '../api/auth/middleware';

// Navigation configuration for Psypnos admin
const psypnosAdminNavigation: NavigationItem[] = [
  { href: '/admin/analytics', label: 'Analytiques', icon: '📊' },
  { href: '/admin/customization', label: 'Personnalisation', icon: '🎨' },
  { href: '/admin/configuration', label: 'Configuration', icon: '⚙️' },
  { href: '/admin/blog', label: 'Blog', icon: '📝' },
  { href: '/admin/social', label: 'Réseaux sociaux', icon: '📱' },
  { href: '/admin/seminars', label: 'Séminaires', icon: '🎓' },
  { href: '/admin/testimonials', label: 'Témoignages', icon: '⭐' },
  { href: '/admin/deployment', label: 'Déploiement', icon: '🚀' },
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

  if (!token || token.role !== 'admin') {
    // Redirect to login - the login page will redirect back to admin after successful login
    redirect(`/login?next=/admin`);
  }

  return (
    <div className="bg-night/95 text-ivory flex min-h-screen">
      <AdminSidebar navigation={psypnosAdminNavigation} siteName="Psypnos" />
      <div className="flex flex-1 flex-col">
        <header className="border-night/50 bg-night/80 border-b px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MobileNav navigation={psypnosAdminNavigation} siteName="Psypnos" />
              <div>
                <p className="text-gold text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                  Tableau de bord
                </p>
                <h1 className="text-lg font-semibold sm:text-2xl">Administration Psypnos</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="border-gold/60 text-gold hover:bg-gold/10 focus-visible:ring-gold/70 focus-visible:ring-offset-night hidden rounded-md border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 lg:block"
              >
                Retour au site
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 overflow-x-hidden px-4 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
