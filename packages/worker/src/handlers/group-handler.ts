import type { Job } from 'bullmq';
import type { JobData } from '../job-processor.js';
import type { Db } from '../../../server/src/db/connection.js';
import { agentGroups, agentGroupMembers, agents } from '../../../server/src/db/schema.js';
import { eq } from 'drizzle-orm';
import { executeParallel } from '../execution/parallel.js';
import { executeSequential } from '../execution/sequential.js';
import { executeCoordinator } from '../execution/coordinator.js';

export async function groupHandler(job: Job<JobData>, db: Db): Promise<Record<string, unknown>> {
  const { input } = job.data;
  const groupId = (input as Record<string, unknown>).groupId as string;
  const taskInput = (input as Record<string, unknown>).taskInput as Record<string, unknown> ?? {};

  if (!groupId) {
    throw new Error('groupHandler requires input.groupId');
  }

  // Load group config
  const [group] = await db.select().from(agentGroups)
    .where(eq(agentGroups.id, groupId));

  if (!group) {
    throw new Error(`Agent group not found: ${groupId}`);
  }

  // Load members with their agent configs
  const members = await db.select({
    member: agentGroupMembers,
    agent: agents,
  })
    .from(agentGroupMembers)
    .innerJoin(agents, eq(agentGroupMembers.agentId, agents.id))
    .where(eq(agentGroupMembers.groupId, groupId));

  if (members.length === 0) {
    throw new Error(`Agent group ${groupId} has no members`);
  }

  // Sort by execution order
  members.sort((a: typeof members[number], b: typeof members[number]) => a.member.executionOrder - b.member.executionOrder);

  // Dispatch to strategy
  switch (group.strategy) {
    case 'parallel':
      return executeParallel(members, taskInput);
    case 'sequential':
      return executeSequential(members, taskInput);
    case 'coordinator':
      return executeCoordinator(members, taskInput);
    default:
      throw new Error(`Unknown execution strategy: ${group.strategy}`);
  }
}
