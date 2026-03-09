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

interface SomatothérapieContentProps {
  posts: BlogPostSummary[];
}

/**
 * Client Component - Contenu de la page somatothérapie
 * Une présentation approfondie de la somatothérapie
 * Optimisée pour le SEO et l'expérience utilisateur
 */
export function SomatothérapieContent({ posts }: SomatothérapieContentProps) {
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
      question: "Qu'est-ce que la somatothérapie ?",
      answer:
        "La somatothérapie est une approche thérapeutique corporelle globale qui considère que le corps est le lieu où se mémorisent nos expériences de vie. Chaque tension, chaque douleur chronique peut être le signe d'une émotion non exprimée ou d'un vécu non intégré. En travaillant avec le corps par le toucher conscient, la respiration et le mouvement, on peut libérer ces mémoires et retrouver l'équilibre.",
    },
    {
      question: 'Faut-il se déshabiller pour une séance ?',
      answer:
        "Le travail corporel se fait généralement habillé, en tenue confortable. Certaines techniques peuvent nécessiter un contact direct avec la peau (épaules, dos, pieds), mais tout se fait dans le respect de votre intimité et avec votre consentement. Vous restez toujours maître de ce que vous acceptez.",
    },
    {
      question: 'Combien de séances sont nécessaires ?',
      answer:
        "Cela dépend de votre problématique et de votre rythme. Certaines tensions peuvent se libérer en quelques séances, d'autres nécessitent un accompagnement plus long. Généralement, 5 à 10 séances permettent un travail en profondeur. Nous évaluons ensemble au fur et à mesure de votre évolution.",
    },
    {
      question: 'Y a-t-il des contre-indications ?',
      answer:
        "La somatothérapie est une approche douce et adaptable. Cependant, elle n'est pas indiquée en cas de fractures récentes, de maladies infectieuses aiguës ou de troubles psychiatriques sévères non stabilisés. En cas de doute, n'hésitez pas à en parler lors de la prise de contact.",
    },
    {
      question: 'La somatothérapie peut-elle compléter un suivi médical ?',
      answer:
        "Oui, la somatothérapie s'inscrit parfaitement en complément d'un suivi médical ou psychologique. Elle ne remplace pas un traitement médical mais peut l'accompagner efficacement, notamment pour la gestion de la douleur, du stress ou en phase de réhabilitation.",
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
            src="/images/somatotherapie.webp"
            alt="Somatothérapie - Libérez les mémoires de votre corps"
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
              Somatothérapie
            </motion.span>

            {/* Title */}
            <motion.h1
              className="font-display text-ivory mb-6 text-4xl font-semibold sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Somatothérapie à <span className="text-gold">Saint-Julien-du-Sault</span>
            </motion.h1>
            <motion.p
              className="text-ivory/80 mx-auto mb-8 max-w-3xl text-lg sm:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Votre corps garde en mémoire chaque expérience, chaque émotion. La somatothérapie vous
              invite à écouter ces messages corporels pour libérer les tensions profondes et
              retrouver votre vitalité naturelle.
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
                  trackConversionEvent('appointment_request', 'button_click_somatotherapie_hero', false)
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
          aria-label="Présentation de la somatothérapie"
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
              Qu'est-ce que la somatothérapie ?
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La somatothérapie est une <strong>approche thérapeutique corporelle globale</strong> qui
              considère que le corps est le lieu où se mémorisent nos expériences de vie. Chaque
              tension, chaque douleur chronique, chaque raideur peut être le signe d'une émotion non
              exprimée ou d'un vécu non intégré.
            </p>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              En travaillant avec le corps par le <strong>toucher conscient, la respiration et
              le mouvement</strong>, la somatothérapie permet de libérer ces mémoires corporelles et
              de retrouver un état d'équilibre et de fluidité.
            </p>

            <div className="border-gold/30 bg-gold/5 my-8 rounded-r-lg border-l-4 p-6">
              <p className="text-ivory/80 italic leading-relaxed">
                "Le corps ne ment jamais. Il est le témoin fidèle de notre histoire, de nos joies
                comme de nos blessures. Apprendre à l'écouter, c'est retrouver le chemin de soi."
              </p>
            </div>

            <p className="text-ivory/90 text-lg leading-relaxed">
              La somatothérapie ne cherche pas à analyser intellectuellement les problèmes mais à
              les traverser par le corps, dans un espace de sécurité et de bienveillance.
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
              La somatothérapie peut vous aider si...
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La somatothérapie est une approche polyvalente qui s'adresse à toute personne
              souhaitant retrouver un lien harmonieux avec son corps :
            </p>

            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {[
                'Tensions musculaires chroniques et douleurs persistantes',
                'Stress, anxiété et épuisement nerveux',
                'Blocages émotionnels et difficulté à exprimer ses émotions',
                'Troubles du sommeil et fatigue chronique',
                'Récupération après un traumatisme ou un choc émotionnel',
                'Burn-out et épuisement professionnel',
                'Déconnexion de son corps et de ses sensations',
                'Envie de reconnecter avec soi-même en profondeur',
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
              La somatothérapie ne remplace pas un traitement médical mais peut l'accompagner
              efficacement.
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
              Mon approche en somatothérapie
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Ma pratique de la somatothérapie s'appuie sur une écoute attentive du corps et de ses
              signaux. Je combine plusieurs outils pour un accompagnement adapté à vos besoins :
            </p>

            <div className="mb-8 space-y-4">
              {[
                {
                  title: 'Le toucher conscient',
                  description:
                    'Un toucher respectueux et attentif qui permet de repérer les zones de tension et d\'accompagner leur libération en douceur.',
                },
                {
                  title: 'Le travail respiratoire',
                  description:
                    'Des exercices de respiration qui favorisent la détente profonde et la circulation de l\'énergie dans le corps.',
                },
                {
                  title: 'La mobilisation articulaire',
                  description:
                    'Des mouvements doux et progressifs pour redonner de la mobilité aux zones figées et restaurer la fluidité corporelle.',
                },
                {
                  title: 'L\'écoute somatique',
                  description:
                    'Une attention portée aux sensations, aux images et aux émotions qui émergent pendant le travail corporel, sans jugement ni interprétation.',
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
                "Le corps est la mémoire vivante de notre histoire. En le libérant, on se libère."
              </p>
              <p className="text-ivory/50 mt-4 text-center text-sm">— Wilhelm Reich</p>
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
                  <h3 className="text-ivory mb-2 text-xl font-semibold">L'accueil et l'écoute</h3>
                  <p className="text-ivory/80">
                    Nous commençons par un temps d'échange pour comprendre votre état du moment, vos
                    sensations corporelles et ce qui vous amène. Ce temps d'écoute est essentiel pour
                    adapter la séance à vos besoins.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  2
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">Le travail corporel</h3>
                  <p className="text-ivory/80">
                    Allongé confortablement, vous vous laissez guider par le toucher conscient et la
                    respiration. Le travail se fait en douceur, toujours dans le respect de vos
                    limites et de votre consentement.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  3
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">La libération</h3>
                  <p className="text-ivory/80">
                    Au fil de la séance, les tensions se libèrent progressivement. Des sensations,
                    des émotions ou des images peuvent émerger. Je vous accompagne avec bienveillance
                    à travers ce processus de libération.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  4
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">L'intégration</h3>
                  <p className="text-ivory/80">
                    Nous terminons par un temps d'échange sur vos ressentis. Ce moment d'intégration
                    est essentiel pour donner du sens à ce qui s'est passé pendant la séance et
                    ancrer les changements.
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
                Prête à libérer votre corps ?
              </h2>
              <p className="text-ivory/70 mb-6">
                La première séance est l'occasion de faire connaissance et de découvrir la
                somatothérapie en toute sécurité.
              </p>
              <CTAButton
                variant="primary"
                href="/demande-rendez-vous"
                onTrack={() =>
                  trackConversionEvent(
                    'appointment_request',
                    'button_click_somatotherapie_cta_middle',
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
              Découvrez mes articles pour mieux comprendre la somatothérapie et les approches
              corporelles.
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
            Reconnectez-vous à votre corps
          </h2>
          <p className="text-ivory/80 mb-8 text-lg">
            Que vous souhaitiez libérer des tensions, traverser un moment difficile ou simplement
            retrouver votre vitalité, la somatothérapie peut vous y aider.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <CTAButton
              variant="primary"
              href="/demande-rendez-vous"
              onTrack={() =>
                trackConversionEvent('appointment_request', 'button_click_somatotherapie_cta_final', false)
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
