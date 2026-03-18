/**
 * CockpitView — Control Cockpit dashboard.
 *
 * Composes 9 card sub-components in a responsive 2-column grid:
 *   1. System Health        2. Service Health
 *   3. Memory Stats         4. Vault Summary
 *   5. Cron Schedules       6. Capability Overview
 *   7. Agent Topology        8. Connectors
 *   9. Audit Trail
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

// ── Constants ────────────────────────────────────────────────────────────

const BASE_URL = 'http://127.0.0.1:3333';
const REFRESH_INTERVAL = 30_000;

// ── Component ────────────────────────────────────────────────────────────

export function CockpitView() {
  // ── State ──────────────────────────────────────────────────────────────
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState(false);
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

  // ── Effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchHealth();
    fetchSchedules();
    fetchCapabilities();
    fetchAudit();
    fetchConnectors();

    const interval = setInterval(fetchHealth, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchHealth, fetchSchedules, fetchCapabilities, fetchAudit, fetchConnectors]);

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
    <div className="px-8 py-6 max-w-[960px] mx-auto h-full overflow-y-auto font-mono">
      <h1 className="text-lg font-semibold mb-1">Cockpit</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Health, schedules, runtime status, memory, services, and audit trail.
      </p>

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
    </div>
  );
}
