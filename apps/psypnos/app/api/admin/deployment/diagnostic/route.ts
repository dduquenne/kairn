/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Deployment model not available in Kairn schema
import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';
import { checkRedisHealth, getRedisClient } from '@/lib/cache/redis';
import { isDatabaseConnected, prisma } from '@/lib/db/prisma';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

/**
 * Prompt système pour le diagnostic serveur
 */
const SERVER_DIAGNOSTIC_SYSTEM_PROMPT = `Tu es un expert DevOps et ingénieur système spécialisé dans le monitoring et l'optimisation des serveurs de production.

Ton rôle est d'analyser les métriques système complètes et de fournir:
1. Un diagnostic précis de l'état actuel du serveur
2. L'identification de problèmes critiques, risques et anomalies
3. Des recommandations concrètes et priorisées pour améliorer les performances et la stabilité
4. Des préconisations de maintenance préventive
5. Une analyse des tendances et des alertes précoces

Tu dois être:
- Précis et technique dans ton analyse
- Pratique et orienté solutions avec des commandes exécutables
- Capable d'anticiper les problèmes potentiels avant qu'ils ne deviennent critiques
- Clair dans tes explications, même pour des concepts complexes
- Attentif aux patterns d'erreurs dans les logs

Contexte technique de l'application:
- Framework: Next.js 14 avec TypeScript
- Base de données: PostgreSQL avec Prisma ORM (hébergée sur Supabase)
- Cache: Redis (optionnel, via ioredis)
- Process manager: PM2
- Serveur: VPS Linux (Gandi)
- Gestionnaire de paquets: pnpm
- Node.js version: 22
- Reverse proxy: Nginx avec SSL Let's Encrypt`;

/**
 * Interface pour les métriques système étendues
 */
interface ExtendedSystemMetrics {
  timestamp: string;
  uptime: {
    process: number;
    system: number;
  };
  memory: {
    process: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
      percentUsed: number;
    };
    system: {
      total: number;
      free: number;
      used: number;
      percentUsed: number;
      buffers?: number;
      cached?: number;
    };
  };
  cpu: {
    cores: number;
    model: string;
    loadAverage: number[];
    loadPerCore: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentUsed: number;
    mountPoint: string;
    inodes?: {
      total: number;
      used: number;
      percentUsed: number;
    };
  };
  database: {
    status: 'up' | 'down';
    latencyMs?: number;
    error?: string;
    extended?: {
      connectionCount?: number;
      maxConnections?: number;
      databaseSize?: string;
      activeQueries?: number;
      idleConnections?: number;
      waitingConnections?: number;
    };
  };
  redis: {
    status: 'up' | 'down' | 'disabled';
    latencyMs?: number;
    error?: string;
    extended?: {
      usedMemory?: string;
      usedMemoryPeak?: string;
      connectedClients?: number;
      totalKeys?: number;
      hitRate?: number;
      evictedKeys?: number;
      uptimeSeconds?: number;
    };
  };
  pm2?: {
    available: boolean;
    processes?: Array<{
      name: string;
      status: string;
      cpu: number;
      memory: number;
      restarts: number;
      uptime: number;
      pid?: number;
    }>;
    error?: string;
  };
  network?: {
    connections?: {
      established: number;
      timeWait: number;
      closeWait: number;
    };
    error?: string;
  };
  ssl?: {
    available: boolean;
    domain?: string;
    expiresAt?: string;
    daysUntilExpiry?: number;
    issuer?: string;
    error?: string;
  };
  deployment: {
    version: string;
    gitCommit?: string;
    gitBranch?: string;
    lastDeployedAt?: string;
    nodeEnv: string;
    analyticsMode: string;
  };
  security?: {
    npmAudit?: {
      vulnerabilities: {
        critical: number;
        high: number;
        moderate: number;
        low: number;
      };
      lastChecked?: string;
    };
    outdatedPackages?: number;
  };
  logs?: {
    recentErrors: string[];
    errorCount24h?: number;
    warningCount24h?: number;
  };
  pm2Config?: {
    available: boolean;
    content?: string;
    error?: string;
  };
  system: {
    platform: string;
    arch: string;
    hostname: string;
    nodeVersion: string;
    kernelVersion?: string;
  };
}

/**
 * Interface pour la réponse de diagnostic
 */
