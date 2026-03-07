import { describe, it, expect } from 'vitest';
import { chatHandler } from '../../src/handlers/chat-handler.js';
import type { Db } from '../../../server/src/db/connection.js';

describe('Chat Handler', () => {
  const mockDb = {} as Db;

  it('returns structured response with message echo', async () => {
    const mockJob = {
      data: {
        jobId: 'j1',
        teamId: 't1',
        userId: 'u1',
        jobType: 'chat',
        input: { message: 'hello world' },
      },
    } as any;

    const result = await chatHandler(mockJob, mockDb);

    expect(result.response).toContain('hello world');
    expect(result.model).toBe('stub');
    expect(result.tokensUsed).toBe(0);
    expect(result.userId).toBe('u1');
  });

  it('handles missing message gracefully', async () => {
    const mockJob = {
      data: {
        jobId: 'j2',
        teamId: 't1',
        userId: 'u1',
        jobType: 'chat',
        input: {},
      },
    } as any;

    const result = await chatHandler(mockJob, mockDb);

    expect(result.response).toBeDefined();
    expect(result.model).toBe('stub');
  });

  it('includes userId in response', async () => {
    const mockJob = {
      data: {
        jobId: 'j3',
        teamId: 't1',
        userId: 'user-abc',
        jobType: 'chat',
        input: { message: 'test' },
      },
    } as any;

    const result = await chatHandler(mockJob, mockDb);

    expect(result.userId).toBe('user-abc');
  });
});
