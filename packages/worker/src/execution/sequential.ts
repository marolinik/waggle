import type { AgentMemberConfig } from './parallel.js';

/**
 * Sequential execution strategy: agents run one after another,
 * each receiving the previous agent's output as input.
 * Best for pipeline-style workflows (research -> draft -> review).
 */
export async function executeSequential(
  members: AgentMemberConfig[],
  taskInput: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const results: Array<Record<string, unknown>> = [];
  let previousOutput: Record<string, unknown> = taskInput;

  for (const { agent, member } of members) {
    // In production: create agent instance, pass previousOutput as context, execute
    // For M3 pilot: structured stub with chained input
    const output: Record<string, unknown> = {
      agentId: agent.id,
      agentName: agent.name,
      role: member.roleInGroup,
      model: agent.model,
      inputFrom: previousOutput === taskInput ? 'taskInput' : (results[results.length - 1]?.agentName as string),
      output: `[Stub] ${agent.name} processed with input from previous step`,
    };
    results.push(output);
    previousOutput = output;
  }

  return {
    strategy: 'sequential',
    agentCount: results.length,
    results,
    finalOutput: results[results.length - 1]?.output ?? null,
  };
}
