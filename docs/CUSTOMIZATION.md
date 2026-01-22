# Personnalisation

Ce guide explique comment personnaliser votre site Kairn : thème, composants, pages et fonctionnalités.

## Thème et couleurs

### Palettes prédéfinies

Le CLI propose plusieurs palettes de couleurs :

```bash
kairn palettes
```

| Palette | Primary | Description |
|---------|---------|-------------|
| purple | #6366f1 | Indigo moderne et professionnel |
| teal | #14b8a6 | Turquoise apaisant |
| rose | #f43f5e | Rose chaleureux |
| amber | #f59e0b | Doré et accueillant |
| emerald | #10b981 | Vert naturel |
| blue | #3b82f6 | Bleu classique |

### Configuration des couleurs

Dans `site.config.ts` :

```typescript
theme: {
  colors: {
    primary: '#6366f1',      // Couleur principale (boutons, liens)
    secondary: '#1e293b',    // Couleur secondaire (texte foncé)
    accent: '#a5b4fc',       // Couleur d'accent (highlights)
    background: '#f8fafc',   // Fond de page
    foreground: '#1e293b',   // Texte principal
    muted: '#94a3b8',        // Texte secondaire
    success: '#10b981',      // Messages de succès
    warning: '#f97316',      // Alertes
    error: '#ef4444',        // Erreurs
  },
}
```

### Polices

Configurez les polices dans `site.config.ts` :

```typescript
theme: {
  fonts: {
    display: 'Playfair Display',  // Titres
    body: 'Inter',                // Corps de texte
  },
}
```

Les polices sont chargées via Google Fonts dans `app/layout.tsx` :

```typescript
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
});
```

### Tailwind personnalisé

Étendez le preset Kairn dans `tailwind.config.ts` :

```typescript
import type { Config } from 'tailwindcss';
import karinPreset from '@kairn/tailwind-preset';

const config: Config = {
  presets: [karinPreset],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        custom: ['Custom Font', 'sans-serif'],
      },
    },
  },
};

export default config;
```

## Pages

### Ajouter une page

Utilisez le CLI :

```bash
kairn generate page tarifs --site mon-cabinet
```

Ou manuellement, créez `app/tarifs/page.tsx` :

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs',
  description: 'Nos tarifs de consultation',
};

export default function TarifsPage() {
  return (
    <main className="container-site section-padding">
      <h1 className="text-3xl font-heading mb-6">Tarifs</h1>
      {/* Contenu */}
    </main>
  );
}
```

### Pages dynamiques

Pour des pages basées sur les données (ex: services) :

```typescript
// app/services/[slug]/page.tsx
import { siteConfig } from '@/config/site.config';

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return siteConfig.services.map((service) => ({
    slug: service.slug,
  }));
}

export default function ServicePage({ params }: Props) {
  const service = siteConfig.services.find(s => s.slug === params.slug);

  if (!service) {
    notFound();
  }

  return (
    <main>
      <h1>{service.name}</h1>
      <p>{service.shortDescription}</p>
    </main>
  );
}
```

## Composants

### Utiliser les composants @kairn/ui

```typescript
import {
  BlogCard,
  TestimonialCard,
  ContactForm,
  Breadcrumb,
} from '@kairn/ui';

export default function Page() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Accueil', href: '/' },
        { label: 'Blog', href: '/blog' },
      ]} />

      <BlogCard
        post={post}
        href={`/blog/${post.slug}`}
      />

      <TestimonialCard
        name="Marie D."
        content="Excellent accompagnement..."
        rating={5}
      />

      <ContactForm
        onSubmit={handleSubmit}
        fields={['name', 'email', 'message']}
      />
    </>
  );
}
```

### Créer un composant personnalisé

```bash
kairn generate component PriceCard --site mon-cabinet --type server
```

Crée `components/PriceCard.tsx` :

```typescript
interface PriceCardProps {
  title: string;
  price: number;
  duration: string;
  features: string[];
  highlighted?: boolean;
}

