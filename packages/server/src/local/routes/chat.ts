import crypto from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { runAgentLoop, needsConfirmation } from '@waggle/agent';
import type { AgentLoopConfig, AgentResponse } from '@waggle/agent';

export type AgentRunner = (config: AgentLoopConfig) => Promise<AgentResponse>;

/** Generate a human-readable description of what a tool is doing */
function describeToolUse(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case 'web_search':
      return `Searching the web for "${input.query ?? ''}"...`;
    case 'web_fetch':
      return `Reading web page: ${input.url ?? ''}...`;
    case 'search_memory':
      return `Searching memory for "${input.query ?? ''}"...`;
    case 'save_memory':
      return `Saving to memory...`;
    case 'get_identity':
      return `Checking identity...`;
    case 'get_awareness':
      return `Checking current awareness state...`;
    case 'query_knowledge':
      return `Querying knowledge graph...`;
    case 'add_task':
      return `Adding task: "${input.title ?? ''}"...`;
    case 'correct_knowledge':
      return `Updating knowledge graph...`;
    case 'bash':
      return `Running command: ${String(input.command ?? '').slice(0, 80)}...`;
    case 'read_file':
      return `Reading file: ${input.path ?? ''}...`;
    case 'write_file':
      return `Writing file: ${input.path ?? ''}...`;
    case 'edit_file':
      return `Editing file: ${input.path ?? ''}...`;
    case 'search_files':
      return `Searching for files matching "${input.pattern ?? ''}"...`;
    case 'search_content':
      return `Searching file contents for "${input.pattern ?? ''}"...`;
    case 'git_status':
      return `Checking git status...`;
    case 'git_diff':
      return `Checking git diff...`;
    case 'git_log':
      return `Checking git log...`;
    case 'git_commit':
      return `Creating git commit...`;
    case 'create_plan':
      return `Creating plan: "${input.title ?? ''}"...`;
    case 'add_plan_step':
      return `Adding plan step...`;
    case 'execute_step':
      return `Executing plan step...`;
    case 'show_plan':
      return `Showing current plan...`;
    default:
      return `Using ${name}...`;
  }
}

