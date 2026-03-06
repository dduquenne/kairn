#!/usr/bin/env tsx
/**
 * Script de configuration des schedules QStash
 *
 * Crée les schedules récurrents sur QStash pour un site Kairn donné.
 *
 * Usage:
 *   pnpm tsx scripts/setup-qstash-schedules.ts --site-url https://psypnos.fr
 *   pnpm tsx scripts/setup-qstash-schedules.ts --site-url https://psypnos.fr --jobs social-publish,daily-report
 *
 * Options:
 *   --site-url    URL de base du site (requis)
 *   --jobs        Liste des jobs à configurer (optionnel, tous par défaut)
 *   --dry-run     Affiche les schedules sans les créer
 *
 * Prérequis:
 *   - QSTASH_TOKEN doit être défini dans l'environnement
 */

import { Client } from '@upstash/qstash';

// Configuration des jobs CRON par défaut
const DEFAULT_CRON_SCHEDULES: Record<string, string> = {
  /** Publication des posts sociaux - toutes les 5 minutes */
  'social-publish': '*/5 * * * *',

  /** Récupération des analytics sociaux - toutes les 4 heures */
  'fetch-social-analytics': '0 */4 * * *',

  /** Rafraîchissement des tokens OAuth - toutes les heures */
  'refresh-tokens': '0 * * * *',

  /** Rapport quotidien - 8h00 chaque jour */
  'daily-report': '0 8 * * *',

  /** Rapport hebdomadaire - Lundi 9h00 */
  'weekly-report': '0 9 * * 1',

  /** Nettoyage unifié (données + jobs) - 3h00 chaque jour */
  cleanup: '0 3 * * *',

  /** Snapshot quotidien des comptes sociaux - 6h00 chaque jour */
  'snapshot-social-accounts': '0 6 * * *',

  /** Agrégation des analytics - toutes les heures à :30 */
  aggregate: '30 * * * *',

  /** Vérification des alertes - toutes les 15 minutes */
  'check-alerts': '*/15 * * * *',

  /** Traitement des rapports programmés - toutes les heures à :45 */
  'process-reports': '45 * * * *',

  /** Rotation automatique des secrets JWT - 2h00 chaque jour */
  'rotate-secrets': '0 2 * * *',
};

interface ScheduleResult {
  name: string;
  scheduleId: string;
  cron: string;
  destination: string;
}

function parseArgs(): { siteUrl: string; jobs: string[]; dryRun: boolean } {
  const args = process.argv.slice(2);
  let siteUrl = '';
  let jobs: string[] = [];
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--site-url' && args[i + 1]) {
      siteUrl = args[i + 1];
      i++;
    } else if (args[i] === '--jobs' && args[i + 1]) {
      jobs = args[i + 1].split(',').map(j => j.trim());
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  if (!siteUrl) {
    console.error('Erreur: --site-url est requis');
    console.error('');
    console.error('Usage:');
    console.error('  pnpm tsx scripts/setup-qstash-schedules.ts --site-url https://example.com');
    console.error('');
    console.error('Options:');
    console.error('  --site-url    URL de base du site (requis)');
    console.error('  --jobs        Liste des jobs à configurer (optionnel, tous par défaut)');
    console.error('  --dry-run     Affiche les schedules sans les créer');
    process.exit(1);
  }

  // Valider les jobs si spécifiés
  if (jobs.length > 0) {
    const invalidJobs = jobs.filter(j => !DEFAULT_CRON_SCHEDULES[j]);
    if (invalidJobs.length > 0) {
      console.error(`Erreur: Jobs invalides: ${invalidJobs.join(', ')}`);
      console.error(`Jobs disponibles: ${Object.keys(DEFAULT_CRON_SCHEDULES).join(', ')}`);
      process.exit(1);
    }
  } else {
    jobs = Object.keys(DEFAULT_CRON_SCHEDULES);
  }

  return { siteUrl: siteUrl.replace(/\/$/, ''), jobs, dryRun };
}

async function main() {
  const { siteUrl, jobs, dryRun } = parseArgs();

  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    console.error("Erreur: QSTASH_TOKEN non défini dans l'environnement");
    process.exit(1);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Configuration des schedules QStash pour Kairn');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Site URL: ${siteUrl}`);
  console.log(`Jobs à configurer: ${jobs.length}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (simulation)' : 'PRODUCTION'}`);
  console.log('');

  if (dryRun) {
    console.log('Schedules qui seraient créés:');
    console.log('-'.repeat(60));

    for (const jobName of jobs) {
      const cron = DEFAULT_CRON_SCHEDULES[jobName];
      const destination = `${siteUrl}/api/cron/${jobName}`;
      console.log(`\n  ${jobName}`);
      console.log(`    CRON: ${cron}`);
      console.log(`    URL:  ${destination}`);
    }

    console.log('');
    console.log('Pour créer les schedules, exécutez sans --dry-run');
    return;
  }

  const client = new Client({ token });
  const results: ScheduleResult[] = [];
  const errors: Array<{ name: string; error: string }> = [];

  console.log('Création des schedules...');
  console.log('-'.repeat(60));

  for (const jobName of jobs) {
    const cron = DEFAULT_CRON_SCHEDULES[jobName];
    const destination = `${siteUrl}/api/cron/${jobName}`;

    try {
      const result = await client.schedules.create({
        destination,
        cron,
        retries: 3,
        method: 'GET',
      });

      results.push({
        name: jobName,
        scheduleId: result.scheduleId,
        cron,
        destination,
      });

      console.log(`  ✓ ${jobName} - ID: ${result.scheduleId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      errors.push({ name: jobName, error: message });
      console.log(`  ✗ ${jobName} - Erreur: ${message}`);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Résumé');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Créés:  ${results.length}/${jobs.length}`);
  console.log(`Échecs: ${errors.length}/${jobs.length}`);

  if (results.length > 0) {
    console.log('');
    console.log('Schedules créés:');
    console.log('-'.repeat(60));
    console.log('');
    console.log('| Job | Schedule ID | CRON |');
    console.log('|-----|-------------|------|');
    for (const r of results) {
      console.log(`| ${r.name} | ${r.scheduleId} | ${r.cron} |`);
    }
  }

  if (errors.length > 0) {
    console.log('');
    console.log('Échecs:');
    for (const e of errors) {
      console.log(`  - ${e.name}: ${e.error}`);
    }
    process.exit(1);
  }

  console.log('');
  console.log('Configuration terminée avec succès!');
}

main().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
