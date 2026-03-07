/**
 * Interactive REPL for the Waggle CLI.
 *
 * Loads WaggleConfig, MindDB, Orchestrator, ModelRouter.
 * Supports slash commands and multi-model chat with tool use.
 */

import readline from 'node:readline';
import chalk from 'chalk';
import { MindDB, WaggleConfig, type Embedder } from '@waggle/core';
import { Orchestrator, ModelRouter, openaiChat, type ChatMessage } from '@waggle/agent';
import { parseCommand, COMMANDS } from './commands.js';
import { renderMarkdown } from './renderer.js';

// Mock embedder — same as sidecar, real embeddings in future milestone
const mockEmbedder: Embedder = {
  embed: async (text: string) => {
    const arr = new Float32Array(1024);
    const bytes = new TextEncoder().encode(text);
    for (let i = 0; i < Math.min(bytes.length, 1024); i++) {
      arr[i] = (bytes[i] - 128) / 128;
    }
    return arr;
  },
  embedBatch: async (texts: string[]) => {
    const results: Float32Array[] = [];
    for (const text of texts) {
      const arr = new Float32Array(1024);
      const bytes = new TextEncoder().encode(text);
      for (let i = 0; i < Math.min(bytes.length, 1024); i++) {
        arr[i] = (bytes[i] - 128) / 128;
      }
      results.push(arr);
    }
    return results;
  },
  dimensions: 1024,
};

export interface ReplOptions {
  model?: string;
}

export async function startRepl(options: ReplOptions = {}): Promise<void> {
  // Load config
  const config = new WaggleConfig();
  const mindPath = config.getMindPath();

  // Open (or create) .mind database
  const db = new MindDB(mindPath);

  // Build orchestrator
  const orchestrator = new Orchestrator({ db, embedder: mockEmbedder });

  // Build model router from config
  const providers = config.getProviders();
  const defaultModel = options.model ?? config.getDefaultModel();

  const router = new ModelRouter({
    providers,
    defaultModel,
  });

  let currentModel = defaultModel;

  // Stats for welcome banner
  const frameCount = orchestrator.getFrames().count();
  const sessionCount = orchestrator.getSessions().list().length;

  // Print welcome banner
  console.log('');
  console.log(chalk.bold.magenta('  Waggle') + chalk.dim(' — AI agent with persistent memory'));
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(chalk.dim('  Model:    ') + chalk.cyan(currentModel));
  console.log(chalk.dim('  Memory:   ') + chalk.cyan(`${frameCount} frames`));
  console.log(chalk.dim('  Sessions: ') + chalk.cyan(`${sessionCount}`));
  console.log(chalk.dim('  Mind:     ') + chalk.cyan(mindPath));
  console.log(chalk.dim('  Type /help for commands'));
  console.log('');

  // Conversation history for Anthropic tool loop
  let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string | Array<unknown> }> = [];

  // Setup readline
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('you > '),
  });

  rl.prompt();

  rl.on('line', async (line: string) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    // Check for slash commands
    const cmd = parseCommand(input);
    if (cmd) {
      switch (cmd.name) {
        case 'exit':
          console.log(chalk.dim('Goodbye!'));
          rl.close();
          return;

        case 'help':
          console.log('');
          console.log(chalk.bold('Available commands:'));
          for (const [, helpText] of Object.entries(COMMANDS)) {
            console.log(chalk.dim('  ' + helpText));
          }
          console.log('');
          break;

        case 'model':
          if (!cmd.args) {
            console.log(chalk.dim(`Current model: ${currentModel}`));
          } else {
            try {
              router.resolve(cmd.args);
              currentModel = cmd.args;
              console.log(chalk.green(`Switched to model: ${currentModel}`));
            } catch {
              console.log(chalk.red(`Unknown model: ${cmd.args}`));
              console.log(chalk.dim(`Available: ${router.listModels().join(', ')}`));
            }
          }
          break;

        case 'models': {
          const models = router.listModels();
          console.log('');
          console.log(chalk.bold('Available models:'));
          for (const m of models) {
            const marker = m === currentModel ? chalk.green(' (active)') : '';
            console.log(chalk.dim('  ') + chalk.cyan(m) + marker);
          }
          if (models.length === 0) {
            console.log(chalk.dim('  No models configured. Edit ~/.waggle/config.json'));
          }
          console.log('');
          break;
        }

        case 'clear':
          conversationHistory = [];
          console.log(chalk.dim('Conversation cleared.'));
          break;

        case 'identity': {
          const identityCtx = orchestrator.getIdentity().toContext();
          console.log('');
          console.log(renderMarkdown(identityCtx));
          console.log('');
          break;
        }

        default:
          console.log(chalk.red(`Unknown command: /${cmd.name}`));
          console.log(chalk.dim('Type /help for available commands.'));
      }

      rl.prompt();
      return;
    }

    // Chat message — send to model
    try {
      const resolved = router.resolve(currentModel);

      if (resolved.provider === 'anthropic') {
        // Anthropic SDK with tool loop (same pattern as sidecar agent-session.ts)
        const response = await sendAnthropicMessage(
          input,
          resolved.apiKey,
          currentModel,
          orchestrator,
          conversationHistory,
        );
        console.log('');
        console.log(chalk.bold.blue('waggle > ') + renderMarkdown(response));
        console.log('');
      } else {
        // OpenAI-compatible provider (no tool support yet)
        const systemPrompt = orchestrator.buildSystemPrompt();
        const messages: ChatMessage[] = [
          ...conversationHistory
            .filter(m => typeof m.content === 'string')
            .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content as string })),
          { role: 'user' as const, content: input },
        ];

        const chatResponse = await openaiChat(resolved, messages, systemPrompt);

        conversationHistory.push({ role: 'user', content: input });
        conversationHistory.push({ role: 'assistant', content: chatResponse.content });

        console.log('');
        console.log(chalk.bold.blue('waggle > ') + renderMarkdown(chatResponse.content));
        console.log(chalk.dim(`  [${chatResponse.model} | ${chatResponse.usage.input_tokens}→${chatResponse.usage.output_tokens} tokens]`));
        console.log('');
      }
    } catch (err) {
      const errMsg = (err as Error).message;
      if (errMsg.includes('Unknown model')) {
        console.log(chalk.red(`Model "${currentModel}" is not configured.`));
        console.log(chalk.dim('Run /models to see available models, or edit ~/.waggle/config.json'));
      } else if (errMsg.includes('API key') || errMsg.includes('authentication') || errMsg.includes('401')) {
        console.log(chalk.red('Authentication failed. Check your API key in ~/.waggle/config.json'));
      } else {
        console.log(chalk.red(`Error: ${errMsg}`));
      }
      console.log('');
    }

    rl.prompt();
  });

  rl.on('close', () => {
    db.close();
    process.exit(0);
  });

  // Graceful shutdown on SIGINT
  process.on('SIGINT', () => {
    console.log('');
    console.log(chalk.dim('Goodbye!'));
    db.close();
    process.exit(0);
  });
}

