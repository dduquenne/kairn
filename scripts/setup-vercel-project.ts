#!/usr/bin/env tsx
/**
 * Script de création et configuration d'un projet Vercel pour un site Kairn.
 *
 * Crée le projet sur Vercel, configure le Root Directory, les commandes de build,
 * et prépare les variables d'environnement.
 *
 * Usage:
 *   pnpm tsx scripts/setup-vercel-project.ts --app avv --project-name kairn-avv
 *   pnpm tsx scripts/setup-vercel-project.ts --app avv --project-name kairn-avv --dry-run
 *
 * Options:
 *   --app            Nom de l'app dans apps/ (requis)
 *   --project-name   Nom du projet Vercel (requis)
 *   --team-id        ID de l'équipe Vercel (optionnel)
 *   --dry-run        Affiche la configuration sans créer le projet
 *
 * Prérequis:
 *   - VERCEL_TOKEN doit être défini dans l'environnement
 *   - Vercel CLI installé (npm i -g vercel)
 */

import * as fs from 'fs';
import * as path from 'path';

const VERCEL_API_BASE = 'https://api.vercel.com';

interface VercelProjectConfig {
  name: string;
  framework: 'nextjs';
  rootDirectory: string;
  buildCommand: string;
  installCommand: string;
  outputDirectory: string;
  serverlessFunctionRegion: string;
}

interface EnvVarConfig {
  key: string;
  description: string;
  required: boolean;
  generateCommand?: string;
}

/** Variables d'environnement requises pour le déploiement */
const REQUIRED_ENV_VARS: EnvVarConfig[] = [
  { key: 'DATABASE_URL', description: 'URL de connexion PostgreSQL', required: true },
  {
    key: 'JWT_SECRET',
    description: 'Secret JWT (min 32 chars)',
    required: true,
    generateCommand: 'openssl rand -base64 32',
  },
  {
    key: 'JWT_ACCESS_SECRET',
    description: 'Secret access token',
    required: true,
    generateCommand: 'openssl rand -base64 32',
  },
  {
    key: 'JWT_REFRESH_SECRET',
    description: 'Secret refresh token',
    required: true,
    generateCommand: 'openssl rand -base64 32',
  },
  {
    key: 'JWT_PASSWORD_RESET_SECRET',
    description: 'Secret password reset token',
    required: true,
    generateCommand: 'openssl rand -base64 32',
  },
  {
    key: 'CSRF_SECRET',
    description: 'Secret CSRF (distinct de JWT_SECRET)',
    required: true,
    generateCommand: 'openssl rand -base64 32',
  },
  {
    key: 'SECRETS_ENCRYPTION_KEY',
    description: 'Clé chiffrement secrets DB',
    required: true,
    generateCommand: 'openssl rand -hex 32',
  },
  { key: 'RESEND_API_KEY', description: 'Clé API Resend (email)', required: true },
  { key: 'SUPABASE_URL', description: 'URL Supabase (storage)', required: false },
  { key: 'SUPABASE_ANON_KEY', description: 'Clé anonyme Supabase', required: false },
  { key: 'SUPABASE_SERVICE_KEY', description: 'Clé service Supabase', required: false },
  { key: 'OPENAI_API_KEY', description: 'Clé API OpenAI (IA)', required: false },
  { key: 'ANTHROPIC_API_KEY', description: 'Clé API Anthropic (IA)', required: false },
  {
    key: 'SOCIAL_ENCRYPTION_KEY',
    description: 'Clé chiffrement tokens sociaux',
    required: false,
    generateCommand: 'openssl rand -base64 32',
  },
  {
    key: 'IP_HASH_SECRET',
    description: 'Secret hachage IP analytics',
    required: true,
    generateCommand: 'openssl rand -base64 32',
  },
  {
    key: 'CRON_SECRET',
    description: 'Secret endpoints CRON',
    required: true,
    generateCommand: 'openssl rand -base64 32',
  },
  { key: 'QSTASH_TOKEN', description: 'Token QStash (scheduling)', required: true },
  {
    key: 'QSTASH_CURRENT_SIGNING_KEY',
    description: 'Clé signature QStash courante',
    required: true,
  },
  {
    key: 'QSTASH_NEXT_SIGNING_KEY',
    description: 'Clé signature QStash suivante',
    required: true,
  },
  { key: 'REDIS_URL', description: 'URL Redis (cache/rate limiting)', required: false },
  { key: 'VAPID_PUBLIC_KEY', description: 'Clé publique VAPID (push)', required: false },
  { key: 'VAPID_PRIVATE_KEY', description: 'Clé privée VAPID (push)', required: false },
  { key: 'NEXT_PUBLIC_APP_URL', description: 'URL publique du site', required: true },
];

