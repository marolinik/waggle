/**
 * CockpitView — Control Cockpit dashboard.
 *
 * Composes 10 card sub-components in a responsive 2-column grid:
 *   1. System Health        2. Service Health
 *   3. Cost Estimates       4. Memory Stats
 *   5. Vault Summary        6. Cron Schedules
 *   7. Capability Overview  8. Agent Topology
 *   9. Connectors          10. Audit Trail
 *
 * F8: Skeleton loading state while data is fetching, error recovery with retry.
 */

import { useState, useEffect, useCallback } from 'react';
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
  CostDashboardCard,
} from '@/components/cockpit';
import type {
  HealthData,
  CronSchedule,
  AuditEntry,
  CapabilitiesData,
  ConnectorData,
  CostSummaryData,
  WorkspaceCostData,
} from '@/components/cockpit';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// ── Constants ────────────────────────────────────────────────────────────

import { getServerBaseUrl } from '@/lib/ipc';

const BASE_URL = getServerBaseUrl();
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
        Unable to load cockpit data. Check your connection and try again.
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

export default function CockpitView() {
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
  const [costSummary, setCostSummary] = useState<CostSummaryData | null>(null);
  const [workspaceCosts, setWorkspaceCosts] = useState<WorkspaceCostData | null>(null);

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

  const fetchCostSummary = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/cost/summary`);
      if (res.ok) {
        setCostSummary(await res.json());
      }
    } catch {
      /* silent */
    }
  }, []);

  const fetchWorkspaceCosts = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/cost/by-workspace`);
      if (res.ok) {
        setWorkspaceCosts(await res.json());
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
        fetchCostSummary(),
        fetchWorkspaceCosts(),
      ]);
    } catch {
      setFetchError(true);
    } finally {
      setInitialLoading(false);
    }
  }, [fetchHealth, fetchSchedules, fetchCapabilities, fetchAudit, fetchConnectors, fetchCostSummary, fetchWorkspaceCosts]);

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
    <div className="px-6 py-6 max-w-[960px] mx-auto h-full overflow-y-auto">
      <h1 className="text-lg font-semibold mb-1">Cockpit</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Health, costs, schedules, runtime status, memory, services, and audit trail.
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
          <CostDashboardCard costSummary={costSummary} workspaceCosts={workspaceCosts} />
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

          {/* W5.2: KVARK Enterprise health indicator */}
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-semibold text-foreground">KVARK Enterprise</h3>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${health?.kvark?.connected ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                <span>{health?.kvark?.connected ? 'Connected' : 'Not configured'}</span>
              </div>
              {!health?.kvark?.connected && (
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                  KVARK enables enterprise knowledge access with data sovereignty, audit trails, and governed actions.
                  Configure in Settings &gt; Team.
                </p>
              )}
              {health?.kvark?.connected && (
                <div className="text-[10px] space-y-1">
                  <div>Endpoint: <span className="font-mono text-foreground">{health.kvark.baseUrl ?? '—'}</span></div>
                  <div>Last ping: <span className="text-foreground">{health.kvark.lastPing ?? 'unknown'}</span></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
