/**
 * Database Commands
 *
 * Commands for managing the Kairn database.
 */

import { spawn } from 'child_process';
import { join } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { error, info, header, success, warning } from '../utils/log';
import { findProjectRoot, fileExists } from '../utils/fs';

interface MigrateOptions {
  name?: string;
  deploy?: boolean;
}

interface SeedOptions {
  reset?: boolean;
}

/**
 * Get the database package directory
 */
async function getDbPackageDir(projectRoot: string): Promise<string> {
  const dbDir = join(projectRoot, 'packages', 'db');
  const prismaSchema = join(dbDir, 'prisma', 'schema.prisma');

  if (!(await fileExists(prismaSchema))) {
    throw new Error('Database package not found. Expected packages/db/prisma/schema.prisma');
  }

  return dbDir;
}

/**
 * Run database migrations
 */
export async function migrateCommand(options: MigrateOptions): Promise<void> {
  const spinner = ora('Initializing database migration...').start();

  try {
    const projectRoot = await findProjectRoot();

    if (!projectRoot) {
      spinner.fail('Not in a Kairn project');
      error('Could not find Kairn project root.');
      process.exit(1);
    }

    const dbDir = await getDbPackageDir(projectRoot);
    const prismaBin = join(projectRoot, 'node_modules', '.bin', 'prisma');

    if (options.deploy) {
      // Production migration deployment
      spinner.text = 'Deploying migrations to production...';
      header('📦 Kairn Database Migration (Deploy)');

      const child = spawn(prismaBin, ['migrate', 'deploy'], {
        cwd: dbDir,
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      child.on('error', (err) => {
        spinner.fail('Migration deployment failed');
        error(err.message);
        process.exit(1);
      });

      child.on('exit', (code) => {
        if (code === 0) {
          success('Migration deployment completed');
        }
        process.exit(code ?? 0);
      });
    } else {
      // Development migration
      spinner.succeed('Running development migration');
      header('📦 Kairn Database Migration (Dev)');

      const args = ['migrate', 'dev'];

      if (options.name) {
        args.push('--name', options.name);
      }

      const child = spawn(prismaBin, args, {
        cwd: dbDir,
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      child.on('error', (err) => {
        error(`Migration failed: ${err.message}`);
        process.exit(1);
      });

      child.on('exit', (code) => {
        if (code === 0) {
          success('Migration completed');
        }
        process.exit(code ?? 0);
      });
    }
  } catch (err) {
    spinner.fail('Migration failed');
    error((err as Error).message);
    process.exit(1);
  }
}

/**
 * Push schema changes without creating a migration
 */
export async function pushCommand(): Promise<void> {
  const spinner = ora('Pushing schema changes...').start();

  try {
    const projectRoot = await findProjectRoot();

    if (!projectRoot) {
      spinner.fail('Not in a Kairn project');
      error('Could not find Kairn project root.');
      process.exit(1);
    }

    const dbDir = await getDbPackageDir(projectRoot);
    const prismaBin = join(projectRoot, 'node_modules', '.bin', 'prisma');

    spinner.succeed('Pushing schema to database');
    header('📦 Kairn Database Push');
    warning('This command should only be used in development!');
    console.log('');

    const child = spawn(prismaBin, ['db', 'push'], {
      cwd: dbDir,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    child.on('error', (err) => {
      error(`Push failed: ${err.message}`);
      process.exit(1);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        success('Schema push completed');
      }
      process.exit(code ?? 0);
    });
  } catch (err) {
    spinner.fail('Push failed');
    error((err as Error).message);
    process.exit(1);
  }
}

/**
 * Seed the database with initial data
 */
export async function seedCommand(options: SeedOptions): Promise<void> {
  const spinner = ora('Initializing database seed...').start();

  try {
    const projectRoot = await findProjectRoot();

    if (!projectRoot) {
      spinner.fail('Not in a Kairn project');
      error('Could not find Kairn project root.');
      process.exit(1);
    }

    const dbDir = await getDbPackageDir(projectRoot);
    const tsxBin = join(projectRoot, 'node_modules', '.bin', 'tsx');
    const seedFile = join(dbDir, 'src', 'seed.ts');

    if (!(await fileExists(seedFile))) {
      spinner.fail('Seed file not found');
      error('Expected packages/db/src/seed.ts');
      process.exit(1);
    }

    if (options.reset) {
      spinner.text = 'Resetting database...';
      header('📦 Kairn Database Reset & Seed');
      warning('This will reset the database and seed fresh data!');
      console.log('');

      const prismaBin = join(projectRoot, 'node_modules', '.bin', 'prisma');

      // First reset
      const resetChild = spawn(prismaBin, ['migrate', 'reset', '--force'], {
        cwd: dbDir,
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      resetChild.on('error', (err) => {
        error(`Reset failed: ${err.message}`);
        process.exit(1);
      });

      resetChild.on('exit', (code) => {
        if (code !== 0) {
          process.exit(code ?? 1);
        }
        success('Database reset completed');
      });
    } else {
      spinner.succeed('Running database seed');
      header('🌱 Kairn Database Seed');

      const child = spawn(tsxBin, [seedFile], {
        cwd: dbDir,
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      child.on('error', (err) => {
        error(`Seed failed: ${err.message}`);
        process.exit(1);
      });

      child.on('exit', (code) => {
        if (code === 0) {
          success('Database seeded successfully');
        }
        process.exit(code ?? 0);
      });
    }
  } catch (err) {
    spinner.fail('Seed failed');
    error((err as Error).message);
    process.exit(1);
  }
}

/**
 * Generate Prisma client
 */
export async function generateCommand(): Promise<void> {
  const spinner = ora('Generating Prisma client...').start();

  try {
    const projectRoot = await findProjectRoot();

    if (!projectRoot) {
      spinner.fail('Not in a Kairn project');
      error('Could not find Kairn project root.');
      process.exit(1);
    }

    const dbDir = await getDbPackageDir(projectRoot);
    const prismaBin = join(projectRoot, 'node_modules', '.bin', 'prisma');

    const child = spawn(prismaBin, ['generate'], {
      cwd: dbDir,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    child.on('error', (err) => {
      spinner.fail('Generate failed');
      error(err.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        spinner.succeed('Prisma client generated');
      }
      process.exit(code ?? 0);
    });
  } catch (err) {
    spinner.fail('Generate failed');
    error((err as Error).message);
    process.exit(1);
  }
}

/**
 * Open Prisma Studio
 */
export async function studioCommand(): Promise<void> {
  const spinner = ora('Opening Prisma Studio...').start();

  try {
    const projectRoot = await findProjectRoot();

    if (!projectRoot) {
      spinner.fail('Not in a Kairn project');
      error('Could not find Kairn project root.');
      process.exit(1);
    }

    const dbDir = await getDbPackageDir(projectRoot);
    const prismaBin = join(projectRoot, 'node_modules', '.bin', 'prisma');

    spinner.succeed('Launching Prisma Studio');
    info('Opening database browser at http://localhost:5555');

    const child = spawn(prismaBin, ['studio'], {
      cwd: dbDir,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    child.on('error', (err) => {
      error(`Failed to open studio: ${err.message}`);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code ?? 0);
    });
  } catch (err) {
    spinner.fail('Failed to open studio');
    error((err as Error).message);
    process.exit(1);
  }
}
