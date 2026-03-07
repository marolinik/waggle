import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDb, type Db } from '../../src/db/connection.js';
import { users, teams, teamMembers, tasks, messages, agents, agentGroups } from '../../src/db/schema.js';
import { sql } from 'drizzle-orm';

describe('PostgreSQL schema', () => {
  let db: Db;

  beforeAll(() => {
    db = createDb(process.env.DATABASE_URL ?? 'postgres://waggle:waggle_dev@localhost:5434/waggle');
  });

  afterAll(async () => {
    // Clean up test data in reverse dependency order
    await db.execute(sql`DELETE FROM agent_audit_log`);
    await db.execute(sql`DELETE FROM suggestions_log`);
    await db.execute(sql`DELETE FROM scout_findings`);
    await db.execute(sql`DELETE FROM cron_schedules`);
    await db.execute(sql`DELETE FROM agent_jobs`);
    await db.execute(sql`DELETE FROM team_resources`);
    await db.execute(sql`DELETE FROM team_relations`);
    await db.execute(sql`DELETE FROM team_entities`);
    await db.execute(sql`DELETE FROM messages`);
    await db.execute(sql`DELETE FROM tasks`);
    await db.execute(sql`DELETE FROM agent_group_members`);
    await db.execute(sql`DELETE FROM agent_groups`);
    await db.execute(sql`DELETE FROM agents`);
    await db.execute(sql`DELETE FROM team_members`);
    await db.execute(sql`DELETE FROM teams`);
    await db.execute(sql`DELETE FROM users`);
  });

  it('creates a user', async () => {
    const [user] = await db.insert(users).values({
      clerkId: 'clerk_test_001',
      displayName: 'Test User',
      email: 'test@example.com',
    }).returning();
    expect(user.id).toBeDefined();
    expect(user.displayName).toBe('Test User');
  });

  it('creates a team with owner', async () => {
    const [user] = await db.select().from(users).limit(1);
    const [team] = await db.insert(teams).values({
      name: 'Marketing',
      slug: 'marketing',
      ownerId: user.id,
    }).returning();
    expect(team.slug).toBe('marketing');

    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: user.id,
      role: 'owner',
    });
  });

  it('creates all 16 tables', async () => {
    const result = await db.execute(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const tableNames = (result as any[]).map((r: any) => r.table_name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('teams');
    expect(tableNames).toContain('team_members');
    expect(tableNames).toContain('agents');
    expect(tableNames).toContain('agent_groups');
    expect(tableNames).toContain('tasks');
    expect(tableNames).toContain('messages');
    expect(tableNames).toContain('team_entities');
    expect(tableNames).toContain('team_relations');
    expect(tableNames).toContain('team_resources');
    expect(tableNames).toContain('agent_jobs');
    expect(tableNames).toContain('cron_schedules');
    expect(tableNames).toContain('scout_findings');
    expect(tableNames).toContain('proactive_patterns');
    expect(tableNames).toContain('suggestions_log');
    expect(tableNames).toContain('agent_audit_log');
  });
});
