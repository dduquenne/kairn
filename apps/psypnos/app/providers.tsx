"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "@/lib/toast-context";

import { ClarityProvider } from "../components/analytics/ClarityIntegration";
import { VersionChecker } from "../components/VersionChecker";

const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ClarityProvider projectId={clarityProjectId} />
      {/* Vérifie les nouvelles versions après déploiement */}
      <VersionChecker />
      {children}
    </ToastProvider>
  );
}