interface DiagnosticResponse {
  success: boolean;
  metrics?: ExtendedSystemMetrics;
  analysis?: {
    overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
    summary: string;
    findings: Array<{
      category: string;
      status: 'ok' | 'warning' | 'critical';
      message: string;
      details?: string;
    }>;
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      commands?: string[];
    }>;
    maintenanceTasks: Array<{
      task: string;
      frequency: string;
      lastRecommended?: string;
    }>;
    performanceInsights: string[];
  };
  error?: string;
}

/**
 * Exécute une commande shell de façon sécurisée avec timeout
 */
async function safeExec(command: string, timeoutMs = 5000): Promise<string> {
  try {
    const { stdout } = await execAsync(command, { timeout: timeoutMs });
    return stdout.trim();
  } catch {
    return '';
  }
}

/**
 * Collecte les métriques de disque
 */
async function collectDiskMetrics(): Promise<ExtendedSystemMetrics['disk']> {
  const defaultDisk = {
    total: 0,
    used: 0,
    free: 0,
    percentUsed: 0,
    mountPoint: '/',
  };

  try {
    // Utiliser df pour obtenir les infos de disque
    const dfOutput = await safeExec('df -k / | tail -1');
    if (dfOutput) {
      const parts = dfOutput.split(/\s+/);
      if (parts.length >= 5) {
        const total = parseInt(parts[1]) * 1024; // Convert KB to bytes
        const used = parseInt(parts[2]) * 1024;
        const free = parseInt(parts[3]) * 1024;
        const percentUsed = parseInt(parts[4].replace('%', ''));

        // Récupérer les inodes
        const inodeOutput = await safeExec('df -i / | tail -1');
        let inodes;
        if (inodeOutput) {
          const inodeParts = inodeOutput.split(/\s+/);
          if (inodeParts.length >= 5) {
            inodes = {
              total: parseInt(inodeParts[1]),
              used: parseInt(inodeParts[2]),
              percentUsed: parseInt(inodeParts[4].replace('%', '')),
            };
          }
        }

        return {
          total: Math.round(total / 1024 / 1024 / 1024), // GB
          used: Math.round(used / 1024 / 1024 / 1024),
          free: Math.round(free / 1024 / 1024 / 1024),
          percentUsed,
          mountPoint: parts[5] || '/',
          inodes,
        };
      }
    }
  } catch {
    // Ignore errors
  }

  return defaultDisk;
}

/**
 * Collecte les métriques PM2
 */
async function collectPM2Metrics(): Promise<ExtendedSystemMetrics['pm2']> {
  try {
    const pm2Output = await safeExec('pm2 jlist 2>/dev/null');
    if (!pm2Output) {
      return { available: false, error: 'PM2 non disponible ou aucun processus' };
    }

    const processes = JSON.parse(pm2Output);
    if (!Array.isArray(processes) || processes.length === 0) {
      return { available: true, processes: [] };
    }

    return {
      available: true,
      processes: processes.map(
        (p: {
          name: string;
          pm2_env?: { status?: string };
          monit?: { cpu?: number; memory?: number };
          pm2_env_restart_time?: number;
          pm2_env_pm_uptime?: number;
          pid?: number;
        }) => ({
          name: p.name,
          status: p.pm2_env?.status || 'unknown',
          cpu: p.monit?.cpu || 0,
          memory: Math.round((p.monit?.memory || 0) / 1024 / 1024), // MB
          restarts: p.pm2_env_restart_time || 0,
          uptime: p.pm2_env_pm_uptime ? Math.floor((Date.now() - p.pm2_env_pm_uptime) / 1000) : 0,
          pid: p.pid,
        })
      ),
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Erreur PM2',
    };
  }
}

/**
 * Collecte les métriques réseau
 */
