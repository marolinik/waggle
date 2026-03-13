/**
 * CapabilitySection — settings panel showing plugin, MCP, skill, tool, and command status.
 *
 * Fetches from GET /api/capabilities/status and renders a capability dashboard.
 */

import React, { useState, useEffect, useCallback } from 'react';

interface PluginStatus {
  name: string;
  state: string;
  tools: number;
  skills: number;
}

interface McpServerStatus {
  name: string;
  state: string;
  healthy: boolean;
  tools: number;
}

interface SkillStatus {
  name: string;
  length: number;
}

interface CommandInfo {
  name: string;
  description: string;
  usage?: string;
}

interface HookActivity {
  event: string;
  timestamp: number;
  cancelled: boolean;
  reason?: string;
}

interface HooksInfo {
  registered: number;
  recentActivity: HookActivity[];
}

interface WorkflowInfo {
  name: string;
  description: string;
  steps: number;
}

interface CapabilityData {
  plugins: PluginStatus[];
  mcpServers: McpServerStatus[];
  skills: SkillStatus[];
  tools: { count: number; native: number; plugin: number; mcp: number };
  commands: CommandInfo[];
  hooks: HooksInfo;
  workflows: WorkflowInfo[];
}

export interface CapabilitySectionProps {
  baseUrl?: string;
}

const STATE_COLORS: Record<string, string> = {
  active: '#22c55e',
  enabled: '#3b82f6',
  installed: '#a78bfa',
  disabled: '#6b7280',
  error: '#ef4444',
  ready: '#22c55e',
  starting: '#eab308',
  stopped: '#6b7280',
};

function StateBadge({ state }: { state: string }) {
  const color = STATE_COLORS[state] ?? '#6b7280';
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        padding: '2px 10px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {state}
    </span>
  );
}

