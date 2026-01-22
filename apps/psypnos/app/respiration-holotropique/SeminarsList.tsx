"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Users, Euro } from "lucide-react";
import { CTAButton } from "../../components/CTAButton";
import { trackConversionEvent } from "@/hooks/useAnalytics";

export interface Seminar {
  id: string;
  title: string;
  description: string;
  speakers: { firstName: string; lastName: string }[];
  startAt: string;
  endAt: string;
  capacity: number;
  price?: number;
  deposit?: number;
  tags: string[];
  thumbnail?: string;
}

interface SeminarsListProps {
  seminars: Seminar[];
}

/**
 * Formate une date en français
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formate une plage de dates
 */
function formatDateRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);

  // Si même jour
  if (start.toDateString() === end.toDateString()) {
    return formatDate(startAt);
  }

  // Si même mois
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    })}`;
  }

  // Sinon format complet
  return `${formatDate(startAt)} — ${formatDate(endAt)}`;
}

/**
 * Extrait le lieu des tags
 */
function extractLocation(tags: string[]): string | null {
  const locationTag = tags.find((tag) => tag.startsWith("lieu:"));
  return locationTag ? locationTag.replace("lieu:", "") : null;
}

/**
 * Carte de séminaire
 */
function SeminarCard({
  seminar,
  index,
}: {
  seminar: Seminar;
  index: number;
}) {
  const location = extractLocation(seminar.tags);
  const speakersText = seminar.speakers
    .map((s) => `${s.firstName} ${s.lastName}`)
    .join(" & ");

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-xl border border-gold/20 bg-gradient-to-br from-night/80 to-night/40 backdrop-blur-sm transition-all hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5"
    >
      <div className="flex flex-col lg:flex-row">
        {/* Image */}
        {seminar.thumbnail && (
          <div className="relative h-48 w-full overflow-hidden lg:h-auto lg:w-64">
            <Image
              src={seminar.thumbnail}
              alt={seminar.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 256px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-transparent lg:bg-gradient-to-r" />
          </div>
        )}

        {/* Contenu */}
        <div className="flex flex-1 flex-col p-6">
          {/* Titre */}
          <h3 className="mb-2 font-display text-xl font-semibold text-ivory transition-colors group-hover:text-gold lg:text-2xl">
            {seminar.title}
          </h3>

          {/* Description */}
          <p className="mb-4 line-clamp-2 text-sm text-ivory/70 lg:text-base">
            {seminar.description}
          </p>

          {/* Métadonnées */}
          <div className="mb-4 flex flex-wrap gap-4 text-sm text-ivory/60">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold/70" />
              <span>{formatDateRange(seminar.startAt, seminar.endAt)}</span>
            </div>
            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold/70" />
                <span>{location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gold/70" />
              <span>{seminar.capacity} places</span>
            </div>
            {seminar.price && (
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-gold/70" />
                <span>{seminar.price} €</span>
              </div>
            )}
          </div>

          {/* Intervenants */}
          <p className="mb-4 text-xs text-ivory/50">
            Animé par {speakersText}
          </p>

          {/* Bouton d'action */}
          <div className="mt-auto">
            <Link
              href="/inscription-seminaire"
              onClick={() =>
                trackConversionEvent(
                  "seminar_registration",
                  `button_click_seminar_${seminar.id}`,
                  false
                )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition-all hover:border-gold hover:bg-gold/20"
            >
              Réserver ma place
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Effet de brillance au hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent" />
      </div>
    </motion.article>
  );
}

/**
 * Liste des prochains séminaires de respiration holotropique
 */
export function SeminarsList({ seminars }: SeminarsListProps) {
  if (seminars.length === 0) {
    return (
      <div className="rounded-lg border border-ivory/10 bg-night/40 p-8 text-center">
        <p className="mb-4 text-ivory/60">
          Aucun séminaire programmé pour le moment.
        </p>
        <p className="text-sm text-ivory/50">
          Inscrivez-vous à la newsletter pour être informé des prochaines dates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {seminars.map((seminar, index) => (
        <SeminarCard key={seminar.id} seminar={seminar} index={index} />
      ))}
    </div>
  );
}
