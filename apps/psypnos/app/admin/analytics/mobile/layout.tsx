"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, FileText, Bell, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { offlineQueue } from "@/lib/offlineSync";
import { setupHoverPrefetch, smartPrefetch } from "@/lib/prefetch";
import { initWebVitals } from "@/lib/webVitals";


export default function MobileAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);
  const [hasNewAlerts, setHasNewAlerts] = useState(false);

  // Fetch alert count
  const fetchAlertCount = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics/alerts");
      if (response.ok) {
        const data = await response.json();
        const unreadCount = (data.alerts || []).filter(
          (a: { read?: boolean }) => !a.read
        ).length;

        // Check if there are new alerts
        if (unreadCount > alertCount) {
          setHasNewAlerts(true);
          setTimeout(() => setHasNewAlerts(false), 3000);
        }

        setAlertCount(unreadCount);
      }
    } catch (error) {
      console.error("Error fetching alert count:", error);
    }
  }, [alertCount]);

  // Setup prefetching et Web Vitals au chargement
  useEffect(() => {
    setupHoverPrefetch();

    // Prefetch intelligent des routes analytics
    smartPrefetch([
      "/api/analytics/summary",
      "/api/analytics/blog/stats",
      "/api/analytics/alerts",
    ]);

    // Initialiser Web Vitals monitoring
    initWebVitals();

    // Traiter la file offline au chargement
    if (navigator.onLine) {
      offlineQueue.processQueue();
    }

    // Fetch initial alert count
    fetchAlertCount();

    // Refresh alert count periodically
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, [fetchAlertCount]);

  // Reset alert count when visiting alerts page
  useEffect(() => {
    if (pathname === "/admin/analytics/mobile/alerts") {
      // Delay to allow page to mark alerts as read
      setTimeout(() => fetchAlertCount(), 1000);
    }
  }, [pathname, fetchAlertCount]);

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin/analytics/mobile/dashboard",
      icon: BarChart3,
    },
    {
      label: "Blog",
      href: "/admin/analytics/mobile/blog",
      icon: FileText,
    },
    {
      label: "Alertes",
      href: "/admin/analytics/mobile/alerts",
      icon: Bell,
      badge: alertCount,
    },
    {
      label: "Réglages",
      href: "/admin/analytics/mobile/settings",
      icon: Settings,
    },
  ];

  return (
    <ErrorBoundary>
      <InstallPrompt />
      <div className="min-h-screen bg-night pb-20 w-full max-w-full overflow-x-hidden">
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-gold focus:text-night focus:rounded-lg"
        >
          Aller au contenu principal
        </a>

        {/* Main Content */}
        <main id="main-content" className="px-4 py-6" role="main">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav
          className="fixed bottom-0 left-0 right-0 bg-night/95 backdrop-blur-lg border-t border-gold/20 safe-area-inset-bottom z-50"
          role="navigation"
          aria-label="Navigation principale"
        >
          <div className="flex items-center justify-around px-2 py-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const showBadge = item.badge !== undefined && item.badge > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-prefetch
                  className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? "text-gold"
                      : "text-ivory/60 hover:text-ivory active:text-ivory/80"
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="relative">
                    <Icon className="h-6 w-6" aria-hidden="true" />

                    {/* Badge */}
                    <AnimatePresence>
                      {showBadge && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{
                            scale: 1,
                            ...(hasNewAlerts && item.label === "Alertes" ? {
                              scale: [1, 1.2, 1],
                            } : {})
                          }}
                          exit={{ scale: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 25,
                            ...(hasNewAlerts && item.label === "Alertes" ? {
                              repeat: 2,
                              duration: 0.3
                            } : {})
                          }}
                          className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg"
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <span className="text-xs font-medium">{item.label}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </ErrorBoundary>
  );
}