function HealthDot({ healthy }: { healthy: boolean }) {
  return (
    <span
      title={healthy ? 'Healthy' : 'Unhealthy'}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: healthy ? '#22c55e' : '#ef4444',
        marginRight: 6,
        flexShrink: 0,
      }}
    />
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CapabilitySection({ baseUrl = 'http://127.0.0.1:3333' }: CapabilitySectionProps) {
  const [data, setData] = useState<CapabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCommands, setExpandedCommands] = useState(false);

  const fetchCapabilities = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/capabilities/status`);
      if (res.ok) {
        const json = (await res.json()) as CapabilityData;
        setData(json);
        setError(null);
      } else {
        setError(`Failed to load capabilities (${res.status})`);
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const togglePlugin = useCallback(async (name: string, currentState: string) => {
    const action = (currentState === 'active' || currentState === 'enabled') ? 'disable' : 'enable';
    try {
      const res = await fetch(`${baseUrl}/api/capabilities/plugins/${encodeURIComponent(name)}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(`Failed to ${action} plugin: ${body.error}`);
        return;
      }
      await fetchCapabilities();
    } catch {
      setError(`Failed to ${action} plugin "${name}"`);
    }
  }, [baseUrl, fetchCapabilities]);

  useEffect(() => {
    fetchCapabilities();
  }, [fetchCapabilities]);

  // Shared styles matching SkillsSection
  const sectionStyle: React.CSSProperties = { marginBottom: 32 };
  const headingStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text, #e0e0e0)',
    marginBottom: 8,
  };
  const subStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-muted, #888)',
    marginBottom: 16,
  };
  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-tertiary, #1a1a2e)',
    border: '1px solid var(--border, #333)',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 8,
  };
  const pillStyle: React.CSSProperties = {
    display: 'inline-block',
    background: 'var(--bg-tertiary, #1a1a2e)',
    border: '1px solid var(--border, #333)',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text, #e0e0e0)',
  };
  const pillValueStyle: React.CSSProperties = {
    fontWeight: 700,
    color: 'var(--brand, #E8920F)',
    marginRight: 4,
  };

  if (loading) {
    return <div style={{ color: 'var(--text-dim, #555)', padding: 24 }}>Loading capabilities...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            background: '#3b1818',
            border: '1px solid #7f1d1d',
            borderRadius: 8,
            padding: '8px 12px',
            color: '#f87171',
            fontSize: 13,
          }}
        >
          {error}
          <button
            onClick={fetchCapabilities}
            style={{
              float: 'right',
              background: 'none',
              border: '1px solid #7f1d1d',
              borderRadius: 4,
              color: '#f87171',
              cursor: 'pointer',
              padding: '2px 8px',
              fontSize: 11,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const activePlugins = data.plugins.filter(p => p.state === 'active').length;
  const healthyMcp = data.mcpServers.filter(s => s.healthy).length;

  return (
    <div>
      {/* Overview Summary */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Capability Overview</div>
        <div style={subStyle}>
          Aggregated view of all agent capabilities — tools, skills, plugins, MCP servers, and
          commands.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={pillStyle}>
            <span style={pillValueStyle}>{data.tools.count}</span> tools
            <span style={{ color: 'var(--text-dim, #555)', fontSize: 11, marginLeft: 6 }}>
              ({data.tools.native} native, {data.tools.plugin} plugin, {data.tools.mcp} mcp)
            </span>
          </span>
          <span style={pillStyle}>
            <span style={pillValueStyle}>{data.skills.length}</span> skills
          </span>
          <span style={pillStyle}>
            <span style={pillValueStyle}>{data.commands.length}</span> commands
          </span>
          <span style={pillStyle}>
            <span style={pillValueStyle}>{activePlugins}</span> / {data.plugins.length} plugins
          </span>
          <span style={pillStyle}>
            <span style={pillValueStyle}>{healthyMcp}</span> / {data.mcpServers.length} MCP servers
          </span>
          <span style={pillStyle}>
            <span style={pillValueStyle}>{data.hooks.registered}</span> hook events
          </span>
          <span style={pillStyle}>
            <span style={pillValueStyle}>{data.workflows.length}</span> workflow templates
          </span>
        </div>
      </div>

      {/* Plugins */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Plugins</div>
        <div style={subStyle}>Runtime-managed plugin lifecycle with tool and skill contributions.</div>
        {data.plugins.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-dim, #555)' }}>
            No plugins registered. Install plugins via Settings &gt; Skills &amp; Plugins.
          </div>
        ) : (
          data.plugins.map(plugin => (
            <div key={plugin.name} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      color: 'var(--text, #e0e0e0)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                    }}
                  >
                    {plugin.name}
                  </span>
                  <StateBadge state={plugin.state} />
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted, #888)', alignItems: 'center' }}>
                  <span>{plugin.tools} tools</span>
                  <span>{plugin.skills} skills</span>
                  <button
                    onClick={() => togglePlugin(plugin.name, plugin.state)}
                    style={{
                      border: '1px solid var(--border, #333)',
                      borderRadius: 4,
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: 'var(--bg-secondary, #222)',
                      color: (plugin.state === 'active' || plugin.state === 'enabled')
                        ? '#ef4444'
                        : '#22c55e',
                    }}
                  >
                    {(plugin.state === 'active' || plugin.state === 'enabled') ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MCP Servers */}
      <div style={sectionStyle}>
        <div style={headingStyle}>MCP Servers</div>
        <div style={subStyle}>
          Model Context Protocol servers providing external tools and data sources.
        </div>
        {data.mcpServers.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-dim, #555)' }}>
            No MCP servers configured. Add MCP servers via plugin manifests or configuration.
          </div>
        ) : (
          data.mcpServers.map(server => (
            <div key={server.name} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HealthDot healthy={server.healthy} />
                  <span
                    style={{
                      fontWeight: 600,
                      color: 'var(--text, #e0e0e0)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                    }}
                  >
                    {server.name}
                  </span>
                  <StateBadge state={server.state} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #888)' }}>
                  {server.tools} tools
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Commands */}
      <div style={sectionStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div>
            <div style={headingStyle}>Commands</div>
            <div style={subStyle}>Registered slash commands available in the chat input.</div>
          </div>
          {data.commands.length > 0 && (
            <button
              onClick={() => setExpandedCommands(!expandedCommands)}
              style={{
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                background: 'var(--bg-secondary, #222)',
                color: 'var(--text-muted, #888)',
              }}
            >
              {expandedCommands ? 'Collapse' : 'Expand'} ({data.commands.length})
            </button>
          )}
        </div>
        {data.commands.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-dim, #555)' }}>
            No commands registered. Commands become available when the command registry is loaded.
          </div>
        ) : expandedCommands ? (
          data.commands.map(cmd => (
            <div key={cmd.name} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--brand, #E8920F)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    minWidth: 100,
                  }}
                >
                  /{cmd.name}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted, #888)' }}>
                  {cmd.description}
                </span>
              </div>
              {cmd.usage && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: 'var(--text-dim, #555)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Usage: {cmd.usage}
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ ...cardStyle, color: 'var(--text-muted, #888)', fontSize: 13 }}>
            {data.commands.length} commands registered. Click Expand to see details.
          </div>
        )}
      </div>

      {/* Hooks */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Hooks</div>
        <div style={subStyle}>
          Lifecycle hook events for pre/post tool execution, memory writes, and workflow stages.
        </div>
        <div style={{ marginBottom: 12 }}>
          <span style={pillStyle}>
            <span style={pillValueStyle}>{data.hooks.registered}</span> hook events supported
          </span>
        </div>
        {data.hooks.recentActivity.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-dim, #555)' }}>
            No hook activity recorded yet.
          </div>
        ) : (
          data.hooks.recentActivity.map((entry, i) => (
            <div key={`${entry.event}-${entry.timestamp}-${i}`} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      color: 'var(--text, #e0e0e0)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                    }}
                  >
                    {entry.event}
                  </span>
                  {entry.cancelled && (
                    <span
                      style={{
                        background: '#ef444422',
                        color: '#ef4444',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      cancelled
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {entry.reason && (
                    <span style={{ fontSize: 11, color: 'var(--text-dim, #555)' }}>
                      {entry.reason}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-muted, #888)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatTimeAgo(entry.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Workflow Templates */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Workflow Templates</div>
        <div style={subStyle}>
          Built-in multi-agent workflow templates for common collaboration patterns.
        </div>
        {data.workflows.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-dim, #555)' }}>
            No workflow templates available.
          </div>
        ) : (
          data.workflows.map(wf => (
            <div key={wf.name} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span
                    style={{
                      fontWeight: 600,
                      color: 'var(--text, #e0e0e0)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                    }}
                  >
                    {wf.name}
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, #888)', marginTop: 4 }}>
                    {wf.description}
                  </div>
                </div>
                <span style={pillStyle}>
                  <span style={pillValueStyle}>{wf.steps}</span> steps
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
