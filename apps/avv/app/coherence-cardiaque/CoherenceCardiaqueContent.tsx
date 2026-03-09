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

interface CoherenceCardiaqueContentProps {
  posts: BlogPostSummary[];
}

/**
 * Client Component - Contenu de la page cohérence cardiaque
 * Présentation de la cohérence cardiaque et de ses bienfaits
 * Optimisée pour le SEO et l'expérience utilisateur
 */
export function CoherenceCardiaqueContent({ posts }: CoherenceCardiaqueContentProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Qu'est-ce que la cohérence cardiaque ?",
      answer:
        "La cohérence cardiaque est une technique de respiration rythmée qui permet de synchroniser le rythme cardiaque avec la respiration. En respirant à un rythme régulier (généralement 6 respirations par minute), on active le système nerveux parasympathique, ce qui induit un état de calme, de clarté mentale et de bien-être global. C'est une méthode simple, accessible à tous et scientifiquement validée.",
    },
    {
      question: 'Comment pratiquer la cohérence cardiaque ?',
      answer:
        "La pratique est simple : inspirez pendant 5 secondes, puis expirez pendant 5 secondes, de façon régulière et continue pendant 5 minutes. C'est la règle du 365 : 3 fois par jour (matin, midi, soir), 6 respirations par minute, pendant 5 minutes. En séance, je vous guide pour trouver votre rythme personnel et intégrer cette pratique dans votre quotidien.",
    },
    {
      question: 'Combien de temps pour ressentir les effets ?',
      answer:
        "Les effets immédiats se ressentent dès la première séance : apaisement, détente, clarté mentale. Les effets durables apparaissent après environ 2 semaines de pratique régulière. Au bout d'un mois, les bienfaits sur le sommeil, le stress et l'immunité sont mesurables.",
    },
    {
      question: 'Y a-t-il des contre-indications ?',
      answer:
        "La cohérence cardiaque est une pratique douce et sans danger, accessible à tous. Il n'y a pas de contre-indication connue. Elle peut être pratiquée par les enfants, les personnes âgées, les femmes enceintes et même les personnes souffrant de pathologies chroniques. En cas de doute, consultez votre médecin.",
    },
    {
      question: 'Peut-on pratiquer seul chez soi ?',
      answer:
        "Oui, c'est même recommandé ! L'objectif des séances est de vous apprendre à pratiquer en autonomie. Je vous transmets les techniques, les outils et les repères pour que vous puissiez intégrer la cohérence cardiaque dans votre quotidien. Des applications gratuites peuvent vous guider dans votre pratique.",
    },
  ];

  return (
    <div className="from-night via-night/95 to-night text-ivory min-h-screen bg-gradient-to-b">
      <NavigationMenu forceVisible />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="bg-night relative overflow-hidden px-6 pb-20 pt-24 sm:px-8 sm:pb-24 sm:pt-28 lg:px-16"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/coherence-cardiaque.webp"
            alt="Cohérence Cardiaque - Harmonisez votre corps et votre esprit"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          <div className="from-night/75 via-night/90 to-night/95 absolute inset-0 bg-gradient-to-b" />
        </div>

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
            <motion.span
              className="text-gold mb-4 inline-block text-sm font-medium uppercase tracking-widest"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Cohérence Cardiaque
            </motion.span>

            <motion.h1
              className="font-display text-ivory mb-6 text-4xl font-semibold sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Cohérence Cardiaque dans <span className="text-gold">l'Yonne</span>
            </motion.h1>
            <motion.p
              className="text-ivory/80 mx-auto mb-8 max-w-3xl text-lg sm:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              La cohérence cardiaque est une technique de respiration simple et puissante qui
              harmonise le rythme de votre coeur et de votre respiration. En quelques minutes par
              jour, retrouvez calme, clarté mentale et vitalité.
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
                    'button_click_coherence_cardiaque_hero',
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
          aria-label="Présentation de la cohérence cardiaque"
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
              Qu'est-ce que la cohérence cardiaque ?
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La cohérence cardiaque est une <strong>technique de respiration rythmée</strong> qui
              permet de synchroniser le battement du coeur avec le rythme respiratoire. Quand cette
              synchronisation est atteinte, le système nerveux autonome s'équilibre, produisant un
              état de calme profond et de clarté mentale.
            </p>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Validée par de nombreuses <strong>études scientifiques</strong>, cette pratique est
              utilisée aussi bien dans le domaine médical que dans la gestion du stress, la
              préparation sportive et le développement personnel.
            </p>

            <div className="border-gold/30 bg-gold/5 my-8 rounded-r-lg border-l-4 p-6">
              <p className="text-ivory/80 italic leading-relaxed">
                "5 minutes de cohérence cardiaque, 3 fois par jour, suffisent à transformer
                durablement votre rapport au stress et à vos émotions."
              </p>
            </div>

            <p className="text-ivory/90 text-lg leading-relaxed">
              La méthode est simple, accessible à tous et ne nécessite aucun matériel. C'est un
              outil que vous pouvez utiliser partout, à tout moment de la journée.
            </p>
          </motion.section>

          {/* Section 2: Bienfaits */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-8 text-3xl font-semibold sm:text-4xl">
              Les bienfaits prouvés de la cohérence cardiaque
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Les bienfaits de la cohérence cardiaque sont nombreux et scientifiquement documentés :
            </p>

            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {[
                'Réduction du stress et de l\'anxiété',
                'Amélioration de la qualité du sommeil',
                'Meilleure gestion émotionnelle',
                'Renforcement du système immunitaire',
                'Baisse de la tension artérielle',
                'Amélioration de la concentration et de la mémoire',
                'Diminution du cortisol (hormone du stress)',
                'Augmentation de la DHEA (hormone de jouvence)',
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
              Les effets se font sentir dès les premières minutes de pratique et s'amplifient avec
              la régularité.
            </p>
          </motion.section>

          {/* Section 3: La méthode 365 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-8 text-3xl font-semibold sm:text-4xl">
              La méthode 365
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La cohérence cardiaque repose sur un protocole simple et efficace, popularisé par le
              Dr David O'Hare :
            </p>

            <div className="mb-8 space-y-4">
              {[
                {
                  title: '3 fois par jour',
                  description:
                    'Pratiquez au réveil, avant le déjeuner et en fin d\'après-midi. Ces trois moments clés permettent de maintenir les effets tout au long de la journée.',
                },
                {
                  title: '6 respirations par minute',
                  description:
                    'Inspirez pendant 5 secondes, expirez pendant 5 secondes. Ce rythme correspond à la fréquence de résonance du système cardiovasculaire.',
                },
                {
                  title: '5 minutes par session',
                  description:
                    'Seulement 5 minutes suffisent pour induire un état de cohérence cardiaque. Les effets physiologiques durent ensuite 4 à 6 heures.',
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
                "La cohérence cardiaque est la porte d'entrée la plus simple vers un meilleur
                équilibre physiologique et émotionnel."
              </p>
              <p className="text-ivory/50 mt-4 text-center text-sm">— Dr David O'Hare</p>
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
                  <h3 className="text-ivory mb-2 text-xl font-semibold">Bilan initial</h3>
                  <p className="text-ivory/80">
                    Nous faisons le point sur votre état de stress, vos objectifs et votre mode de
                    vie. Je vous explique les principes de la cohérence cardiaque et ses bienfaits.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  2
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">Apprentissage guidé</h3>
                  <p className="text-ivory/80">
                    Je vous guide pas à pas dans la pratique de la respiration rythmée. Nous trouvons
                    ensemble le rythme qui vous convient le mieux et les moments idéaux pour
                    pratiquer.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  3
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">Pratique autonome</h3>
                  <p className="text-ivory/80">
                    Vous repartez avec tous les outils pour pratiquer chez vous : techniques,
                    applications recommandées et conseils personnalisés pour intégrer la cohérence
                    cardiaque dans votre quotidien.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 5: FAQ */}
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
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                Prête à découvrir la cohérence cardiaque ?
              </h2>
              <p className="text-ivory/70 mb-6">
                En quelques séances, apprenez à utiliser cet outil puissant pour transformer votre
                quotidien.
              </p>
              <CTAButton
                variant="primary"
                href="/demande-rendez-vous"
                onTrack={() =>
                  trackConversionEvent(
                    'appointment_request',
                    'button_click_coherence_cardiaque_cta_middle',
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
              Découvrez mes articles pour approfondir vos connaissances sur la cohérence cardiaque.
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
            Retrouvez votre équilibre naturel
          </h2>
          <p className="text-ivory/80 mb-8 text-lg">
            La cohérence cardiaque est un outil simple et puissant pour harmoniser votre corps et
            votre esprit. Commencez dès aujourd'hui.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <CTAButton
              variant="primary"
              href="/demande-rendez-vous"
              onTrack={() =>
                trackConversionEvent(
                  'appointment_request',
                  'button_click_coherence_cardiaque_cta_final',
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
