import { siteConfig } from '@/config/site.config';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-secondary text-background">
        <div className="container-site text-center">
          {/* Decorative gold line */}
          <div className="gold-line mx-auto mb-8" />

          {/* Main title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-semibold mb-6 text-background">
            <span className="text-gold-gradient">{siteConfig.name}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl mx-auto">
            {siteConfig.practitioner.title}
          </p>

          {/* Practitioner name */}
          <p className="text-lg text-gold mb-8">
            {siteConfig.practitioner.name}
          </p>

          {/* Specialties */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {siteConfig.practitioner.specialties.map((specialty) => (
              <span
                key={specialty}
                className="px-4 py-2 border border-gold/30 text-gold text-sm rounded-full"
              >
                {specialty}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="btn btn-primary">
              Prendre rendez-vous
            </a>
            <a href="/therapies" className="btn btn-outline">
              Découvrir les thérapies
            </a>
          </div>
        </div>

        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c7a962' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </section>

      {/* About Section */}
      <section className="section-padding bg-background">
        <div className="container-site">
          <div className="max-w-3xl mx-auto text-center">
            <div className="gold-line mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-heading text-secondary mb-6">
              Bienvenue
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              {siteConfig.practitioner.bio}
            </p>
            <a href="/a-propos" className="link text-lg">
              En savoir plus &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-muted/50">
        <div className="container-site">
          <div className="text-center mb-12">
            <div className="gold-line mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-heading text-secondary">
              Approches thérapeutiques
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Psychothérapie */}
            <article className="card p-6">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-heading text-secondary mb-3">
                Psychothérapie
              </h3>
              <p className="text-gray-600 mb-4">
                Un accompagnement personnalisé pour explorer vos difficultés et
                développer vos ressources intérieures.
              </p>
              <a href="/therapies/psychotherapie" className="link">
                En savoir plus &rarr;
              </a>
            </article>

            {/* Hypnose */}
            <article className="card p-6">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-heading text-secondary mb-3">
                Hypnose Ericksonienne
              </h3>
              <p className="text-gray-600 mb-4">
                Accédez à vos ressources inconscientes pour faciliter le
                changement et atteindre vos objectifs.
              </p>
              <a href="/therapies/hypnose" className="link">
                En savoir plus &rarr;
              </a>
            </article>

            {/* Respiration Holotropique */}
            <article className="card p-6">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-heading text-secondary mb-3">
                Respiration Holotropique
              </h3>
              <p className="text-gray-600 mb-4">
                Une technique puissante de respiration pour explorer les états
                modifiés de conscience et libérer les blocages.
              </p>
              <a href="/therapies/respiration-holotropique" className="link">
                En savoir plus &rarr;
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="section-padding bg-secondary text-background">
        <div className="container-site text-center">
          <div className="gold-line mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-heading text-background mb-6">
            Commencez votre parcours
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Prenez rendez-vous pour un premier entretien et découvrez comment je
            peux vous accompagner dans votre cheminement personnel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="btn btn-primary">
              Prendre rendez-vous
            </a>
            <a
              href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`}
              className="btn btn-outline"
            >
              {siteConfig.contact.phone}
            </a>
          </div>

          {/* Location */}
          <p className="mt-8 text-gray-400">
            <svg
              className="inline-block w-5 h-5 mr-2 -mt-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {siteConfig.contact.address.city},{' '}
            {siteConfig.contact.address.country}
          </p>
        </div>
      </section>
    </>
  );
}
