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
 * Une présentation approfondie et rassurante de la sophrologie
 * Optimisée pour le SEO et l'expérience utilisateur
 */
export function SophrologieContent({ posts }: SophrologieContentProps) {
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
      question: "Qu'est-ce que la sophrologie ?",
      answer:
        "La sophrologie est une méthode psycho-corporelle qui utilise la respiration contrôlée, la relaxation dynamique et la visualisation positive pour harmoniser le corps et l'esprit. Créée dans les années 1960 par le neuropsychiatre Alfonso Caycedo, elle s'inspire du yoga, du zen et de la phénoménologie pour développer la conscience de soi et renforcer l'équilibre intérieur.",
    },
    {
      question: 'Comment se déroule une séance de sophrologie ?',
      answer:
        "Une séance dure environ une heure. Elle commence par un temps d'échange pour identifier vos besoins, suivi d'exercices de relaxation dynamique (mouvements doux associés à la respiration) et de visualisations guidées. Vous restez conscient et acteur tout au long de la séance. Nous terminons par un temps de partage sur vos ressentis.",
    },
    {
      question: 'Combien de séances faut-il prévoir ?',
      answer:
        "Le nombre de séances varie selon vos objectifs. Certaines problématiques comme la gestion du stress peuvent s'améliorer en 5 à 8 séances. Un travail plus approfondi sur la confiance en soi ou la préparation mentale peut nécessiter un accompagnement plus long. Nous définissons ensemble un programme adapté à vos besoins.",
    },
    {
      question: 'La sophrologie est-elle remboursée ?',
      answer:
        "La sophrologie n'est pas remboursée par la Sécurité sociale. Cependant, de nombreuses mutuelles proposent un forfait annuel pour les séances de sophrologie. Je vous invite à vérifier auprès de votre mutuelle les conditions de prise en charge.",
    },
    {
      question: 'Faut-il une tenue particulière ?',
      answer:
        "Non, il suffit de porter des vêtements confortables dans lesquels vous vous sentez à l'aise. Les exercices se pratiquent debout ou assis, sans effort physique intense. Aucun matériel particulier n'est nécessaire.",
    },
  ];

  return (
    <div className="from-night via-night/95 to-night text-ivory min-h-screen bg-gradient-to-b">
      {/* Analytics tracking (lazy loaded, client-side only) */}

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
            alt="Sophrologie - Un espace pour se retrouver"
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
              La sophrologie vous invite à explorer vos ressources intérieures par la respiration,
              la relaxation et la visualisation. Dans un cadre bienveillant, je vous accompagne
              pour retrouver sérénité, confiance et équilibre au quotidien.
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
          aria-label="Présentation de la sophrologie"
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
              La sophrologie est une <strong>méthode psycho-corporelle</strong> qui combine des
              exercices de respiration, de relaxation musculaire et de visualisation positive. Créée
              en 1960 par le neuropsychiatre Alfonso Caycedo, elle s'inspire du yoga, du zen et de
              la phénoménologie pour vous aider à développer une conscience sereine de vous-même.
            </p>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La sophrologie s'adresse à tous, quel que soit l'âge ou la condition physique. Elle
              vous apprend à <strong>mobiliser vos propres ressources</strong> pour mieux gérer le
              stress, renforcer la confiance en soi, préparer un événement important ou simplement
              retrouver un équilibre intérieur.
            </p>

            <div className="border-gold/30 bg-gold/5 my-8 rounded-r-lg border-l-4 p-6">
              <p className="text-ivory/80 italic leading-relaxed">
                "Quand le corps se détend, l'esprit se libère. La sophrologie nous enseigne
                à habiter pleinement l'instant présent."
              </p>
            </div>

            <p className="text-ivory/90 text-lg leading-relaxed">
              En séance, je vous guide à travers des exercices simples et progressifs. Vous apprenez
              à les reproduire chez vous pour en faire des outils du quotidien. La sophrologie est
              une pratique autonomisante : vous devenez acteur de votre bien-être.
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
              La sophrologie s'adapte à de nombreuses situations du quotidien. Voici quelques
              exemples de ce qu'elle peut vous apporter :
            </p>

            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {[
                'Gestion du stress et de l\'anxiété au quotidien',
                'Préparation aux examens ou événements importants',
                'Amélioration de la qualité du sommeil',
                'Renforcement de la confiance en soi',
                'Accompagnement de la grossesse et de la parentalité',
                'Gestion des émotions et des phobies',
                'Récupération après un burn-out',
                'Développement de la concentration et de la mémoire',
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
              Que vous traversiez une période difficile ou que vous souhaitiez simplement améliorer
              votre qualité de vie, la sophrologie vous offre des outils concrets et durables.
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
              Les outils de la sophrologie
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La sophrologie repose sur des <strong>techniques simples et progressives</strong> que
              vous apprenez à maîtriser au fil des séances. Chaque outil peut être utilisé de
              manière autonome dans votre quotidien.
            </p>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Voici les principaux piliers de la pratique :
            </p>

            <div className="mb-8 space-y-4">
              {[
                {
                  title: 'La respiration contrôlée',
                  description:
                    'Des exercices respiratoires spécifiques pour calmer le système nerveux, réduire le stress et retrouver un état de sérénité.',
                },
                {
                  title: 'La relaxation dynamique',
                  description:
                    'Des mouvements doux associés à la respiration pour relâcher les tensions musculaires et favoriser la détente profonde du corps.',
                },
                {
                  title: 'La visualisation positive',
                  description:
                    'Des exercices de projection mentale pour renforcer la confiance en soi, préparer un événement ou ancrer des ressentis positifs.',
                },
                {
                  title: "L'écoute du corps",
                  description:
                    'Développer la conscience corporelle pour mieux identifier ses besoins, ses limites et ses ressources intérieures.',
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
                  <h3 className="text-ivory mb-2 text-xl font-semibold">La pratique guidée</h3>
                  <p className="text-ivory/80">
                    Les séances suivantes approfondissent les exercices de respiration, relaxation
                    dynamique et visualisation. Vous apprenez progressivement à les reproduire seul.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  4
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">L'autonomie</h3>
                  <p className="text-ivory/80">
                    Vous intégrez les techniques dans votre quotidien. La sophrologie vous rend
                    autonome : vous disposez d'outils durables pour gérer le stress et cultiver
                    votre bien-être.
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
              Découvrez mes articles pour mieux comprendre la sophrologie et ce qu'elle peut vous
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
            Retrouvez votre sérénité
          </h2>
          <p className="text-ivory/80 mb-8 text-lg">
            La sophrologie vous offre des outils concrets pour mieux vivre chaque jour. Faites
            le premier pas vers votre bien-être.
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
              Découvrir mon parcours
            </CTAButton>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-ivory/10 bg-night/80 text-ivory/50 border-t px-6 py-10 text-center text-xs sm:px-10 lg:px-16">
        <CurrentYear /> Appréciez Votre Vie. Tous droits réservés.
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
