/**
 * API client for the Waggle Admin Dashboard.
 * Calls the Waggle server REST API.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3100';

async function apiFetch<T = unknown>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listTeams: (token: string) => apiFetch('/api/teams', token),
  listJobs: (token: string, slug: string) =>
    apiFetch(`/api/jobs?teamSlug=${encodeURIComponent(slug)}`, token),
  listCron: (token: string, slug: string) =>
    apiFetch(`/api/teams/${encodeURIComponent(slug)}/cron`, token),
  listAudit: (token: string, slug: string) =>
    apiFetch(`/api/admin/teams/${encodeURIComponent(slug)}/audit`, token),
  getStats: (token: string, slug: string) =>
    apiFetch(`/api/admin/teams/${encodeURIComponent(slug)}/usage`, token),
  listScoutFindings: (token: string) => apiFetch('/api/scout/findings', token),
  listSuggestions: (token: string) => apiFetch('/api/suggestions', token),
};
