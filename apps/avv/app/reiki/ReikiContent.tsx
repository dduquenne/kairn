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

interface ReikiContentProps {
  posts: BlogPostSummary[];
}

/**
 * Client Component - Contenu de la page reiki
 * Présentation du reiki et de ses bienfaits
 * Optimisée pour le SEO et l'expérience utilisateur
 */
export function ReikiContent({ posts }: ReikiContentProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Qu'est-ce que le reiki ?",
      answer:
        "Le reiki est une méthode de soin énergétique d'origine japonaise, développée par Mikao Usui au début du XXe siècle. Le mot « reiki » signifie « énergie vitale universelle ». Le praticien canalise cette énergie par imposition des mains sur ou au-dessus du corps du receveur, favorisant ainsi l'auto-guérison, le rééquilibrage énergétique et une profonde détente.",
    },
    {
      question: 'Comment se déroule une séance de reiki ?',
      answer:
        "Vous restez habillé, allongé confortablement sur une table de soin. Je pose mes mains délicatement sur ou au-dessus de différentes zones de votre corps, en suivant un protocole précis qui couvre les principaux centres énergétiques. La séance dure environ 1 heure. Vous pouvez ressentir de la chaleur, des picotements, ou simplement une profonde détente.",
    },
    {
      question: 'Faut-il croire au reiki pour que ça fonctionne ?',
      answer:
        "Non, le reiki agit indépendamment de vos croyances. Il suffit d'être ouvert et réceptif. Beaucoup de personnes sceptiques au départ sont surprises par la profondeur de la détente ressentie. Le reiki n'est pas une religion ni une pratique mystique : c'est une technique de soin énergétique.",
    },
    {
      question: 'Combien de séances sont recommandées ?',
      answer:
        "Une seule séance peut déjà apporter un bienfait notable. Pour un travail en profondeur, 3 à 4 séances rapprochées sont généralement recommandées, puis des séances d'entretien selon vos besoins. Chaque parcours est unique et nous adaptons ensemble le rythme des séances.",
    },
    {
      question: 'Le reiki peut-il remplacer un traitement médical ?',
      answer:
        "Non, le reiki ne remplace jamais un traitement médical. C'est une approche complémentaire qui peut accompagner un traitement en cours, soulager certains effets secondaires et favoriser le bien-être global. Il est toujours important de consulter votre médecin pour toute question de santé.",
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
            src="/images/reiki.webp"
            alt="Reiki - Rééquilibrez vos énergies"
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
              Reiki
            </motion.span>

            <motion.h1
              className="font-display text-ivory mb-6 text-4xl font-semibold sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Reiki à <span className="text-gold">Saint-Julien-du-Sault</span>
            </motion.h1>
            <motion.p
              className="text-ivory/80 mx-auto mb-8 max-w-3xl text-lg sm:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Le reiki est un soin énergétique doux et profond qui rééquilibre les énergies de
              votre corps. Par l'imposition des mains, je canalise l'énergie universelle pour
              favoriser votre détente, votre guérison et votre bien-être global.
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
                    'button_click_reiki_hero',
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
          aria-label="Présentation du reiki"
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
              Qu'est-ce que le reiki ?
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Le reiki est une <strong>méthode de soin énergétique</strong> d'origine japonaise,
              développée par Mikao Usui au début du XXe siècle. Le mot « reiki » est composé de
              deux kanji japonais : <em>rei</em> (universel) et <em>ki</em> (énergie vitale).
            </p>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Le praticien de reiki canalise cette <strong>énergie vitale universelle</strong> par
              imposition des mains sur ou au-dessus du corps du receveur. L'énergie circule
              naturellement vers les zones qui en ont besoin, favorisant l'auto-guérison et le
              rééquilibrage énergétique.
            </p>

            <div className="border-gold/30 bg-gold/5 my-8 rounded-r-lg border-l-4 p-6">
              <p className="text-ivory/80 italic leading-relaxed">
                "Le reiki n'est pas seulement une technique de soin. C'est une invitation à se
                reconnecter à l'énergie de vie qui nous traverse et nous anime."
              </p>
            </div>

            <p className="text-ivory/90 text-lg leading-relaxed">
              Le reiki est une pratique douce, non invasive, qui respecte le rythme et les besoins
              de chacun. Aucune manipulation physique n'est nécessaire : seul le toucher léger des
              mains ou leur présence au-dessus du corps suffit.
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
              Les bienfaits du reiki
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Le reiki agit sur tous les plans de l'être : physique, émotionnel, mental et
              spirituel. Ses bienfaits sont multiples :
            </p>

            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {[
                'Détente profonde et relâchement des tensions',
                'Soulagement des douleurs et tensions musculaires',
                'Rééquilibrage énergétique global',
                'Renforcement du bien-être et de la vitalité',
                'Amélioration de la qualité du sommeil',
                'Réduction du stress et de l\'anxiété',
                'Soutien au processus de guérison naturelle',
                'Harmonisation des émotions',
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
              Le reiki est complémentaire aux soins médicaux et ne les remplace en aucun cas.
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
              Les principes du reiki
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Le reiki repose sur des principes simples qui guident la pratique et la philosophie
              de vie :
            </p>

            <div className="mb-8 space-y-4">
              {[
                {
                  title: 'L\'énergie universelle',
                  description:
                    'Le reiki s\'appuie sur l\'idée qu\'une énergie vitale universelle circule en nous et autour de nous. Quand cette énergie circule librement, nous sommes en bonne santé. Quand elle est bloquée, des déséquilibres apparaissent.',
                },
                {
                  title: 'L\'auto-guérison',
                  description:
                    'Le reiki ne guérit pas directement : il active et soutient les capacités naturelles d\'auto-guérison du corps. L\'énergie va naturellement là où le corps en a besoin.',
                },
                {
                  title: 'L\'imposition des mains',
                  description:
                    'Le praticien pose ses mains sur ou au-dessus des centres énergétiques du corps. Le toucher est léger, respectueux et bienveillant. Aucune pression ni manipulation n\'est exercée.',
                },
                {
                  title: 'Le respect du rythme de chacun',
                  description:
                    'Le reiki respecte votre rythme et vos besoins. L\'énergie s\'adapte naturellement à ce que vous êtes prêt à recevoir à ce moment précis.',
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
                "Juste pour aujourd'hui, ne te mets pas en colère. Juste pour aujourd'hui, ne te
                fais pas de souci. Sois rempli de gratitude. Accomplis ton devoir avec diligence.
                Sois bienveillant envers les autres."
              </p>
              <p className="text-ivory/50 mt-4 text-center text-sm">— Les 5 principes du Reiki, Mikao Usui</p>
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
              Comment se déroule une séance ?
            </h2>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  1
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">L'accueil</h3>
                  <p className="text-ivory/80">
                    Nous commençons par un temps d'échange pour comprendre vos besoins et vos
                    attentes. Vous restez habillé en tenue confortable tout au long de la séance.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  2
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">Le soin</h3>
                  <p className="text-ivory/80">
                    Allongé confortablement, vous fermez les yeux et vous vous laissez porter. Je
                    pose mes mains sur ou au-dessus de différentes zones de votre corps, suivant un
                    protocole qui couvre les principaux centres énergétiques.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  3
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">Les ressentis</h3>
                  <p className="text-ivory/80">
                    Pendant la séance, vous pouvez ressentir de la chaleur, des picotements, des
                    vagues de détente ou simplement un profond apaisement. Chaque expérience est
                    unique et il n'y a pas de "bonne" façon de ressentir.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  4
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">Le partage</h3>
                  <p className="text-ivory/80">
                    Après le soin, nous prenons un moment pour échanger sur vos ressentis. Ce temps
                    de parole permet d'intégrer l'expérience et de recevoir des conseils
                    personnalisés pour prolonger les bienfaits.
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
                Prête à rééquilibrer vos énergies ?
              </h2>
              <p className="text-ivory/70 mb-6">
                Offrez-vous un moment de profonde détente et laissez l'énergie du reiki rétablir
                votre équilibre intérieur.
              </p>
              <CTAButton
                variant="primary"
                href="/demande-rendez-vous"
                onTrack={() =>
                  trackConversionEvent(
                    'appointment_request',
                    'button_click_reiki_cta_middle',
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
              Découvrez mes articles pour mieux comprendre le reiki et les soins énergétiques.
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
            Reconnectez-vous à votre énergie vitale
          </h2>
          <p className="text-ivory/80 mb-8 text-lg">
            Le reiki vous offre un espace de paix et de régénération. Laissez l'énergie
            universelle vous guider vers un meilleur équilibre.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <CTAButton
              variant="primary"
              href="/demande-rendez-vous"
              onTrack={() =>
                trackConversionEvent(
                  'appointment_request',
                  'button_click_reiki_cta_final',
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
