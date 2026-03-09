/**
 * useSessions — React hook for session management.
 *
 * Takes a WaggleService instance and workspaceId. Returns session state + actions.
 * Groups sessions by time period for the list view.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { WaggleService, Session } from '../services/types.js';
import { groupSessionsByTime, sortSessions } from '../components/sessions/utils.js';

export interface UseSessionsOptions {
  service: WaggleService;
  workspaceId: string;
}

export interface UseSessionsReturn {
  sessions: Session[];
  grouped: Record<string, Session[]>;
  loading: boolean;
  error: string | null;
  activeSessionId: string | null;
  selectSession: (id: string) => void;
  createSession: (title?: string) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSessions({ service, workspaceId }: UseSessionsOptions): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await service.listSessions(workspaceId);
      const sorted = sortSessions(list);
      setSessions(sorted);
      // Auto-select first session if none active
      setActiveSessionId((prev) => (prev === null && sorted.length > 0 ? sorted[0].id : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [service, workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load sessions on mount and when workspace changes
  useEffect(() => {
    let cancelled = false;
    setActiveSessionId(null);
    loadSessions().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [loadSessions]);

  const grouped = useMemo(() => groupSessionsByTime(sessions), [sessions]);

  const selectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const createSession = useCallback(async (title?: string): Promise<Session> => {
    const session = await service.createSession(workspaceId, title);
    setSessions((prev) => sortSessions([session, ...prev]));
    setActiveSessionId(session.id);
    return session;
  }, [service, workspaceId]);

  const deleteSession = useCallback(async (id: string): Promise<void> => {
    await service.deleteSession(id, workspaceId);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  }, [service, workspaceId, activeSessionId]);

  const renameSession = useCallback(async (id: string, title: string): Promise<void> => {
    await service.renameSession(id, workspaceId, title);
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s)),
    );
  }, [service, workspaceId]);

  const refresh = useCallback(async () => {
    await loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    grouped,
    loading,
    error,
    activeSessionId,
    selectSession,
    createSession,
    deleteSession,
    renameSession,
    refresh,
  };
}
