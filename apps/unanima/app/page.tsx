import { siteConfig } from '@/config/site.config';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-slate-900 text-white">
        <div className="container-site text-center">
          {/* Decorative accent line */}
          <div className="accent-line mx-auto mb-8" />

          {/* Main title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-semibold mb-6">
            <span className="text-primary-gradient">{siteConfig.name}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-2xl mx-auto">
            {siteConfig.practitioner.title}
          </p>

          {/* Practitioner name */}
          <p className="text-lg text-indigo-400 mb-8">
            {siteConfig.practitioner.name}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="btn btn-primary">
              Prendre rendez-vous
            </a>
            <a href="/services" className="btn btn-outline">
              Découvrir les services
            </a>
          </div>
        </div>

        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </section>

      {/* About Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-site">
          <div className="max-w-3xl mx-auto text-center">
            <div className="accent-line mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-heading text-slate-800 mb-6">
              Bienvenue
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              {siteConfig.practitioner.bio}
            </p>
            <a href="/a-propos" className="link text-lg">
              En savoir plus &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-white">
        <div className="container-site">
          <div className="text-center mb-12">
            <div className="accent-line mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-heading text-slate-800">
              Nos services
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {siteConfig.services.filter(s => s.enabled).map((service) => (
              <article key={service.id} className="card p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-heading text-slate-800 mb-3">
                  {service.name}
                </h3>
                <p className="text-slate-600 mb-4">
                  {service.shortDescription}
                </p>
                <a href={`/services/${service.slug}`} className="link">
                  En savoir plus &rarr;
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="section-padding bg-slate-900 text-white">
        <div className="container-site text-center">
          <div className="accent-line mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-heading mb-6">
            Commencez votre parcours
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Prenez rendez-vous pour un premier entretien et découvrez comment nous
            pouvons vous accompagner.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="btn btn-primary">
              Prendre rendez-vous
            </a>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="btn btn-outline"
            >
              {siteConfig.contact.email}
            </a>
          </div>

          {/* Location */}
          <p className="mt-8 text-slate-400">
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
