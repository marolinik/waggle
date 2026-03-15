import React, { useEffect, useState } from 'react';
import { api, type AuditEntryResponse } from '../api.js';

interface AuditProps {
  token: string;
  teamSlug: string;
}

const TABLE_STYLE: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: 16,
  background: '#fff',
  borderRadius: 8,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const TH_STYLE: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  borderBottom: '2px solid #eee',
  fontSize: 13,
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const TD_STYLE: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 14,
};

function approvalLabel(entry: AuditEntryResponse): string {
  if (!entry.requiresApproval) return '—';
  if (entry.approved === true) return 'Approved';
  if (entry.approved === false) return 'Rejected';
  return 'Pending';
}

function approvalColor(entry: AuditEntryResponse): string {
  if (!entry.requiresApproval) return '#6b7280';
  if (entry.approved === true) return '#10b981';
  if (entry.approved === false) return '#ef4444';
  return '#f59e0b';
}

export function Audit({ token, teamSlug }: AuditProps) {
  const [entries, setEntries] = useState<AuditEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !teamSlug) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.listAudit(token, teamSlug);
        if (!cancelled) setEntries(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (!cancelled) {
          setError('Could not load audit log. You may need admin access, or the server is not running.');
          setEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token, teamSlug]);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Audit Log</h1>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#fffbeb',
          border: '1px solid #fbbf24',
          borderRadius: 4,
          color: '#92400e',
          marginBottom: 16,
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#999' }}>Loading audit log...</p>
      ) : entries.length === 0 && !error ? (
        <div style={{
          padding: 32,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center',
          color: '#999',
        }}>
          <p style={{ fontSize: 16, marginBottom: 4 }}>No audit entries</p>
          <p style={{ fontSize: 13 }}>Agent actions will appear here as they are logged.</p>
        </div>
      ) : entries.length > 0 ? (
        <table style={TABLE_STYLE}>
          <thead>
            <tr>
              <th style={TH_STYLE}>Agent</th>
              <th style={TH_STYLE}>Action</th>
              <th style={TH_STYLE}>Approval</th>
              <th style={TH_STYLE}>Details</th>
              <th style={TH_STYLE}>Time</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={TD_STYLE}>
                  <span style={{ fontWeight: 600 }}>{entry.agentName}</span>
                </td>
                <td style={TD_STYLE}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    background: '#e5e7eb',
                    color: '#374151',
                  }}>
                    {entry.actionType}
                  </span>
                </td>
                <td style={TD_STYLE}>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: approvalColor(entry),
                  }}>
                    {approvalLabel(entry)}
                  </span>
                </td>
                <td style={{ ...TD_STYLE, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.description}
                </td>
                <td style={TD_STYLE}>
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
