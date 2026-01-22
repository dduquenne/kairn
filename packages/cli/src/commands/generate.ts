/**
 * Generate Commands
 *
 * Commands for generating pages and components.
 */

import { join } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { error, info, header, success, step } from '../utils/log';
import { findProjectRoot, findSiteDir, writeFileWithDir, fileExists, listFiles } from '../utils/fs';

interface GeneratePageOptions {
  site?: string;
  route?: string;
}

interface GenerateComponentOptions {
  site?: string;
  type?: 'client' | 'server';
}

/**
 * Convert a name to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert a name to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Get templates for page generation
 */
function getPageTemplate(name: string, route: string): string {
  const componentName = toPascalCase(name);

  return `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${componentName}',
  description: 'Description de la page ${name}',
};

export default function ${componentName}Page() {
  return (
    <main className="container-site section-padding">
      <h1 className="text-3xl md:text-4xl font-heading text-slate-800 mb-6">
        ${componentName}
      </h1>
      <p className="text-slate-600">
        Contenu de la page ${name}.
      </p>
    </main>
  );
}
`;
}

/**
 * Get template for server component
 */
function getServerComponentTemplate(name: string): string {
  const componentName = toPascalCase(name);

  return `/**
 * ${componentName} Component
 *
 * Server component for ${name}.
 */

interface ${componentName}Props {
  // Add props here
}

export function ${componentName}({ }: ${componentName}Props) {
  return (
    <div className="${toKebabCase(name)}">
      <h2>${componentName}</h2>
    </div>
  );
}
`;
}

/**
 * Get template for client component
 */
function getClientComponentTemplate(name: string): string {
  const componentName = toPascalCase(name);

  return `'use client';

/**
 * ${componentName} Component
 *
 * Client component for ${name}.
 */

interface ${componentName}Props {
  // Add props here
}

export function ${componentName}({ }: ${componentName}Props) {
  return (
    <div className="${toKebabCase(name)}">
      <h2>${componentName}</h2>
    </div>
  );
}
`;
}

/**
 * Select a site if not specified
 */
async function selectSite(projectRoot: string, siteName?: string): Promise<string> {
  if (siteName) {
    const siteDir = await findSiteDir(siteName, projectRoot);
    if (!siteDir) {
      throw new Error(`Site not found: ${siteName}`);
    }
    return siteName;
  }

  const apps = await listFiles(join(projectRoot, 'apps'));
  const validApps: string[] = [];

  for (const app of apps) {
    const packageJson = join(projectRoot, 'apps', app, 'package.json');
    if (await fileExists(packageJson)) {
      validApps.push(app);
    }
  }

  if (validApps.length === 0) {
    throw new Error('No sites found. Create one with: kairn init <site-name>');
  }

  if (validApps.length === 1) {
    return validApps[0]!;
  }

  const { site } = await inquirer.prompt([
    {
      type: 'list',
      name: 'site',
      message: 'Select a site:',
      choices: validApps,
    },
  ]);

  return site;
}

/**
 * Generate a new page
 */
export async function generatePageCommand(
  name: string,
  options: GeneratePageOptions
): Promise<void> {
  const spinner = ora('Generating page...').start();

  try {
    const projectRoot = await findProjectRoot();

    if (!projectRoot) {
      spinner.fail('Not in a Kairn project');
      error('Could not find Kairn project root.');
      process.exit(1);
    }

    spinner.stop();
    const siteName = await selectSite(projectRoot, options.site);
    spinner.start('Generating page...');

    const siteDir = await findSiteDir(siteName, projectRoot);
    if (!siteDir) {
      spinner.fail(`Site not found: ${siteName}`);
      process.exit(1);
    }

    // Determine route path
    const route = options.route || toKebabCase(name);
    const pagePath = join(siteDir, 'app', route, 'page.tsx');

    // Check if page already exists
    if (await fileExists(pagePath)) {
      spinner.fail('Page already exists');
      error(`A page already exists at: ${pagePath}`);
      process.exit(1);
    }

    // Generate page
    const template = getPageTemplate(name, route);
    await writeFileWithDir(pagePath, template);

    spinner.succeed(`Page generated at ${chalk.cyan(`app/${route}/page.tsx`)}`);
    header(`✨ Page Created: ${name}`);
    step(`Site: ${siteName}`);
    step(`Route: /${route}`);
    step(`File: app/${route}/page.tsx`);

    console.log('');
    info('Next steps:');
    console.log(`  1. Edit ${chalk.cyan(`apps/${siteName}/app/${route}/page.tsx`)}`);
    console.log(`  2. Add navigation link if needed`);
    console.log(`  3. Run ${chalk.cyan('kairn dev --site ' + siteName)} to preview`);
  } catch (err) {
    spinner.fail('Failed to generate page');
    error((err as Error).message);
    process.exit(1);
  }
}

/**
 * Generate a new component
 */
export async function generateComponentCommand(
  name: string,
  options: GenerateComponentOptions
): Promise<void> {
  const spinner = ora('Generating component...').start();

  try {
    const projectRoot = await findProjectRoot();

    if (!projectRoot) {
      spinner.fail('Not in a Kairn project');
      error('Could not find Kairn project root.');
      process.exit(1);
    }

    spinner.stop();
    const siteName = await selectSite(projectRoot, options.site);
    spinner.start('Generating component...');

    const siteDir = await findSiteDir(siteName, projectRoot);
    if (!siteDir) {
      spinner.fail(`Site not found: ${siteName}`);
      process.exit(1);
    }

    const componentName = toPascalCase(name);
    const fileName = `${componentName}.tsx`;
    const componentPath = join(siteDir, 'components', fileName);

    // Check if component already exists
    if (await fileExists(componentPath)) {
      spinner.fail('Component already exists');
      error(`A component already exists at: ${componentPath}`);
      process.exit(1);
    }

    // Determine component type
    const isClient = options.type === 'client';
    const template = isClient
      ? getClientComponentTemplate(name)
      : getServerComponentTemplate(name);

    await writeFileWithDir(componentPath, template);

    spinner.succeed(`Component generated at ${chalk.cyan(`components/${fileName}`)}`);
    header(`✨ Component Created: ${componentName}`);
    step(`Site: ${siteName}`);
    step(`Type: ${isClient ? 'Client' : 'Server'} Component`);
    step(`File: components/${fileName}`);

    console.log('');
    info('Usage:');
    console.log(`  import { ${componentName} } from '@/components/${componentName}';`);
    console.log('');
    console.log(`  <${componentName} />`);
  } catch (err) {
    spinner.fail('Failed to generate component');
    error((err as Error).message);
    process.exit(1);
  }
}
