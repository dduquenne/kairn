"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { CTAButton } from "../../components/CTAButton";
import { GlobalHeader } from "../../components/GlobalHeader";

/**
 * Client Component - Contenu biographique de David Duquenne
 * Une narration introspective et inspirante de son parcours personnel et professionnel
 * Optimisée pour le SEO et l'impact éditorial
 */
export function AProposContent() {

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-night via-night/95 to-night text-ivory">
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
            src="/images/a-propos.webp"
            alt="Un chemin vers l'essentiel"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Overlay pour lisibilité du texte */}
          <div className="absolute inset-0 bg-gradient-to-b from-night/75 via-night/90 to-night/95" />
        </div>

        {/* Gradient glow effects */}
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
            {/* Title */}
            <motion.h1
              className="mb-6 text-4xl font-semibold text-ivory sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Un chemin vers <span className="text-gold">l'essentiel</span>
            </motion.h1>
            <motion.p
              className="mb-8 text-lg text-ivory/80 sm:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              De l'angoisse existentielle à l'accompagnement thérapeutique :
              l'histoire d'une transformation profonde au service des autres.
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
              >
                Prendre rendez-vous
              </CTAButton>
              <CTAButton
                variant="secondary"
                href="/blog"
              >
                Lire mes articles
              </CTAButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Biography Content */}
      <main className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
        <article itemScope itemType="https://schema.org/Article" aria-label="Biographie de David Duquenne">
        {/* Introduction */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Je m'appelle <strong>David Duquenne</strong>.
          </p>
          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Je suis thérapeute spécialisé en psychothérapie et en hypnose ericksonienne.
            J'accompagne des personnes traversant une souffrance psychologique,
            une crise existentielle, une perte de sens, un burn-out ou une période
            de profonde remise en question.
          </p>
          <p className="text-lg leading-relaxed text-ivory/90">
            Mon approche s'inscrit dans une psychothérapie transpersonnelle,
            intégrative et incarnée, qui prend en compte l'ensemble de l'expérience
            humaine : psychique, émotionnelle, corporelle et existentielle.
          </p>
        </motion.section>

        {/* Section 1: Premiers souvenirs et peur de la mort */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="mb-8 text-3xl font-semibold text-gold sm:text-4xl">
            L'empreinte des premiers pas
          </h2>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Je suis né en 1967. Mon plus ancien souvenir conscient remonte aux
            premiers pas de l'Homme sur la Lune. J'avais alors à peine deux ans.
            Je me souviens très clairement de mon père venant me chercher dans
            mon lit, au milieu de la nuit, pour me déposer sur le canapé devant
            la télévision. L'image était en noir et blanc. Je ne comprenais pas
            ce que je voyais.
          </p>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            En revanche, je me souviens très clairement de <strong>l'atmosphère
            dans la pièce</strong> : la tension, l'enthousiasme, quelque chose
            d'important en train de se jouer. Même sans en saisir le sens,
            je sentais que cet instant comptait.
          </p>

          <div className="my-8 border-l-4 border-gold/30 bg-gold/5 p-6 rounded-r-lg">
            <p className="italic text-ivory/80 leading-relaxed">
              Avec le recul, j'ai le sentiment que ce souvenir s'est inscrit
              profondément en moi. Comme une empreinte silencieuse, un appel
              à <strong>aller toujours un peu plus loin</strong>, à rester relié
              à cet élan, à ne pas gâcher cette vie qui m'était donnée.
            </p>
          </div>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Depuis l'enfance, j'ai vécu avec une <strong>peur panique de la
            mort</strong>, envahissante et difficile à partager. Cette angoisse
            archaïque a profondément influencé mon rapport à la vie, au temps
            et au sens de l'existence.
          </p>

          <p className="text-lg leading-relaxed text-ivory/90">
            Ma scolarité a été chaotique, marquée par le décrochage et
            l'incompréhension, jusqu'à la découverte de l'informatique,
            qui m'a permis de reprendre pied. J'ai poursuivi des études en BTS,
            puis en école d'ingénieur, avant de travailler plus de vingt ans
            dans le domaine de l'informatique.
          </p>
        </motion.section>

        {/* Section 2: Burn-out et effondrement */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="mb-8 text-3xl font-semibold text-gold sm:text-4xl">
            L'effondrement comme révélation
          </h2>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            En 1999, j'ai traversé un <strong>burn-out profond</strong>.
            À un moment critique, j'ai réellement cru que j'étais en train de mourir,
            de vivre mes dernières minutes. Cette expérience, extrêmement traumatisante,
            m'a confronté à un bilan de vie que j'ai jugé insuffisant.
          </p>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Malgré la violence de cette traversée, elle a marqué le début d'un
            <strong> renouveau intérieur</strong>, fondé non sur des croyances,
            mais sur une nécessité vitale : <strong>redonner du sens à ma vie</strong>.
          </p>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Les années suivantes ont été marquées par une perte de sens,
            un isolement progressif et un stress professionnel intense,
            notamment après le rachat de l'entreprise dans laquelle je travaillais.
            J'ai été licencié en 2013, trois ans plus tard, une nouvelle épreuve à
            traverser,une renaissance à vivre.
          </p>

          <div className="my-8 rounded-lg bg-night/40 p-8 border border-gold/20">
            <p className="text-xl text-center font-light italic text-gold/90 leading-relaxed">
              "Le changement commence là où nous osons reconnaître ce qui ne va plus."
            </p>
          </div>

        </motion.section>

        {/* Section 3: Expériences de conscience et intégration */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="mb-8 text-3xl font-semibold text-gold sm:text-4xl">
            Ouvertures et nuit noire
          </h2>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            C'est durant cette période qu'a eu lieu une <strong>expérience de
            conscience majeure</strong>, déclenchée par l'écoute d'un enseignement
            d'Eckhart Tolle. Cette expérience n'avait rien de religieux :
            elle m'a pourtant confronté, de manière directe, à la question du sens de
            l'existence et de la place que j'occupais dans ma propre vie.
          </p>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Cette ouverture a été suivie d'une phase difficile, souvent décrite
            comme une <strong>nuit noire de l'âme</strong>, révélant la nécessité d'un
            véritable travail d'intégration.
          </p>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            La rencontre avec la <strong>respiration holotropique</strong> et
            la <strong>psychothérapie transpersonnelle</strong> a été décisive.
            Elle m'a permis de transformer en profondeur mon rapport à la mort,
            à la souffrance et à la vie, en redonnant une cohérence à ce qui
            avait été vécu.
          </p>

          <p className="text-lg leading-relaxed text-ivory/90">
            Plusieurs années plus tard, c'est grâce à l'<strong>hypnose
            ericksonienne</strong> que j'ai pu intégrer durablement ces expériences.
            C'est pourquoi j'ai choisi de me former à cette approche, que je considère
            aujourd'hui comme un <strong>outil thérapeutique aussi puissant et
            complémentaire que la respiration holotropique</strong>, au service
            du sens et de l'apaisement.
          </p>
        </motion.section>

        {/* Section 4: JALMAV et finitude */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="mb-8 text-3xl font-semibold text-gold sm:text-4xl">
            La présence auprès de la finitude
          </h2>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Ce chemin m'a conduit à rejoindre l'association <strong>JALMAV</strong>,
            où j'ai accompagné bénévolement des personnes en fin de vie en soins
            palliatifs, notamment pendant la crise du COVID.
          </p>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Ces expériences ont renforcé une conviction profonde : le sens d'une
            vie ne se mesure pas à ce que l'on possède ou accomplit, mais à
            <strong> la qualité du lien</strong>, de la présence et de l'attention
            portée aux autres.
          </p>

          <div className="my-8 border-l-4 border-gold/30 bg-gold/5 p-6 rounded-r-lg">
            <p className="italic text-ivory/80 leading-relaxed">
              Dans l'accompagnement de la fin de vie, j'ai appris que la vraie
              richesse d'une existence ne réside ni dans les accomplissements
              ni dans les possessions, mais dans l'authenticité des liens tissés
              et la profondeur de la présence offerte.
            </p>
          </div>
        </motion.section>

        {/* Section 5: Approche thérapeutique */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="mb-8 text-3xl font-semibold text-gold sm:text-4xl">
            Une approche existentielle et incarnée
          </h2>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Je crois que nous sommes des <strong>personnes ordinaires confrontées
            à des expériences de vie parfois extraordinaires</strong> : crise,
            perte, rupture, confrontation à la finitude.
          </p>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Ces expériences n'ont de valeur que si elles sont <strong>intégrées
            dans la vie quotidienne</strong>, traduites en choix plus justes,
            en relations plus authentiques, en une vie plus apaisée.
          </p>

          <p className="text-lg leading-relaxed text-ivory/90">
            Mon approche ne vise ni l'évasion du réel ni une quête idéalisée.
            Elle vise une <strong>recherche de sens profonde</strong>, incarnée,
            au service d'une vie plus consciente, plus stable et plus reliée aux autres.
          </p>

          <div className="my-8 rounded-lg bg-night/40 p-8 border border-gold/20">
            <p className="text-xl text-center font-light italic text-gold/90 leading-relaxed">
              "Ne rêve pas ta vie, vis tes rêves."
            </p>
          </div>

        </motion.section>


        {/* Section 6: Psypnos */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="mb-8 text-3xl font-semibold text-gold sm:text-4xl">
            Psypnos : un lieu, un passage
          </h2>

          <p className="mb-6 text-lg leading-relaxed text-ivory/90">
            Avec ma femme Nathalie, nous avons créé un lieu en Bourgogne, à
            <strong> Saint-Julien-du-Sault</strong>, dédié à l'accompagnement
            des passages de vie : psychothérapies individuelles, thérapies de groupe, stages résidentiels,
            respiration holotropique.
          </p>

          <p className="mb-8 text-lg leading-relaxed text-ivory/90">
            À travers <strong>Psypnos</strong>, j'accompagne celles et ceux
            qui sentent que quelque chose doit changer, sans forcément savoir
            encore comment.
          </p>

          <div className="rounded-lg bg-gradient-to-br from-gold/10 to-gold/5 p-8 border border-gold/20">
            <p className="mb-4 text-center text-xl font-bold text-gold">
              APPRECIEZ VOTRE VIE !
            </p>
          </div>
        </motion.section>

        {/* CTA Final */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-6 text-3xl font-semibold text-ivory">
            Prêt à commencer votre chemin ?
          </h2>
          <p className="mb-8 text-lg text-ivory/80">
            Que vous traversiez une crise, une transition ou une simple
            recherche de sens, je suis là pour vous accompagner.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <CTAButton
              variant="primary"
              href="/demande-rendez-vous"
            >
              Prendre rendez-vous
            </CTAButton>
            <CTAButton
              variant="secondary"
              href="/inscription-seminaire"
            >
              Découvrir nos séminaires
            </CTAButton>
          </div>
        </motion.section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-ivory/10 bg-night/80 px-6 py-10 text-center text-xs text-ivory/50 sm:px-10 lg:px-16">
        {new Date().getFullYear()} Psypnos. Tous droits réservés.
        <Link
          href="/blog"
          className="ml-4 text-ivory/60 hover:text-gold"
        >
          Blog
        </Link>
        <Link
          href="/conditions-utilisation"
          className="ml-4 text-ivory/60 hover:text-gold"
        >
          Conditions
        </Link>
        <Link
          href="/admin"
          className="ml-4 text-ivory/60 hover:text-gold"
        >
          Accès privé
        </Link>
      </footer>
    </div>
  );
}
