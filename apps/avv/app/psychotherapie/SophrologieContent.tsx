'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { CTAButton } from '../../components/CTAButton';
import { CurrentYear } from '../../components/CurrentYear';
import { NavigationMenu } from '../../components/NavigationMenu';
import { trackConversionEvent } from '../../hooks/useAnalytics';
import type { BlogPostSummary } from '../../lib/blog';

import { ArticlesList } from './ArticlesList';

interface SophrologieContentProps {
  posts: BlogPostSummary[];
}

/**
 * Client Component - Contenu de la page sophrologie
 * Une presentation approfondie et rassurante de la sophrologie
 * Optimisee pour le SEO et l'experience utilisateur
 */
export function SophrologieContent({ posts }: SophrologieContentProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // Etat pour la FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Qu'est-ce que la sophrologie ?",
      answer:
        "La sophrologie est une methode psychocorporelle qui combine des exercices de respiration controlee, de decontraction musculaire et de visualisation positive. Creee par le neuropsychiatre Alfonso Caycedo dans les annees 1960, elle s'inspire du yoga, de la meditation et de la relaxation pour vous aider a retrouver un etat d'harmonie entre le corps et l'esprit.",
    },
    {
      question: 'Comment se deroule une premiere seance ?',
      answer:
        "La premiere seance est un temps de rencontre et d'ecoute. Nous faisons connaissance, vous me partagez ce qui vous amene et vos attentes. Ensuite, je vous propose un premier exercice de relaxation dynamique pour decouvrir la pratique. C'est l'occasion de poser vos questions et de sentir si la sophrologie vous convient.",
    },
    {
      question: 'Combien de seances sont necessaires ?',
      answer:
        "Le nombre de seances varie selon vos objectifs. Pour un besoin ponctuel (gestion du stress avant un examen, preparation a l'accouchement), 4 a 8 seances peuvent suffire. Pour un travail plus profond sur la confiance en soi ou la gestion emotionnelle, un accompagnement plus long peut etre envisage. Nous evaluons ensemble au fil du temps.",
    },
    {
      question: 'La sophrologie est-elle remboursee ?',
      answer:
        "La sophrologie n'est pas remboursee par la Securite sociale. Cependant, de nombreuses mutuelles proposent un forfait annuel pour les seances de sophrologie. Je vous invite a verifier aupres de votre mutuelle les conditions de prise en charge.",
    },
    {
      question: 'Les seances peuvent-elles se faire en visioconference ?',
      answer:
        "Oui, je propose des seances en visioconference pour les personnes qui ne peuvent pas se deplacer ou qui habitent loin. L'accompagnement a distance est tout aussi efficace et permet une grande flexibilite. La premiere seance peut egalement se faire en ligne.",
    },
  ];

  return (
    <div className="from-night via-night/95 to-night text-ivory min-h-screen bg-gradient-to-b">
      {/* Navigation Menu */}
      <NavigationMenu forceVisible />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="bg-night relative overflow-hidden px-6 pb-20 pt-24 sm:px-8 sm:pb-24 sm:pt-28 lg:px-16"
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/sophrologie.webp"
            alt="Sophrologie - Harmonisez votre corps et votre esprit"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Overlay pour lisibilite du texte */}
          <div className="from-night/75 via-night/90 to-night/95 absolute inset-0 bg-gradient-to-b" />
        </div>

        {/* Background gradient effects */}
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <motion.div
            className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(199,169,98,0.25),_transparent_70%)]"
            style={{ y: heroParallax }}
          />
          <motion.div
            className="absolute right-0 top-40 h-[28rem] w-[28rem] translate-x-1/3 rounded-full bg-[radial-gradient(circle_at_center,_rgba(245,241,230,0.15),_transparent_70%)]"
            style={{ y: heroParallax }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Eyebrow */}
            <motion.span
              className="text-gold mb-4 inline-block text-sm font-medium uppercase tracking-widest"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Sophrologie
            </motion.span>

            {/* Title */}
            <motion.h1
              className="font-display text-ivory mb-6 text-4xl font-semibold sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Sophrologie dans <span className="text-gold">l'Yonne</span>
            </motion.h1>
            <motion.p
              className="text-ivory/80 mx-auto mb-8 max-w-3xl text-lg sm:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              La sophrologie est un chemin vers l'harmonie entre le corps et l'esprit. A travers des
              exercices de respiration, de relaxation et de visualisation, je vous accompagne pour
              retrouver serenite et equilibre interieur.
            </motion.p>
            <motion.div
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <CTAButton
                variant="primary"
                href="/demande-rendez-vous"
                onTrack={() =>
                  trackConversionEvent(
                    'appointment_request',
                    'button_click_sophrologie_hero',
                    false
                  )
                }
              >
                Demander un rendez-vous
              </CTAButton>
              <CTAButton variant="secondary" href="#comprendre">
                En savoir plus
              </CTAButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
        <article
          itemScope
          itemType="https://schema.org/Article"
          aria-label="Presentation de la sophrologie"
        >
          {/* Section 1: Introduction */}
          <motion.section
            id="comprendre"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20 scroll-mt-24"
          >
            <h2 className="font-display text-gold-accessible mb-8 text-3xl font-semibold sm:text-4xl">
              Qu'est-ce que la sophrologie ?
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La sophrologie est une <strong>methode psychocorporelle</strong> qui allie respiration
              controlee, decontraction musculaire et visualisation positive. Creee dans les annees
              1960 par le neuropsychiatre Alfonso Caycedo, elle puise ses racines dans le yoga, la
              meditation et les techniques de relaxation occidentales.
            </p>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Elle permet de <strong>retrouver un etat de bien-etre</strong>, de developper ses
              capacites personnelles et de mieux gerer les situations du quotidien. La sophrologie
              est accessible a tous, quel que soit l'age ou la condition physique.
            </p>

            <div className="border-gold/30 bg-gold/5 my-8 rounded-r-lg border-l-4 p-6">
              <p className="text-ivory/80 italic leading-relaxed">
                "La sophrologie nous apprend a vivre en harmonie avec nous-memes, a decouvrir nos
                ressources interieures et a les utiliser au service de notre bien-etre."
              </p>
            </div>

            <p className="text-ivory/90 text-lg leading-relaxed">
              En seance, nous travaillons ensemble a votre rythme. Chaque parcours est unique, adapte
              a vos besoins, vos objectifs et votre sensibilite.
            </p>
          </motion.section>

          {/* Section 2: Pour qui ? */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-8 text-3xl font-semibold sm:text-4xl">
              La sophrologie est-elle faite pour vous ?
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La sophrologie s'adresse a toute personne souhaitant ameliorer sa qualite de vie.
              Voici quelques situations ou elle peut vous accompagner :
            </p>

            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {[
                "Gestion du stress et de l'anxiete",
                'Troubles du sommeil et fatigue chronique',
                'Manque de confiance en soi',
                "Preparation aux examens ou evenements importants",
                'Accompagnement de la grossesse',
                'Gestion des emotions et des tensions',
                'Douleurs chroniques et tensions musculaires',
                'Recherche de bien-etre et d\'equilibre',
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="border-ivory/10 bg-night/40 flex items-start gap-3 rounded-lg border p-4"
                >
                  <span className="bg-gold mt-1 h-2 w-2 flex-shrink-0 rounded-full" />
                  <span className="text-ivory/80">{item}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-ivory/90 text-lg leading-relaxed">
              Si vous vous reconnaissez dans l'une de ces situations, la sophrologie peut vous
              apporter des outils concrets pour ameliorer votre quotidien.
            </p>
          </motion.section>

          {/* Section 3: Mon approche */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-8 text-3xl font-semibold sm:text-4xl">
              Une approche douce et progressive
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Ma pratique de la sophrologie s'appuie sur une approche <strong>bienveillante et
              progressive</strong>, qui respecte votre rythme et vos besoins. Je combine plusieurs
              techniques pour un accompagnement sur mesure :
            </p>

            <div className="mb-8 space-y-4">
              {[
                {
                  title: 'La relaxation dynamique',
                  description:
                    'Des mouvements doux associes a la respiration pour relacher les tensions du corps et apaiser le mental.',
                },
                {
                  title: 'Les exercices de respiration',
                  description:
                    'Des techniques respiratoires specifiques pour calmer le systeme nerveux, reduire le stress et retrouver la serenite.',
                },
                {
                  title: 'La visualisation positive',
                  description:
                    'Des exercices d\'imagerie mentale pour renforcer la confiance en soi, se projeter positivement et ancrer de nouvelles ressources.',
                },
                {
                  title: 'La sophronisation',
                  description:
                    'Un etat de relaxation profonde guide par la voix, entre veille et sommeil, propice a l\'integration des changements positifs.',
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="border-gold/20 from-gold/5 rounded-lg border bg-gradient-to-br to-transparent p-6"
                >
                  <h3 className="text-ivory mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-ivory/70">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="border-gold/20 bg-night/40 my-8 rounded-lg border p-8">
              <p className="text-gold/90 text-center text-xl font-light italic leading-relaxed">
                "Le corps est le temple de l'esprit. Prenez-en soin, c'est le seul endroit ou vous
                vivez."
              </p>
              <p className="text-ivory/50 mt-4 text-center text-sm">— Jim Rohn</p>
            </div>
          </motion.section>

          {/* Section 4: Deroulement */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-8 text-3xl font-semibold sm:text-4xl">
              Comment se deroule l'accompagnement ?
            </h2>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  1
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">La prise de contact</h3>
                  <p className="text-ivory/80">
                    Vous me contactez via le formulaire de demande de rendez-vous. Je vous reponds
                    sous 48h pour convenir d'un premier entretien.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  2
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">La premiere rencontre</h3>
                  <p className="text-ivory/80">
                    Nous faisons connaissance. Vous m'exposez ce qui vous amene, vos attentes et vos
                    objectifs. Je vous propose un premier exercice pour decouvrir la sophrologie.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  3
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">Le suivi personnalise</h3>
                  <p className="text-ivory/80">
                    Les seances suivantes permettent d'approfondir la pratique avec des exercices
                    adaptes a vos besoins. Vous apprenez progressivement a les reproduire chez vous
                    en toute autonomie.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  4
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">L'autonomie retrouvee</h3>
                  <p className="text-ivory/80">
                    Au fil des seances, vous integrez les outils sophrologique dans votre quotidien.
                    Vous repartez avec des exercices pratiques que vous pouvez reproduire chez vous.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 5: Rassurance */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-8 text-3xl font-semibold sm:text-4xl">
              Vos questions, mes reponses
            </h2>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="border-ivory/10 bg-night/40 overflow-hidden rounded-lg border"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="hover:bg-night/60 flex w-full items-center justify-between px-6 py-4 text-left transition-colors"
                  >
                    <span className="text-ivory text-lg font-medium">{item.question}</span>
                    <span
                      className={`text-gold ml-4 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  </button>
                  {openFaq === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-ivory/10 border-t px-6 py-4"
                    >
                      <p className="text-ivory/70">{item.answer}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* CTA Intermediaire */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <div className="from-gold/10 to-gold/5 border-gold/20 rounded-lg border bg-gradient-to-br p-8 text-center">
              <h2 className="font-display text-ivory mb-4 text-2xl font-semibold sm:text-3xl">
                Prete a decouvrir la sophrologie ?
              </h2>
              <p className="text-ivory/70 mb-6">
                La premiere rencontre est sans engagement. C'est l'occasion de decouvrir comment la
                sophrologie peut vous aider.
              </p>
              <CTAButton
                variant="primary"
                href="/demande-rendez-vous"
                onTrack={() =>
                  trackConversionEvent(
                    'appointment_request',
                    'button_click_sophrologie_cta_middle',
                    false
                  )
                }
              >
                Demander un rendez-vous
              </CTAButton>
            </div>
          </motion.section>
        </article>

        {/* Section Articles de blog */}
        {posts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-4 text-3xl font-semibold sm:text-4xl">
              Pour aller plus loin
            </h2>
            <p className="text-ivory/70 mb-8 text-lg">
              Decouvrez mes articles pour mieux comprendre la sophrologie et ce qu'elle peut vous
              apporter.
            </p>

            <ArticlesList posts={posts} />

            <div className="mt-8 text-center">
              <CTAButton variant="secondary" href="/blog">
                Voir tous les articles
              </CTAButton>
            </div>
          </motion.section>
        )}

        {/* CTA Final */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <h2 className="font-display text-ivory mb-6 text-3xl font-semibold">
            Retrouvez votre equilibre
          </h2>
          <p className="text-ivory/80 mb-8 text-lg">
            Que vous cherchiez a gerer votre stress, ameliorer votre sommeil ou simplement vous
            accorder un moment de serenite, je suis la pour vous accompagner.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <CTAButton
              variant="primary"
              href="/demande-rendez-vous"
              onTrack={() =>
                trackConversionEvent(
                  'appointment_request',
                  'button_click_sophrologie_cta_final',
                  false
                )
              }
            >
              Demander un rendez-vous
            </CTAButton>
            <CTAButton variant="secondary" href="/a-propos">
              Decouvrir mon parcours
            </CTAButton>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-ivory/10 bg-night/80 text-ivory/50 border-t px-6 py-10 text-center text-xs sm:px-10 lg:px-16">
        <CurrentYear /> Appreciez Votre Vie. Tous droits reserves.
        <Link href="/blog" className="text-ivory/60 hover:text-gold ml-4">
          Blog
        </Link>
        <Link href="/mentions-legales" className="text-ivory/60 hover:text-gold ml-4">
          Mentions legales
        </Link>
        <Link href="/admin" className="text-ivory/60 hover:text-gold ml-4">
          Acces prive
        </Link>
      </footer>
    </div>
  );
}
