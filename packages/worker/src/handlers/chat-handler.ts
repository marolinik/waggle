import type { Job } from 'bullmq';
import type { JobData } from '../job-processor.js';
import type { Db } from '../../../server/src/db/connection.js';

export async function chatHandler(job: Job<JobData>, _db: Db): Promise<Record<string, unknown>> {
  const { userId, input } = job.data;
  const message = (input as Record<string, unknown>).message ?? '';

  // In production: create Orchestrator from @waggle/agent, load user's .mind file,
  // send message through agent loop, return response.
  // For M3 pilot: structured stub that demonstrates the correct data flow.

  return {
    response: `[Agent stub] Processed chat message: "${message}"`,
    userId,
    model: 'stub',
    tokensUsed: 0,
  };
}
