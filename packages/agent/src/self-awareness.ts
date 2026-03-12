export interface AgentCapabilities {
  tools: Array<{ name: string; description: string }>;
  skills: string[];
  model: string;
  memoryStats: { frameCount: number; sessionCount: number; entityCount: number };
  mode: 'local' | 'team';
  version: string;
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

  lines.push('');
  lines.push('When asked "what can you do?" or "who are you?" — answer from this section and demonstrate by doing, not listing.');

  return lines.join('\n');
}
