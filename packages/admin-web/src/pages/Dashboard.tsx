import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <div
      style={{
        padding: 20,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ margin: 0, fontSize: 14, color: '#666' }}>{title}</h3>
      <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 'bold', color: '#1a1a2e' }}>
        {value}
      </p>
    </div>
  );
}

export function Dashboard() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 16,
        }}
      >
        <StatCard title="Teams" value="--" />
        <StatCard title="Active Jobs" value="--" />
        <StatCard title="Messages (24h)" value="--" />
        <StatCard title="Agents" value="--" />
      </div>
      <div style={{ marginTop: 32 }}>
        <h2>Recent Activity</h2>
        <p style={{ color: '#999' }}>Connect to server to see activity.</p>
      </div>
    </div>
  );
}
