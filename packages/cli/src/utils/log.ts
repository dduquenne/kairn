/**
 * CLI Logging Utilities
 */

import chalk from 'chalk';

export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function error(message: string): void {
  console.log(chalk.red('✗'), message);
}

export function warning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function step(message: string): void {
  console.log(chalk.gray('→'), message);
}

export function header(message: string): void {
  console.log('\n' + chalk.bold(message) + '\n');
}

export function formatJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}