export function PriceCard({
  title,
  price,
  duration,
  features,
  highlighted = false,
}: PriceCardProps) {
  return (
    <div className={`
      p-6 rounded-lg border
      ${highlighted ? 'border-primary bg-primary/5' : 'border-slate-200'}
    `}>
      <h3 className="text-xl font-heading">{title}</h3>
      <div className="mt-4">
        <span className="text-3xl font-bold">{price}€</span>
        <span className="text-slate-500">/{duration}</span>
      </div>
      <ul className="mt-4 space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-green-500" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Composants client vs serveur

**Server Component** (par défaut) :
- Pas d'interactivité
- Accès direct aux données
- SEO optimisé

**Client Component** (avec `'use client'`) :
- Interactivité (onClick, useState)
- Animations
- Formulaires

```typescript
// components/InteractiveButton.tsx
'use client';

import { useState } from 'react';

export function InteractiveButton() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Cliqué {count} fois
    </button>
  );
}
```

## Feature Flags

Activez ou désactivez des fonctionnalités dans `site.config.ts` :

```typescript
features: {
  blog: true,           // Section blog
  testimonials: true,   // Témoignages
  analytics: true,      // Analytics internes
  socialMedia: true,    // Intégration réseaux sociaux
  appointmentBooking: true,  // Prise de RDV
  newsletter: false,    // Newsletter
  contactForm: true,    // Formulaire de contact
  seminars: false,      // Module séminaires
}
```

Utilisez les flags dans vos composants :

```typescript
import { siteConfig } from '@/config/site.config';

export default function Header() {
  return (
    <nav>
      <Link href="/">Accueil</Link>
      {siteConfig.features.blog && <Link href="/blog">Blog</Link>}
      {siteConfig.features.seminars && <Link href="/seminars">Séminaires</Link>}
    </nav>
  );
}
```

## SEO

### Métadonnées par page

```typescript
// app/a-propos/page.tsx
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';

export const metadata: Metadata = {
  title: 'À propos',
  description: `Découvrez ${siteConfig.practitioner.name}, ${siteConfig.practitioner.title}`,
  openGraph: {
    title: `À propos | ${siteConfig.name}`,
    description: siteConfig.practitioner.bio,
  },
};
```

### JSON-LD

Ajoutez des données structurées :

```typescript
// app/layout.tsx
function generateStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: siteConfig.name,
    description: siteConfig.seo.description,
    url: `https://${siteConfig.domain}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.contact.address.street,
      addressLocality: siteConfig.contact.address.city,
    },
  };
}

// Dans le <head>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(generateStructuredData()),
  }}
/>
```

## Formulaires

### ContactForm personnalisé

```typescript
import { ContactForm } from '@kairn/ui';

export function CustomContactSection() {
  const handleSubmit = async (data: FormData) => {
    'use server';
    // Envoyer à l'API
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <ContactForm
      onSubmit={handleSubmit}
      fields={[
        { name: 'name', label: 'Nom complet', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Téléphone' },
        { name: 'service', label: 'Service souhaité', type: 'select', options: [
          { value: 'consultation', label: 'Consultation' },
          { value: 'therapie', label: 'Thérapie de couple' },
        ]},
        { name: 'message', label: 'Message', type: 'textarea', required: true },
      ]}
      submitLabel="Envoyer ma demande"
      successMessage="Votre message a été envoyé !"
    />
  );
}
```

## Images

### Images optimisées

Utilisez le composant `next/image` :

```typescript
import Image from 'next/image';

export function ProfileImage() {
  return (
    <Image
      src="/images/practitioner.webp"
      alt={siteConfig.practitioner.name}
      width={400}
      height={500}
      className="rounded-lg"
      priority
    />
  );
}
```

### Images depuis Supabase

```typescript
import Image from 'next/image';

export function SupabaseImage({ path }: { path: string }) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${path}`;

  return (
    <Image
      src={url}
      alt=""
      width={800}
      height={600}
      className="rounded-lg"
    />
  );
}
```

## Internationalisation

Pour un site multilingue, structurez avec des routes :

```
app/
├── [locale]/
│   ├── page.tsx
│   ├── a-propos/
│   │   └── page.tsx
│   └── layout.tsx
```

```typescript
// app/[locale]/layout.tsx
const locales = ['fr', 'en'] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
```

## Extensions

### Ajouter un module

1. Créez le package dans `packages/`
2. Configurez `package.json` avec les dépendances
3. Exportez dans `src/index.ts`
4. Ajoutez au site via `dependencies`

### Intégrer un service externe

```typescript
// lib/calendly.ts
export async function getCalendlyAvailability() {
  const res = await fetch('https://api.calendly.com/...', {
    headers: {
      Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`,
    },
  });
  return res.json();
}

// app/rdv/page.tsx
import { getCalendlyAvailability } from '@/lib/calendly';

export default async function RdvPage() {
  const availability = await getCalendlyAvailability();
  // ...
}
```

## Bonnes pratiques

1. **Gardez la configuration dans `site.config.ts`** - Évitez les valeurs hardcodées
2. **Utilisez les composants @kairn/ui** - Cohérence et maintenance
3. **Server Components par défaut** - Client seulement si nécessaire
4. **Images optimisées** - Toujours via `next/image`
5. **Feature flags** - Activez uniquement ce dont vous avez besoin
6. **Types TypeScript** - Profitez de l'auto-complétion
