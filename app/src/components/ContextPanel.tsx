/**
 * ContextPanel — Right panel showing contextual content based on current view.
 *
 * Chat view: SessionList + optional document preview
 * Memory view: FrameDetail (selected frame)
 * Capabilities view: installed packs + marketplace placeholder
 * Cockpit view: quick actions
 * Events view: filter checkboxes + stats
 * Settings view: contextual help per tab
 */

import { useState, useCallback } from 'react';
import type { Session, SessionSearchResult, Frame, FileEntry, TeamMember, ActivityItem, TeamMessage } from '@waggle/ui';
import { SessionList, FrameDetail, FilePreview, TeamPresence, ActivityFeed, TeamMessages } from '@waggle/ui';

type AppView = 'chat' | 'memory' | 'events' | 'capabilities' | 'cockpit' | 'settings';

export interface ContextPanelProps {
  currentView: AppView;
  groupedSessions: Record<string, Session[]>;
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  selectedFrame?: Frame;
  /** File to preview in the panel (set by agent file ops or file upload). */
  previewFile?: FileEntry | null;
  onClosePreview?: () => void;
  /** Recent memory highlights for the active workspace */
  recentMemories?: Array<{ content: string; importance: string; date: string }>;
  /** F3: Session export */
  onExportSession?: (id: string) => void;
  /** F1: Session search */
  onSearchSessions?: (query: string) => void;
  searchResults?: SessionSearchResult[] | null;
  searchLoading?: boolean;
  onClearSearch?: () => void;
  /** I4: Team presence members (shown for team workspaces) */
  teamMembers?: TeamMember[];
  /** J1: Team activity feed items */
  teamActivity?: ActivityItem[];
  teamActivityLoading?: boolean;
  /** Wave 2.4: Waggle Dance messages */
  teamMessages?: TeamMessage[];
  /** F5: Cockpit health refresh callback */
  onRefreshHealth?: () => void;
  /** F5: Active settings tab for contextual help */
  settingsTab?: string;
  /** F5: Event filter state for context panel checkboxes */
  eventFilters?: Record<string, boolean>;
  onEventFiltersChange?: (filters: Record<string, boolean>) => void;
}

