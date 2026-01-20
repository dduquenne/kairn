#!/usr/bin/env node

/**
 * Kairn CLI
 *
 * Command-line interface for managing Kairn platform sites.
 *
 * Commands:
 * - create: Create a new site configuration
 * - validate: Validate a site configuration
 * - list-templates: List available site templates
 * - list-palettes: List available color palettes
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { writeFile, readFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import {
  SITE_TEMPLATES,
  COLOR_PALETTES,
  createConfigFromTemplate,
  validateSiteConfig,
  safeParseSiteConfig,
  type SiteTemplate,
  type SiteConfig,
} from '@kairn/core';

const program = new Command();

// =============================================================================
// Utility Functions
// =============================================================================

function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

function error(message: string): void {
  console.log(chalk.red('✗'), message);
}

function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

function formatJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Commands
// =============================================================================

/**
 * Create a new site configuration interactively
 */
async function createSite(options: { output?: string; template?: string }): Promise<void> {
  console.log(chalk.bold('\n🚀 Create a new Kairn site\n'));

  // Gather information
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'slug',
      message: 'Site slug (lowercase, no spaces):',
      validate: (input: string) => {
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Slug must be lowercase alphanumeric with hyphens only';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'name',
      message: 'Site name:',
      validate: (input: string) => input.length > 0 || 'Name is required',
    },
    {
      type: 'input',
      name: 'domain',
      message: 'Domain (optional):',
    },
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      choices: Object.keys(SITE_TEMPLATES).map((t) => ({
        name: `${t.charAt(0).toUpperCase() + t.slice(1)} - ${getTemplateDescription(t as SiteTemplate)}`,
        value: t,
      })),
      default: options.template || 'psychologist',
    },
    {
      type: 'list',
      name: 'colorPalette',
      message: 'Choose a color palette:',
      choices: Object.keys(COLOR_PALETTES).map((p) => ({
        name: `${p.charAt(0).toUpperCase() + p.slice(1)} - Primary: ${COLOR_PALETTES[p as keyof typeof COLOR_PALETTES].primary}`,
        value: p,
      })),
    },
    {
      type: 'input',
      name: 'seoTitle',
      message: 'SEO title:',
      default: (answers: { name: string }) => answers.name,
    },
    {
      type: 'input',
      name: 'seoDescription',
      message: 'SEO description (optional):',
    },
    {
      type: 'input',
      name: 'email',
      message: 'Contact email (optional):',
    },
    {
      type: 'input',
      name: 'phone',
      message: 'Contact phone (optional):',
    },
  ]);

  const spinner = ora('Creating site configuration...').start();

  try {
    // Create configuration from template
    const config = createConfigFromTemplate(answers.template as SiteTemplate, {
      slug: answers.slug,
      name: answers.name,
      domain: answers.domain || undefined,
      seo: {
        title: answers.seoTitle,
        description: answers.seoDescription || undefined,
      },
      contact: {
        email: answers.email || undefined,
        phone: answers.phone || undefined,
      },
    });

    // Apply selected color palette
    const palette = COLOR_PALETTES[answers.colorPalette as keyof typeof COLOR_PALETTES];
    if (config.theme) {
      config.theme.colors = { light: palette };
    }

    // Validate the configuration
    const validatedConfig = validateSiteConfig(config);

    // Determine output path
    const outputPath = options.output || join(process.cwd(), `${answers.slug}.config.json`);

    // Create directory if needed
    const dir = dirname(outputPath);
    if (dir !== '.') {
      await mkdir(dir, { recursive: true });
    }

    // Write configuration file
    await writeFile(outputPath, formatJson(validatedConfig), 'utf-8');

    spinner.succeed(`Site configuration created!`);
    success(`Configuration saved to: ${chalk.cyan(outputPath)}`);

    console.log('\n' + chalk.bold('Next steps:'));
    console.log('  1. Review and customize the configuration file');
    console.log('  2. Add the site to your database or configuration loader');
    console.log('  3. Deploy your site with the new configuration\n');
  } catch (err) {
    spinner.fail('Failed to create site configuration');
    error((err as Error).message);
    process.exit(1);
  }
}

