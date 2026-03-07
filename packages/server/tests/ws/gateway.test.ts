import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { ConnectionManager } from '../../src/ws/connection-manager.js';

// ─── ConnectionManager unit tests ───────────────────────────────────────────

describe('ConnectionManager', () => {
  it('tracks connections by team and user', () => {
    const cm = new ConnectionManager();
    const mockWs = { readyState: 1, OPEN: 1, send: vi.fn() } as any;

    cm.add('team1', 'user1', mockWs);
    expect(cm.getConnectedUsers('team1')).toEqual(['user1']);

    cm.remove('team1', 'user1');
    expect(cm.getConnectedUsers('team1')).toEqual([]);
  });

  it('returns empty array for unknown team', () => {
    const cm = new ConnectionManager();
    expect(cm.getConnectedUsers('nonexistent')).toEqual([]);
  });

  it('removes team entry when last user disconnects', () => {
    const cm = new ConnectionManager();
    const mockWs = { readyState: 1, OPEN: 1, send: vi.fn() } as any;

    cm.add('team1', 'user1', mockWs);
    expect(cm.getTeamCount()).toBe(1);

    cm.remove('team1', 'user1');
    expect(cm.getTeamCount()).toBe(0);
  });

  it('tracks multiple users in same team', () => {
    const cm = new ConnectionManager();
    const ws1 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;
    const ws2 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;

    cm.add('team1', 'user1', ws1);
    cm.add('team1', 'user2', ws2);
    expect(cm.getConnectedUsers('team1')).toEqual(['user1', 'user2']);
  });

  it('tracks users across multiple teams', () => {
    const cm = new ConnectionManager();
    const ws1 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;
    const ws2 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;

    cm.add('team1', 'user1', ws1);
    cm.add('team2', 'user2', ws2);
    expect(cm.getConnectedUsers('team1')).toEqual(['user1']);
    expect(cm.getConnectedUsers('team2')).toEqual(['user2']);
    expect(cm.getTeamCount()).toBe(2);
  });

  it('broadcasts to all team members', () => {
    const cm = new ConnectionManager();
    const ws1 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;
    const ws2 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;

    cm.add('team1', 'user1', ws1);
    cm.add('team1', 'user2', ws2);

    cm.broadcast('team1', { type: 'task_update', task: {} as any });
    expect(ws1.send).toHaveBeenCalledOnce();
    expect(ws2.send).toHaveBeenCalledOnce();

    const sentData = JSON.parse(ws1.send.mock.calls[0][0]);
    expect(sentData.type).toBe('task_update');
  });

  it('excludes user from broadcast', () => {
    const cm = new ConnectionManager();
    const ws1 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;
    const ws2 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;

    cm.add('team1', 'user1', ws1);
    cm.add('team1', 'user2', ws2);

    cm.broadcast('team1', { type: 'task_update', task: {} as any }, 'user1');
    expect(ws1.send).not.toHaveBeenCalled();
    expect(ws2.send).toHaveBeenCalledOnce();
  });

  it('skips sockets that are not OPEN', () => {
    const cm = new ConnectionManager();
    const wsOpen = { readyState: 1, OPEN: 1, send: vi.fn() } as any;
    const wsClosed = { readyState: 3, OPEN: 1, send: vi.fn() } as any; // readyState 3 = CLOSED

    cm.add('team1', 'user1', wsOpen);
    cm.add('team1', 'user2', wsClosed);

    cm.broadcast('team1', { type: 'task_update', task: {} as any });
    expect(wsOpen.send).toHaveBeenCalledOnce();
    expect(wsClosed.send).not.toHaveBeenCalled();
  });

  it('sends to specific user', () => {
    const cm = new ConnectionManager();
    const ws1 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;
    const ws2 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;

    cm.add('team1', 'user1', ws1);
    cm.add('team1', 'user2', ws2);

    cm.sendTo('team1', 'user1', { type: 'suggestion', suggestion: {} as any });
    expect(ws1.send).toHaveBeenCalledOnce();
    expect(ws2.send).not.toHaveBeenCalled();

    const sentData = JSON.parse(ws1.send.mock.calls[0][0]);
    expect(sentData.type).toBe('suggestion');
  });

  it('sendTo does nothing for nonexistent user', () => {
    const cm = new ConnectionManager();
    // Should not throw
    cm.sendTo('team1', 'nobody', { type: 'task_update', task: {} as any });
  });

  it('sendTo does nothing for closed socket', () => {
    const cm = new ConnectionManager();
    const wsClosed = { readyState: 3, OPEN: 1, send: vi.fn() } as any;

    cm.add('team1', 'user1', wsClosed);
    cm.sendTo('team1', 'user1', { type: 'task_update', task: {} as any });
    expect(wsClosed.send).not.toHaveBeenCalled();
  });

  it('broadcast does nothing for nonexistent team', () => {
    const cm = new ConnectionManager();
    // Should not throw
    cm.broadcast('nonexistent', { type: 'task_update', task: {} as any });
  });

  it('replaces connection when same user re-adds', () => {
    const cm = new ConnectionManager();
    const ws1 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;
    const ws2 = { readyState: 1, OPEN: 1, send: vi.fn() } as any;

    cm.add('team1', 'user1', ws1);
    cm.add('team1', 'user1', ws2); // replace

    cm.broadcast('team1', { type: 'task_update', task: {} as any });
    expect(ws1.send).not.toHaveBeenCalled();
    expect(ws2.send).toHaveBeenCalledOnce();
    expect(cm.getConnectedUsers('team1')).toEqual(['user1']);
  });
});

