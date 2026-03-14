import type { AwarenessSummary } from './improvement-detector.js';

export interface AgentCapabilities {
  tools: Array<{ name: string; description: string }>;
  skills: string[];
  model: string;
  memoryStats: { frameCount: number; sessionCount: number; entityCount: number };
  mode: 'local' | 'team';
  version: string;
  /** Structured improvement signals (optional — only present when store has actionable data) */
  awareness?: AwarenessSummary;
}

export function buildSelfAwareness(caps: AgentCapabilities): string {
  const lines: string[] = [];

  lines.push('# Self-Awareness');
  lines.push('');
  lines.push(`You are Waggle v${caps.version}, running in ${caps.mode} mode.`);
  lines.push(`Model: ${caps.model}`);

  // Memory stats — helps agent understand its own knowledge depth
  const { frameCount, sessionCount, entityCount } = caps.memoryStats;
  if (frameCount > 0) {
    lines.push(`Memory: ${frameCount} memories across ${sessionCount} sessions, ${entityCount} knowledge entities.`);
    lines.push('You have prior context. Use search_memory to recall relevant information before responding.');
  } else {
    lines.push('Memory: empty — this appears to be a fresh start. Learn the user\'s preferences and save important context.');
  }

  // Tools — grouped by category for clarity
  lines.push('');
  lines.push('## Your Capabilities');
  const toolCount = caps.tools.length;
  lines.push(`${toolCount} tools available. You can search the web, read/write files, run commands, manage git, create plans, and access your persistent memory.`);

  // Skills
  if (caps.skills.length > 0) {
    lines.push('');
    lines.push(`## Active Skills: ${caps.skills.join(', ')}`);
  }

  // Groundedness guidance
  lines.push('');
  lines.push('## Groundedness');
  lines.push('- Only claim capabilities you actually have (check your tools list).');
  lines.push('- If you lack a tool the user needs, say so and suggest acquire_capability.');
  lines.push('- Prefer memory search over guessing when prior context exists.');
  lines.push('- When uncertain, ask rather than fabricate.');

  // Improvement signals (per correction #1: structured, runtime-consumable)
  if (caps.awareness && caps.awareness.totalActionable > 0) {
    lines.push('');
    lines.push('## Learning from Past Sessions');

    if (caps.awareness.capabilityGaps.length > 0) {
      lines.push('');
      lines.push('**Recurring capability gaps:**');
      for (const gap of caps.awareness.capabilityGaps) {
        lines.push(`- ${gap.suggestion}`);
      }
    }

    if (caps.awareness.corrections.length > 0) {
      lines.push('');
      lines.push('**User corrections to apply:**');
      for (const correction of caps.awareness.corrections) {
        lines.push(`- ${correction.guidance}`);
      }
    }

    if (caps.awareness.workflowPatterns.length > 0) {
      lines.push('');
      lines.push('**Recurring task patterns:**');
      for (const pattern of caps.awareness.workflowPatterns) {
        lines.push(`- ${pattern.suggestion}`);
      }
    }
  }

  lines.push('');
  lines.push('When asked "what can you do?" or "who are you?" — answer from this section and demonstrate by doing, not listing.');

  return lines.join('\n');
}
