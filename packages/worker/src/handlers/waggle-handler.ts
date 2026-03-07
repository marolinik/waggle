import type { Job } from 'bullmq';
import type { JobData } from '../job-processor.js';
import type { Db } from '../../../server/src/db/connection.js';
import { teamEntities, tasks } from '../../../server/src/db/schema.js';
import { sql } from 'drizzle-orm';

export async function waggleHandler(job: Job<JobData>, db: Db): Promise<Record<string, unknown>> {
  const { teamId, input } = job.data;
  const topic = (input as Record<string, unknown>).topic as string ?? '';

  // In production:
  // 1. Run hive query (check existing team knowledge)
  // 2. Gap analysis (what's missing)
  // 3. Spawn sub-agents for missing pieces
  // 4. Merge results
  // 5. Share via Waggle Dance routed_share
  // For M3 pilot: structured stub with real hive query.

  const searchTerm = `%${topic}%`;

  // Query existing team knowledge
  const entities = await db.select().from(teamEntities)
    .where(sql`${teamEntities.teamId} = ${teamId} AND ${teamEntities.name} ILIKE ${searchTerm}`)
    .limit(5);

  // Query related tasks
  const relatedTasks = await db.select().from(tasks)
    .where(sql`${tasks.teamId} = ${teamId} AND ${tasks.title} ILIKE ${searchTerm}`)
    .limit(5);

  return {
    topic,
    existingKnowledge: entities.length,
    entities: entities.map((e: typeof entities[number]) => ({ id: e.id, name: e.name, type: e.entityType })),
    relatedTasks: relatedTasks.length,
    tasks: relatedTasks.map((t: typeof relatedTasks[number]) => ({ id: t.id, title: t.title, status: t.status })),
    gaps: ['[Stub] Full analysis would identify specific knowledge gaps'],
    recommendation: `[Agent stub] Found ${entities.length} entities and ${relatedTasks.length} related tasks for "${topic}"`,
  };
}
