/**
 * Members page — team member management.
 *
 * View members, invite new ones, change roles, remove.
 * Talks to team server via api.ts.
 */

import React, { useEffect, useState } from 'react';
import { api, type TeamMemberResponse } from '../api.js';

interface MembersProps {
  token: string;
  teamSlug: string;
}

const ROLES = ['owner', 'admin', 'member', 'viewer'] as const;

export function Members({ token, teamSlug }: MembersProps) {
  const [members, setMembers] = useState<TeamMemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const team = await api.getTeam(token, teamSlug);
      setMembers(team.members ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && teamSlug) fetchMembers();
  }, [token, teamSlug]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      setInviting(true);
      setError(null);
      await api.inviteMember(token, teamSlug, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      await fetchMembers();
    } catch (err: any) {
      setError(err.message ?? 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setError(null);
      await api.updateMemberRole(token, teamSlug, userId, newRole);
      await fetchMembers();
    } catch (err: any) {
      setError(err.message ?? 'Role change failed');
    }
  };

  const handleRemove = async (userId: string, displayName?: string) => {
    const name = displayName ?? userId;
    if (!confirm(`Remove ${name} from the team?`)) return;
    try {
      setError(null);
      await api.removeMember(token, teamSlug, userId);
      await fetchMembers();
    } catch (err: any) {
      setError(err.message ?? 'Remove failed');
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Team Members</h1>

      {error && (
        <div style={{
          padding: '8px 12px',
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: 4,
          color: '#991b1b',
          marginBottom: 16,
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Invite form */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        padding: 16,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <input
          type="email"
          placeholder="user@example.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            fontSize: 14,
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            fontSize: 14,
          }}
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
        <button
          onClick={handleInvite}
          disabled={inviting || !inviteEmail.trim()}
          style={{
            padding: '8px 16px',
            background: '#1a1a2e',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: inviting ? 'wait' : 'pointer',
            fontSize: 14,
            opacity: inviting || !inviteEmail.trim() ? 0.6 : 1,
          }}
        >
          {inviting ? 'Inviting...' : 'Invite'}
        </button>
      </div>

      {/* Member list */}
      {loading ? (
        <p style={{ color: '#999' }}>Loading members...</p>
      ) : members.length === 0 ? (
        <p style={{ color: '#999' }}>No members found. Invite someone to get started.</p>
      ) : (
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Joined</th>
              <th style={{ ...thStyle, width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.userId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={tdStyle}>{m.displayName ?? m.userId}</td>
                <td style={tdStyle}>{m.email ?? '—'}</td>
                <td style={tdStyle}>
                  {m.role === 'owner' ? (
                    <span style={{
                      padding: '2px 8px',
                      background: '#fef3c7',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      Owner
                    </span>
                  ) : (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: 4,
                        fontSize: 13,
                      }}
                    >
                      {ROLES.filter((r) => r !== 'owner').map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td style={tdStyle}>
                  {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}
                </td>
                <td style={tdStyle}>
                  {m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemove(m.userId, m.displayName)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: 13,
                        padding: '4px 8px',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 13,
  color: '#6b7280',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 14,
};
