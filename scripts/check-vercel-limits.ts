/**
 * Script de vérification des limites Vercel avant déploiement.
 *
 * Vérifie que le build Next.js ne dépasse pas les limites du plan Vercel,
 * notamment le nombre de Serverless Functions (12 max sur Hobby, illimité sur Pro).
 *
 * Usage :
 *   pnpm tsx scripts/check-vercel-limits.ts --app psypnos [--plan pro]
 */

import * as fs from 'fs';
import * as path from 'path';

const VERCEL_LIMITS = {
  hobby: {
    maxServerlessFunctions: 12,
    maxEdgeFunctions: 1,
    maxFunctionSizeMB: 50,
    label: 'Hobby',
  },
  pro: {
    maxServerlessFunctions: Infinity,
    maxEdgeFunctions: Infinity,
    maxFunctionSizeMB: 250,
    label: 'Pro',
  },
} as const;

type Plan = keyof typeof VERCEL_LIMITS;

interface CheckResult {
  ok: boolean;
  serverlessFunctionCount: number;
  edgeFunctionCount: number;
  maxFunctionSizeMB: number;
  plan: Plan;
  errors: string[];
  warnings: string[];
}

/**
 * Compte les Serverless Functions dans le build Next.js
 */
function countFunctions(nextOutputDir: string): {
  serverless: number;
  edge: number;
  maxSizeMB: number;
} {
  const serverDir = path.join(nextOutputDir, 'server', 'app');
  let serverless = 0;
  let edge = 0;
  let maxSizeMB = 0;

  if (!fs.existsSync(serverDir)) {
    console.error(`Répertoire introuvable : ${serverDir}`);
    console.error("Exécutez d'abord : pnpm turbo run build --filter=@kairn/<app>");
    process.exit(1);
  }

  /**
   * Parcourt récursivement le répertoire pour compter les fichiers route.js et page.js
   */
  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === 'route.js' || entry.name === 'page.js') {
        // Vérifier si c'est un fichier dynamique (Serverless Function)
        const nftPath = `${fullPath}.nft.json`;
        if (fs.existsSync(nftPath)) {
          serverless++;

          // Estimer la taille via le fichier nft.json
          try {
            const nft = JSON.parse(fs.readFileSync(nftPath, 'utf-8'));
            const files: string[] = nft.files || [];
            let totalSize = 0;
            const base = path.dirname(nftPath);
            for (const f of files) {
              try {
                totalSize += fs.statSync(path.join(base, f)).size;
              } catch {
                // fichier non trouvé, ignorer
              }
            }
            const sizeMB = totalSize / 1024 / 1024;
            if (sizeMB > maxSizeMB) {
              maxSizeMB = sizeMB;
            }
          } catch {
            // Erreur de parsing, ignorer
          }
        }
      }
    }
  }

  // Vérifier les Edge Functions
  const edgeDir = path.join(nextOutputDir, 'server', 'edge');
  if (fs.existsSync(edgeDir)) {
    const middlewareManifest = path.join(nextOutputDir, 'server', 'middleware-manifest.json');
    if (fs.existsSync(middlewareManifest)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(middlewareManifest, 'utf-8'));
        edge = Object.keys(manifest.middleware || {}).length;
      } catch {
        // Erreur de parsing
      }
    }
  }

  walk(serverDir);
  return { serverless, edge, maxSizeMB: Math.round(maxSizeMB * 10) / 10 };
}

/**
 * Vérifie les limites Vercel pour le build
 */
function checkLimits(appName: string, plan: Plan): CheckResult {
  const nextOutputDir = path.resolve(`apps/${appName}/.next`);
  const limits = VERCEL_LIMITS[plan];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(nextOutputDir)) {
    return {
      ok: false,
      serverlessFunctionCount: 0,
      edgeFunctionCount: 0,
      maxFunctionSizeMB: 0,
      plan,
      errors: [`Build introuvable : ${nextOutputDir}. Exécutez le build d'abord.`],
      warnings: [],
    };
  }

  const { serverless, edge, maxSizeMB } = countFunctions(nextOutputDir);

  if (serverless > limits.maxServerlessFunctions) {
    errors.push(
      `Nombre de Serverless Functions (${serverless}) dépasse la limite du plan ${limits.label} (${limits.maxServerlessFunctions}). ` +
        'Passez au plan Pro ou réduisez le nombre de routes dynamiques.'
    );
  }

  if (edge > limits.maxEdgeFunctions) {
    errors.push(
      `Nombre d'Edge Functions (${edge}) dépasse la limite du plan ${limits.label} (${limits.maxEdgeFunctions}).`
    );
  }

  if (maxSizeMB > limits.maxFunctionSizeMB) {
    errors.push(
      `Plus grande fonction (${maxSizeMB} MB) dépasse la limite du plan ${limits.label} (${limits.maxFunctionSizeMB} MB).`
    );
  }

  // Warnings pour le plan Pro
  if (plan === 'pro' && maxSizeMB > 200) {
    warnings.push(
      `Plus grande fonction (${maxSizeMB} MB) approche de la limite de 250 MB. Envisagez d'optimiser les imports.`
    );
  }

  if (plan === 'hobby' && serverless > 10) {
    warnings.push(
      `${serverless} Serverless Functions détectées. Le plan Hobby est limité à 12. Passez au plan Pro.`
    );
  }

  return {
    ok: errors.length === 0,
    serverlessFunctionCount: serverless,
    edgeFunctionCount: edge,
    maxFunctionSizeMB: maxSizeMB,
    plan,
    errors,
    warnings,
  };
}

// --- CLI ---
const args = process.argv.slice(2);
let appName = 'psypnos';
let plan: Plan = 'hobby';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--app' && args[i + 1]) {
    appName = args[i + 1];
    i++;
  } else if (args[i] === '--plan' && args[i + 1]) {
    plan = args[i + 1] as Plan;
    i++;
  }
}

if (!(plan in VERCEL_LIMITS)) {
  console.error(`Plan inconnu : ${plan}. Utilisez 'hobby' ou 'pro'.`);
  process.exit(1);
}

console.log(`\n🔍 Vérification des limites Vercel (plan ${VERCEL_LIMITS[plan].label})...\n`);
console.log(`   Application : @kairn/${appName}`);
console.log(`   Build : apps/${appName}/.next\n`);

const result = checkLimits(appName, plan);

console.log(`📊 Résultats :`);
console.log(`   Serverless Functions : ${result.serverlessFunctionCount}`);
console.log(`   Edge Functions : ${result.edgeFunctionCount}`);
console.log(`   Plus grande fonction : ${result.maxFunctionSizeMB} MB\n`);

if (result.warnings.length > 0) {
  console.log('⚠️  Avertissements :');
  for (const w of result.warnings) {
    console.log(`   - ${w}`);
  }
  console.log();
}

if (result.errors.length > 0) {
  console.log('❌ Erreurs :');
  for (const e of result.errors) {
    console.log(`   - ${e}`);
  }
  console.log();
  process.exit(1);
} else {
  console.log('✅ Toutes les vérifications passent.\n');
}
