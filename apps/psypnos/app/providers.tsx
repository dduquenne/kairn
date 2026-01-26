"use client";

import type { ReactNode } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { ToastProvider } from "@/lib/toast-context";
import { ClarityProvider } from "../components/analytics/ClarityIntegration";
import { VersionChecker } from "../components/VersionChecker";

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <GoogleReCaptchaProvider
        reCaptchaKey={recaptchaSiteKey}
        scriptProps={{ async: true, defer: true, appendTo: "head" }}
        container={{
          parameters: {
            badge: "bottomright",
            theme: "dark"
          }
        }}
      >
        <ClarityProvider projectId={clarityProjectId} />
        {/* Vérifie les nouvelles versions après déploiement */}
        <VersionChecker />
        {children}
      </GoogleReCaptchaProvider>
    </ToastProvider>
  );
}
