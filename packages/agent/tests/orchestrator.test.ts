import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MindDB } from '@waggle/core';
import { Orchestrator } from '../src/orchestrator.js';
import { MockEmbedder } from '../../core/tests/mind/helpers/mock-embedder.js';

describe('Agent Loop with Custom Tools', () => {
  let db: MindDB;
  let orchestrator: Orchestrator;

  beforeEach(() => {
    db = new MindDB(':memory:');
    orchestrator = new Orchestrator({
      db,
      embedder: new MockEmbedder(),
    });
  });

  afterEach(() => {
    db.close();
  });

  describe('Tool definitions', () => {
    it('creates all required tool definitions', () => {
      const tools = orchestrator.getTools();
      const names = tools.map(t => t.name);
      expect(names).toContain('search_memory');
      expect(names).toContain('save_memory');
      expect(names).toContain('get_identity');
      expect(names).toContain('get_awareness');
      expect(names).toContain('query_knowledge');
      expect(names).toContain('add_task');
    });

    it('each tool has name, description, parameters, and execute function', () => {
      for (const tool of orchestrator.getTools()) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.parameters).toBeDefined();
        expect(typeof tool.execute).toBe('function');
      }
    });
  });

  describe('Tool execution: get_identity', () => {
    it('returns identity context', async () => {
      orchestrator.getIdentity().create({
        name: 'Waggle',
        role: 'Personal Assistant',
        department: '',
        personality: 'Helpful',
        capabilities: 'Memory, search',
        system_prompt: 'You are Waggle.',
      });
      const result = await orchestrator.executeTool('get_identity', {});
      expect(result).toContain('Waggle');
      expect(result).toContain('Personal Assistant');
    });

    it('throws when no identity configured', async () => {
      await expect(orchestrator.executeTool('get_identity', {})).rejects.toThrow('No identity configured');
    });
  });

  describe('Tool execution: get_awareness', () => {
    it('returns awareness context', async () => {
      orchestrator.getAwareness().add('task', 'Review PR #42', 10);
      const result = await orchestrator.executeTool('get_awareness', {});
      expect(result).toContain('Review PR #42');
    });

    it('returns empty message when no items', async () => {
      const result = await orchestrator.executeTool('get_awareness', {});
      expect(result).toContain('No active awareness items');
    });
  });

  describe('Tool execution: save_memory', () => {
    it('saves a memory to the current session', async () => {
      const result = await orchestrator.executeTool('save_memory', {
        content: 'User prefers dark mode',
        importance: 'normal',
      });
      expect(result).toContain('Memory saved');
    });

    it('creates a session if none active', async () => {
      await orchestrator.executeTool('save_memory', { content: 'First memory' });
      const active = orchestrator.getSessions().getActive();
      expect(active.length).toBeGreaterThan(0);
    });

    it('saved memory is searchable', async () => {
      await orchestrator.executeTool('save_memory', { content: 'The meeting about quantum computing was postponed' });

      // Index the frame for vector search
      const active = orchestrator.getSessions().getActive();
      const gopFrames = orchestrator.getFrames().getGopFrames(active[0].gop_id);
      for (const frame of gopFrames) {
        await orchestrator.getSearch().indexFrame(frame.id, frame.content);
      }

      const searchResult = await orchestrator.executeTool('search_memory', { query: 'quantum' });
      expect(searchResult).toContain('quantum computing');
    });
  });

  describe('Tool execution: search_memory', () => {
    it('returns no results for empty memory', async () => {
      const result = await orchestrator.executeTool('search_memory', { query: 'anything' });
      expect(result).toContain('No relevant memories');
    });

    it('searches with different profiles', async () => {
      await orchestrator.executeTool('save_memory', { content: 'Important meeting notes from today' });
      const active = orchestrator.getSessions().getActive();
      const gopFrames = orchestrator.getFrames().getGopFrames(active[0].gop_id);
      for (const frame of gopFrames) {
        await orchestrator.getSearch().indexFrame(frame.id, frame.content);
      }

      const result = await orchestrator.executeTool('search_memory', {
        query: 'meeting',
        profile: 'recent',
        limit: 5,
      });
      expect(result).toContain('meeting notes');
    });
  });

  describe('Tool execution: query_knowledge', () => {
    it('queries entities from knowledge graph', async () => {
      orchestrator.getKnowledge().createEntity('person', 'Alice', { role: 'engineer' });
      orchestrator.getKnowledge().createEntity('person', 'Bob', { role: 'designer' });

      const result = await orchestrator.executeTool('query_knowledge', { query: 'Alice' });
      expect(result).toContain('Alice');
    });

    it('shows relations for found entities', async () => {
      const alice = orchestrator.getKnowledge().createEntity('person', 'Alice', {});
      const waggle = orchestrator.getKnowledge().createEntity('project', 'Waggle', {});
      orchestrator.getKnowledge().createRelation(alice.id, waggle.id, 'works_on', 0.95);

      const result = await orchestrator.executeTool('query_knowledge', { query: 'Alice' });
      expect(result).toContain('works_on');
      expect(result).toContain('Waggle');
    });

    it('returns empty message for no matches', async () => {
      const result = await orchestrator.executeTool('query_knowledge', { query: 'NonexistentPerson' });
      expect(result).toContain('No entities found');
    });
  });

  describe('Tool execution: add_task', () => {
    it('adds a task to awareness', async () => {
      const result = await orchestrator.executeTool('add_task', {
        content: 'Deploy v2.1',
        priority: 8,
      });
      expect(result).toContain('Deploy v2.1');
      expect(result).toContain('priority: 8');

      const tasks = orchestrator.getAwareness().getByCategory('task');
      expect(tasks).toHaveLength(1);
    });
  });

  describe('System prompt builder', () => {
    it('builds system prompt from identity + awareness', () => {
      orchestrator.getIdentity().create({
        name: 'Waggle',
        role: 'Assistant',
        department: '',
        personality: '',
        capabilities: '',
        system_prompt: '',
      });
      orchestrator.getAwareness().add('task', 'Check emails', 5);

      const prompt = orchestrator.buildSystemPrompt();
      expect(prompt).toContain('Waggle');
      expect(prompt).toContain('Check emails');
      expect(prompt).toContain('search_memory');
      expect(prompt).toContain('save_memory');
    });

    it('builds prompt without identity', () => {
      const prompt = orchestrator.buildSystemPrompt();
      expect(prompt).toContain('Available Tools');
      expect(prompt).not.toContain('# Identity');
    });
  });

  describe('Unknown tool handling', () => {
    it('throws for unknown tool name', async () => {
      await expect(orchestrator.executeTool('nonexistent', {})).rejects.toThrow('Unknown tool: nonexistent');
    });
  });
});
