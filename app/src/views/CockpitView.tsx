/**
 * CockpitView — Control Cockpit dashboard.
 *
 * Composes 9 card sub-components in a responsive 2-column grid:
 *   1. System Health        2. Service Health
 *   3. Memory Stats         4. Vault Summary
 *   5. Cron Schedules       6. Capability Overview
 *   7. Agent Topology        8. Connectors
 *   9. Audit Trail
 *
 * F8: Skeleton loading state while data is fetching, error recovery with retry.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  SystemHealthCard,
  CronSchedulesCard,
  CapabilityOverviewCard,
  AgentTopologyCard,
  ConnectorsCard,
  AuditTrailCard,
  MemoryStatsCard,
  ServiceHealthCard,
  VaultSummaryCard,
} from '@/components/cockpit';
import type {
  HealthData,
  CronSchedule,
  AuditEntry,
  CapabilitiesData,
  ConnectorData,
} from '@/components/cockpit';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ── Constants ────────────────────────────────────────────────────────────

const BASE_URL = 'http://127.0.0.1:3333';
const REFRESH_INTERVAL = 30_000;

// ── F8: Skeleton loading cards ───────────────────────────────────────────

function CockpitSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))] gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} size="sm">
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── F8: Error state with retry ───────────────────────────────────────────

function CockpitError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="text-muted-foreground text-sm">
        Failed to load cockpit data. Is the server running?
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────

export function CockpitView() {
  // ── State ──────────────────────────────────────────────────────────────
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [schedules, setSchedules] = useState<CronSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<CapabilitiesData | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [connectors, setConnectors] = useState<ConnectorData[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectToken, setConnectToken] = useState('');

  // ── Fetchers ───────────────────────────────────────────────────────────

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        setHealth(await res.json());
        setHealthError(false);
        setFetchError(false);
      } else {
        setHealthError(true);
      }
    } catch {
      setHealthError(true);
      setHealth(null);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/cron`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules ?? []);
      }
    } catch {
      /* silent */
    } finally {
      setSchedulesLoading(false);
    }
  }, []);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/audit/installs?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setAuditEntries(data.entries ?? []);
      }
    } catch {
      /* silent */
    }
  }, []);

  const fetchCapabilities = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/capabilities/status`);
      if (res.ok) {
        setCapabilities(await res.json());
      }
    } catch {
      /* silent */
    }
  }, []);

  const fetchConnectors = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/connectors`);
      if (res.ok) {
        const data = await res.json();
        setConnectors(data.connectors ?? []);
      }
    } catch {
      /* silent */
    }
  }, []);

  // ── F8: Fetch all data with error tracking ─────────────────────────────

  const fetchAll = useCallback(async () => {
    setInitialLoading(true);
    setFetchError(false);
    try {
      await Promise.all([
        fetchHealth(),
        fetchSchedules(),
        fetchCapabilities(),
        fetchAudit(),
        fetchConnectors(),
      ]);
    } catch {
      setFetchError(true);
    } finally {
      setInitialLoading(false);
    }
  }, [fetchHealth, fetchSchedules, fetchCapabilities, fetchAudit, fetchConnectors]);

  // ── Effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAll();

    const interval = setInterval(fetchHealth, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll, fetchHealth]);

  // ── Actions ────────────────────────────────────────────────────────────

  const toggleSchedule = useCallback(
    async (id: number, currentEnabled: boolean) => {
      setTogglingId(id);
      try {
        const res = await fetch(`${BASE_URL}/api/cron/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !currentEnabled }),
        });
        if (res.ok) {
          await fetchSchedules();
        }
      } catch {
        /* silent */
      } finally {
        setTogglingId(null);
      }
    },
    [fetchSchedules],
  );

  const triggerSchedule = useCallback(
    async (id: number) => {
      setTriggeringId(id);
      try {
        const res = await fetch(`${BASE_URL}/api/cron/${id}/trigger`, { method: 'POST' });
        if (res.ok) {
          await fetchSchedules();
        }
      } catch {
        /* silent */
      } finally {
        setTriggeringId(null);
      }
    },
    [fetchSchedules],
  );

  const connectConnector = useCallback(
    async (id: string, token: string) => {
      setConnectingId(id);
      try {
        const res = await fetch(`${BASE_URL}/api/connectors/${id}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (res.ok) {
          setConnectToken('');
          await fetchConnectors();
        }
      } catch {
        /* silent */
      } finally {
        setConnectingId(null);
      }
    },
    [fetchConnectors],
  );

  const disconnectConnector = useCallback(
    async (id: string) => {
      setConnectingId(id);
      try {
        await fetch(`${BASE_URL}/api/connectors/${id}/disconnect`, { method: 'POST' });
        await fetchConnectors();
      } catch {
        /* silent */
      } finally {
        setConnectingId(null);
      }
    },
    [fetchConnectors],
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-6 max-w-[960px] mx-auto h-full overflow-y-auto font-mono">
      <h1 className="text-lg font-semibold mb-1">Cockpit</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Health, schedules, runtime status, memory, services, and audit trail.
      </p>

      {/* F8: Show skeleton while initial load is in progress */}
      {initialLoading && !health && <CockpitSkeleton />}

      {/* F8: Show error state with retry when all fetches fail */}
      {!initialLoading && fetchError && healthError && !health && (
        <CockpitError onRetry={fetchAll} />
      )}

      {/* Main content — shown once data starts arriving */}
      {(!initialLoading || health) && !(fetchError && healthError && !health) && (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))] gap-4">
          <SystemHealthCard health={health} healthError={healthError} />
          <ServiceHealthCard health={health} />
          <MemoryStatsCard health={health} />
          <VaultSummaryCard connectors={connectors} />
          <CronSchedulesCard
            schedules={schedules}
            schedulesLoading={schedulesLoading}
            togglingId={togglingId}
            triggeringId={triggeringId}
            onToggle={toggleSchedule}
            onTrigger={triggerSchedule}
          />
          <CapabilityOverviewCard capabilities={capabilities} />
          <AgentTopologyCard health={health} capabilities={capabilities} />
          <ConnectorsCard
            connectors={connectors}
            connectingId={connectingId}
            connectToken={connectToken}
            onConnectTokenChange={setConnectToken}
            onConnect={connectConnector}
            onDisconnect={disconnectConnector}
          />
          <AuditTrailCard auditEntries={auditEntries} />
        </div>
      )}
    </div>
  );
}
