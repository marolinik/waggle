/**
 * useTeamPresence — polls team presence data for team workspaces.
 *
 * Only active when the current workspace has a teamId.
 * Polls every 30 seconds via the local server's /api/team/presence proxy.
 */

import { useState, useEffect, useRef } from 'react';
import type { TeamMember } from '../services/types.js';

export interface UseTeamPresenceOptions {
  /** Base URL of the local server */
  baseUrl?: string;
  /** Current workspace's teamId (null/undefined = not a team workspace) */
  teamId?: string;
  /** Poll interval in ms (default: 30000) */
  pollInterval?: number;
}

export interface UseTeamPresenceReturn {
  members: TeamMember[];
  loading: boolean;
}

export function useTeamPresence({
  baseUrl = 'http://127.0.0.1:3333',
  teamId,
  pollInterval = 30000,
}: UseTeamPresenceOptions): UseTeamPresenceReturn {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!teamId) {
      setMembers([]);
      return;
    }

    const fetchPresence = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${baseUrl}/api/team/presence?workspaceId=${teamId}`);
        if (res.ok) {
          const data = await res.json() as { members: TeamMember[] };
          setMembers(data.members ?? []);
        }
      } catch {
        // Non-critical — presence is optional
      } finally {
        setLoading(false);
      }
    };

    fetchPresence();
    intervalRef.current = setInterval(fetchPresence, pollInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [baseUrl, teamId, pollInterval]);

  return { members, loading };
}
