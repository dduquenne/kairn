'use client';

import { cn } from '../../utils/cn';
import type { LinkComponent } from '../blog/types';
import { Breadcrumb, BreadcrumbStructuredData } from '../navigation/Breadcrumb';

import type { GeoPageProps } from './types';

// Icons
const MapPinIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
      clipRule="evenodd"
    />
  </svg>
);

const ClockIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
      clipRule="evenodd"
    />
  </svg>
);

const CarIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
  </svg>
);

const CheckIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
      clipRule="evenodd"
    />
  </svg>
);

const QuoteIcon = ({ className = 'h-8 w-8' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn('opacity-30', className)}
  >
    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
  </svg>
);

export interface GeoPageComponentProps extends GeoPageProps {
  /** Custom Link component (Next.js Link) */
  linkComponent?: LinkComponent;
}

/**
 * GeoPage component for SEO-optimized local service pages
 *
 * @example
 * ```tsx
 * <GeoPage
 *   title="Psychotherapist in Paris"
 *   subtitle="Professional therapy services"
 *   description="Find a qualified psychotherapist in Paris..."
 *   service={{ type: "therapy", label: "Psychotherapy", href: "/therapy" }}
 *   location={{ city: "Paris", department: "75", region: "Île-de-France" }}
 *   breadcrumbItems={[{ name: "Services", href: "/services" }]}
 *   baseUrl="https://example.com"
 *   mainContent="<p>Our therapy services...</p>"
 *   benefits={["Stress reduction", "Better relationships"]}
 *   practicalInfo={{ distance: "10 km", duration: "20 min", directions: "..." }}
 *   contactInfo={{ address: "123 Rue", city: "Paris", postalCode: "75001" }}
 *   linkComponent={Link}
 * />
 * ```
 */
