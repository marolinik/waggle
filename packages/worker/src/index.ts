import { Worker } from 'bullmq';
import { createDb } from '../../server/src/db/connection.js';
import { agentJobs } from '../../server/src/db/schema.js';
import { eq } from 'drizzle-orm';
import { JobProcessor, type JobData } from './job-processor.js';
import Redis from 'ioredis';
import { chatHandler } from './handlers/chat-handler.js';
import { taskHandler } from './handlers/task-handler.js';
import { waggleHandler } from './handlers/waggle-handler.js';
import { groupHandler } from './handlers/group-handler.js';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6381';
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://waggle:waggle_dev@localhost:5434/waggle';

export function createWorker(redisUrl = REDIS_URL, databaseUrl = DATABASE_URL) {
  const db = createDb(databaseUrl);
  const processor = new JobProcessor();

  // Register job handlers
  processor.register('chat', chatHandler);
  processor.register('task', taskHandler);
  processor.register('waggle', waggleHandler);
  processor.register('group', groupHandler);
  // Cron handler placeholder (real implementation in Task 3.16)
  processor.register('cron', async (job) => ({ result: 'cron handler placeholder', input: job.data.input }));

  const url = new URL(redisUrl);
  const worker = new Worker<JobData>('waggle-jobs', async (job) => {
    // Update status to running
    await db.update(agentJobs)
      .set({ status: 'running', startedAt: new Date() })
      .where(eq(agentJobs.id, job.data.jobId));

    try {
      const result = await processor.process(job, db);

      // Update status to completed
      await db.update(agentJobs)
        .set({ status: 'completed', completedAt: new Date(), output: result })
        .where(eq(agentJobs.id, job.data.jobId));

      // Publish progress to Redis
      const redis = new Redis(redisUrl);
      await redis.publish(`job:${job.data.jobId}:progress`, JSON.stringify({ status: 'completed', output: result }));
      await redis.quit();

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await db.update(agentJobs)
        .set({ status: 'failed', completedAt: new Date(), output: { error: message } })
        .where(eq(agentJobs.id, job.data.jobId));
      throw error;
    }
  }, {
    connection: {
      host: url.hostname,
      port: parseInt(url.port || '6379'),
    },
    concurrency: 5,
  });

  return { worker, processor, db };
}

// Start if run directly
const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isDirectRun) {
  const { worker } = createWorker();
  console.log('Waggle agent worker started');

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });
}