/**
 * Validate a site configuration file
 */
async function validateConfig(filePath: string): Promise<void> {
  const spinner = ora(`Validating ${filePath}...`).start();

  try {
    // Check if file exists
    if (!(await fileExists(filePath))) {
      spinner.fail('File not found');
      error(`Configuration file not found: ${filePath}`);
      process.exit(1);
    }

    // Read and parse file
    const content = await readFile(filePath, 'utf-8');
    let config: unknown;

    try {
      config = JSON.parse(content);
    } catch {
      spinner.fail('Invalid JSON');
      error('Configuration file is not valid JSON');
      process.exit(1);
    }

    // Validate configuration
    const result = safeParseSiteConfig(config);

    if (result.success) {
      spinner.succeed('Configuration is valid!');
      success(`Site: ${result.data.name} (${result.data.slug})`);

      // Show summary
      console.log('\n' + chalk.bold('Configuration Summary:'));
      console.log(`  Domain: ${result.data.domain || 'Not set'}`);
      console.log(`  Locale: ${result.data.locale}`);
      console.log(`  Features enabled: ${Object.entries(result.data.features).filter(([, v]) => v).map(([k]) => k).join(', ')}`);
      console.log(`  Dark mode: ${result.data.theme.darkModeEnabled ? 'Enabled' : 'Disabled'}`);
      console.log('');
    } else {
      spinner.fail('Configuration is invalid');

      // Show validation errors
      console.log('\n' + chalk.bold('Validation Errors:'));
      for (const issue of result.error.issues) {
        console.log(chalk.red(`  • ${issue.path.join('.')}: ${issue.message}`));
      }
      console.log('');
      process.exit(1);
    }
  } catch (err) {
    spinner.fail('Validation failed');
    error((err as Error).message);
    process.exit(1);
  }
}

/**
 * List available templates
 */
function listTemplates(): void {
  console.log(chalk.bold('\n📋 Available Site Templates\n'));

  for (const [name, template] of Object.entries(SITE_TEMPLATES)) {
    console.log(chalk.cyan(`  ${name}`));
    console.log(`    Description: ${getTemplateDescription(name as SiteTemplate)}`);
    console.log(`    Features: ${Object.entries(template.features).filter(([, v]) => v).map(([k]) => k).join(', ')}`);
    console.log(`    Hero style: ${template.content.hero.style}`);
    console.log('');
  }
}

/**
 * List available color palettes
 */
function listPalettes(): void {
  console.log(chalk.bold('\n🎨 Available Color Palettes\n'));

  for (const [name, palette] of Object.entries(COLOR_PALETTES)) {
    console.log(chalk.cyan(`  ${name}`));
    console.log(`    Primary:     ${chalk.hex(palette.primary)('████')} ${palette.primary}`);
    console.log(`    Secondary:   ${palette.secondary ? chalk.hex(palette.secondary)('████') + ' ' + palette.secondary : 'Not set'}`);
    console.log(`    Accent:      ${palette.accent ? chalk.hex(palette.accent)('████') + ' ' + palette.accent : 'Not set'}`);
    console.log(`    Background:  ${chalk.hex(palette.background)('████')} ${palette.background}`);
    console.log('');
  }
}

/**
 * Initialize a site in the current directory
 */
async function initSite(options: { template?: string; force?: boolean }): Promise<void> {
  const configPath = join(process.cwd(), 'site.config.json');

  // Check if config already exists
  if (!options.force && (await fileExists(configPath))) {
    error('site.config.json already exists. Use --force to overwrite.');
    process.exit(1);
  }

  // Get directory name as default slug
  const dirName = process.cwd().split('/').pop() || 'my-site';

  console.log(chalk.bold('\n🏗️  Initialize Kairn site\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'slug',
      message: 'Site slug:',
      default: dirName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    },
    {
      type: 'input',
      name: 'name',
      message: 'Site name:',
      default: dirName.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    },
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      choices: Object.keys(SITE_TEMPLATES),
      default: options.template || 'psychologist',
    },
  ]);

  const config = createConfigFromTemplate(answers.template as SiteTemplate, {
    slug: answers.slug,
    name: answers.name,
    seo: { title: answers.name },
  });

  await writeFile(configPath, formatJson(validateSiteConfig(config)), 'utf-8');

  success('Created site.config.json');
  info('Edit the configuration file to customize your site');
}

