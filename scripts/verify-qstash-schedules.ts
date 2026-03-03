#!/usr/bin/env tsx
/**
 * Script de vérification des schedules QStash
 *
 * Liste et vérifie les schedules actifs sur QStash pour s'assurer
 * que tous les endpoints CRON requis sont programmés.
 *
 * Usage:
 *   pnpm tsx scripts/verify-qstash-schedules.ts
 *   pnpm tsx scripts/verify-qstash-schedules.ts --site-url https://psypnos.fr
 *
 * Options:
 *   --site-url    Filtrer par URL de base du site (optionnel)
 *   --verbose     Afficher les détails de chaque schedule
 *
 * Prérequis:
 *   - QSTASH_TOKEN doit être défini dans l'environnement
 */

import { Client } from '@upstash/qstash';

// Jobs requis pour un site Kairn fonctionnel
const REQUIRED_JOBS = [
  'social-publish',
  'fetch-social-analytics',
  'refresh-tokens',
  'daily-report',
  'weekly-report',
  'cleanup',
  'snapshot-social-accounts',
  'aggregate',
  'check-alerts',
  'process-reports',
];

interface Schedule {
  scheduleId: string;
  cron: string;
  destination: string;
  createdAt: number;
  isPaused: boolean;
}

function parseArgs(): { siteUrl?: string; verbose: boolean } {
  const args = process.argv.slice(2);
  let siteUrl: string | undefined;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--site-url' && args[i + 1]) {
      siteUrl = args[i + 1].replace(/\/$/, '');
      i++;
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      verbose = true;
    }
  }

  return { siteUrl, verbose };
}

function extractJobName(destination: string): string | null {
  const match = destination.match(/\/api\/cron\/([a-z-]+)/);
  return match ? match[1] : null;
}

async function main() {
  const { siteUrl, verbose } = parseArgs();

  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    console.error("Erreur: QSTASH_TOKEN non défini dans l'environnement");
    process.exit(1);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Vérification des schedules QStash');
  console.log('='.repeat(60));
  console.log('');

  if (siteUrl) {
    console.log(`Filtrage par site: ${siteUrl}`);
  }
  console.log('');

  const client = new Client({ token });

  try {
    const schedules = await client.schedules.list();

    // Filtrer par site si spécifié
    const filteredSchedules: Schedule[] = siteUrl
      ? schedules.filter(s => s.destination.startsWith(siteUrl))
      : schedules;

    console.log(`Schedules trouvés: ${filteredSchedules.length}`);
    console.log('-'.repeat(60));

    if (filteredSchedules.length === 0) {
      console.log('');
      console.log('Aucun schedule trouvé.');
      if (siteUrl) {
        console.log(`Vérifiez l'URL du site: ${siteUrl}`);
      }
      console.log('');
      console.log('Pour créer les schedules, exécutez:');
      console.log(
        `  pnpm tsx scripts/setup-qstash-schedules.ts --site-url ${siteUrl || 'https://votre-site.fr'}`
      );
      process.exit(1);
    }

    // Grouper par site
    const schedulesBySite = new Map<string, Schedule[]>();
    for (const schedule of filteredSchedules) {
      try {
        const url = new URL(schedule.destination);
        const site = `${url.protocol}//${url.host}`;
        if (!schedulesBySite.has(site)) {
          schedulesBySite.set(site, []);
        }
        schedulesBySite.get(site)!.push(schedule);
      } catch {
        // URL invalide, ignorer
      }
    }

    // Afficher par site
    for (const [site, siteSchedules] of schedulesBySite) {
      console.log('');
      console.log(`Site: ${site}`);
      console.log('─'.repeat(50));

      // Extraire les jobs configurés
      const configuredJobs = new Set<string>();
      for (const schedule of siteSchedules) {
        const jobName = extractJobName(schedule.destination);
        if (jobName) {
          configuredJobs.add(jobName);
        }
      }

      // Vérifier les jobs requis
      const missingJobs = REQUIRED_JOBS.filter(j => !configuredJobs.has(j));
      const extraJobs = [...configuredJobs].filter(j => !REQUIRED_JOBS.includes(j));

      // Afficher les schedules
      if (verbose) {
        console.log('');
        console.log('Schedules actifs:');
        for (const schedule of siteSchedules) {
          const jobName = extractJobName(schedule.destination) || 'unknown';
          const status = schedule.isPaused ? '(PAUSED)' : '';
          console.log(`  • ${jobName} ${status}`);
          console.log(`    ID: ${schedule.scheduleId}`);
          console.log(`    CRON: ${schedule.cron}`);
          console.log(`    Créé: ${new Date(schedule.createdAt).toISOString()}`);
        }
      } else {
        console.log('');
        console.log(`Jobs configurés (${configuredJobs.size}/${REQUIRED_JOBS.length}):`);
        for (const job of REQUIRED_JOBS) {
          const status = configuredJobs.has(job) ? '✓' : '✗';
          const schedule = siteSchedules.find(s => extractJobName(s.destination) === job);
          const paused = schedule?.isPaused ? ' (PAUSED)' : '';
          console.log(`  ${status} ${job}${paused}`);
        }
      }

      // Alertes
      if (missingJobs.length > 0) {
        console.log('');
        console.log('⚠️  Jobs manquants:');
        for (const job of missingJobs) {
          console.log(`    - ${job}`);
        }
      }

      if (extraJobs.length > 0) {
        console.log('');
        console.log('ℹ️  Jobs supplémentaires:');
        for (const job of extraJobs) {
          console.log(`    - ${job}`);
        }
      }

      // Vérifier les schedules en pause
      const pausedSchedules = siteSchedules.filter(s => s.isPaused);
      if (pausedSchedules.length > 0) {
        console.log('');
        console.log('⚠️  Schedules en pause:');
        for (const schedule of pausedSchedules) {
          const jobName = extractJobName(schedule.destination) || 'unknown';
          console.log(`    - ${jobName} (${schedule.scheduleId})`);
        }
      }

      // Résumé du site
      console.log('');
      if (missingJobs.length === 0) {
        console.log(`✅ ${site}: Tous les jobs requis sont configurés`);
      } else {
        console.log(`❌ ${site}: ${missingJobs.length} job(s) manquant(s)`);
      }
    }

    // Résumé global
    console.log('');
    console.log('='.repeat(60));
    console.log('Résumé global');
    console.log('='.repeat(60));
    console.log(`Sites: ${schedulesBySite.size}`);
    console.log(`Schedules totaux: ${filteredSchedules.length}`);

    // Vérifier s'il y a des problèmes
    let hasIssues = false;
    for (const [site, siteSchedules] of schedulesBySite) {
      const configuredJobs = new Set<string>();
      for (const schedule of siteSchedules) {
        const jobName = extractJobName(schedule.destination);
        if (jobName) configuredJobs.add(jobName);
      }
      const missingJobs = REQUIRED_JOBS.filter(j => !configuredJobs.has(j));
      const pausedSchedules = siteSchedules.filter(s => s.isPaused);
      if (missingJobs.length > 0 || pausedSchedules.length > 0) {
        hasIssues = true;
        break;
      }
    }

    if (hasIssues) {
      console.log('');
      console.log('⚠️  Des problèmes ont été détectés. Vérifiez les détails ci-dessus.');
      process.exit(1);
    } else {
      console.log('');
      console.log('✅ Tous les schedules sont correctement configurés.');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des schedules:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
