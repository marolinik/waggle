import type { FastifyInstance } from 'fastify';

export interface NotificationEvent {
  type: 'notification';
  title: string;
  body: string;
  category: 'cron' | 'approval' | 'task' | 'message' | 'agent';
  timestamp: string;
  actionUrl?: string;
}

/** Sub-agent status event — relayed from SubagentOrchestrator via eventBus */
export interface SubagentStatusEvent {
  type: 'subagent_status';
  workspaceId: string;
  agents: Array<{
    id: string;
    name: string;
    role: string;
    status: 'pending' | 'running' | 'done' | 'failed';
    task: string;
    toolsUsed: string[];
    startedAt?: number;
    completedAt?: number;
  }>;
  timestamp: string;
}

/** Workflow suggestion event — relayed from workflow capture detection */
export interface WorkflowSuggestionEvent {
  type: 'workflow_suggestion';
  workspaceId: string;
  pattern: {
    name: string;
    description: string;
    steps: string[];
    tools: string[];
    category: string;
  };
  reason: string;
  timestamp: string;
}

export function emitNotification(fastify: FastifyInstance, event: Omit<NotificationEvent, 'type' | 'timestamp'>) {
  const full: NotificationEvent = {
    type: 'notification',
    timestamp: new Date().toISOString(),
    ...event,
  };
  (fastify as any).eventBus?.emit('notification', full);
}

/** Emit a sub-agent status event on the eventBus for SSE relay */
export function emitSubagentStatus(fastify: FastifyInstance, workspaceId: string, agents: SubagentStatusEvent['agents']) {
  const event: SubagentStatusEvent = {
    type: 'subagent_status',
    workspaceId,
    agents,
    timestamp: new Date().toISOString(),
  };
  (fastify as any).eventBus?.emit('subagent_status', event);
}

/** Emit a workflow suggestion event on the eventBus for SSE relay */
export function emitWorkflowSuggestion(
  fastify: FastifyInstance,
  workspaceId: string,
  pattern: WorkflowSuggestionEvent['pattern'],
  reason: string,
) {
  const event: WorkflowSuggestionEvent = {
    type: 'workflow_suggestion',
    workspaceId,
    pattern,
    reason,
    timestamp: new Date().toISOString(),
  };
  (fastify as any).eventBus?.emit('workflow_suggestion', event);
}

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get('/api/notifications/stream', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    reply.raw.write('data: {"type":"connected"}\n\n');

    const notificationHandler = (data: NotificationEvent) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch { /* Client disconnected */ }
    };

    const subagentHandler = (data: SubagentStatusEvent) => {
      try {
        reply.raw.write(`event: subagent_status\ndata: ${JSON.stringify(data)}\n\n`);
      } catch { /* Client disconnected */ }
    };

    const workflowSuggestionHandler = (data: WorkflowSuggestionEvent) => {
      try {
        reply.raw.write(`event: workflow_suggestion\ndata: ${JSON.stringify(data)}\n\n`);
      } catch { /* Client disconnected */ }
    };

    const eventBus = (fastify as any).eventBus;
    if (eventBus) {
      eventBus.on('notification', notificationHandler);
      eventBus.on('subagent_status', subagentHandler);
      eventBus.on('workflow_suggestion', workflowSuggestionHandler);
    }

    const heartbeat = setInterval(() => {
      try { reply.raw.write(': heartbeat\n\n'); }
      catch { clearInterval(heartbeat); }
    }, 30000);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      if (eventBus) {
        eventBus.removeListener('notification', notificationHandler);
        eventBus.removeListener('subagent_status', subagentHandler);
        eventBus.removeListener('workflow_suggestion', workflowSuggestionHandler);
      }
    });
  });
}