/**
 * Export configuration to different formats
 */
async function exportConfig(
  inputPath: string,
  options: { format?: string; output?: string }
): Promise<void> {
  const spinner = ora('Exporting configuration...').start();

  try {
    const content = await readFile(inputPath, 'utf-8');
    const config = validateSiteConfig(JSON.parse(content));

    let output: string;
    let extension: string;

    switch (options.format) {
      case 'env':
        output = configToEnv(config);
        extension = '.env';
        break;
      case 'ts':
        output = configToTypeScript(config);
        extension = '.ts';
        break;
      case 'json':
      default:
        output = formatJson(config);
        extension = '.json';
    }

    const outputPath = options.output || `${config.slug}.config${extension}`;
    await writeFile(outputPath, output, 'utf-8');

    spinner.succeed(`Exported to ${outputPath}`);
  } catch (err) {
    spinner.fail('Export failed');
    error((err as Error).message);
    process.exit(1);
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getTemplateDescription(template: SiteTemplate): string {
  const descriptions: Record<SiteTemplate, string> = {
    psychologist: 'Calm and professional, ideal for therapists and psychologists',
    holistic: 'Natural and organic, perfect for holistic practitioners',
    medical: 'Modern and clean, suitable for medical professionals',
    minimal: 'Simple and focused, great for personal practice sites',
  };
  return descriptions[template];
}

function configToEnv(config: SiteConfig): string {
  const lines: string[] = [
    '# Kairn Site Configuration',
    `# Generated for: ${config.name}`,
    '',
    `SITE_SLUG=${config.slug}`,
    `SITE_NAME=${config.name}`,
    config.domain ? `SITE_DOMAIN=${config.domain}` : '',
    `SITE_LOCALE=${config.locale}`,
    '',
    '# Theme',
    `SITE_PRIMARY_COLOR=${config.theme.colors.light.primary}`,
    '',
    '# Contact',
    config.contact.email ? `SITE_CONTACT_EMAIL=${config.contact.email}` : '',
    config.contact.phone ? `SITE_CONTACT_PHONE=${config.contact.phone}` : '',
    '',
    '# Integrations',
    config.integrations.googleAnalytics.measurementId
      ? `GOOGLE_ANALYTICS_ID=${config.integrations.googleAnalytics.measurementId}`
      : '',
  ];

  return lines.filter(Boolean).join('\n');
}

function configToTypeScript(config: SiteConfig): string {
  return `/**
 * Site Configuration for ${config.name}
 * Generated by @kairn/cli
 */

import type { SiteConfig } from '@kairn/core';

export const siteConfig: SiteConfig = ${formatJson(config)} as const;

export default siteConfig;
`;
}

// =============================================================================
// CLI Setup
// =============================================================================

program
  .name('kairn')
  .description('CLI tool for managing Kairn platform sites')
  .version('0.0.1');

program
  .command('create')
  .description('Create a new site configuration interactively')
  .option('-o, --output <path>', 'Output file path')
  .option('-t, --template <name>', 'Use a specific template')
  .action(createSite);

program
  .command('validate <file>')
  .description('Validate a site configuration file')
  .action(validateConfig);

program
  .command('init')
  .description('Initialize a site in the current directory')
  .option('-t, --template <name>', 'Use a specific template')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initSite);

program
  .command('export <file>')
  .description('Export configuration to different formats')
  .option('-f, --format <format>', 'Output format (json, env, ts)', 'json')
  .option('-o, --output <path>', 'Output file path')
  .action(exportConfig);

program
  .command('templates')
  .description('List available site templates')
  .action(listTemplates);

program
  .command('palettes')
  .description('List available color palettes')
  .action(listPalettes);

program.parse();
