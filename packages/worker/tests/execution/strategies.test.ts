import { describe, it, expect } from 'vitest';
import { executeParallel, type AgentMemberConfig } from '../../src/execution/parallel.js';
import { executeSequential } from '../../src/execution/sequential.js';
import { executeCoordinator } from '../../src/execution/coordinator.js';

const mockMembers: AgentMemberConfig[] = [
  {
    member: { roleInGroup: 'lead', executionOrder: 0 },
    agent: { id: 'a1', name: 'leader', model: 'claude-sonnet', systemPrompt: null, tools: [] },
  },
  {
    member: { roleInGroup: 'worker', executionOrder: 1 },
    agent: { id: 'a2', name: 'researcher', model: 'claude-haiku', systemPrompt: null, tools: [] },
  },
  {
    member: { roleInGroup: 'worker', executionOrder: 2 },
    agent: { id: 'a3', name: 'writer', model: 'claude-haiku', systemPrompt: null, tools: [] },
  },
];

describe('Execution Strategies', () => {
  describe('parallel', () => {
    it('runs all agents and merges output', async () => {
      const result = await executeParallel(mockMembers, { task: 'test' });

      expect(result.strategy).toBe('parallel');
      expect(result.agentCount).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(result.mergedOutput).toContain('leader');
      expect(result.mergedOutput).toContain('researcher');
      expect(result.mergedOutput).toContain('writer');
    });

    it('includes agent metadata in each result', async () => {
      const result = await executeParallel(mockMembers, { task: 'test' });
      const results = result.results as Array<Record<string, unknown>>;

      expect(results[0]).toMatchObject({
        agentId: 'a1',
        agentName: 'leader',
        model: 'claude-sonnet',
        role: 'lead',
      });
    });

    it('handles single agent', async () => {
      const single = [mockMembers[0]];
      const result = await executeParallel(single, {});

      expect(result.agentCount).toBe(1);
      expect(result.results).toHaveLength(1);
    });
  });

  describe('sequential', () => {
    it('chains output through agents in order', async () => {
      const result = await executeSequential(mockMembers, { task: 'test' });

      expect(result.strategy).toBe('sequential');
      expect(result.agentCount).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(result.finalOutput).toContain('writer');
    });

    it('first agent receives taskInput, subsequent receive previous output', async () => {
      const result = await executeSequential(mockMembers, { task: 'test' });
      const results = result.results as Array<Record<string, unknown>>;

      expect(results[0].inputFrom).toBe('taskInput');
      expect(results[1].inputFrom).toBe('leader');
      expect(results[2].inputFrom).toBe('researcher');
    });

    it('handles single agent', async () => {
      const single = [mockMembers[0]];
      const result = await executeSequential(single, { data: 'input' });

      expect(result.agentCount).toBe(1);
      expect(result.finalOutput).toContain('leader');
    });

    it('handles empty members list', async () => {
      const result = await executeSequential([], {});

      expect(result.agentCount).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(result.finalOutput).toBeNull();
    });
  });

  describe('coordinator', () => {
    it('lead delegates, workers execute, lead synthesizes', async () => {
      const result = await executeCoordinator(mockMembers, { task: 'test' });

      expect(result.strategy).toBe('coordinator');
      expect(result.leadAgent).toBe('leader');
      expect(result.workerCount).toBe(2);
      expect(result.plan).toBeDefined();
      expect(result.workerResults).toHaveLength(2);
      expect(result.synthesis).toBeDefined();
      expect(result.finalOutput).toContain('synthesized');
    });

    it('only workers appear in workerResults (not lead)', async () => {
      const result = await executeCoordinator(mockMembers, {});
      const workerResults = result.workerResults as Array<Record<string, unknown>>;

      const agentNames = workerResults.map(r => r.agentName);
      expect(agentNames).toContain('researcher');
      expect(agentNames).toContain('writer');
      expect(agentNames).not.toContain('leader');
    });

    it('plan includes subtask assignments', async () => {
      const result = await executeCoordinator(mockMembers, {});
      const plan = result.plan as Record<string, unknown>;

      expect(plan.phase).toBe('planning');
      expect(plan.subtasks).toHaveLength(2);
    });

    it('synthesis references worker count', async () => {
      const result = await executeCoordinator(mockMembers, {});
      const synthesis = result.synthesis as Record<string, unknown>;

      expect(synthesis.phase).toBe('synthesis');
      expect(synthesis.output).toContain('2');
    });

    it('throws if no lead agent', async () => {
      const noLead = mockMembers.map(m => ({
        ...m,
        member: { ...m.member, roleInGroup: 'worker' },
      }));

      await expect(executeCoordinator(noLead, {})).rejects.toThrow('requires a lead');
    });

    it('works with lead and no workers', async () => {
      const leadOnly: AgentMemberConfig[] = [{
        member: { roleInGroup: 'lead', executionOrder: 0 },
        agent: { id: 'a1', name: 'solo-lead', model: 'claude-sonnet', systemPrompt: null, tools: [] },
      }];

      const result = await executeCoordinator(leadOnly, {});

      expect(result.workerCount).toBe(0);
      expect(result.workerResults).toHaveLength(0);
      expect(result.finalOutput).toContain('synthesized 0');
    });
  });
});