/**
 * Send a message using the Anthropic SDK with tool loop.
 * Same pattern as sidecar/src/agent-session.ts.
 */
async function sendAnthropicMessage(
  message: string,
  apiKey: string,
  model: string,
  orchestrator: Orchestrator,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string | Array<unknown> }>,
): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const systemPrompt = orchestrator.buildSystemPrompt();
  const tools = orchestrator.getTools();

  // Tool schema fix: always include type: 'object' (same fix as M1 Task 1.11)
  const anthropicTools = tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: 'object' as const,
      properties: {},
      ...t.parameters,
    },
  }));

  // Add user message to history
  conversationHistory.push({ role: 'user', content: message });

  let messages = [...conversationHistory];
  let maxTurns = 10;

  while (maxTurns-- > 0) {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      tools: anthropicTools as never,
      messages: messages as never,
    });

    const toolBlocks = response.content.filter((b: { type: string }) => b.type === 'tool_use');
    const textBlocks = response.content.filter((b: { type: string }) => b.type === 'text');

    if (toolBlocks.length === 0) {
      // No tools — final response
      const text = textBlocks.map((b: { text: string }) => b.text).join('');
      conversationHistory.push({ role: 'assistant', content: text });
      return text;
    }

    // Execute tools
    console.log('');
    const toolResults: Array<unknown> = [];
    for (const block of toolBlocks) {
      const tb = block as { id: string; name: string; input: Record<string, unknown> };
      console.log(chalk.dim(`  [tool] ${tb.name}`));

      try {
        const result = await orchestrator.executeTool(tb.name, tb.input);
        console.log(chalk.dim(`  [result] ${result.slice(0, 80)}${result.length > 80 ? '...' : ''}`));
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tb.id,
          content: result,
        });
      } catch (err) {
        const errMsg = (err as Error).message;
        console.log(chalk.dim(`  [error] ${errMsg}`));
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tb.id,
          content: `Error: ${errMsg}`,
          is_error: true,
        });
      }
    }

    messages = [
      ...messages,
      { role: 'assistant', content: response.content as Array<unknown> },
      { role: 'user', content: toolResults as Array<unknown> },
    ];

    // Also update conversation history for context persistence
    conversationHistory.push({ role: 'assistant', content: response.content as Array<unknown> });
    conversationHistory.push({ role: 'user', content: toolResults as Array<unknown> });
  }

  return 'Max tool turns reached.';
}
