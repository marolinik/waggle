import { describe, it, expect, vi } from 'vitest';
import { runAgentLoop, type AgentLoopConfig } from '../src/agent-loop.js';
import type { ToolDefinition } from '../src/tools.js';

/**
 * Helper: create a mock fetch that returns predefined OpenAI-format responses in sequence.
 */
function mockFetch(
  responses: Array<{
    content: string | null;
    tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  }>
) {
  let callIndex = 0;
  return vi.fn(async (_url: string, _init?: RequestInit) => {
    const resp = responses[callIndex++];
    const body = {
      choices: [
        {
          message: {
            role: 'assistant' as const,
            content: resp.content,
            tool_calls: resp.tool_calls,
          },
          finish_reason: resp.tool_calls ? 'tool_calls' : 'stop',
        },
      ],
      usage: resp.usage ?? { prompt_tokens: 10, completion_tokens: 5 },
    };
    return {
      ok: true,
      status: 200,
      json: async () => body,
    } as unknown as Response;
  });
}

function makeConfig(overrides: Partial<AgentLoopConfig> = {}): AgentLoopConfig {
  return {
    litellmUrl: 'http://localhost:4000',
    litellmApiKey: 'test-key',
    model: 'gpt-4',
    systemPrompt: 'You are a helpful assistant.',
    tools: [],
    messages: [{ role: 'user', content: 'Hello' }],
    ...overrides,
  };
}

describe('runAgentLoop', () => {
  it('returns text response when no tools used', async () => {
    const fetch = mockFetch([{ content: 'Hello there!' }]);
    const result = await runAgentLoop(makeConfig({ fetch }));

    expect(result.content).toBe('Hello there!');
    expect(result.toolsUsed).toEqual([]);
    expect(result.usage.inputTokens).toBe(10);
    expect(result.usage.outputTokens).toBe(5);

    // Verify the fetch was called with correct URL and headers
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/chat/completions');
    expect(init.headers['Authorization']).toBe('Bearer test-key');
    expect(init.headers['Content-Type']).toBe('application/json');

    // Verify body includes system prompt and user message
    const body = JSON.parse(init.body);
    expect(body.model).toBe('gpt-4');
    expect(body.messages[0]).toEqual({ role: 'system', content: 'You are a helpful assistant.' });
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Hello' });
  });

  it('executes tool calls and loops until final response', async () => {
    const echoTool: ToolDefinition = {
      name: 'echo',
      description: 'Echoes input',
      parameters: {
        type: 'object',
        properties: { text: { type: 'string' } },
        required: ['text'],
      },
      execute: vi.fn(async (args) => `Echo: ${args.text}`),
    };

    const fetch = mockFetch([
      {
        content: null,
        tool_calls: [
          { id: 'call_1', function: { name: 'echo', arguments: '{"text":"hi"}' } },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 10 },
      },
      {
        content: 'Done echoing!',
        usage: { prompt_tokens: 30, completion_tokens: 8 },
      },
    ]);

    const result = await runAgentLoop(
      makeConfig({ fetch, tools: [echoTool] })
    );

    expect(result.content).toBe('Done echoing!');
    expect(result.toolsUsed).toEqual(['echo']);
    expect(result.usage.inputTokens).toBe(50); // 20 + 30
    expect(result.usage.outputTokens).toBe(18); // 10 + 8
    expect(echoTool.execute).toHaveBeenCalledWith({ text: 'hi' });
    expect(fetch).toHaveBeenCalledTimes(2);

    // Second call should include tool result message
    const secondBody = JSON.parse(fetch.mock.calls[1][1].body);
    const toolResultMsg = secondBody.messages.find(
      (m: any) => m.role === 'tool' && m.tool_call_id === 'call_1'
    );
    expect(toolResultMsg).toBeDefined();
    expect(toolResultMsg.content).toBe('Echo: hi');
  });

  it('calls onToken for final content', async () => {
    const onToken = vi.fn();
    const fetch = mockFetch([{ content: 'streaming text' }]);

    await runAgentLoop(makeConfig({ fetch, onToken }));

    expect(onToken).toHaveBeenCalledWith('streaming text');
  });

  it('calls onToolUse when executing tools', async () => {
    const onToolUse = vi.fn();
    const tool: ToolDefinition = {
      name: 'greet',
      description: 'Greet someone',
      parameters: { type: 'object', properties: { name: { type: 'string' } } },
      execute: async (args) => `Hello ${args.name}`,
    };

    const fetch = mockFetch([
      {
        content: null,
        tool_calls: [
          { id: 'call_g', function: { name: 'greet', arguments: '{"name":"World"}' } },
        ],
      },
      { content: 'Greeted.' },
    ]);

    await runAgentLoop(makeConfig({ fetch, tools: [tool], onToolUse }));

    expect(onToolUse).toHaveBeenCalledWith('greet', { name: 'World' });
  });

  it('respects maxTurns limit', async () => {
    const tool: ToolDefinition = {
      name: 'loop_tool',
      description: 'Always called',
      parameters: {},
      execute: async () => 'result',
    };

    // Return tool calls forever — the loop should stop at maxTurns
    const infiniteToolCalls = Array.from({ length: 5 }, () => ({
      content: null as string | null,
      tool_calls: [
        { id: 'call_x', function: { name: 'loop_tool', arguments: '{}' } },
      ],
    }));

    const fetch = mockFetch(infiniteToolCalls);

    const result = await runAgentLoop(
      makeConfig({ fetch, tools: [tool], maxTurns: 3 })
    );

    expect(result.content).toBe('Max tool turns reached.');
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
