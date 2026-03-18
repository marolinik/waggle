/**
 * Cockpit sub-component shared types.
 * Mirrors the data shapes returned by /health, /api/capabilities/status,
 * /api/cron, /api/connectors, and /api/audit/installs endpoints.
 */

export interface HealthData {
  status: 'ok' | 'degraded' | 'unavailable';
  mode: string;
  timestamp: string;
  llm: {
    provider: string;
    health: string;
    detail: string;
    checkedAt: string;
  };
  database: { healthy: boolean };
  memoryStats?: {
    frameCount: number;
    mindSizeBytes: number;
    embeddingCoverage: number;
  };
  serviceHealth?: {
    watchdogRunning: boolean;
    notificationSSEActive: boolean;
  };
  defaultModel?: string;
}

export interface CronSchedule {
  id: number;
  name: string;
  cronExpr: string;
  jobType: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

export interface AuditEntry {
  id: number;
  timestamp: string;
  capabilityName: string;
  capabilityType: string;
  source: string;
  riskLevel: 'low' | 'medium' | 'high';
  trustSource: string;
  approvalClass: string;
  action: 'proposed' | 'approved' | 'installed' | 'rejected' | 'failed';
  initiator: string;
  detail: string;
}

export interface CapabilitiesData {
  plugins: Array<{ name: string; state: string; tools: number; skills: number }>;
  mcpServers: Array<{ name: string; state: string; healthy: boolean; tools: number }>;
  skills: Array<{ name: string; length: number }>;
  tools: { count: number; native: number; plugin: number; mcp: number };
  commands: Array<{ name: string; description: string; usage: string }>;
  hooks: { registered: number };
  workflows: Array<{ name: string; description: string; steps: number }>;
}

export interface ConnectorData {
  id: string;
  name: string;
  status: string;
  service: string;
  authType: string;
  capabilities: string[];
  substrate: string;
}