async function collectNetworkMetrics(): Promise<ExtendedSystemMetrics['network']> {
  try {
    // Compter les connexions par état
    const netstatOutput = await safeExec(
      "netstat -an 2>/dev/null | grep -E 'ESTABLISHED|TIME_WAIT|CLOSE_WAIT' | wc -l"
    );
    const establishedOutput = await safeExec('netstat -an 2>/dev/null | grep ESTABLISHED | wc -l');
    const timeWaitOutput = await safeExec('netstat -an 2>/dev/null | grep TIME_WAIT | wc -l');
    const closeWaitOutput = await safeExec('netstat -an 2>/dev/null | grep CLOSE_WAIT | wc -l');

    return {
      connections: {
        established: parseInt(establishedOutput) || 0,
        timeWait: parseInt(timeWaitOutput) || 0,
        closeWait: parseInt(closeWaitOutput) || 0,
      },
    };
  } catch {
    return { error: 'Impossible de collecter les métriques réseau' };
  }
}

/**
 * Collecte les informations SSL
 */
async function collectSSLMetrics(): Promise<ExtendedSystemMetrics['ssl']> {
  try {
    const domain = process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '').split('/')[0];
    if (!domain || domain.includes('localhost')) {
      return { available: false };
    }

    // Utiliser openssl pour vérifier le certificat
    const sslOutput = await safeExec(
      `echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates -issuer 2>/dev/null`
    );

    if (sslOutput) {
      const notAfterMatch = sslOutput.match(/notAfter=(.+)/);
      const issuerMatch = sslOutput.match(/issuer=(.+)/);

      if (notAfterMatch) {
        const expiresAt = new Date(notAfterMatch[1]);
        const now = new Date();
        const daysUntilExpiry = Math.floor(
          (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          available: true,
          domain,
          expiresAt: expiresAt.toISOString(),
          daysUntilExpiry,
          issuer: issuerMatch?.[1]?.trim(),
        };
      }
    }

    return { available: false, domain, error: 'Impossible de lire le certificat' };
  } catch {
    return { available: false, error: 'Erreur lors de la vérification SSL' };
  }
}

/**
 * Collecte les métriques PostgreSQL étendues
 */
async function collectExtendedDatabaseMetrics(): Promise<
  ExtendedSystemMetrics['database']['extended']