export function GeoPage({
  title,
  subtitle,
  description,
  service,
  location,
  breadcrumbItems,
  baseUrl,
  mainContent,
  benefits,
  testimonials = [],
  practicalInfo,
  contactInfo,
  pricing = [],
  relatedLinks = [],
  mapsEmbedUrl,
  schemaData,
  navigationSlot,
  footerSlot,
  className,
  colors = {},
  ctaHref = '/contact',
  ctaLabel = 'Book Now',
  ctaSubtext,
  linkComponent: LinkComp,
}: GeoPageComponentProps) {
  const { primary = 'gold', background = 'night', text = 'ivory', border = 'ivory' } = colors;

  // Use custom Link component or default anchor
  const Link =
    LinkComp ??
    (({
      href,
      children,
      className: linkClassName,
      ...props
    }: {
      href: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={href} className={linkClassName} {...props}>
        {children}
      </a>
    ));

  // Build breadcrumb items for the UI component
  const uiBreadcrumbItems = [
    { label: 'Home', href: '/' },
    ...breadcrumbItems.map(item => ({ label: item.name, href: item.href })),
    { label: title },
  ];

  // Build breadcrumb items for structured data
  const structuredDataItems = [
    { name: 'Home', url: baseUrl },
    ...breadcrumbItems.map(item => ({ name: item.name, url: `${baseUrl}${item.href}` })),
    { name: title, url: `${baseUrl}${breadcrumbItems[breadcrumbItems.length - 1]?.href || '/'}` },
  ];

  return (
    <div
      className={cn(
        `from-${background} via-${background}/95 to-${background} text-${text} min-h-screen bg-gradient-to-b`,
        className
      )}
    >
      {navigationSlot}

      {/* Schema JSON-LD */}
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}

      {/* Breadcrumb Structured Data */}
      <BreadcrumbStructuredData items={structuredDataItems} />

      <main className="pb-16 pt-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          {/* Breadcrumb */}
          <Breadcrumb
            items={uiBreadcrumbItems}
            linkComponent={LinkComp}
            showHomeIcon={false}
            className="mb-8"
          />

          {/* Header */}
          <header className="mb-12">
            <div
              className={`border-${primary}/30 bg-${primary}/5 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5`}
            >
              <MapPinIcon />
              <span className={`text-${primary} text-sm font-medium`}>
                {location.city}
                {location.department ? ` (${location.department})` : ''}
              </span>
            </div>

            <h1
              className={`font-display text-${primary} mb-4 text-4xl font-bold leading-tight md:text-5xl`}
            >
              {title}
            </h1>

            <p className={`text-${text}/80 mb-6 text-xl`}>{subtitle}</p>

            <p className={`text-${text}/60 max-w-3xl text-lg leading-relaxed`}>{description}</p>
          </header>

          <div className="grid gap-12 lg:grid-cols-3">
            {/* Main content - 2 columns */}
            <div className="space-y-10 lg:col-span-2">
              {/* Main section */}
              <section>
                <h2 className={`font-display text-${primary} mb-6 text-2xl font-bold`}>
                  {service.label} in {location.city}
                </h2>

                <div className="prose prose-invert max-w-none">
                  <div
                    className={`text-${text}/80 space-y-4 leading-relaxed`}
                    dangerouslySetInnerHTML={{ __html: mainContent }}
                  />
                </div>
              </section>

              {/* Benefits */}
              {benefits.length > 0 && (
                <section
                  className={`border-${border}/10 bg-${background}/30 rounded-2xl border p-6`}
                >
                  <h3 className="font-display mb-4 text-xl font-semibold">Why choose us?</h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className={`text-${primary} mt-0.5 flex-shrink-0`}>
                          <CheckIcon />
                        </span>
                        <span className={`text-${text}/70`}>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Testimonials */}
              {testimonials.length > 0 && (
                <section>
                  <h3 className={`font-display text-${primary} mb-6 text-xl font-semibold`}>
                    Testimonials from {location.city}
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    {testimonials.map((testimonial, index) => (
                      <div
                        key={index}
                        className={`border-${border}/10 bg-${background}/30 relative rounded-xl border p-6`}
                      >
                        <div className={`text-${primary} absolute -top-3 left-4`}>
                          <QuoteIcon />
                        </div>
                        <blockquote className={`text-${text}/80 mb-4 italic`}>
                          &ldquo;{testimonial.content}&rdquo;
                        </blockquote>
                        <footer className={`text-${text}/50 text-sm`}>
                          <strong className={`text-${text}/70`}>{testimonial.author}</strong>
                          <span className="mx-2">&bull;</span>
                          <span>{testimonial.location}</span>
                        </footer>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Google Maps */}
              {mapsEmbedUrl && (
                <section>
                  <h3 className="font-display mb-4 text-xl font-semibold">Location</h3>
                  <div className="overflow-hidden rounded-xl">
                    <div className={`bg-${background}/50 aspect-video w-full`}>
                      <iframe
                        src={mapsEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Location for ${service.label} near ${location.city}`}
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Main CTA */}
              <div
                className={`border-${primary}/30 bg-${primary}/5 rounded-2xl border p-6 text-center`}
              >
                <h3 className={`font-display text-${primary} mb-2 text-lg font-semibold`}>
                  {ctaLabel}
                </h3>
                {ctaSubtext && <p className={`text-${text}/60 mb-4 text-sm`}>{ctaSubtext}</p>}
                <Link
                  href={ctaHref}
                  className={`bg-${primary} hover:bg-${primary}/90 text-${background} block w-full rounded-lg py-3 font-medium transition-colors`}
                >
                  {ctaLabel}
                </Link>
              </div>

              {/* Practical information */}
              <div className={`border-${border}/10 bg-${background}/30 rounded-2xl border p-6`}>
                <h3 className="font-display mb-4 text-lg font-semibold">Practical Information</h3>

                <div className="space-y-4">
                  {/* Distance from city */}
                  <div className="flex items-start gap-3">
                    <span className={`text-${primary}`}>
                      <CarIcon />
                    </span>
                    <div>
                      <p className="font-medium">From {location.city}</p>
                      <p className={`text-${text}/60 text-sm`}>
                        {practicalInfo.distance} &bull; {practicalInfo.duration}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <span className={`text-${primary}`}>
                      <MapPinIcon />
                    </span>
                    <div>
                      <p className="font-medium">Address</p>
                      <p className={`text-${text}/60 text-sm`}>
                        {contactInfo.address}
                        {contactInfo.addressLine2 && <br />}
                        {contactInfo.addressLine2}
                        <br />
                        {contactInfo.postalCode} {contactInfo.city}
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  {contactInfo.hours && contactInfo.hours.length > 0 && (
                    <div className="flex items-start gap-3">
                      <span className={`text-${primary}`}>
                        <ClockIcon />
                      </span>
                      <div>
                        <p className="font-medium">Hours</p>
                        <div className={`text-${text}/60 text-sm`}>
                          {contactInfo.hours.map((schedule, index) => (
                            <p key={index}>
                              {schedule.days}: {schedule.hours}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Directions */}
                  <div className={`border-${border}/10 mt-4 border-t pt-4`}>
                    <p className={`text-${text}/50 text-xs`}>{practicalInfo.directions}</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              {pricing.length > 0 && (
                <div className={`border-${border}/10 bg-${background}/30 rounded-2xl border p-6`}>
                  <h3 className="font-display mb-4 text-lg font-semibold">Pricing</h3>
                  <div className="space-y-3">
                    {pricing.map((tier, index) => (
                      <div key={index} className="flex items-baseline justify-between">
                        <span className={`text-${text}/70`}>{tier.label}</span>
                        <span className={`text-${primary} font-semibold`}>{tier.price}</span>
                      </div>
                    ))}
                    {pricing.some(p => p.note) && (
                      <p className={`text-${text}/40 mt-2 text-xs`}>
                        {pricing.find(p => p.note)?.note}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Related links */}
              {relatedLinks.length > 0 && (
                <div className={`border-${border}/10 bg-${background}/30 rounded-2xl border p-6`}>
                  <h3 className="font-display mb-4 text-lg font-semibold">See Also</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href={service.href}
                        className={`text-${text}/70 hover:text-${primary} flex items-center gap-2 text-sm transition-colors`}
                      >
                        <span className={`bg-${primary}/20 h-1.5 w-1.5 rounded-full`} />
                        Learn more about {service.label.toLowerCase()}
                      </Link>
                    </li>
                    {relatedLinks.map((link, index) => (
                      <li key={index}>
                        <Link
                          href={link.href}
                          className={`text-${text}/70 hover:text-${primary} flex items-center gap-2 text-sm transition-colors`}
                        >
                          <span className={`bg-${primary}/20 h-1.5 w-1.5 rounded-full`} />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {footerSlot}
    </div>
  );
}
