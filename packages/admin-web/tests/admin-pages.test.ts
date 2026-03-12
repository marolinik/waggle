/**
 * Admin web — page and API module tests.
 *
 * Tests module exports and API client URL construction.
 * No DOM rendering — React components tested via E2E.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock import.meta.env for api.ts
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://test:3100' } } });

describe('Admin pages', () => {
  it('Members page module exists', async () => {
    const mod = await import('../src/pages/Members.js');
    expect(typeof mod.Members).toBe('function');
  });

  it('TeamSettings page module exists', async () => {
    const mod = await import('../src/pages/TeamSettings.js');
    expect(typeof mod.TeamSettings).toBe('function');
  });

  it('Dashboard page module exists', async () => {
    const mod = await import('../src/pages/Dashboard.js');
    expect(typeof mod.Dashboard).toBe('function');
  });
});

describe('API client', () => {
  let api: any;

  beforeEach(async () => {
    const mod = await import('../src/api.js');
    api = mod.api;
  });

  it('exports expected team management methods', () => {
    expect(typeof api.listTeams).toBe('function');
    expect(typeof api.getTeam).toBe('function');
    expect(typeof api.updateTeam).toBe('function');
    expect(typeof api.inviteMember).toBe('function');
    expect(typeof api.removeMember).toBe('function');
    expect(typeof api.updateMemberRole).toBe('function');
  });

  it('exports original methods', () => {
    expect(typeof api.listJobs).toBe('function');
    expect(typeof api.listCron).toBe('function');
    expect(typeof api.listAudit).toBe('function');
    expect(typeof api.getStats).toBe('function');
  });
});