function PanelHeader({ label, action }: { label: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div style={{
      padding: '10px 12px',
      borderBottom: '1px solid var(--border)',
      fontSize: '9px',
      fontWeight: 600,
      color: 'var(--text-dim)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      fontFamily: "'JetBrains Mono', monospace",
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      {label}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 9,
            padding: '2px 4px',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ContextPanel({
  currentView,
  groupedSessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  selectedFrame,
  previewFile,
  onClosePreview,
  recentMemories,
  onExportSession,
  onSearchSessions,
  searchResults,
  searchLoading,
  onClearSearch,
  teamMembers,
  teamActivity,
  teamActivityLoading,
  teamMessages,
  onRefreshHealth,
  settingsTab,
  eventFilters,
  onEventFiltersChange,
}: ContextPanelProps) {
  if (currentView === 'chat') {
    // If there's a file to preview, show it above sessions
    if (previewFile) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <PanelHeader
            label="Document Preview"
            action={onClosePreview ? { label: '\u2715 Close', onClick: onClosePreview } : undefined}
          />
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <FilePreview file={previewFile} />
          </div>
          <PanelHeader label="Sessions" />
          <div style={{ maxHeight: '30%', overflow: 'auto' }}>
            <SessionList
              grouped={groupedSessions}
              activeSessionId={activeSessionId}
              onSelectSession={onSelectSession}
              onCreateSession={onCreateSession}
              onDeleteSession={onDeleteSession}
              onRenameSession={onRenameSession}
              onExportSession={onExportSession}
              onSearch={onSearchSessions}
              searchResults={searchResults}
              searchLoading={searchLoading}
              onClearSearch={onClearSearch}
            />
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {recentMemories && recentMemories.length > 0 && (
          <>
            <PanelHeader label="Memory" />
            <div style={{
              maxHeight: '35%',
              overflow: 'auto',
              borderBottom: '1px solid var(--border)',
            }}>
              {recentMemories.slice(0, 4).map((mem, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  borderBottom: i < Math.min(recentMemories.length, 4) - 1 ? '1px solid var(--border-subtle, rgba(255,255,255,0.05))' : 'none',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                  }}>
                    {mem.content}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: 'var(--text-dim)',
                    marginTop: '3px',
                    display: 'flex',
                    gap: '6px',
                  }}>
                    <span>{mem.date}</span>
                    {mem.importance !== 'normal' && (
                      <span style={{
                        color: mem.importance === 'critical' ? 'var(--error, #ef4444)' : 'var(--primary, #E8920F)',
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.05em',
                      }}>
                        {mem.importance}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {/* I4: Team presence */}
        {teamMembers && teamMembers.length > 0 && (
          <>
            <PanelHeader label="Team" />
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
              <TeamPresence members={teamMembers} />
            </div>
          </>
        )}
        {/* J1: Team activity feed */}
        {(teamActivity && teamActivity.length > 0 || teamActivityLoading) && (
          <>
            <PanelHeader label="Activity" />
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <ActivityFeed items={teamActivity ?? []} loading={teamActivityLoading} />
            </div>
          </>
        )}
        {/* Wave 2.4: Waggle Dance messages */}
        {teamMessages && teamMessages.length > 0 && (
          <>
            <PanelHeader label="Messages" />
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <TeamMessages messages={teamMessages} />
            </div>
          </>
        )}
        <PanelHeader label="Sessions" />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <SessionList
            grouped={groupedSessions}
            activeSessionId={activeSessionId}
            onSelectSession={onSelectSession}
            onCreateSession={onCreateSession}
            onDeleteSession={onDeleteSession}
            onRenameSession={onRenameSession}
            onExportSession={onExportSession}
            onSearch={onSearchSessions}
            searchResults={searchResults}
            searchLoading={searchLoading}
            onClearSearch={onClearSearch}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'memory' && selectedFrame) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <PanelHeader label="Frame Detail" />
        <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
          <FrameDetail frame={selectedFrame} />
        </div>
      </div>
    );
  }

  // ── F5: Capabilities view context ──────────────────────────────────
  if (currentView === 'capabilities') {
    return <CapabilitiesContext />;
  }

  // ── F5: Cockpit view context ───────────────────────────────────────
  if (currentView === 'cockpit') {
    return <CockpitContext onRefreshHealth={onRefreshHealth} />;
  }

  // ── F5: Events view context ────────────────────────────────────────
  if (currentView === 'events') {
    return (
      <EventsContext
        filters={eventFilters}
        onFiltersChange={onEventFiltersChange}
      />
    );
  }

  // ── F5: Settings view context ──────────────────────────────────────
  if (currentView === 'settings') {
    return <SettingsContext activeTab={settingsTab} />;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// F5: Sub-components for each view's context panel
// ═══════════════════════════════════════════════════════════════════════

const BUILT_IN_PACKS = [
  { name: 'Research Workflow', id: 'research-workflow' },
  { name: 'Writing Suite', id: 'writing-suite' },
  { name: 'Planning Master', id: 'planning-master' },
  { name: 'Team Collaboration', id: 'team-collaboration' },
  { name: 'Decision Framework', id: 'decision-framework' },
];

function CapabilitiesContext() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelHeader label="Installed" />
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        {BUILT_IN_PACKS.map((pack) => (
          <div
            key={pack.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 0',
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#3fb950',
              flexShrink: 0,
            }} />
            <span style={{ flex: 1 }}>{pack.name}</span>
            <span style={{
              fontSize: '9px',
              color: 'var(--text-dim)',
              opacity: 0.6,
            }}>
              built-in
            </span>
          </div>
        ))}
      </div>
      <PanelHeader label="Suggested" />
      <div style={{
        padding: '12px',
        fontSize: '11px',
        color: 'var(--text-dim)',
        lineHeight: 1.5,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        Marketplace suggestions will appear here after Wave 8A.
      </div>
    </div>
  );
}

function CockpitContext({ onRefreshHealth }: { onRefreshHealth?: () => void }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefreshHealth || refreshing) return;
    setRefreshing(true);
    try {
      onRefreshHealth();
    } finally {
      // Brief visual feedback then reset
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [onRefreshHealth, refreshing]);

  const btnBase: React.CSSProperties = {
    width: '100%',
    padding: '7px 12px',
    fontSize: '11px',
    fontWeight: 500,
    fontFamily: "'JetBrains Mono', monospace",
    borderRadius: '4px',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.12s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelHeader label="Quick Actions" />
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          style={{
            ...btnBase,
            background: refreshing ? 'var(--primary-muted)' : 'var(--bg-secondary, #161b22)',
            color: refreshing ? 'var(--primary)' : 'var(--text-muted)',
          }}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Health'}
        </button>
        <button
          style={{
            ...btnBase,
            background: 'var(--bg-secondary, #161b22)',
            color: 'var(--text-dim)',
            cursor: 'not-allowed',
            opacity: 0.5,
          }}
          disabled
          title="Available after Wave 8A"
        >
          Trigger Sync
        </button>
      </div>
    </div>
  );
}

const EVENT_TYPES = ['Tool Call', 'Memory', 'Search', 'File', 'Response'] as const;

function EventsContext({
  filters,
  onFiltersChange,
}: {
  filters?: Record<string, boolean>;
  onFiltersChange?: (filters: Record<string, boolean>) => void;
}) {
  // Local state for checkboxes (all on by default)
  const effectiveFilters = filters ?? Object.fromEntries(EVENT_TYPES.map(t => [t, true]));

  const handleToggle = (type: string) => {
    const updated = { ...effectiveFilters, [type]: !effectiveFilters[type] };
    onFiltersChange?.(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelHeader label="Filter" />
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        {EVENT_TYPES.map((type) => (
          <label
            key={type}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 0',
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={effectiveFilters[type] !== false}
              onChange={() => handleToggle(type)}
              style={{
                accentColor: 'var(--primary)',
                width: 13,
                height: 13,
                cursor: 'pointer',
              }}
            />
            {type}
          </label>
        ))}
      </div>
      <PanelHeader label="Stats" />
      <div style={{
        padding: '12px',
        fontSize: '11px',
        color: 'var(--text-dim)',
        lineHeight: 1.8,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <div>Event statistics available during active agent sessions.</div>
      </div>
    </div>
  );
}

const SETTINGS_HELP: Record<string, string> = {
  general: 'Configure appearance and startup behavior.',
  models: 'Set your default AI model and API keys.',
  vault: 'Manage encrypted credentials for connectors.',
  permissions: 'Control what the agent can do without asking.',
  team: 'Connect to your team server.',
  advanced: 'Data management and debugging.',
};

function SettingsContext({ activeTab }: { activeTab?: string }) {
  const tab = activeTab ?? 'general';
  const help = SETTINGS_HELP[tab] ?? SETTINGS_HELP.general;
  const tabName = tab.charAt(0).toUpperCase() + tab.slice(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelHeader label="Help" />
      <div style={{ padding: '12px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text, #e6edf3)',
          marginBottom: '6px',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {tabName}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {help}
        </div>
      </div>
      <PanelHeader label="All Sections" />
      <div style={{ padding: '8px 12px' }}>
        {Object.entries(SETTINGS_HELP).map(([key, desc]) => (
          <div
            key={key}
            style={{
              padding: '5px 0',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              color: key === tab ? 'var(--primary)' : 'var(--text-dim)',
              borderLeft: key === tab ? '2px solid var(--primary)' : '2px solid transparent',
              paddingLeft: '8px',
              transition: 'all 0.12s',
            }}
          >
            <div style={{ fontWeight: key === tab ? 600 : 400 }}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </div>
            <div style={{
              fontSize: '9px',
              color: 'var(--text-dim)',
              opacity: 0.7,
              marginTop: '1px',
            }}>
              {desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
