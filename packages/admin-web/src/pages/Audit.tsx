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

export function Audit() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Audit Log</h1>
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
          <tr>
            <td
              colSpan={5}
              style={{ padding: 24, textAlign: 'center', color: '#999' }}
            >
              Connect to server to see audit log
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
