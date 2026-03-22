/**
 * IMP-12: Concurrent Workspace Chat Test
 *
 * Verifies that Waggle handles truly simultaneous requests to different
 * workspaces with different models without cross-contamination.
 *
 * Usage: npx tsx "UAT 3/concurrent-test.ts"
 *
 * Prerequisites: Waggle server running on localhost:3333
 */

const BASE = 'http://localhost:3333';

interface SSEEvent {
  event: string;
  data: string;
}

function parseSSE(raw: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  for (const block of raw.split('\n\n').filter(Boolean)) {
    let event = '', data = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) event = line.slice(7);
      else if (line.startsWith('data: ')) data = line.slice(6);
    }
    if (event || data) events.push({ event, data });
  }
  return events;
}

async function createWorkspace(name: string, model?: string): Promise<string> {
  const res = await fetch(`${BASE}/api/workspaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, group: 'Test', model }),
  });
  if (!res.ok) throw new Error(`Failed to create workspace ${name}: ${res.status}`);
  const ws = await res.json() as { id: string };
  return ws.id;
}

async function sendChat(workspaceId: string, message: string): Promise<{
  content: string;
  model?: string;
  events: SSEEvent[];
}> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, workspace: workspaceId }),
  });
  const raw = await res.text();
  const events = parseSSE(raw);
  const done = events.find(e => e.event === 'done');
  const doneData = done ? JSON.parse(done.data) : {};
  return {
    content: doneData.content ?? '',
    model: doneData.model,
    events,
  };
}

async function deleteWorkspace(id: string): Promise<void> {
  await fetch(`${BASE}/api/workspaces/${id}`, { method: 'DELETE' });
}

async function getFleet(): Promise<{ count: number; sessions: any[] }> {
  const res = await fetch(`${BASE}/api/fleet`);
  return res.json() as Promise<{ count: number; sessions: any[] }>;
}

async function getMemoryFrames(workspaceId: string): Promise<any[]> {
  const res = await fetch(`${BASE}/api/memory/frames?workspace=${workspaceId}&limit=50`);
  const data = await res.json() as { results?: any[] };
  return data.results ?? [];
}

async function main() {
  console.log('=== Waggle Concurrent Workspace Test ===\n');

  // 1. Create 3 workspaces with different models
  console.log('Step 1: Creating 3 workspaces with different models...');
  const ws1 = await createWorkspace('Concurrent-Test-1', 'claude-sonnet-4-6');
  const ws2 = await createWorkspace('Concurrent-Test-2', 'claude-haiku-4-5-20251001');
  const ws3 = await createWorkspace('Concurrent-Test-3', 'claude-sonnet-4-6');
  console.log(`  Created: ${ws1}, ${ws2}, ${ws3}\n`);

  // 2. Fire 3 parallel chat requests
  console.log('Step 2: Sending 3 parallel chat requests...');
  const startTime = Date.now();

  const [r1, r2, r3] = await Promise.all([
    sendChat(ws1, 'Say "ALPHA" and nothing else.').catch(e => ({ content: `ERROR: ${e.message}`, model: undefined, events: [] })),
    sendChat(ws2, 'Say "BETA" and nothing else.').catch(e => ({ content: `ERROR: ${e.message}`, model: undefined, events: [] })),
    sendChat(ws3, 'Say "GAMMA" and nothing else.').catch(e => ({ content: `ERROR: ${e.message}`, model: undefined, events: [] })),
  ]);

  const elapsed = Date.now() - startTime;
  console.log(`  Completed in ${elapsed}ms\n`);

  // 3. Verify results
  console.log('Step 3: Verifying results...');

  const checks = [
    { name: 'WS1 responded', pass: r1.content.length > 0 && !r1.content.startsWith('ERROR'), detail: r1.content.slice(0, 50) },
    { name: 'WS2 responded', pass: r2.content.length > 0 && !r2.content.startsWith('ERROR'), detail: r2.content.slice(0, 50) },
    { name: 'WS3 responded', pass: r3.content.length > 0 && !r3.content.startsWith('ERROR'), detail: r3.content.slice(0, 50) },
    { name: 'No cross-contamination (WS1≠BETA/GAMMA)', pass: !r1.content.includes('BETA') && !r1.content.includes('GAMMA'), detail: '' },
    { name: 'No cross-contamination (WS2≠ALPHA/GAMMA)', pass: !r2.content.includes('ALPHA') && !r2.content.includes('GAMMA'), detail: '' },
    { name: 'No cross-contamination (WS3≠ALPHA/BETA)', pass: !r3.content.includes('ALPHA') && !r3.content.includes('BETA'), detail: '' },
  ];

  for (const c of checks) {
    console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}${c.detail ? ` — "${c.detail}"` : ''}`);
  }

  // 4. Check fleet
  console.log('\nStep 4: Fleet status...');
  const fleet = await getFleet();
  console.log(`  Active sessions: ${fleet.count}`);

  // 5. Check memory isolation
  console.log('\nStep 5: Memory isolation...');
  const m1 = await getMemoryFrames(ws1);
  const m2 = await getMemoryFrames(ws2);
  const m3 = await getMemoryFrames(ws3);
  console.log(`  WS1 frames: ${m1.length}, WS2 frames: ${m2.length}, WS3 frames: ${m3.length}`);

  // 6. Cleanup
  console.log('\nStep 6: Cleanup...');
  await deleteWorkspace(ws1);
  await deleteWorkspace(ws2);
  await deleteWorkspace(ws3);
  console.log('  Deleted all test workspaces');

  // Summary
  const passed = checks.filter(c => c.pass).length;
  const total = checks.length;
  console.log(`\n=== Result: ${passed}/${total} checks passed ===`);
  console.log(`Elapsed: ${elapsed}ms for 3 parallel requests`);

  if (passed < total) {
    console.log('\n⚠ Some checks failed — review results above.');
    process.exit(1);
  } else {
    console.log('\n✓ All concurrent checks passed!');
  }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
