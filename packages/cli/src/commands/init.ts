/**
 * Init Command
 *
 * Scaffolds a new Kairn site from template.
 */

import { join } from 'path';

import {
  SITE_TEMPLATES,
  COLOR_PALETTES,
  type SiteTemplate,
} from '@kairn/core';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';

import {
  findProjectRoot,
  writeFileWithDir,
  fileExists,
  ensureDir,
  writeJsonFile,
} from '../utils/fs';
import { error, info, header, step, warning } from '../utils/log';

interface InitOptions {
  template?: string;
  force?: boolean;
}

/**
 * Get the package.json template for a new site
 */
function getPackageJson(name: string, slug: string): object {
  return {
    name: `@kairn/${slug}`,
    version: '0.1.0',
    private: true,
    description: `Site ${name}`,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      'type-check': 'tsc --noEmit',
    },
    dependencies: {
      '@kairn/config': 'workspace:*',
      '@kairn/core': 'workspace:*',
      '@kairn/ui': 'workspace:*',
      '@prisma/client': '^6.0.0',
      'framer-motion': '^11.0.0',
      'lucide-react': '^0.400.0',
      next: '^14.2.0',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@kairn/tailwind-preset': 'workspace:*',
      '@kairn/typescript-config': 'workspace:*',
      '@types/node': '^20.11.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      autoprefixer: '^10.4.0',
      postcss: '^8.4.0',
      tailwindcss: '^3.4.0',
      typescript: '^5.4.0',
    },
  };
}

/**
 * Get tsconfig.json template
 */
function getTsConfig(): object {
  return {
    extends: '@kairn/typescript-config/nextjs.json',
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '@/*': ['./*'],
      },
      plugins: [{ name: 'next' }],
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };
}

/**
 * Get next.config.mjs template
 */
function getNextConfig(): string {
  return `/** @type {import('next').NextConfig} */

// Content Security Policy
const ContentSecurityPolicy = \`
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.resend.com https://*.supabase.co;
  frame-src 'self' https://www.google.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
\`
  .replace(/\\s{2,}/g, ' ')
  .trim();

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
];

const nextConfig = {
  transpilePackages: ['@kairn/ui', '@kairn/core', '@kairn/config'],
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['@kairn/ui'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
`;
}

/**
 * Get tailwind.config.ts template
 */
function getTailwindConfig(_slug: string): string {
  return `import type { Config } from 'tailwindcss';
import karinPreset from '@kairn/tailwind-preset';

const config: Config = {
  presets: [karinPreset],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './config/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Add site-specific theme customizations here
    },
  },
};

export default config;
`;
}

/**
 * Get postcss.config.js template
 */
function getPostcssConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

/**
 * Get globals.css template
 */
function getGlobalsCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom site styles */
@layer base {
  :root {
    --font-sans: var(--font-inter);
    --font-heading: var(--font-playfair);
  }
}

@layer components {
  /* Add custom component styles here */
}
`;
}

/**
 * Get site.config.ts template
 */
function getSiteConfig(name: string, slug: string, template: SiteTemplate, palette: string): string {
  const paletteColors = COLOR_PALETTES[palette as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.calm;

  return `/**
 * Configuration du site ${name}
 */

import { defineSiteConfig } from '@kairn/config';