// ─── WebSocket Gateway integration tests ────────────────────────────────────
// These require PostgreSQL + Redis running (ports 5434 / 6381)

describe('WebSocket Gateway (integration)', () => {
  let server: Awaited<ReturnType<typeof import('../../src/index.js').buildServer>>;
  let address: string;
  let userId: string;
  let teamSlug: string;

  beforeAll(async () => {
    const { buildServer } = await import('../../src/index.js');
    server = await buildServer();

    // Override auth to bypass Clerk
    (server as any)._authHandler.fn = async (req: any, reply: any) => {
      const testUserId = req.headers['x-test-user-id'] as string;
      if (!testUserId) return reply.code(401).send({ error: 'Missing test user' });
      req.userId = testUserId;
      req.clerkId = 'test';
    };

    // Create test user and team
    const { users, teams, teamMembers } = await import('../../src/db/schema.js');

    const [user] = await server.db
      .insert(users)
      .values({
        clerkId: 'wstest_user1',
        displayName: 'WS User',
        email: `wsuser_${Date.now()}@test.com`,
      })
      .returning();
    userId = user.id;

    teamSlug = `ws-test-team-${Date.now()}`;
    const [team] = await server.db
      .insert(teams)
      .values({ name: 'WS Team', slug: teamSlug, ownerId: userId })
      .returning();

    await server.db
      .insert(teamMembers)
      .values({ teamId: team.id, userId, role: 'owner' });

    // Start listening on a random port
    await server.listen({ port: 0, host: '127.0.0.1' });
    const addr = server.server.address();
    address = typeof addr === 'string' ? addr : `127.0.0.1:${addr?.port}`;
  });

  afterAll(async () => {
    const { sql } = await import('drizzle-orm');
    await server.db.execute(
      sql`DELETE FROM team_members WHERE user_id IN (SELECT id FROM users WHERE clerk_id LIKE 'wstest_%')`,
    );
    await server.db.execute(
      sql`DELETE FROM messages WHERE sender_id IN (SELECT id FROM users WHERE clerk_id LIKE 'wstest_%')`,
    );
    await server.db.execute(sql`DELETE FROM teams WHERE slug = ${teamSlug}`);
    await server.db.execute(
      sql`DELETE FROM users WHERE clerk_id LIKE 'wstest_%'`,
    );
    await server.close();
  });

  function connectWs(): Promise<{ ws: import('ws').WebSocket; messages: any[] }> {
    return new Promise((resolve, reject) => {
      // Dynamic import to avoid issues if ws isn't available at parse time
      import('ws').then(({ default: WS }) => {
        const ws = new WS(`ws://${address}/ws`);
        const msgs: any[] = [];
        ws.on('message', (data: Buffer) => msgs.push(JSON.parse(data.toString())));
        ws.on('open', () => resolve({ ws, messages: msgs }));
        ws.on('error', reject);
      });
    });
  }

  function wait(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  it('connects and authenticates via WebSocket', async () => {
    const { ws, messages } = await connectWs();

    ws.send(JSON.stringify({ type: 'authenticate', token: userId }));
    await wait(200);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({ type: 'authenticated', userId });

    ws.close();
  });

  it('rejects join_team before authentication', async () => {
    const { ws, messages } = await connectWs();

    ws.send(JSON.stringify({ type: 'join_team', teamSlug }));
    await wait(200);

    expect(messages[0]).toEqual({ type: 'error', message: 'Not authenticated' });

    ws.close();
  });

  it('joins team room after authentication', async () => {
    const { ws, messages } = await connectWs();

    ws.send(JSON.stringify({ type: 'authenticate', token: userId }));
    await wait(150);

    ws.send(JSON.stringify({ type: 'join_team', teamSlug }));
    await wait(200);

    expect(messages[1]).toEqual({ type: 'joined_team', teamSlug });

    ws.close();
  });

  it('returns error for nonexistent team', async () => {
    const { ws, messages } = await connectWs();

    ws.send(JSON.stringify({ type: 'authenticate', token: userId }));
    await wait(150);

    ws.send(JSON.stringify({ type: 'join_team', teamSlug: 'does-not-exist' }));
    await wait(200);

    expect(messages[1]).toEqual({ type: 'error', message: 'Team not found' });

    ws.close();
  });

  it('rejects send_message before joining team', async () => {
    const { ws, messages } = await connectWs();

    ws.send(JSON.stringify({ type: 'authenticate', token: userId }));
    await wait(150);

    ws.send(
      JSON.stringify({
        type: 'send_message',
        teamSlug,
        messageType: 'broadcast',
        subtype: 'discovery',
        content: { text: 'hello' },
      }),
    );
    await wait(200);

    expect(messages[1]).toEqual({ type: 'error', message: 'Not in a team' });

    ws.close();
  });

  it('handles invalid JSON gracefully', async () => {
    const { ws, messages } = await connectWs();

    ws.send('this is not json');
    await wait(200);

    expect(messages[0]).toEqual({ type: 'error', message: 'Invalid message' });

    ws.close();
  });
});
