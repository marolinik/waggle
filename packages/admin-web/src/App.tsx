import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard.js';
import { Jobs } from './pages/Jobs.js';
import { Audit } from './pages/Audit.js';
import { Members } from './pages/Members.js';
import { TeamSettings } from './pages/TeamSettings.js';

type Page = 'dashboard' | 'jobs' | 'audit' | 'members' | 'settings';

const NAV_ITEMS: { key: Page; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'members', label: 'Members' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'settings', label: 'Team Settings' },
];

export function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [token, setToken] = useState('');
  const [teamSlug, setTeamSlug] = useState('');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <nav
        style={{
          width: 220,
          padding: 16,
          background: '#1a1a2e',
          color: '#fff',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 24, letterSpacing: 1 }}>Waggle Admin</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <li key={item.key} style={{ marginBottom: 4 }}>
              <button
                onClick={() => setPage(item.key)}
                style={{
                  background: page === item.key ? '#16213e' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  borderRadius: 4,
                  fontSize: 14,
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Connection config at bottom of sidebar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, marginTop: 12 }}>
          <label style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Team Slug
          </label>
          <input
            type="text"
            value={teamSlug}
            onChange={(e) => setTeamSlug(e.target.value)}
            placeholder="my-team"
            style={{
              width: '100%',
              padding: '6px 8px',
              background: '#16213e',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4,
              color: '#fff',
              fontSize: 12,
              marginTop: 4,
              marginBottom: 8,
              boxSizing: 'border-box',
            }}
          />
          <label style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Auth Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Bearer token"
            style={{
              width: '100%',
              padding: '6px 8px',
              background: '#16213e',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4,
              color: '#fff',
              fontSize: 12,
              marginTop: 4,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </nav>
      <main style={{ flex: 1, padding: 24, background: '#fafafa' }}>
        {!token || !teamSlug ? (
          <div style={{ color: '#999', marginTop: 40, textAlign: 'center' }}>
            <h2 style={{ color: '#666' }}>Connect to a Team</h2>
            <p>Enter your team slug and auth token in the sidebar to get started.</p>
          </div>
        ) : (
          <>
            {page === 'dashboard' && <Dashboard token={token} teamSlug={teamSlug} />}
            {page === 'members' && <Members token={token} teamSlug={teamSlug} />}
            {page === 'jobs' && <Jobs token={token} teamSlug={teamSlug} />}
            {page === 'audit' && <Audit token={token} teamSlug={teamSlug} />}
            {page === 'settings' && <TeamSettings token={token} teamSlug={teamSlug} />}
          </>
        )}
      </main>
    </div>
  );
}
