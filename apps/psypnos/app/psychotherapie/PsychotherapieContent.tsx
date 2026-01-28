'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { CTAButton } from '../../components/CTAButton';
import { CurrentYear } from '../../components/CurrentYear';
import { NavigationMenu } from '../../components/NavigationMenu';
import { trackConversionEvent } from '../../hooks/useAnalytics';
import type { BlogPostSummary } from '../../lib/blog';

import { ArticlesList } from './ArticlesList';

// Lazy load Analytics with SSR disabled
const Analytics = dynamic(
  () =>
    import('../../components/Analytics').then(mod => ({
      default: mod.Analytics,
    })),
  {
    ssr: false,
  }
);

interface PsychotherapieContentProps {
  posts: BlogPostSummary[];
}

/**
 * Client Component - Contenu de la page psychothérapie
 * Une présentation approfondie et rassurante de la psychothérapie
 * Optimisée pour le SEO et l'expérience utilisateur
 */
export function PsychotherapieContent({ posts }: PsychotherapieContentProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // État pour la FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Qu'est-ce que la psychothérapie ?",
      answer:
        "La psychothérapie est un accompagnement professionnel qui vous aide à traverser les difficultés émotionnelles, les crises de vie et à développer une meilleure connaissance de vous-même. C'est un espace sécurisé où vous pouvez explorer vos pensées, vos émotions et vos comportements, accompagné par un thérapeute formé et bienveillant.",
    },
    {
      question: 'Comment se déroule une première séance ?',
      answer:
        "La première séance est un temps de rencontre et d'écoute. Nous faisons connaissance, vous me partagez ce qui vous amène et ce que vous traversez. C'est aussi l'occasion de poser vos questions et de sentir si le cadre vous convient. Il n'y a aucune obligation d'engagement : cette première rencontre vous permet de décider si vous souhaitez poursuivre.",
    },
    {
      question: 'Combien de temps dure une thérapie ?',
      answer:
        "La durée d'une thérapie varie selon chaque personne et ce qu'elle traverse. Certaines problématiques peuvent s'apaiser en quelques séances, d'autres nécessitent un travail plus long. Nous évaluons ensemble, au fil du temps, l'évolution de votre cheminement. Vous restez toujours libre de mettre fin à l'accompagnement quand vous le souhaitez.",
    },
    {
      question: 'La psychothérapie est-elle remboursée ?',
      answer:
        "La psychothérapie n'est généralement pas remboursée par la Sécurité sociale. Cependant, de nombreuses mutuelles proposent un forfait annuel pour les consultations chez un psychothérapeute ou psychologue. Je vous invite à vérifier auprès de votre mutuelle les conditions de remboursement.",
    },
    {
      question: 'Les séances peuvent-elles se faire en visioconférence ?',
      answer:
        "Oui, je propose des séances en visioconférence pour les personnes qui ne peuvent pas se déplacer ou qui habitent loin. L'accompagnement à distance est tout aussi efficace et permet une grande flexibilité. La première séance peut également se faire en ligne pour voir si le cadre vous convient.",
    },
  ];

  return (
    <div className="from-night via-night/95 to-night text-ivory min-h-screen bg-gradient-to-b">
      {/* Analytics tracking (lazy loaded, client-side only) */}
      <Analytics />

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
            src="/images/psychotherapie.webp"
            alt="Psychothérapie - Un espace pour se retrouver"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Overlay pour lisibilité du texte */}
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
              Psychothérapie
            </motion.span>

            {/* Title */}
            <motion.h1
              className="font-display text-ivory mb-6 text-4xl font-semibold sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Psychothérapie transpersonnelle dans <span className="text-gold">l'Yonne</span>
            </motion.h1>
            <motion.p
              className="text-ivory/80 mx-auto mb-8 max-w-3xl text-lg sm:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              La psychothérapie est un voyage vers soi, un chemin d'exploration et de
              transformation. Dans un cadre bienveillant et confidentiel, je vous accompagne pour
              traverser ce que vous traversez et retrouver votre équilibre intérieur.
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
                    'button_click_psychotherapie_hero',
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
          aria-label="Présentation de la psychothérapie"
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
              Qu'est-ce que la psychothérapie ?
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La psychothérapie est bien plus qu'une simple conversation. C'est un{' '}
              <strong>espace protégé</strong> où vous pouvez déposer ce qui vous pèse, explorer ce
              qui vous échappe et cheminer vers une meilleure compréhension de vous-même.
            </p>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Contrairement aux idées reçues, consulter un thérapeute n'est pas réservé aux moments
              de crise profonde. Beaucoup de personnes entament une thérapie pour{' '}
              <strong>mieux se connaître</strong>, traverser une transition de vie, ou simplement
              parce qu'elles sentent que quelque chose doit changer.
            </p>

            <div className="border-gold/30 bg-gold/5 my-8 rounded-r-lg border-l-4 p-6">
              <p className="text-ivory/80 italic leading-relaxed">
                "La psychothérapie ne consiste pas à devenir quelqu'un d'autre, mais à retrouver
                celui que nous avons toujours été, sous les couches de conditionnements et de
                blessures accumulées."
              </p>
            </div>

            <p className="text-ivory/90 text-lg leading-relaxed">
              En séance, nous travaillons ensemble à votre rythme. Il n'y a pas de recette miracle
              ni de solution toute faite : chaque parcours est unique, adapté à votre histoire, vos
              besoins et vos ressources.
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
              La psychothérapie est-elle faite pour vous ?
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Vous vous demandez peut-être si la thérapie pourrait vous aider. Voici quelques
              situations qui amènent souvent les personnes à consulter :
            </p>

            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {[
                "Anxiété, stress chronique ou crises d'angoisse",
                'Burn-out ou épuisement professionnel',
                'Sentiment de vide ou perte de sens',
                'Difficultés relationnelles ou affectives',
                'Deuil ou séparation difficile',
                'Période de transition ou de questionnement',
                'Troubles du sommeil ou fatigue persistante',
                "Envie de mieux se connaître et d'évoluer",
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
              Si vous vous reconnaissez dans l'une de ces situations, ou si vous ressentez
              simplement le besoin de parler à quelqu'un de confiance, la psychothérapie peut vous
              accompagner.
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
              Une approche intégrative et humaniste
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Mon approche s'inscrit dans une{' '}
              <strong>psychothérapie transpersonnelle et intégrative</strong>, qui prend en compte
              toutes les dimensions de l'expérience humaine : psychique, émotionnelle, corporelle et
              existentielle.
            </p>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Je m'appuie sur plusieurs outils thérapeutiques que j'adapte selon vos besoins et ce
              qui émerge en séance :
            </p>

            <div className="mb-8 space-y-4">
              {[
                {
                  title: "L'écoute active et le dialogue",
                  description:
                    'Un espace de parole libre où vous pouvez exprimer ce que vous traversez sans jugement.',
                },
                {
                  title: "L'hypnose ericksonienne",
                  description:
                    "Une approche douce qui permet d'accéder aux ressources inconscientes et de favoriser le changement.",
                },
                {
                  title: 'Les exercices de présence',
                  description:
                    "Des pratiques pour revenir au corps, calmer le mental et développer l'ancrage.",
                },
                {
                  title: 'Le travail sur les émotions',
                  description:
                    'Apprendre à accueillir, comprendre et traverser ses émotions plutôt que les fuir.',
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
                "Le véritable voyage de découverte ne consiste pas à chercher de nouveaux paysages,
                mais à avoir de nouveaux yeux."
              </p>
              <p className="text-ivory/50 mt-4 text-center text-sm">— Marcel Proust</p>
            </div>
          </motion.section>

          {/* Section 4: Déroulement */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-8 text-3xl font-semibold sm:text-4xl">
              Comment se déroule l'accompagnement ?
            </h2>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  1
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">La prise de contact</h3>
                  <p className="text-ivory/80">
                    Vous me contactez via le formulaire de demande de rendez-vous. Je vous réponds
                    sous 48h pour convenir d'un premier entretien.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  2
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">La première rencontre</h3>
                  <p className="text-ivory/80">
                    Nous faisons connaissance. Vous m'exposez ce qui vous amène, vos attentes et vos
                    questions. C'est aussi l'occasion de sentir si le cadre vous convient.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  3
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">Le suivi thérapeutique</h3>
                  <p className="text-ivory/80">
                    Les séances suivantes (généralement hebdomadaires ou bi-mensuelles) permettent
                    d'approfondir le travail. La fréquence s'adapte à vos besoins et votre rythme.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  4
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">La fin du parcours</h3>
                  <p className="text-ivory/80">
                    Quand vous vous sentez prêt, nous préparons ensemble la fin de l'accompagnement.
                    Vous repartez avec des outils et une meilleure connaissance de vous-même.
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
              Vos questions, mes réponses
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

          {/* CTA Intermédiaire */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <div className="from-gold/10 to-gold/5 border-gold/20 rounded-lg border bg-gradient-to-br p-8 text-center">
              <h2 className="font-display text-ivory mb-4 text-2xl font-semibold sm:text-3xl">
                Prêt à faire le premier pas ?
              </h2>
              <p className="text-ivory/70 mb-6">
                La première rencontre est sans engagement. C'est l'occasion de voir si nous pouvons
                cheminer ensemble.
              </p>
              <CTAButton
                variant="primary"
                href="/demande-rendez-vous"
                onTrack={() =>
                  trackConversionEvent(
                    'appointment_request',
                    'button_click_psychotherapie_cta_middle',
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
              Découvrez mes articles pour mieux comprendre la psychothérapie et ce qu'elle peut vous
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
            Commencez votre chemin
          </h2>
          <p className="text-ivory/80 mb-8 text-lg">
            Que vous traversiez une crise, une transition ou une simple recherche de sens, je suis
            là pour vous accompagner.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <CTAButton
              variant="primary"
              href="/demande-rendez-vous"
              onTrack={() =>
                trackConversionEvent(
                  'appointment_request',
                  'button_click_psychotherapie_cta_final',
                  false
                )
              }
            >
              Demander un rendez-vous
            </CTAButton>
            <CTAButton variant="secondary" href="/a-propos">
              Découvrir mon parcours
            </CTAButton>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-ivory/10 bg-night/80 text-ivory/50 border-t px-6 py-10 text-center text-xs sm:px-10 lg:px-16">
        <CurrentYear /> Psypnos. Tous droits réservés.
        <Link href="/blog" className="text-ivory/60 hover:text-gold ml-4">
          Blog
        </Link>
        <Link href="/mentions-legales" className="text-ivory/60 hover:text-gold ml-4">
          Mentions légales
        </Link>
        <Link href="/admin" className="text-ivory/60 hover:text-gold ml-4">
          Accès privé
        </Link>
      </footer>
    </div>
  );
}
