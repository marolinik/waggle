/**
 * 12 workflow-native commands — high-level actions that delegate to context methods.
 *
 * Each command validates its args, formats markdown output, and delegates
 * the real work to the CommandContext (workflow runner, memory, skills, etc.).
 */

import type { CommandRegistry, CommandDefinition } from './command-registry.js';

// ── Individual command factories ────────────────────────────────────────

function catchupCommand(): CommandDefinition {
  return {
    name: 'catchup',
    aliases: ['catch-up', 'recap'],
    description: 'Workspace restart summary — get up to speed instantly',
    usage: '/catchup',
    handler: async (_args, ctx) => {
      if (!ctx.getWorkspaceState) {
        return 'Workspace state is not available in this context.';
      }
      const state = await ctx.getWorkspaceState();
      return `## Catch-Up Briefing\n\nHere's what's been happening in this workspace:\n\n${state}`;
    },
  };
}

function nowCommand(): CommandDefinition {
  return {
    name: 'now',
    aliases: ['current', 'where'],
    description: 'Current workspace state — what\'s happening right now',
    usage: '/now',
    handler: async (_args, ctx) => {
      if (!ctx.getWorkspaceState) {
        return 'Workspace state is not available in this context.';
      }
      const state = await ctx.getWorkspaceState();
      return `## Right Now\n\n${state}`;
    },
  };
}

function researchCommand(): CommandDefinition {
  return {
    name: 'research',
    aliases: ['investigate'],
    description: 'Launch multi-agent research on a topic',
    usage: '/research <topic>',
    handler: async (args, ctx) => {
      if (!args.trim()) {
        return 'Missing topic. Usage: `/research <topic>`\n\nExample: `/research quantum computing applications`';
      }
      if (!ctx.runWorkflow) {
        return 'Workflow runner is not available in this context.';
      }
      return ctx.runWorkflow('research-team', args.trim());
    },
  };
}

function draftCommand(): CommandDefinition {
  return {
    name: 'draft',
    aliases: ['write'],
    description: 'Start a drafting workflow with review cycle',
    usage: '/draft <type> [topic]',
    handler: async (args, ctx) => {
      if (!args.trim()) {
        return 'Missing draft type. Usage: `/draft <type> [topic]`\n\nExamples:\n- `/draft blog post about AI safety`\n- `/draft report quarterly metrics`\n- `/draft email to client about delays`';
      }
      if (ctx.runWorkflow) {
        return ctx.runWorkflow('review-pair', args.trim());
      }
      return `## Draft Prompt\n\nPlease draft the following:\n\n**${args.trim()}**\n\n_Tip: A review workflow is not available. The agent will draft directly._`;
    },
  };
}

function decideCommand(): CommandDefinition {
  return {
    name: 'decide',
    aliases: ['decision', 'weigh'],
    description: 'Create a structured decision matrix',
    usage: '/decide <question>',
    handler: async (args, _ctx) => {
      if (!args.trim()) {
        return 'Missing question. Usage: `/decide <question>`\n\nExample: `/decide Should we use PostgreSQL or MongoDB?`';
      }
      const question = args.trim();
      return [
        `## Decision Matrix`,
        ``,
        `**Question:** ${question}`,
        ``,
        `### Options`,
        `| Option | Pros | Cons | Risk | Effort |`,
        `|--------|------|------|------|--------|`,
        `| Option A | | | | |`,
        `| Option B | | | | |`,
        `| Option C | | | | |`,
        ``,
        `### Evaluation Criteria`,
        `1. Impact on goals`,
        `2. Effort / cost`,
        `3. Reversibility`,
        `4. Time sensitivity`,
        ``,
        `### Recommendation`,
        `_Fill in after analysis._`,
        ``,
        `> Use this framework to structure your thinking. Ask the agent to help fill it in with \`Please analyze this decision for me.\``,
      ].join('\n');
    },
  };
}

function reviewCommand(): CommandDefinition {
  return {
    name: 'review',
    aliases: ['critique', 'check'],
    description: 'Review the last output with a critic agent',
    usage: '/review',
    handler: async (_args, ctx) => {
      if (!ctx.runWorkflow) {
        return 'Workflow runner is not available in this context.';
      }
      return ctx.runWorkflow('review-pair', 'Review the last output for accuracy, completeness, and quality.');
    },
  };
}

function spawnCommand(): CommandDefinition {
  return {
    name: 'spawn',
    aliases: ['agent', 'summon'],
    description: 'Spawn a specialist sub-agent',
    usage: '/spawn <role> [task]',
    handler: async (args, ctx) => {
      if (!args.trim()) {
        return 'Missing role. Usage: `/spawn <role> [task]`\n\nAvailable roles: `researcher`, `writer`, `coder`, `analyst`, `reviewer`, `planner`\n\nExample: `/spawn researcher Find recent papers on transformer architectures`';
      }
      if (!ctx.spawnAgent) {
        return 'Sub-agent spawning is not available in this context.';
      }
      const parts = args.trim().split(/\s+/);
      const role = parts[0];
      const task = parts.slice(1).join(' ') || `Act as a ${role} and assist with the current workspace task.`;
      return ctx.spawnAgent(role, task);
    },
  };
}

