/**
 * VersionChecker Component Tests
 *
 * Tests pour le composant VersionChecker :
 * - Fetch initial de la version
 * - Gestion des erreurs réseau
 * - Rendu headless (pas de DOM)
 */

import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { VersionChecker } from '../version-checker';

/** Données de version mock */
const MOCK_VERSION = {
  version: '1.0.0',
  buildId: 'abc123',
  buildTime: '2024-01-01T00:00:00Z',
  environment: 'production',
};

describe('VersionChecker', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_VERSION),
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ne rend rien visuellement', () => {
    const { container } = render(
      <VersionChecker versionEndpoint="/api/version" disableAutoRefresh disableNotifications />
    );

    expect(container.innerHTML).toBe('');
  });

  it('effectue un fetch initial de la version', async () => {
    render(
      <VersionChecker versionEndpoint="/api/version" disableAutoRefresh disableNotifications />
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/version?_='),
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it('gère les erreurs de fetch sans planter', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const { container } = render(
      <VersionChecker versionEndpoint="/api/version" disableAutoRefresh disableNotifications />
    );

    expect(container.innerHTML).toBe('');
  });

  it('gère les réponses HTTP non-ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { container } = render(
      <VersionChecker versionEndpoint="/api/version" disableAutoRefresh disableNotifications />
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(container.innerHTML).toBe('');
  });
});
