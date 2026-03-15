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

async function apiMutate<T = unknown>(
  path: string,
  token: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API error: ${res.status} ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface TeamMemberResponse {
  userId: string;
  displayName?: string;
  email?: string;
  role: string;
  joinedAt?: string;
}

export interface TeamResponse {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  members?: TeamMemberResponse[];
}

export interface TaskResponse {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdBy: string;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntryResponse {
  id: string;
  userId: string;
  teamId?: string;
  agentName: string;
  actionType: string;
  description: string;
  requiresApproval: boolean;
  approved?: boolean;
  approvedBy?: string;
  createdAt: string;
}

export interface JobResponse {
  id: string;
  teamId: string;
  userId: string;
  jobType: string;
  status: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export const api = {
  listTeams: (token: string) => apiFetch<TeamResponse[]>('/api/teams', token),
  getTeam: (token: string, slug: string) =>
    apiFetch<TeamResponse>(`/api/teams/${encodeURIComponent(slug)}`, token),
  updateTeam: (token: string, slug: string, data: { name: string }) =>
    apiMutate<TeamResponse>(`/api/teams/${encodeURIComponent(slug)}`, token, 'PATCH', data),
  inviteMember: (token: string, slug: string, email: string, role: string) =>
    apiMutate<TeamMemberResponse>(
      `/api/teams/${encodeURIComponent(slug)}/members`, token, 'POST', { email, role },
    ),
  removeMember: (token: string, slug: string, userId: string) =>
    apiMutate<void>(
      `/api/teams/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}`,
      token, 'DELETE',
    ),
  updateMemberRole: (token: string, slug: string, userId: string, role: string) =>
    apiMutate<TeamMemberResponse>(
      `/api/teams/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}`,
      token, 'PATCH', { role },
    ),
  listJobs: (token: string, slug: string) =>
    apiFetch<JobResponse[]>(`/api/jobs?teamSlug=${encodeURIComponent(slug)}`, token),
  listCron: (token: string, slug: string) =>
    apiFetch(`/api/teams/${encodeURIComponent(slug)}/cron`, token),
  listAudit: (token: string, slug: string) =>
    apiFetch<AuditEntryResponse[]>(`/api/admin/teams/${encodeURIComponent(slug)}/audit`, token),
  getStats: (token: string, slug: string) =>
    apiFetch(`/api/admin/teams/${encodeURIComponent(slug)}/usage`, token),
  listTasks: (token: string, slug: string) =>
    apiFetch<TaskResponse[]>(`/api/teams/${encodeURIComponent(slug)}/tasks`, token),
  listScoutFindings: (token: string) => apiFetch('/api/scout/findings', token),
  listSuggestions: (token: string) => apiFetch('/api/suggestions', token),
};
