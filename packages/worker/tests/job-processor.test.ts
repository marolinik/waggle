import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWorker } from '../src/index.js';
import { JobService } from '../../server/src/services/job-service.js';
import { createDb } from '../../server/src/db/connection.js';
import { users, teams, teamMembers, agentJobs } from '../../server/src/db/schema.js';
import { eq, sql } from 'drizzle-orm';

const REDIS_URL = 'redis://localhost:6381';
const DATABASE_URL = 'postgres://waggle:waggle_dev@localhost:5434/waggle';

describe('BullMQ Worker', () => {
  let db: ReturnType<typeof createDb>;
  let jobService: JobService;
  let workerInstance: ReturnType<typeof createWorker>;
  let testUserId: string;
  let testTeamId: string;

  beforeAll(async () => {
    db = createDb(DATABASE_URL);
    jobService = new JobService(db, REDIS_URL);
    workerInstance = createWorker(REDIS_URL, DATABASE_URL);

    // Create test data
    const [user] = await db.insert(users).values({
      clerkId: 'worker_test_user_' + Date.now(),
      displayName: 'Worker Test',
      email: `worker_${Date.now()}@test.com`,
    }).returning();
    testUserId = user.id;

    const [team] = await db.insert(teams).values({
      name: 'Worker Team',
      slug: 'worker-test-' + Date.now(),
      ownerId: testUserId,
    }).returning();
    testTeamId = team.id;

    await db.insert(teamMembers).values({
      teamId: testTeamId,
      userId: testUserId,
      role: 'owner',
    });
  });

  afterAll(async () => {
    await workerInstance.worker.close();
    await jobService.close();
    await db.execute(sql`DELETE FROM agent_jobs WHERE team_id = ${testTeamId}`);
    await db.execute(sql`DELETE FROM team_members WHERE user_id = ${testUserId}`);
    await db.execute(sql`DELETE FROM teams WHERE id = ${testTeamId}`);
    await db.execute(sql`DELETE FROM users WHERE id = ${testUserId}`);
  });

  it('queues job and worker picks it up', async () => {
    const job = await jobService.createJob(testTeamId, testUserId, 'chat', { message: 'hello' });
    expect(job.status).toBe('queued');

    // Wait for worker to process
    await new Promise(r => setTimeout(r, 2000));

    const updated = await jobService.getJob(job.id);
    expect(updated?.status).toBe('completed');
    expect(updated?.output).toBeDefined();
  });

  it('tracks job status transitions', async () => {
    const job = await jobService.createJob(testTeamId, testUserId, 'chat', { message: 'status test' });

    // Wait for processing
    await new Promise(r => setTimeout(r, 2000));

    const completed = await jobService.getJob(job.id);
    expect(completed?.startedAt).toBeDefined();
    expect(completed?.completedAt).toBeDefined();
    expect(completed?.status).toBe('completed');
  });

  it('marks failed jobs', async () => {
    // Register a failing handler
    workerInstance.processor.register('fail_test', async () => {
      throw new Error('Intentional failure');
    });

    const job = await jobService.createJob(testTeamId, testUserId, 'fail_test', {});

    // Wait for processing
    await new Promise(r => setTimeout(r, 2000));

    const failed = await jobService.getJob(job.id);
    expect(failed?.status).toBe('failed');
    expect((failed?.output as Record<string, unknown>)?.error).toContain('Intentional failure');
  });
});
