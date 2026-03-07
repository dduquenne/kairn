/**
 * GitHub REST API Client
 *
 * Server-side client for fetching CI/CD data from the GitHub API.
 * Requires GITHUB_TOKEN environment variable for private repositories.
 *
 * @see https://docs.github.com/en/rest
 */

import type { GitHubCheckRun, GitHubWorkflowRun } from './types';

const GITHUB_API_BASE = 'https://api.github.com';

/** Configuration for the GitHub API client */
export interface GitHubClientConfig {
  token: string;
  /** Repository in "owner/repo" format */
  repository: string;
}

/** Raw GitHub workflow run from API */
interface RawWorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  head_sha: string;
  head_branch: string;
  event: string;
  created_at: string;
  updated_at: string;
  html_url: string;
}

/** Raw GitHub check run from API */
interface RawCheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  html_url: string;
}

/**
 * Build authorization headers for GitHub API requests
 * @param config - GitHub client configuration
 * @returns Headers object with Bearer token
 */
function buildHeaders(config: GitHubClientConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Normalize a raw check run into our typed structure
 * @param raw - Raw API response object
 * @returns Normalized GitHubCheckRun
 */
function normalizeCheckRun(raw: RawCheckRun): GitHubCheckRun {
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status as GitHubCheckRun['status'],
    conclusion: raw.conclusion as GitHubCheckRun['conclusion'],
    startedAt: raw.started_at,
    completedAt: raw.completed_at,
    htmlUrl: raw.html_url,
  };
}

/**
 * Fetch recent workflow runs from GitHub Actions
 * @param config - GitHub client configuration
 * @param limit - Maximum number of runs to fetch (default 5)
 * @param branch - Optional branch filter
 * @returns Array of workflow runs (without individual jobs)
 */
export async function fetchWorkflowRuns(
  config: GitHubClientConfig,
  limit = 5,
  branch?: string
): Promise<GitHubWorkflowRun[]> {
  const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : '';
  const url =
    `${GITHUB_API_BASE}/repos/${config.repository}/actions/runs` +
    `?per_page=${limit}${branchParam}`;

  const response = await fetch(url, {
    headers: buildHeaders(config),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { workflow_runs: RawWorkflowRun[] };
  return (data.workflow_runs ?? []).map(run => ({
    id: run.id,
    name: run.name,
    status: run.status as GitHubWorkflowRun['status'],
    conclusion: run.conclusion as GitHubWorkflowRun['conclusion'],
    headSha: run.head_sha,
    headBranch: run.head_branch,
    event: run.event,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    htmlUrl: run.html_url,
    jobs: [],
  }));
}

/**
 * Fetch check runs for a specific commit SHA
 * @param config - GitHub client configuration
 * @param sha - Git commit SHA
 * @returns Array of check runs for the commit
 */
export async function fetchCheckRunsForCommit(
  config: GitHubClientConfig,
  sha: string
): Promise<GitHubCheckRun[]> {
  const url =
    `${GITHUB_API_BASE}/repos/${config.repository}/commits/${sha}/check-runs` + `?per_page=50`;

  const response = await fetch(url, {
    headers: buildHeaders(config),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { check_runs: RawCheckRun[] };
  return (data.check_runs ?? []).map(normalizeCheckRun);
}

/**
 * Fetch the latest workflow run with its jobs for a branch
 * @param config - GitHub client configuration
 * @param branch - Branch name to filter (default "main")
 * @returns Latest workflow run with jobs, or null if none found
 */
export async function fetchLatestCIRun(
  config: GitHubClientConfig,
  branch = 'main'
): Promise<GitHubWorkflowRun | null> {
  const runs = await fetchWorkflowRuns(config, 1, branch);
  const latestRun = runs[0];
  if (!latestRun) return null;

  // Fetch individual jobs/check runs for this commit
  const checkRuns = await fetchCheckRunsForCommit(config, latestRun.headSha);
  latestRun.jobs = checkRuns;

  return latestRun;
}
