import type { FastifyPluginAsync } from 'fastify';
import { runAgentLoop } from '@waggle/agent';
import type { AgentLoopConfig, AgentResponse } from '@waggle/agent';

export type AgentRunner = (config: AgentLoopConfig) => Promise<AgentResponse>;

export const chatRoutes: FastifyPluginAsync = async (server) => {
  // POST /api/chat — SSE streaming chat endpoint
  server.post<{
    Body: { message: string; workspace?: string; model?: string };
  }>('/api/chat', async (request, reply) => {
    const { message, workspace, model } = request.body ?? {};

    // Validation — return standard JSON error before starting SSE
    if (!message) {
      return reply.status(400).send({ error: 'message is required' });
    }

    // Hijack the response so Fastify doesn't try to send its own reply
    await reply.hijack();

    // Set SSE headers via raw response
    const raw = reply.raw;
    raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Helper to write SSE events
    const sendEvent = (event: string, data: unknown) => {
      raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Build system prompt — use identity if available, fallback to generic
      let systemPrompt = 'You are Waggle, a helpful AI assistant.';
      try {
        if (server.multiMind.hasIdentity()) {
          const identity = server.multiMind.getIdentity();
          systemPrompt = identity.system_prompt || `You are ${identity.name}. ${identity.role ? `Your role is ${identity.role}.` : ''} You are a helpful AI assistant.`;
        }
      } catch {
        // Identity not configured — use default prompt
      }

      // Resolve the agent runner (injectable for tests)
      const agentRunner: AgentRunner = server.agentRunner ?? runAgentLoop;

      // Resolve model: request param > config default > fallback
      const resolvedModel = model ?? 'anthropic/claude-sonnet-4-20250514';

      // Build agent loop config
      const agentConfig: AgentLoopConfig = {
        litellmUrl: server.localConfig.litellmUrl,
        litellmApiKey: process.env.LITELLM_API_KEY ?? 'sk-waggle-local',
        model: resolvedModel,
        systemPrompt,
        tools: [],
        messages: [{ role: 'user', content: message }],
        stream: true,
        onToken: (token: string) => {
          sendEvent('token', { content: token });
        },
        onToolUse: (name: string, input: Record<string, unknown>) => {
          sendEvent('tool', { name, input });
        },
      };

      // Run the agent loop
      const result = await agentRunner(agentConfig);

      // Send the done event with full response
      sendEvent('done', {
        content: result.content,
        usage: result.usage,
        toolsUsed: result.toolsUsed,
      });
    } catch (err) {
      // Send error event
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      sendEvent('error', { message: errorMessage });
    }

    // End the SSE stream
    raw.end();
  });
};
