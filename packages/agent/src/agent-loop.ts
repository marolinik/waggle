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

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error(`LiteLLM returned no choices: ${JSON.stringify(data).slice(0, 200)}`);
    }
    const choice = data.choices[0];
    const assistantMessage = choice.message;
    const usage = data.usage;

    totalInputTokens += usage?.prompt_tokens ?? 0;
    totalOutputTokens += usage?.completion_tokens ?? 0;

    // No tool calls — return the final response
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      const content = assistantMessage.content ?? '';
      if (onToken && content) {
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
