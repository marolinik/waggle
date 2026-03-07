import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard.js';
import { Jobs } from './pages/Jobs.js';
import { Audit } from './pages/Audit.js';

type Page = 'dashboard' | 'jobs' | 'audit';

const NAV_ITEMS: { key: Page; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'audit', label: 'Audit Log' },
];

export function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <nav
        style={{
          width: 220,
          padding: 16,
          background: '#1a1a2e',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 24, letterSpacing: 1 }}>Waggle Admin</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
      </nav>
      <main style={{ flex: 1, padding: 24, background: '#fafafa' }}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'jobs' && <Jobs />}
        {page === 'audit' && <Audit />}
      </main>
    </div>
  );
}