> {
  try {
    const isConnected = await isDatabaseConnected();
    if (!isConnected) return undefined;

    // Nombre de connexions actives
    const connectionResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
    `;
    const activeQueries = Number(connectionResult[0]?.count || 0);

    // Connexions idle
    const idleResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*) as count FROM pg_stat_activity WHERE state = 'idle'
    `;
    const idleConnections = Number(idleResult[0]?.count || 0);

    // Total des connexions
    const totalResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*) as count FROM pg_stat_activity
    `;
    const connectionCount = Number(totalResult[0]?.count || 0);

    // Taille de la base de données
    const sizeResult = await prisma.$queryRaw<Array<{ size: string }>>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    const databaseSize = sizeResult[0]?.size || 'N/A';

    // Max connections
    const maxConnResult = await prisma.$queryRaw<Array<{ setting: string }>>`
      SELECT setting FROM pg_settings WHERE name = 'max_connections'
    `;
    const maxConnections = parseInt(maxConnResult[0]?.setting || '100');

    return {
      connectionCount,
      maxConnections,
      databaseSize,
      activeQueries,
      idleConnections,
      waitingConnections: 0,
    };
  } catch {
    return undefined;
  }
}

/**
 * Collecte les métriques Redis étendues
 */
async function collectExtendedRedisMetrics(): Promise<ExtendedSystemMetrics['redis']['extended']> {
  try {
    const redis = getRedisClient();
    if (!redis) return undefined;

    const info = await redis.info();
    const lines = info.split('\r\n');
    const metrics: Record<string, string> = {};

    for (const line of lines) {
      const [key, value] = line.split(':');
      if (key && value) {
        metrics[key] = value;
      }
    }

    // Calculer le hit rate
    const hits = parseInt(metrics['keyspace_hits'] || '0');
    const misses = parseInt(metrics['keyspace_misses'] || '0');
    const hitRate = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

    // Compter les clés
    const dbKeysMatch = info.match(/db\d+:keys=(\d+)/);
    const totalKeys = dbKeysMatch ? parseInt(dbKeysMatch[1]) : 0;

    return {
      usedMemory: metrics['used_memory_human'],
      usedMemoryPeak: metrics['used_memory_peak_human'],
      connectedClients: parseInt(metrics['connected_clients'] || '0'),
      totalKeys,
      hitRate,
      evictedKeys: parseInt(metrics['evicted_keys'] || '0'),
      uptimeSeconds: parseInt(metrics['uptime_in_seconds'] || '0'),
    };
  } catch {
    return undefined;
  }
}

/**
 * Collecte les informations de déploiement
 */
async function collectDeploymentInfo(): Promise<ExtendedSystemMetrics['deployment']> {
  // Lire la version depuis package.json
  let version = 'unknown';
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    version = packageJson.version || 'unknown';
  } catch {
    // Ignore
  }

  // Git commit et branch
  const gitCommit = await safeExec('git rev-parse --short HEAD 2>/dev/null');
  const gitBranch = await safeExec('git rev-parse --abbrev-ref HEAD 2>/dev/null');

  // Date du dernier commit
  const lastCommitDate = await safeExec('git log -1 --format=%ci 2>/dev/null');

  return {
    version,
    gitCommit: gitCommit || undefined,
    gitBranch: gitBranch || undefined,
    lastDeployedAt: lastCommitDate || undefined,
    nodeEnv: process.env.NODE_ENV || 'development',
    analyticsMode: 'postgres',
  };
}

/**
 * Collecte les informations de sécurité (npm audit)
 */
async function collectSecurityInfo(): Promise<ExtendedSystemMetrics['security']> {
  try {
    // Exécuter npm audit en mode JSON (avec timeout court car peut être lent)
    const auditOutput = await safeExec('pnpm audit --json 2>/dev/null', 15000);

    if (auditOutput) {
      try {
        const auditData = JSON.parse(auditOutput);
        return {
          npmAudit: {
            vulnerabilities: {
              critical: auditData.metadata?.vulnerabilities?.critical || 0,
              high: auditData.metadata?.vulnerabilities?.high || 0,
              moderate: auditData.metadata?.vulnerabilities?.moderate || 0,
              low: auditData.metadata?.vulnerabilities?.low || 0,
            },
            lastChecked: new Date().toISOString(),
          },
        };
      } catch {
        // JSON parsing failed
      }
    }

    // Vérifier les packages obsolètes
    const outdatedOutput = await safeExec('pnpm outdated --json 2>/dev/null | wc -l', 10000);
    const outdatedCount = parseInt(outdatedOutput) || 0;

    return {
      outdatedPackages: outdatedCount > 0 ? outdatedCount : undefined,
    };
  } catch {
    return undefined;
  }
}

/**
 * Collecte la configuration PM2 (ecosystem.config.js)
 */
async function collectPM2Config(): Promise<ExtendedSystemMetrics['pm2Config']> {
  try {
    const configPath = path.join(process.cwd(), 'ecosystem.config.js');

    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return {
        available: true,
        content,
      };
    }

    return { available: false, error: 'Fichier ecosystem.config.js non trouvé' };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Erreur de lecture',
    };
  }
}

/**
 * Collecte les logs récents (erreurs)
 */
async function collectRecentLogs(): Promise<ExtendedSystemMetrics['logs']> {
  const recentErrors: string[] = [];

  try {
    // Essayer de lire les logs PM2
    const pm2LogPath = await safeExec(
      "pm2 info psypnos 2>/dev/null | grep 'err log path' | awk '{print $NF}'"
    );

    if (pm2LogPath && fs.existsSync(pm2LogPath)) {
      const logContent = await safeExec(
        `tail -100 "${pm2LogPath}" 2>/dev/null | grep -i "error\\|exception\\|fatal" | tail -10`
      );
      if (logContent) {
        recentErrors.push(...logContent.split('\n').filter(Boolean).slice(-10));
      }
    }

    // Compter les erreurs des dernières 24h
    let errorCount24h = 0;
    if (pm2LogPath && fs.existsSync(pm2LogPath)) {
      const countOutput = await safeExec(
        `grep -c -i "error" "${pm2LogPath}" 2>/dev/null || echo "0"`
      );
      errorCount24h = parseInt(countOutput) || 0;
    }

    return {
      recentErrors: recentErrors.slice(0, 10),
      errorCount24h,
    };
  } catch {
    return { recentErrors: [] };
  }
}

/**
 * Collecte toutes les métriques système
 */
async function collectSystemMetrics(): Promise<ExtendedSystemMetrics> {
  const timestamp = new Date().toISOString();

  // Process memory
  const memUsage = process.memoryUsage();
  const processMemory = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
    rss: Math.round(memUsage.rss / 1024 / 1024),
    percentUsed: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
  };

  // System memory
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const systemMemory = {
    total: Math.round(totalMem / 1024 / 1024),
    free: Math.round(freeMem / 1024 / 1024),
    used: Math.round(usedMem / 1024 / 1024),
    percentUsed: Math.round((usedMem / totalMem) * 100),
  };

  // CPU info
  const cpus = os.cpus();
  const loadAverage = os.loadavg();
  const cpu = {
    cores: cpus.length,
    model: cpus[0]?.model || 'Unknown',
    loadAverage,
    loadPerCore: Math.round((loadAverage[0] / cpus.length) * 100) / 100,
  };

  // Database check
  let dbStatus: ExtendedSystemMetrics['database'];
  const dbStart = Date.now();
  try {
    const connected = await isDatabaseConnected();
    const extended = connected ? await collectExtendedDatabaseMetrics() : undefined;
    dbStatus = {
      status: connected ? 'up' : 'down',
      latencyMs: Date.now() - dbStart,
      extended,
    };
  } catch (error) {
    dbStatus = {
      status: 'down',
      latencyMs: Date.now() - dbStart,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Redis check
  let redisStatus: ExtendedSystemMetrics['redis'];
  if (!process.env.REDIS_URL) {
    redisStatus = { status: 'disabled' };
  } else {
    const redisHealth = await checkRedisHealth();
    const extended = redisHealth.available ? await collectExtendedRedisMetrics() : undefined;
    redisStatus = {
      status: redisHealth.available ? 'up' : 'down',
      latencyMs: redisHealth.latencyMs,
      error: redisHealth.error,
      extended,
    };
  }

  // Collect additional metrics in parallel
  const [disk, pm2, network, ssl, deployment, security, logs, pm2Config, kernelVersion] =
    await Promise.all([
      collectDiskMetrics(),
      collectPM2Metrics(),
      collectNetworkMetrics(),
      collectSSLMetrics(),
      collectDeploymentInfo(),
      collectSecurityInfo(),
      collectRecentLogs(),
      collectPM2Config(),
      safeExec('uname -r 2>/dev/null'),
    ]);

  return {
    timestamp,
    uptime: {
      process: Math.floor(process.uptime()),
      system: Math.floor(os.uptime()),
    },
    memory: {
      process: processMemory,
      system: systemMemory,
    },
    cpu,
    disk,
    database: dbStatus,
    redis: redisStatus,
    pm2,
    network,
    ssl,
    deployment,
    security,
    logs,
    pm2Config,
    system: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      nodeVersion: process.version,
      kernelVersion: kernelVersion || undefined,
    },
  };
}

/**
 * Construit le prompt d'analyse à partir des métriques étendues
 */
function buildDiagnosticPrompt(metrics: ExtendedSystemMetrics): string {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}j ${hours}h ${mins}m`;
  };

  let prompt = `Analyse ces métriques système complètes et fournis un diagnostic approfondi avec des recommandations priorisées.

## Métriques système collectées

### Horodatage
- **Date/Heure**: ${metrics.timestamp}

### Déploiement & Version
- **Version application**: ${metrics.deployment.version}
- **Commit Git**: ${metrics.deployment.gitCommit || 'N/A'}
- **Branche**: ${metrics.deployment.gitBranch || 'N/A'}
- **Dernier déploiement**: ${metrics.deployment.lastDeployedAt || 'N/A'}
- **NODE_ENV**: ${metrics.deployment.nodeEnv}
- **Mode analytics**: ${metrics.deployment.analyticsMode}

### Uptime
- **Processus Node.js**: ${formatUptime(metrics.uptime.process)}
- **Système**: ${formatUptime(metrics.uptime.system)}

### Mémoire du processus Node.js
- **Heap utilisé**: ${metrics.memory.process.heapUsed} MB / ${metrics.memory.process.heapTotal} MB (${metrics.memory.process.percentUsed}%)
- **RSS**: ${metrics.memory.process.rss} MB
- **External**: ${metrics.memory.process.external} MB

### Mémoire système
- **Total**: ${metrics.memory.system.total} MB
- **Utilisée**: ${metrics.memory.system.used} MB (${metrics.memory.system.percentUsed}%)
- **Libre**: ${metrics.memory.system.free} MB

### CPU
- **Coeurs**: ${metrics.cpu.cores}
- **Modèle**: ${metrics.cpu.model}
- **Load average (1m, 5m, 15m)**: ${metrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}
- **Load par coeur**: ${metrics.cpu.loadPerCore}

### Stockage disque
- **Total**: ${metrics.disk.total} GB
- **Utilisé**: ${metrics.disk.used} GB (${metrics.disk.percentUsed}%)
- **Libre**: ${metrics.disk.free} GB
- **Point de montage**: ${metrics.disk.mountPoint}`;

  if (metrics.disk.inodes) {
    prompt += `
- **Inodes utilisés**: ${metrics.disk.inodes.percentUsed}% (${metrics.disk.inodes.used}/${metrics.disk.inodes.total})`;
  }

  prompt += `

### Base de données PostgreSQL
- **Statut**: ${metrics.database.status}
- **Latence**: ${metrics.database.latencyMs !== undefined ? `${metrics.database.latencyMs}ms` : 'N/A'}`;

  if (metrics.database.error) {
    prompt += `
- **Erreur**: ${metrics.database.error}`;
  }

  if (metrics.database.extended) {
    const ext = metrics.database.extended;
    prompt += `
- **Connexions actives**: ${ext.connectionCount}/${ext.maxConnections}
- **Requêtes actives**: ${ext.activeQueries}
- **Connexions idle**: ${ext.idleConnections}
- **Taille base**: ${ext.databaseSize}`;
  }

  prompt += `

### Redis`;

  if (metrics.redis.status === 'disabled') {
    prompt += `
- **Statut**: Désactivé (non configuré)`;
  } else {
    prompt += `
- **Statut**: ${metrics.redis.status}`;
    if (metrics.redis.latencyMs !== undefined) {
      prompt += `
- **Latence**: ${metrics.redis.latencyMs}ms`;
    }
    if (metrics.redis.error) {
      prompt += `
- **Erreur**: ${metrics.redis.error}`;
    }
    if (metrics.redis.extended) {
      const ext = metrics.redis.extended;
      prompt += `
- **Mémoire utilisée**: ${ext.usedMemory}
- **Mémoire peak**: ${ext.usedMemoryPeak}
- **Clients connectés**: ${ext.connectedClients}
- **Nombre de clés**: ${ext.totalKeys}
- **Hit rate cache**: ${ext.hitRate}%
- **Clés évincées**: ${ext.evictedKeys}
- **Uptime Redis**: ${formatUptime(ext.uptimeSeconds || 0)}`;
    }
  }

  if (metrics.pm2?.available) {
    prompt += `

### Processus PM2`;
    if (metrics.pm2.processes && metrics.pm2.processes.length > 0) {
      for (const proc of metrics.pm2.processes) {
        prompt += `
- **${proc.name}**: ${proc.status} | CPU: ${proc.cpu}% | RAM: ${proc.memory}MB | Restarts: ${proc.restarts} | Uptime: ${formatUptime(proc.uptime)}`;
      }
    } else {
      prompt += `
- Aucun processus en cours`;
    }
  }

  if (metrics.network?.connections) {
    prompt += `

### Connexions réseau
- **ESTABLISHED**: ${metrics.network.connections.established}
- **TIME_WAIT**: ${metrics.network.connections.timeWait}
- **CLOSE_WAIT**: ${metrics.network.connections.closeWait}`;
  }

  if (metrics.ssl?.available) {
    prompt += `

### Certificat SSL
- **Domaine**: ${metrics.ssl.domain}
- **Expiration**: ${metrics.ssl.expiresAt}
- **Jours restants**: ${metrics.ssl.daysUntilExpiry}
- **Émetteur**: ${metrics.ssl.issuer || 'N/A'}`;
  } else if (metrics.ssl?.error) {
    prompt += `

### Certificat SSL
- **Erreur**: ${metrics.ssl.error}`;
  }

  if (metrics.security?.npmAudit) {
    const vuln = metrics.security.npmAudit.vulnerabilities;
    prompt += `

### Sécurité (npm audit)
- **Vulnérabilités critiques**: ${vuln.critical}
- **Vulnérabilités hautes**: ${vuln.high}
- **Vulnérabilités modérées**: ${vuln.moderate}
- **Vulnérabilités basses**: ${vuln.low}`;
  }

  if (metrics.security?.outdatedPackages) {
    prompt += `
- **Packages obsolètes**: ${metrics.security.outdatedPackages}`;
  }

  if (metrics.logs?.recentErrors && metrics.logs.recentErrors.length > 0) {
    prompt += `

### Erreurs récentes (logs)
${metrics.logs.recentErrors.map(e => `- ${e}`).join('\n')}`;
    if (metrics.logs.errorCount24h) {
      prompt += `
- **Total erreurs (estimé)**: ${metrics.logs.errorCount24h}`;
    }
  }

  if (metrics.pm2Config?.available && metrics.pm2Config.content) {
    prompt += `

### Configuration PM2 (ecosystem.config.js)
\`\`\`javascript
${metrics.pm2Config.content}
\`\`\``;
  }

  prompt += `

### Informations système
- **Plateforme**: ${metrics.system.platform}
- **Architecture**: ${metrics.system.arch}
- **Hostname**: ${metrics.system.hostname}
- **Node.js**: ${metrics.system.nodeVersion}`;

  if (metrics.system.kernelVersion) {
    prompt += `
- **Kernel**: ${metrics.system.kernelVersion}`;
  }

  prompt += `

---

**Réponds en utilisant EXACTEMENT ce format XML:**

<DIAGNOSTIC>
<OVERALL_HEALTH>excellent|good|warning|critical</OVERALL_HEALTH>
<SUMMARY>Résumé global de l'état du serveur en 2-4 phrases, mentionnant les points critiques s'il y en a</SUMMARY>

<FINDINGS>
<FINDING category="memory|cpu|disk|database|redis|network|ssl|security|pm2|uptime|system|logs" status="ok|warning|critical">
<MESSAGE>Description courte du constat</MESSAGE>
<DETAILS>Détails techniques si pertinent (optionnel)</DETAILS>
</FINDING>
<!-- Ajouter 5-10 findings couvrant tous les aspects importants -->
</FINDINGS>

<RECOMMENDATIONS>
<RECOMMENDATION priority="high|medium|low">
<TITLE>Titre de la recommandation</TITLE>
<DESCRIPTION>Description détaillée de l'action à entreprendre</DESCRIPTION>
<COMMANDS>
commande1
commande2
</COMMANDS>
</RECOMMENDATION>
<!-- Ajouter 3-7 recommandations pertinentes et priorisées -->
</RECOMMENDATIONS>

<MAINTENANCE>
<TASK frequency="daily|weekly|monthly">Tâche de maintenance préventive</TASK>
<!-- Ajouter 3-5 tâches de maintenance recommandées -->
</MAINTENANCE>

<INSIGHTS>
<INSIGHT>Observation sur les performances, tendance détectée, ou conseil d'optimisation</INSIGHT>
<!-- Ajouter 3-5 insights pertinents -->
</INSIGHTS>
</DIAGNOSTIC>`;

  return prompt;
}

