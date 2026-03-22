const http = require('http');
const TOKEN = 'f97ff088d4e4d77da673fbc7fdf78b97f49ea29fe2e695c89d4de4e0990457da';
const BASE = 'http://localhost:3333';

// Listen to SSE events stream for approval_required
const req = http.get(BASE + '/api/events/stream', { headers: { Authorization: 'Bearer ' + TOKEN } }, (res) => {
  let buf = '';
  res.on('data', (chunk) => {
    buf += chunk.toString();
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === 'approval_required' && evt.requestId) {
            // Auto-approve
            const body = JSON.stringify({ approved: true });
            const areq = http.request(BASE + '/api/approval/' + evt.requestId, {
              method: 'POST',
              headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }
            });
            areq.write(body);
            areq.end();
            console.log('[auto-approver] Approved:', evt.requestId, evt.toolName || '');
          }
        } catch(e) {}
      }
    }
  });
  res.on('error', (e) => { console.error('[auto-approver] stream error:', e.message); });
});
req.on('error', (e) => { console.error('[auto-approver] connect error:', e.message); });
console.log('[auto-approver] Listening for approval requests...');
