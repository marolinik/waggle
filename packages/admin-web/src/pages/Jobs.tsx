import React from 'react';

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

export function Jobs() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Agent Jobs</h1>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            <th style={TH_STYLE}>ID</th>
            <th style={TH_STYLE}>Type</th>
            <th style={TH_STYLE}>Status</th>
            <th style={TH_STYLE}>Agent</th>
            <th style={TH_STYLE}>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={5}
              style={{ padding: 24, textAlign: 'center', color: '#999' }}
            >
              Connect to server to see jobs
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
