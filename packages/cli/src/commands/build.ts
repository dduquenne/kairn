/**
 * Build Command
 *
 * Builds a Kairn site for production.
 */

import { spawn } from 'child_process';
import { join } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { error, info, header, success } from '../utils/log';
import { findProjectRoot, findSiteDir, listFiles, fileExists } from '../utils/fs';

interface BuildOptions {
  site?: string;
  turbo?: boolean;
}

/**
 * Build a site or all sites for production
 */
export async function buildCommand(options: BuildOptions): Promise<void> {
  const spinner = ora('Initializing build...').start();

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

      spinner.text = `Building ${chalk.cyan(options.site)}...`;

      // Run next build for the specific site
      const nextBin = join(projectRoot, 'node_modules', '.bin', 'next');

      const child = spawn(nextBin, ['build'], {
        cwd: siteDir,
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      child.on('error', (err) => {
        spinner.fail('Build failed');
        error(`Failed to build: ${err.message}`);
        process.exit(1);
      });

      child.on('exit', (code) => {
        if (code === 0) {
          success(`Build completed for ${options.site}`);
        }
        process.exit(code ?? 0);
      });
    } else {
      // Build all packages and sites with Turbo
      spinner.succeed('Building all packages and sites with Turbo');
      header('📦 Kairn Production Build');

      const turboBin = join(projectRoot, 'node_modules', '.bin', 'turbo');

      const child = spawn(turboBin, ['run', 'build'], {
        cwd: projectRoot,
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      child.on('error', (err) => {
        error(`Build failed: ${err.message}`);
        process.exit(1);
      });

      child.on('exit', (code) => {
        if (code === 0) {
          console.log('');
          success('Build completed successfully');
        }
        process.exit(code ?? 0);
      });
    }
  } catch (err) {
    spinner.fail('Build failed');
    error((err as Error).message);
    process.exit(1);
  }
}
