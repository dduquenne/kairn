/**
 * Dev Command
 *
 * Launches the development server for a Kairn site.
 */

import { spawn } from 'child_process';
import { join } from 'path';

import chalk from 'chalk';
import ora from 'ora';

import { findProjectRoot, findSiteDir, fileExists, listFiles } from '../utils/fs';
import { error, info, header } from '../utils/log';

interface DevOptions {
  site?: string;
  port?: string;
  turbo?: boolean;
}

/**
 * Run development server for a specific site or all sites
 */
export async function devCommand(options: DevOptions): Promise<void> {
  const spinner = ora('Initializing development server...').start();

  try {
    const projectRoot = await findProjectRoot();

    if (!projectRoot) {
      spinner.fail('Not in a Kairn project');
      error('Could not find Kairn project root. Make sure you are in a Kairn monorepo.');
      process.exit(1);
    }

    // If a specific site is requested
    if (options.site) {
      const siteDir = await findSiteDir(options.site, projectRoot);

      if (!siteDir) {
        spinner.fail(`Site not found: ${options.site}`);
        const apps = await listFiles(join(projectRoot, 'apps'));
        if (apps.length > 0) {
          info(`Available sites: ${apps.join(', ')}`);
        }
        process.exit(1);
      }

      spinner.succeed(`Starting development server for ${chalk.cyan(options.site)}`);
      header(`🚀 Kairn Dev Server - ${options.site}`);

      // Run next dev for the specific site
      const nextBin = join(projectRoot, 'node_modules', '.bin', 'next');
      const args = ['dev'];

      if (options.port) {
        args.push('-p', options.port);
      }

      const child = spawn(nextBin, args, {
        cwd: siteDir,
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      child.on('error', (err) => {
        error(`Failed to start dev server: ${err.message}`);
        process.exit(1);
      });

      child.on('exit', (code) => {
        process.exit(code ?? 0);
      });
    } else if (options.turbo) {
      // Run turbo dev for all sites
      spinner.succeed('Starting development servers with Turbo');
      header('🚀 Kairn Dev Server - All Sites');

      const turboBin = join(projectRoot, 'node_modules', '.bin', 'turbo');

      const child = spawn(turboBin, ['run', 'dev'], {
        cwd: projectRoot,
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      child.on('error', (err) => {
        error(`Failed to start dev server: ${err.message}`);
        process.exit(1);
      });

      child.on('exit', (code) => {
        process.exit(code ?? 0);
      });
    } else {
      // List available sites and prompt
      spinner.stop();
      const apps = await listFiles(join(projectRoot, 'apps'));
      const validApps: string[] = [];

      for (const app of apps) {
        const packageJson = join(projectRoot, 'apps', app, 'package.json');
        if (await fileExists(packageJson)) {
          validApps.push(app);
        }
      }

      if (validApps.length === 0) {
        error('No sites found in apps/ directory');
        info('Create a new site with: kairn init <site-name>');
        process.exit(1);
      }

      header('🚀 Kairn Dev Server');
      info('Available sites:');
      validApps.forEach((app) => {
        console.log(`  ${chalk.cyan('•')} ${app}`);
      });

      console.log('');
      info('Usage:');
      console.log(`  ${chalk.gray('$')} kairn dev --site <name>  ${chalk.gray('# Start a specific site')}`);
      console.log(`  ${chalk.gray('$')} kairn dev --turbo       ${chalk.gray('# Start all sites with Turbo')}`);
    }
  } catch (err) {
    spinner.fail('Failed to start development server');
    error((err as Error).message);
    process.exit(1);
  }
}