export const siteConfig = defineSiteConfig({
  id: '${slug}',
  name: '${name}',
  domain: '${slug}.fr',
  locale: 'fr',

  practitioner: {
    name: 'Votre Nom',
    title: 'Votre Titre',
    bio: \`Décrivez votre parcours et votre approche ici.
Cette description apparaîtra sur la page d'accueil et la page À propos.\`,
    image: '/images/practitioner.webp',
    credentials: [
      { title: 'Certification 1', institution: 'Institution 1' },
      { title: 'Certification 2', institution: 'Institution 2' },
    ],
  },

  contact: {
    email: 'contact@${slug}.fr',
    address: {
      street: 'Votre adresse',
      city: 'Ville',
      postalCode: '00000',
      country: 'France',
    },
    coordinates: { lat: 48.8566, lng: 2.3522 },
    businessHours: {
      monday: '09:00 - 19:00',
      tuesday: '09:00 - 19:00',
      wednesday: '09:00 - 19:00',
      thursday: '09:00 - 19:00',
      friday: '09:00 - 19:00',
    },
    appointmentUrl: 'https://${slug}.fr/rendez-vous',
  },

  services: [
    {
      id: 'service-1',
      name: 'Service 1',
      slug: 'service-1',
      shortDescription: 'Description du premier service proposé.',
      icon: 'Heart',
      enabled: true,
      order: 1,
    },
    {
      id: 'service-2',
      name: 'Service 2',
      slug: 'service-2',
      shortDescription: 'Description du deuxième service proposé.',
      icon: 'Sparkles',
      enabled: true,
      order: 2,
    },
  ],

  features: {
    blog: ${template === 'minimal' ? 'false' : 'true'},
    seminars: ${template === 'holistic' ? 'true' : 'false'},
    analytics: true,
    socialMedia: true,
    appointmentBooking: true,
    testimonials: true,
    newsletter: false,
    contactForm: true,
  },

  seo: {
    defaultTitle: '${name} | Votre Titre',
    titleTemplate: '%s | ${name}',
    description: 'Description SEO de votre site. Personnalisez ce texte pour le référencement.',
    keywords: ['${slug}', 'mot-clé-1', 'mot-clé-2'],
    ogImage: '/images/og-image.jpg',
    locale: 'fr_FR',
  },

  integrations: {
    database: { url: process.env.DATABASE_URL || '' },
    auth: {
      jwtSecret: process.env.JWT_SECRET || '',
      jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    },
    email: {
      provider: 'resend',
      apiKey: process.env.RESEND_API_KEY,
      fromAddress: 'contact@${slug}.fr',
      fromName: '${name}',
    },
    storage: {
      provider: 'supabase',
      url: process.env.SUPABASE_URL,
    },
    recaptcha: {
      siteKey: process.env.RECAPTCHA_SITE_KEY || '',
      secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
    },
  },

  theme: {
    colors: {
      primary: '${paletteColors.primary}',
      secondary: '${paletteColors.secondary}',
      accent: '${paletteColors.accent}',
      background: '${paletteColors.background}',
      foreground: '${paletteColors.foreground}',
      muted: '${paletteColors.muted}',
      success: '${paletteColors.success}',
      warning: '${paletteColors.warning}',
      error: '${paletteColors.destructive}',
    },
    fonts: {
      display: 'Playfair Display',
      body: 'Inter',
    },
  },
});

export default siteConfig;
`;
}

/**
 * Get app/layout.tsx template
 */
function getLayoutTemplate(_name: string): string {
  return `import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { ToastProvider } from '@kairn/ui';
import { siteConfig } from '@/config/site.config';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(\`https://\${siteConfig.domain}\`),
  title: {
    default: \`\${siteConfig.name} - \${siteConfig.practitioner.title}\`,
    template: \`%s | \${siteConfig.name}\`,
  },
  description: siteConfig.seo.description,
  keywords: siteConfig.seo.keywords,
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: \`https://\${siteConfig.domain}\`,
    siteName: siteConfig.name,
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.theme.colors.primary,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={siteConfig.locale}
      className={\`\${inter.variable} \${playfairDisplay.variable}\`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ToastProvider position="top-right">
          <div className="relative flex min-h-screen flex-col">
            <main id="main-content" className="flex-1">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
`;
}

/**
 * Get app/page.tsx template
 */
function getHomePageTemplate(): string {
  return `import { siteConfig } from '@/config/site.config';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-heading font-semibold mb-6">
            {siteConfig.name}
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-2xl mx-auto">
            {siteConfig.practitioner.title}
          </p>
          <p className="text-lg text-indigo-400 mb-8">
            {siteConfig.practitioner.name}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Prendre rendez-vous
            </a>
            <a
              href="/services"
              className="px-8 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Découvrir les services
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading text-slate-800 mb-6">
              Bienvenue
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8 whitespace-pre-line">
              {siteConfig.practitioner.bio}
            </p>
            <a href="/a-propos" className="text-indigo-600 hover:text-indigo-700">
              En savoir plus &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading text-slate-800">
              Nos services
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {siteConfig.services.filter(s => s.enabled).map((service) => (
              <article
                key={service.id}
                className="p-6 border border-slate-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-heading text-slate-800 mb-3">
                  {service.name}
                </h3>
                <p className="text-slate-600 mb-4">
                  {service.shortDescription}
                </p>
                <a
                  href={\`/services/\${service.slug}\`}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  En savoir plus &rarr;
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading mb-6">
            Commencez votre parcours
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Prenez rendez-vous pour un premier entretien.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Prendre rendez-vous
            </a>
            <a
              href={\`mailto:\${siteConfig.contact.email}\`}
              className="px-8 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {siteConfig.contact.email}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
`;
}

/**
 * Get .env.local template
 */
function getEnvTemplate(): string {
  return `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kairn?schema=public"

# Authentication
JWT_SECRET="your-jwt-secret-key-change-in-production"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"

# Storage (Supabase)
SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# reCAPTCHA
RECAPTCHA_SITE_KEY=""
RECAPTCHA_SECRET_KEY=""

# AI (Optional)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
`;
}

/**
 * Get .eslintrc.json template
 */
function getEslintConfig(): object {
  return {
    root: true,
    extends: ['next/core-web-vitals'],
    rules: {},
  };
}

/**
 * Initialize a new site
 */
export async function initCommand(siteName: string, options: InitOptions): Promise<void> {
  const spinner = ora('Initializing new site...').start();

  try {
    const projectRoot = await findProjectRoot();

    if (!projectRoot) {
      spinner.fail('Not in a Kairn project');
      error('Could not find Kairn project root. Run this command from within a Kairn monorepo.');
      process.exit(1);
    }

    // Validate site name
    const slug = siteName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const siteDir = join(projectRoot, 'apps', slug);

    // Check if site already exists
    if (!options.force && (await fileExists(siteDir))) {
      spinner.fail('Site already exists');
      error(`A site named "${slug}" already exists at apps/${slug}`);
      info('Use --force to overwrite');
      process.exit(1);
    }

    spinner.stop();

    // Interactive prompts
    header(`🏗️  Create New Kairn Site: ${chalk.cyan(slug)}`);

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Site display name:',
        default: siteName
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
      },
      {
        type: 'list',
        name: 'template',
        message: 'Choose a template:',
        choices: Object.keys(SITE_TEMPLATES).map((t) => ({
          name: `${t.charAt(0).toUpperCase() + t.slice(1)}`,
          value: t,
        })),
        default: options.template || 'psychologist',
      },
      {
        type: 'list',
        name: 'colorPalette',
        message: 'Choose a color palette:',
        choices: Object.keys(COLOR_PALETTES).map((p) => ({
          name: `${p.charAt(0).toUpperCase() + p.slice(1)} - ${COLOR_PALETTES[p as keyof typeof COLOR_PALETTES].primary}`,
          value: p,
        })),
        default: 'calm',
      },
    ]);

    spinner.start('Creating site structure...');

    // Create directories
    await ensureDir(siteDir);
    await ensureDir(join(siteDir, 'app'));
    await ensureDir(join(siteDir, 'components'));
    await ensureDir(join(siteDir, 'config'));
    await ensureDir(join(siteDir, 'public', 'images'));

    // Create files
    const files = [
      { path: join(siteDir, 'package.json'), content: getPackageJson(answers.name, slug) },
      { path: join(siteDir, 'tsconfig.json'), content: getTsConfig() },
      { path: join(siteDir, '.eslintrc.json'), content: getEslintConfig() },
    ];

    for (const file of files) {
      await writeJsonFile(file.path, file.content);
    }

    const textFiles = [
      { path: join(siteDir, 'next.config.mjs'), content: getNextConfig() },
      { path: join(siteDir, 'tailwind.config.ts'), content: getTailwindConfig(slug) },
      { path: join(siteDir, 'postcss.config.js'), content: getPostcssConfig() },
      { path: join(siteDir, 'app', 'globals.css'), content: getGlobalsCss() },
      { path: join(siteDir, 'app', 'layout.tsx'), content: getLayoutTemplate(answers.name) },
      { path: join(siteDir, 'app', 'page.tsx'), content: getHomePageTemplate() },
      {
        path: join(siteDir, 'config', 'site.config.ts'),
        content: getSiteConfig(answers.name, slug, answers.template as SiteTemplate, answers.colorPalette),
      },
      { path: join(siteDir, '.env.local.example'), content: getEnvTemplate() },
      { path: join(siteDir, 'next-env.d.ts'), content: '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n' },
    ];

    for (const file of textFiles) {
      await writeFileWithDir(file.path, file.content);
    }

    spinner.succeed('Site created successfully');

    // Summary
    header(`✨ Site "${answers.name}" Created!`);

    console.log(chalk.gray('Location:'));
    console.log(`  ${chalk.cyan(`apps/${slug}/`)}\n`);

    console.log(chalk.gray('Files created:'));
    step('package.json');
    step('tsconfig.json');
    step('next.config.mjs');
    step('tailwind.config.ts');
    step('app/layout.tsx');
    step('app/page.tsx');
    step('config/site.config.ts');
    step('.env.local.example');

    console.log('');
    info('Next steps:');
    console.log(`  1. ${chalk.cyan('cd')} to project root`);
    console.log(`  2. Run ${chalk.cyan('pnpm install')} to install dependencies`);
    console.log(`  3. Copy ${chalk.cyan('.env.local.example')} to ${chalk.cyan('.env.local')} and configure`);
    console.log(`  4. Edit ${chalk.cyan(`apps/${slug}/config/site.config.ts`)} to customize your site`);
    console.log(`  5. Run ${chalk.cyan(`kairn dev --site ${slug}`)} to start development`);
    console.log('');

    warning('Remember to update .env.local with your actual credentials!');
  } catch (err) {
    spinner.fail('Failed to create site');
    error((err as Error).message);
    process.exit(1);
  }
}
