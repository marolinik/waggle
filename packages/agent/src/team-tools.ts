import type { ToolDefinition } from './tools.js';

export interface TeamToolDeps {
  serverUrl: string;
  authToken: string;
  teamSlug: string;
  fetch?: typeof globalThis.fetch;
}

async function apiCall(
  deps: TeamToolDeps,
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const fetchFn = deps.fetch ?? globalThis.fetch;
  const url = `${deps.serverUrl}${path}`;
  const opts: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${deps.authToken}`,
      'Content-Type': 'application/json',
    },
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetchFn(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export function createTeamTools(deps: TeamToolDeps): ToolDefinition[] {
  const base = `/api/teams/${deps.teamSlug}`;

  return [
    {
      name: 'check_hive',
      description: 'Search team knowledge graph for existing knowledge on a topic before starting work',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic to search for in team knowledge' },
        },
        required: ['topic'],
      },
      execute: async (args) => {
        const topic = args.topic as string;
        const results = await apiCall(deps, 'GET', `${base}/knowledge?search=${encodeURIComponent(topic)}`) as unknown[];
        if (!results || results.length === 0) {
          return 'No existing team knowledge found.';
        }
        return JSON.stringify(results, null, 2);
      },
    },

    {
      name: 'share_to_team',
      description: 'Share a discovery or insight to the team knowledge graph',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Content to share with the team' },
          type: { type: 'string', description: 'Type of knowledge (e.g., discovery, insight, pattern)' },
        },
        required: ['content', 'type'],
      },
      execute: async (args) => {
        const content = args.content as string;
        const type = args.type as string;
        const name = content.slice(0, 100);
        await apiCall(deps, 'POST', `${base}/knowledge/entities`, {
          name,
          type,
          properties: { content },
        });
        return `Shared to team: "${name}"`;
      },
    },

    {
      name: 'create_team_task',
      description: 'Create a new task on the team task board',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'Task description' },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Task priority',
          },
        },
        required: ['title'],
      },
      execute: async (args) => {
        const body: Record<string, unknown> = { title: args.title };
        if (args.description) body.description = args.description;
        if (args.priority) body.priority = args.priority;
        const result = await apiCall(deps, 'POST', `${base}/tasks`, body) as Record<string, unknown>;
        return `Created team task: "${args.title}" (id: ${result.id})`;
      },
    },

    {
      name: 'claim_team_task',
      description: 'Pick up an existing task from the team board and mark it as in progress',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'ID of the task to claim' },
        },
        required: ['task_id'],
      },
      execute: async (args) => {
        const taskId = args.task_id as string;
        await apiCall(deps, 'PATCH', `${base}/tasks/${taskId}`, { status: 'in_progress' });
        return `Claimed task ${taskId} — now in progress.`;
      },
    },

    {
      name: 'send_waggle_message',
      description: 'Send a message to the team channel (waggle dance communication)',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Message content' },
          type: {
            type: 'string',
            enum: ['waggle', 'alert', 'status', 'request'],
            description: 'Message type (default: waggle)',
          },
        },
        required: ['message'],
      },
      execute: async (args) => {
        const message = args.message as string;
        const type = (args.type as string) ?? 'waggle';
        await apiCall(deps, 'POST', `${base}/messages`, { content: message, type });
        return `Message sent to team (type: ${type}).`;
      },
    },
  ];
}
