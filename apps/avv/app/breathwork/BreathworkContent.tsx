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
import { SeminarsList, type Seminar } from './SeminarsList';

interface BreathworkContentProps {
  posts: BlogPostSummary[];
  seminars: Seminar[];
}

/**
 * Client Component - Contenu de la page breathwork & rebirth
 * Une présentation approfondie et rassurante de la breathwork & rebirth
 * Optimisée pour le SEO et l'expérience utilisateur
 */
export function BreathworkContent({
  posts,
  seminars,
}: BreathworkContentProps) {
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
      question: "Qu'est-ce que la breathwork & rebirth ?",
      answer:
        "La breathwork & rebirth est une technique de respiration profonde et accélérée développée par le psychiatre Stanislav Grof dans les années 1970. Le terme « holotropique » vient du grec et signifie « qui va vers la totalité ». Cette pratique permet d'accéder à des états modifiés de conscience pour explorer son monde intérieur, libérer des blocages émotionnels et favoriser la guérison et la transformation personnelle.",
    },
    {
      question: 'Est-ce que je vais perdre le contrôle ?',
      answer:
        "Non, vous restez conscient tout au long de l'expérience. La breathwork & rebirth active votre sagesse intérieure, qui guide naturellement le processus. Vous êtes toujours libre de ralentir ou d'arrêter si vous le souhaitez. Les facilitateurs sont présents pour vous accompagner avec bienveillance et garantir un cadre sécurisant.",
    },
    {
      question: 'Y a-t-il des contre-indications ?',
      answer:
        'Oui, certaines conditions nécessitent un avis médical préalable ou contre-indiquent la pratique : problèmes cardiaques ou cardiovasculaires, hypertension non contrôlée, grossesse, épilepsie, glaucome, antécédents psychiatriques graves, ou prise de certains médicaments. Un entretien préalable permet de vérifier que cette pratique vous convient.',
    },
    {
      question: 'Que vais-je vivre pendant une session ?',
      answer:
        "Chaque expérience est unique. Certains vivent des sensations corporelles intenses, des libérations émotionnelles, des visions ou des prises de conscience profondes. D'autres traversent des expériences plus subtiles de détente et de paix. Il n'y a pas de « bonne » expérience : votre sagesse intérieure vous apporte exactement ce dont vous avez besoin.",
    },
    {
      question: 'Comment se déroule un séminaire ?',
      answer:
        "Le séminaire se déroule généralement sur un ou deux jours dans un lieu propice au recueillement. Il comprend une préparation, une session de respiration d'environ 2 à 3 heures accompagnée par une musique évocatrice, un travail corporel si nécessaire, puis un temps d'intégration avec dessin, écriture et partage en groupe. Chaque participant alterne entre le rôle de respirant et d'accompagnant.",
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
            src="/images/breathwork.webp"
            alt="Breathwork & Rebirth - Le souffle comme chemin de transformation"
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
              Breathwork & Rebirth
            </motion.span>

            {/* Title */}
            <motion.h1
              className="font-display text-ivory mb-6 text-4xl font-semibold sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Séminaires de Breathwork & Rebirth en <span className="text-gold">Bourgogne</span>
            </motion.h1>
            <motion.p
              className="text-ivory/80 mx-auto mb-8 max-w-3xl text-lg sm:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              La breathwork & rebirth ouvre une porte vers votre monde intérieur. Porté par le
              souffle, la musique et un accompagnement bienveillant, vous accédez à des espaces de
              libération, de guérison et de transformation profonde.
            </motion.p>
            <motion.div
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <CTAButton
                variant="primary"
                href="/inscription-seminaire"
                onTrack={() =>
                  trackConversionEvent(
                    'seminar_registration',
                    'button_click_respiration_hero',
                    false
                  )
                }
              >
                S'inscrire à un séminaire
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
          aria-label="Présentation de la breathwork & rebirth"
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
              Qu'est-ce que la breathwork & rebirth ?
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La breathwork & rebirth est une <strong>technique de respiration profonde</strong>{' '}
              développée par le psychiatre tchèque Stanislav Grof et son épouse Christina dans les
              années 1970. Issue de leurs recherches sur les états modifiés de conscience, elle
              offre un accès naturel à des dimensions profondes de la psyché.
            </p>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Le terme « holotropique » vient du grec <em>holos</em> (totalité) et <em>trepein</em>{' '}
              (aller vers). Cette pratique nous invite littéralement à{' '}
              <strong>aller vers notre totalité</strong>, à retrouver les parties de nous-mêmes que
              nous avons oubliées, refoulées ou dont nous nous sommes coupés.
            </p>

            <div className="border-gold/30 bg-gold/5 my-8 rounded-r-lg border-l-4 p-6">
              <p className="text-ivory/80 italic leading-relaxed">
                "Le corps est le chemin. Le souffle est le guide. La musique porte le voyage. L'âme
                révèle ce qui doit être vu."
              </p>
            </div>

            <p className="text-ivory/90 text-lg leading-relaxed">
              Combinant une respiration accélérée, une musique évocatrice et un travail corporel
              ciblé, cette pratique permet d'accéder à des états de conscience élargie où peuvent
              émerger des prises de conscience, des libérations émotionnelles et des expériences
              transformatrices.
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
              Pourquoi vivre cette expérience ?
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La breathwork & rebirth s'adresse à toute personne en quête de transformation,
              désireuse d'explorer son monde intérieur ou de libérer des blocages qui l'empêchent
              d'avancer. Elle peut vous aider si vous ressentez :
            </p>

            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {[
                'Le besoin de vous reconnecter à vous-même',
                'Des blocages émotionnels difficiles à identifier',
                'Une quête de sens ou une crise existentielle',
                "Le désir d'explorer votre monde intérieur",
                'Des tensions physiques ou psychiques persistantes',
                "L'envie d'une expérience transformatrice profonde",
                'Le besoin de lâcher prise et de vous libérer',
                'Une aspiration à plus de clarté et de paix intérieure',
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
              Cette pratique n'est pas réservée aux personnes en souffrance. Elle s'adresse à tous
              ceux qui souhaitent approfondir leur connaissance d'eux-mêmes et vivre une expérience
              de transformation authentique.
            </p>
          </motion.section>

          {/* Section 3: Le processus */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-8 text-3xl font-semibold sm:text-4xl">
              Les trois piliers de l'expérience
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              La breathwork & rebirth repose sur trois éléments fondamentaux qui, combinés,
              créent les conditions d'une expérience profonde et transformatrice :
            </p>

            <div className="mb-8 space-y-4">
              {[
                {
                  title: 'La respiration consciente',
                  description:
                    "Une respiration plus profonde et plus rapide que d'habitude, maintenue sur une durée prolongée, permet d'induire naturellement un état modifié de conscience. Ce n'est pas de l'hyperventilation forcée, mais un souffle soutenu et intentionnel.",
                },
                {
                  title: 'La musique évocatrice',
                  description:
                    "Une playlist soigneusement composée accompagne le voyage intérieur. La musique soutient, amplifie et guide l'expérience à travers différentes phases : ouverture, intensification, percée et intégration.",
                },
                {
                  title: 'Le travail corporel focalisé',
                  description:
                    'Si des tensions ou des blocages se manifestent dans le corps, un travail corporel ciblé permet de les libérer. Ce soutien physique, toujours consenti, aide à compléter les processus qui ont émergé pendant la respiration.',
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
                "Dans la breathwork & rebirth, nous ne cherchons pas à créer quelque chose de
                nouveau. Nous permettons à ce qui a toujours été là de se révéler."
              </p>
              <p className="text-ivory/50 mt-4 text-center text-sm">— Stanislav Grof</p>
            </div>
          </motion.section>

          {/* Section 4: Déroulement d'un séminaire */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-8 text-3xl font-semibold sm:text-4xl">
              Comment se déroule un séminaire ?
            </h2>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  1
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">
                    L'accueil et la préparation
                  </h3>
                  <p className="text-ivory/80">
                    Nous nous retrouvons dans un lieu propice au recueillement. Après un temps
                    d'accueil, nous préparons ensemble la session : présentation de la pratique,
                    définition de vos intentions, et création d'un espace de confiance avec le
                    groupe.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  2
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">
                    La session de respiration
                  </h3>
                  <p className="text-ivory/80">
                    Allongé confortablement, vous vous laissez porter par votre respiration et la
                    musique. La session dure entre 2 et 3 heures. Un accompagnant reste à vos côtés
                    pour veiller sur vous avec bienveillance.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  3
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">Le travail corporel</h3>
                  <p className="text-ivory/80">
                    Si des tensions persistent à la fin de la respiration, un travail corporel ciblé
                    peut être proposé pour aider à compléter le processus. Ce soutien est toujours
                    proposé avec votre consentement.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="bg-gold/10 text-gold flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                  4
                </div>
                <div>
                  <h3 className="text-ivory mb-2 text-xl font-semibold">
                    L'intégration et le partage
                  </h3>
                  <p className="text-ivory/80">
                    Après la session, vous prenez le temps de dessiner ou d'écrire pour ancrer votre
                    expérience. Un cercle de partage permet ensuite à chacun d'exprimer ce qu'il a
                    vécu, sans jugement ni interprétation.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 5: Le lieu */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-8 text-3xl font-semibold sm:text-4xl">
              Un lieu magique pour votre voyage
            </h2>

            <p className="text-ivory/90 mb-6 text-lg leading-relaxed">
              Nos séminaires se déroulent au <strong>Moulin d'en Bas</strong>, un magnifique moulin
              bourguignon niché dans un écrin de verdure. Ce lieu chargé d'histoire et de quiétude
              offre les conditions idéales pour un travail intérieur profond.
            </p>

            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {[
                'Un cadre naturel ressourçant et préservé',
                'Des espaces de pratique confortables et chaleureux',
                'Une cuisine saine et faite maison',
                'Un hébergement sur place possible',
                'Un jardin et des espaces de détente',
                'Une atmosphère propice au recueillement',
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span className="bg-gold/20 text-gold mt-1 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full">
                    <span className="text-lg font-bold">+</span>
                  </span>
                  <span className="text-ivory/80">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Section 6: FAQ */}
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
            <div className="border-gold/20 from-gold/10 to-gold/5 rounded-lg border bg-gradient-to-br p-8 text-center">
              <h2 className="font-display text-ivory mb-4 text-2xl font-semibold sm:text-3xl">
                Prêt à vivre l'expérience ?
              </h2>
              <p className="text-ivory/70 mb-6">
                Rejoignez-nous pour un séminaire de breathwork & rebirth et découvrez ce que
                votre sagesse intérieure a à vous révéler.
              </p>
              <CTAButton
                variant="primary"
                href="/inscription-seminaire"
                onTrack={() =>
                  trackConversionEvent(
                    'seminar_registration',
                    'button_click_respiration_cta_middle',
                    false
                  )
                }
              >
                S'inscrire à un séminaire
              </CTAButton>
            </div>
          </motion.section>
        </article>

        {/* Section Séminaires à venir */}
        {seminars.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-display text-gold-accessible mb-4 text-3xl font-semibold sm:text-4xl">
              Prochains séminaires
            </h2>
            <p className="text-ivory/70 mb-8 text-lg">
              Découvrez les prochaines dates pour vivre l'expérience de la breathwork & rebirth.
            </p>

            <SeminarsList seminars={seminars} />

            <div className="mt-8 text-center">
              <CTAButton
                variant="primary"
                href="/inscription-seminaire"
                onTrack={() =>
                  trackConversionEvent(
                    'seminar_registration',
                    'button_click_respiration_seminars_list',
                    false
                  )
                }
              >
                S'inscrire à un séminaire
              </CTAButton>
            </div>
          </motion.section>
        )}

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
              Découvrez mes articles pour mieux comprendre la breathwork & rebirth et ce qu'elle
              peut vous apporter.
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
            Commencez votre voyage intérieur
          </h2>
          <p className="text-ivory/80 mb-8 text-lg">
            La breathwork & rebirth vous invite à rencontrer votre sagesse intérieure. Êtes-vous
            prêt à découvrir ce qu'elle a à vous révéler ?
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <CTAButton
              variant="primary"
              href="/inscription-seminaire"
              onTrack={() =>
                trackConversionEvent(
                  'seminar_registration',
                  'button_click_respiration_cta_final',
                  false
                )
              }
            >
              S'inscrire à un séminaire
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
