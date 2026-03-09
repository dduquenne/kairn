import type { Metadata } from 'next';
import Link from 'next/link';

import { NavigationMenu } from '../../components/NavigationMenu';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description:
    'Découvrez comment Appréciez Votre Vie collecte, utilise et protège vos données personnelles conformément au RGPD. Transparence et confidentialité garanties.',
  openGraph: {
    title: 'Politique de Confidentialité | Appréciez Votre Vie',
    description:
      'Consultez notre politique de confidentialité pour comprendre comment nous protégeons vos données personnelles en conformité avec le RGPD.',
    url: 'https://appreciezvotrevie.fr/politique-de-confidentialite',
    type: 'website',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/politique-de-confidentialite',
  },
};

const lastUpdatedLabel = '7 novembre 2025';

const sections = [
  {
    title: '1. Identité du responsable du traitement',
    content: (
      <div className="text-ivory/80 space-y-3">
        <p>
          <span className="text-ivory font-semibold">Responsable du traitement :</span>
          <br />
          Nathalie Duquenne – Appréciez Votre Vie
          <br />
          Le Moulin d'en Bas
          <br />
          Saint-Julien-du-Sault (Yonne, France)
          <br />
          <Link
            href="mailto:dduquenne@appreciezvotrevie.fr"
            className="text-gold hover:text-gold/80 focus:ring-gold/60 focus:ring-offset-night transition focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            dduquenne@appreciezvotrevie.fr
          </Link>
        </p>
        <p>SIREN : 921 595948</p>
      </div>
    ),
  },
  {
    title: '2. Données collectées',
    content: (
      <div className="text-ivory/80 space-y-6">
        <p>
          Les données collectées varient selon le type d’activité : sophrologie ou somatothérapie
          individuelle, stages ou séminaires de breathwork & rebirth, formulaires de contact et
          de rendez-vous.
        </p>
        <div className="space-y-4">
          <h3 className="text-ivory text-lg font-semibold">2.1 Données collectées via le site</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              'Nom, prénom',
              'Adresse e-mail',
              'Numéro de téléphone',
              'Préférence de contact',
              'Motif de la demande',
              'Disponibilités',
              'Source de connaissance du site',
              'Consentement à la politique de confidentialité',
            ].map(item => (
              <li key={item} className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <h3 className="text-ivory text-lg font-semibold">
            2.2 Données collectées pour les séminaires de breathwork & rebirth
          </h3>
          <p>
            Afin d’assurer la sécurité des participants, un questionnaire médical confidentiel est
            demandé avant toute inscription définitive. Ce questionnaire peut contenir des données
            de santé sensibles, telles que :
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              'Antécédents médicaux ou psychiatriques',
              'Traitements médicamenteux en cours',
              'Pathologies cardio-respiratoires ou neurologiques',
              'Grossesse ou contre-indications à la breathwork & rebirth',
            ].map(item => (
              <li key={item} className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
          <p>
            Ces données sont strictement limitées à l’évaluation de la compatibilité avec la
            pratique proposée et ne sont ni partagées ni utilisées à d’autres fins.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: '3. Finalité du traitement',
    content: (
      <div className="text-ivory/80 space-y-4">
        <p>Les données collectées servent exclusivement à :</p>
        <ul className="space-y-2">
          {[
            'Gérer les demandes de rendez-vous et les contacts',
            'Organiser les séances de thérapie, d’somatothérapie ou de breathwork & rebirth',
            'Évaluer les contre-indications médicales éventuelles (questionnaire santé)',
            'Gérer l’inscription, la facturation et la logistique des séminaires',
            'Assurer le suivi administratif et comptable',
            'Communiquer des informations relatives à l’activité, uniquement avec le consentement explicite de la personne',
          ].map(item => (
            <li key={item} className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
        <p>
          Aucune donnée n’est utilisée à des fins commerciales, publicitaires ou statistiques sans
          consentement.
        </p>
      </div>
    ),
  },
  {
    title: '4. Base légale du traitement',
    content: (
      <div className="text-ivory/80 space-y-3">
        <p>Les traitements reposent sur :</p>
        <ul className="space-y-2">
          {[
            'Le consentement explicite du participant (article 6.1.a du RGPD)',
            'L’exécution d’un contrat ou d’une démarche précontractuelle (article 6.1.b)',
            'Pour le questionnaire médical : l’article 9.2.h du RGPD (traitement de données de santé nécessaire à la médecine préventive ou à la sécurité de la personne concernée, sous la responsabilité d’un professionnel soumis au secret)',
          ].map(item => (
            <li key={item} className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: '5. Conservation des données',
    content: (
      <div className="text-ivory/80 space-y-3">
        <ul className="space-y-2">
          <li className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
            <span className="text-ivory font-semibold">Données de contact et d’inscription :</span>{' '}
            conservées 12 mois après la dernière interaction sans suite, ou 5 ans après la dernière
            séance ou participation.
          </li>
          <li className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
            <span className="text-ivory font-semibold">Questionnaires médicaux :</span> conservés de
            manière confidentielle, séparément des autres données administratives, pendant la durée
            du stage uniquement, puis supprimés sous 30 jours après l’événement, sauf demande
            explicite de conservation.
          </li>
          <li className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
            <span className="text-ivory font-semibold">Comptabilité :</span> conservée 10 ans
            conformément aux obligations légales.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: '6. Sécurité des données',
    content: (
      <div className="text-ivory/80 space-y-3">
        <p>Appréciez Votre Vie met en œuvre des mesures de sécurité techniques et organisationnelles :</p>
        <ul className="space-y-2">
          {[
            'Chiffrement SSL/TLS du site et des communications',
            'Accès restreint aux seules personnes autorisées',
            'Stockage local sécurisé des questionnaires médicaux (accès protégé, non partagé)',
            'Aucun envoi de données sensibles par e-mail non chiffré',
            'Sauvegardes protégées et mots de passe robustes',
            'Aucune donnée n’est transférée hors de l’Union Européenne',
          ].map(item => (
            <li key={item} className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: '7. Sous-traitants et hébergement',
    content: (
      <div className="text-ivory/80 space-y-3">
        <p>Les services externes suivants peuvent être utilisés :</p>
        <ul className="space-y-2">
          {[
            'Hébergement web : Gandi.net (France / UE)',
            'Site web : WordPress (hébergement conforme RGPD)',
            'Formulaires et e-mails : système sécurisé intégré (plugin ou SMTP protégé)',
            'Paiements / facturation : [à préciser si applicable – ex. Stripe, HelloAsso, etc.]',
            'Visioconférence (le cas échéant) : Zoom ou équivalent, selon le consentement du client',
          ].map(item => (
            <li key={item} className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
        <p>
          Chaque prestataire est contractuellement tenu de respecter la confidentialité et la
          sécurité des données selon les exigences du RGPD.
        </p>
      </div>
    ),
  },
  {
    title: '8. Droits des personnes concernées',
    content: (
      <div className="text-ivory/80 space-y-4">
        <p>Conformément au RGPD, toute personne dispose des droits suivants :</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            'Droit d’accès à ses données',
            'Droit de rectification',
            'Droit à l’effacement (« droit à l’oubli »)',
            'Droit de limitation du traitement',
            'Droit d’opposition',
            'Droit à la portabilité des données',
          ].map(item => (
            <li key={item} className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
        <p>
          Ces droits peuvent être exercés à tout moment par simple demande à {''}
          <Link
            href="mailto:dduquenne@appreciezvotrevie.fr"
            className="text-gold hover:text-gold/80 focus:ring-gold/60 focus:ring-offset-night transition focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            dduquenne@appreciezvotrevie.fr
          </Link>
          . Une réponse sera apportée sous un délai maximal de 30 jours. En cas de doute raisonnable
          sur l’identité, un justificatif pourra être demandé.
        </p>
      </div>
    ),
  },
  {
    title: '9. Confidentialité professionnelle',
    content: (
      <p className="text-ivory/80">
        Les informations partagées lors des séances ou dans le cadre du questionnaire médical sont
        strictement confidentielles et couvertes par le secret professionnel. Aucune donnée
        médicale, témoignage ou contenu de séance n’est conservé ni communiqué sans le consentement
        explicite du client.
      </p>
    ),
  },
  {
    title: '10. Cookies',
    content: (
      <div className="text-ivory/80 space-y-3">
        <p>Le site appreciezvotrevie.fr utilise uniquement :</p>
        <ul className="space-y-2">
          {[
            'Des cookies essentiels au fonctionnement du site',
            'Le cas échéant, des cookies de mesure d’audience anonymisés (ex. Matomo)',
            'Aucun cookie publicitaire ou traceur tiers sans consentement préalable',
          ].map(item => (
            <li key={item} className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    title: '11. Durée de validité et modification',
    content: (
      <p className="text-ivory/80">
        Cette politique peut être mise à jour à tout moment pour s’adapter aux évolutions légales,
        techniques ou organisationnelles. La version en vigueur est celle affichée sur le site à la
        date de consultation.
      </p>
    ),
  },
  {
    title: '12. Réclamation',
    content: (
      <div className="text-ivory/80 space-y-3">
        <p>
          En cas de désaccord sur la gestion de vos données, vous pouvez contacter le responsable du
          traitement à {''}
          <Link
            href="mailto:dduquenne@appreciezvotrevie.fr"
            className="text-gold hover:text-gold/80 focus:ring-gold/60 focus:ring-offset-night transition focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            dduquenne@appreciezvotrevie.fr
          </Link>
          .
        </p>
        <p>
          Il est également possible d’adresser une réclamation à la CNIL : {''}
          <Link
            href="https://www.cnil.fr"
            target="_blank"
            rel="noreferrer noopener"
            className="text-gold hover:text-gold/80 underline underline-offset-4 transition"
          >
            https://www.cnil.fr
          </Link>
          .
        </p>
      </div>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <NavigationMenu forceVisible />
      <main className="from-night via-night/95 to-night min-h-screen bg-gradient-to-b px-6 pb-12 pt-24 sm:px-10 lg:px-16">
        <article className="border-ivory/10 bg-night/60 shadow-night/40 mx-auto max-w-4xl space-y-16 rounded-3xl border p-10 shadow-xl">
          <header className="space-y-6 text-center">
            <p className="text-gold/80 text-sm uppercase tracking-[0.3em]">Appréciez Votre Vie</p>
            <h1 className="text-ivory text-3xl font-semibold sm:text-4xl">
              Politique de confidentialité
            </h1>
            <p className="text-ivory/60 text-sm">Dernière mise à jour : {lastUpdatedLabel}</p>
            <p className="text-ivory/80 text-base">
              Cette page explique de manière transparente comment vos données personnelles sont
              collectées, utilisées et protégées dans le cadre des services proposés par Appréciez Votre Vie, en
              conformité avec le RGPD et la loi Informatique et Libertés.
            </p>
          </header>

          <div className="space-y-12">
            {sections.map(section => (
              <section key={section.title} className="space-y-6">
                <h2 className="text-ivory text-2xl font-semibold">{section.title}</h2>
                <div className="text-ivory/80 space-y-4 text-base leading-relaxed">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}
