"use client";

import { motion } from "framer-motion";
import { CTAButton } from "../../../components/CTAButton";
import { SectionTitle } from "../../../components/SectionTitle";

// Données statiques pour les séminaires à venir (à remplacer par API plus tard)
const upcomingSeminars = [
  {
    id: "1",
    title: "Séminaire de Respiration Holotropique",
    description: "Un week-end d'exploration intérieure à travers la respiration holotropique, dans le cadre enchanteur du Moulin d'en Bas.",
    date: "Dates à venir",
    location: "Le Moulin d'en Bas, Saint-Julien du Sault",
    seminarType: "Respiration Holotropique",
  },
];

export function SeminarsSection() {
  return (
    <section
      id="seminaires"
      className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionTitle
          eyebrow="Séminaires à venir"
          title="Une exploration profonde au Cœur de Soi"
          description="Nos séminaires sont limités en places pour préserver une attention personnalisée et un cercle intime."
        />
        <div className="grid gap-10 md:grid-cols-3">
          {upcomingSeminars.length > 0 ? (
            upcomingSeminars.map(({ id, title, description, date, location, seminarType }, index) => (
              <motion.article
                key={id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.05 }}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ivory/10 bg-night/50 shadow-xl shadow-night/60"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-night/80 to-night/40">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-16 w-16 text-ivory/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  {seminarType && (
                    <span className="absolute left-4 top-4 rounded-full bg-gold/90 px-3 py-1 text-xs font-semibold text-night backdrop-blur-sm">
                      {seminarType}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="text-xl font-semibold text-ivory">{title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm text-ivory/70">{description}</p>
                  </div>
                  <dl className="mt-5 space-y-2 text-sm text-ivory/60">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 flex-shrink-0 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 flex-shrink-0 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{location}</span>
                    </div>
                  </dl>
                  <div className="mt-6 flex justify-center">
                    <CTAButton className="" href="/inscription-seminaire">
                      Réserver ma place
                    </CTAButton>
                  </div>
                </div>
              </motion.article>
            ))
          ) : (
            <div className="md:col-span-3 rounded-3xl border border-ivory/10 bg-night/40 p-8 text-center text-sm text-ivory/60">
              Aucun séminaire à venir pour le moment. Inscrivez-vous à la newsletter pour être informé des prochaines dates.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