export const chatRoutes: FastifyPluginAsync = async (server) => {
  // ── Use shared agent state from server ──────────────────────────────
  const {
    orchestrator,
    allTools,
    hookRegistry,
    costTracker,
    skills,
    userSystemPrompt,
    sessionHistories,
    litellmApiKey,
  } = server.agentState;
  const litellmUrl = server.localConfig.litellmUrl;

  // Build the rich system prompt (matches CLI's quality)
  function buildSystemPrompt(): string {
    let prompt = '';

    // Prepend user's custom system prompt if exists
    if (userSystemPrompt) {
      prompt += userSystemPrompt + '\n\n';
    }

    prompt += orchestrator.buildSystemPrompt();

    prompt += `

# Who You Are
You are Waggle — a personal AI assistant with persistent memory and web access.
Your key strength: you remember past conversations through your .mind memory system.

# CRITICAL RULES — FOLLOW THESE EXACTLY

## ABSOLUTE RULE: Never guess — USE YOUR TOOLS
- If you don't know a FACT, USE YOUR TOOLS to find out. You have bash, web_search, read_file — use them.
- Never say "I don't know" or "I can't determine" when you have tools that can answer the question.
- Need the date? Run \`date\` via bash. Need current info? Use web_search. Need file contents? Use read_file.
- Be resourceful. Solve problems yourself instead of asking the user or giving up.
- The words "likely", "probably", "I believe", "I think" before a factual claim = YOU ARE GUESSING. Stop. Search instead.
- This is ESPECIALLY important for comparisons. If someone asks "how do you compare to X", you MUST:
  1. Use web_search to find X's actual current features
  2. Use web_fetch to read their docs/website if needed
  3. ONLY THEN state what X can and cannot do, citing what you found
  4. If your search didn't find clear info, say "I couldn't verify this" — don't fill the gap with guesses
- NEVER say "X probably can't do Y" or "X likely doesn't have Y". Either you verified it or you don't claim it.
- When corrected: "You're right, my mistake." Move on. No apology paragraphs.

## Be concise — HARD LIMITS
- Simple questions: 2-5 sentences. Complex questions: max 10-12 lines.
- Max 4 bullet points per response. If you need more, you're over-explaining.
- Zero emoji unless the user uses them first.
- Lead with the answer. No preamble like "Great question!" or "That's interesting!"
- Don't list your capabilities. Demonstrate them.
- Don't repeat back what the user said.

## Be sharp, not generic
- Specific > generic. "Use web_search to find Claude Code's changelog" > "I can help with research!"
- Have a clear recommendation when asked. Not "here are options", but "I'd do X because Y".
- When you research something, give the user the INSIGHT, not a reformatted copy of search results.
- If you don't have useful info, say so in one sentence. Don't pad with filler.

# Tools
Web: web_search (DuckDuckGo), web_fetch (read any URL)
Memory: search_memory, save_memory, get_identity, get_awareness, query_knowledge, add_task
System: bash, read_file, write_file, edit_file, search_files, search_content
Git: git_status, git_diff, git_log, git_commit
Planning: create_plan, add_plan_step, execute_step, show_plan

When asked about current events, products, releases, docs, or anything you're not 100% certain about — web_search FIRST, answer SECOND.`;

    // Append loaded skills (same as CLI)
    if (skills.length > 0) {
      prompt += '\n\n# Loaded Skills\n';
      for (const skill of skills) {
        prompt += `\n## Skill: ${skill.name}\n${skill.content}\n`;
      }
    }

    return prompt;
  }

  // POST /api/chat — SSE streaming chat endpoint
  server.post<{
    Body: { message: string; workspace?: string; model?: string; session?: string };
  }>('/api/chat', async (request, reply) => {
    const { message, workspace, model, session } = request.body ?? {};

    // Validation — return standard JSON error before starting SSE
    if (!message) {
      return reply.status(400).send({ error: 'message is required' });
    }

    // Hijack the response so Fastify doesn't try to send its own reply
    await reply.hijack();

    // Set SSE headers via raw response (include CORS since hijack bypasses Fastify plugins)
    const raw = reply.raw;
    const origin = request.headers.origin ?? '*';
    raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    });

    // Helper to write SSE events
    const sendEvent = (event: string, data: unknown) => {
      raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const hasCustomRunner = !!server.agentRunner;

      // Resolve the agent runner (injectable for tests)
      const agentRunner: AgentRunner = server.agentRunner ?? runAgentLoop;

      // Resolve model: request param > server state > fallback
      const resolvedModel = model ?? server.agentState.currentModel ?? 'claude-sonnet-4-6';

      // Check if LiteLLM is available — if not, use echo mode
      let litellmAvailable = hasCustomRunner; // trust injected runners
      if (!hasCustomRunner) {
        try {
          const healthRes = await fetch(`${litellmUrl}/health/liveliness`, {
            signal: AbortSignal.timeout(3000),
          });
          litellmAvailable = healthRes.ok;
        } catch {
          // LiteLLM not reachable
        }
      }

      if (!litellmAvailable) {
        // Echo mode — respond without LLM so the UI is functional
        const echoResponse = `**Waggle is running in local mode** (no LLM proxy connected).\n\nYour message: "${message}"\n\nTo enable AI responses, start LiteLLM or configure an API key in Settings > API Keys.`;
        const words = echoResponse.split(' ');
        for (const word of words) {
          sendEvent('token', { content: word + ' ' });
          await new Promise((r) => setTimeout(r, 15));
        }
        sendEvent('done', {
          content: echoResponse,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          toolsUsed: [],
        });
      } else {
        // ── Conversation history management ──────────────────────
        const sessionId = session ?? workspace ?? 'default';

        // Get or create session history
        if (!sessionHistories.has(sessionId)) {
          sessionHistories.set(sessionId, []);
        }
        const history = sessionHistories.get(sessionId)!;

        // Add user message to history
        history.push({ role: 'user', content: message });

        // Build system prompt
        const systemPrompt = hasCustomRunner
          ? 'You are a helpful AI assistant.'
          : buildSystemPrompt();

        // Register a per-request pre:tool hook for confirmation gates
        // This fires during the agent loop and pauses until user approves/denies
        const unregisterHook = hasCustomRunner ? undefined : hookRegistry.on('pre:tool', async (ctx) => {
          if (!ctx.toolName || !needsConfirmation(ctx.toolName)) return;

          const requestId = crypto.randomUUID();
          const toolName = ctx.toolName;
          const input = (ctx.args ?? {}) as Record<string, unknown>;

          // Send approval_required SSE event to the client
          sendEvent('approval_required', { requestId, toolName, input });

          // Wait for the client to approve or deny
          const approved = await new Promise<boolean>((resolve) => {
            server.agentState.pendingApprovals.set(requestId, {
              resolve,
              toolName,
              input,
              timestamp: Date.now(),
            });

            // Auto-approve after 5 minutes if no response (prevent infinite hang)
            setTimeout(() => {
              if (server.agentState.pendingApprovals.has(requestId)) {
                server.agentState.pendingApprovals.delete(requestId);
                resolve(true);
              }
            }, 300_000);
          });

          if (!approved) {
            sendEvent('step', { content: `\u2716 ${toolName} denied by user` });
            return { cancel: true, reason: `User denied ${toolName}` };
          }
          sendEvent('step', { content: `\u2714 ${toolName} approved` });
        });

        // Build agent loop config — with FULL conversation history + hooks
        const agentConfig: AgentLoopConfig = {
          litellmUrl,
          litellmApiKey,
          model: resolvedModel,
          systemPrompt,
          tools: hasCustomRunner ? [] : allTools,
          messages: history,
          stream: true,
          hooks: hasCustomRunner ? undefined : hookRegistry,
          onToken: (token: string) => {
            sendEvent('token', { content: token });
          },
          onToolUse: (name: string, input: Record<string, unknown>) => {
            // Send human-readable step description + raw tool event
            const stepText = describeToolUse(name, input);
            sendEvent('step', { content: stepText });
            sendEvent('tool', { name, input });
          },
        };

        // Run the agent loop
        const result = await agentRunner(agentConfig);

        // Unregister the per-request approval hook
        if (unregisterHook) unregisterHook();

        // Track cost (same as CLI)
        costTracker.addUsage(resolvedModel, result.usage.inputTokens, result.usage.outputTokens);

        // Add assistant response to history (maintains context for next turn)
        history.push({ role: 'assistant', content: result.content });

        // Send the done event with full response + model info
        sendEvent('done', {
          content: result.content,
          usage: result.usage,
          toolsUsed: result.toolsUsed,
          model: resolvedModel,
        });
      }
    } catch (err) {
      // Send error event
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      sendEvent('error', { message: errorMessage });
    }

    // End the SSE stream
    raw.end();
  });

  // DELETE /api/chat/history — clear session history
  server.delete<{
    Querystring: { session?: string };
  }>('/api/chat/history', async (request, reply) => {
    const sessionId = request.query.session ?? 'default';
    sessionHistories.delete(sessionId);
    return reply.send({ ok: true, cleared: sessionId });
  });
};
