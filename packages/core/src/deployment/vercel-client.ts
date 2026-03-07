/**
 * Vercel REST API Client
 *
 * Server-side client for fetching deployment data from the Vercel API.
 * Requires VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables.
 *
 * @see https://vercel.com/docs/rest-api
 */

import type {
  VercelDeployment,
  VercelDeploymentTarget,
  VercelGitMeta,
  VercelProjectInfo,
} from './types';

const VERCEL_API_BASE = 'https://api.vercel.com';

/** Configuration for the Vercel API client */
export interface VercelClientConfig {
  token: string;
  projectId: string;
  teamId?: string;
}

/**
 * Vercel API raw deployment shape (subset of fields we use).
 * Not exported — internal to this module.
 */
interface RawVercelDeployment {
  uid: string;
  url: string;
  inspectorUrl?: string;
  state?: string;
  readyState?: string;
  target?: string | null;
  created: number;
  buildingAt?: number;
  ready?: number;
  meta?: Record<string, string>;
  creator?: { email?: string };
  name?: string;
}

/** Raw Vercel project response */
interface RawVercelProject {
  id: string;
  name: string;
  framework?: string | null;
  nodeVersion?: string;
  link?: {
    type?: string;
    repo?: string;
  };
}

/**
 * Build authorization headers for Vercel API requests
 * @param config - Vercel client configuration
 * @returns Headers object with Bearer token and optional team scope
 */
function buildHeaders(config: VercelClientConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${config.token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Build team query parameter if teamId is provided
 * @param config - Vercel client configuration
 * @returns Query string fragment (e.g. "&teamId=xxx") or empty string
 */
function teamParam(config: VercelClientConfig): string {
  return config.teamId ? `&teamId=${config.teamId}` : '';
}

/**
 * Normalize a raw Vercel API deployment into our typed structure
 * @param raw - Raw API response object
 * @returns Normalized VercelDeployment
 */
function normalizeDeployment(raw: RawVercelDeployment): VercelDeployment {
  const meta = raw.meta ?? {};
  const git: VercelGitMeta | null = meta.githubCommitSha
    ? {
        commitSha: meta.githubCommitSha,
        commitMessage: meta.githubCommitMessage ?? '',
        commitAuthorName: meta.githubCommitAuthorName ?? '',
        commitRef: meta.githubCommitRef ?? '',
        org: meta.githubOrg ?? '',
        repo: meta.githubRepo ?? '',
      }
    : null;

  return {
    uid: raw.uid,
    url: raw.url,
    inspectorUrl: raw.inspectorUrl ?? null,
    state: (raw.state ?? raw.readyState ?? 'QUEUED') as VercelDeployment['state'],
    target: (raw.target ?? null) as VercelDeploymentTarget,
    createdAt: raw.created,
    buildingAt: raw.buildingAt ?? null,
    readyAt: raw.ready ?? null,
    git,
    creatorEmail: raw.creator?.email ?? null,
    projectName: raw.name ?? '',
  };
}

/**
 * Fetch recent deployments from the Vercel API
 * @param config - Vercel client configuration
 * @param limit - Maximum number of deployments to fetch (default 20)
 * @param target - Optional filter by target environment
 * @returns Array of normalized Vercel deployments
 */
export async function fetchVercelDeployments(
  config: VercelClientConfig,
  limit = 20,
  target?: 'production' | 'preview'
): Promise<VercelDeployment[]> {
  const targetParam = target ? `&target=${target}` : '';
  const url =
    `${VERCEL_API_BASE}/v6/deployments` +
    `?projectId=${config.projectId}&limit=${limit}${targetParam}${teamParam(config)}`;

  const response = await fetch(url, {
    headers: buildHeaders(config),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vercel API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { deployments: RawVercelDeployment[] };
  return (data.deployments ?? []).map(normalizeDeployment);
}

/**
 * Fetch a single deployment by ID
 * @param config - Vercel client configuration
 * @param deploymentId - Vercel deployment UID
 * @returns Normalized Vercel deployment
 */
export async function fetchVercelDeployment(
  config: VercelClientConfig,
  deploymentId: string
): Promise<VercelDeployment> {
  const url =
    `${VERCEL_API_BASE}/v13/deployments/${deploymentId}` + `?${teamParam(config).replace('&', '')}`;

  const response = await fetch(url, {
    headers: buildHeaders(config),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vercel API error (${response.status}): ${body}`);
  }

  const raw = (await response.json()) as RawVercelDeployment;
  return normalizeDeployment(raw);
}

/**
 * Fetch Vercel project information
 * @param config - Vercel client configuration
 * @returns Vercel project info
 */
export async function fetchVercelProject(config: VercelClientConfig): Promise<VercelProjectInfo> {
  const url =
    `${VERCEL_API_BASE}/v9/projects/${config.projectId}` + `?${teamParam(config).replace('&', '')}`;

  const response = await fetch(url, {
    headers: buildHeaders(config),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vercel API error (${response.status}): ${body}`);
  }

  const raw = (await response.json()) as RawVercelProject;
  return {
    id: raw.id,
    name: raw.name,
    framework: raw.framework ?? null,
    nodeVersion: raw.nodeVersion ?? null,
    gitRepository: raw.link?.repo ? { type: raw.link.type ?? 'github', repo: raw.link.repo } : null,
  };
}