/**
 * Parse la réponse XML de Claude en objet structuré
 */
function parseDiagnosticResponse(response: string): DiagnosticResponse['analysis'] {
  // Overall health
  const healthMatch = response.match(
    /<OVERALL_HEALTH>(excellent|good|warning|critical)<\/OVERALL_HEALTH>/
  );
  const overallHealth =
    (healthMatch?.[1] as 'excellent' | 'good' | 'warning' | 'critical') || 'warning';

  // Summary
  const summaryMatch = response.match(/<SUMMARY>([\s\S]*?)<\/SUMMARY>/);
  const summary = summaryMatch?.[1]?.trim() || 'Diagnostic non disponible';

  // Findings
  const findingsRegex =
    /<FINDING\s+category="([^"]+)"\s+status="(ok|warning|critical)">\s*<MESSAGE>([\s\S]*?)<\/MESSAGE>\s*(?:<DETAILS>([\s\S]*?)<\/DETAILS>)?\s*<\/FINDING>/g;
  const findings: NonNullable<DiagnosticResponse['analysis']>['findings'] = [];

  let findingMatch;
  while ((findingMatch = findingsRegex.exec(response)) !== null) {
    findings.push({
      category: findingMatch[1],
      status: findingMatch[2] as 'ok' | 'warning' | 'critical',
      message: findingMatch[3].trim(),
      details: findingMatch[4]?.trim(),
    });
  }

  // Recommendations
  const recommendationsRegex =
    /<RECOMMENDATION\s+priority="(high|medium|low)">\s*<TITLE>([\s\S]*?)<\/TITLE>\s*<DESCRIPTION>([\s\S]*?)<\/DESCRIPTION>\s*(?:<COMMANDS>([\s\S]*?)<\/COMMANDS>)?\s*<\/RECOMMENDATION>/g;
  const recommendations: NonNullable<DiagnosticResponse['analysis']>['recommendations'] = [];

  let recMatch;
  while ((recMatch = recommendationsRegex.exec(response)) !== null) {
    const commands = recMatch[4]
      ? recMatch[4]
          .trim()
          .split('\n')
          .map(c => c.trim())
          .filter(c => c)
      : undefined;

    recommendations.push({
      priority: recMatch[1] as 'high' | 'medium' | 'low',
      title: recMatch[2].trim(),
      description: recMatch[3].trim(),
      commands: commands?.length ? commands : undefined,
    });
  }

  // Maintenance tasks
  const maintenanceRegex = /<TASK\s+frequency="([^"]+)">([\s\S]*?)<\/TASK>/g;
  const maintenanceTasks: NonNullable<DiagnosticResponse['analysis']>['maintenanceTasks'] = [];

  let maintMatch;
  while ((maintMatch = maintenanceRegex.exec(response)) !== null) {
    maintenanceTasks.push({
      task: maintMatch[2].trim(),
      frequency: maintMatch[1],
    });
  }

  // Performance insights
  const insightsRegex = /<INSIGHT>([\s\S]*?)<\/INSIGHT>/g;
  const performanceInsights: string[] = [];

  let insightMatch;
  while ((insightMatch = insightsRegex.exec(response)) !== null) {
    performanceInsights.push(insightMatch[1].trim());
  }

  return {
    overallHealth,
    summary,
    findings:
      findings.length > 0
        ? findings
        : [
            {
              category: 'system',
              status: 'ok',
              message: 'Analyse en cours',
            },
          ],
    recommendations:
      recommendations.length > 0
        ? recommendations
        : [
            {
              priority: 'low',
              title: 'Surveillance continue',
              description: 'Continuer à monitorer les métriques système régulièrement.',
            },
          ],
    maintenanceTasks:
      maintenanceTasks.length > 0
        ? maintenanceTasks
        : [
            {
              task: "Vérifier les logs d'erreur",
              frequency: 'daily',
            },
          ],
    performanceInsights:
      performanceInsights.length > 0 ? performanceInsights : ['Aucun insight spécifique détecté'],
  };
}

