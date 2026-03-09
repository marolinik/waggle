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

  lines.push('# Self-Awareness (auto-generated — do NOT web search for this)');
  lines.push('');
  lines.push(`Version: ${caps.version}`);
  lines.push(`Mode: ${caps.mode}`);
  lines.push(`Current model: ${caps.model}`);

  lines.push('');
  lines.push('## Available Tools');
  if (caps.tools.length === 0) {
    lines.push('No tools loaded.');
  } else {
    for (const tool of caps.tools) {
      lines.push(`- ${tool.name}: ${tool.description}`);
    }
  }

  lines.push('');
  lines.push('## Installed Skills');
  if (caps.skills.length === 0) {
    lines.push('No skills installed.');
  } else {
    for (const skill of caps.skills) {
      lines.push(`- ${skill}`);
    }
  }

  lines.push('');
  lines.push('## Memory');
  lines.push(
    `${caps.memoryStats.frameCount} memories across ${caps.memoryStats.sessionCount} sessions, ${caps.memoryStats.entityCount} knowledge entities.`
  );

  lines.push('');
  lines.push(
    'When asked "what can you do?" or "who are you?" — answer from this section. Do NOT search the web about yourself.'
  );

  return lines.join('\n');
}
