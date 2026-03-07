import type { Job } from 'bullmq';
import type { JobData } from '../job-processor.js';
import type { Db } from '../../../server/src/db/connection.js';
import { tasks } from '../../../server/src/db/schema.js';
import { eq } from 'drizzle-orm';

export async function taskHandler(job: Job<JobData>, db: Db): Promise<Record<string, unknown>> {
  const { teamId, userId, input } = job.data;
  const taskId = (input as Record<string, unknown>).taskId as string | undefined;

  if (!taskId) {
    throw new Error('taskHandler requires input.taskId');
  }

  // Load task from DB to verify it exists and belongs to the team
  const [task] = await db.select().from(tasks)
    .where(eq(tasks.id, taskId));

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  if (task.teamId !== teamId) {
    throw new Error(`Task ${taskId} does not belong to team ${teamId}`);
  }

  // In production: create agent with task context (title, description, parent chain),
  // execute agent loop, update task status based on outcome.
  // For M3 pilot: structured stub.

  // Mark task as in-progress
  await db.update(tasks)
    .set({ status: 'in_progress', updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  // Simulate agent work (stub)
  const result = `[Agent stub] Processed task "${task.title}"`;

  // Mark task as completed
  await db.update(tasks)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  return {
    taskId,
    taskTitle: task.title,
    result,
    status: 'completed',
    userId,
  };
}