/**
 * GET /api/admin/deployment/diagnostic
 * Retourne les métriques système sans analyse IA
 */
export async function GET(): Promise<NextResponse> {
  // Check admin auth
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const metrics = await collectSystemMetrics();

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('[Server Diagnostic] Error collecting metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la collecte des métriques',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/deployment/diagnostic
 * Analyse approfondie avec Claude AI
 */
export async function POST(): Promise<NextResponse> {
  // Check admin auth
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    // Collect metrics
    const metrics = await collectSystemMetrics();

    // Vérifier la clé API Anthropic
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[Server Diagnostic] ANTHROPIC_API_KEY non configurée');
      return NextResponse.json(
        {
          success: false,
          metrics,
          error: "Configuration API Claude manquante. L'analyse IA n'est pas disponible.",
        },
        { status: 500 }
      );
    }

    // Build analysis prompt
    const analysisPrompt = buildDiagnosticPrompt(metrics);

    // Call Claude for analysis
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 6000,
      temperature: 0.3,
      system: SERVER_DIAGNOSTIC_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    // Extract response
    const responseContent = message.content[0].type === 'text' ? message.content[0].text : '';

    if (!responseContent) {
      throw new Error('Aucune réponse de Claude');
    }

    // Parse structured response
    const analysis = parseDiagnosticResponse(responseContent);

    const response: DiagnosticResponse = {
      success: true,
      metrics,
      analysis,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Server Diagnostic] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du diagnostic',
      },
      { status: 500 }
    );
  }
}
