import type { ToolDefinition } from './tools.js';

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
}

export interface AgentResponse {
  content: string;
  toolsUsed: string[];
  usage: { inputTokens: number; outputTokens: number };
}

export interface AgentLoopConfig {
  litellmUrl: string;
  litellmApiKey: string;
  model: string;
  systemPrompt: string;
  tools: ToolDefinition[];
  messages: Array<{ role: string; content: string }>;
  onToken?: (token: string) => void;
  onToolUse?: (name: string, input: Record<string, unknown>) => void;
  maxTurns?: number;
  stream?: boolean;
  fetch?: typeof globalThis.fetch;
}

export async function runAgentLoop(config: AgentLoopConfig): Promise<AgentResponse> {
  const {
    litellmUrl,
    litellmApiKey,
    model,
    systemPrompt,
    tools,
    messages: inputMessages,
    onToken,
    onToolUse,
    maxTurns = 10,
    stream = false,
    fetch: fetchFn = globalThis.fetch,
  } = config;

  // Build messages array with system prompt + input messages
  const messages: AgentMessage[] = [
    { role: 'system', content: systemPrompt },
    ...inputMessages.map((m) => ({
      role: m.role as AgentMessage['role'],
      content: m.content,
    })),
  ];

  // Build OpenAI-format tool definitions
  // Ensure all parameter schemas have type: 'object' (required by Anthropic via LiteLLM)
  const openaiTools = tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: {
        type: 'object' as const,
        properties: {},
        ...t.parameters,
      },
    },
  }));

  // Index tools by name for execution
  const toolMap = new Map<string, ToolDefinition>();
  for (const t of tools) {
    toolMap.set(t.name, t);
  }

  const toolsUsed: string[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let turn = 0; turn < maxTurns; turn++) {
    const body: Record<string, unknown> = {
      model,
      messages,
    };
    if (openaiTools.length > 0) {
      body.tools = openaiTools;
    }
    if (stream) {
      body.stream = true;
      body.stream_options = { include_usage: true };
    }

    const response = await fetchFn(`${litellmUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${litellmApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`LiteLLM error (${response.status}): ${errorBody}`);
    }

    let assistantMessage: {
      content: string | null;
      tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
    };
    let turnInputTokens = 0;
    let turnOutputTokens = 0;

    if (stream) {
      // Parse SSE stream
      let accumulatedContent = '';
      const accumulatedToolCalls = new Map<
        number,
        { id: string; function: { name: string; arguments: string } }
      >();

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events (separated by double newlines)
        const parts = buffer.split('\n\n');
        // Last part may be incomplete — keep it in the buffer
        buffer = parts.pop()!;

        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') continue;

            let chunk: any;
            try {
              chunk = JSON.parse(payload);
            } catch {
              continue;
            }

            // Extract usage from any chunk that has it
            if (chunk.usage) {
              turnInputTokens = chunk.usage.prompt_tokens ?? turnInputTokens;
              turnOutputTokens = chunk.usage.completion_tokens ?? turnOutputTokens;
            }

            const delta = chunk.choices?.[0]?.delta;
            if (!delta) continue;

            // Accumulate content tokens
            if (delta.content) {
              accumulatedContent += delta.content;
              if (onToken) {
                onToken(delta.content);
              }
            }

            // Accumulate tool calls
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!accumulatedToolCalls.has(idx)) {
                  accumulatedToolCalls.set(idx, {
                    id: tc.id ?? '',
                    function: { name: tc.function?.name ?? '', arguments: '' },
                  });
                }
                const existing = accumulatedToolCalls.get(idx)!;
                if (tc.id) existing.id = tc.id;
                if (tc.function?.name) existing.function.name = tc.function.name;
                if (tc.function?.arguments) {
                  existing.function.arguments += tc.function.arguments;
                }
              }
            }
          }
        }
      }

      const toolCallsArray =
        accumulatedToolCalls.size > 0
          ? Array.from(accumulatedToolCalls.values())
          : undefined;

      assistantMessage = {
        content: accumulatedContent || null,
        tool_calls: toolCallsArray,
      };
    } else {
      // Non-streaming path (unchanged)
      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error(
          `LiteLLM returned no choices: ${JSON.stringify(data).slice(0, 200)}`
        );
      }
      const choice = data.choices[0];
      assistantMessage = choice.message;
      turnInputTokens = data.usage?.prompt_tokens ?? 0;
      turnOutputTokens = data.usage?.completion_tokens ?? 0;
    }

    totalInputTokens += turnInputTokens;
    totalOutputTokens += turnOutputTokens;

    // No tool calls — return the final response
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      const content = assistantMessage.content ?? '';
      // In non-streaming mode, emit the full content as a single token
      if (!stream && onToken && content) {
        onToken(content);
      }
      return {
        content,
        toolsUsed,
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
      };
    }

    // Has tool calls — execute them and continue the loop
    messages.push({
      role: 'assistant',
      content: assistantMessage.content,
      tool_calls: assistantMessage.tool_calls,
    });

    for (const toolCall of assistantMessage.tool_calls) {
      const fnName = toolCall.function.name;
      const fnArgs = JSON.parse(toolCall.function.arguments);

      if (onToolUse) {
        onToolUse(fnName, fnArgs);
      }

      const tool = toolMap.get(fnName);
      let result: string;
      if (tool) {
        try {
          result = await tool.execute(fnArgs);
        } catch (err) {
          result = `Error: ${(err as Error).message}`;
        }
        toolsUsed.push(fnName);
      } else {
        result = `Error: Unknown tool "${fnName}"`;
      }

      messages.push({
        role: 'tool',
        content: result,
        tool_call_id: toolCall.id,
      });
    }
  }

  // maxTurns reached
  return {
    content: 'Max tool turns reached.',
    toolsUsed,
    usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
  };
}
