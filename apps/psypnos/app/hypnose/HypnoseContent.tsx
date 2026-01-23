"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CTAButton } from "../../components/CTAButton";
import { GlobalHeader } from "../../components/GlobalHeader";
import { CurrentYear } from "../../components/CurrentYear";
import type { BlogPostSummary } from "@/lib/blog";
import { ArticlesList } from "./ArticlesList";
import { trackConversionEvent } from "@/hooks/useAnalytics";

// Lazy load Analytics with SSR disabled
const Analytics = dynamic(
  () =>
    import("../../components/Analytics").then((mod) => ({
      default: mod.Analytics,
    })),
  {
    ssr: false,
  }
);

interface HypnoseContentProps {
  posts: BlogPostSummary[];
}

/**
 * Client Component - Contenu de la page hypnose
 * Une présentation approfondie et rassurante de l'hypnose thérapeutique
 * Optimisée pour le SEO et l'expérience utilisateur
 */
export function HypnoseContent({ posts }: HypnoseContentProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // État pour la FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Qu'est-ce que l'hypnose thérapeutique ?",
      answer:
        "L'hypnose thérapeutique est un état naturel de conscience modifiée qui permet d'accéder aux ressources de votre inconscient. Contrairement aux idées reçues, vous restez parfaitement conscient et gardez le contrôle pendant toute la séance. C'est un outil puissant qui facilite le changement en contournant les résistances du mental conscient.",
    },
    {
      question: "Vais-je perdre le contrôle sous hypnose ?",
      answer:
        "Non, absolument pas. L'hypnose thérapeutique n'a rien à voir avec l'hypnose de spectacle. Vous restez conscient, vous entendez tout ce qui se dit, et vous pouvez à tout moment ouvrir les yeux ou interrompre la séance. Votre inconscient protège ce qui doit l'être : il n'acceptera jamais une suggestion contraire à vos valeurs.",
    },
    {
      question: "Tout le monde peut-il être hypnotisé ?",
      answer:
        "Oui, l'hypnose est un état naturel que nous expérimentons tous quotidiennement : quand nous sommes absorbés par un film, un livre, ou lorsque nous conduisons en « pilote automatique ». Certaines personnes y accèdent plus facilement que d'autres, mais avec de la pratique, chacun peut développer cette capacité.",
    },
    {
      question: "Combien de séances sont nécessaires ?",
      answer:
        "Cela dépend de la problématique et de chaque personne. Pour des objectifs ciblés (arrêt du tabac, phobie simple), 1 à 3 séances peuvent suffire. Pour un travail plus profond sur l'anxiété ou la confiance en soi, un accompagnement de plusieurs séances peut être nécessaire. Nous évaluons ensemble au fur et à mesure.",
    },
    {
      question: "L'hypnose fonctionne-t-elle en visioconférence ?",
      answer:
        "Oui, l'hypnose à distance est tout aussi efficace qu'en présentiel. Vous êtes confortablement installé chez vous, dans un environnement familier et sécurisant. Seule votre voix et la mienne comptent. De nombreuses personnes apprécient même cette modalité pour sa praticité et le confort qu'elle procure.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-night via-night/95 to-night text-ivory">
      {/* Analytics tracking (lazy loaded, client-side only) */}
      <Analytics />

      {/* Global Header */}
      <GlobalHeader context="privacy" />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-night px-6 py-20 sm:px-8 sm:py-24 lg:px-16"
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hypnose.webp"
            alt="Hypnose thérapeutique - Un voyage vers vos ressources internes"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Overlay pour lisibilité du texte */}
          <div className="absolute inset-0 bg-gradient-to-b from-night/75 via-night/90 to-night/95" />
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
              className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-gold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Hypnose thérapeutique
            </motion.span>

            {/* Title */}
            <motion.h1
              className="mb-6 font-display text-4xl font-semibold text-ivory sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Un voyage vers vos{" "}
              <span className="text-gold">ressources internes</span>
            </motion.h1>
            <motion.p
              className="mx-auto mb-8 max-w-3xl text-lg text-ivory/80 sm:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              L'hypnose thérapeutique est une porte ouverte vers votre
              inconscient, là où résident vos ressources les plus profondes.
              Dans un état de relaxation agréable, je vous accompagne pour
              libérer vos blocages et activer votre potentiel de transformation.
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
                    "appointment_request",
                    "button_click_hypnose_hero",
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
          aria-label="Présentation de l'hypnose thérapeutique"
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
            <h2 className="mb-8 font-display text-3xl font-semibold text-gold sm:text-4xl">
              Qu'est-ce que l'hypnose ?
            </h2>

            <p className="mb-6 text-lg leading-relaxed text-ivory/90">
              L'hypnose est un <strong>état naturel de conscience modifiée</strong> que
              vous expérimentez déjà au quotidien : lorsque vous êtes absorbé par un
              bon livre, perdu dans vos pensées pendant un trajet, ou captivé par un
              film. C'est cet état de « légère rêverie » que nous utilisons en séance
              pour accéder à vos ressources inconscientes.
            </p>

            <p className="mb-6 text-lg leading-relaxed text-ivory/90">
              Contrairement aux représentations spectaculaires souvent véhiculées,
              l'hypnose thérapeutique est une <strong>pratique douce et respectueuse</strong>.
              Vous ne dormez pas, vous restez conscient de ce qui se passe et vous
              gardez le contrôle à chaque instant.
            </p>

            <div className="my-8 rounded-r-lg border-l-4 border-gold/30 bg-gold/5 p-6">
              <p className="italic leading-relaxed text-ivory/80">
                "L'hypnose ne vous donne pas de nouveaux pouvoirs. Elle vous
                reconnecte à ceux que vous avez toujours eus, mais que vous aviez
                oubliés ou cessé d'utiliser."
              </p>
            </div>

            <p className="text-lg leading-relaxed text-ivory/90">
              En état hypnotique, votre inconscient devient plus accessible et
              réceptif. C'est lui qui gère vos automatismes, vos émotions et vos
              croyances profondes. En dialoguant avec lui, nous pouvons favoriser
              des changements durables et naturels.
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
            <h2 className="mb-8 font-display text-3xl font-semibold text-gold sm:text-4xl">
              L'hypnose peut vous aider si...
            </h2>

            <p className="mb-6 text-lg leading-relaxed text-ivory/90">
              L'hypnose thérapeutique est un outil polyvalent qui peut accompagner
              de nombreuses problématiques. Elle est particulièrement efficace pour :
            </p>

            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {[
                "Gérer le stress et l'anxiété au quotidien",
                "Dépasser des peurs ou des phobies",
                "Retrouver confiance en soi",
                "Améliorer la qualité du sommeil",
                "Se libérer d'habitudes indésirables",
                "Accompagner l'arrêt du tabac",
                "Soulager certaines douleurs chroniques",
                "Préparer un événement important (examen, entretien...)",
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex items-start gap-3 rounded-lg border border-ivory/10 bg-night/40 p-4"
                >
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-gold" />
                  <span className="text-ivory/80">{item}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-lg leading-relaxed text-ivory/90">
              L'hypnose ne remplace pas un traitement médical mais peut
              l'accompagner efficacement. En cas de doute, n'hésitez pas à
              consulter votre médecin au préalable.
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
            <h2 className="mb-8 font-display text-3xl font-semibold text-gold sm:text-4xl">
              L'hypnose ericksonienne
            </h2>

            <p className="mb-6 text-lg leading-relaxed text-ivory/90">
              Je pratique l'<strong>hypnose ericksonienne</strong>, une approche
              développée par le psychiatre américain Milton Erickson. Cette forme
              d'hypnose est particulièrement respectueuse et permissive : elle
              s'adapte à vous plutôt que de vous imposer un cadre rigide.
            </p>

            <p className="mb-6 text-lg leading-relaxed text-ivory/90">
              L'hypnose ericksonienne utilise le langage de manière subtile pour
              accompagner en douceur vers l'état hypnotique. Elle fait appel à vos
              propres ressources et respecte votre inconscient comme un allié
              bienveillant.
            </p>

            <div className="mb-8 space-y-4">
              {[
                {
                  title: "Une approche permissive",
                  description:
                    "Pas d'ordres ni d'injonctions. Je vous invite, je suggère, et votre inconscient choisit ce qu'il accepte.",
                },
                {
                  title: "Un travail sur mesure",
                  description:
                    "Chaque séance est unique et adaptée à votre personnalité, votre histoire et vos objectifs du moment.",
                },
                {
                  title: "L'utilisation de métaphores",
                  description:
                    "Les histoires et les images permettent de parler directement à l'inconscient, sans passer par le filtre du mental.",
                },
                {
                  title: "Le respect de votre rythme",
                  description:
                    "Vous progressez à votre propre cadence. Rien n'est forcé, tout se fait naturellement.",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="rounded-lg border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-6"
                >
                  <h3 className="mb-2 text-lg font-semibold text-ivory">
                    {item.title}
                  </h3>
                  <p className="text-ivory/70">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="my-8 rounded-lg border border-gold/20 bg-night/40 p-8">
              <p className="text-center text-xl font-light italic leading-relaxed text-gold/90">
                "Votre inconscient est infiniment plus intelligent que vous ne
                le pensez."
              </p>
              <p className="mt-4 text-center text-sm text-ivory/50">
                — Milton Erickson
              </p>
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
            <h2 className="mb-8 font-display text-3xl font-semibold text-gold sm:text-4xl">
              Comment se déroule une séance ?
            </h2>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-xl font-semibold text-gold">
                  1
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold text-ivory">
                    L'entretien préalable
                  </h3>
                  <p className="text-ivory/80">
                    Nous commençons par un temps d'échange pour comprendre ce qui
                    vous amène, définir votre objectif et répondre à vos questions.
                    C'est aussi l'occasion de démystifier l'hypnose si vous avez
                    des appréhensions.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-xl font-semibold text-gold">
                  2
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold text-ivory">
                    L'induction hypnotique
                  </h3>
                  <p className="text-ivory/80">
                    Confortablement installé, vous fermez les yeux et je vous
                    guide progressivement vers un état de relaxation profonde.
                    Ma voix vous accompagne tandis que vous vous détendez de plus
                    en plus.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-xl font-semibold text-gold">
                  3
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold text-ivory">
                    Le travail thérapeutique
                  </h3>
                  <p className="text-ivory/80">
                    Dans cet état agréable, nous travaillons sur votre
                    problématique à travers des suggestions, des métaphores ou
                    des visualisations. Votre inconscient intègre naturellement
                    ce qui est bon pour vous.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-xl font-semibold text-gold">
                  4
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold text-ivory">
                    Le retour à l'état ordinaire
                  </h3>
                  <p className="text-ivory/80">
                    Je vous ramène progressivement à l'état de veille. Vous vous
                    sentez généralement détendu, reposé, parfois un peu comme au
                    sortir d'un rêve agréable. Nous prenons un moment pour
                    échanger sur votre vécu.
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
            <h2 className="mb-8 font-display text-3xl font-semibold text-gold sm:text-4xl">
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
                  className="overflow-hidden rounded-lg border border-ivory/10 bg-night/40"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-night/60"
                  >
                    <span className="text-lg font-medium text-ivory">
                      {item.question}
                    </span>
                    <span
                      className={`ml-4 text-gold transition-transform ${
                        openFaq === index ? "rotate-180" : ""
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
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-ivory/10 px-6 py-4"
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
            <div className="rounded-lg bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 p-8 text-center">
              <h2 className="mb-4 font-display text-2xl font-semibold text-ivory sm:text-3xl">
                Prêt à découvrir l'hypnose ?
              </h2>
              <p className="mb-6 text-ivory/70">
                La première séance est l'occasion de faire connaissance et de
                découvrir l'hypnose en toute sécurité.
              </p>
              <CTAButton
                variant="primary"
                href="/demande-rendez-vous"
                onTrack={() =>
                  trackConversionEvent(
                    "appointment_request",
                    "button_click_hypnose_cta_middle",
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
            <h2 className="mb-4 font-display text-3xl font-semibold text-gold sm:text-4xl">
              Pour aller plus loin
            </h2>
            <p className="mb-8 text-lg text-ivory/70">
              Découvrez mes articles pour mieux comprendre l'hypnose et
              ce qu'elle peut vous apporter.
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
          <h2 className="mb-6 font-display text-3xl font-semibold text-ivory">
            Activez vos ressources
          </h2>
          <p className="mb-8 text-lg text-ivory/80">
            Que vous souhaitiez vous libérer d'un blocage, retrouver confiance
            ou simplement explorer votre monde intérieur, l'hypnose peut vous y
            aider.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <CTAButton
              variant="primary"
              href="/demande-rendez-vous"
              onTrack={() =>
                trackConversionEvent(
                  "appointment_request",
                  "button_click_hypnose_cta_final",
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
      <footer className="border-t border-ivory/10 bg-night/80 px-6 py-10 text-center text-xs text-ivory/50 sm:px-10 lg:px-16">
        <CurrentYear /> Psypnos. Tous droits réservés.
        <Link href="/blog" className="ml-4 text-ivory/60 hover:text-gold">
          Blog
        </Link>
        <Link
          href="/mentions-legales"
          className="ml-4 text-ivory/60 hover:text-gold"
        >
          Mentions légales
        </Link>
        <Link href="/admin" className="ml-4 text-ivory/60 hover:text-gold">
          Accès privé
        </Link>
      </footer>
    </div>
  );
}