/**
 * Construit la configuration du projet Vercel pour une app Kairn
 */
function buildProjectConfig(appName: string, projectName: string): VercelProjectConfig {
  return {
    name: projectName,
    framework: 'nextjs',
    rootDirectory: `apps/${appName}`,
    buildCommand: `cd ../.. && pnpm --filter @kairn/db exec prisma generate && pnpm turbo run build --filter=@kairn/${appName} --env-mode=loose`,
    installCommand: 'pnpm install',
    outputDirectory: '.next',
    serverlessFunctionRegion: 'cdg1',
  };
}

/**
 * Crée le projet sur Vercel via l'API
 */
async function createVercelProject(
  config: VercelProjectConfig,
  token: string,
  teamId?: string
): Promise<{ id: string; name: string }> {
  const url = new URL(`${VERCEL_API_BASE}/v10/projects`);
  if (teamId) {
    url.searchParams.set('teamId', teamId);
  }

  const body = {
    name: config.name,
    framework: config.framework,
    rootDirectory: config.rootDirectory,
    buildCommand: config.buildCommand,
    installCommand: config.installCommand,
    outputDirectory: config.outputDirectory,
    serverlessFunctionRegion: config.serverlessFunctionRegion,
    gitRepository: undefined,
  };

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur Vercel API (${response.status}): ${JSON.stringify(error)}`);
  }

  const project = await response.json();
  return { id: project.id, name: project.name };
}

/**
 * Configure une variable d'environnement sur le projet Vercel
 */
async function setEnvVar(
  projectId: string,
  key: string,
  value: string,
  targets: string[],
  token: string,
  teamId?: string
): Promise<void> {
  const url = new URL(`${VERCEL_API_BASE}/v10/projects/${projectId}/env`);
  if (teamId) {
    url.searchParams.set('teamId', teamId);
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      value,
      target: targets,
      type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`  Erreur pour ${key}: ${JSON.stringify(error)}`);
  }
}

/**
 * Écrit le fichier .vercel/project.json local pour lier le projet
 */
function writeProjectLink(appDir: string, orgId: string, projectId: string): void {
  const vercelDir = path.join(appDir, '.vercel');
  if (!fs.existsSync(vercelDir)) {
    fs.mkdirSync(vercelDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(vercelDir, 'project.json'),
    JSON.stringify({ orgId, projectId }, null, 2) + '\n'
  );
}

// --- CLI ---
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let appName = '';
  let projectName = '';
  let teamId = '';
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--app' && args[i + 1]) {
      appName = args[i + 1];
      i++;
    } else if (args[i] === '--project-name' && args[i + 1]) {
      projectName = args[i + 1];
      i++;
    } else if (args[i] === '--team-id' && args[i + 1]) {
      teamId = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  if (!appName || !projectName) {
    console.error('Usage: pnpm tsx scripts/setup-vercel-project.ts --app <app> --project-name <name>');
    console.error('  --app            Nom de l\'app dans apps/ (ex: avv)');
    console.error('  --project-name   Nom du projet Vercel (ex: kairn-avv)');
    console.error('  --team-id        ID équipe Vercel (optionnel)');
    console.error('  --dry-run        Affiche sans créer');
    process.exit(1);
  }

  // Vérifier que l'app existe
  const appDir = path.resolve(`apps/${appName}`);
  if (!fs.existsSync(appDir)) {
    console.error(`App introuvable : ${appDir}`);
    process.exit(1);
  }

  // Vérifier que vercel.json existe
  const vercelJsonPath = path.join(appDir, 'vercel.json');
  if (!fs.existsSync(vercelJsonPath)) {
    console.error(`vercel.json introuvable : ${vercelJsonPath}`);
    process.exit(1);
  }

  const config = buildProjectConfig(appName, projectName);

  console.log('\n📋 Configuration du projet Vercel :\n');
  console.log(`   Nom du projet    : ${config.name}`);
  console.log(`   Framework        : ${config.framework}`);
  console.log(`   Root Directory   : ${config.rootDirectory}`);
  console.log(`   Build Command    : ${config.buildCommand}`);
  console.log(`   Install Command  : ${config.installCommand}`);
  console.log(`   Output Directory : ${config.outputDirectory}`);
  console.log(`   Région           : ${config.serverlessFunctionRegion} (Paris)`);
  if (teamId) {
    console.log(`   Team ID          : ${teamId}`);
  }

  console.log('\n📦 Variables d\'environnement requises :\n');
  const required = REQUIRED_ENV_VARS.filter(v => v.required);
  const optional = REQUIRED_ENV_VARS.filter(v => !v.required);

  console.log('   Requises :');
  for (const v of required) {
    const gen = v.generateCommand ? ` (générer: ${v.generateCommand})` : '';
    console.log(`   ✓ ${v.key} — ${v.description}${gen}`);
  }

  console.log('\n   Optionnelles :');
  for (const v of optional) {
    const gen = v.generateCommand ? ` (générer: ${v.generateCommand})` : '';
    console.log(`   ○ ${v.key} — ${v.description}${gen}`);
  }

  if (dryRun) {
    console.log('\n🔍 Mode dry-run — aucune action effectuée.\n');
    console.log('Pour créer le projet, relancez sans --dry-run avec VERCEL_TOKEN défini.\n');
    return;
  }

  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    console.error('\n❌ VERCEL_TOKEN non défini dans l\'environnement.');
    console.error('   Créez un token : https://vercel.com/account/tokens');
    console.error('   Puis : export VERCEL_TOKEN="votre-token"\n');
    process.exit(1);
  }

  console.log('\n🚀 Création du projet sur Vercel...\n');

  try {
    const project = await createVercelProject(config, token, teamId || undefined);
    console.log(`   ✅ Projet créé : ${project.name} (ID: ${project.id})`);

    // Récupérer l'org ID
    const meUrl = new URL(`${VERCEL_API_BASE}/v2/user`);
    const meResponse = await fetch(meUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meResponse.json();
    const orgId = teamId || meData.user?.id || '';

    // Écrire le fichier project.json local
    writeProjectLink(appDir, orgId, project.id);
    console.log(`   ✅ Fichier .vercel/project.json créé dans ${appDir}`);

    // Configurer NODE_ENV et NEXT_PUBLIC_APP_URL
    console.log('\n📝 Configuration des variables d\'environnement de base...\n');

    await setEnvVar(
      project.id,
      'NODE_ENV',
      'production',
      ['production'],
      token,
      teamId || undefined
    );
    console.log('   ✅ NODE_ENV=production (production)');

    await setEnvVar(
      project.id,
      'NODE_ENV',
      'preview',
      ['preview'],
      token,
      teamId || undefined
    );
    console.log('   ✅ NODE_ENV=preview (preview)');

    console.log('\n✅ Projet créé avec succès !\n');
    console.log('Prochaines étapes :');
    console.log('  1. Configurez les variables d\'environnement dans Vercel Dashboard :');
    console.log(`     https://vercel.com/${teamId ? `teams/${teamId}` : 'dashboard'}/${project.name}/settings/environment-variables`);
    console.log('  2. Connectez le repository GitHub (Settings > Git)');
    console.log('  3. Configurez le domaine personnalisé (Settings > Domains)');
    console.log('  4. Configurez les schedules QStash :');
    console.log(`     pnpm tsx scripts/setup-qstash-schedules.ts --site-url https://appreciezvotrevie.fr`);
    console.log('  5. Lancez le premier déploiement :');
    console.log(`     cd apps/${appName} && vercel --prod\n`);
  } catch (error) {
    console.error(`\n❌ Erreur : ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  }
}

main();
