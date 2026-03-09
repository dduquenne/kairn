import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintenance en cours - Appréciez Votre Vie",
  description: "Le site est temporairement en maintenance. Nous revenons très bientôt.",
  robots: "noindex, nofollow",
};

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-night via-night/95 to-night px-4">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/4 h-72 w-72 animate-pulse rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-gold/5 blur-3xl" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 max-w-lg text-center">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-gold/20" style={{ animationDuration: "2s" }} />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-gold/10 backdrop-blur">
              <svg
                className="h-12 w-12 text-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-3xl font-bold text-ivory md:text-4xl">
          Maintenance en cours
        </h1>

        {/* Description */}
        <p className="mb-8 text-lg text-ivory/70">
          Nous effectuons actuellement une mise à jour pour améliorer votre expérience.
          Le site sera de nouveau accessible dans quelques instants.
        </p>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-night/50">
            <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-lg border border-gold/20 bg-night/50 p-6 backdrop-blur">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-left">
              <p className="font-medium text-ivory">
                Durée estimée : quelques minutes
              </p>
              <p className="mt-1 text-sm text-ivory/60">
                Si vous avez besoin d&apos;assistance urgente, vous pouvez nous
                contacter à{" "}
                <a
                  href="mailto:dduquenne@appreciezvotrevie.fr"
                  className="text-gold underline hover:text-gold/80"
                >
                  dduquenne@appreciezvotrevie.fr
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-ivory/40">
          Appréciez Votre Vie - Sophrologie &amp; Somatothérapie
        </p>
      </div>

    </div>
  );
}
