import type { Metadata } from 'next';
import Link from 'next/link';

import { CurrentYear } from '../../components/CurrentYear';
import { NavigationMenu } from '../../components/NavigationMenu';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: "Conditions d'Utilisation",
  description:
    "Conditions générales d'utilisation du site Appréciez Votre Vie. Règles d'utilisation, responsabilités et droits relatifs à l'utilisation de nos services.",
  openGraph: {
    title: "Conditions d'Utilisation | Appréciez Votre Vie",
    description: "Conditions générales d'utilisation du site et des services Appréciez Votre Vie.",
    url: 'https://appreciezvotrevie.fr/conditions-utilisation',
    type: 'website',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/conditions-utilisation',
  },
};

const lastUpdatedLabel = '8 janvier 2026';

export default function TermsOfServicePage() {
  return (
    <>
      <NavigationMenu forceVisible />
      <main className="from-night via-night/95 to-night min-h-screen bg-gradient-to-b px-6 pb-12 pt-24 sm:px-10 lg:px-16">
        <article className="border-ivory/10 bg-night/60 shadow-night/40 mx-auto max-w-4xl space-y-12 rounded-3xl border p-10 shadow-xl">
          <header className="space-y-6 text-center">
            <p className="text-gold/80 text-sm uppercase tracking-[0.3em]">Appréciez Votre Vie</p>
            <h1 className="text-ivory text-3xl font-semibold sm:text-4xl">
              Conditions d'Utilisation
            </h1>
            <p className="text-ivory/60 text-sm">Dernière mise à jour : {lastUpdatedLabel}</p>
          </header>

          <div className="space-y-10">
            {/* Introduction */}
            <section className="space-y-4">
              <p className="text-ivory/80 text-base leading-relaxed">
                Bienvenue sur Appréciez Votre Vie. En accédant à ce site web et en utilisant nos services, vous
                acceptez d'être lié par les présentes conditions d'utilisation. Veuillez les lire
                attentivement avant d'utiliser notre site.
              </p>
            </section>

            {/* Définitions */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">1. Définitions</h2>
              <div className="text-ivory/80 space-y-3">
                <ul className="space-y-2">
                  <li className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
                    <span className="text-ivory font-semibold">"Site"</span> désigne le site web
                    appreciezvotrevie.fr et l'ensemble de ses pages et fonctionnalités.
                  </li>
                  <li className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
                    <span className="text-ivory font-semibold">"Services"</span> désigne l'ensemble
                    des services proposés par Appréciez Votre Vie, incluant les fonctionnalités du site, les
                    publications sur les réseaux sociaux et les communications associées.
                  </li>
                  <li className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
                    <span className="text-ivory font-semibold">"Utilisateur"</span> désigne toute
                    personne qui accède au Site ou utilise les Services.
                  </li>
                  <li className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3">
                    <span className="text-ivory font-semibold">"Contenu"</span> désigne tout texte,
                    image, vidéo ou autre matériel publié sur le Site ou via les Services.
                  </li>
                </ul>
              </div>
            </section>

            {/* Acceptation des conditions */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">2. Acceptation des conditions</h2>
              <div className="text-ivory/80 space-y-3">
                <p>
                  En utilisant ce Site ou nos Services, vous confirmez avoir lu, compris et accepté
                  les présentes Conditions d'Utilisation ainsi que notre{' '}
                  <Link
                    href="/politique-de-confidentialite"
                    className="text-gold hover:text-gold/80 focus:ring-gold/60 focus:ring-offset-night transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                  >
                    Politique de Confidentialité
                  </Link>
                  . Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre Site ni
                  nos Services.
                </p>
              </div>
            </section>

            {/* Utilisation du site */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">3. Utilisation du Site</h2>
              <div className="text-ivory/80 space-y-4">
                <p>En utilisant ce Site, vous vous engagez à :</p>
                <ul className="space-y-2">
                  {[
                    'Utiliser le Site uniquement à des fins légales et conformes aux présentes conditions',
                    "Ne pas tenter d'accéder de manière non autorisée à des parties sécurisées du Site",
                    "Ne pas utiliser le Site d'une manière qui pourrait l'endommager ou en affecter les performances",
                    "Ne pas collecter ou récolter des informations personnelles d'autres utilisateurs",
                    'Ne pas utiliser de robots, scrapers ou autres moyens automatisés pour accéder au Site',
                  ].map(item => (
                    <li
                      key={item}
                      className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Intégration réseaux sociaux */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">
                4. Intégration avec les réseaux sociaux
              </h2>
              <div className="text-ivory/80 space-y-4">
                <p>
                  Nos Services peuvent inclure des fonctionnalités d'intégration avec des
                  plateformes de réseaux sociaux telles que Facebook, Instagram et LinkedIn.
                </p>
                <h3 className="text-ivory text-lg font-semibold">
                  4.1 Autorisation de publication
                </h3>
                <p>
                  En connectant votre compte de réseau social à nos Services, vous nous autorisez à
                  publier du contenu sur vos pages ou profils selon les permissions que vous avez
                  accordées. Vous pouvez révoquer ces autorisations à tout moment.
                </p>
                <h3 className="text-ivory text-lg font-semibold">4.2 Responsabilité du contenu</h3>
                <p>
                  Vous restez responsable de tout contenu publié via nos Services sur vos comptes de
                  réseaux sociaux. Assurez-vous que le contenu respecte les conditions d'utilisation
                  des plateformes concernées.
                </p>
                <h3 className="text-ivory text-lg font-semibold">4.3 Conditions des tiers</h3>
                <p>
                  L'utilisation des fonctionnalités de réseaux sociaux est également soumise aux
                  conditions d'utilisation et politiques de confidentialité des plateformes tierces
                  (Facebook, Instagram, LinkedIn, etc.).
                </p>
              </div>
            </section>

            {/* Propriété intellectuelle */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">5. Propriété intellectuelle</h2>
              <div className="text-ivory/80 space-y-4">
                <p>
                  Le Site et son contenu original (textes, graphiques, logos, images, et logiciels)
                  sont la propriété de Appréciez Votre Vie et sont protégés par les lois françaises et
                  internationales sur la propriété intellectuelle.
                </p>
                <ul className="space-y-2">
                  {[
                    'Vous ne pouvez pas copier, modifier ou distribuer le contenu du Site sans autorisation écrite',
                    'Les marques, logos et noms commerciaux affichés sont la propriété de leurs détenteurs respectifs',
                    'Toute utilisation non autorisée peut donner lieu à des poursuites judiciaires',
                  ].map(item => (
                    <li
                      key={item}
                      className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Limitation de responsabilité */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">6. Limitation de responsabilité</h2>
              <div className="text-ivory/80 space-y-4">
                <p>Dans les limites autorisées par la loi applicable :</p>
                <ul className="space-y-2">
                  {[
                    'Le Site est fourni "tel quel" sans garantie d\'aucune sorte',
                    'Appréciez Votre Vie ne garantit pas que le Site sera disponible de manière ininterrompue ou sans erreur',
                    "Appréciez Votre Vie n'est pas responsable des dommages indirects résultant de l'utilisation du Site",
                    'La responsabilité totale de Appréciez Votre Vie est limitée au montant que vous avez payé pour les Services',
                  ].map(item => (
                    <li
                      key={item}
                      className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Indemnisation */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">7. Indemnisation</h2>
              <div className="text-ivory/80 space-y-3">
                <p>
                  Vous acceptez d'indemniser et de dégager de toute responsabilité Appréciez Votre Vie contre
                  toute réclamation, dommage, perte et dépense (y compris les frais juridiques)
                  résultant de votre violation des présentes Conditions d'Utilisation ou de votre
                  utilisation des Services.
                </p>
              </div>
            </section>

            {/* Liens externes */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">8. Liens externes</h2>
              <div className="text-ivory/80 space-y-3">
                <p>
                  Le Site peut contenir des liens vers des sites web tiers. Ces liens sont fournis à
                  titre informatif uniquement. Appréciez Votre Vie n'a aucun contrôle sur le contenu de ces
                  sites et n'assume aucune responsabilité quant à leur contenu ou leurs pratiques de
                  confidentialité.
                </p>
              </div>
            </section>

            {/* Résiliation */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">9. Résiliation</h2>
              <div className="text-ivory/80 space-y-3">
                <p>
                  Appréciez Votre Vie se réserve le droit de suspendre ou de résilier votre accès aux Services à
                  tout moment, sans préavis, en cas de violation des présentes Conditions
                  d'Utilisation. Vous pouvez également cesser d'utiliser les Services à tout moment.
                </p>
              </div>
            </section>

            {/* Modifications */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">
                10. Modifications des conditions
              </h2>
              <div className="text-ivory/80 space-y-3">
                <p>
                  Appréciez Votre Vie se réserve le droit de modifier les présentes Conditions d'Utilisation à
                  tout moment. Les modifications prennent effet dès leur publication sur le Site.
                  Votre utilisation continue des Services après la publication des modifications
                  constitue votre acceptation des nouvelles conditions.
                </p>
              </div>
            </section>

            {/* Droit applicable */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">11. Droit applicable</h2>
              <div className="text-ivory/80 space-y-3">
                <p>
                  Les présentes Conditions d'Utilisation sont régies par le droit français. Tout
                  litige relatif à leur interprétation ou à leur exécution relève de la compétence
                  exclusive des tribunaux français.
                </p>
              </div>
            </section>

            {/* Divisibilité */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">12. Divisibilité</h2>
              <div className="text-ivory/80 space-y-3">
                <p>
                  Si une disposition des présentes Conditions d'Utilisation est jugée invalide ou
                  inapplicable, les autres dispositions resteront pleinement en vigueur.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-4">
              <h2 className="text-ivory text-2xl font-semibold">13. Contact</h2>
              <div className="text-ivory/80 space-y-3">
                <p>
                  Pour toute question concernant ces Conditions d'Utilisation, veuillez nous
                  contacter :
                </p>
                <div className="border-ivory/10 bg-night/60 rounded-xl border px-4 py-4">
                  <p>
                    <span className="text-ivory font-semibold">Appréciez Votre Vie</span>
                    <br />
                    Nathalie Duquenne
                    <br />
                    Le Moulin d'en Bas
                    <br />
                    Saint-Julien-du-Sault, 89330, France
                    <br />
                    E-mail :{' '}
                    <Link
                      href="mailto:dduquenne@appreciezvotrevie.fr"
                      className="text-gold hover:text-gold/80 focus:ring-gold/60 focus:ring-offset-night transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                    >
                      dduquenne@appreciezvotrevie.fr
                    </Link>
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className="border-ivory/10 border-t pt-8 text-center">
            <p className="text-ivory/60 text-sm">
              © <CurrentYear /> Appréciez Votre Vie - Tous droits réservés
            </p>
            <p className="text-ivory/60 mt-2 text-sm">
              <Link
                href="/politique-de-confidentialite"
                className="text-gold hover:text-gold/80 transition"
              >
                Politique de confidentialité
              </Link>
            </p>
          </footer>
        </article>
      </main>
    </>
  );
}