function skillsCommand(): CommandDefinition {
  return {
    name: 'skills',
    aliases: ['abilities', 'tools'],
    description: 'Show active skills in this workspace',
    usage: '/skills',
    handler: async (_args, ctx) => {
      if (!ctx.listSkills) {
        return 'Skill listing is not available in this context.';
      }
      const skills = ctx.listSkills();
      if (skills.length === 0) {
        return '## Active Skills\n\nNo skills are currently active in this workspace.';
      }
      const list = skills.map(s => `- \`${s}\``).join('\n');
      return `## Active Skills\n\n${list}\n\n_${skills.length} skill(s) loaded._`;
    },
  };
}

function statusCommand(): CommandDefinition {
  return {
    name: 'status',
    aliases: ['report', 'progress'],
    description: 'Project status summary',
    usage: '/status',
    handler: async (_args, ctx) => {
      if (!ctx.getWorkspaceState) {
        return 'Workspace state is not available in this context.';
      }
      const state = await ctx.getWorkspaceState();
      return `## Status Report\n\n${state}`;
    },
  };
}

function memoryCommand(): CommandDefinition {
  return {
    name: 'memory',
    aliases: ['remember', 'recall'],
    description: 'Search or browse workspace memory',
    usage: '/memory [query]',
    handler: async (args, ctx) => {
      if (!ctx.searchMemory) {
        return 'Memory search is not available in this context.';
      }
      if (!args.trim()) {
        return '## Memory\n\nUsage: `/memory <query>` to search workspace memory.\n\nExamples:\n- `/memory architecture decisions`\n- `/memory last meeting notes`\n- `/memory project goals`';
      }
      const results = await ctx.searchMemory(args.trim());
      return `## Memory Search: "${args.trim()}"\n\n${results}`;
    },
  };
}

function planCommand(): CommandDefinition {
  return {
    name: 'plan',
    aliases: ['decompose', 'break-down'],
    description: 'Break a goal into an actionable task list',
    usage: '/plan <goal>',
    handler: async (args, ctx) => {
      if (!args.trim()) {
        return 'Missing goal. Usage: `/plan <goal>`\n\nExample: `/plan Build a user dashboard with analytics`';
      }
      if (!ctx.runWorkflow) {
        return 'Workflow runner is not available in this context.';
      }
      return ctx.runWorkflow('plan-execute', args.trim());
    },
  };
}

function focusCommand(): CommandDefinition {
  return {
    name: 'focus',
    aliases: ['narrow', 'scope'],
    description: 'Narrow agent focus to a specific topic',
    usage: '/focus <topic>',
    handler: async (args, _ctx) => {
      if (!args.trim()) {
        return 'Missing topic. Usage: `/focus <topic>`\n\nExample: `/focus database performance optimization`';
      }
      const topic = args.trim();
      return [
        `## Focus: ${topic}`,
        ``,
        `Context narrowed to **${topic}**. Subsequent responses will prioritize this topic.`,
        ``,
        `> Tip: Use /focus again to change, or just ask about anything else to broaden context.`,
      ].join('\n');
    },
  };
}

function helpCommand(): CommandDefinition {
  return {
    name: 'help',
    aliases: ['commands', '?'],
    description: 'List all available commands',
    usage: '/help',
    handler: async (_args, _ctx) => {
      const lines = [
        `## Available Commands`,
        ``,
        `| Command | Description |`,
        `|---------|-------------|`,
        `| \`/catchup\` | Workspace restart summary — get up to speed instantly |`,
        `| \`/now\` | Current workspace state — what's happening right now |`,
        `| \`/research <topic>\` | Launch multi-agent research on a topic |`,
        `| \`/draft <type> [topic]\` | Start a drafting workflow with review cycle |`,
        `| \`/decide <question>\` | Create a structured decision matrix |`,
        `| \`/review\` | Review the last output with a critic agent |`,
        `| \`/spawn <role> [task]\` | Spawn a specialist sub-agent |`,
        `| \`/skills\` | Show active skills in this workspace |`,
        `| \`/status\` | Project status summary |`,
        `| \`/memory [query]\` | Search or browse workspace memory |`,
        `| \`/plan <goal>\` | Break a goal into an actionable task list |`,
        `| \`/focus <topic>\` | Narrow agent focus to a specific topic |`,
        `| \`/help\` | List all available commands |`,
      ];
      return lines.join('\n');
    },
  };
}

// ── Registration ────────────────────────────────────────────────────────

export function registerWorkflowCommands(registry: CommandRegistry): void {
  const commands = [
    catchupCommand(),
    nowCommand(),
    researchCommand(),
    draftCommand(),
    decideCommand(),
    reviewCommand(),
    spawnCommand(),
    skillsCommand(),
    statusCommand(),
    memoryCommand(),
    planCommand(),
    focusCommand(),
    helpCommand(),
  ];

  for (const cmd of commands) {
    registry.register(cmd);
  }
}
