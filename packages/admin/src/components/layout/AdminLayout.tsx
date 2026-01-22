"use client";

import { ReactNode } from "react";
import { cn } from "@kairn/ui";
import { AdminSidebar, type NavItem } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminMobileNav } from "./AdminMobileNav";
import { LogoutButton, type LogoutButtonProps } from "./LogoutButton";

export interface AdminLayoutProps {
  /** Main content to render */
  children: ReactNode;
  /** Site name for branding */
  siteName: string;
  /** Navigation items */
  navigation: NavItem[];
  /** Dashboard title */
  title?: string;
  /** Subtitle displayed in header */
  subtitle?: string;
  /** Header subtitle in sidebar */
  headerSubtitle?: string;
  /** Link to return to the main site */
  siteUrl?: string;
  /** Label for return to site link */
  siteReturnLabel?: string;
  /** Accent color for highlights */
  accentColor?: string;
  /** Custom logout button props */
  logoutProps?: LogoutButtonProps;
  /** Additional header actions */
  headerActions?: ReactNode;
  /** Custom class names for the layout container */
  className?: string;
  /** Custom class names for the main content area */
  mainClassName?: string;
}

/**
 * AdminLayout - Complete admin dashboard layout with sidebar, header, and main content area
 *
 * @example
 * ```tsx
 * const navigation = [
 *   { href: "/admin/analytics", label: "Analytics", icon: "📊" },
 *   { href: "/admin/blog", label: "Blog", icon: "📝" },
 *   { href: "/admin/users", label: "Users", icon: "👥" },
 * ];
 *
 * <AdminLayout siteName="MyApp" navigation={navigation}>
 *   <YourContent />
 * </AdminLayout>
 * ```
 */
export function AdminLayout({
  children,
  siteName,
  navigation,
  title,
  subtitle,
  headerSubtitle,
  siteUrl = "/",
  siteReturnLabel = "Retour au site",
  accentColor = "gold",
  logoutProps,
  headerActions,
  className,
  mainClassName,
}: AdminLayoutProps) {
  const mobileNav = (
    <AdminMobileNav
      siteName={siteName}
      navigation={navigation}
      headerSubtitle={headerSubtitle}
      siteUrl={siteUrl}
      siteReturnLabel={siteReturnLabel}
      accentColor={accentColor}
    />
  );

  const actions = (
    <>
      {headerActions}
      <LogoutButton {...logoutProps} />
    </>
  );

  return (
    <div className={cn("flex min-h-screen bg-night/95 text-ivory", className)}>
      <AdminSidebar
        siteName={siteName}
        navigation={navigation}
        headerSubtitle={headerSubtitle}
        accentColor={accentColor}
      />
      <div className="flex flex-1 flex-col">
        <AdminHeader
          siteName={siteName}
          title={title}
          subtitle={subtitle}
          siteUrl={siteUrl}
          siteReturnLabel={siteReturnLabel}
          mobileNav={mobileNav}
          actions={actions}
          accentColor={accentColor}
        />
        <main
          className={cn(
            "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 lg:px-8",
            mainClassName
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
