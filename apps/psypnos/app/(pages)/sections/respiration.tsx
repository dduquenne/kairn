"use client";

import { motion } from "framer-motion";
import { CTAButton } from "../../../components/CTAButton";
import { SectionTitle } from "../../../components/SectionTitle";
import GoldGlowImage from "../../../components/GoldGlowImage";

export function RespirationSection() {
  return (
    <section id="respiration-holotropique" className="bg-gradient-to-br from-night via-night/95 to-night px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-12">
        <SectionTitle
          eyebrow="Respiration holotropique"
          title="Le corps est le chemin. Le souffle est le guide."
          description="La Respiration Holotropique ouvre une porte à un voyage intérieur extraordinaire. Porté par la respiration, la musique et un travail corporel spécifiques, ce voyage vous emmène dans des espaces d'introspection, d'enseignement, de libération, de guérison ou encore d'éveil.
Avec sécurité et bienveillance, nous vous offrons l'opportunité de vous accompagner tout au long de votre voyage. Celui-ci vous aidera à accéder à une meilleure compréhension de vous-même pour mieux vous éclairer sur votre chemin de vie dans vos projets comme dans vos relations.
"
        />
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-6 text-left" style={{ display: "flex", alignItems: "normal", justifyContent: "center", height: "100%", flexDirection: "column" }} >
            {[
              "Un lieu magique dans un magnifique moulin bourguignon",
              "Un accompagnement bienveillant et respectueux",
              "Une préparation personnalisée pour définir vos intentions",
              "Une musique immersive et un support corporel sécurisant",
              "Une exploration intérieure et une libération des blocages",
              "Un temps d'intégration avec dessin, écriture et partage",
              "Une expérience immersive et transformante",
            ].map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-start gap-4"
              >

                <span className="mt-1 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full bg-gold/20 text-gold">
                  <span className="text-lg font-bold">+</span>
                </span>
                <p className="text-ivory/80">{item}</p>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
              className="flex flex-col gap-3 pt-4 sm:flex-row"
            >
              <CTAButton variant="primary" href="/inscription-seminaire">
                S'inscrire à un séminaire
              </CTAButton>
              <CTAButton variant="secondary" href="/respiration-holotropique">
                En savoir plus
              </CTAButton>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden"
          >
            <GoldGlowImage
              src="/images/Moulin_d_en_Bas.webp"
              alt="Le Moulin d'en Bas"
              width={480}
              height={480}
              shadowBlur={34}
              shadowOpacity={0.92}
              className="rounded-full"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-night/80 via-night/30 to-transparent" aria-hidden />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
